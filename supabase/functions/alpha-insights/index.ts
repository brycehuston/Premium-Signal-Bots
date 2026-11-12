import { authorizePrivateTier } from "./tier-auth.ts";
// Private Alpha Alerts intelligence gateway; pubic view intentionally fail-closed.
const URL_=Deno.env.get("SUPABASE_URL")||"", KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PUB="f1c11839ae78d92f8dcd0b228aff18120423d8ff6199f0a2e247f2d8057027e0";
const SHA="8bcde2636e21a3c31ad9ee83ec300261038a49f957e6593e22af2b6516018c9c";
const JSON_HEADERS={"Content-Type":"application/json","Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const reply=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:JSON_HEADERS});
const bytes=(s:string)=>Uint8Array.from(s.match(/.{2}/g)??[],x=>parseInt(x,16));
const sha=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
const cmp=(a:string,b:string)=>{if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;};
async function db(path:string,opt:RequestInit={}) {
 return await fetch(URL_+"/rest/v1/"+path,{...opt,headers:{apikey:KEY,Authorization:"Bearer "+KEY,...opt.headers},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(6000)});
}
async function verify(payload:string,signature:string) {
 if(!/^[0-9a-f]{128}$/i.test(signature))return false;
 try{
  const key=await crypto.subtle.importKey("raw",bytes(PUB),{name:"Ed25519"},false,["verify"]);
  return await crypto.subtle.verify({name:"Ed25519"},key,bytes(signature),new TextEncoder().encode(payload));
 }catch{return false;}
}
const lanes=new Set(["EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"]);
const count=(x:any)=>typeof x==="number"&&Number.isSafeInteger(x)&&x>=0&&x<=1e8;
function validate(v:any) {
 if(!v||typeof v!=="object"||v.schema_version!==1||v.state!=="staging_aggregate_only"||
 v.producer_sha256!==SHA||v.source_type!=="POST_SEND_CSV_RUNTIME_CORRELATION_NOT_PUBLIC_DELIVERY_PROOF"||
 v.quality?.has_public_delivery_proof!==false||v.quality?.has_verified_peak_outcomes!==false||
 v.owner?.state!=="ready"||v.owner?.tier!=="owner"||v.subscriber?.state!=="ready"||
 v.subscriber?.tier!=="subscriber"||v.subscriber?.delay_hours!==24)return false;
 const at=Date.parse(v.as_of_utc),cut=Date.parse(v.subscriber.as_of_utc);
 if(!Number.isFinite(at)||Math.abs(Date.now()-at)>15*60_000||
 !Number.isFinite(cut)||Math.abs((at-cut)-24*3600_000)>60_000)return false;
 const o=v.owner.dataset,s=v.subscriber;
 if(!o||!Array.isArray(o.daily)||o.daily.length>4000||!Array.isArray(o.hourly)||o.hourly.length>90000||
 !Array.isArray(o.first)||o.first.length!==0||!Array.isArray(o.regimes)||o.regimes.length!==0||
 !Array.isArray(o.transitions)||o.transitions.length!==0||
 !o.summary||!count(o.summary.messages)||!count(o.summary.mint)||!count(o.summary.lane)||
 o.summary.messages!==o.summary.lane||
 !Array.isArray(s.daily)||s.daily.length>8||!Array.isArray(s.lanes)||s.lanes.length>6||
 !s.summary||!count(s.summary.events_7d)||!count(s.summary.first_mints_7d)||!count(s.summary.active_days)||
 Object.hasOwn(s,"first")||Object.hasOwn(s,"dataset"))return false;
 if(!o.daily.every((d:any)=>d&&/^\d{4}-\d{2}-\d{2}$/.test(d.date_pt)&&count(d.all_alerts)&&count(d.first_mints)&&Array.from(lanes).every(l=>count(d[l]))))return false;
 if(!o.hourly.every((d:any)=>d&&/^\d{4}-\d{2}-\d{2}$/.test(d.date_pt)&&Number.isInteger(d.clock_hour_pt)&&d.clock_hour_pt>=0&&d.clock_hour_pt<=23&&count(d.all_alerts)&&count(d.first_mints)&&typeof d.pulse_mode==="string"))return false;
 if(!s.daily.every((d:any)=>d&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&count(d.alerts)&&count(d.first_mints)))return false;
 if(!s.lanes.every((d:any)=>d&&lanes.has(d.lane)&&count(d.count)))return false;
 if(o.daily.reduce((n:number,d:any)=>n+d.all_alerts,0)!==o.summary.messages||
 s.daily.reduce((n:number,d:any)=>n+d.alerts,0)!==s.summary.events_7d)return false;
 return true;
}

// Public marketing endpoint uses bot-delivered calls, not a claim of public-channel delivery.
function validPublic(report:any,now:number) {
 if(!report||report.state!=="verified"||!["24h","historical"].includes(report.window)||
 report.telegram_delivery_confirmed!==true||report.observed_peaks_corroborated!==true||
 report.method!=="BOT_DELIVERY_AND_REPEATED_DEXSCREENER_PAIR_SNAPSHOTS"||
 !Array.isArray(report.movers)||report.movers.length!==3)return false;
 const ref=Date.parse(report.reference_time_utc),asof=Date.parse(report.as_of_utc);
 if(!Number.isFinite(ref)||!Number.isFinite(asof)||ref>now||now-ref>90*86400_000||
 Math.abs(now-asof)>15*60_000 || (report.window==="historical"&&now-ref<24*3600_000))return false;
 const seen=new Set<string>();
 for(const m of report.movers){
  if(!m||typeof m.id!=="string"||!/^[a-f0-9]{24}$/.test(m.id)||seen.has(m.id)||
   typeof m.symbol!=="string"||!/^[a-zA-Z0-9._-]{1,28}$/.test(m.symbol)||
   !lanes.has(m.lane)||typeof m.called_at_utc!=="string")return false;
  seen.add(m.id);
  const called=Date.parse(m.called_at_utc);
  if(!Number.isFinite(called)||called>now-30*60_000||called>ref||
   (report.window==="24h"&&called<now-24*3600_000)||
   (report.window==="historical"&&called<ref-24*3600_000))return false;
  if(![m.first_mc,m.peak_mc,m.multiple].every((x:unknown)=>typeof x==="number"&&Number.isFinite(x))||
   m.first_mc<=0||m.peak_mc<m.first_mc||m.peak_mc>1e13||m.multiple<1||
   Math.abs(m.multiple-m.peak_mc/m.first_mc)>Math.max(0.015,m.multiple*0.005))return false;
 }
 return true;
}

async function ingest(req:Request) {
 const text=await req.text();if(text.length>350_000)return reply({state:"too_large"},413);
 let e:any,v:any;try{e=JSON.parse(text);if(typeof e.signed_body!=="string"||typeof e.signature!=="string")return reply({state:"invalid"},400);
 if(!(await verify(e.signed_body,e.signature)))return reply({state:"unauthorized"},403);
 v=JSON.parse(e.signed_body);if(!validate(v)|| (v.public_report!==undefined&&!validPublic(v.public_report,Date.now())))return reply({state:"invalid_dataset"},422);
 }catch{return reply({state:"invalid"},400);}
 const last=await db("alpha_intelligence_snapshot?select=captured_at&id=eq.1&limit=1");
 if(!last.ok)return reply({state:"storage_unavailable"},503);
 const prev=await last.json();if(prev.length&&Date.parse(prev[0].captured_at)>=Date.parse(v.as_of_utc))return reply({state:"stale_replay"},409);
 const row={id:1,captured_at:v.as_of_utc,producer_sha256:v.producer_sha256,owner_dataset:v.owner.dataset,subscriber_report:v.subscriber,public_movers:v.public_report??null,quality:v.quality,received_at:new Date().toISOString()};
 const r=await db("alpha_intelligence_snapshot?on_conflict=id",{method:"POST",headers:{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(row)});
 return r.ok?reply({state:"accepted",accepted:true,as_of_utc:v.as_of_utc}):reply({state:"storage_unavailable"},503);
}
async function read(req:Request,view:"owner"|"subscriber") {
 const credential=req.headers.get("x-alpha-gateway")||"";
 if(!/^[0-9a-f]{64}$/.test(credential))return reply({state:"forbidden"},403);
 const auth=await db("alpha_intelligence_gateway?select=token_sha256&id=eq.1&limit=1");if(!auth.ok)return reply({state:"unavailable"},503);
 const rows=await auth.json();if(!rows.length||!cmp(await sha(credential),rows[0].token_sha256))return reply({state:"forbidden"},403);
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+\/=-]{24,8192}$/.test(bearer)||req.headers.get("x-alpha-tier")!==view)return reply({state:"forbidden"},403);
 const user=await fetch(URL_+"/auth/v1/user",{headers:{apikey:KEY,Authorization:bearer},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(5500)});
 if(!user.ok)return reply({state:"unauthorized"},401);
 const identity=await user.json();const id=identity?.id;
 if(typeof id!=="string"||!/^[0-9a-f-]{36}$/.test(id))return reply({state:"unauthorized"},401);
 const decision=await authorizePrivateTier(view,{id,email:typeof identity?.email==="string"?identity.email:null},bearer,db,fetch,Deno.env.get("ALPHA_MEMBERSHIP_API_BASE")||"https://premium-signal-bots.onrender.com");
 if(decision!=="allowed")return reply({state:decision},decision==="forbidden"?403:503);
 const state=await db("alpha_intelligence_snapshot?select=captured_at,owner_dataset,subscriber_report&id=eq.1&limit=1");
 if(!state.ok)return reply({state:"unavailable"},503);
 const records=await state.json();if(!records.length)return reply({state:"unavailable"},503);
 const data=records[0];if(Date.now()-Date.parse(data.captured_at)>30*60_000)return reply({state:"stale",as_of_utc:data.captured_at},503);
 if(view==="owner")return reply({state:"ready",tier:"owner",as_of_utc:data.captured_at,dataset:data.owner_dataset});
 const r=data.subscriber_report;if(r?.tier!=="subscriber"||r?.delay_hours!==24)return reply({state:"unavailable"},503);
 return reply(r);
}
Deno.serve(async req=>{
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(URL_)||!KEY)return reply({state:"unavailable"},503);
 const view=new URL(req.url).searchParams.get("view");
 try{
  if(view==="ingest"&&req.method==="PUT")return await ingest(req);
  if(req.method==="GET"&&(view==="owner"||view==="subscriber"))return await read(req,view);
  if(req.method==="GET"&&view==="public"){
   const snapshot=await db("alpha_intelligence_snapshot?select=captured_at,public_movers&id=eq.1&limit=1");
   if(!snapshot.ok)return reply({state:"unavailable",window:"24h",movers:[]},503);
   const records=await snapshot.json();
   if(!records.length||Date.now()-Date.parse(records[0].captured_at)>30*60_000)return reply({state:"unavailable",window:"24h",movers:[]});
   const data=records[0].public_movers;
   return validPublic(data,Date.now())?reply(data):reply({state:"unavailable",window:"24h",movers:[]});
  }
  return reply({state:"not_found"},404);
 }catch{return reply({state:"unavailable"},503);}
});
