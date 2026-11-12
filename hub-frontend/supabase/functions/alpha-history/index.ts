// Alpha History v0.1.0 — secure, bounded, delayed event-history API.
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
 const offsetString=url.searchParams.get("offset")??"0";
 const limitString=url.searchParams.get("limit")??"50";
 if(!/^(0|[1-9][0-9]{0,5})$/.test(offsetString)||!/^(0|[1-9][0-9]{0,2})$/.test(limitString))
  return respond({state:"invalid_pagination"},400);
 const offset=Number(offsetString),limit=Number(limitString);
 if(limit<1||limit>100||offset>100000)return respond({state:"invalid_pagination"},400);
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
  const query=new URLSearchParams();
  query.set("select",fields);
  query.set("approved_for_history","eq.true");
  query.set("order","event_at.desc,event_id.desc");
  query.set("limit",String(limit));query.set("offset",String(offset));
  if(tier==="subscriber")
   query.set("event_at","lt."+new Date(Date.now()-86400000).toISOString());
  const response=await db("alpha_history_events?"+query.toString(),{"Prefer":"count=exact"});
  if(!response.ok)return respond({state:"unavailable"},503);
  const body=await response.json();
  const match=/\/(\d+)$/.exec(response.headers.get("content-range")||"");
  if(!Array.isArray(body)||body.length>limit||!match)return respond({state:"unavailable"},503);
  const total=Number(match[1]);
  if(!Number.isSafeInteger(total))return respond({state:"unavailable"},503);
  return respond({state:"ready",tier,delay_hours:tier==="subscriber"?24:0,
   proof_notice:"POST_SEND_RUNTIME_CORRELATION is not independently verified public Telegram delivery",
   total,offset,limit,has_more:offset+body.length<total,events:body});
 }catch{return respond({state:"unavailable"},503);}
});
