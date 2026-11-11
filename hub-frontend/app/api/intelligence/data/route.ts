import { NextRequest,NextResponse } from "next/server";
import { alphaAccess } from "@/lib/alpha-access";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const h={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
export async function GET(request:NextRequest){
 const access=await alphaAccess(request);
 if(access.level!=="owner"&&access.level!=="subscriber")return NextResponse.json({state:access.level},{status:access.status,headers:h});
 const origin=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"";
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin)||!anon)return NextResponse.json({state:"unavailable"},{status:503,headers:h});
 try{
  // Edge function repeats authentication + entitlement checks; it is not a trusted public cache.
  const response=await fetch(origin+"/functions/v1/alpha-insights?view="+access.level,{
    headers:{Authorization:"Bearer "+access.token,apikey:anon,Accept:"application/json"},
    cache:"no-store",redirect:"error",signal:AbortSignal.timeout(7500)
  });
  if(!response.ok)return NextResponse.json({state:response.status===403?"forbidden":"unavailable"},{status:response.status===403?403:503,headers:h});
  const data=await response.json();
  if(data?.state!=="ready"||data?.tier!==access.level)return NextResponse.json({state:"unavailable"},{status:503,headers:h});
  // A subscriber's request always returns only the delayed, aggregate-only payload.
  if(access.level==="subscriber"&&(data?.delay_hours<24||!!data?.dataset?.first))
   return NextResponse.json({state:"unavailable"},{status:503,headers:h});
  return NextResponse.json(data,{headers:h});
 }catch{return NextResponse.json({state:"unavailable"},{status:503,headers:h})}
}
