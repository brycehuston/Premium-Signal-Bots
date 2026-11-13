"use client";
import Link from "next/link";
import Image from "next/image";
import {useCallback,useEffect,useState} from "react";
import {useSupabase} from "@/components/SupabaseProvider";
import {ALPHA_LANES} from "@/lib/plans";
import TelegramMiniAppAuth from "@/components/TelegramMiniAppAuth";
import HistoryEventsPanel from "./HistoryEventsPanel";
import S4ScoreboardPanel from "./S4ScoreboardPanel";

type Access="loading"|"owner"|"subscriber"|"none"|"unavailable";
type Preview="loading"|"eligible"|"active"|"expired"|"unavailable";
type Day={date:string;alerts:number;first_mints:number;early:number;genesis:number;trend:number;strict:number;reclaim:number;runner:number};
const signalKeys:Record<string,string>={alpha_early:"EARLY",alpha_genesis:"GENESIS",alpha_trend:"TREND",alpha_strict:"STRICT",alpha_reclaim:"RECLAIM",alpha_runner:"RUNNER"};
export default function AlphaCommand(){
 const {session,loading,signOut}=useSupabase();
 const token=session?.access_token;
 const [access,setAccess]=useState<Access>("loading");
 const [preview,setPreview]=useState<Preview>("loading");
 const [expiry,setExpiry]=useState("");
 const [busy,setBusy]=useState(false);
 const [daily,setDaily]=useState<Day[]>([]);
 const [lane,setLane]=useState<"all"|"early"|"genesis"|"trend"|"strict"|"reclaim"|"runner">("all");
 const [selected,setSelected]=useState("");
 const [time,setTime]=useState(0);
 const [profile,setProfile]=useState<{plan?:string|null;is_active?:boolean|null;entitlements?:string[]}|null>(null);
 const [profileState,setProfileState]=useState<"loading"|"ready"|"unavailable">("loading");
 const request=useCallback(async(path:string,method="GET")=>{
  if(!token)throw Error("not_authenticated");
  const res=await fetch(path,{method,headers:{Authorization:"Bearer "+token},cache:"no-store"});
  return {status:res.status,body:await res.json()};
 },[token]);
 const check=useCallback(async()=>{
  if(!token)return;
  try{
   const a=await request("/api/intelligence/access");
   const level:Access=a.status===200&&(a.body.state==="owner"||a.body.state==="subscriber")?a.body.state:a.status===503?"unavailable":"none";
   setAccess(level);
   // Verified owner/subscriber access is independent of the free preview RPC.
   // Never show paid members an expired trial or depend on the preview service.
   if(level==="owner"||level==="subscriber"){
    setPreview("unavailable");setExpiry("");setDaily([]);return;
   }
  }catch{setAccess("unavailable")}
  try{
   const p=await request("/api/intelligence/preview");
   const v=p.body.state;
   setPreview(["eligible","active","expired"].includes(v)?v:"unavailable");
   setExpiry(typeof p.body.expires_at==="string"?p.body.expires_at:"");
  }catch{setPreview("unavailable")}
 },[token,request]);
 useEffect(()=>{
  if(loading)return;
  if(!token){setAccess("none");setPreview("unavailable");setDaily([]);setProfile(null);return}
  setAccess("loading");setPreview("loading");setDaily([]);setProfile(null);setProfileState("loading");
  void check();
  // Read /me only to display verified plan details; never use it as a local
  // permission grant for the owner, subscriber or preview data endpoints.
  const url=process.env.NEXT_PUBLIC_API_BASE||process.env.NEXT_PUBLIC_API_URL||"";
  if(!/^https:\/\//i.test(url)){setProfileState("unavailable");return}
  const c=new AbortController();
  fetch(url.replace(/\/$/,"")+"/me",{headers:{Authorization:"Bearer "+token},cache:"no-store",signal:c.signal})
   .then(async r=>{if(!r.ok)throw Error("membership_unavailable");return r.json()})
   .then(x=>{if(!c.signal.aborted){const valid=x&&typeof x==="object"&&typeof x.is_active==="boolean"&&(typeof x.plan==="string"||x.plan==null);setProfile(valid?x:null);setProfileState(valid?"ready":"unavailable")}})
   .catch(()=>{if(!c.signal.aborted)setProfileState("unavailable")});
  return()=>c.abort();
 },[token,loading,check]);
 useEffect(()=>{if(!expiry||preview!=="active")return;const tick=()=>setTime(Date.now());tick();const interval=window.setInterval(tick,1000);return()=>window.clearInterval(interval)},[expiry,preview]);
 const remaining=expiry?Math.max(0,Math.ceil((Date.parse(expiry)-time)/1000)):0;
 useEffect(()=>{if(preview==="active"&&remaining===0&&time>0){setPreview("expired");setDaily([])}},[preview,remaining,time]);
 useEffect(()=>{if(preview!=="active"||!token)return;let alive=true;const c=new AbortController();
  fetch("/api/intelligence/preview/data",{headers:{Authorization:"Bearer "+token},signal:c.signal,cache:"no-store"})
   .then(async r=>({status:r.status,data:await r.json()})).then(({status,data})=>{
    if(!alive)return;
    if(status===200&&data.state==="active"&&Array.isArray(data.daily)){setDaily(data.daily)}
    else{setDaily([]);if(data.state==="expired")setPreview("expired")}
   }).catch(()=>{if(alive)setDaily([])});
  return()=>{alive=false;c.abort()};
 },[preview,token]);
 async function activate(){
  if(busy||preview!=="eligible")return;setBusy(true);
  try{const r=await request("/api/intelligence/preview","POST");
   setPreview(r.body.state==="active"?"active":r.body.state==="expired"?"expired":"unavailable");
   setExpiry(typeof r.body.expires_at==="string"?r.body.expires_at:"");
  }catch{setPreview("unavailable")}finally{setBusy(false)}
 }
 if(loading)return <main role="status" className="mx-auto max-w-5xl p-8 text-[#c1c4c9]">Checking your account…</main>;
 if(!token)return <main className="mx-auto max-w-4xl px-5 py-16 text-center"><TelegramMiniAppAuth/><p className="text-[11px] tracking-[.28em] text-[#e7bc67]">ALPHA COMMAND</p><h1 className="mt-5 font-display text-3xl text-[#f3f0e9]">Your account, one place.</h1><p className="mt-4 text-[#b7bcc4]">Sign in to view your lanes, membership and intelligence access.</p><Link href="/login" className="mt-7 inline-flex min-h-11 items-center rounded-lg border border-[#b38d53] px-6 text-[#f0cb8e]">SIGN IN</Link></main>;
 const verified=access==="subscriber";
 const entitled=verified&&profileState==="ready"&&Array.isArray(profile?.entitlements)
  ?profile.entitlements.map(e=>signalKeys[e]).filter((e):e is string=>typeof e==="string")
  :[];
 const free=access==="none"&&profileState==="ready"&&profile?.is_active===false&&(!profile.plan||profile.plan.toLowerCase()==="free");
 const status=access==="owner"?"Owner":verified?"Active subscriber":access==="unavailable"||profileState==="unavailable"?"Status unavailable":free?"Free account":profile?.is_active===false?"Inactive subscription":"Membership not confirmed";
 const filtered=daily.map(d=>({date:d.date,value:lane==="all"?d.alerts:d[lane]}));
 const peak=Math.max(1,...filtered.map(d=>d.value));
 return <main className="mx-auto max-w-[1152px] space-y-6 py-8 text-[#eeeff1] sm:py-11">
  <TelegramMiniAppAuth/>
  <header className="rounded-[16px] border border-[#4b4235] bg-[linear-gradient(145deg,#1b1b1b,#101115_65%)] p-5 sm:p-8">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <Link href="/" aria-label="Alpha Alerts homepage" className="inline-flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e7bc67]">
     <Image src="/alpha-lane-v4-logo.png" alt="" width={38} height={40} className="h-[39px] w-[38px] shrink-0 object-contain" unoptimized priority />
     <span className="font-display whitespace-nowrap text-[15px] font-bold tracking-[.15em] text-[#e1e3e6] sm:text-[17px]">ALPHA <span className="text-[#e7bc67]">ALERTS</span></span>
    </Link>
    <button type="button" onClick={()=>void signOut()} className="min-h-11 rounded-lg border border-[#424348] px-4 text-xs text-[#c4c7cc] hover:border-[#e7bc67]">SIGN OUT</button></div>
   <h1 className="mt-5 font-display text-[clamp(30px,5vw,52px)] font-semibold tracking-[-.045em]">ALPHA <span className="text-[#e7bc67]">COMMAND</span></h1>
   <p className="mt-2 break-all text-[13px] text-[#bac0ca]">{session.user.email||"Verified signed-in account"}</p>
   <div className="mt-7 grid gap-3 sm:grid-cols-3">
    {[["MEMBERSHIP",status],["CURRENT PLAN",free?"FREE":verified&&profile?.plan?profile.plan.replace(/-/g," ").toUpperCase():"Not verified"],["INTELLIGENCE",access==="owner"?"Owner access":access==="subscriber"?"24h+ delayed aggregate":access==="unavailable"?"Access check unavailable":"Preview or membership required"]].map(([label,value])=><div key={label} className="rounded-[11px] border border-[#34363a] bg-[#15171a] p-4"><p className="text-[10px] font-semibold tracking-[.17em] text-[#a7abb3]">{label}</p><p className="mt-2 text-[14px] font-semibold leading-6 text-[#f0e8d9]">{value}</p></div>)}
   </div>
  </header>
  <section className="rounded-[13px] border border-[#34363b] bg-[#121418] p-5 sm:p-7">
   <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-semibold tracking-[.23em] text-[#e7bc67]">MEMBERSHIP</p><h2 className="mt-2 font-display text-2xl font-semibold">MY ALPHA LANES</h2></div><Link href="/pricing" className="inline-flex min-h-11 items-center rounded-lg border border-[#766544] px-4 text-xs font-semibold text-[#e7bc67]">VIEW PLANS</Link></div>
   <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ALPHA_LANES.map(l=><div key={l.key} className="rounded-[10px] border border-[#32363b] bg-[#181a1d] p-4"><div className="flex items-center gap-2"><span aria-hidden="true" className="text-xl">{l.emoji}</span><strong className="text-[13px]">ALPHA {l.key}</strong></div><p className="mt-2 text-[11px] text-[#b2b8c0]">{access==="owner"?"Owner research access":entitled.includes(l.key)?"Verified subscription access":l.availability==="planned"?"PLANNED · NOT YET AVAILABLE":"No verified entitlement"}</p></div>)}</div>
  </section>
  <section className="rounded-[13px] border border-[#454039] bg-[#141517] p-5 sm:p-7">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[.22em] text-[#e7bc67]">ALPHA INTELLIGENCE</p><h2 className="mt-2 font-display text-2xl font-semibold">LANE FLOW</h2><p className="mt-3 max-w-xl text-[13px] leading-7 text-[#bac0c7]">A research view of aggregate lane activity. Private owner data, paid alerts and token-level findings remain restricted.</p></div>{(access==="owner"||access==="subscriber")&&<Link href="/dashboard/intelligence" className="inline-flex min-h-11 items-center rounded-lg border border-[#b08b50] px-4 text-[11px] font-semibold text-[#f0cc94]">OPEN AUTHORIZED INTELLIGENCE</Link>}</div>
   {(access==="owner"||access==="subscriber")?<p className="mt-5 text-[13px] font-semibold text-[#e7bc67]">INTELLIGENCE ACCESS VERIFIED · {access==="owner"?"Full owner research access":"Subscriber intelligence access"} is available through the authorized dashboard above.</p>:preview==="loading"?<p role="status" className="mt-6 text-[13px] text-[#b6bac2]">Checking preview eligibility…</p>:preview==="eligible"?<div className="mt-6"><p className="text-[13px] text-[#d1d0cc]">One free preview per account. Starts only when you select the button; expires exactly 10 minutes later, including across refreshes and devices.</p><button type="button" disabled={busy} onClick={()=>void activate()} className="mt-4 min-h-11 rounded-lg border border-[#a98b57] bg-[#e7bc67]/15 px-5 text-[12px] font-semibold text-[#f1cf98] disabled:opacity-50">{busy?"STARTING…":"START MY 10-MINUTE PREVIEW"}</button></div>:preview==="active"?<div className="mt-6"><div className="flex flex-wrap gap-3"><p className="text-[12px] font-semibold text-[#e7bc67]">PREVIEW ACTIVE · {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")} remaining</p><span className="text-[11px] text-[#aab1ba]">Read-only · 24h+ delayed aggregate</span></div><div className="mt-5 flex flex-wrap gap-2">{(["all","early","genesis","trend","strict","reclaim","runner"] as const).map(key=><button type="button" key={key} aria-pressed={lane===key} onClick={()=>setLane(key)} className={"min-h-10 rounded-lg border px-3 text-[11px] font-semibold uppercase "+(lane===key?"border-[#e7bc67] bg-[#e7bc67]/15 text-[#f2d6aa]":"border-[#41434a] text-[#c0c5cc]")}>{key}</button>)}</div>{daily.length?<div className="mt-6"><div className="flex h-44 items-end gap-1.5">{filtered.map(d=><button type="button" key={d.date} title={d.date+": "+d.value} aria-label={d.date+": "+d.value+" observations"} onClick={()=>setSelected(d.date)} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5"><div className="w-full rounded-t-sm bg-[#d8b675]/85" style={{height:Math.max(3,d.value/peak*100)+"%"}}/><span className="truncate text-center text-[8px] text-[#b0b5be]">{d.date.slice(5)}</span></button>)}</div><p className="mt-4 text-[12px] text-[#c3c5ca]">{selected?selected+" · "+(filtered.find(d=>d.date===selected)?.value??0)+" observations":"Select a day to inspect aggregate counts"}</p></div>:<p role="status" className="mt-5 text-[13px] text-[#c0c3c9]">Historical aggregate data is not available. No sample data is being substituted.</p>}</div>:preview==="expired"?<p className="mt-5 text-[13px] text-[#c3bcae]">Your one-time preview has expired. Your Alpha Command account remains available.</p>:<p role="status" className="mt-5 text-[13px] text-[#c3bcae]">Preview service unavailable. Existing membership and account access are unaffected.</p>}
  </section>
  <section className="grid gap-4 md:grid-cols-2"><div className="rounded-[13px] border border-[#34363b] bg-[#121418] p-6"><p className="text-[10px] font-semibold tracking-[.2em] text-[#e7bc67]">ACCOUNT</p><h2 className="mt-3 font-display text-xl">Membership and support</h2><p className="mt-3 text-[13px] leading-6 text-[#b8bdc6]">Billing and Telegram linkage are shown only when verifiable. Account status cannot be inferred during an outage.</p><div className="mt-4 flex gap-4"><Link href="/dashboard/account" className="text-sm text-[#e7bc67] underline underline-offset-4">Account details</Link><Link href="/support" className="text-sm text-[#e7bc67] underline underline-offset-4">Support</Link></div></div><div className="rounded-[13px] border border-[#34363b] bg-[#121418] p-6"><p className="text-[10px] font-semibold tracking-[.2em] text-[#e7bc67]">ALPHA SYSTEMS</p><h2 className="mt-3 font-display text-xl">ALPHA-X</h2><p className="mt-3 text-[13px] text-[#bdc0c5]">DEVELOPED · PRIVATE ACCESS CLOSED</p><p className="mt-2 text-[12px] leading-6 text-[#aeb5be]">Alpha Pulse, Apex and Nexus remain separate research and systems technology, not paid signal lanes.</p><Link href="/pricing" className="mt-4 inline-flex text-sm text-[#e7bc67] underline underline-offset-4">Explore systems</Link></div></section>
   {access==="owner"&&<S4ScoreboardPanel/>}
  {(access==="owner"||access==="subscriber")&&<HistoryEventsPanel/>}
 </main>;
}
