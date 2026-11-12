"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";
import HistoryDashboardHome from "@/components/HistoryDashboardHome";

type Row = { event_id:string;event_at:string;symbol:string;mint:string;lane:string;
 alert_mc:number|null;liquidity_usd:number|null;m5_tx:number|null;
 outcome_status:string;observed_max_multiple:number|null };
type Result = { rows:Row[];total:number;page:number;limit:number };
const lanes=["ALL","EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"];
const fmt=(n:number|null)=>n===null?"—":Number(n).toLocaleString("en-US",{maximumFractionDigits:2});

export default function HistoryPage() {
 const {session,loading:authLoading}=useSupabase();
 const [period,setPeriod]=useState<"all"|"24h">("all");
 const [lane,setLane]=useState("ALL");
 const [page,setPage]=useState(0);
 const [result,setResult]=useState<Result|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
   if (!session?.access_token) {setResult(null);return;}
   const abort=new AbortController();
   let active=true;
   setBusy(true);
   const args=new URLSearchParams({view:"table",period,page:String(page),limit:"50"});
   if(lane!=="ALL")args.set("lane",lane);
   fetch("/api/history?"+args.toString(),{headers:{Authorization:"Bearer "+session.access_token},
     cache:"no-store",signal:abort.signal})
     .then(async r=>{if(!r.ok)throw new Error("query failed");return await r.json() as Result;})
     .then(r=>{if(active){setResult(r);setBusy(false);setError("");}})
     .catch(()=>{if(active){setBusy(false);setError("Could not retrieve history.");}});
   return ()=>{active=false;abort.abort();};
 },[session?.access_token,period,lane,page]);
 if(authLoading)return <p className="text-muted">Checking session…</p>;
 if(!session)return <p className="text-muted">Sign in to view history. <Link href="/login" className="text-gold">Log in</Link></p>;
 return <div className="space-y-7">
   <header className="space-y-2">
     <Link href="/dashboard" className="text-xs uppercase tracking-widest text-gold">← Dashboard</Link>
     <h1 className="font-display text-3xl text-silver">ALERT HISTORY</h1>
     <p className="text-sm text-muted">Approved correlated alerts, without invented trade outcomes.</p>
   </header>
   <HistoryDashboardHome/>
   <section className="space-y-4 rounded-2xl border border-white/10 bg-surface/60 p-4 md:p-6">
     <div className="flex flex-wrap items-end justify-between gap-4">
       <div><label htmlFor="history-lane" className="mb-2 block text-[10px] uppercase tracking-widest text-muted">Lane</label>
         <select id="history-lane" value={lane} onChange={e=>{setLane(e.target.value);setPage(0);}}
          className="rounded-lg border border-white/15 bg-bg px-3 py-2 text-xs text-silver">
          {lanes.map(x=><option key={x} value={x}>{x}</option>)}
         </select></div>
       <div className="flex gap-2">{(["all","24h"] as const).map(v=>
         <button key={v} onClick={()=>{setPeriod(v);setPage(0);}}
          className={"rounded-lg border px-3 py-2 text-xs uppercase tracking-wide "+(period===v?"border-gold/60 bg-gold/10 text-gold":"border-white/15 text-muted")}>
            {v==="all"?"All time":"Last 24h"}
         </button>)}</div>
     </div>
     <div className="flex justify-between gap-3 text-xs text-muted"><span>{result?fmt(result.total)+" results":"—"}</span><span>Page {page+1} of {Math.max(1,Math.ceil((result?.total||0)/50))}</span></div>
     {error&&<p role="alert" className="text-amber-300">{error}</p>}
     <div className="overflow-x-auto rounded-xl border border-white/10">
       <table className="w-full min-w-[780px] text-left text-xs">
         <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-muted">
          <tr><th className="p-3">UTC</th><th className="p-3">Token</th><th className="p-3">Lane</th><th className="p-3">MC</th><th className="p-3">Liquidity</th><th className="p-3">M5 tx</th><th className="p-3">Outcome</th></tr>
         </thead>
         <tbody>{!busy&&result?.rows.map(r=><tr key={r.event_id} className="border-t border-white/[0.07] text-silver/90">
           <td className="whitespace-nowrap p-3 text-muted">{new Date(r.event_at).toLocaleString("en-CA",{timeZone:"UTC",hour12:false})}</td>
           <td className="p-3 font-semibold">{r.symbol}<div title={r.mint} className="font-normal text-[10px] text-muted">{r.mint.slice(0,6)}…{r.mint.slice(-4)}</div></td>
           <td className="p-3 text-gold/80">{r.lane}</td><td className="p-3">{fmt(r.alert_mc)}</td>
           <td className="p-3">{fmt(r.liquidity_usd)}</td><td className="p-3">{fmt(r.m5_tx)}</td>
           <td className="p-3 text-muted">{r.outcome_status==="UNAVAILABLE"?"Not observed":r.outcome_status}</td>
         </tr>)}</tbody>
       </table>
       {busy&&<p className="p-6 text-sm text-muted">Loading history…</p>}
       {!busy&&result?.rows.length===0&&<p className="p-6 text-sm text-muted">No alerts match these filters.</p>}
     </div>
     <div className="flex justify-end gap-3">
       <button disabled={busy||page===0} onClick={()=>setPage(v=>Math.max(0,v-1))} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-silver disabled:opacity-30">Previous</button>
       <button disabled={busy||!result||(page+1)*50>=result.total} onClick={()=>setPage(v=>v+1)} className="rounded-lg border border-gold/40 px-4 py-2 text-xs text-gold disabled:opacity-30">Next</button>
     </div>
   </section>
 </div>;
}
