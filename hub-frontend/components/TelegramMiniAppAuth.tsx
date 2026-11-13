"use client";
import {useCallback,useEffect,useState} from "react";
import {useSupabase} from "@/components/SupabaseProvider";
declare global{interface Window{Telegram?:{WebApp?:{initData?:string;ready?:()=>void;expand?:()=>void}}}}
type State="idle"|"checking"|"linked"|"not_linked"|"failed"|"ready";
export default function TelegramMiniAppAuth(){
 const {supabase,session}=useSupabase();
 const [state,setState]=useState<State>("idle");
 const [inside,setInside]=useState(false);
 const [initData,setInitData]=useState("");
 useEffect(()=>{
  const app=window.Telegram?.WebApp;
  if(!app?.initData)return;
  setInside(true);setInitData(app.initData);app.ready?.();app.expand?.();
 },[]);
 const exchange=useCallback(async()=>{
  if(!supabase||!initData)return;
  setState("checking");
  try{
   const res=await fetch("/api/auth/telegram",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode:"exchange",initData}),cache:"no-store"});
   const body=await res.json();
   if(res.status===403||res.status===409){setState("not_linked");return}
   if(res.status!==200||body.state!=="authenticated"||
      typeof body.session?.access_token!=="string"||typeof body.session?.refresh_token!=="string"){
     setState(body.state==="not_linked"?"not_linked":"failed");return;
   }
   const {error}=await supabase.auth.setSession(body.session);
   setState(error?"failed":"ready");
  }catch{setState("failed")}
 },[supabase,initData]);
 useEffect(()=>{if(!inside||!supabase||!initData||session)return;void exchange()},[inside,supabase,initData,session,exchange]);
 async function link(){
  if(!session?.access_token||!initData)return;
  setState("checking");
  try{
   const response=await fetch("/api/auth/telegram",{
    method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
    body:JSON.stringify({mode:"link",initData})
   });
   setState(response.status===200?"linked":"failed");
  }catch{setState("failed")}
 }
 if(!inside)return null;
 return <section aria-label="Telegram Mini App connection"
  className="mb-5 rounded-xl border border-[#715c3d] bg-[#181716] px-5 py-4 text-[#ebe7dd]">
  <p className="text-[10px] font-semibold tracking-[.2em] text-[#e6bd76]">TELEGRAM MINI APP / PRIVATE ACCESS</p>
  {state==="checking"?<p className="mt-2 text-[13px]">Verifying Telegram identity and membership…</p>
   :state==="ready"?<p className="mt-2 text-[13px]">Verified Telegram session established.</p>
   :state==="linked"?<p className="mt-2 text-[13px]">Account linked. Your next Telegram launch can sign in automatically.</p>
   :session?<div className="mt-2 space-y-2"><p className="text-[13px]">Link this verified account to your Telegram identity for future one-tap access.</p>
    <button type="button" onClick={()=>void link()} className="rounded-lg border border-[#b99054] px-4 py-2 text-[12px] text-[#f1c880]">LINK VERIFIED ACCOUNT</button></div>
   :<p className="mt-2 text-[13px]">{state==="not_linked"?"Your Telegram account is not yet linked to an active Alpha Alerts subscription. Sign in once to establish a verified link.":"Automatic sign-in is unavailable. No private history was exposed."}</p>}
 </section>;
}
