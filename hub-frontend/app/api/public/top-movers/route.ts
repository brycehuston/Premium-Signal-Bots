import { NextResponse } from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"public, s-maxage=60, stale-while-revalidate=60","X-Content-Type-Options":"nosniff"};
const LANES=new Set(["EARLY","GENESIS","RECLAIM","TREND","STRICT","RUNNER"]);
const MAX_HISTORY_AGE_MS=90*24*60*60*1000;
type Mover={id:string;symbol:string;lane:string;first_mc:number;peak_mc:number;multiple:number;called_at_utc:string};
function parseMover(raw:unknown,now:number):Mover|null{
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
  const m=raw as Record<string,unknown>;
  const called=typeof m.called_at_utc==="string"?m.called_at_utc:
    typeof m.timestamp_utc==="string"?m.timestamp_utc:"";
  const timestamp=Date.parse(called);
  if(typeof m.id!=="string"||!/^[-_a-zA-Z0-9:]{8,96}$/.test(m.id)||
     typeof m.symbol!=="string"||!/^[A-Za-z0-9._-]{1,28}$/.test(m.symbol)||
     typeof m.lane!=="string"||!LANES.has(m.lane)||
     !Number.isFinite(timestamp)||timestamp>now||now-timestamp>MAX_HISTORY_AGE_MS)return null;
  const first=Number(m.first_mc),peak=Number(m.peak_mc),multiple=Number(m.multiple);
  if(![first,peak,multiple].every(Number.isFinite)||first<=0||peak<first||
    peak>=1e13||multiple<1||multiple>1e6||Math.abs(multiple-peak/first)>Math.max(.015,multiple*.005))return null;
  return {id:m.id,symbol:m.symbol,lane:m.lane,first_mc:first,peak_mc:peak,
    multiple,called_at_utc:new Date(timestamp).toISOString()};
}
export async function GET(){
  const now=Date.now();
  const unavailable={state:"unavailable",window:"24h",as_of_utc:new Date(now).toISOString(),
    movers:[],note:"Awaiting corroborated bot-delivered call and observed peak records."};
  const origin=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(!origin||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin))
    return NextResponse.json(unavailable,{headers});
  try{
    const response=await fetch(origin+"/functions/v1/alpha-insights?view=public",{
      cache:"no-store",redirect:"error",signal:AbortSignal.timeout(3800)
    });
    if(!response.ok)return NextResponse.json(unavailable,{headers});
    const value=await response.json();
    // A historical result must be a verified, dated prior ranking, never silently labelled "24H".
    const historical=value?.window==="historical"&&value?.state==="verified";
    const current=value?.window==="24h"&&value?.state==="verified";
    if((!historical&&!current)||value.telegram_delivery_confirmed!==true||value.observed_peaks_corroborated!==true)
      return NextResponse.json(unavailable,{headers});
    const reference=Date.parse(String(value.reference_time_utc??value.as_of_utc??""));
    if(!Number.isFinite(reference)||reference>now||now-reference>MAX_HISTORY_AGE_MS||
      (current&&now-reference>24*60*60*1000))return NextResponse.json(unavailable,{headers});
    const list=Array.isArray(value.movers)?value.movers:[];
    const distinct=new Set<string>();
    const movers=list.map((item:unknown)=>parseMover(item,now)).filter((item:Mover|null):item is Mover=>!!item)
      .filter((item:Mover)=>current?now-Date.parse(item.called_at_utc)<=24*60*60*1000:
        Date.parse(item.called_at_utc)<=reference)
      .sort((a:Mover,b:Mover)=>b.multiple-a.multiple||b.peak_mc-a.peak_mc)
      .filter((item:Mover)=>{const tokenKey=item.id;if(distinct.has(tokenKey))return false;distinct.add(tokenKey);return true})
      .slice(0,3);
    if(!movers.length)return NextResponse.json({...unavailable,state:"empty"}, {headers});
    return NextResponse.json({state:historical?"historical":"verified",
      window:historical?"historical":"24h",
      as_of_utc:value.as_of_utc??null,
      reference_time_utc:new Date(reference).toISOString(),movers},{headers});
  }catch{return NextResponse.json(unavailable,{headers})}
}
