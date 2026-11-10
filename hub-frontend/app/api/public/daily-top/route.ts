import { NextResponse } from "next/server";
import { createPublicKey, verify as verifyEd25519 } from "node:crypto";
import signedArchive from "./archive-20261107.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANES = new Set(["EARLY", "GENESIS", "TREND", "STRICT", "RECLAIM", "RUNNER"]);
const ALIASES: Record<string,string> = {EARLY_RADAR:"EARLY", GENESIS_SMOOTH_RAMP:"GENESIS", R8_RECLAIM:"RECLAIM"};
const MIN_DELAY_MS = 30 * 60_000;
const MAX_FEED_AGE_MS = 20 * 60_000;
const MAX_PUBLIC_HISTORY_MS = 7 * 24 * 3600_000;
const MAX_SIGNED_ARCHIVE_AGE_MS = 5 * 365 * 24 * 3600_000;
const PRIMARY_WINDOW_MS = 24 * 3600_000;
const MAX_FEED_BYTES = 128 * 1024;

type PublicRow = {
  id: string;
  symbol: string;
  lane: string;
  score: number;
  timestamp_utc: string;
  alert_mc: number | null;
  liquidity_usd: number | null;
  m5_tx: number | null;
  observed_peak_pct: number | null;
};

function money(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 1e13 ? Math.round(n * 100) / 100 : null;
}
function validRow(value: unknown, now: Date, maxHistoricalAgeMs = MAX_PUBLIC_HISTORY_MS): PublicRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  // A public record must be explicitly approved AND tied to a successful Telegram send.
  if (row.approved_for_public !== true || row.delivery_status !== "DELIVERED") return null;
  const sourceLane = String(row.lane ?? "").toUpperCase();
  const lane = ALIASES[sourceLane] || sourceLane;
  const id = String(row.event_id ?? "").slice(0, 96);
  const symbol = String(row.symbol ?? "").replace(/^\$/, "");
  const score = Number(row.score);
  const rawTime = String(row.timestamp_utc ?? "");
  const timestamp = new Date(rawTime);
  if (!LANES.has(lane) || !/^[A-Za-z0-9._-]{1,28}$/.test(symbol) || !/^[A-Za-z0-9:_-]{8,96}$/.test(id)) return null;
  if (!Number.isFinite(score) || score < 0 || score > 10 || !/Z$/.test(rawTime) || !Number.isFinite(timestamp.getTime())) return null;
  if (timestamp.getTime() > now.getTime() - MIN_DELAY_MS) return null;
  if (timestamp.getTime() < now.getTime() - maxHistoricalAgeMs) return null;
  const rawTx = row.m5_tx;
  const tx = rawTx == null || rawTx === "" ? null : Number(rawTx);
  const rawPeak = row.observed_peak_pct;
  const peak = typeof rawPeak === "number" && Number.isFinite(rawPeak) &&
    rawPeak >= -100 && rawPeak <= 100000 ? Math.round(rawPeak * 10) / 10 : null;
  return {
    id, symbol, lane, score:Math.round(score * 100) / 100,
    timestamp_utc:timestamp.toISOString(), alert_mc:money(row.alert_mc),
    liquidity_usd:money(row.liquidity_usd),
    m5_tx:tx !== null && Number.isSafeInteger(tx) && tx >= 0 && tx <= 1e9 ? tx : null,
    observed_peak_pct:peak,
  };
}

