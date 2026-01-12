// filename: app/pricing/page.tsx
"use client";

import React from "react";
import { PLANS, BUNDLE, PlanTone } from "@/lib/plans";
import { Card, CardBody, Button } from "@/components/ui";

function Check({ tone }: { tone: PlanTone }) {
  const colorClass =
    tone === "bronze"
      ? "text-[#D9A06A]"
      : tone === "platinum"
      ? "text-[#D8E6FF]"
      : "text-[#F6C453]";
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

  // Bigger + bolder so it ƒ?opopsƒ??
  return `shimmer-text ${cadence} ${toneClass} font-extrabold text-[1.22em] tracking-wide`;
}

function cardGlowClass(tone: PlanTone) {
  // Border tint + subtle glow on hover
  if (tone === "bronze") {
    return "border-[#D9A06A33] hover:shadow-[0_0_0_1px_rgba(217,160,106,0.18),0_26px_90px_-26px_rgba(217,160,106,0.25)]";
  }
  if (tone === "platinum") {
    return "border-[#D8E6FF33] hover:shadow-[0_0_0_1px_rgba(216,230,255,0.18),0_26px_90px_-26px_rgba(216,230,255,0.22)]";
  }
  // gold
  return "border-[#F6C45333] hover:shadow-[0_0_0_1px_rgba(246,196,83,0.18),0_26px_90px_-26px_rgba(246,196,83,0.28)]";
}

function tonePrimaryButtonClass(tone: PlanTone) {
  const base = "text-white hover:text-white btn-text-shadow";
  if (tone === "bronze") {
    return [
      base,
      "!bg-[linear-gradient(180deg,rgba(214,160,106,0.9),rgba(88,56,34,0.98))]",
      "!border !border-[#D9A06A]/65",
      "!shadow-[0_6px_18px_rgba(217,160,106,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]",
      "hover:!bg-[linear-gradient(180deg,rgba(226,174,118,0.98),rgba(102,64,38,0.98))]",
      "hover:!shadow-[0_8px_24px_rgba(217,160,106,0.5),inset_0_1px_0_rgba(255,255,255,0.22)]",
    ].join(" ");
  }
  if (tone === "platinum") {
    return [
      base,
      "!bg-[linear-gradient(180deg,rgba(214,224,238,0.92),rgba(72,82,98,0.98))]",
      "!border !border-[#C8D6EE]/65",
      "!shadow-[0_6px_18px_rgba(216,230,255,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]",
      "hover:!bg-[linear-gradient(180deg,rgba(226,234,245,0.98),rgba(86,96,114,0.98))]",
      "hover:!shadow-[0_8px_24px_rgba(216,230,255,0.45),inset_0_1px_0_rgba(255,255,255,0.22)]",
    ].join(" ");
  }
  return [
    base,
    "!bg-[linear-gradient(180deg,rgba(236,194,108,0.94),rgba(112,74,24,0.98))]",
    "!border !border-[#F6C453]/70",
    "!shadow-[0_6px_18px_rgba(246,196,83,0.38),inset_0_1px_0_rgba(255,255,255,0.18)]",
    "hover:!bg-[linear-gradient(180deg,rgba(246,206,122,0.98),rgba(126,82,26,0.98))]",
    "hover:!shadow-[0_8px_24px_rgba(246,196,83,0.55),inset_0_1px_0_rgba(255,255,255,0.22)]",
  ].join(" ");
}

function auraStyle(tone: PlanTone): React.CSSProperties {
  // This is the BACK GLOW (the thing you said is all blue).
  // Now it matches each plan.
  if (tone === "bronze") {
    return {
      background:
        "radial-gradient(70% 70% at 50% 0%, rgba(217,160,106,0.18) 0%, rgba(217,160,106,0.07) 40%, rgba(0,0,0,0) 72%)",
      filter: "blur(34px)",
    };
  }
  if (tone === "platinum") {
    return {
      background:
        "radial-gradient(70% 70% at 50% 0%, rgba(225,235,255,0.16) 0%, rgba(225,235,255,0.06) 40%, rgba(0,0,0,0) 72%)",
      filter: "blur(34px)",
    };
  }
  // gold
  return {
    background:
      "radial-gradient(70% 70% at 50% 0%, rgba(246,196,83,0.18) 0%, rgba(246,196,83,0.07) 40%, rgba(0,0,0,0) 72%)",
    filter: "blur(34px)",
  };
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
    <h3 className="font-display text-lg font-semibold tracking-tight text-white">
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
      <strong className="font-semibold text-white">{prefix}</strong>
      {rest}
    </>
  );
}

