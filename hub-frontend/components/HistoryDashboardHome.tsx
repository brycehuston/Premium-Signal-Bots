"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";

type Summary = {
 total: number; alerts_24h: number; unique_mints: number;
 lanes: Record<string,number>; delivery_outcome_correlated: number;
 outcomes_observed: number; runner_2x: number; runner_5x: number;
 runner_10x: number; runner_20x: number;
};
const laneNames = ["EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"];
export default function HistoryDashboardHome({ standalone = false }: { standalone?: boolean }) {
 const { session, loading } = useSupabase();
 const [data, setData] = useState<Summary | null>(null);
 const [error, setError] = useState("");
 useEffect(() => {
   if (!session?.access_token) { setData(null); return; }
   let alive = true;
   const abort = new AbortController();
   fetch("/api/history?view=summary", {
      headers: { Authorization: "Bearer " + session.access_token },
      signal: abort.signal, cache: "no-store"
   }).then(async r => {
      if (!r.ok) throw new Error("history fetch failed");
      return await r.json() as Summary;
   }).then(r => { if (alive) { setData(r); setError(""); } })
     .catch(() => { if (alive) setError("History unavailable. Refresh to retry."); });
   return () => { alive = false; abort.abort(); };
 }, [session?.access_token]);
 if (loading) return <p className="text-sm text-muted">Checking session…</p>;
 if (!session) return <p className="text-sm text-muted">Sign in to view history. <Link className="text-gold" href="/login">Log in</Link></p>;
 const num = (v: number) => v.toLocaleString("en-US");
 return <section aria-label="Alert history overview" className="space-y-5">
   {standalone && <><h1 className="font-display text-3xl text-silver">DASHBOARD</h1><p className="text-sm text-muted">Signed-in historical intelligence.</p></>}
   <div className="space-y-5 rounded-2xl border border-white/10 bg-surface/60 p-5 md:p-7">
     <div className="flex flex-wrap items-start justify-between gap-4">
       <div><p className="text-[11px] uppercase tracking-[0.27em] text-gold">ALPHA HISTORY</p>
         <h2 className="mt-2 font-display text-xl text-silver">Historical intelligence</h2>
         <p className="mt-1 text-xs text-muted">Post-send correlated alerts; not proof of public Telegram delivery.</p>
       </div>
       <Link href="/dashboard/history" className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-xs uppercase tracking-wider text-gold hover:bg-gold/20">Explore all alerts</Link>
     </div>
     {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
     {!data && !error && <p className="text-sm text-muted">Loading approved history…</p>}
     {data && <>
       <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
         {([["Approved alerts",data.total],["Last 24 hours",data.alerts_24h],["Unique mints",data.unique_mints],["Observed exits",data.outcomes_observed]] as [string,number][]).map(([label,value]) =>
           <div key={label} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
             <p className="text-[10px] uppercase tracking-widest text-muted">{label}</p>
             <div className="mt-2 font-display text-2xl text-silver">{num(value)}</div>
           </div>)}
       </div>
       <div className="grid gap-5 lg:grid-cols-2">
         <div className="rounded-xl border border-white/10 p-4">
           <h3 className="text-xs uppercase tracking-widest text-silver/80">Lane breakdown</h3>
           <div className="mt-4 space-y-3">{laneNames.map(lane => {
             const v = data.lanes[lane] || 0;
             return <div key={lane} className="space-y-1">
               <div className="flex justify-between text-xs text-muted"><span>{lane}</span><span className="text-silver">{num(v)}</span></div>
               <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold/70" style={{ width: String(data.total ? 100 * v / data.total : 0) + "%" }} /></div>
             </div>;
           })}</div>
         </div>
         <div className="rounded-xl border border-white/10 p-4">
           <h3 className="text-xs uppercase tracking-widest text-silver/80">Outcome integrity</h3>
           <div className="mt-4 space-y-3 text-sm">
             <div className="flex justify-between"><span className="text-muted">Outcome-delivery correlated</span><span className="text-silver">{num(data.delivery_outcome_correlated)}</span></div>
             <div className="flex justify-between gap-4"><span className="text-muted">Observed 2× / 5× / 10× / 20×</span><span className="text-silver">{[data.runner_2x,data.runner_5x,data.runner_10x,data.runner_20x].join(" / ")}</span></div>
             <div className="flex justify-between"><span className="text-muted">Exit PnL</span><span className="text-amber-200">Not available</span></div>
             <p className="text-xs leading-relaxed text-muted">This imported cohort contains no verified exit marks. No hypothetical profits are displayed.</p>
           </div>
         </div>
       </div>
     </>}
   </div>
 </section>;
}
