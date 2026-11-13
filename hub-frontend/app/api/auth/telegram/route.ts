import {NextRequest,NextResponse} from "next/server";
import {alphaAccess} from "@/lib/alpha-access";
import {validateTelegramInitData} from "@/lib/telegram-init-data";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const securityHeaders={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const send=(state:string,status:number,extra:Record<string,unknown>={})=>
 NextResponse.json({state,...extra},{status,headers:securityHeaders});
export async function POST(request:NextRequest){
 const length=Number(request.headers.get("content-length")||"0");
 if(length>6000)return send("invalid_request",400);
 let incoming:{mode?:string;initData?:string};
 try{incoming=await request.json()}catch{return send("invalid_request",400)}
 if(incoming?.mode!=="link"&&incoming?.mode!=="exchange")return send("invalid_request",400);
 if(typeof incoming.initData!=="string")return send("unauthorized",401);
 const botId=process.env.ALPHA_TELEGRAM_BOT_ID||"";
 const tg=validateTelegramInitData(incoming.initData,botId);
 if(!tg)return send(botId?"unauthorized":"unavailable",botId?401:503);
 const origin=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
 const gateway=process.env.ALPHA_INSIGHTS_GATEWAY_TOKEN||"";
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin)||!anon||!gateway)return send("unavailable",503);
 let currentToken:string|undefined;
 if(incoming.mode==="link"){
  const a=await alphaAccess(request);
  if(a.level!=="owner"&&a.level!=="subscriber")return send(a.level,a.status);
  currentToken=a.token;
 }
 // The separate Supabase function owns the service-role admin API. No service
 // role key or magic-link token ever enters this Next.js process or browser.
 try{
  const reply=await fetch(origin+"/functions/v1/alpha-telegram",{
   method:"POST",cache:"no-store",redirect:"error",
   headers:{"Content-Type":"application/json","apikey":anon,
    "x-alpha-gateway":gateway,...(currentToken?{Authorization:"Bearer "+currentToken}:{})},
   body:JSON.stringify({mode:incoming.mode,initData:incoming.initData}),
   signal:AbortSignal.timeout(10000)
  });
  const body=await reply.json();
  if(!reply.ok)return send(reply.status===401?"unauthorized":reply.status===403?"forbidden":body?.state==="not_linked"?"not_linked":"unavailable",
   reply.status===401?401:reply.status===403?403:reply.status===409?409:503);
  if(incoming.mode==="link")return send("linked",200);
  const tokens=body?.session;
  if(!tokens||typeof tokens.access_token!=="string"||typeof tokens.refresh_token!=="string")return send("unavailable",503);
  const access=await alphaAccess(new Request(request.url,{headers:{Authorization:"Bearer "+tokens.access_token}}));
  if(access.level!=="owner"&&access.level!=="subscriber")
   return send(access.level==="unavailable"?"unavailable":"forbidden",access.status===503?503:403);
  return send("authenticated",200,{level:access.level,session:{
    access_token:tokens.access_token,refresh_token:tokens.refresh_token}});
 }catch{return send("unavailable",503)}
}
