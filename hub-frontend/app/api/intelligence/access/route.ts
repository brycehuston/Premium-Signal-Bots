import { NextRequest,NextResponse } from "next/server";
import { alphaAccess } from "@/lib/alpha-access";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 const result=await alphaAccess(request);
 return NextResponse.json({state:result.level,delay_hours:result.level==="subscriber"?24:0},
 {status:result.status,headers:{"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
}
