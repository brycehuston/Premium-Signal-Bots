import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const RANGES = { "24h": 24*3600_000, "7d": 7*24*3600_000, "30d": 30*24*3600_000, all: null } as const;
type HistoryRange = keyof typeof RANGES;
type StoredEvent = {
  event_id: string; event_at: string; symbol: string; lane: string; mint: string;
  alert_mc: number|null; liquidity_usd: number|null; m5_tx: number|null;
  outcome_status: string; observed_max_multiple: number|null;
};
function reply(payload: object, status=200) {
  return NextResponse.json(payload,{status,headers:NO_STORE});
}
function configuration() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  // Explicit server-only key; never use NEXT_PUBLIC or return it in responses.
  const service=process.env.ALPHA_HISTORY_SERVICE_ROLE_KEY ?? "";
  const backend=process.env.ALPHA_HISTORY_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url) || !publishable || !service || !backend) return null;
  try {
    const api=new URL(backend);
    if (api.protocol!=="https:" || api.username || api.password || api.search || api.hash || api.port) return null;
  } catch { return null; }
  return {url,publishable,service,backend:backend.replace(/\/$/,"")};
}
function isEntitled(profile:unknown):boolean {
  if (!profile || typeof profile!=="object") return false;
  const me=profile as {role?:unknown;plan?:unknown;is_active?:unknown};
  if (me.is_active!==true) return false;
  if (me.role==="admin") return true;
  if (typeof me.plan!=="string") return false;
  return !["","free","none","inactive","trial"].includes(me.plan.trim().toLowerCase());
}
export async function GET(request:NextRequest) {
  const config=configuration();
  if (!config) return reply({state:"unavailable",reason:"history_not_configured"},503);
  const bearer=request.headers.get("authorization") ?? "";
  const token=/^Bearer ([A-Za-z0-9._~+/=-]{24,8192})$/.exec(bearer)?.[1];
  if (!token) return reply({state:"unauthorized"},401);
  const rangeParam=request.nextUrl.searchParams.get("range") ?? "30d";
  if (!Object.prototype.hasOwnProperty.call(RANGES,rangeParam)) return reply({state:"invalid_range"},400);
  const range=rangeParam as HistoryRange;
  // Supabase validates signature, expiry and subject against Auth, not metadata.
  const auth=createClient(config.url,config.publishable, {auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await auth.auth.getUser(token);
  if (error || !data.user) return reply({state:"unauthorized"},401);
  try {
    // Server-trusted subscriber entitlements: never trust user_metadata or a client plan flag.
    const verify=await fetch(config.backend+"/me",{
      headers:{Authorization:"Bearer "+token,Accept:"application/json"},
      cache:"no-store",signal:AbortSignal.timeout(5500),redirect:"error",
    });
    if (verify.status===401) return reply({state:"unauthorized"},401);
    if (verify.status===403) return reply({state:"forbidden"},403);
    if (!verify.ok) return reply({state:"unavailable",reason:"account_service_unavailable"},503);
    const profile=await verify.json();
    if (!isEntitled(profile)) return reply({state:"forbidden"},403);

    const url=new URL(config.url+"/rest/v1/alpha_history_events");
    url.searchParams.set("select","event_id,event_at,symbol,lane,mint,alert_mc,liquidity_usd,m5_tx,outcome_status,observed_max_multiple");
    url.searchParams.set("approved_for_history","eq.true");
    if (RANGES[range]!==null) url.searchParams.set("event_at","gte."+new Date(Date.now()-RANGES[range]!).toISOString());
    url.searchParams.set("order","event_at.desc,event_id.desc");
    url.searchParams.set("limit","5001");
    const dbResponse=await fetch(url,{headers:{apikey:config.service,Authorization:"Bearer "+config.service},cache:"no-store",signal:AbortSignal.timeout(7500),redirect:"error"});
    if (!dbResponse.ok) return reply({state:"unavailable",reason:"history_store_unavailable"},503);
    const rows:unknown=await dbResponse.json();
    if (!Array.isArray(rows)) return reply({state:"unavailable",reason:"history_store_invalid"},503);
    const truncated=rows.length>5000;
    const data=rows.slice(0,5000) as StoredEvent[];
    const laneCounts:Record<string,number>={};
    const distinct=new Set<string>();
    const dayCounts:Record<string,number>={};
    let peaks=0;
    for (const row of data) {
      laneCounts[row.lane]=(laneCounts[row.lane]??0)+1;
      distinct.add(row.mint);
      const day=row.event_at.slice(0,10);
      dayCounts[day]=(dayCounts[day]??0)+1;
      if (row.outcome_status==="OBSERVED_PEAK" && row.observed_max_multiple!==null) peaks++;
    }
    return reply({
      state:data.length?"ready":"empty",range,
      // Counts are partial whenever the bounded query cap is reached.
      truncated,summary:{alerts:data.length,distinct_mints:distinct.size,by_lane:laneCounts,
        observed_peak_count:peaks,days:dayCounts},
      as_of_utc:new Date().toISOString(),
      events:data.slice(0,120).map(({mint: _mint,...event})=>event),
      note:"Observed peaks are not realized trade returns. No modeled exits are shown.",
    });
  } catch {
    return reply({state:"unavailable",reason:"history_service_unavailable"},503);
  }
}