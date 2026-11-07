// filename: app/pricing/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PLANS, BUNDLE, PlanTone } from "@/lib/plans";
import { Card, CardBody, Button, Pill } from "@/components/ui";
import { track } from "@/lib/analytics";

const UPCOMING_LANES = {
  GENESIS: {
    color: "#A78BFA", soft: "#a78bfa16",
    tagline: "Early momentum formation",
    summary: "Recognizing developing structure before the broader trend is established.",
    highlights: [
      "Early participation and acceleration context",
      "Emerging structure and confirmation signals",
      "Native scoring with clear lane identity",
      "Telegram delivery within the Alpha signal system",
    ],
  },
  STRICT: {
    color: "#D97777", soft: "#d9777716",
    tagline: "High-selectivity confirmation",
    summary: "A more selective view of setup quality and market structure.",
    highlights: [
      "Additional qualification and safety gates",
      "Structure and participation checks",
      "Clearer separation of qualified setups",
      "Distinct scoring context and alert designation",
    ],
  },
  RECLAIM: {
    color: "#4BB8D1", soft: "#4bb8d116",
    tagline: "Recovery and renewed strength",
    summary: "Tracking structure recovery when momentum starts to rebuild.",
    highlights: [
      "Reclaim and renewed-interest observations",
      "Price structure and participation context",
      "Repeat-alert and lane-transition awareness",
      "Native risk and quality observations",
    ],
  },
} as const;

type UpcomingLaneName = keyof typeof UPCOMING_LANES;
const LANE_CARD_ORDER = ["EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"] as const;

