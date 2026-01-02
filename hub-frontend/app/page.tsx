// app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Timer, Webhook, Bell } from "lucide-react";
import HeroChart from "@/components/HeroChart";

declare global {
  interface Window {
    __counterDone?: Record<string, true>;
  }
}

function useInView(options?: IntersectionObserverInit & { once?: boolean }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const once = options?.once ?? true;

  const memo = useMemo(
    () => ({
      root: options?.root ?? null,
      rootMargin: options?.rootMargin ?? "0px",
      threshold: options?.threshold ?? 0.35,
    }),
    [options?.root, options?.rootMargin, options?.threshold]
  );

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setInView(true);
        if (once) io.unobserve(el);
      }
    }, memo);

    io.observe(el);
    return () => {
      try {
        io.unobserve(el);
      } catch {}
      io.disconnect();
    };
  }, [memo, once]);

  return { ref, inView };
}

function useFormatter(decimals: number) {
  const nf = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals]
  );
  return (n: number) => nf.format(n);
}

type CounterProps = {
  id: string;
  target: number;
  decimals?: number;
  start: boolean;
  durationMs?: number;
  delayMs?: number;
  prefix?: string;
  suffix?: string;
  onDone?: () => void;
};

function SmoothCounter({
  id,
  target,
  decimals = 0,
  start,
  durationMs = 2600,
  delayMs = 0,
  prefix = "",
  suffix = "",
  onDone,
}: CounterProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const abortedRef = useRef(false);
  const format = useFormatter(decimals);

  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (!window.__counterDone) window.__counterDone = {};
    if (window.__counterDone[id]) {
      if (spanRef.current) spanRef.current.textContent = `${prefix}${format(target)}${suffix}`;
      finishedRef.current = true;
    } else if (spanRef.current && spanRef.current.textContent === "") {
      spanRef.current.textContent = `${prefix}${format(0)}${suffix}`;
    }
  }, [id, target, prefix, suffix, format]);

  useEffect(() => {
    if (!start || finishedRef.current) return;
    abortedRef.current = false;

    if (prefersReduced) {
      if (spanRef.current) spanRef.current.textContent = `${prefix}${format(target)}${suffix}`;
      finishedRef.current = true;
      window.__counterDone![id] = true;
      onDone && onDone();
      return;
    }

    const eps = Math.pow(10, -decimals) * 0.5;
    const cap = target - eps;

    const ease = (t: number) => {
      const x = Math.min(1, Math.max(0, t));
      return x * x * x * (x * (x * 6 - 15) + 10);
    };

    const run = (ts: number) => {
      if (abortedRef.current) return;
      if (startRef.current === null) startRef.current = ts;

      const p = Math.min(1, (ts - startRef.current) / durationMs);
      const v = ease(p) * target;
      const safe = p < 1 ? Math.min(v, cap) : target;
      const shown = decimals ? safe : Math.round(safe);
      const txt = `${prefix}${format(shown)}${suffix}`;

      if (spanRef.current && spanRef.current.textContent !== txt) spanRef.current.textContent = txt;

      if (p < 1) {
        rafRef.current = requestAnimationFrame(run);
      } else {
        if (spanRef.current) spanRef.current.textContent = `${prefix}${format(target)}${suffix}`;
        finishedRef.current = true;
        window.__counterDone![id] = true;
        onDone && onDone();
      }
    };

    const tid = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(run);
    }, delayMs);

    return () => {
      abortedRef.current = true;
      window.clearTimeout(tid);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [id, start, durationMs, delayMs, target, decimals, prefix, suffix, prefersReduced, format, onDone]);

  return (
    <span
      ref={spanRef}
      className="tabular-nums text-base md:text-lg font-semibold tracking-tight text-white"
      style={{ display: "inline-block", transform: "translateZ(0)" }}
    />
  );
}

function ClockIcon({ active }: { active: boolean }) {
  return (
    <div className="relative h-5 w-5 text-white/90">
      <Timer className="absolute inset-0 h-5 w-5" />
      <svg
        className={`absolute inset-0 ${active ? "clock-hand-rotate" : ""}`}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        style={{ transformOrigin: "50% 50%" }}
      >
        <g transform="translate(8 8)">
          <line x1="0" y1="0" x2="0" y2="-4.6" />
          <circle cx="0" cy="0" r="0.75" fill="currentColor" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

function WebhookIconSpin({ active }: { active: boolean }) {
  return <Webhook className={`h-5 w-5 text-white/90 ${active ? "spin-slow" : ""}`} />;
}

function BellIconDing({ active }: { active: boolean }) {
  return <Bell className={`h-5 w-5 text-white/90 ${active ? "bell-ding" : ""}`} />;
}

function FeatureRow({ active }: { active: boolean }) {
  // CHANGED:
  // - On desktop: force a single row (no wrap)
  // - On mobile: allow wrap
  return (
    <div className="mt-6 flex flex-wrap md:flex-nowrap gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-transparent px-4 py-2.5 md:py-3">
        <ClockIcon active={active} />
        <div className="text-[13px] md:text-[14px] font-medium leading-none text-white whitespace-nowrap">
          Live Trade Signals
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-transparent px-4 py-2.5 md:py-3">
        <WebhookIconSpin active={active} />
        <div className="text-[13px] md:text-[14px] font-medium leading-none text-white whitespace-nowrap">
          Webhook-Ready
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-transparent px-4 py-2.5 md:py-3">
        <BellIconDing active={active} />
        <div className="text-[13px] md:text-[14px] font-medium leading-none text-white whitespace-nowrap">
          24/7 Alerts
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-9 transition-all duration-200 will-change-transform hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(56,189,248,.28),0_26px_90px_-20px_rgba(56,189,248,.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,.18) 0%, rgba(56,189,248,.08) 35%, rgba(0,0,0,0) 70%)",
          filter: "blur(34px)",
        }}
      />
      <h3 className="relative mb-2 inline-block pb-1 text-lg font-semibold tracking-tight after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-sky-400/80 after:via-sky-400/40 after:to-transparent">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-white/70">{children}</p>
    </div>
  );
}

