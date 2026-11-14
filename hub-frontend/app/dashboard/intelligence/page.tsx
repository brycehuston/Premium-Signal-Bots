"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useSupabase} from "@/components/SupabaseProvider";
import OwnerLaneDashboard from "../OwnerLaneDashboard";
import SubscriberDashboard from "../SubscriberDashboard";
export default function AuthorizedIntelligence(){
 const {session,loading}=useSupabase();
 const [access,setAccess]=useState<"loading"|"owner"|"subscriber"|"denied"|"unavailable">("loading");
 useEffect(()=>{if(loading)return;if(!session?.access_token){setAccess("denied");return}
 const c=new AbortController();setAccess("loading");
 fetch("/api/intelligence/access",{headers:{Authorization:"Bearer "+session.access_token},signal:c.signal,cache:"no-store"})
  .then(async r=>({status:r.status,data:await r.json()}))
  .then(({status,data})=>{if(!c.signal.aborted)setAccess(status===200&&(data.state==="owner"||data.state==="subscriber")?data.state:status===503?"unavailable":"denied")})
  .catch(()=>{if(!c.signal.aborted)setAccess("unavailable")});
 return()=>c.abort()
 },[loading,session?.access_token]);
 if(access==="owner")return <OwnerLaneDashboard/>;
 if(access==="subscriber")return <SubscriberDashboard/>;
 return <main className="mx-auto max-w-4xl px-6 py-20 text-[#e5e5e7]"><h1 className="font-display text-2xl">Private intelligence</h1><p className="mt-3 text-[13px] text-[#b7bbc2]">{access==="loading"?"Verifying access…":access==="unavailable"?"Access verification is temporarily unavailable.":"This area requires a verified subscription or owner entitlement."}</p><Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center text-[#e7bc67] underline">Return to Alpha Command</Link></main>;
}