async function limitedBody(response: Response): Promise<string> {
  if (!response.body) throw new Error("empty public feed");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total=0, text="";
  try {
    for (;;) {
      const {done,value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_FEED_BYTES) throw new Error("oversized public feed");
      text += decoder.decode(value,{stream:true});
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
}

// Preview-only bridge: last intentionally public-approved signed snapshot.
 // This is historical publication evidence, not proof each token was delivered.
 // Never use archived rows as "verified" or weaken the live feed's 20m freshness.
function historicalPreview(now: Date) {
  if (process.env.VERCEL_ENV !== "preview") return null;
  try {
    const publicKeyHex = signedArchive.public_key_hex;
    if (!/^[a-f0-9]{64}$/.test(publicKeyHex) ||
        !/^[a-f0-9]{128}$/.test(signedArchive.signature)) return null;
    const key = createPublicKey({
      key:Buffer.concat([Buffer.from("302a300506032b6570032100","hex"),Buffer.from(publicKeyHex,"hex")]),
      format:"der",type:"spki"
    });
    if (!verifyEd25519(null,Buffer.from(signedArchive.signed_body,"utf8"),
          key,Buffer.from(signedArchive.signature,"hex"))) return null;
    const parsed = JSON.parse(signedArchive.signed_body) as Record<string,unknown>;
    const captured = new Date(String(parsed.updated_at_utc ?? ""));
    if (parsed.version !== 1 || parsed.source !== "confirmed-telegram-delivery" ||
        !Number.isFinite(captured.getTime()) ||
        captured.getTime() > now.getTime() ||
        now.getTime() - captured.getTime() > MAX_SIGNED_ARCHIVE_AGE_MS ||
        !Array.isArray(parsed.daily_alerts) || parsed.daily_alerts.length !== 6) return null;
    const values = parsed.daily_alerts.map(x=>validRow(x,now,MAX_SIGNED_ARCHIVE_AGE_MS));
    if (values.some(x=>x===null)) return null;
    const ordered = (values as PublicRow[]).sort((a,b)=>b.timestamp_utc.localeCompare(a.timestamp_utc));
    // Archive windows are anchored to the LAST RECORDED EVENT, never to today's clock.
    // They describe historical activity, not performance or a current-hour leader.
    const anchorMs = Date.parse(ordered[0].timestamp_utc);
    const last24 = ordered.filter(row => Date.parse(row.timestamp_utc) >= anchorMs-PRIMARY_WINDOW_MS);
    const alerts = (last24.length >= 3 ? last24 : ordered).slice(0,3);
    const hourAlert = ordered.find(row => Date.parse(row.timestamp_utc) >= anchorMs-60*60_000) ?? null;
    return {state:"archived" as const,period:null,
      as_of_utc:captured.toISOString(),reference_time_utc:ordered[0].timestamp_utc,
      public_delay_minutes:30, alerts, hour_alert:hourAlert,
      delivery_independently_verified:false};
  } catch { return null; }
}

export async function GET() {
  const now = new Date();
  const unavailable = (state: "unavailable"|"empty") => {
    const historical = historicalPreview(now);
    if (historical) return NextResponse.json(historical,{headers:{"Cache-Control":"no-store"}});
    return NextResponse.json(
      {state, period:null, as_of_utc:now.toISOString(),reference_time_utc:now.toISOString(),
       public_delay_minutes:30, alerts:[],hour_alert:null},
      {headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=60"}}
    );
  };
  const upstream = process.env.ALPHA_PUBLIC_DAILY_FEED_URL;
  const publicKey = process.env.ALPHA_PUBLIC_DAILY_FEED_PUBLIC_KEY ?? "";
  if (!upstream || !/^[a-f0-9]{64}$/.test(publicKey)) return unavailable("unavailable");
  try {
    const url = new URL(upstream);
    // Server-only, operator configured and HTTPS. Never accept a user-supplied URL.
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash ||
        /^\d+(\.\d+){3}$/.test(url.hostname) || url.hostname === "localhost" ||
        url.hostname.endsWith(".local") || url.hostname.endsWith(".internal")) return unavailable("unavailable");
    const response = await fetch(url, {signal:AbortSignal.timeout(3500),next:{revalidate:60},redirect:"error"});
    if (!response.ok) return unavailable("unavailable");
    const envelope = JSON.parse(await limitedBody(response)) as Record<string,unknown>;
    const signedBody = envelope.signed_body;
    const signature = envelope.signature;
    if (typeof signedBody !== "string" || signedBody.length > MAX_FEED_BYTES ||
        typeof signature !== "string" || !/^[a-f0-9]{128}$/.test(signature)) return unavailable("unavailable");
    const publicKeyObject = createPublicKey({
      key:Buffer.concat([Buffer.from("302a300506032b6570032100","hex"),Buffer.from(publicKey,"hex")]),
      format:"der",type:"spki"
    });
    if (!verifyEd25519(null,Buffer.from(signedBody,"utf8"),publicKeyObject,Buffer.from(signature,"hex"))) return unavailable("unavailable");
    const input = JSON.parse(signedBody) as Record<string,unknown>;
    const updatedAt = new Date(String(input.updated_at_utc ?? ""));
    if (input.version !== 1 || input.source !== "confirmed-telegram-delivery" ||
        !Number.isFinite(updatedAt.getTime()) ||
        updatedAt.getTime() > now.getTime() + 60_000 ||
        now.getTime()-updatedAt.getTime()>MAX_FEED_AGE_MS ||
        !Array.isArray(input.daily_alerts)) return unavailable("unavailable");
    const dedup = new Map<string,PublicRow>();
    for (const item of input.daily_alerts.slice(0,500)) {
      const row=validRow(item, now);
      if (row) dedup.set(row.id,row);
    }
    // Prefer actual verified deliveries from the rolling last 24 hours, then
    // fall back to the previous seven days. Never use private/outcome-only records.
    const all = [...dedup.values()];
    const recent = all.filter(row => now.getTime()-Date.parse(row.timestamp_utc) <= PRIMARY_WINDOW_MS);
    const period: "24h" | "7d" = recent.length ? "24h" : "7d";
    const alerts = (recent.length ? recent : all)
      .sort((a,b) => b.timestamp_utc.localeCompare(a.timestamp_utc))
      .slice(0,3);
    // A live 1-hour spotlight can only use a signed, delayed event from that hour.
    // Never substitute an old event and call it current.
    const hourAlert = all.filter(row =>
      now.getTime()-Date.parse(row.timestamp_utc) <= 60*60_000
    ).sort((a,b) => b.timestamp_utc.localeCompare(a.timestamp_utc))[0] ?? null;
    return NextResponse.json({state:alerts.length?"verified":"empty",period,
      as_of_utc:updatedAt.toISOString(),reference_time_utc:now.toISOString(),
      public_delay_minutes:30,alerts,hour_alert:hourAlert},
      {headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=60"}});
  } catch {
    return unavailable("unavailable");
  }
}
