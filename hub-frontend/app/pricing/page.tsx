// filename: app/pricing/page.tsx
"use client";

import React, { useState } from "react";
import { PLANS, BUNDLE, PlanTone } from "@/lib/plans";
import { Card, CardBody, Button, Pill } from "@/components/ui";

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

export default function PricingPage() {
  const brand = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  // We want the cadence to be EARLY -> TREND -> RUNNER always
  const cadenceMap: Record<string, 1 | 2 | 3> = {
    "alpha-early-alerts": 1,
    "alpha-trend-alerts": 2,
    "alpha-runner-alerts": 3,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">Pricing</div>
      <h1 className="font-display text-h2 font-semibold tracking-tight text-silver">
        {brand} Pricing
      </h1>

      <p className="mt-3 text-body text-muted">
        Choose the alerts you want. Payments are manual for now via USDC on Solana.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Pill>120ms median alerts</Pill>
        <Pill>99.9% uptime</Pill>
        <Pill>Telegram-first delivery</Pill>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="#plans" size="md">
          Go Alpha
        </Button>
        <Button href="/#sample-alerts" variant="outline" size="md">
          View Sample Alerts
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="text-small text-muted">
          Choose your billing cadence. Annual unlocks the lowest effective rate.
        </div>
        <div
          className="flex items-center gap-2 rounded-pill border border-stroke/70 bg-surface/70 p-1"
          role="group"
          aria-label="Billing cadence"
        >
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={[
              "rounded-pill px-4 py-1.5 text-small font-semibold transition",
              billing === "monthly"
                ? "bg-gold/20 text-gold border border-gold/40 shadow-soft"
                : "text-muted hover:text-silver",
            ].join(" ")}
            aria-pressed={billing === "monthly"}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={[
              "rounded-pill px-4 py-1.5 text-small font-semibold transition",
              billing === "annual"
                ? "bg-gold/20 text-gold border border-gold/40 shadow-soft"
                : "text-muted hover:text-silver",
            ].join(" ")}
            aria-pressed={billing === "annual"}
          >
            Annual
          </button>
        </div>
      </div>

      {/* 3 main plans */}
      <div id="plans" className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
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

            <CardBody className="space-y-5">
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

              <ul className="space-y-2.5 text-small text-muted">
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
                  size="lg"
                  full
                  className={tonePrimaryButtonClass(p.tone)}
                  href={`/pay/${p.slug}?period=${billing}`}
                >
                  {billing === "annual" ? "Choose Annual" : "Choose Monthly"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}

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
          <CardBody className="relative z-10 space-y-5 md:space-y-0 md:flex md:items-center md:justify-between md:gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold">
                  <span className="text-[18px]">{BUNDLE.emoji}</span>
                </div>
                <h3 className="font-display text-title-lg font-semibold tracking-tight text-silver">
                  {BUNDLE.title}
                </h3>
                <Pill tone="accent" className="text-[11px] font-semibold uppercase tracking-[0.25em]">
                  Best Value
                </Pill>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <div className="font-display text-[32px] font-semibold leading-none">
                    ${billing === "annual" ? BUNDLE.priceAnnual : BUNDLE.priceMonthly}
                  </div>
                  <div className="text-muted text-sm">
                    / {billing === "annual" ? "year" : "month"}
                  </div>
                </div>
                <div className="text-muted/80 text-sm">
                  {billing === "annual"
                    ? `Billed annually • ${BUNDLE.priceAnnual} / year`
                    : `Or ${BUNDLE.priceAnnual} / year`}
                </div>
              </div>

              <ul className="space-y-2.5 text-small text-muted">
                {BUNDLE.bullets.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <Check tone="gold" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:min-w-[320px]">
              <Button
                variant="primary"
                size="lg"
                full
                className={tonePrimaryButtonClass("gold")}
                href={`/pay/${BUNDLE.slug}?period=${billing}`}
              >
                {billing === "annual" ? "Bundle Annual" : "Bundle Monthly"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardBody className="flex h-full flex-col">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/80">
              What happens after you pay
            </div>
            <ol className="mt-5 flex flex-1 flex-col justify-between">
              <li className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold">
                  1
                </div>
                <div>
                  <div className="text-small font-semibold text-silver">
                    We confirm your payment
                  </div>
                  <div className="text-small text-muted leading-relaxed">
                    Manual USDC on Solana, verified by the team.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold">
                  2
                </div>
                <div>
                  <div className="text-small font-semibold text-silver">You get your invite</div>
                  <div className="text-small text-muted leading-relaxed">
                    We add your Telegram and send channel access.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold">
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
            <div className="mt-5 text-small text-muted/80 leading-relaxed">
              Need help? Message us after purchase and we will onboard you.
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardBody className="space-y-2">
              <div className="text-small font-semibold text-silver">How delivery works</div>
              <div className="text-small text-muted">
                Alerts are delivered in Telegram channels tied to your plan.
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2">
              <div className="text-small font-semibold text-silver">Payment method</div>
              <div className="text-small text-muted">
                Manual USDC on Solana for now. We confirm and invite you quickly.
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2">
              <div className="text-small font-semibold text-silver">Cancellation</div>
              <div className="text-small text-muted">
                Cancel any time by messaging support before your next cycle.
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* --- ALPHA-X promo --------------------------------------------------- */}
      <div className="relative mt-10">
        <div
          aria-hidden
          className="alpha-x-glow pointer-events-none absolute inset-0 -z-10 rounded-card"
        />

        <Card className="border-gold/25 bg-[linear-gradient(180deg,rgb(var(--surface2)_/_0.95)_0%,rgb(var(--surface)_/_0.98)_100%)] shadow-[0_0_0_1px_rgb(var(--gold)/0.2)] hover:shadow-[0_0_0_1px_rgb(var(--gold)/0.25),0_20px_60px_rgb(var(--gold)/0.3)]">
          <CardBody className="px-6 py-10 text-center sm:px-10 sm:py-14">
            <svg
              className="mx-auto mb-4 h-8 w-8 text-gold animate-bolt"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />
            </svg>

            <h3 className="font-display text-4xl font-extrabold tracking-tight text-silver sm:text-5xl">
              ALPHA-X
            </h3>
            <div className="mt-1 text-small font-semibold uppercase tracking-widest text-muted/80">
              (Coming Soon)
            </div>

            <p className="mx-auto mt-6 max-w-3xl text-balance text-small leading-relaxed text-muted">
              A hands-free auto-trader that hunts high-probability setups, sizes risk, and manages
              exits for you while you sleep.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-small text-muted">
              <span className="after:ml-4 after:text-muted/50 after:content-['/']">
                Auto entries + SL/TP
              </span>
              <span className="after:ml-4 after:text-muted/50 after:content-['/']">
                Strict EMA / RSI / Volume / Trend
              </span>
              <span>Breakeven & trailing stops</span>
              <span className="hidden sm:inline after:ml-4 after:text-muted/50 after:content-['/']"></span>
              <span className="sm:ml-0">24/7 Telegram alerts</span>
            </div>

            <Button
              href="/waitlist"
              size="lg"
              className="mx-auto mt-8 px-8 font-bold uppercase tracking-wider shadow-[0_8px_30px_rgb(var(--gold)/0.45)] hover:shadow-[0_10px_36px_rgb(var(--gold)/0.55)]"
            >
              Join ALPHA-X Waitlist
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}



