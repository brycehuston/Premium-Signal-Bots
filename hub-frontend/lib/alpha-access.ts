import { createClient } from "@supabase/supabase-js";
const approvedPlans=new Set(["alpha-early-alerts","alpha-trend-alerts","alpha-runner-alerts","alpha-bundle"]);
export type AlphaLevel="owner"|"subscriber"|"none"|"unavailable";
export async function alphaAccess(request:Request):Promise<{level:AlphaLevel;token?:string;status:number}>{
 const bearer=request.headers.get("authorization")??"";
 const token=/^Bearer ([A-Za-z0-9._~+\/-]{24,8192})$/.exec(bearer)?.[1];
 if(!token)return {level:"none",status:401};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"";
 const backend=(process.env.NEXT_PUBLIC_API_BASE??process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,"");
 const ownerId=process.env.ALPHA_OWNER_USER_ID??"";
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!anon)
  return {level:"unavailable",status:503};
 try{
  const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await client.auth.getUser(token);
  if(result.error||!result.data.user)return {level:"none",status:401};
  // Owner authority is the exact server-configured Supabase Auth user ID.
  // Subscriber entitlement still requires /me. A backend outage must not
  // downgrade the verified owner into a membership/checkout flow.
  if(ownerId && result.data.user.id===ownerId)
    return {level:"owner",token,status:200};
  if(!backend||!/^https:\/\//i.test(backend))
    return {level:"unavailable",status:503};
  const me=await fetch(backend+"/me",{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(5500)});
  if(me.status===401)return {level:"none",status:401};
  if(me.status===403)return {level:"none",status:403};
  if(!me.ok)return {level:"unavailable",status:503};
  const profile=await me.json() as Record<string,unknown>;
  const admin=profile.role==="admin";

  // Another admin must never be implicitly promoted to owner, or shown as a subscriber.
  if(admin)return {level:"none",status:403};
  const plan=typeof profile.plan==="string"?profile.plan.trim().toLowerCase():"";
  if(profile.is_active===true&&approvedPlans.has(plan))
    return {level:"subscriber",token,status:200};
  return {level:"none",status:403};
 }catch{return {level:"unavailable",status:503}}
}
