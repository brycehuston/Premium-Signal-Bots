import HeroChart from "@/components/HeroChart";

export default function Page() {
  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="mb-4 text-5xl font-bold leading-tight">
            Your Market Edge with <span className="text-brand-500">AlphaAlerts</span>
          </h1>
          <p className="mb-6 text-white/70">
            Real-time scans, smart filters, and pro alerts. Built for serious traders who need reliability.
          </p>

          <ul className="mt-6 mb-8 grid grid-cols-2 gap-2 text-sm text-white/70">
            <li>• Lightning-speed trade alerts</li>
            <li>• 100+ pairs monitored in real time</li>
            <li>• Multi-bot, multi-strategy signals</li>
            <li>• Reliable uptime with auto-failover</li>
          </ul>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/95 px-4 py-1 text-xs text-black">24/7 Telegram Alerts</span>
            <span className="rounded-full border border-white/10 bg-white/95 px-4 py-1 text-xs text-black">No Spam</span>
            <span className="rounded-full border border-white/10 bg-white/95 px-4 py-1 text-xs text-black">Zero Lock-In</span>
            <span className="rounded-full border border-white/10 bg-white/95 px-4 py-1 text-xs text-black">High-Signals Only</span>
          </div>
        </div>

        <HeroChart />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 will-change-transform hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(56,189,248,.28),0_26px_90px_-20px_rgba(56,189,248,.35)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,.18) 0%, rgba(56,189,248,.08) 35%, rgba(0,0,0,0) 70%)",
              filter: "blur(34px)",
            }}
          />
          <h3 className="relative mb-3 inline-block pb-1 text-xl font-semibold tracking-tight after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-sky-400/80 after:via-sky-400/40 after:to-transparent">
            Smart Filters
          </h3>
          <p className="text-sm leading-relaxed text-white/70">
            Cut through noise with volatility, liquidity, and timeframe filters. Prevent false alerts and surface only high-quality setups.
          </p>
        </div>

        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 will-change-transform hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(56,189,248,.28),0_26px_90px_-20px_rgba(56,189,248,.35)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,.18) 0%, rgba(56,189,248,.08) 35%, rgba(0,0,0,0) 70%)",
              filter: "blur(34px)",
            }}
          />
          <h3 className="relative mb-3 inline-block pb-1 text-xl font-semibold tracking-tight after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-sky-400/80 after:via-sky-400/40 after:to-transparent">
            Pro Alerts
          </h3>
          <p className="text-sm leading-relaxed text-white/70">
            Alerts delivered straight to Telegram — or webhooks for advanced routing. Snooze, batch, or route signals the way you want.
          </p>
        </div>

        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 will-change-transform hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(56,189,248,.28),0_26px_90px_-20px_rgba(56,189,248,.35)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,.18) 0%, rgba(56,189,248,.08) 35%, rgba(0,0,0,0) 70%)",
              filter: "blur(34px)",
            }}
          />
          <h3 className="relative mb-3 inline-block pb-1 text-xl font-semibold tracking-tight after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-sky-400/80 after:via-sky-400/40 after:to-transparent">
            Visual Trends
          </h3>
          <p className="text-sm leading-relaxed text-white/70">
            Momentum, divergence, and liquidation heatmaps — visual context so you know exactly why the alert fired, and where price might head.
          </p>
        </div>
      </section>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,.06),0_30px_120px_-30px_rgba(2,6,23,.6)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="grid w-full grid-cols-3 gap-6 text-center md:w-auto">
            <div>
              <div className="text-2xl font-medium tracking-tight">120ms</div>
              <div className="text-xs text-white/60">Median alert time</div>
            </div>
            <div>
              <div className="text-2xl font-medium tracking-tight">100+</div>
              <div className="text-xs text-white/60">Pairs watched</div>
            </div>
            <div>
              <div className="text-2xl font-medium tracking-tight">99.9%</div>
              <div className="text-xs text-white/60">Uptime</div>
            </div>
          </div>
          <a
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 font-semibold text-black transition-colors hover:bg-white"
          >
            See Pricing
          </a>
        </div>
      </div>
    </div>
  );
}
