import {previewClient,previewResponse} from "@/lib/preview-auth";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 const auth=await previewClient(request);
 if(auth.state==="unauthorized")return previewResponse({state:"unauthorized"},401);
 if(auth.state==="unavailable")return previewResponse({state:"unavailable"},503);
 try{
  const {data,error}=await auth.client.rpc("alpha_lane_preview_data");
  if(error||!data||typeof data.state!=="string")return previewResponse({state:"unavailable"},503);
  if(data.state!=="active")return previewResponse({state:data.state},403);
  if(data.delay_hours_min<24||!Array.isArray(data.daily)||data.daily.length>14)return previewResponse({state:"unavailable"},503);
  const numeric=(value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:0;
  const daily=data.daily.map((day:Record<string,unknown>)=>({
   date:typeof day.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(day.date)?day.date:"",
   alerts:numeric(day.alerts),first_mints:numeric(day.first_mints),
   early:numeric(day.early),genesis:numeric(day.genesis),trend:numeric(day.trend),
   strict:numeric(day.strict),reclaim:numeric(day.reclaim),runner:numeric(day.runner)
  }));
  if(daily.some((day:{date:string})=>!day.date))return previewResponse({state:"unavailable"},503);
  return previewResponse({state:"active",delay_hours_min:24,daily,expires_at:data.expires_at});
 }catch{return previewResponse({state:"unavailable"},503)}
}
