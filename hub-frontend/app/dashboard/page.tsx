"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

type Alert={id:string;symbol:string;lane:string;score:number;timestamp_utc:string;alert_mc:number|null;liquidity_usd:number|null;m5_tx:number|null};
type State="loading"|"verified"|"archived"|"empty"|"unavailable";
type Feed={state:State;alerts:Alert[];period?:"24h"|"7d"|null;as_of_utc?:string};
const palette:Record<string,string>={EARLY:"#a3ce64",GENESIS:"#a78bfa",RECLAIM:"#4bb8d1",TREND:"#cdd7e2",STRICT:"#d97777",RUNNER:"#d8b879"};
const money=(n:number|null)=>n==null||!Number.isFinite(n)?"—":n>=1000000?"$"+(n/1000000).toFixed(2)+"M":n>=1000?"$"+(n/1000).toFixed(1)+"K":"$"+Math.round(n).toLocaleString("en-US");
const time=(s:string)=>new Date(s).toLocaleString("en-CA",{timeZone:"America/Vancouver",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZoneName:"short"});
function validAlert(v:unknown):v is Alert{
 if(!v||typeof v!=="object")return false;
 const a=v as Partial<Alert>;
 return typeof a.id==="string"&&typeof a.symbol==="string"&&typeof a.lane==="string"&&Boolean(palette[a.lane])&&typeof a.timestamp_utc==="string"&&Number.isFinite(Date.parse(a.timestamp_utc))&&typeof a.score==="number"&&Number.isFinite(a.score);
}
function Panel({children}:{children:React.ReactNode}){return <section className="rounded-2xl border border-[#36383d] bg-[#121419] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.045)] sm:p-7">{children}</section>}
function Heartbeat(){
 const [feed,setFeed]=useState<Feed>({state:"loading",alerts:[]});
 useEffect(()=>{
  let alive=true,controller:AbortController|null=null;
  async function poll(){
   if(document.hidden)return;
   controller?.abort();const request=new AbortController();controller=request;
   try{
    const response=await fetch("/api/public/daily-top",{signal:request.signal,cache:"no-store"});
    if(!response.ok)throw Error("feed");
    const data=await response.json();
    const state:State=data.state==="verified"||data.state==="archived"||data.state==="empty"?data.state:"unavailable";
    const alerts=Array.isArray(data.alerts)?data.alerts.filter(validAlert).slice(0,3):[];
    if(alive&&!request.signal.aborted)setFeed({state,alerts:state==="verified"||state==="archived"?alerts:[],period:data.period==="24h"||data.period==="7d"?data.period:null,as_of_utc:data.as_of_utc});
   }catch{if(alive&&!request.signal.aborted)setFeed({state:"unavailable",alerts:[]})}
  }
  void poll();const interval=setInterval(()=>void poll(),60000);
  document.addEventListener("visibilitychange",poll);
  return()=>{alive=false;controller?.abort();clearInterval(interval);document.removeEventListener("visibilitychange",poll)};
 },[]);
 const historical=feed.state==="archived"&&feed.alerts.length>0;
 const ready=(feed.state==="verified"||historical)&&feed.alerts.length>0;
 return <div className="space-y-5">
  <div className="grid gap-4 sm:grid-cols-3">
   {[
    ["PUBLIC ALERTS SHOWN",ready?String(feed.alerts.length):"—",historical?"Dated archive · not live":"Verified records, maximum three"],
    ["LANES REPRESENTED",ready?String(new Set(feed.alerts.map(a=>a.lane)).size):"—","Among displayed public alerts"],
    ["LAST RECORDED ALERT",ready?time(feed.alerts[0].timestamp_utc):"—",historical?"Historical reference time":"Recorded time, not trade execution"]
   ].map(([title,value,desc])=><Panel key={title}>
    <p className="text-[10px] font-bold tracking-[.16em] text-[#bec1c9]">{title}</p>
    <strong className="mt-3 block break-words font-display text-[clamp(1.3rem,2vw,2rem)] tracking-tight text-[#f1cb8c]">{value}</strong>
    <p className="mt-2 text-xs leading-7 text-[#a3aab3]">{desc}</p>
   </Panel>)}
  </div>
  <Panel>
   <div className="flex flex-wrap items-center justify-between gap-4">
    <div><p className="text-[10px] font-bold tracking-[.23em] text-[#d9b674]">HEARTBEAT / VERIFIED PUBLIC FEED</p><h2 className="mt-2 font-display text-2xl font-semibold">Top 3 recorded alerts</h2></div>
    <span className="rounded-full border border-[#786745] bg-[#221e18] px-3 py-1.5 text-[10px] font-bold tracking-[.08em] text-[#eac689]">{historical?"DATED ARCHIVE · NOT LIVE":ready?"SIGNED · "+(feed.period==="7d"?"7D":"24H"):feed.state==="loading"?"CONNECTING":feed.state==="empty"?"NO ELIGIBLE ALERTS":"FEED UNAVAILABLE"}</span>
   </div>
   <p className="mt-3 max-w-3xl text-[13px] leading-7 text-[#acb2bb]">Automatically refreshed every minute. Signed public records only, delayed by at least 30 minutes and listed by event time. Dated archives are explicitly historical, not live. No private Telegram messages or inferred trade returns.</p>
   {ready?<div className="mt-6 grid gap-4 lg:grid-cols-3">{feed.alerts.map((a,i)=><article key={a.id} className="rounded-xl border border-[#373b44] bg-[#1b1e24] p-5">
    <div className="flex items-center justify-between"><span className="text-xs font-bold text-[#bfc4cc]">#{i+1}</span><span className="text-[10px] font-bold tracking-[.15em]" style={{color:palette[a.lane]}}>{a.lane}</span></div>
    <h3 className="mt-4 truncate font-display text-2xl font-semibold text-[#f1f3f5]">$ {a.symbol}</h3>
    <p className="mt-1 text-xs text-[#a9afb8]">{time(a.timestamp_utc)}</p>
    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#383d47] pt-4">
    {([["ALERT MC",money(a.alert_mc)],["LIQUIDITY",money(a.liquidity_usd)],["5M TX",a.m5_tx==null?"—":a.m5_tx.toLocaleString("en-US")],["LANE SCORE",a.score.toFixed(1)+" / 10"]] as const).map(([key,val])=><div key={key}><div className="text-[9px] tracking-wider text-[#aeb5be]">{key}</div><strong className="mt-1 block text-sm text-[#e6c78e]">{val}</strong></div>)}
    </div></article>)}</div>:
   <div className="mt-6 rounded-xl border border-[#564636] bg-[#241d18] p-6" role="status">
    <h3 className="font-display text-lg font-semibold text-[#f0c98a]">{feed.state==="loading"?"Connecting to the verified publisher…":feed.state==="empty"?"No eligible alerts in the verified window":feed.state==="archived"?"Only historical records are currently available":"Signed Top 3 feed temporarily unavailable"}</h3>
    <p className="mt-2 max-w-2xl text-[13px] leading-7 text-[#bfc0c5]">The public-feed publisher must supply a current verified snapshot. Once restored, the cards populate automatically. Unverified candidates and private channels are never substituted.</p>
   </div>}
  </Panel>
 </div>;
}
export default function Dashboard(){
 const {session,loading,signOut}=useSupabase();
 if(loading)return <main className="mx-auto max-w-6xl p-10 text-[#c0c4ce]" role="status">CHECKING SECURE SESSION…</main>;
 if(!session)return <main className="mx-auto max-w-4xl px-5 py-24 text-center text-[#e8eaef]"><p className="text-xs font-bold tracking-[.25em] text-[#d9b675]">ALPHA ALERTS / INTELLIGENCE</p><h1 className="mt-5 font-display text-3xl font-bold">SIGN IN REQUIRED</h1><p className="mt-3 text-sm text-[#b4b8bf]">Sign in to open your intelligence workspace.</p><Link href="/login" className="mt-7 inline-flex rounded-lg border border-[#987e50] px-6 py-3 text-sm font-semibold text-[#f1cf93]">SIGN IN</Link></main>;
 return <main className="mx-auto max-w-[1320px] space-y-7 px-4 py-8 text-[#f0f2f5] sm:px-7">
  <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[#363840] pb-7">
   <div><p className="text-[10px] font-bold tracking-[.24em] text-[#d9b675]">ALPHA ALERTS / INTELLIGENCE</p><h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tight">Your command dashboard.</h1><p className="mt-3 max-w-3xl text-[13px] leading-7 text-[#b3b8c0]">Server-connected alerts appear automatically when the verified publisher is available. No archive uploads required.</p></div>
   <div className="flex gap-2"><Link href="/dashboard/account" className="rounded-lg border border-[#46484f] px-4 py-2 text-xs font-semibold">ACCOUNT</Link><button type="button" onClick={()=>void signOut()} className="rounded-lg border border-[#46484f] px-4 py-2 text-xs font-semibold">SIGN OUT</button></div>
  </header>
  <Heartbeat/>
  <div className="grid gap-4 lg:grid-cols-2">
   <Panel><p className="text-[10px] font-bold tracking-[.22em] text-[#d9b675]">PRIVATE HISTORICAL INTELLIGENCE</p><h2 className="mt-3 font-display text-xl font-semibold">Verified history connection pending.</h2><p className="mt-3 text-[13px] leading-7 text-[#b1b6bf]">Full subscriber history requires verified Telegram delivery provenance, public/private separation and entitlement validation. Not yet connected. This public-feed preview is not private history.</p><span className="mt-5 inline-flex rounded-full border border-[#61533c] px-3 py-1 text-[10px] font-bold text-[#e6c58e]">NOT YET AVAILABLE</span></Panel>
   <Panel><p className="text-[10px] font-bold tracking-[.22em] text-[#d9b675]">OPTIONAL RESEARCH TOOLS</p><h2 className="mt-3 font-display text-xl font-semibold">Legacy V4 archive viewer</h2><p className="mt-3 text-[13px] leading-7 text-[#b1b6bf]">Your previous local research analyzer remains available without changing or deleting saved browser archives. File import is optional and stays entirely on your device.</p><Link href="/dashboard/legacy" className="mt-5 inline-flex rounded-lg border border-[#786344] bg-[#d6b472]/10 px-4 py-3 text-xs font-bold text-[#f0d39e]">OPEN LEGACY VIEWER</Link></Panel>
  </div>
 </main>;
}
