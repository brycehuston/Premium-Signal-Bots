// @ts-nocheck
// Alpha Telegram Mini App Auth v0.1.0 — fail-closed trusted-account linking.
// This *new* endpoint never weakens alpha-history v0.1.2 or exposes service_role.
const ROOT=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ANON=Deno.env.get("SUPABASE_ANON_KEY")||"";
const BOT_ID=Deno.env.get("ALPHA_TELEGRAM_BOT_ID")||"";
const TG_PUBLIC="e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";
const H={"Content-Type":"application/json","Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const response=(state,status=200,extra={})=>new Response(JSON.stringify({state,...extra}),{status,headers:H});
function hex(bytes){return Uint8Array.from(bytes.match(/../g).map(x=>parseInt(x,16)))}
async function sha256(value){const raw=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(raw)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function same(a,b){if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let xor=0;for(let i=0;i<a.length;i++)xor|=a.charCodeAt(i)^b.charCodeAt(i);return xor===0}
async function telegramUser(raw){
 if(typeof raw!=="string"||raw.length<50||raw.length>4096||!/^[1-9][0-9]{4,19}$/.test(BOT_ID))return null;
 try{
  const seen=new Set(),p=new URLSearchParams(raw),fields=[];let sig="",auth="",user="";
  for(const [key,value] of p){
   if(seen.has(key)||key.length>80||value.length>2500)return null;
   seen.add(key);if(key==="signature"){sig=value;continue}
   if(key==="hash")continue;
   fields.push(key+"="+value);
   if(key==="auth_date")auth=value;
   if(key==="user")user=value;
  }
  if(!/^[0-9]{10,11}$/.test(auth)||!user||!/^[A-Za-z0-9_-]{80,110}$/.test(sig))return null;
  const ts=Number(auth),now=Math.floor(Date.now()/1000);
  if(!Number.isSafeInteger(ts)||ts>now+30||now-ts>120)return null;
  const signature=Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(sig.length/4)*4,"=")),x=>x.charCodeAt(0));
  if(signature.length!==64)return null;
  const pub=await crypto.subtle.importKey("raw",hex(TG_PUBLIC),{name:"Ed25519"},false,["verify"]);
  const signed=BOT_ID+":WebAppData\n"+fields.sort().join("\n");
  if(!await crypto.subtle.verify("Ed25519",pub,signature,new TextEncoder().encode(signed)))return null;
  const payload=JSON.parse(user);
  if(!Number.isSafeInteger(payload?.id)||payload.id<1||String(payload.id).length>16)return null;
  return String(payload.id);
 }catch{return null}
}
async function call(path,opts={},key=SERVICE){
 return fetch(ROOT+"/auth/v1/"+path,{
  ...opts,headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json",...(opts.headers||{})},
  redirect:"error",cache:"no-store",signal:AbortSignal.timeout(6500)});
}
Deno.serve(async req=>{
 if(req.method!=="POST")return response("not_found",404);
 if(Number(req.headers.get("content-length")||0)>6000)return response("invalid_request",400);
 if(!ROOT.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i)||!SERVICE||!ANON||!/^[1-9][0-9]{4,19}$/.test(BOT_ID))
  return response("unavailable",503);
 let body;
 try{body=await req.json()}catch{return response("invalid_request",400)}
 if((body?.mode!=="link"&&body?.mode!=="exchange")||typeof body?.initData!=="string")
  return response("invalid_request",400);
 const tid=await telegramUser(body.initData);
 if(!tid)return response("unauthorized",401);
 const gateway=req.headers.get("x-alpha-gateway")||"";
 if(!/^[a-f0-9]{64}$/.test(gateway))return response("forbidden",403);
 try{
  const r=await fetch(ROOT+"/rest/v1/alpha_intelligence_gateway?select=token_sha256&id=eq.1&limit=1",{
   headers:{"apikey":SERVICE,Authorization:"Bearer "+SERVICE,Accept:"application/json"},
   cache:"no-store",redirect:"error",signal:AbortSignal.timeout(5000)});
  if(!r.ok)return response("unavailable",503);
  const list=await r.json();
  if(list.length!==1||!same(await sha256(gateway),list[0].token_sha256))return response("forbidden",403);
  // Existing identity only. NO signup, NO trust of user_metadata or Telegram username.
  const usersResp=await call("admin/users?page=1&per_page=1000");
  if(!usersResp.ok)return response("unavailable",503);
  const data=await usersResp.json();
  if(!Array.isArray(data?.users)||data.users.length>=1000)return response("unavailable",503);
  const matches=data.users.filter(x=>x?.app_metadata?.alpha_telegram_user_id===tid);
  if(matches.length>1)return response("conflict",409);
  if(body.mode==="link"){
   const bearer=req.headers.get("authorization")||"";
   if(!/^Bearer [A-Za-z0-9._~+\/=\-]{24,8192}$/.test(bearer))return response("unauthorized",401);
   const resp=await fetch(ROOT+"/auth/v1/user",{headers:{"apikey":SERVICE,Authorization:bearer},
    redirect:"error",cache:"no-store",signal:AbortSignal.timeout(5000)});
   if(!resp.ok)return response("unauthorized",401);
   const user=await resp.json();
   if(!/^[0-9a-f-]{36}$/.test(user?.id||""))return response("unauthorized",401);
   if(matches.length && matches[0].id!==user.id)return response("conflict",409);
   const existing=data.users.find(x=>x.id===user.id);
   if(!existing||existing.is_anonymous||existing.deleted_at||existing.banned_until&&Date.parse(existing.banned_until)>Date.now())
    return response("forbidden",403);
   if(existing.app_metadata?.alpha_telegram_user_id &&
      existing.app_metadata.alpha_telegram_user_id!==tid)return response("conflict",409);
   if(!existing.app_metadata?.alpha_telegram_user_id){
    const changed=await call("admin/users/"+user.id,{
     method:"PUT",body:JSON.stringify({app_metadata:{...existing.app_metadata,alpha_telegram_user_id:tid}})
    });
    if(!changed.ok)return response("unavailable",503);
   }
   return response("linked",200);
  }
  if(matches.length!==1)return response("not_linked",403);
  const user=matches[0];
  if(!user.email||!user.email_confirmed_at||user.is_anonymous||user.deleted_at||
      user.banned_until&&Date.parse(user.banned_until)>Date.now())return response("forbidden",403);
  const link=await call("admin/generate_link",{method:"POST",body:JSON.stringify({type:"magiclink",email:user.email})});
  if(!link.ok)return response("unavailable",503);
  const ticket=await link.json();
  if(ticket.id!==user.id||!/^[-a-f0-9]{32,128}$/.test(ticket.hashed_token||""))
   return response("unavailable",503);
  const verified=await call("verify",{method:"POST",body:JSON.stringify({type:"magiclink",token_hash:ticket.hashed_token})},ANON);
  if(!verified.ok)return response("unavailable",503);
  const session=await verified.json();
  if(typeof session.access_token!=="string"||typeof session.refresh_token!=="string"||session.user?.id!==user.id)
   return response("unavailable",503);
  return response("authenticated",200,{session:{access_token:session.access_token,refresh_token:session.refresh_token}});
 }catch{return response("unavailable",503)}
});