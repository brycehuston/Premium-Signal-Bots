"use client";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useState} from "react";
import {useSupabase} from "@/components/SupabaseProvider";
type Day={date:string;alerts:number;first_mints:number};
type Lane={lane:string;count:number};
type Report={state:string;tier?:string;delay_hours?:number;as_of_utc?:string;summary?:{events_7d:number;first_mints_7d:number;active_days:number};daily?:Day[];lanes?:Lane[]};
const colors:Record<string,string>={EARLY:"#b9da8c",GENESIS:"#b5a1ed",RECLAIM:"#66c8e1",TREND:"#bfcbd7",STRICT:"#db8c8c",RUNNER:"#e0c17b"};
export default function SubscriberDashboard(){
 const {session}=useSupabase();const [data,setData]=useState<Report>({state:"loading"});
 useEffect(()=>{
  if(!session?.access_token){setData({state:"unauthorized"});return}
  let mounted=true;const c=new AbortController();
  fetch("/api/intelligence/data",{headers:{Authorization:"Bearer "+session.access_token},signal:c.signal,cache:"no-store"})
   .then(async r=>r.ok?await r.json():{state:"unavailable"})
   .then(x=>{if(mounted)setData(x)})
   .catch(()=>{if(mounted&&!c.signal.aborted)setData({state:"unavailable"})});
  return()=>{mounted=false;c.abort()};
 },[session?.access_token]);
 const ready=data.state==="ready"&&data.tier==="subscriber"&&data.delay_hours!==undefined&&data.delay_hours>=24;
 const max=Math.max(1,...(data.daily??[]).map(x=>x.alerts));
 return <main className="mx-auto max-w-6xl space-y-6 px-3 py-5 text-[#f2f3f5] sm:px-5">
  <header className="rounded-2xl border border-[#47413a] bg-[radial-gradient(ellipse_at_top_left,#27241e_0%,#15171d_62%)] p-6 sm:p-9">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <Link href="/" aria-label="Alpha Alerts homepage" className="inline-flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e7bc67]">
     <Image src="/alpha-lane-v4-logo.png" alt="" width={38} height={40} className="h-[39px] w-[38px] shrink-0 object-contain" unoptimized priority />
     <span className="font-display whitespace-nowrap text-[15px] font-bold tracking-[.15em] text-[#e1e3e6] sm:text-[17px]">ALPHA <span className="text-[#e7bc67]">ALERTS</span></span>
    </Link>
    <span className="rounded-full border border-[#89704c]/65 px-3 py-1.5 text-[10px] font-bold text-[#ecc990]">HISTORICAL · 24H+ DELAY</span>
   </div>
   <p className="mt-4 text-[10px] font-semibold tracking-[.20em] text-[#b8b9bf]">MEMBER INTELLIGENCE</p>
   <h1 className="mt-5 font-display text-[clamp(1.8rem,4vw,3.3rem)] font-semibold tracking-[-.035em]">Your edge. <span className="text-[#dfb978]">In perspective.</span></h1>
   <p className="mt-3 max-w-2xl text-[13px] leading-7 text-[#bcc0c7]">A historical view of Alpha lane activity and market research. Near-live scanning, detailed token research and owner diagnostics are not included in this membership dashboard.</p>
  </header>
  {!ready?<section role="status" className="rounded-2xl border border-[#454047] bg-[#16171c] p-6 sm:p-8"><p className="text-[10px] font-bold tracking-[.2em] text-[#dbb573]">HISTORICAL RESEARCH</p><h2 className="mt-3 font-display text-xl font-semibold">{data.state==="loading"?"Connecting to your membership…":"Historical snapshots are being prepared"}</h2><p className="mt-3 text-[13px] leading-7 text-[#b9bdc6]">Your membership has a reserved historical dashboard. No fabricated numbers are displayed while verified aggregate snapshots are unavailable.</p><Link href="/pricing" className="mt-5 inline-flex text-sm text-[#e0bb81] underline underline-offset-4">View membership</Link></section>:
   <>
    <div className="grid gap-3 sm:grid-cols-3">
     {[
      ["RECORDED EVENTS",data.summary?.events_7d??0,"Historical seven-day window"],
      ["FIRST MINTS",data.summary?.first_mints_7d??0,"First observed in that window"],
      ["OBSERVED DAYS",data.summary?.active_days??0,"Days with recorded activity"]
     ].map(([label,value,note])=><div key={String(label)} className="rounded-xl border border-[#3c4047] bg-[#191b21] p-5 sm:p-6"><p className="text-[10px] font-bold tracking-[.15em] text-[#afb5bf]">{label}</p><strong className="mt-3 block font-display text-[35px] font-semibold tabular-nums text-[#eac58c]">{Number(value).toLocaleString("en-US")}</strong><p className="mt-2 text-xs text-[#979fa9]">{note}</p></div>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
     <section className="rounded-2xl border border-[#3b3f45] bg-[#15171c] p-5 sm:p-7"><h2 className="font-display text-lg font-semibold">Historical activity</h2><p className="mt-1 text-xs text-[#a0a7b1]">Daily observations · 24-hour reporting delay</p><div className="mt-7 flex h-[170px] items-end gap-2">{(data.daily??[]).map(day=><div key={day.date} className="group flex h-full flex-1 flex-col justify-end gap-2" title={day.date+" · "+day.alerts+" recorded events"}><div className="min-h-[2px] rounded-t-sm bg-[#d7b06b]/85" style={{height:Math.max(2,day.alerts/max*100)+"%"}}/><span className="truncate text-center text-[9px] text-[#9da5b1]">{day.date.slice(5)}</span></div>)}</div></section>
     <section className="rounded-2xl border border-[#3b3f45] bg-[#15171c] p-5 sm:p-7"><h2 className="font-display text-lg font-semibold">Lane distribution</h2><p className="mt-1 text-xs text-[#a0a7b1]">Recorded events, not realized returns</p><div className="mt-5 space-y-3">{(data.lanes??[]).sort((a,b)=>b.count-a.count).map(lane=><div key={lane.lane}><div className="mb-1 flex items-center justify-between text-[11px]"><span style={{color:colors[lane.lane]??"#dadde3"}}>{lane.lane}</span><strong className="text-[#dce1e6]">{lane.count.toLocaleString("en-US")}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-[#30363d]"><div className="h-full rounded-full" style={{width:(lane.count/Math.max(1,...(data.lanes??[]).map(x=>x.count))*100)+"%",background:colors[lane.lane]??"#d1bb90"}}/></div></div>)}</div></section>
    </div>
    <p className="text-[11px] leading-6 text-[#9ea5ae]">Updated: {data.as_of_utc?new Date(data.as_of_utc).toLocaleString("en-CA",{timeZone:"America/Vancouver",year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZoneName:"short"}):"not available"}. Historical activity statistics do not establish trading profits or guarantee future performance.</p>
   </>}
 </main>;
}
