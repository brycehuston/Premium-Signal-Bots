"use client";

import { PLANS, BUNDLE } from "@/lib/plans";
import { Card, CardBody, Button } from "@/components/ui";

function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[18px] w-[18px] -mt-[1px] flex-none text-brand-600"
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

export default function PricingPage() {
  const brand = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {brand} — <span className="opacity-70">Pricing</span>
      </h1>
      <p className="mt-2 text-white/70">
        Subscribe to a single bot or grab the bundle. Payments are manual for now via USDC on
        Solana.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.slug}>
            <CardBody className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06]">
                  <span className="text-[18px]">{p.emoji}</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{p.title}</h3>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <div className="text-[32px] font-semibold leading-none">${p.priceMonthly}</div>
                  <div className="text-white/55 text-sm">/ month</div>
                </div>
                <div className="text-white/50 text-sm">or ${p.priceAnnual} / year</div>
              </div>

              <ul className="space-y-2.5 text-[15px] text-white/85">
                {p.bullets.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <Check />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="primary" size="lg" full href={`/pay/${p.slug}?period=monthly`}>
                  Choose Monthly
                </Button>
                <Button variant="ghost" size="lg" full href={`/pay/${p.slug}?period=annual`}>
                  Choose Annual
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}

        <Card className="border-brand-600/40">
          <CardBody className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-600/15 text-brand-600">
                <span className="text-[18px]">{BUNDLE.emoji}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{BUNDLE.title}</h3>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <div className="text-[32px] font-semibold leading-none">
                  ${BUNDLE.priceMonthly}
                </div>
                <div className="text-white/55 text-sm">/ month</div>
              </div>
              <div className="text-white/50 text-sm">or ${BUNDLE.priceAnnual} / year</div>
            </div>

            <ul className="space-y-2.5 text-[15px] text-white/85">
              {BUNDLE.bullets.map((b: string, i: number) => (
                <li key={i} className="flex gap-2.5">
                  <Check />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="primary" size="lg" full href={`/pay/${BUNDLE.slug}?period=monthly`}>
                Bundle Monthly
              </Button>
              <Button variant="outline" size="lg" full href={`/pay/${BUNDLE.slug}?period=annual`}>
                Bundle Annual
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* --- Alpha Bot promo --------------------------------------------------- */}
      <div className="relative col-span-full mt-10">
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

            <h3 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              ALPHA BOT
            </h3>
            <div className="mt-1 text-[15px] font-semibold uppercase tracking-widest text-white/70">
              (Coming Soon)
            </div>

            <p className="mx-auto mt-6 max-w-3xl text-balance text-[15px] leading-relaxed text-white/80">
              A hands-free auto-trader that hunts high-probability setups, sizes risk, and manages
              exits for you — while you sleep.
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

            {/* Gold ALPHA BOT button */}
            <button
              onClick={() => (window.location.href = "/waitlist")}
              className="
                group mx-auto mt-8 inline-flex h-12 items-center justify-center
                rounded-xl px-8 font-bold uppercase tracking-wider
                bg-gradient-to-r from-[#FFD966] to-[#F6C453]
                text-black
                border border-[#FFE27A]
                shadow-[0_6px_25px_rgba(246,196,83,.55)]
                hover:shadow-[0_8px_35px_rgba(246,196,83,.75)]
                hover:scale-[1.05]
                transition-all duration-150
              "
            >
              Join Waitlist
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