export default function PricingPage() {
  const brand = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

  // We want the cadence to be EARLY -> TREND -> RUNNER always
  const cadenceMap: Record<string, 1 | 2 | 3> = {
    "alpha-early-alerts": 1,
    "alpha-trend-alerts": 2,
    "alpha-runner-alerts": 3,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {brand} — <span className="opacity-70">Pricing</span>
      </h1>

      <p className="mt-2 text-white/70">
        Choose the alerts you want. Payments are manual for now via USDC on Solana.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          120ms median alerts
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          99.9% uptime
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          Telegram-first delivery
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          href="#plans"
          size="md"
          className={[
            "!bg-brand-600",
            "!text-black",
            "hover:!bg-black hover:!text-white",
          ].join(" ")}
        >
          Get Alerts
        </Button>
        <Button
          href="/#sample-alerts"
          variant="ghost"
          size="md"
          className="!bg-white/[0.04] !text-white/90 hover:!bg-white/10 hover:!text-white"
        >
          View Sample Alerts
        </Button>
      </div>

      {/* 3 main plans */}
      <div id="plans" className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card
            key={p.slug}
            className={`group relative border transition-all duration-200 will-change-transform hover:-translate-y-1 ${cardGlowClass(
              p.tone
            )}`}
          >
            {/* tone-matched aura */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-80"
              style={auraStyle(p.tone)}
            />

            <CardBody className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06]">
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
                    ${p.priceMonthly}
                  </div>
                  <div className="text-white/55 text-sm">/ month</div>
                </div>
                <div className="text-white/50 text-sm">or ${p.priceAnnual} / year</div>
              </div>

              <ul className="space-y-2.5 text-[15px] text-white/85">
                {p.bullets.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <Check tone={p.tone} />
                    <span>{renderBullet(b)}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  full
                  className={tonePrimaryButtonClass(p.tone)}
                  href={`/pay/${p.slug}?period=monthly`}
                >
                  Choose Monthly
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  full
                  href={`/pay/${p.slug}?period=annual`}
                >
                  Choose Annual
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}

        {/* Bundle as a clean full-width panel */}
        <Card
          className={[
            "group relative lg:col-span-3 overflow-hidden border transition-all duration-200 will-change-transform",
            "bg-[linear-gradient(135deg,rgba(246,196,83,0.18),rgba(11,14,21,0.98)_42%,rgba(246,196,83,0.2))]",
            "ring-1 ring-[#F6C453]/25",
            "hover:-translate-y-1 hover:scale-[1.01]",
            "hover:shadow-[0_0_0_1px_rgba(255,222,140,0.55),0_30px_90px_rgba(246,196,83,0.45)]",
            "before:content-[''] before:absolute before:inset-x-6 before:top-0 before:h-px before:z-0",
            "before:bg-[linear-gradient(90deg,rgba(255,223,150,0),rgba(255,223,150,0.85),rgba(255,223,150,0))]",
            "after:content-[''] after:absolute after:-right-16 after:-top-16 after:h-48 after:w-48 after:z-0",
            "after:bg-[radial-gradient(closest-side,rgba(255,220,130,0.3),rgba(255,220,130,0))]",
            "after:opacity-0 after:transition-opacity after:duration-200 group-hover:after:opacity-100",
            cardGlowClass("gold"),
          ].join(" ")}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-80"
            style={auraStyle("gold")}
          />
          <CardBody className="relative z-10 space-y-5 md:space-y-0 md:flex md:items-center md:justify-between md:gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#F6C453]/15 text-[#F6C453]">
                  <span className="text-[18px]">{BUNDLE.emoji}</span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                  {BUNDLE.title}
                </h3>
                <span className="rounded-full border border-[#F6C453]/45 bg-[#F6C453]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#F6C453]">
                  Best Value
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <div className="font-display text-[32px] font-semibold leading-none">
                    ${BUNDLE.priceMonthly}
                  </div>
                  <div className="text-white/55 text-sm">/ month</div>
                </div>
                <div className="text-white/50 text-sm">or ${BUNDLE.priceAnnual} / year</div>
              </div>

              <ul className="space-y-2.5 text-[15px] text-white/85">
                {BUNDLE.bullets.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <Check tone="gold" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 md:min-w-[320px]">
              <Button
                variant="primary"
                size="lg"
                full
                className={tonePrimaryButtonClass("gold")}
                href={`/pay/${BUNDLE.slug}?period=monthly`}
              >
                Bundle Monthly
              </Button>
              <Button
                variant="ghost"
                size="lg"
                full
                href={`/pay/${BUNDLE.slug}?period=annual`}
              >
                Bundle Annual
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardBody className="space-y-4">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">
              What happens after you pay
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-[#F6C453]/15 text-[#F6C453] text-sm font-semibold">
                  1
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">We confirm your payment</div>
                  <div className="text-sm text-white/60">
                    Manual USDC on Solana, verified by the team.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-[#F6C453]/15 text-[#F6C453] text-sm font-semibold">
                  2
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">You get your invite</div>
                  <div className="text-sm text-white/60">
                    We add your Telegram and send channel access.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-[#F6C453]/15 text-[#F6C453] text-sm font-semibold">
                  3
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Alerts start flowing</div>
                  <div className="text-sm text-white/60">
                    Live signals, links, and filters straight to Telegram.
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-white/50">
              Need help? Message us after purchase and we will onboard you.
            </div>
          </CardBody>
        </Card>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">How delivery works</div>
            <div className="mt-1 text-sm text-white/60">
              Alerts are delivered in Telegram channels tied to your plan.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Payment method</div>
            <div className="mt-1 text-sm text-white/60">
              Manual USDC on Solana for now. We confirm and invite you quickly.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Cancellation</div>
            <div className="mt-1 text-sm text-white/60">
              Cancel any time by messaging support before your next cycle.
            </div>
          </div>
        </div>
      </section>

      {/* --- ALPHA-X promo --------------------------------------------------- */}
      <div className="relative mt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[20px]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(246,196,83,0.18) 0%, rgba(246,196,83,0.08) 35%, rgba(0,0,0,0) 70%)",
            filter: "blur(40px)",
          }}
        />

        <Card className="border-[#F6C45333] bg-[linear-gradient(180deg,#0B0E15_0%,#0A0C12_100%)] shadow-[0_0_0_1px_rgba(246,196,83,.15)] hover:shadow-[0_0_0_1px_rgba(246,196,83,.18),0_20px_60px_rgba(246,196,83,.30)]">
          <CardBody className="px-6 py-10 text-center sm:px-10 sm:py-14">
            <svg
              className="mx-auto mb-4 h-8 w-8 text-[#FBD75A] animate-bolt"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />
            </svg>

            <h3 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              ALPHA-X
            </h3>
            <div className="mt-1 text-[15px] font-semibold uppercase tracking-widest text-white/70">
              (Coming Soon)
            </div>

            <p className="mx-auto mt-6 max-w-3xl text-balance text-[15px] leading-relaxed text-white/80">
              A hands-free auto-trader that hunts high-probability setups, sizes risk, and manages
              exits for you while you sleep.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[13px] text-white/75">
              <span className="after:ml-4 after:text-white/30 after:content-['•']">
                Auto entries + SL/TP
              </span>
              <span className="after:ml-4 after:text-white/30 after:content-['•']">
                Strict EMA / RSI / Volume / Trend
              </span>
              <span>Breakeven & trailing stops</span>
              <span className="hidden sm:inline after:ml-4 after:text-white/30 after:content-['•']"></span>
              <span className="sm:ml-0">24/7 Telegram alerts</span>
            </div>

            <button
              onClick={() => (window.location.href = "/waitlist")}
              className={`
                group mx-auto mt-8 inline-flex h-12 items-center justify-center
                rounded-xl px-8 font-bold uppercase tracking-wider
                bg-gradient-to-r from-[#FFD966] to-[#F6C453]
                text-black
                border border-[#FFE27A]
                shadow-[0_6px_25px_rgba(246,196,83,.55)]
                hover:shadow-[0_8px_35px_rgba(246,196,83,.75)]
                hover:scale-[1.05]
                transition-all duration-150
              `}
            >
              Join Waitlist
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
