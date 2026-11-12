// @ts-nocheck
// Alpha History v0.1.2 — secure, bounded, delayed event-history API.
// Called only through Vercel's entitlement-checked server proxy.
const ROOT=Deno.env.get("SUPABASE_URL")||"";
const SECRET=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const HEADERS={"Content-Type":"application/json","Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const respond=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:HEADERS});
function constantTimeEqual(a:string,b:string):boolean {
 if(a.length!==b.length)return false;
 let delta=0;for(let i=0;i<a.length;i++)delta|=a.charCodeAt(i)^b.charCodeAt(i);
 return delta===0;
}
async function digest(v:string):Promise<string> {
 const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)));
 return Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function db(path:string,extra:Record<string,string>={}) {
 return fetch(ROOT+"/rest/v1/"+path,{headers:{
  apikey:SECRET,Authorization:"Bearer "+SECRET,Accept:"application/json",...extra
 },cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)});
}
Deno.serve(async(req:Request)=>{
 if(req.method!=="GET")return respond({state:"not_found"},404);
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(ROOT)||!SECRET)
  return respond({state:"unavailable"},503);
 const url=new URL(req.url),tier=url.searchParams.get("view");
 if(tier!=="owner"&&tier!=="subscriber")return respond({state:"forbidden"},403);
 const incoming=req.headers.get("x-alpha-tier");
 if(incoming!==tier)return respond({state:"forbidden"},403);
 const gateway=req.headers.get("x-alpha-gateway")||"";
 if(!/^[a-f0-9]{64}$/.test(gateway))return respond({state:"forbidden"},403);
 const cursorRaw=url.searchParams.get("cursor");
 const limitString=url.searchParams.get("limit")??"50";
 if(!/^[1-9][0-9]{0,2}$/.test(limitString)||Number(limitString)>100 ||
   (cursorRaw!==null&&!/^[A-Za-z0-9_-]{8,512}$/.test(cursorRaw)))
  return respond({state:"invalid_pagination"},400);
 const limit=Number(limitString);
 let cursor:null|[string,string]=null;
 if(cursorRaw!==null){
  try{
   const padded=cursorRaw.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(cursorRaw.length/4)*4,"=");
   const value=JSON.parse(atob(padded));
   if(!Array.isArray(value)||value.length!==2||typeof value[0]!=="string"||
    typeof value[1]!=="string"||
    !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|\\+00:00)$/.test(value[0])||
    !Number.isFinite(Date.parse(value[0]))||!/^[A-Za-z0-9_-]{8,180}$/.test(value[1]))
    return respond({state:"invalid_pagination"},400);
   cursor=[value[0],value[1]];
  }catch{return respond({state:"invalid_pagination"},400);}
 }
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+\/=\-]{24,8192}$/.test(bearer))
  return respond({state:"unauthorized"},401);
 try {
  // Gateway secret is verified by its SHA-256 without returning the secret.
  const config=await db("alpha_intelligence_gateway?select=token_sha256&id=eq.1&limit=1");
  if(!config.ok)return respond({state:"unavailable"},503);
  const rows=await config.json();
  if(rows.length!==1||!constantTimeEqual(await digest(gateway),rows[0].token_sha256))
   return respond({state:"forbidden"},403);
  // This authenticates the user. Vercel's alphaAccess additionally checks
  // the real /me subscription plan or the exact owner ID before forwarding.
  const auth=await fetch(ROOT+"/auth/v1/user",{headers:{apikey:SECRET,Authorization:bearer},
   cache:"no-store",redirect:"error",signal:AbortSignal.timeout(5500)});
  if(!auth.ok)return respond({state:"unauthorized"},401);
  const user=await auth.json();
  if(typeof user?.id!=="string"||!/^[0-9a-f-]{36}$/.test(user.id))
   return respond({state:"unauthorized"},401);
  const fields="event_id,event_at,symbol,mint,lane,alert_mc,liquidity_usd,m5_tx,proof_kind,outcome_status,observed_max_multiple,public_delivery_verified";
  const cutoff=tier==="subscriber"?new Date(Date.now()-86400000).toISOString():null;
  const countQuery=new URLSearchParams({select:"event_id",approved_for_history:"eq.true",limit:"1"});
  if(cutoff)countQuery.set("event_at","lt."+cutoff);
  const counted=await db("alpha_history_events?"+countQuery.toString(),{"Prefer":"count=exact"});
  if(!counted.ok)return respond({state:"unavailable"},503);
  const match=/\/(\d+)$/.exec(counted.headers.get("content-range")||"");
  if(!match)return respond({state:"unavailable"},503);
  const total=Number(match[1]);
  if(!Number.isSafeInteger(total))return respond({state:"unavailable"},503);
  const query=new URLSearchParams({select:fields,approved_for_history:"eq.true",
   order:"event_at.desc,event_id.desc",limit:String(limit+1)});
  if(cutoff)query.set("event_at","lt."+cutoff);
  if(cursor){
   // Point-in-time seek: never OFFSET against an evolving history table.
   query.set("or",`(event_at.lt.${cursor[0]},and(event_at.eq.${cursor[0]},event_id.lt.${cursor[1]}))`);
  }
  const response=await db("alpha_history_events?"+query.toString());
  if(!response.ok)return respond({state:"unavailable"},503);
  const body=await response.json();
  if(!Array.isArray(body)||body.length>limit+1)return respond({state:"unavailable"},503);
  const events=body.slice(0,limit),has_more=body.length>limit;
  const last=events.at(-1);
  const next_cursor=has_more&&last?
   btoa(JSON.stringify([last.event_at,last.event_id])).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""):null;
  return respond({state:"ready",tier,delay_hours:tier==="subscriber"?24:0,
   proof_notice:"POST_SEND_RUNTIME_CORRELATION is not independently verified public Telegram delivery",
   total,limit,has_more,next_cursor,events});
 }catch{return respond({state:"unavailable"},503);}
});
