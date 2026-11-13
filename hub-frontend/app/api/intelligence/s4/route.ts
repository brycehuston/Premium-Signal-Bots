import {NextRequest,NextResponse} from "next/server";
import {alphaAccess} from "@/lib/alpha-access";
import {verifiedS4Checkpoint} from "@/lib/s4-verified-checkpoint";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const auth=await alphaAccess(req);
 if(auth.level!=="owner")return NextResponse.json({state:"forbidden"},{status:auth.status===503?503:403,headers:{"Cache-Control":"private, no-store, max-age=0"}});
 return NextResponse.json({state:"checkpoint",live:false,...verifiedS4Checkpoint},{headers:{"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
}