function StatCard({
  id,
  label,
  start,
  target,
  decimals = 0,
  suffix = "",
  delayMs = 0,
  onDone,
}: {
  id: string;
  label: string;
  start: boolean;
  target: number;
  decimals?: number;
  suffix?: string;
  delayMs?: number;
  onDone?: () => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (start) setReady(true);
  }, [start]);

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-transform duration-500 will-change-transform"
      style={{ transform: ready ? "translateY(0)" : "translateY(6px)", opacity: ready ? 1 : 0 }}
    >
      <div className="mb-1 flex items-baseline justify-center gap-1">
        <SmoothCounter id={id} start={start} target={target} decimals={decimals} suffix={suffix} durationMs={2600} delayMs={delayMs} onDone={onDone} />
      </div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

export default function Page() {
  const { ref: featuresScope, inView: featuresInView } = useInView({ threshold: 0.2, once: true });
  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.35, once: true });

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  useEffect(() => {
    if (statsInView && step === 0) setStep(1);
  }, [statsInView, step]);

  return (
    <div className="flex flex-col gap-6 md:gap-7">
      {/* HERO */}
      <section className="grid grid-cols-12 items-center gap-10 md:gap-16">
        {/* LEFT */}
        <div ref={featuresScope as any} className="col-span-12 md:col-span-6 md:pr-10">
          {/* Titles back to “big”, but keep safe gap from chart via gap+pr */}
          <h1 className="text-white text-[33px] md:text-[42px] leading-[1.06] font-extrabold">
            Your Market Edge with
          </h1>

          <div className="text-brand-500 text-[72px] md:text-[92px] leading-[1.02] font-extrabold">
            AlphaAlerts
          </div>

          <p className="mt-3 max-w-[56ch] text-[15px] md:text-base text-white/75">
            Real-time scans, smart filters, and pro alerts. Built for serious traders who need reliability.
          </p>

          {/* Pills now sit lower (mt-6) and stay in ONE row on desktop */}
          <FeatureRow active={featuresInView} />
        </div>

        {/* RIGHT */}
        <div className="col-span-12 md:col-span-6 md:pl-4">
          <HeroChart height={340} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card title="Smart Filters">
          Cut through noise with volatility, liquidity, and timeframe filters. Prevent false alerts and surface only high-quality setups.
        </Card>
        <Card title="Pro Alerts">
          Alerts delivered straight to Telegram or your systems via webhooks. Snooze, batch, or route signals your way.
        </Card>
        <Card title="Visual Trends">
          Momentum, divergence, and liquidation heatmaps so you know why the alert fired and where price might head.
        </Card>
      </section>

      <div ref={statsRef as any} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,.06)]">
        <div className="grid grid-cols-12 items-center gap-4">
          <div className="col-span-12 md:col-span-9">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1.5">
                <StatCard id="median" label="Median alert time" start={step >= 1} target={120} suffix="ms" onDone={() => setTimeout(() => setStep(2), 600)} />
              </div>
              <div className="space-y-1.5">
                <StatCard id="pairs" label="Pairs watched" start={step >= 2} target={100} suffix="+" onDone={() => setTimeout(() => setStep(3), 600)} />
              </div>
              <div className="space-y-1.5">
                <StatCard id="uptime" label="Uptime" start={step >= 3} target={99.9} decimals={1} suffix="%" />
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-3 flex md:justify-end">
            <a href="/pricing" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-6 font-semibold text-black transition-colors hover:bg-black">
              See Pricing
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes rotateCW { to { transform: rotate(360deg) } }
        @keyframes spin360 { to { transform: rotate(360deg) } }
        @keyframes bellDing {
          0% { transform: rotate(0) }
          20% { transform: rotate(-12deg) }
          45% { transform: rotate(8deg) }
          70% { transform: rotate(-4deg) }
          100% { transform: rotate(0) }
        }
        .clock-hand-rotate { animation: rotateCW 3s linear infinite }
        .spin-slow { animation: spin360 3.2s linear infinite; transform-origin: 50% 50% }
        .bell-ding { animation: bellDing 1.8s ease-in-out infinite; transform-origin: 70% 15% }

        @media (prefers-reduced-motion: reduce) {
          .clock-hand-rotate, .spin-slow, .bell-ding { animation: none !important }
          [class*="transition"], [class*="animate-"] { transition: none !important; animation: none !important }
        }
      `}</style>
    </div>
  );
}
