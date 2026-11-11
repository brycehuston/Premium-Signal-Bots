"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

type Range="24h"|"7d"|"30d"|"all";
type Event={event_id:string;event_at:string;symbol:string;lane:string;alert_mc:number|null;liquidity_usd:number|null;outcome_status:string;observed_max_multiple:number|null};
type History={state:string;range?:Range;truncated?:boolean;as_of_utc?:string;summary?:{alerts:number;distinct_mints:number;by_lane:Record<string,number>;observed_peak_count:number};events?:Event[]};
const RANGES:Range[]=["24h","7d","30d","all"];
const fmt=(value:number|null)=>value===null?"—":"$"+value.toLocaleString("en-US",{maximumFractionDigits:0});
const at=(stamp:string)=>new Date(stamp).toLocaleString("en-CA",{timeZone:"America/Vancouver",month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false,timeZoneName:"short"});

export default function ServerHistoryPage(){
  const {session,loading:authLoading}=useSupabase();
  const [range,setRange]=useState<Range>("30d");
  const [report,setReport]=useState<History|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const token=session?.access_token;
    if (!token) {setReport(null);setLoading(false);return;}
    const controller=new AbortController();
    setLoading(true);
    fetch("/api/history?range="+encodeURIComponent(range),{headers:{Authorization:"Bearer "+token},cache:"no-store",signal:controller.signal})
      .then(async response=>({status:response.status,data:await response.json()}))
      .then(({status,data})=>{if(!controller.signal.aborted)setReport(status===200?data:{state:data.state||"unavailable"})})
      .catch(()=>{if(!controller.signal.aborted)setReport({state:"unavailable"})})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return ()=>controller.abort();
  },[session?.access_token,range]);
  return <main className="mx-auto min-h-screen max-w-6xl px-5 py-12 text-[#eaeaec]">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#28292e] pb-6">
      <div><div className="text-[10px] font-bold tracking-[.22em] text-[#d9b267]">ALPHA ALERTS / RESEARCH INTELLIGENCE</div><h1 className="mt-3 text-3xl font-bold tracking-tight">HISTORICAL ALERT INTELLIGENCE</h1><p className="mt-2 text-sm text-[#9b9ca5]">Recorded, server-side market observations. No manual archive uploads.</p></div>
      <Link href="/dashboard" className="rounded-md border border-[#55505a] px-4 py-2 text-xs font-bold">BACK TO DASHBOARD</Link>
    </header>
    <nav aria-label="Historical range" className="mt-7 flex flex-wrap gap-2">{RANGES.map(r=><button key={r} type="button" onClick={()=>setRange(r)} className={"rounded-md border px-4 py-2 text-xs font-bold "+(range===r?"border-[#dbb368] bg-[#d5ad60]/10 text-[#eac780]":"border-[#333439] text-[#acadb7]")}>{r.toUpperCase()}</button>)}</nav>
    {authLoading||loading?<p role="status" className="mt-8 text-[#989aa3]">CHECKING VERIFIED SERVER HISTORY…</p>:
      !session?<p role="status" className="mt-8 text-[#b9bac2]">SIGN IN REQUIRED. <Link href="/login" className="text-[#e9c478] underline">SIGN IN</Link></p>:
      report?.state!=="ready"?<section role="status" className="mt-7 rounded-xl border border-[#373438] bg-[#101114] p-6"><h2 className="text-xl font-bold">{report?.state==="forbidden"?"ACCOUNT ACCESS REQUIRED":report?.state==="empty"?"NO VERIFIED HISTORY IN THIS RANGE":"SERVER HISTORY NOT YET AVAILABLE"}</h2><p className="mt-3 text-sm text-[#9d9fa9]">Only reconciled post-Telegram delivery records can appear here. Candidate alerts and imported sample archives are not substituted.</p></section>:
      <div className="mt-7 space-y-6">
        {report.truncated&&<p role="status" className="text-sm text-amber-200">The selected range exceeds 5,000 events. Counts below are a partial bounded view.</p>}
        <section className="grid gap-3 sm:grid-cols-3"><article className="rounded-xl border border-[#333439] bg-[#111215] p-5"><div className="text-xs text-[#a0a1a8]">ALERT EVENTS</div><strong className="mt-3 block text-3xl">{report.summary?.alerts.toLocaleString()}</strong></article><article className="rounded-xl border border-[#333439] bg-[#111215] p-5"><div className="text-xs text-[#a0a1a8]">DISTINCT MINTS</div><strong className="mt-3 block text-3xl">{report.summary?.distinct_mints.toLocaleString()}</strong></article><article className="rounded-xl border border-[#333439] bg-[#111215] p-5"><div className="text-xs text-[#a0a1a8]">OBSERVED PEAK RECORDS</div><strong className="mt-3 block text-3xl">{report.summary?.observed_peak_count.toLocaleString()}</strong></article></section>
        <section className="rounded-xl border border-[#333439] bg-[#111215] p-5"><h2 className="text-lg font-bold">LANE DISTRIBUTION</h2><div className="mt-4 grid gap-2 sm:grid-cols-3">{Object.entries(report.summary?.by_lane||{}).sort((a,b)=>b[1]-a[1]).map(([lane,count])=><div key={lane} className="flex items-center justify-between border-b border-[#2c2d31] py-2 text-sm"><span>{lane}</span><strong>{count}</strong></div>)}</div></section>
        <section className="rounded-xl border border-[#333439] bg-[#111215] p-5"><h2 className="text-lg font-bold">RECORDED EVENTS</h2><div className="mt-4 space-y-2">{(report.events||[]).map(e=><article key={e.event_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2c2e33] p-3"><div><div className="font-semibold"><span className="text-[#dfbb76]">{e.lane}</span> / ${e.symbol}</div><div className="mt-1 text-xs text-[#93959f]">{at(e.event_at)}</div></div><div className="text-right text-sm"><div>CALLED AT MC {fmt(e.alert_mc)}</div><div className="mt-1 text-xs text-[#93959f]">{e.outcome_status==="OBSERVED_PEAK"&&e.observed_max_multiple!==null?e.observed_max_multiple.toFixed(2)+"× observed peak (not P&L)":"NO VERIFIED EXIT DATA"}</div></div></article>)}</div></section>
      </div>}
  </main>;
}