"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useSupabase} from "@/components/SupabaseProvider";
import OwnerLaneDashboard from "./OwnerLaneDashboard";
import SubscriberDashboard from "./SubscriberDashboard";
type AccessState="loading"|"owner"|"subscriber"|"none"|"unavailable";
export default function AlphaDashboard(){
 const {session,loading}=useSupabase();
 const [access,setAccess]=useState<AccessState>("loading");
 useEffect(()=>{
  if(loading)return;
  if(!session?.access_token){setAccess("none");return}
  const c=new AbortController();setAccess("loading");
  fetch("/api/intelligence/access",{headers:{Authorization:"Bearer "+session.access_token},signal:c.signal,cache:"no-store"})
   .then(async r=>({status:r.status,data:await r.json()}))
   .then(({status,data})=>{if(!c.signal.aborted)setAccess(status===200&&(data.state==="owner"||data.state==="subscriber")?data.state:status===503?"unavailable":"none")})
   .catch(()=>{if(!c.signal.aborted)setAccess("unavailable")});
  return()=>c.abort();
 },[loading,session?.access_token]);
 if(loading||access==="loading")return <main role="status" className="mx-auto max-w-5xl px-6 py-20 text-sm text-[#b4bbc6]">VERIFYING YOUR PRIVATE DASHBOARD ACCESS…</main>;
 if(access==="owner")return <OwnerLaneDashboard/>;
 if(access==="subscriber")return <SubscriberDashboard/>;
 return <main className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-[10px] font-bold tracking-[.25em] text-[#dcb777]">ALPHA ALERTS / PRIVATE INTELLIGENCE</p><h1 className="mt-5 font-display text-[30px] font-semibold text-[#f0f2f4]">{access==="unavailable"?"ACCOUNT SERVICE UNAVAILABLE":session?"MEMBERSHIP ACCESS REQUIRED":"SIGN IN REQUIRED"}</h1><p className="mx-auto mt-3 max-w-lg text-[13px] leading-7 text-[#b8bec7]">Live owner analytics and historical subscriber research are permission-controlled. No private data is returned when identity or entitlement checks are unavailable.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={session?"/pricing":"/login"} className="rounded-lg border border-[#9a7f52] px-5 py-3 text-sm font-semibold text-[#f0cc8c]">{session?"VIEW MEMBERSHIP":"SIGN IN"}</Link><Link href="/dashboard/legacy" className="rounded-lg border border-[#474951] px-5 py-3 text-sm font-semibold text-[#c5cbd4]">MY LOCAL ARCHIVE</Link></div></main>;
}
