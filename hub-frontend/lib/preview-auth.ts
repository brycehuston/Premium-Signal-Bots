import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
export const previewHeaders={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
export function previewResponse(payload:unknown,status=200){return NextResponse.json(payload,{status,headers:previewHeaders});}
export async function previewClient(request:Request){
 const authorization=request.headers.get("authorization")??"";
 const token=/^Bearer ([A-Za-z0-9._~+/-]{24,8192})$/.exec(authorization)?.[1];
 if(!token)return {state:"unauthorized" as const};
 const origin=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"";
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin)||!anon)return {state:"unavailable" as const};
 try{
  const client=createClient(origin,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
  const {data,error}=await client.auth.getUser(token);
  if(error||!data.user||!data.user.id)return {state:"unauthorized" as const};
  return {state:"ready" as const,client};
 }catch{return {state:"unavailable" as const}}
}
