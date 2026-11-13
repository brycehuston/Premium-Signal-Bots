import { NextRequest,NextResponse } from "next/server";
import { alphaAccess } from "@/lib/alpha-access";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
export async function GET(request:NextRequest){
 const access=await alphaAccess(request);
 if(access.level!=="owner"&&access.level!=="subscriber")
  return NextResponse.json({state:access.level},{status:access.status,headers});
 const u=new URL(request.url);
 const cursor=u.searchParams.get("cursor"),ls=u.searchParams.get("limit")??"50";
 if(!/^[1-9][0-9]{0,2}$/.test(ls)||Number(ls)>100||
   (cursor!==null&&!/^[A-Za-z0-9_-]{8,512}$/.test(cursor)))
  return NextResponse.json({state:"invalid_pagination"},{status:400,headers});
 const origin=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"";
 const gateway=process.env.ALPHA_INSIGHTS_GATEWAY_TOKEN??"";
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin)||!anon||!gateway)
  return NextResponse.json({state:"unavailable"},{status:503,headers});
 try {
  const url=new URL(origin+"/functions/v1/alpha-history");
  url.searchParams.set("view",access.level);url.searchParams.set("limit",ls);
  if(cursor!==null)url.searchParams.set("cursor",cursor);
  const response=await fetch(url,{headers:{Authorization:"Bearer "+access.token,apikey:anon,
   "x-alpha-gateway":gateway,"x-alpha-tier":access.level,Accept:"application/json"},
   redirect:"error",cache:"no-store",signal:AbortSignal.timeout(9500)});
  if(!response.ok)return NextResponse.json({state:response.status===401?"unauthorized":response.status===403?"forbidden":"unavailable"},
   {status:response.status===401?401:response.status===403?403:503,headers});
  const data=await response.json();
  if(data?.state!=="ready"||data?.tier!==access.level||
   data?.delay_hours!==(access.level==="subscriber"?24:0)||
   !Number.isSafeInteger(data?.total)||!Array.isArray(data?.events)||
   data.events.length>Number(ls)||typeof data.has_more!=="boolean"||
   (data.next_cursor!==null&&!/^[A-Za-z0-9_-]{8,512}$/.test(data.next_cursor)))
   return NextResponse.json({state:"unavailable"},{status:503,headers});
  return NextResponse.json(data,{headers});
 }catch{return NextResponse.json({state:"unavailable"},{status:503,headers});}
}
