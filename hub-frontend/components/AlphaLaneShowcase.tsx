"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Radar, ShieldCheck } from "lucide-react";

type Lane = {
  id: string;
  name: string;
  icon: string;
  phase: string;
  lead: string;
  description: string;
  perspective: string;
  accent: string;
  border: string;
  glow: string;
  markers: readonly string[];
};

const LANES: readonly Lane[] = [
  {
    id: "early", name: "EARLY", icon: "🌱", phase: "01 / DISCOVERY",
    lead: "Be early to the observation.",
    description: "Track emerging token activity before a mature trend has had time to form.",
    perspective: "Early activity · Participation · Liquidity",
    accent: "text-emerald-300", border: "border-emerald-400/35", glow: "bg-emerald-400/10",
    markers: ["Launch activity", "Initial flow", "Risk context"],
  },
  {
    id: "genesis", name: "GENESIS", icon: "🧬", phase: "02 / FORMATION",
    lead: "Find the first clean structure.",
    description: "Watch developing launches for smoother formation, buyer participation, and early continuation.",
    perspective: "Structure · Buyer control · Acceleration",
    accent: "text-sky-300", border: "border-sky-400/35", glow: "bg-sky-400/10",
    markers: ["Smooth ramp", "Buyer activity", "Early trajectory"],
  },
  {
    id: "trend", name: "TREND", icon: "📈", phase: "03 / MOMENTUM",
    lead: "Know what the trend is doing.",
    description: "The original Alpha lane. One Trend subscription includes Entry, Unconfirmed, and Risk states.",
    perspective: "ENTRY · UNCONFIRMED · RISK",
    accent: "text-blue-300", border: "border-blue-400/35", glow: "bg-blue-400/10",
    markers: ["Momentum", "Confirmation", "Deterioration"],
  },
  {
    id: "strict", name: "STRICT", icon: "🛡️", phase: "04 / SELECTION",
    lead: "Fewer calls. Stronger requirements.",
    description: "A more selective signal profile for traders who prefer tighter qualification over alert volume.",
    perspective: "Liquidity · Activity · Safety checks",
    accent: "text-violet-300", border: "border-violet-400/35", glow: "bg-violet-400/10",
    markers: ["Stricter gates", "Risk telemetry", "Selective feed"],
  },
  {
    id: "reclaim", name: "RECLAIM", icon: "♻️", phase: "05 / RECOVERY",
    lead: "The second chance matters.",
    description: "Watch stabilization and renewed momentum after a pullback or structural recovery.",
    perspective: "Recovery · Reconfirmation · Strength",
    accent: "text-cyan-300", border: "border-cyan-400/35", glow: "bg-cyan-400/10",
    markers: ["Structural repair", "Reclaim", "Follow-through"],
  },
  {
    id: "runner", name: "RUNNER", icon: "🏃", phase: "06 / CONTINUATION",
    lead: "The move may not be over.",
    description: "Follow persistent momentum and additional legs once price action develops.",
    perspective: "Cadence · Persistence · Continuation",
    accent: "text-amber-300", border: "border-amber-400/35", glow: "bg-amber-400/10",
    markers: ["Higher lows", "Continuation", "Second legs"],
  },
];