function UpcomingLaneCard({ lane }: { lane: UpcomingLaneName }) {
  const info = UPCOMING_LANES[lane];
  return (
    <div className="group relative min-w-0 rounded-card p-px transition-transform duration-200 hover:-translate-y-0.5"
         style={{ background: `linear-gradient(153deg,${info.color}88,rgba(255,255,255,0.08) 42%,${info.color}26)` }}>
      <Card className="relative h-full min-w-0 overflow-hidden !border-0 !bg-[#0e1115] transition-shadow duration-200 group-hover:!shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden
             style={{ background:`radial-gradient(ellipse 100% 67% at 4% -12%,${info.color}20,transparent 69%)` }} />
        <div className="pointer-events-none absolute left-7 right-7 top-0 h-px opacity-75" aria-hidden
             style={{background:`linear-gradient(90deg,transparent,${info.color},transparent)`}} />
        <CardBody className="relative flex h-full min-h-[440px] flex-col gap-5 !p-6 sm:!p-7">
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border"
                  style={{borderColor:`${info.color}65`, backgroundColor:info.soft,color:info.color}}>
              <svg viewBox="0 0 28 28" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
                {lane==="GENESIS"?(
                  <><path d="M14 2 24 14 14 26 4 14Z"/><path d="M14 8 19 14 14 20 9 14Z"/><path d="M14 2v6m0 12v6"/></>
                ):lane==="STRICT"?(
                  <><path d="M14 2 24 6v8c0 7-4 10-10 12C8 24 4 21 4 14V6Z"/><path d="m9 14 3 3 7-7"/></>
                ):(
                  <><path d="M23 12a9 9 0 1 0 .5 5"/><path d="m19 8 4 4 3-4"/><path d="m9 17 4-5 3 2 4-5"/></>
                )}
              </svg>
            </span>
            <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em]"
                  style={{borderColor:`${info.color}50`,color:info.color,backgroundColor:info.soft}}>
              LANE PREVIEW
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-[22px] font-semibold tracking-tight text-silver sm:text-[24px]">
              ALPHA <span style={{color:info.color}}>{lane}</span> ALERTS
            </h3>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{color:info.color}}>
              {info.tagline}
            </p>
            <p className="text-[13px] leading-relaxed text-muted">{info.summary}</p>
          </div>
          <div className="h-px w-full opacity-60" style={{background:`linear-gradient(90deg,${info.color}80,transparent)`}} aria-hidden />
          <div className="space-y-1">
            <div className="font-display text-[24px] font-semibold tracking-tight text-silver">PRICING TBA</div>
            <p className="text-[11px] leading-relaxed text-muted">Separate subscription pricing has not been announced.</p>
          </div>
          <ul className="space-y-3 text-[12px] leading-relaxed text-muted" aria-label={`Alpha ${lane} capabilities`}>
            {info.highlights.map(item => (
              <li className="flex items-start gap-3" key={item}>
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke={info.color} strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="m4 10 4 4 8-9" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-3">
            <div className="flex min-h-11 items-center justify-center rounded-[7px] border bg-[#161a20] px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-silver/75"
                 style={{borderColor:`${info.color}47`}} aria-label={`Alpha ${lane} not available for purchase`}>
              Not available yet
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

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

  // We want the cadence to be EARLY -> TREND -> RUNNER always
  const cadenceMap: Record<string, 1 | 2 | 3> = {
    "alpha-early-alerts": 1,
    "alpha-trend-alerts": 2,
    "alpha-runner-alerts": 3,
  };

  const orderedPlans = useMemo(() => {
    const planOrder: Record<string, number> = {
      "alpha-trend-alerts": 0,
      "alpha-runner-alerts": 1,
      "alpha-early-alerts": 2,
    };

    return [...PLANS].sort(
      (a, b) => (planOrder[a.slug] ?? 99) - (planOrder[b.slug] ?? 99)
    );
  }, []);

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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
      <div className="text-center">
        <h1 className="font-display text-[50px] font-semibold tracking-tight text-silver leading-[0.95] sm:text-[78px] sm:leading-none md:text-[104px]">
          PRICING
        </h1>
        <p className="mx-auto mt-3 text-[11px] text-muted sm:text-[12px] md:text-[13px]">
          Six specialized signal lanes. Existing subscriptions remain unchanged; additional lane offerings are not yet separately priced.
        </p>
        <p className="mx-auto mt-3 text-[10px] text-muted sm:text-[11px] md:text-[12px]">
          Prices are displayed for reference. Checkout is enabled only after verified payment and channel-access configuration.
        </p>
      </div>

      <div className="mt-8 flex justify-center sm:mt-9">
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

      <section className="mt-12 scroll-mt-24" aria-labelledby="lanes-heading">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.30em] text-gold/80">Alpha Signals / Six Specialized Lanes</p>
          <h2 id="lanes-heading" className="font-display text-[25px] font-semibold tracking-tight text-silver sm:text-[33px]">THE ALPHA SIGNAL STACK</h2>
          <p className="text-sm leading-relaxed text-muted">Distinct signals, shared intelligence. Three existing subscription tiers plus three emerging lane classifications, each with its own identity.</p>
        </div>
      </section>

      {/* Existing published plans — no invented prices for new lane classifications. */}
      <div
        id="plans"
        className="mt-12 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 scroll-mt-24 md:scroll-mt-32"
      >
        {LANE_CARD_ORDER.map((lane) => {
          const p = orderedPlans.find(plan => plan.titleEmphasis === lane);
          if (!p) return <UpcomingLaneCard key={lane} lane={lane as UpcomingLaneName} />;
          const isEarlyComingSoon = p.slug === "alpha-early-alerts";
          const isRunnerPlan = p.slug === "alpha-runner-alerts";
          return (
            <Card
              key={p.slug}
              className={`group relative transition-all duration-200 will-change-transform ${cardGlowClass(
                p.tone
              )} ${
                isEarlyComingSoon
                  ? "overflow-hidden coming-soon-plan-card hover:!translate-y-0 hover:!shadow-soft"
                  : ""
              } ${isRunnerPlan ? "runner-featured-card" : ""}`}
            >
            {/* tone-matched aura */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 -z-10 rounded-card opacity-80 ${auraClass(
                p.tone
              )}`}
            />
            {isEarlyComingSoon ? (
              <div className="coming-soon-ribbon" aria-hidden>
                <span className="coming-soon-ribbon-back coming-soon-ribbon-back-left" />
                <span className="coming-soon-ribbon-back coming-soon-ribbon-back-right" />
                <span className="coming-soon-ribbon-tail coming-soon-ribbon-tail-left" />
                <span className="coming-soon-ribbon-tail coming-soon-ribbon-tail-right" />
                <span className="coming-soon-ribbon-pattern">
                  <img
                    className="coming-soon-ribbon-icon coming-soon-ribbon-icon-top-left"
                    src="/favicon.ico"
                    alt=""
                    aria-hidden
                  />
                  <img
                    className="coming-soon-ribbon-icon coming-soon-ribbon-icon-bottom-right"
                    src="/favicon.ico"
                    alt=""
                    aria-hidden
                  />
                </span>
                <span className="coming-soon-ribbon-text">COMING SOON</span>
              </div>
            ) : null}

            <CardBody
              className={`space-y-6 sm:space-y-5 ${isEarlyComingSoon ? "coming-soon-plan-body" : ""}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={[
                    "grid h-8 w-8 place-items-center rounded-full border border-stroke/60 bg-surface/70",
                    isEarlyComingSoon ? "coming-soon-plan-accent" : "",
                  ].join(" ")}
                >
                  <span className="text-[18px]">{p.emoji}</span>
                </div>

                <div className={isEarlyComingSoon ? "coming-soon-plan-title" : ""}>
                  <PlanTitle
                    left={p.titleLeft}
                    emphasis={p.titleEmphasis}
                    right={p.titleRight}
                    tone={p.tone}
                    cadenceIndex={cadenceMap[p.slug] ?? 1}
                  />
                </div>
              </div>

              <div className={`space-y-1 ${isEarlyComingSoon ? "coming-soon-plan-copy" : ""}`}>
                <div className="flex items-baseline gap-3">
                  <div
                    className={`font-display text-[32px] font-semibold leading-none ${
                      isEarlyComingSoon ? "coming-soon-plan-price" : ""
                    }`}
                  >
                    ${billing === "annual" ? p.priceAnnual : p.priceMonthly}
                  </div>
                  <div
                    className={`text-muted text-sm ${isEarlyComingSoon ? "coming-soon-plan-copy" : ""}`}
                  >
                    / {billing === "annual" ? "year" : "month"}
                  </div>
                </div>
                <div
                  className={`text-muted/80 text-sm ${isEarlyComingSoon ? "coming-soon-plan-copy" : ""}`}
                >
                  {billing === "annual"
                    ? `Billed annually • ${p.priceAnnual} / year`
                    : `Or ${p.priceAnnual} / year`}
                </div>
              </div>

              <ul
                className={`space-y-3 text-small text-muted sm:space-y-2.5 ${
                  isEarlyComingSoon ? "coming-soon-plan-list" : ""
                }`}
              >
                {p.bullets.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <Check tone={p.tone} />
                    <span className={isEarlyComingSoon ? "coming-soon-plan-copy" : ""}>
                      {renderBullet(b)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  full
                  className={[
                    tonePrimaryButtonClass(p.tone),
                    "!h-11 sm:!h-10",
                    isEarlyComingSoon
                      ? "pointer-events-none coming-soon-plan-accent coming-soon-plan-button-dim"
                      : "brightness-100 saturate-100",
                  ].join(" ")}
                  href={isEarlyComingSoon ? undefined : "/contact"}
                  disabled={isEarlyComingSoon}
                  onClick={
                    isEarlyComingSoon
                      ? undefined
                      : () => track("plan_interest", { plan: p.slug, period: billing })
                  }
                >
                  {isEarlyComingSoon ? "COMING SOON" : "REQUEST ACCESS"}
                </Button>
              </div>
            </CardBody>
          </Card>
          );
        })}

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

      <section className="mt-14" aria-labelledby="alpha-systems-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.31em] text-gold/80">The Next Frontier</p>
          <h2 id="alpha-systems-heading" className="mt-2 font-display text-[26px] font-semibold tracking-tight text-silver sm:text-[34px]">ALPHA SYSTEMS</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">Beyond signal alerts. Purpose-built research and future systems, presented without premature launch or profit claims.</p>
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

      <section className="mt-12 grid items-start gap-10 md:gap-8 lg:grid-cols-2">
        <Card className="h-full">
          <CardBody className="space-y-6">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/80">
              What happens after you pay
            </div>
            <ol className="space-y-5">
              <li className="flex items-start gap-4 rounded-card border border-stroke/60 bg-surface/70 p-4">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold leading-none">
                  1
                </div>
                <div>
                  <div className="text-small font-semibold text-silver">
                    We confirm your payment
                  </div>
                  <div className="text-small text-muted leading-relaxed">
                    Manual USDC on Solana, verified by the team. After payment, send your transaction link + Telegram username to support.
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-4 rounded-card border border-stroke/60 bg-surface/70 p-4">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold leading-none">
                  2
                </div>
                <div>
                  <div className="text-small font-semibold text-silver">You get your invite</div>
                  <div className="text-small text-muted leading-relaxed">
                    We add your Telegram and send channel access.
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-4 rounded-card border border-stroke/60 bg-surface/70 p-4">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold leading-none">
                  3
                </div>
                <div>
                  <div className="text-small font-semibold text-silver">Alerts start flowing</div>
                  <div className="text-small text-muted leading-relaxed">
                    Live signals, links, and filters straight to Telegram.
                  </div>
                </div>
              </li>
            </ol>
            <div className="text-small text-muted/80 leading-relaxed">
              Need help? Message us after purchase and we will onboard you.
            </div>
          </CardBody>
        </Card>

        <Card className="h-full">
          <CardBody className="space-y-4">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/80">
              Details
            </div>
            <div className="divide-y divide-stroke/60 rounded-card border border-stroke/60 bg-surface/70">
              <div className="p-4">
                <div className="text-small font-semibold text-silver">How delivery works</div>
                <div className="mt-2 text-small text-muted leading-relaxed">
                  Alerts are delivered in Telegram channels tied to your plan.
                </div>
              </div>
              <div className="p-4">
                <div className="text-small font-semibold text-silver">Payment method</div>
                <div className="mt-2 text-small text-muted leading-relaxed">
                  Manual USDC on Solana for now. We confirm and invite you quickly. Manual verification keeps access clean and stops shared invites.
                </div>
              </div>
              <div className="p-4">
                <div className="text-small font-semibold text-silver">Cancellation</div>
                <div className="mt-2 text-small text-muted leading-relaxed">
                  Cancel any time by messaging support before your next cycle.
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <div className="mt-6 md:mt-8">
        <PricingDivider />
      </div>

      {/* --- ALPHA-X promo --------------------------------------------------- */}
      <div className="relative mt-10">
        <div
          aria-hidden
          className="alpha-x-glow pointer-events-none absolute inset-0 -z-10 rounded-card"
        />

        <Card className="border-gold/25 bg-[linear-gradient(180deg,rgb(var(--surface2)_/_0.95)_0%,rgb(var(--surface)_/_0.98)_100%)] shadow-[0_0_0_1px_rgb(var(--gold)/0.2)] hover:shadow-[0_0_0_1px_rgb(var(--gold)/0.25),0_20px_60px_rgb(var(--gold)/0.3)]">
          <CardBody className="px-6 pt-18 pb-18 text-center sm:px-12 sm:pt-22 sm:pb-24">
            <svg
              className="mx-auto mb-6 h-9 w-9 text-gold animate-bolt"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />
            </svg>

            <h3 className="font-display text-[42px] font-semibold leading-tight tracking-[0.14em] text-silver sm:text-[72px]">
              ALPHA-X
            </h3>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.5em] text-muted/70">
              Coming Soon
            </div>

            <p className="mx-auto mt-5 max-w-3xl text-balance text-body leading-relaxed text-muted">
              Alpha-X is the future auto layer. It only goes live after enough data, testing, and risk rules.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-small text-muted/85">
              <span className="after:ml-4 after:text-muted/50 after:content-['/']">
                Auto entries + SL/TP
              </span>
              <span className="after:ml-4 after:text-muted/50 after:content-['/']">
                Strict EMA / RSI / Volume / Trend
              </span>
              <span>Breakeven & Trailing Stops</span>
              <span className="hidden sm:inline after:ml-4 after:text-muted/50 after:content-['/']"></span>
              <span className="sm:ml-0">24/7 Telegram alerts</span>
            </div>

            <Button
              href="/waitlist"
              size="lg"
              className="mx-auto mt-8 w-full px-9 font-bold uppercase tracking-[0.28em] shadow-[0_10px_36px_rgb(var(--gold)/0.5)] hover:shadow-[0_12px_42px_rgb(var(--gold)/0.6)] sm:w-auto"
            >
              JOIN WAITLIST
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
