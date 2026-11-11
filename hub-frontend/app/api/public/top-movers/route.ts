import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers={"Cache-Control":"public, s-maxage=60, stale-while-revalidate=60","X-Content-Type-Options":"nosniff"};
export async function GET(){
 const unavailable={state:"unavailable",window:"24h",as_of_utc:new Date().toISOString(),movers:[],note:"Awaiting independently verified public Top Movers feed."};
 const origin=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!origin || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin)){
  return NextResponse.json(unavailable,{headers});
 }
 try {
  const response=await fetch(origin+"/functions/v1/alpha-insights?view=public",{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(3800)});
  if(!response.ok)return NextResponse.json(unavailable,{headers});
  const value=await response.json();
  const list=Array.isArray(value?.movers)?value.movers:[];
  if(value?.state!=="verified" || value?.window!=="24h" || !value?.delivery_independently_verified || !value?.outcomes_verified)
   return NextResponse.json(unavailable,{headers});
  const movers=list.filter((item:unknown)=>{
    if(!item||typeof item!=="object")return false;
    const m=item as Record<string,unknown>;
    return typeof m.id==="string"&&typeof m.symbol==="string"&&typeof m.lane==="string"&&
     typeof m.multiple==="number"&&Number.isFinite(m.multiple)&&m.multiple>=1&&
     typeof m.first_mc==="number"&&m.first_mc>0&&typeof m.peak_mc==="number"&&m.peak_mc>=m.first_mc;
  }).slice(0,3);
  return NextResponse.json({state:movers.length?"verified":"empty",window:"24h",as_of_utc:value.as_of_utc??null,movers},{headers});
 }catch{return NextResponse.json(unavailable,{headers})}
}
