// filename: app/pricing/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BUNDLE, PlanTone, ALPHA_LANES, ALPHA_COMPLETE } from "@/lib/plans";
import AlphaLanePriceCard from "@/components/AlphaLanePriceCard";
import { Card, CardBody, Button, Pill } from "@/components/ui";
import { track } from "@/lib/analytics";

function Check({ tone }: { tone: PlanTone }) {
  const colorClass =
    tone === "green" ? "text-[#a3ce64]" :
    tone === "bronze"
      ? "text-bronze"
      : tone === "platinum"
      ? "text-platinum"
      : "text-gold";
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-[18px] w-[18px] -mt-[1px] flex-none ${colorClass}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.5 10.5l2 2 4.5-5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * These class combos match your globals.css shimmer system.
 * IMPORTANT: shimmer-text sets color: transparent, so we MUST always
 * also apply a tone class (shimmer-bronze/platinum/gold) or the word will disappear.
 */
function shimmerWordClass(tone: PlanTone, index: 1 | 2 | 3) {
  if (tone === "green") return "text-[#a3ce64] font-black text-[1.3em] tracking-[0.015em]";
  const cadence = index === 1 ? "shimmer-1" : index === 2 ? "shimmer-2" : "shimmer-3";

  const toneClass =
    tone === "bronze"
      ? "shimmer-bronze"
      : tone === "platinum"
      ? "shimmer-platinum"
      : "shimmer-gold";

  // Bigger + bolder so it pops.
  return `shimmer-text ${cadence} ${toneClass} font-black text-[1.3em] tracking-[0.015em]`;
}

function cardGlowClass(tone: PlanTone) {
  if (tone === "green") return "border-[#a3ce64]/25 hover:shadow-[0_0_0_1px_rgba(101,194,124,0.27),0_20px_55px_-24px_rgba(101,194,124,0.20)]";
  // Border tint + subtle glow on hover
  if (tone === "bronze") {
    return "border-bronze/20 hover:shadow-[0_0_0_1px_rgb(var(--tone-bronze)/0.18),0_26px_90px_-26px_rgb(var(--tone-bronze)/0.25)]";
  }
  if (tone === "platinum") {
    return "border-platinum/20 hover:shadow-[0_0_0_1px_rgb(var(--tone-platinum)/0.18),0_26px_90px_-26px_rgb(var(--tone-platinum)/0.22)]";
  }
  // gold
  return "border-gold/25 hover:shadow-[0_0_0_1px_rgb(var(--gold)/0.18),0_26px_90px_-26px_rgb(var(--gold)/0.28)]";
}

function tonePrimaryButtonClass(tone: PlanTone) {
  if (tone === "green") return "!bg-[#a3ce64] !text-black !border-[#a3ce64]/60 hover:!brightness-[1.05]";
  const base = "text-black hover:text-black btn-text-shadow !border";
  if (tone === "bronze") {
    return [
      base,
      "!bg-metal-bronze",
      "!border-bronze/60",
      "!shadow-[0_6px_18px_rgb(var(--tone-bronze)/0.35)]",
      "hover:!brightness-[1.06]",
    ].join(" ");
  }
  if (tone === "platinum") {
    return [
      base,
      "!bg-metal-platinum",
      "!border-platinum/60",
      "!shadow-[0_6px_18px_rgb(var(--tone-platinum)/0.28)]",
      "hover:!brightness-[1.04]",
    ].join(" ");
  }
  return [
    base,
    "!bg-metal-gold",
    "!border-gold/70",
    "!shadow-[0_6px_18px_rgb(var(--gold)/0.35)]",
    "hover:!brightness-[1.06]",
  ].join(" ");
}

function auraClass(tone: PlanTone) {
  if (tone === "green") return "";
  if (tone === "bronze") return "plan-aura plan-aura-bronze";
  if (tone === "platinum") return "plan-aura plan-aura-platinum";
  return "plan-aura plan-aura-gold";
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function ConfettiBurst({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: 18 }, () => {
      const angle = rand() * Math.PI * 2;
      const distance = 36 + rand() * 38;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 12;
      const rot = Math.round(rand() * 180 - 90);
      const delay = Math.round(rand() * 140);
      const hue = Math.round(40 + rand() * 20);
      const width = Math.round(4 + rand() * 3);
      const height = Math.round(6 + rand() * 4);
      return { x, y, rot, delay, hue, width, height };
    });
  }, [seed]);

  return (
    <div className="confetti-burst" aria-hidden>
      {pieces.map((piece, index) => (
        <span
          key={`${seed}-${index}`}
          className="confetti-piece"
          style={
            {
              ["--x" as any]: `${piece.x}px`,
              ["--y" as any]: `${piece.y}px`,
              ["--rot" as any]: `${piece.rot}deg`,
              ["--delay" as any]: `${piece.delay}ms`,
              ["--hue" as any]: piece.hue,
              width: `${piece.width}px`,
              height: `${piece.height}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function PlanTitle({
  left,
  emphasis,
  right,
  tone,
  cadenceIndex,
}: {
  left: string;
  emphasis: string;
  right: string;
  tone: PlanTone;
  cadenceIndex: 1 | 2 | 3;
}) {
  return (
    <h3 className="font-display text-title-lg font-semibold tracking-tight text-silver">
      <span className="opacity-95">{left} </span>
      <span className={shimmerWordClass(tone, cadenceIndex)}>{emphasis}</span>
      <span className="opacity-95"> {right}</span>
    </h3>
  );
}

function renderBullet(b: string) {
  const colonIndex = b.indexOf(":");
  if (colonIndex === -1) {
    return b;
  }

  const prefix = b.slice(0, colonIndex + 1);
  const rest = b.slice(colonIndex + 1);

  return (
    <>
      <strong className="font-semibold text-silver">{prefix}</strong>
      {rest}
    </>
  );
}

function PricingDivider() {
  const prefersReduced = useReducedMotion();
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: dividerRef,
    offset: ["start end", "end start"],
  });
  const travel = useTransform(scrollYProgress, [0, 1], ["12%", "88%"]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.6]);
  const sweep = useTransform(scrollYProgress, [0, 1], ["10%", "90%"]);
  const sweepGlow = useTransform(scrollYProgress, [0, 0.5, 1], [0.35, 0.95, 0.35]);

  return (
    <div ref={dividerRef} aria-hidden className="relative flex items-center justify-center py-10 md:py-14">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stroke/70 to-transparent" />
      <motion.div
        className="pointer-events-none absolute top-1/2 h-px w-36 -translate-y-1/2 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_0_16px_rgb(var(--gold)/0.4)] md:w-52"
        style={{
          left: prefersReduced ? "50%" : sweep,
          opacity: prefersReduced ? 0.6 : sweepGlow,
          translateX: "-50%",
        }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/2 flex items-center gap-2 -translate-y-1/2"
        style={{
          left: prefersReduced ? "50%" : travel,
          opacity: prefersReduced ? 1 : glow,
          translateX: "-50%",
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_10px_rgb(var(--gold)/0.45)]" />
        <span className="h-1 w-1 rounded-full bg-gold/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_10px_rgb(var(--gold)/0.45)]" />
      </motion.div>
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [bundleConfetti, setBundleConfetti] = useState(0);
  const confettiTimerRef = useRef<number | null>(null);
  const bundleTitle = BUNDLE.title;
  const bundleKey = "ALERTS";
  const bundleKeyIndex = bundleTitle.indexOf(bundleKey);
  const bundleBullets = [
    ...BUNDLE.bullets,
    "Early access is not yet available.",
    "Bundle checkout remains on hold until every included lane is available.",
  ];
  const bundleTitleNode =
    bundleKeyIndex === -1 ? (
      bundleTitle
    ) : (
      <>
        {bundleTitle.slice(0, bundleKeyIndex)}
        <span className="bundle-alerts-marble">{bundleKey}</span>
        {bundleTitle.slice(bundleKeyIndex + bundleKey.length)}
      </>
    );

  useEffect(() => {
    track("pricing_view");
    return () => {
      if (confettiTimerRef.current) window.clearTimeout(confettiTimerRef.current);
    };
  }, []);

  const triggerBundleConfetti = () => {
    if (billing !== "annual") return;
    const now = Date.now();
    setBundleConfetti(now);
    if (confettiTimerRef.current) window.clearTimeout(confettiTimerRef.current);
    confettiTimerRef.current = window.setTimeout(() => {
      setBundleConfetti((current) => (current === now ? 0 : current));
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-6xl py-7 sm:py-9">
      <div className="text-center">
        <h1 className="font-display text-[45px] font-semibold tracking-tight text-silver leading-none sm:text-[62px] md:text-[72px]">
          PRICING
        </h1>
        <p className="mx-auto mt-3 text-[11px] text-muted sm:text-[12px] md:text-[13px]">
          Six signal lanes. Published prices are informational; availability varies by lane.
        </p>
        
      </div>

      <div className="mt-5 flex justify-center sm:mt-6">
        <div
          className="relative flex w-[220px] items-center rounded-pill border border-stroke/70 bg-surface/70 p-1"
          role="group"
          aria-label="Billing cadence"
        >
          <span
            aria-hidden
            className={[
              "absolute inset-1 w-[calc(50%-0.25rem)] rounded-pill border border-gold/40 bg-gold/20 shadow-soft",
              "transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
              billing === "annual" ? "translate-x-full" : "translate-x-0",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={[
              "relative z-10 flex-1 rounded-pill px-4 py-1.5 text-center text-small font-semibold transition-colors duration-200",
              billing === "monthly" ? "text-gold" : "text-muted hover:text-silver",
            ].join(" ")}
            aria-pressed={billing === "monthly"}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={[
              "relative z-10 flex-1 rounded-pill px-4 py-1.5 text-center text-small font-semibold transition-colors duration-200",
              billing === "annual" ? "text-gold" : "text-muted hover:text-silver",
            ].join(" ")}
            aria-pressed={billing === "annual"}
          >
            Annual
          </button>
        </div>
      </div>

      <section className="mt-7 scroll-mt-24" aria-labelledby="lanes-heading">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.30em] text-gold/80">Alpha Signals / Six Specialized Lanes</p>
          <h2 id="lanes-heading" className="font-display text-[25px] font-semibold tracking-tight text-silver sm:text-[33px]">THE ALPHA SIGNAL STACK</h2>
          <p className="text-sm leading-relaxed text-muted">Distinct signals, shared intelligence. Review each lane and its availability.</p>
        </div>
      </section>

      <div id="plans" className="mt-7 grid grid-cols-1 items-stretch gap-4 scroll-mt-24 md:grid-cols-2 lg:grid-cols-3">
        {ALPHA_LANES.map(lane=><AlphaLanePriceCard key={lane.slug} lane={lane} billing={billing}/>)}

        <div className="md:col-span-2 lg:col-span-3">
          <PricingDivider />
        </div>

        {/* Bundle as a clean full-width panel */}
        <Card
          className={[
            "group relative lg:col-span-3 overflow-hidden transition-all duration-200 will-change-transform",
            "bg-[linear-gradient(135deg,rgb(var(--gold)_/_0.16),rgb(var(--surface)_/_0.98)_42%,rgb(var(--gold)_/_0.2))]",
            "ring-1 ring-gold/30",
            "hover:-translate-y-0.5 hover:scale-[1.01]",
            "hover:shadow-[0_0_0_1px_rgb(var(--gold)/0.55),0_26px_90px_rgb(var(--gold)/0.45)]",
            "before:content-[''] before:absolute before:inset-x-6 before:top-0 before:h-px before:z-0",
            "before:bg-[linear-gradient(90deg,rgb(var(--gold)_/_0),rgb(var(--gold)_/_0.85),rgb(var(--gold)_/_0))]",
            "after:content-[''] after:absolute after:-right-16 after:-top-16 after:h-48 after:w-48 after:z-0",
            "after:bg-[radial-gradient(closest-side,rgb(var(--gold)_/_0.28),rgba(0,0,0,0))]",
            "after:opacity-0 after:transition-opacity after:duration-200 group-hover:after:opacity-100",
            cardGlowClass("gold"),
          ].join(" ")}
        >
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 -z-10 rounded-card opacity-80 ${auraClass(
              "gold"
            )}`}
          />
          <CardBody className="relative z-10 space-y-6 md:space-y-0 md:flex md:items-center md:justify-between md:gap-10">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold">
                  <span className="text-[18px]">{BUNDLE.emoji}</span>
                </div>
                <h3 className="font-display text-title-lg text-[22px] md:text-[24px] font-semibold tracking-tight text-silver">
                  {bundleTitleNode}
                </h3>
                <Pill
                  tone="accent"
                  className="ml-0 best-value-pulse text-[11px] font-semibold uppercase tracking-[0.25em] sm:ml-2"
                >
                  Bundle On Hold
                </Pill>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <div className="font-display text-[38px] md:text-[42px] font-semibold leading-none">
                    ${billing === "annual" ? BUNDLE.priceAnnual : BUNDLE.priceMonthly}
                  </div>
                  <div className="text-muted text-[14px] md:text-[15px]">
                    / {billing === "annual" ? "year" : "month"}
                  </div>
                </div>
                <div className="text-muted/80 text-[14px] md:text-[15px]">
                  {billing === "annual"
                    ? `Billed annually • ${BUNDLE.priceAnnual} / year`
                    : `Or ${BUNDLE.priceAnnual} / year`}
                </div>
              </div>

              <ul className="space-y-3 text-[14px] text-muted md:space-y-2.5 md:text-[15px]">
                {bundleBullets.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <Check tone="gold" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative md:min-w-[340px]">
              {bundleConfetti ? <ConfettiBurst seed={bundleConfetti} /> : null}
              <Button
                variant="primary"
                size="md"
                full
                className={`!h-12 text-[16px] ${tonePrimaryButtonClass("gold")}`}
                disabled
                onClick={undefined}
              >
                BUNDLE ACCESS PENDING
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="md:col-span-2 lg:col-span-3">
          <PricingDivider />
        </div>
      </div>

      <section className="mt-8 rounded-[13px] border border-[#3d3a33] bg-[#121418] p-6 sm:p-7" aria-labelledby="alpha-complete-plan">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#e7bc67]">SIX-LANE BUNDLE · FUTURE OFFERING</p><span className="rounded-full border border-[#5c503d] px-3 py-1 text-[10px] font-semibold text-[#d9c49d]">PLANNED · NOT YET AVAILABLE</span></div>
        <h3 id="alpha-complete-plan" className="mt-3 font-display text-[27px] font-semibold text-[#eeeef0]">ALPHA COMPLETE</h3>
        <p className="mt-2 text-[13px] text-[#b7bac1]">All six Alpha Lanes. This planned bundle cannot be purchased or activated.</p>
        <div className="mt-5 flex flex-wrap items-baseline gap-5 text-[#f1d8a5]"><strong className="font-display text-[26px] tabular-nums">{"$"}{billing==="monthly"?ALPHA_COMPLETE.priceMonthly.toLocaleString("en-US"):ALPHA_COMPLETE.priceAnnual.toLocaleString("en-US")}</strong><span className="text-sm text-[#b7bac1]">/ {billing==="monthly"?"month":"year"}</span></div>
        <div className="mt-4 flex flex-wrap gap-2">{ALPHA_LANES.map(lane=><span key={lane.slug} className="rounded-[7px] border border-[#34363b] bg-[#191b1e] px-2.5 py-1.5 text-[11px] text-[#d0d2d6]">{lane.emoji} {lane.key}</span>)}</div>
      </section>

      <section className="mt-14" aria-labelledby="alpha-systems-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.31em] text-gold/80">The Next Frontier</p>
          <h2 id="alpha-systems-heading" className="mt-2 font-display text-[26px] font-semibold tracking-tight text-silver sm:text-[34px]">ALPHA SYSTEMS</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">Beyond signal alerts. Purpose-built research and future systems, presented without premature launch or profit claims.</p>
        </div>
        <article className="relative mt-7 overflow-hidden rounded-[16px] border border-[#8d764b]/55 bg-[linear-gradient(140deg,#191b1e,#101115_60%,#151515)] p-6 shadow-[inset_0_1px_0_rgba(250,219,169,.10)] sm:p-9">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#e7bc67]/70 to-transparent" aria-hidden="true"/>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
            <div><div className="flex flex-wrap items-center gap-3"><span className="text-[10px] font-semibold uppercase tracking-[.23em] text-[#e8c58c]">FLAGSHIP · ALPHA SYSTEMS</span><span className="rounded-full border border-[#6d614a] px-3 py-1 text-[10px] font-bold tracking-[.11em] text-[#ddcba7]">DEVELOPED · PRIVATE ACCESS CLOSED</span></div>
              <h3 className="mt-5 font-display text-[clamp(38px,5vw,66px)] font-semibold tracking-[-.05em] leading-none text-[#f4f0e7]">ALPHA<span className="text-[#e7bc67]">-X</span></h3>
              <p className="mt-5 max-w-xl text-[14px] leading-[1.85] text-[#bcc0c5]">Private execution-system research and development. Alpha-X is developed, but customer access is closed. No public trading service or release date is offered.</p>
              <div className="mt-6 flex flex-wrap gap-2">{["Execution research","Risk controls","Paper validation"].map(label=><span key={label} className="rounded-[7px] border border-[#41403b] bg-[#1f2022] px-3 py-2 text-[11px] font-semibold text-[#dad6cb]">{label}</span>)}</div>
              <a href="/waitlist" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-[9px] border border-[#a58653] px-5 text-[12px] font-semibold tracking-[.11em] text-[#f0cc94] hover:bg-[#e7bc67]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7bc67]">EXPRESS INTEREST</a>
            </div>
            <div aria-hidden="true" className="flex min-h-[185px] items-center justify-center rounded-[12px] border border-[#494137] bg-[#0a0c0f] p-5 sm:min-h-[240px]"><svg viewBox="0 0 460 200" fill="none" className="w-full max-w-[460px]"><defs><linearGradient id="ax-trace" x1="0" y1="0" x2="460" y2="0"><stop stopColor="#776342"/><stop offset=".5" stopColor="#e7bc67"/><stop offset="1" stopColor="#a98a57"/></linearGradient></defs><path d="M18 165H444M18 115H444M18 65H444M70 22V180M170 22V180M270 22V180M370 22V180" stroke="#3b3730" strokeWidth=".8"/><path d="M16 152L74 150L110 106L150 125L192 70L238 94L274 55L321 74L366 31L407 47L445 15" stroke="url(#ax-trace)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="366" cy="31" r="5" fill="#e7bc67"/><circle cx="366" cy="31" r="13" stroke="#e7bc67" strokeOpacity=".25"/></svg></div>
          </div><p className="mt-4 text-[10px] leading-5 text-[#8f969d]">Illustrative technical trace · not live execution data or performance reporting</p>
        </article>
        {/* Alpha Pulse is market intelligence, not a seventh trading-alert lane. */}
        <div className="mt-7 overflow-hidden rounded-[16px] border border-[#89cff0]/30 bg-[#10151a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1.25fr)_minmax(230px,.75fr)] md:items-center md:gap-10">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#89cff0]/35 bg-[#89cff0]/10 text-[#89cff0]" aria-hidden="true">
                  <svg viewBox="0 0 40 40" width="29" height="29" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 24h7l4-10 7 17 5-14 4 7h7" />
                    <path d="M5 34h30M5 7h30" opacity=".38" />
                  </svg>
                </span>
                <span className="rounded-full border border-[#89cff0]/30 bg-[#89cff0]/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a7d9ee]">
                  Market intelligence / Research preview
                </span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#89cff0]">Understand the environment before the alert</p>
              <h3 className="mt-2 font-display text-[32px] font-semibold tracking-[-0.025em] text-[#ebebed] sm:text-[42px]">
                ALPHA <span className="text-[#89cff0]">PULSE</span>
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-[1.85] text-[#b6b9c2]">
                Market-regime context for BTC, ETH and SOL. Track directional structure, changing risk conditions
                and potential regime transitions with multi-timeframe evidence instead of relying on a single indicator.
              </p>
            </div>
            <div className="min-w-0 border-t border-[#89cff0]/20 pt-5 md:border-l md:border-t-0 md:py-1 md:pl-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#89cff0]">Research focus</p>
              <ul className="mt-4 space-y-3 text-[12px] leading-relaxed text-[#c7c9d0]">
                {["BTC / ETH / SOL market context", "Multi-timeframe state confirmation", "Risk posture and invalidation levels", "Regime shifts and capital rotation"].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#89cff0]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-[#89cff0]/20 pt-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a7b2bf]">
                Access &amp; pricing not announced · No checkout
              </p>
            </div>
          </div>
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <div className="group relative min-w-0 rounded-card p-px transition-transform duration-200 hover:-translate-y-0.5"
               style={{background:"linear-gradient(145deg,#d8b8798c,rgba(255,255,255,.09) 50%,#d8b87924)"}}>
            <Card className="relative h-full overflow-hidden !border-0 !bg-[#0d1014]">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_8%_0%,rgba(216,184,121,0.14),transparent_62%)]"/>
              <CardBody className="relative flex min-h-[380px] flex-col gap-5 !p-6 sm:!p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl border border-[#d8b879]/35 bg-[#d8b879]/10 text-[#d8b879]">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden className="h-10 w-10">
                      <path d="M6 37 17 24 24 30 41 11"/><path d="M30 11h11v11"/><path d="M5 43h38" opacity=".5"/><path d="M16 8v8m-4-4h8" opacity=".6"/>
                    </svg>
                  </div>
                  <span className="rounded-full border border-[#d8b879]/35 bg-[#d8b879]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#d8b879]">Research / Paper</span>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d8b879]/85">Quantitative Research / Execution Development</p>
                  <h3 className="font-display text-[36px] font-bold tracking-[-0.02em] text-silver sm:text-[44px]">ALPHA <span className="text-[#d8b879]">APEX</span></h3>
                  <p className="max-w-md text-sm leading-relaxed text-muted">A research-driven execution program. Strategy testing, simulated fills and risk engineering before any live-access offering.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {["Strategy validation","Paper execution","Risk / fill analysis","Evidence before release"].map(item=>(
                    <span key={item} className="rounded-lg border border-[#d8b879]/15 bg-[#d8b879]/[0.035] px-3 py-2 text-[11px] font-medium text-silver/80">{item}</span>
                  ))}
                </div>
                <div className="mt-auto border-t border-[#d8b879]/25 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8b879]">No live trading service or public checkout</div>
              </CardBody>
            </Card>
          </div>
          <div className="group relative min-w-0 rounded-card p-px transition-transform duration-200 hover:-translate-y-0.5"
               style={{background:"linear-gradient(145deg,#9bbbdc8c,rgba(255,255,255,.09) 50%,#9bbbdc24)"}}>
            <Card className="relative h-full overflow-hidden !border-0 !bg-[#0d1014]">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_92%_0%,rgba(155,187,220,0.14),transparent_62%)]"/>
              <CardBody className="relative flex min-h-[380px] flex-col gap-5 !p-6 sm:!p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl border border-[#9bbbdc]/35 bg-[#9bbbdc]/10 text-[#9bbbdc]">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden className="h-10 w-10">
                      <path d="M24 5 42 15v18L24 43 6 33V15Z"/><path d="m6 15 18 10 18-10M24 25v18"/><circle cx="24" cy="5" r="2.5" fill="currentColor"/><circle cx="6" cy="33" r="2.5" fill="currentColor"/><circle cx="42" cy="33" r="2.5" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="rounded-full border border-[#9bbbdc]/35 bg-[#9bbbdc]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9bbbdc]">Coming Soon</span>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9bbbdc]/85">Next-Generation Infrastructure</p>
                  <h3 className="font-display text-[36px] font-bold tracking-[-0.02em] text-silver sm:text-[44px]">ALPHA <span className="text-[#9bbbdc]">NEXUS</span></h3>
                  <p className="max-w-md text-sm leading-relaxed text-muted">The next systems layer in the Alpha family. Availability and supported capabilities will be announced when verified.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {["Systems architecture","Performance engineering","Reliability-first design","Release details pending"].map(item=>(
                    <span key={item} className="rounded-lg border border-[#9bbbdc]/15 bg-[#9bbbdc]/[0.035] px-3 py-2 text-[11px] font-medium text-silver/80">{item}</span>
                  ))}
                </div>
                <div className="mt-auto border-t border-[#9bbbdc]/25 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9bbbdc]">No release date or purchase option announced</div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      <section className="mt-14 grid items-stretch gap-5 lg:grid-cols-2" aria-label="Access and subscription information">
        <Card className="h-full !rounded-[16px] border-[#34353a] bg-[#101115] !shadow-none hover:!translate-y-0 hover:!shadow-none">
          <CardBody className="p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">AFTER YOU REQUEST ACCESS</p>
            <h2 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.025em] text-[#f0f0f2] sm:text-[30px]">From request to private alerts.</h2>
            <p className="mt-3 max-w-md text-[13px] leading-[1.8] text-[#b9bbc3]">Availability is confirmed before payment. Each step is handled directly with the team.</p>
            <ol className="mt-7 space-y-3">
              {[
                { title: "Confirm your plan", detail: "Contact support to confirm the lane is available and receive the current payment instructions." },
                { title: "Verify your payment", detail: "If approved, send your USDC on Solana transaction link and Telegram username to support." },
                { title: "Receive your invite", detail: "After verification, we send access to the private Telegram channel tied to your plan." },
              ].map((item, index) => (
                <li key={item.title} className="flex min-w-0 items-start gap-4 rounded-[11px] border border-[#303138] bg-[#16171b] p-4 sm:p-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-[13px] font-semibold text-[#f0cd8a]">{index + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[14px] font-semibold text-[#f0f0f2]">{item.title}</h3>
                    <p className="mt-1.5 text-[12px] leading-[1.8] text-[#b7b9c2]">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
        <Card className="h-full !rounded-[16px] border-[#34353a] bg-[#101115] !shadow-none hover:!translate-y-0 hover:!shadow-none">
          <CardBody className="p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">SERVICE DETAILS</p>
            <h2 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.025em] text-[#f0f0f2] sm:text-[30px]">Know what to expect.</h2>
            <p className="mt-3 max-w-md text-[13px] leading-[1.8] text-[#b9bbc3]">Clear delivery and subscription information without hidden checkout promises.</p>
            <div className="mt-7 overflow-hidden rounded-[11px] border border-[#303138] bg-[#16171b]">
              {[
                { title: "Delivery", detail: "Available alerts are delivered to the private Telegram channels included in your verified plan." },
                { title: "Payment", detail: "Manual USDC on Solana. Request access before sending funds; checkout is not enabled until the configuration is verified." },
                { title: "Cancellation", detail: "Contact support before your next billing cycle to cancel or discuss your subscription." },
              ].map((item, index) => (
                <div key={item.title} className={`px-5 py-5 ${index ? "border-t border-[#303138]" : ""}`}>
                  <h3 className="font-display text-[14px] font-semibold text-[#f0f0f2]">{item.title}</h3>
                  <p className="mt-2 text-[12px] leading-[1.8] text-[#b7b9c2]">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>

      <div className="mt-6 md:mt-8">
        <PricingDivider />
      </div>


    </div>
  );
}