export default function AlphaLaneShowcase() {
  const [selected, setSelected] = useState("reclaim");
  const lane = LANES.find((item) => item.id === selected) ?? LANES[0];

  return (
    <section
      id="lanes"
      aria-labelledby="lanes-heading"
      className="relative isolate scroll-mt-28 overflow-hidden rounded-[28px] border border-gold/20 bg-[linear-gradient(145deg,rgba(17,19,23,0.99),rgba(7,8,12,0.99)_64%,rgba(24,20,11,0.96))] px-5 py-9 shadow-[0_30px_100px_-48px_rgba(0,0,0,0.9)] sm:px-8 sm:py-12 lg:px-10 lg:py-14"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-35" style={{
        backgroundImage: "linear-gradient(rgba(235,197,109,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(235,197,109,0.05) 1px,transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "linear-gradient(to bottom,black 0%,transparent 82%)",
      }} />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/10 blur-[105px]" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
            <Radar className="h-4 w-4" aria-hidden="true" />
            Six lanes. One intelligence system.
          </span>
          <span className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
            ALPHA ALERTS / 2.0
          </span>
        </div>

        <div className="mt-7 grid items-end gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h2 id="lanes-heading" className="font-display text-[clamp(2.3rem,5vw,4.6rem)] font-black leading-[0.98] tracking-[-0.045em] text-silver">
              SIX WAYS TO READ<br />
              <span className="text-metal-gold">THE MOMENT.</span>
            </h2>
          </div>
          <p className="max-w-[42ch] text-[15px] leading-relaxed text-muted lg:justify-self-end">
            Some traders hunt the launch. Others wait for structure. Pick the stage
            you care about—without subscribing to an endless wall of token alerts.
          </p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div role="group" aria-label="Explore the six Alpha Alerts lanes" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {LANES.map((item, index) => {
              const active = item.id === lane.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item.id)}
                  aria-pressed={active}
                  className={
                    "group relative flex min-h-[132px] flex-col items-start overflow-hidden rounded-[17px] border px-4 py-4 text-left transition-[border-color,background,transform,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold " +
                    (active
                      ? item.border + " bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                      : "border-white/10 bg-white/[0.025] hover:-translate-y-0.5 hover:border-gold/35 hover:bg-white/[0.045]")
                  }
                >
                  <span aria-hidden="true" className="absolute right-3 top-3 text-[10px] tabular-nums text-muted/60">
                    0{index + 1}
                  </span>
                  <span className="text-[24px]" aria-hidden="true">{item.icon}</span>
                  <span className={"mt-auto pt-5 text-[13px] font-extrabold tracking-[0.11em] " + (active ? item.accent : "text-silver")}>
                    ALPHA {item.name}
                  </span>
                  <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                    {item.phase.split(" / ")[1]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative flex min-h-[425px] flex-col overflow-hidden rounded-[22px] border border-gold/25 bg-[#0e1118] p-5 sm:p-7">
            <div aria-hidden="true" className={"pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full blur-[90px] " + lane.glow} />
            <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-gold">
                LANE INTELLIGENCE / PREVIEW
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Informational
              </span>
            </div>
            <div aria-live="polite" aria-atomic="true" className="relative z-10 flex flex-1 flex-col">
              <div className="mt-7 flex items-center gap-3">
                <span className="text-[36px]" aria-hidden="true">{lane.icon}</span>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted">{lane.phase}</div>
                  <h3 className="mt-1 font-display text-[23px] font-bold tracking-[-0.02em] text-silver">
                    ALPHA {lane.name}
                  </h3>
                </div>
              </div>
              <h4 className="mt-6 font-display text-[clamp(1.35rem,2.4vw,1.9rem)] font-bold leading-tight text-white">
                {lane.lead}
              </h4>
              <p className="mt-3 max-w-[48ch] text-[14px] leading-relaxed text-muted">
                {lane.description}
              </p>
              <div className="mt-7 rounded-xl border border-white/10 bg-black/25 px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted">What this lane evaluates</div>
                <p className={"mt-2 text-sm font-semibold " + lane.accent}>{lane.perspective}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {lane.markers.map((tag) => (
                    <span key={tag} className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-2 text-center text-[10px] font-semibold text-silver/85">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                  Risk context included
                </span>
                <Link href="/pricing#plans" className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.06em] text-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                  EXPLORE PLANS <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="max-w-[65ch] text-[12px] leading-relaxed text-muted">
            A token may evolve through multiple lanes. Each provides its own lens on the evidence; none guarantees an entry or a return.
          </p>
          <Link href="/pricing#packages" className="inline-flex items-center gap-1 text-[12px] font-semibold text-silver hover:text-gold">
            Build your package <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
