"use client";
import {useEffect,useState} from "react";
import {useSupabase} from "@/components/SupabaseProvider";
type Position={mint:string;lane:string;entry_mc?:number;last_quote_multiple?:number;tp1?:boolean;remaining?:number;fresh_sell_quote_mark_net?:number|null;net?:number;reason?:string[];any_estimated?:boolean};
type Snapshot={state:string;live?:boolean;as_of_utc?:string;probes?:{total:number;pass:number;traps:number};S4?:{open_mints:number;closed_mints:number;closed_by_clip:Record<string,{N:number;net_paper_SOL:number}>;open_records:Position[];closed_records:Position[]};S3?:Record<string,{N:number;net_SOL:number}>;U29?:Record<string,{aligned_quote_N:number;aligned_quote_net_SOL:number}>};
const fmt=(x:number|undefined|null,n=4)=>typeof x==="number"&&Number.isFinite(x)?x.toFixed(n):"—";
const mint=(x:string)=>x.slice(0,6)+"…"+x.slice(-5);
export default function S4ScoreboardPanel(){
 const {session}=useSupabase();
 const [snap,setSnap]=useState<Snapshot>({state:"loading"});
 useEffect(()=>{
  if(!session?.access_token){setSnap({state:"forbidden"});return}
  const controller=new AbortController();
  fetch("/api/intelligence/s4",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store",signal:controller.signal})
   .then(async r=>r.ok?await r.json():{state:"unavailable"})
   .then(data=>{if(!controller.signal.aborted)setSnap(data)})
   .catch(()=>{if(!controller.signal.aborted)setSnap({state:"unavailable"})});
  return()=>controller.abort()
 },[session?.access_token]);
 const ready=snap.state==="checkpoint"||snap.state==="ready";
 return <section aria-label="S4 paper scoreboard" className="rounded-2xl border border-[#544832] bg-[#141518] p-5 text-[#eeeff1] sm:p-7">
  <p className="text-[10px] font-bold tracking-[.24em] text-[#e4c08b]">ALPHA APEX / VERIFIED OWNER RESEARCH</p>
  <h2 className="mt-2 font-display text-2xl font-semibold">S4 PAPER SCOREBOARD</h2>
  {!ready?<p role="status" className="mt-4 text-sm text-[#b2bcc9]">{snap.state==="loading"?"Checking private scoreboard…":"Private scoreboard unavailable"}</p>:<>
   <p className="mt-2 text-xs font-semibold text-[#e6b977]">{snap.live?"LIVE VERIFIED":"HISTORICAL CHECKPOINT ONLY"} · {snap.as_of_utc||""}</p>
   <p className="mt-2 text-xs text-[#b2bac4]">Not a real-time price feed. Open-position marks and simulated fills are not wallet profits.</p>
   <div className="mt-5 grid gap-3 sm:grid-cols-4">
    {[["OPEN MINTS",snap.S4?.open_mints],["CLOSED MINTS",snap.S4?.closed_mints],["0.25 CLOSED SOL",fmt(snap.S4?.closed_by_clip?.["0.25"]?.net_paper_SOL,6)],["JUPITER PROBES",snap.probes?.total]].map(([label,val])=>
     <div key={String(label)} className="rounded-xl border border-[#353a3e] bg-[#1c1d22] p-4"><p className="text-[10px] text-[#b0b9c4]">{label}</p><p className="mt-2 text-lg font-semibold tabular-nums">{val??"—"}</p></div>)}
   </div>
   <div className="mt-5 grid gap-5 lg:grid-cols-2">
    <div className="rounded-xl border border-[#34383d] p-4">
     <h3 className="text-sm font-semibold text-[#e3c08a]">OPEN 0.25 SOL BOOKS</h3>
     {(snap.S4?.open_records||[]).map(x=><div key={x.mint} className="mt-3 border-t border-[#34383d] pt-3">
      <div className="flex justify-between gap-3 text-xs"><code>{mint(x.mint)}</code><strong>{x.lane}</strong></div>
      <p className="mt-2 text-xs text-[#abb6c1]">Entry MC ${Math.round(x.entry_mc||0).toLocaleString()} · Quote {fmt(x.last_quote_multiple,2)}× · TP1 {x.tp1?"modeled banked":"pending"}</p>
      <p className="mt-1 text-xs text-[#abb6c1]">Remaining {Math.round((x.remaining||0)*100)}% · Quote-only mark {fmt(x.fresh_sell_quote_mark_net,5)} SOL</p>
     </div>)}
    </div>
    <div className="rounded-xl border border-[#34383d] p-4">
     <h3 className="text-sm font-semibold text-[#e3c08a]">CLOSED 0.25 SOL BOOKS</h3>
     {(snap.S4?.closed_records||[]).map(x=><div key={x.mint} className="mt-3 border-t border-[#34383d] pt-3">
      <div className="flex justify-between gap-3 text-xs"><code>{mint(x.mint)}</code><strong className={(x.net||0)>=0?"text-[#9bd9b3]":"text-[#efaeae]"}>{fmt(x.net,6)} SOL</strong></div>
      <p className="mt-1 text-xs text-[#abb6c1]">{(x.reason||[]).join(" → ").replaceAll("_"," ")}{x.any_estimated?" · modeled partial fill":""}</p>
     </div>)}
    </div>
   </div>
   <p className="mt-5 text-xs text-[#c4c7cc]">Same-window controls: S3 0.0625 SOL {fmt(snap.S3?.["0.0625"]?.net_SOL,6)} SOL; U29 aligned 0.25 SOL {fmt(snap.U29?.["0.25"]?.aligned_quote_net_SOL,6)} SOL. Different samples, sizes and exit policies; do not interpret as like-for-like PnL.</p>
  </>}
 </section>
}
