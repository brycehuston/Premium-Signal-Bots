// Alpha Alerts Ed25519 signed public feed. No shared secrets leave the VPS.
// Public GET and signed PUT only; protected Postgres state, RLS enabled.
const enc = new TextEncoder();
const ROOT = (Deno.env.get("SUPABASE_URL") || "") + "/rest/v1";
const ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const LANES = new Set(["EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"]);
const FIELDS = ["alert_mc","approved_for_public","delivery_status","event_id","lane","liquidity_usd","m5_tx","score","symbol","timestamp_utc"].sort().join("|");
const reply = (body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}});
const bytes = (hex:string)=>new Uint8Array((hex.match(/.{2}/g)||[]).map(s=>Number.parseInt(s,16)));
async function getRow(table:string) {
 const res=await fetch(ROOT+"/"+table+"?id=eq.1&select=*",{headers:{"apikey":ROLE,"authorization":"Bearer "+ROLE},cache:"no-store",signal:AbortSignal.timeout(3500)});
 if(!res.ok)throw Error("database unavailable");
 const value=await res.json();
 return Array.isArray(value)?value[0]:null;
}
async function verify(publicKeyHex:string,body:string,signatureHex:string):Promise<boolean> {
 if(!/^[a-f0-9]{64}$/.test(publicKeyHex)||!/^[a-f0-9]{128}$/.test(signatureHex))return false;
 try {
 const key=await crypto.subtle.importKey("raw",bytes(publicKeyHex),{name:"Ed25519"},false,["verify"]);
 return await crypto.subtle.verify("Ed25519",key,bytes(signatureHex),enc.encode(body));
 } catch{return false}
}
function inspect(envelope:unknown,now=Date.now()) {
 if(!envelope||typeof envelope!=="object"||Array.isArray(envelope))return null;
 const e=envelope as Record<string,unknown>;
 if(typeof e.signed_body!=="string"||enc.encode(e.signed_body).length>131072||typeof e.signature!=="string"||!/^[a-f0-9]{128}$/.test(e.signature))return null;
 let data:Record<string,unknown>;
 try {data=JSON.parse(e.signed_body)}catch{return null}
 if(!data||typeof data!=="object"||Array.isArray(data))return null;
 const t=Date.parse(String(data.updated_at_utc||""));
 if(data.version!==1||data.source!=="confirmed-telegram-delivery"||!Number.isFinite(t)||t<now-20*60000||t>now+60000||!Array.isArray(data.daily_alerts)||data.daily_alerts.length>500)return null;
 for(const item of data.daily_alerts) {
  if(!item||typeof item!=="object"||Array.isArray(item))return null;
  const row=item as Record<string,unknown>;
  if(Object.keys(row).sort().join("|")!==FIELDS)return null;
  if(!/^[a-f0-9]{32}$/.test(String(row.event_id))||!/^[A-Za-z0-9._-]{1,28}$/.test(String(row.symbol))||!LANES.has(String(row.lane))||row.approved_for_public!==true||row.delivery_status!=="DELIVERED")return null;
  if(typeof row.score!=="number"||!Number.isFinite(row.score)||row.score<0||row.score>10)return null;
  const alertTime=Date.parse(String(row.timestamp_utc));
  if(!Number.isFinite(alertTime)||alertTime>now-30*60000||alertTime<now-7*24*3600000)return null;
  for(const k of ["alert_mc","liquidity_usd"]){const n=row[k];if(n!==null&&(typeof n!=="number"||!Number.isFinite(n)||n<=0||n>=1e13))return null}
  if(row.m5_tx!==null&&(!Number.isSafeInteger(row.m5_tx)||Number(row.m5_tx)<0||Number(row.m5_tx)>1e9))return null;
 }
 return {body:e.signed_body,signature:e.signature,updatedAt:new Date(t).toISOString(),timestamp:t};
}
Deno.serve(async(req:Request)=>{
 if(req.method!=="GET"&&req.method!=="PUT")return reply({error:"method"},405);
 if(!ROLE||!Deno.env.get("SUPABASE_URL"))return reply({state:"unavailable"},503);
 try {
  const config=await getRow("alpha_public_feed_ed25519_config");
  if(!config||typeof config.public_key_hex!=="string")return reply({state:"unavailable"},503);
  if(req.method==="GET") {
   const stored=await getRow("alpha_public_feed_ed25519_state");
   const checked=inspect(stored&&{signed_body:stored.signed_body,signature:stored.signature});
   if(!checked||!await verify(config.public_key_hex,checked.body,checked.signature))return reply({state:"unavailable"},503);
   return reply({signed_body:checked.body,signature:checked.signature});
  }
  const length=Number(req.headers.get("content-length"));
  if(length>262144)return reply({error:"oversized"},413);
  const raw=await req.text();
  if(enc.encode(raw).length>262144)return reply({error:"oversized"},413);
  let payload:unknown;
  try{payload=JSON.parse(raw)}catch{return reply({error:"invalid"},400)}
  const checked=inspect(payload);
  if(!checked||!await verify(config.public_key_hex,checked.body,checked.signature))return reply({error:"invalid signature or stale data"},403);
  const prior=await getRow("alpha_public_feed_ed25519_state");
  if(prior&&Date.parse(prior.updated_at_utc)>=checked.timestamp)return reply({accepted:true,updated:false});
  const res=await fetch(ROOT+"/alpha_public_feed_ed25519_state?on_conflict=id",{
   method:"POST",
   headers:{"apikey":ROLE,"authorization":"Bearer "+ROLE,"content-type":"application/json","prefer":"resolution=merge-duplicates,return=minimal"},
   body:JSON.stringify({id:1,signed_body:checked.body,signature:checked.signature,updated_at_utc:checked.updatedAt}),
   signal:AbortSignal.timeout(3500)
  });
  if(!res.ok)return reply({error:"storage"},503);
  return reply({accepted:true,updated:true});
 }catch{return reply({state:"unavailable"},503)}
});