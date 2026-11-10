"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";
import "./intelligence.css";
import { forgetLaneArchive, readSavedLaneArchive, saveLaneArchive } from "./localArchive";

const LANES = ["EARLY", "GENESIS", "RECLAIM", "TREND", "STRICT", "RUNNER"] as const;
type Lane = (typeof LANES)[number];
const COLORS: Record<Lane,string> = {
  EARLY:"#a3ce64", GENESIS:"#a78bfa", RECLAIM:"#4bb8d1",
  TREND:"#cdd7e2", STRICT:"#d97777", RUNNER:"#d8b879"
};
type Daily = { date_pt:string; all_alerts:number; first_mints:number; [key:string]:string|number };
type Hour = { date_pt:string; dow:string; clock_hour_pt:number; pulse_mode:string; all_alerts:number; first_mints:number; [key:string]:string|number };
type First = { mint:string;symbol:string;lane:string;date:string;mc:string|number;alerts:number;url:string };
type Transition = { from_lane:string;to_lane:string;event_n:string|number;unique_mints:string|number;within_20m_events:string|number };
type Regime = {mode:string;hours:number;all_alerts:number;first_mints:number;early_per_hour:number;reclaim_per_hour:number;runner_per_hour:number};
type Archive = {daily:Daily[];hourly:Hour[];first:First[];regimes:Regime[];transitions:Transition[];summary:{start:string;end:string;messages:number;mint:number;lane:number;heartbeat:number;pulse:number}};
const n=(v:unknown)=>Number(v)||0;
const fmt=(v:number)=>v.toLocaleString("en-US");
const formatMoney=(v:unknown)=>Number.isFinite(Number(v))&&Number(v)>0?"$"+Math.round(Number(v)).toLocaleString("en-US"):"—";
function trustedTelegram(value:string){try{const u=new URL(value);return u.protocol==="https:"&&u.hostname==="t.me"?u.toString():null}catch{return null}}
function validArchive(data:unknown):data is Archive {
 if(!data||typeof data!=="object")return false;
 const v=data as Partial<Archive>;
 const validDate=(date:unknown)=>typeof date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(date);
 const count=(value:unknown)=>Number.isFinite(Number(value))&&Number(value)>=0;
 return Array.isArray(v.daily)&&Array.isArray(v.hourly)&&Array.isArray(v.first)&&Array.isArray(v.regimes)&&Array.isArray(v.transitions)&&
 v.daily.length<=4000&&v.hourly.length<=100000&&v.first.length<=100000&&
 !!v.summary&&validDate(v.summary.start)&&validDate(v.summary.end)&&v.summary.start<=v.summary.end&&
 v.daily.every(x=>validDate(x.date_pt)&&count(x.all_alerts)&&count(x.first_mints)&&LANES.every(l=>count(x[l])))&&
 v.hourly.every(x=>validDate(x.date_pt)&&typeof x.dow==="string"&&count(x.all_alerts)&&count(x.first_mints)&&
 Number.isInteger(x.clock_hour_pt)&&x.clock_hour_pt>=0&&x.clock_hour_pt<=23&&typeof x.pulse_mode==="string")&&
 v.first.every(x=>typeof x.mint==="string"&&x.mint.length>0&&typeof x.symbol==="string"&&
 typeof x.date==="string"&&/^\d{4}-\d{2}-\d{2}/.test(x.date)&&
 LANES.includes(x.lane as Lane)&&count(x.alerts)&&count(x.mc)&&typeof x.url==="string")&&
 v.regimes.every(x=>typeof x.mode==="string"&&count(x.hours)&&count(x.early_per_hour)&&count(x.reclaim_per_hour)&&count(x.runner_per_hour))&&
 v.transitions.every(x=>typeof x.from_lane==="string"&&typeof x.to_lane==="string"&&count(x.event_n));
}
function Panel({title,detail,children,className="",id}:{title:string;detail?:string;children:React.ReactNode;className?:string;id?:string}){
 return <section id={id} className={"ai-panel "+className}><div className="ai-panel-head"><h2>{title}</h2>{detail&&<span>{detail}</span>}</div>{children}</section>;
}
function Bars({rows,max}:{rows:{label:string;value:number;color?:string}[];max:number}){
 return <div className="ai-bars">{rows.map(r=><div className="ai-bar" key={r.label}><span>{r.label}</span><div className="ai-track"><div style={{width:`${Math.max(0,Math.min(100,max?100*r.value/max:0))}%`,background:r.color||"#69aee2"}}/></div><strong>{fmt(r.value)}</strong></div>)}</div>;
}
export default function LaneIntelligenceDashboard(){
 const {session,loading:authLoading,signOut}=useSupabase();
 const [data,setData]=useState<Archive|null>(null);
 const archiveFileRef=useRef<HTMLInputElement>(null);
 const [error,setError]=useState("");
 const [importName,setImportName]=useState("");
 const [range,setRange]=useState<"7D"|"30D"|"ALL">("30D");
 const [start,setStart]=useState("");const [end,setEnd]=useState("");
 const [search,setSearch]=useState("");const [lookupLane,setLookupLane]=useState("ALL");
 const [hourLane,setHourLane]=useState("ALL");const [hourMode,setHourMode]=useState("ALL MESSAGES");
 const [expanded,setExpanded]=useState(false);
 const [localCheck,setLocalCheck]=useState(true);
 const [storedOnDevice,setStoredOnDevice]=useState(false);
 const [storageBusy,setStorageBusy]=useState(false);
 const accountId=session?.user?.id;
 const archiveVersion=useRef(0);

 useEffect(()=>{
  const version=++archiveVersion.current;
  setData(null);setImportName("");setStoredOnDevice(false);
  if(!accountId){setLocalCheck(false);return;}
  setLocalCheck(true);
  void readSavedLaneArchive(accountId).then(saved=>{
   if(version!==archiveVersion.current)return;
   if(saved && validArchive(saved.archive)){
    const archive=saved.archive;
    setData(archive);setImportName(saved.name);
    setStart(archive.summary.start);setEnd(archive.summary.end);setRange("ALL");
    setStoredOnDevice(true);
   } else if(saved) {
    setError("A saved archive exists but did not pass validation. Import the original V4 archive again.");
   }
  }).catch(()=>{
   // Storage can be blocked by private browsing; manual import must still work.
  }).finally(()=>{if(version===archiveVersion.current)setLocalCheck(false)});
  return ()=>{archiveVersion.current++};
 },[accountId]);

 async function saveCurrentArchive(){
  if(!accountId||!data)return;
  setStorageBusy(true);setError("");
  try{
   await saveLaneArchive(accountId,importName||"Lane Flow V4 archive",data);
   setStoredOnDevice(true);
  }catch{
   setError("Archive remains loaded, but this browser could not save it. Check available storage or permissions.");
  }finally{setStorageBusy(false)}
 }
 async function forgetCurrentArchive(){
  if(!accountId)return;
  setStorageBusy(true);setError("");
  try{
   await forgetLaneArchive(accountId);
   setStoredOnDevice(false);
  }catch{
   setError("Could not remove the saved archive from this browser.");
  }finally{setStorageBusy(false)}
 }

 async function loadFile(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  setError("");
  if(file.size>12*1024*1024){setError("Archive exceeds the 12 MB local import limit.");return}
  try{
   const raw=await file.text();let parsed:unknown;
   if(file.name.toLowerCase().endsWith(".html")||raw.trimStart().startsWith("<")){
    const opener='<script id="dataset" type="application/json">';
    const at=raw.indexOf(opener);
    if(at<0)throw new Error("Missing signed-off V4 dataset block");
    const begin=at+opener.length;
    const stop=raw.indexOf("</script>",begin);
    if(stop<0||stop-begin>12*1024*1024)throw new Error("Invalid archive block");
    parsed=JSON.parse(raw.slice(begin,stop));
   }else parsed=JSON.parse(raw);
   if(!validArchive(parsed))throw new Error("Archive does not match the Lane Flow V4 dataset schema");
   archiveVersion.current++;
   setLocalCheck(false);
   setData(parsed);setImportName(file.name);setStart(parsed.summary.start);setEnd(parsed.summary.end);setRange("ALL");
   setSearch("");setExpanded(false);
   // Owner-requested automatic reuse: save only to this account's browser storage.
   // Nothing is uploaded to the server or shared with other accounts.
   if(accountId){
    try{
     await saveLaneArchive(accountId,file.name,parsed);
     setStoredOnDevice(true);
    }catch{
     setStoredOnDevice(false);
     setError("Archive loaded, but automatic browser storage is unavailable. This import will last only for the current visit.");
    }
   }
  }catch{setError("Could not read the V4 archive. Select the original Lane Flow V4 HTML file or its exported dataset JSON.")}
 }
 const days=useMemo(()=>data?.daily.filter(d=>d.date_pt>=start&&d.date_pt<=end)||[],[data,start,end]);
 const hours=useMemo(()=>data?.hourly.filter(h=>h.date_pt>=start&&h.date_pt<=end)||[],[data,start,end]);
 const totals=useMemo(()=>Object.fromEntries(LANES.map(l=>[l,days.reduce((s,d)=>s+n(d[l]),0)])) as Record<Lane,number>,[days]);
 const eventTotal=days.reduce((s,d)=>s+n(d.all_alerts),0);
 const firstTotal=days.reduce((s,d)=>s+n(d.first_mints),0);
 const pulseKnown=hours.filter(h=>h.pulse_mode&&h.pulse_mode!=="UNKNOWN").length;
 const maxDaily=Math.max(1,...days.map(d=>n(d.all_alerts)));
 const maxLane=Math.max(1,...LANES.map(l=>totals[l]));
 const firstRows=useMemo(()=>{
  if(!data)return[];
  const term=search.trim().toLowerCase();
  return data.first.filter(r=>r.date.slice(0,10)>=start&&r.date.slice(0,10)<=end&&
   (lookupLane==="ALL"||r.lane===lookupLane)&&
   (!term||r.symbol.toLowerCase().includes(term)||r.mint.toLowerCase().includes(term)))
   .sort((a,b)=>b.date.localeCompare(a.date));
 },[data,start,end,search,lookupLane]);
 const selectedRows=expanded?firstRows:firstRows.slice(0,100);
 const daysSorted=[...days].sort((a,b)=>a.date_pt.localeCompare(b.date_pt));
 const regimeCounts=useMemo(()=>{const counts:Record<string,number>={};
  for(const h of hours)counts[h.pulse_mode||"UNKNOWN"]=(counts[h.pulse_mode||"UNKNOWN"]||0)+1;
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
 },[hours]);
 const heat=useMemo(()=>{
  const grid=Array.from({length:7},()=>Array.from({length:24},()=>({sum:0,count:0})));
  for(const h of hours){const day=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(h.dow);
   const hr=Number(h.clock_hour_pt);if(day<0||!Number.isInteger(hr)||hr<0||hr>23)continue;
   const cell=grid[day][hr];cell.sum+=hourMode==="FIRST APPEARANCES"?(hourLane==="ALL"?n(h.first_mints):n(h["first_"+hourLane])):hourLane==="ALL"?n(h.all_alerts):n(h[hourLane]);cell.count++;
  }
  return grid.map(row=>row.map(c=>c.count?c.sum/c.count:0));
 },[hours,hourLane,hourMode]);
 const heatMax=Math.max(1,...heat.flat());
 function selectRange(next:"7D"|"30D"|"ALL"){
  if(!data)return;setRange(next);setEnd(data.summary.end);
  const ds=next==="ALL"?data.summary.start:data.daily.at(-1)?.date_pt||data.summary.end;
  if(next==="ALL"){setStart(data.summary.start);return}
  const from=new Date(ds+"T12:00:00Z");from.setUTCDate(from.getUTCDate()-(next==="7D"?6:29));
  setStart(from.toISOString().slice(0,10));
 }
 if(authLoading)return <div className="ai-status">Checking your session…</div>;
 if(!session)return <div className="ai-status"><h1>SIGN IN REQUIRED</h1><p>Lane Flow Intelligence is a signed-in workspace.</p><Link href="/login" className="ai-button">SIGN IN</Link></div>;
 return <div className="ai-shell">
  <div className="ai-workspace">
   <div className="ai-top">
    <div className="ai-top-inner">
     <div><div className="ai-wordmark">ALPHA <span>ALERTS</span></div><div className="ai-overline">FRUXLABS / RESEARCH INTELLIGENCE</div></div>
     <nav className="ai-top-actions" aria-label="Dashboard sections"><Link href="/" className="ai-link">ALPHA ALERTS HOME</Link><a href="#overview" className="ai-link">OVERVIEW</a><a href="#composition" className="ai-link">LANES</a><a href="#heatmap" className="ai-link">HEATMAP</a><a href="#lookup" className="ai-link">HISTORY</a><Link href="/dashboard/history" className="ai-link">SERVER HISTORY</Link><Link href="/dashboard/account" className="ai-link">ACCOUNT</Link><button onClick={()=>void signOut()} className="ai-text-button">SIGN OUT</button></nav>
    </div>
   </div>
   <main className="ai-main" id="overview">
    <div className="ai-title-row"><div><div className="ai-kicker">ALPHA / LANE ANALYTICS</div><h1>LANE FLOW INTELLIGENCE</h1><p>Telegram alert distribution, first appearances, transitions and market context. Historical observations only.</p></div><div className="ai-badge">{localCheck?"CHECKING LOCAL ARCHIVE":data?"ARCHIVE LOADED":"NO ARCHIVE LOADED"}</div></div>
    <div className="ai-import">
     <div><strong>PRIVATE ARCHIVE</strong><p>{data?`Loaded locally: ${importName} · ${data.summary.start} to ${data.summary.end}`:"Import the V4 archive once; it is saved only in this browser for future visits, not uploaded."}</p></div>
     <div className="ai-import-actions">
      {data&&<button type="button" className="ai-save-button" onClick={()=>void(storedOnDevice?forgetCurrentArchive():saveCurrentArchive())} disabled={storageBusy||localCheck} title="The archive stays on this browser only; it is never uploaded.">
       {storageBusy?"UPDATING…":storedOnDevice?"REMOVE SAVED COPY":"SAVE ON THIS DEVICE"}
      </button>}
      <button type="button" className="ai-button" onClick={()=>archiveFileRef.current?.click()}>IMPORT V4 ARCHIVE</button>
      <input ref={archiveFileRef} type="file" accept=".html,.json,text/html,application/json" onChange={loadFile} hidden tabIndex={-1}/>
     </div>
    </div>
    {error&&<p className="ai-error" role="alert">{error}</p>}
    {data&&<p className="ai-local-note" role="status">
     {storedOnDevice?"Saved privately to this browser. This archive will reload automatically for this signed-in account on this device.":"Archive is loaded for this visit. Browser storage is unavailable or was removed."} No data is uploaded.
    </p>}
    {localCheck?<div className="ai-empty ai-empty-loading" role="status"><span>◈</span><h2>CHECKING THIS DEVICE</h2><p>Looking for your previously saved private V4 archive…</p></div>:!data?<div className="ai-empty"><span>◈</span><h2>YOUR HISTORICAL INTELLIGENCE WORKSPACE</h2><p>Your earlier V4 test-site import does not transfer to alphaalerts.dev. Import the archive once on this device. Your browser will automatically save it for this signed-in account and restore it on later visits.</p><Link href="/dashboard/account" className="ai-link">Account & current bot controls</Link></div>:<>
     <div className="ai-filter"><span>HISTORICAL PERIOD · PACIFIC TIME</span><div className="ai-date"><label>FROM <input aria-label="Start date" type="date" value={start} min={data.summary.start} max={data.summary.end} onChange={e=>{setStart(e.target.value);setRange("ALL")}}/></label><label>TO <input aria-label="End date" type="date" value={end} min={data.summary.start} max={data.summary.end} onChange={e=>{setEnd(e.target.value);setRange("ALL")}}/></label></div><div className="ai-range">{(["7D","30D","ALL"] as const).map(r=><button className={range===r?"active":""} onClick={()=>selectRange(r)} key={r}>{r}</button>)}</div></div>
     <div className="ai-kpis">
      {[[ "ALERT EVENTS",eventTotal,"Repeats included"],["FIRST MINTS",firstTotal,"First appearances"],["OBSERVED HOURS",hours.length,"Hourly observations"],["PULSE KNOWN",pulseKnown,"Hours with matched state"]].map(([label,value,desc])=><div className="ai-metric" key={label}><span>{label}</span><strong>{fmt(Number(value))}</strong><small>{desc}</small></div>)}
     </div>
     <div className="ai-hero-grid">
      <Panel title="LANE VOLUME / TREND" detail={`${days.length} SELECTED DAYS`} className="ai-chart-panel"><p className="ai-panel-desc">Published alert events (gold) versus first mint appearances (blue). No price or P&amp;L inference.</p>
       <div className="ai-volume" role="img" aria-label="Daily alert volume and first appearances">
        {daysSorted.map((d,i)=><div className="ai-day-col" title={`${d.date_pt}: ${d.all_alerts} alerts; ${d.first_mints} first mints`} key={d.date_pt}><div className="ai-day-bars"><i style={{height:`${100*n(d.all_alerts)/maxDaily}%`,background:"#eabe76"}}/><i style={{height:`${100*n(d.first_mints)/maxDaily}%`,background:"#69aee2"}}/></div>{(i===0||i===daysSorted.length-1||i%Math.max(1,Math.ceil(daysSorted.length/7))===0)&&<span>{d.date_pt.slice(5)}</span>}</div>)}
       </div><div className="ai-legend"><span><i style={{background:"#eabe76"}}/>All alerts</span><span><i style={{background:"#69aee2"}}/>First appearances</span></div>
      </Panel>
      <div className="ai-side">
       <Panel title="LANE ALLOCATION" detail="PUBLISHED EVENTS"><Bars rows={LANES.map(l=>({label:l,value:totals[l],color:COLORS[l]}))} max={maxLane}/></Panel>
       <Panel title="PULSE CONTEXT" detail="MATCHED HOURLY STATES"><div className="ai-regimes">{regimeCounts.map(([mode,count])=><div key={mode}><span>{mode.replaceAll("_"," ")}</span><strong>{fmt(count)} h</strong></div>)}</div><p className="ai-note">Unknown states are shown separately. Observations are not validated trading predictions.</p></Panel>
      </div>
     </div>
     <div className="ai-middle">
      <Panel title="RECENT FIRST ALERTS" detail="SELECTED PERIOD"><div className="ai-table-wrap"><table><thead><tr><th>FIRST SEEN (PT)</th><th>TOKEN</th><th>LANE</th><th>FIRST MC</th><th>MSGS</th><th>SOURCE</th></tr></thead><tbody>{firstRows.slice(0,8).map(r=><tr key={r.mint}><td>{r.date}</td><td className="ai-token">{r.symbol}</td><td><span className="ai-lane-chip" style={{color:COLORS[r.lane as Lane]||"#bbc3c6"}}>{r.lane}</span></td><td>{formatMoney(r.mc)}</td><td>{r.alerts}</td><td>{trustedTelegram(r.url)?<a target="_blank" rel="noopener noreferrer" href={trustedTelegram(r.url)!}>TELEGRAM</a>:"—"}</td></tr>)}</tbody></table>{!firstRows.length&&<div className="ai-nodata">No first alerts for this range.</div>}</div></Panel>
      <Panel title="LANE SHARE" detail="OF SELECTED ALERT EVENTS"><div className="ai-share"><div className="ai-donut" style={{background:eventTotal?`conic-gradient(${LANES.map((l,i)=>{const before=LANES.slice(0,i).reduce((s,k)=>s+totals[k],0)/eventTotal*100;return `${COLORS[l]} ${before}% ${(before+totals[l]/eventTotal*100)}%`}).join(",")})`:"#313941"}}><div><strong>{fmt(eventTotal)}</strong><small>ALERTS</small></div></div><div className="ai-share-legend">{LANES.map(l=><div key={l}><i style={{background:COLORS[l]}}/><span>{l}</span><strong>{eventTotal?(totals[l]/eventTotal*100).toFixed(1):"0.0"}%</strong></div>)}</div></div></Panel>
     </div>
     <div className="ai-research-title" id="composition"><h2>DEEP RESEARCH / LANE INTELLIGENCE</h2><p>SAME ARCHIVE · READ-ONLY OBSERVATIONS</p></div>
     <div className="ai-middle">
      <Panel title="DAILY LANE COMPOSITION" detail="REPEATED EVENTS INCLUDED"><div className="ai-composition">{daysSorted.map(d=><div className="ai-composition-row" key={d.date_pt}><span>{d.date_pt.slice(5)}</span><div className="ai-stack">{LANES.map(l=><i key={l} title={`${l}: ${n(d[l])}`} style={{width:`${n(d.all_alerts)?100*n(d[l])/n(d.all_alerts):0}%`,background:COLORS[l]}}/>)}</div><strong>{fmt(n(d.all_alerts))}</strong></div>)}</div></Panel>
      <Panel id="transitions" title="LANE TRANSITIONS" detail="FULL ARCHIVE" className="ai-transition-panel"><Bars max={Math.max(1,...data.transitions.map(t=>n(t.event_n)))} rows={[...data.transitions].sort((a,b)=>n(b.event_n)-n(a.event_n)).slice(0,12).map(t=>({label:`${t.from_lane} → ${t.to_lane}`,value:n(t.event_n),color:"#c7a56c"}))}/><p className="ai-note">Sequences are observed alert transitions, not independent executable returns.</p></Panel>
     </div>
     <Panel id="heatmap" title="SESSION ACTIVITY / HEATMAP" detail="PACIFIC TIME" className="ai-heat" ><div className="ai-heat-controls"><label>LANE <select value={hourLane} onChange={e=>setHourLane(e.target.value)}><option value="ALL">ALL LANES</option>{LANES.map(l=><option key={l}>{l}</option>)}</select></label><label>MEASURE <select value={hourMode} onChange={e=>setHourMode(e.target.value)}><option>ALL MESSAGES</option><option>FIRST APPEARANCES</option></select></label></div><div className="ai-heat-scroll"><div className="ai-heat-grid"><div className="ai-heat-label">DAY</div>{Array.from({length:24},(_,h)=><span className="ai-heat-label" key={h}>{String(h).padStart(2,"0")}</span>)}{heat.map((row,i)=><div className="ai-heat-row" key={i}><span className="ai-heat-label">{["SUN","MON","TUE","WED","THU","FRI","SAT"][i]}</span>{row.map((v,h)=><div className="ai-heat-cell" key={h} style={{background:v?`rgba(105,174,226,${Math.max(.11,v/heatMax*.87)})`:"#15191d"}} title={`${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]} ${h}:00 PT: ${v.toFixed(2)} per observed hour`}>{v?v.toFixed(v<10?1:0):""}</div>)}</div>)}</div></div><p className="ai-note">Session gates and deployment changes can distort quiet-hour patterns. Empty cells are not zero-market-activity evidence.</p></Panel>
     <div className="ai-middle">
      <Panel title="PULSE / CONDITIONS" detail="FULL ARCHIVE REGIME GROUPS"><div className="ai-table-wrap"><table><thead><tr><th>REGIME</th><th>HOURS</th><th>EARLY/H</th><th>RECLAIM/H</th><th>RUNNER/H</th></tr></thead><tbody>{data.regimes.map(r=><tr key={r.mode}><td>{r.mode}</td><td>{fmt(r.hours)}</td><td>{r.early_per_hour.toFixed(2)}</td><td>{r.reclaim_per_hour.toFixed(2)}</td><td>{r.runner_per_hour.toFixed(2)}</td></tr>)}</tbody></table></div></Panel>
      <Panel title="RESEARCH INTEGRITY" detail="CRITICAL QUALIFICATIONS"><p className="ai-integrity">The October 18 v1.08 release notes document qualified-alert suppression during THIN / NEUTRAL sessions. Apparent quiet periods may reflect the session gate, not underlying market activity.</p><p className="ai-note">First-in-export may not mean first-in-public. Elite Telegram links are private. No live quotes, P&amp;L, or predictive backtest claims are implied.</p></Panel>
     </div>
     <Panel id="lookup" title="FIRST-ALERT LOOKUP" detail={`${fmt(firstRows.length)} MATCHES`} className="ai-lookup" ><div className="ai-lookup-controls"><input aria-label="Search token or mint" placeholder="Search ticker or mint address…" value={search} onChange={e=>{setSearch(e.target.value);setExpanded(false)}}/><select value={lookupLane} aria-label="Filter lane" onChange={e=>{setLookupLane(e.target.value);setExpanded(false)}}><option value="ALL">ALL LANES</option>{LANES.map(l=><option key={l}>{l}</option>)}</select></div><div className="ai-table-wrap"><table><thead><tr><th>FIRST SEEN (PT)</th><th>TOKEN</th><th>LANE</th><th>FIRST MC</th><th>MESSAGES</th><th>SOURCE</th></tr></thead><tbody>{selectedRows.map(r=><tr key={r.mint}><td>{r.date}</td><td><div className="ai-token">{r.symbol}</div><small className="ai-mint">{r.mint.slice(0,7)}…{r.mint.slice(-5)}</small></td><td><span className="ai-lane-chip" style={{color:COLORS[r.lane as Lane]||"#bbc3c6"}}>{r.lane}</span></td><td>{formatMoney(r.mc)}</td><td>{r.alerts}</td><td>{trustedTelegram(r.url)?<a target="_blank" rel="noopener noreferrer" href={trustedTelegram(r.url)!}>VIEW ↗</a>:"—"}</td></tr>)}</tbody></table>{!selectedRows.length&&<div className="ai-nodata">No results match your filters.</div>}</div>{firstRows.length>100&&!expanded&&<button className="ai-more" onClick={()=>setExpanded(true)}>SHOW ALL {fmt(firstRows.length)} RESULTS</button>}</Panel>
    </>}
    <footer className="ai-footer"><span>© FRUXLABS / ALPHA ALERTS · HISTORICAL RESEARCH</span><span>PRIVATE DEVICE ARCHIVE · NO FINANCIAL ADVICE · NO LIVE DATA</span></footer>
   </main>
  </div>
 </div>;
}
