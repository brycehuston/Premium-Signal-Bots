// filename: app/pricing/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PLANS, BUNDLE, PlanTone } from "@/lib/plans";
import { Card, CardBody, Button, Pill } from "@/components/ui";
import { track } from "@/lib/analytics";

function Check({ tone }: { tone: PlanTone }) {
  const colorClass =
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
    "All 3 channels in one.",
    "Best value if you want the full pipeline.",
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
          Pick your lane: Early = new tokens. Trend = momentum. Runner = continuation. Bundle = everything.
        </p>
        <p className="mx-auto mt-3 text-[10px] text-muted sm:text-[11px] md:text-[12px]">
          Choose the alerts you want. Payments are manual for now via USDC on Solana.
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

      {/* 3 main plans */}
      <div
        id="plans"
        className="mt-12 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 scroll-mt-24 md:scroll-mt-32"
      >
        {PLANS.map((p) => (
          <Card
            key={p.slug}
            className={`group relative transition-all duration-200 will-change-transform ${cardGlowClass(
              p.tone
            )}`}
          >
            {/* tone-matched aura */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 -z-10 rounded-card opacity-80 ${auraClass(
                p.tone
              )}`}
            />

            <CardBody className="space-y-6 sm:space-y-5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full border border-stroke/60 bg-surface/70">
                  <span className="text-[18px]">{p.emoji}</span>
                </div>

                <PlanTitle
                  left={p.titleLeft}
                  emphasis={p.titleEmphasis}
                  right={p.titleRight}
                  tone={p.tone}
                  cadenceIndex={cadenceMap[p.slug] ?? 1}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <div className="font-display text-[32px] font-semibold leading-none">
                    ${billing === "annual" ? p.priceAnnual : p.priceMonthly}
                  </div>
                  <div className="text-muted text-sm">
                    / {billing === "annual" ? "year" : "month"}
                  </div>
                </div>
                <div className="text-muted/80 text-sm">
                  {billing === "annual"
                    ? `Billed annually • ${p.priceAnnual} / year`
                    : `Or ${p.priceAnnual} / year`}
                </div>
              </div>

              <ul className="space-y-3 text-small text-muted sm:space-y-2.5">
                {p.bullets.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <Check tone={p.tone} />
                    <span>{renderBullet(b)}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  full
                  className={[tonePrimaryButtonClass(p.tone), "!h-11 sm:!h-10"].join(" ")}
                  href={`/pay/${p.slug}?period=${billing}`}
                  onClick={() =>
                    track("plan_select", { plan: p.slug, period: billing })
                  }
                >
                  {billing === "annual" ? "Choose Annual" : "Choose Monthly"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}

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
                  Best Value
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
                href={`/pay/${BUNDLE.slug}?period=${billing}`}
                onClick={() => {
                  triggerBundleConfetti();
                  track("plan_select", { plan: BUNDLE.slug, period: billing });
                }}
              >
                {billing === "annual" ? "Bundle Annual" : "Bundle Monthly"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="md:col-span-2 lg:col-span-3">
          <PricingDivider />
        </div>
      </div>

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
