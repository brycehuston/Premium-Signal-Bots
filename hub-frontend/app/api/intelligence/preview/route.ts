import {previewClient,previewResponse} from "@/lib/preview-auth";
export const runtime="nodejs";export const dynamic="force-dynamic";
async function handle(request:Request,start:boolean){
 const auth=await previewClient(request);
 if(auth.state==="unauthorized")return previewResponse({state:"unauthorized"},401);
 if(auth.state==="unavailable")return previewResponse({state:"unavailable"},503);
 try{
  const {data,error}=await auth.client.rpc(start?"alpha_lane_preview_start":"alpha_lane_preview_status");
  if(error||!data||typeof data.state!=="string")return previewResponse({state:"unavailable"},503);
  if(!["eligible","active","expired"].includes(data.state))return previewResponse({state:"unavailable"},503);
  return previewResponse(data);
 }catch{return previewResponse({state:"unavailable"},503)}
}
export async function GET(request:Request){return handle(request,false)}
export async function POST(request:Request){return handle(request,true)}
