"use client";
import {useEffect,useState} from "react";
import {useSupabase} from "@/components/SupabaseProvider";
type EventRow={event_id:string;event_at:string;symbol:string;mint:string;lane:string;alert_mc:number|null;proof_kind:string;public_delivery_verified:boolean};
type Page={state:string;total?:number;offset?:number;limit?:number;events?:EventRow[];delay_hours?:number};
const PAGE_SIZE=50;
const money=(n:number|null)=>n!=null&&Number(n)>0?"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:0}):"—";
export default function HistoryEventsPanel(){
 const {session}=useSupabase();
 const [offset,setOffset]=useState(0);
 const [page,setPage]=useState<Page>({state:"loading"});
 useEffect(()=>{
  if(!session?.access_token){setPage({state:"unauthorized"});return;}
  const controller=new AbortController();
  setPage({state:"loading"});
  fetch("/api/intelligence/history?offset="+offset+"&limit="+PAGE_SIZE,{
   headers:{Authorization:"Bearer "+session.access_token},cache:"no-store",signal:controller.signal
  }).then(async r=>r.ok?await r.json():{state:"unavailable"})
   .then(data=>{if(!controller.signal.aborted)setPage(data)})
   .catch(()=>{if(!controller.signal.aborted)setPage({state:"unavailable"})});
  return()=>controller.abort();
 },[session?.access_token,offset]);
 const ready=page.state==="ready"&&Array.isArray(page.events)&&Number.isSafeInteger(page.total);
 const total=ready?page.total??0:0, rows=ready?page.events??[]:[];
 return <section className="mx-auto max-w-6xl px-3 py-7 text-[#eff0f2] sm:px-5" aria-label="Historical alert events">
  <div className="rounded-2xl border border-[#3f4044] bg-[#15171c] p-5 sm:p-7">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><p className="text-[10px] font-bold tracking-[.2em] text-[#d8b778]">ALPHA / EVENT HISTORY</p>
     <h2 className="mt-2 text-xl font-semibold">Recorded alert history</h2></div>
    <p className="text-sm tabular-nums text-[#d8bb85]">{ready?total.toLocaleString("en-US")+" events":"Secure history"}</p>
   </div>
   <p className="mt-3 text-xs leading-6 text-[#abb0ba]">Approved post-send scanner correlations, not independently confirmed public Telegram delivery. Subscriber rows are delayed by at least 24 hours. These records are not proof of trading profits.</p>
   {!ready?<p role="status" className="py-9 text-sm text-[#bbc0c9]">{page.state==="loading"?"Loading private history…":"Historical events are temporarily unavailable."}</p>:
   <>
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs">
     <thead><tr className="border-b border-[#45464b] text-[#aeb3bc]"><th className="py-3 pr-3">Time (UTC)</th><th className="pr-3">Lane</th><th className="pr-3">Symbol</th><th className="pr-3">Market cap</th><th>Proof</th></tr></thead>
     <tbody>{rows.map(e=><tr key={e.event_id} className="border-b border-[#2d3036] text-[#dce0e7]">
      <td className="py-3 pr-3 tabular-nums">{new Date(e.event_at).toISOString().slice(0,16).replace("T"," ")}</td>
      <td className="pr-3 text-[#d8b778]">{e.lane}</td><td className="pr-3">{e.symbol}</td><td className="pr-3 tabular-nums">{money(e.alert_mc)}</td>
      <td className="text-[#aeb7c3]">{e.public_delivery_verified?"Verified delivery":"Post-send correlation"}</td>
     </tr>)}</tbody></table></div>
    <div className="mt-5 flex items-center justify-between gap-3">
     <span className="text-xs tabular-nums text-[#aeb3bc]">{total?offset+1:0}–{Math.min(total,offset+rows.length)} of {total.toLocaleString("en-US")}</span>
     <div className="flex gap-2">
      <button type="button" disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-PAGE_SIZE))}
       className="rounded-lg border border-[#514a3c] px-4 py-2 text-xs disabled:opacity-35">Previous</button>
      <button type="button" disabled={offset+rows.length>=total} onClick={()=>setOffset(offset+PAGE_SIZE)}
       className="rounded-lg border border-[#514a3c] px-4 py-2 text-xs disabled:opacity-35">Next</button>
     </div>
    </div>
   </>}
  </div>
 </section>;
}
