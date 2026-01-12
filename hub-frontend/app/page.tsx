// app/page.tsx
"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Timer, Webhook, Bell } from "lucide-react";
import HeroChart from "@/components/HeroChart";
import { Badge, Button } from "@/components/ui";

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
      className="font-display tabular-nums text-base md:text-lg font-semibold tracking-tight text-silver"
      style={{ display: "inline-block", transform: "translateZ(0)" }}
    />
  );
}

function ClockIcon({ active }: { active: boolean }) {
  return (
    <div className="relative h-5 w-5 text-silver/80">
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
  return <Webhook className={`h-5 w-5 text-silver/80 ${active ? "spin-slow" : ""}`} />;
}

function BellIconDing({ active }: { active: boolean }) {
  return <Bell className={`h-5 w-5 text-silver/80 ${active ? "bell-ding" : ""}`} />;
}

function FeatureRow({ active }: { active: boolean }) {
  // CHANGED:
  // - On desktop: force a single row (no wrap)
  // - On mobile: allow wrap
  return (
    <div className="mt-6 flex flex-wrap md:flex-nowrap gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-stroke/70 bg-surface/40 px-4 py-2.5 md:py-3">
        <ClockIcon active={active} />
        <div className="text-[13px] md:text-[14px] font-medium leading-none text-silver whitespace-nowrap">
          Live Trade Signals
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-stroke/70 bg-surface/40 px-4 py-2.5 md:py-3">
        <WebhookIconSpin active={active} />
        <div className="text-[13px] md:text-[14px] font-medium leading-none text-silver whitespace-nowrap">
          Webhook-Ready
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-stroke/70 bg-surface/40 px-4 py-2.5 md:py-3">
        <BellIconDing active={active} />
        <div className="text-[13px] md:text-[14px] font-medium leading-none text-silver whitespace-nowrap">
          24/7 Alerts
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="group relative rounded-2xl border border-stroke/70 bg-surface/85 p-8 md:p-9 transition-all duration-200 will-change-transform hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgb(var(--gold) / 0.18) 0%, rgb(var(--gold) / 0.08) 35%, rgba(0,0,0,0) 70%)",
          filter: "blur(34px)",
        }}
      />
      <h3 className="font-display relative mb-2 inline-block pb-1 text-lg font-semibold tracking-tight text-silver after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-gold/80 after:via-gold/40 after:to-transparent">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
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
      className="rounded-2xl border border-stroke/70 bg-surface/80 p-4 transition-transform duration-500 will-change-transform"
      style={{ transform: ready ? "translateY(0)" : "translateY(6px)", opacity: ready ? 1 : 0 }}
    >
      <div className="mb-1 flex items-baseline justify-center gap-1">
        <SmoothCounter id={id} start={start} target={target} decimals={decimals} suffix={suffix} durationMs={2600} delayMs={delayMs} onDone={onDone} />
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

type RoadmapItem = {
  step: number;
  title: string;
  tag: "LIVE" | "NEXT" | "IN BUILD" | "PLANNED";
  bullets: string[];
  footer?: string;
  disclaimer?: string;
  cta?: { label: string; href: string };
  anchorId?: string;
};

const ROADMAP_PREVIEW_COUNT = 3;

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    step: 1,
    title: "Phase 1 ✅ Solana AlphaAlerts",
    tag: "LIVE",
    bullets: [
      "Alpha Early Alerts (ultra-early Solana pools + tokens)",
      "Alpha Trend Alerts (momentum + continuation setups)",
      "Alpha Runner Alerts (second-leg + follow-through moves)",
      "Telegram alerts with one-tap links (Dex, chart, explorer)",
      "Safety checks + scoring + \"why skipped\" reasons",
    ],
    footer: "Weekly tuning based on real results (less spam, higher quality)",
  },
  {
    step: 2,
    title: "Phase 2 🔥 ALPHA-X Auto Trader",
    tag: "NEXT",
    bullets: [
      "Auto entries on high-probability setups",
      "Risk sizing so trades stay controlled",
      "Layered take-profits (TP1 / TP2 / TP3)",
      "Stop loss + trailing stop options",
      "Break-even + runner management",
      "Moon bag option (optional runner position with trailing stop)",
      "Full trade logs + performance stats",
    ],
    cta: { label: "Join Waitlist", href: "#waitlist" },
    anchorId: "waitlist",
  },
  {
    step: 3,
    title: "Phase 3 🌐 Multi-Chain Alerts",
    tag: "IN BUILD",
    bullets: [
      "BSC alerts (extra scam and trap filters)",
      "ETH alerts (liquidity + momentum focused)",
      "Same tiers, same scoring, same clean Telegram delivery",
      "Unified dashboard for all chains",
    ],
  },
  {
    step: 4,
    title: "Phase 4 🪙 $ALPHA Token",
    tag: "PLANNED",
    bullets: [
      "Pay for subscriptions with $ALPHA (optional)",
      "Discounts for paying with $ALPHA",
      "Staking perks (beta access, extra features, priority drops)",
      "Community votes on roadmap priorities",
    ],
    disclaimer: "Utility token only. No profit promises.",
  },
  {
    step: 5,
    title: "Phase 5 🧠 Pro Dashboard + Self-Serve Billing",
    tag: "PLANNED",
    bullets: [
      "Self-serve checkout (no more manual payments)",
      "Alert history + search + saved filters",
      "Performance reports (hit rate, drawdown, best horizons)",
      "Webhook delivery (TradingView, Discord, your own bots)",
    ],
  },
];

const ROADMAP_STATUS_TONES: Record<RoadmapItem["tag"], "live" | "next" | "build" | "planned"> = {
  LIVE: "live",
  NEXT: "next",
  "IN BUILD": "build",
  PLANNED: "planned",
};

const RoadmapSection = memo(function RoadmapSection() {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const nextIndex = Number((top.target as HTMLElement).dataset.index);
        if (Number.isNaN(nextIndex)) return;
        setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
      },
      {
        threshold: [0.2, 0.5, 0.8],
        rootMargin: "-35% 0px -45% 0px",
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const toggleExpanded = (step: number) => {
    setExpanded((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  return (
    <section
      id="roadmap"
      className="relative overflow-hidden rounded-3xl border border-stroke/70 bg-surface/70 p-6 md:p-10 shadow-[var(--shadow-soft)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-52 w-[520px] -translate-x-1/2 rounded-full bg-gold/12 blur-[110px]"
      />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.55em] text-gold/70">Roadmap</div>
        <div className="mt-4 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div className="space-y-3">
            <h2
              className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-silver"
              style={{ textShadow: "0 18px 50px rgb(var(--gold) / 0.25)" }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-silver-strong via-silver to-gold">
                Roadmap
              </span>
            </h2>
            <div className="h-px w-24 bg-gradient-to-r from-gold/80 via-gold/40 to-transparent" />
          </div>
          <div className="relative md:pl-6">
            <div
              aria-hidden
              className="absolute left-0 top-2 hidden h-10 w-px bg-gradient-to-b from-gold/70 via-gold/30 to-transparent md:block"
            />
            <p className="text-base md:text-lg text-muted leading-relaxed">
              We ship in phases. Each phase makes alerts{" "}
              <span className="text-silver">cleaner</span>,{" "}
              <span className="text-silver">faster</span>, and{" "}
              <span className="text-silver">easier to use</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-10">
        <div
          aria-hidden
          className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-gold/60 via-gold/25 to-transparent shadow-[0_0_14px_rgb(var(--gold)/0.35)] md:left-1/2"
        />

        <div className="space-y-8 md:space-y-10">
          {ROADMAP_ITEMS.map((item, index) => {
            const side = index % 2 === 0 ? "left" : "right";
            const cardCol = side === "left" ? "md:col-start-1" : "md:col-start-6";
            const spacerCol = side === "left" ? "md:col-start-6" : "md:col-start-1";
            const isActive = activeIndex === index;
            const phaseMatch = item.title.match(/^Phase\s+\d+/);
            const phaseLabel = phaseMatch?.[0] ?? `Phase ${item.step}`;
            const titleRest = phaseMatch ? item.title.slice(phaseLabel.length).trim() : item.title;
            const previewBullets = item.bullets.slice(0, ROADMAP_PREVIEW_COUNT);
            const extraBullets = item.bullets.slice(ROADMAP_PREVIEW_COUNT);
            const hasMore = extraBullets.length > 0;
            const isExpanded = !!expanded[item.step];
            const extraId = `roadmap-extra-${item.step}`;

            return (
              <div
                key={item.title}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                data-index={index}
                className="relative grid grid-cols-1 items-start gap-5 md:grid-cols-9 md:gap-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{
                    duration: shouldReduceMotion ? 0.2 : 0.35,
                    ease: "easeOut",
                    delay: shouldReduceMotion ? 0 : index * 0.07,
                  }}
                  className="order-1 flex justify-start md:order-none md:col-span-1 md:col-start-5 md:justify-center"
                >
                  <div
                    className={[
                      "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-200",
                      "bg-surface2/80",
                      isActive
                        ? "border-gold/70 text-gold shadow-[0_0_20px_rgb(var(--gold)/0.45)]"
                        : "border-silver/40 text-silver/80 shadow-[0_0_14px_rgb(var(--silver)/0.2)]",
                    ].join(" ")}
                  >
                    {item.step}
                  </div>
                </motion.div>

                <motion.div
                  id={item.anchorId}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    duration: shouldReduceMotion ? 0.2 : 0.45,
                    ease: "easeOut",
                    delay: shouldReduceMotion ? 0 : index * 0.08,
                  }}
                  whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                  className={`order-2 md:order-none md:col-span-4 ${cardCol} pl-12 md:pl-0`}
                >
                  <div
                    className={[
                      "group relative rounded-2xl border bg-gradient-to-br from-surface2/80 via-surface/70 to-transparent p-6 md:p-7",
                      "shadow-[0_0_0_1px_rgb(var(--stroke)/0.35)] transition-[box-shadow,background-color,border-color,transform] duration-200 will-change-transform",
                      "focus-within:ring-1 focus-within:ring-gold/40",
                      isActive
                        ? "border-gold/50 bg-surface/85 shadow-[0_0_0_1px_rgb(var(--gold)/0.25),0_30px_80px_-40px_rgb(var(--gold)/0.35)]"
                        : "border-stroke/70 hover:shadow-[0_0_0_1px_rgb(var(--gold)/0.2),0_20px_60px_-30px_rgb(var(--gold)/0.3)]",
                    ].join(" ")}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-2xl border border-stroke/30 opacity-60"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(75% 75% at 0% 0%, rgb(var(--gold) / 0.18) 0%, rgb(var(--gold) / 0.08) 45%, rgba(0,0,0,0) 75%)",
                        filter: "blur(24px)",
                      }}
                    />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <span className="text-[11px] uppercase tracking-[0.45em] text-gold/70">
                          {phaseLabel}
                        </span>
                        <h3 className="font-display text-lg md:text-xl font-semibold text-silver leading-snug break-words">
                          <span className="block max-w-full text-transparent bg-clip-text bg-gradient-to-r from-silver-strong via-silver to-gold drop-shadow-[0_12px_30px_rgb(var(--gold)/0.35)]">
                            {titleRest}
                          </span>
                        </h3>
                      </div>
                      <Badge tone={ROADMAP_STATUS_TONES[item.tag]}>{item.tag}</Badge>
                    </div>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-stroke/70 via-stroke/40 to-transparent" />

                    <ul className="mt-4 space-y-3 text-sm text-muted">
                      {previewBullets.map((bullet) => (
                        <li key={bullet} className="flex min-w-0 gap-3">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold/80 shadow-[0_0_10px_rgb(var(--gold)/0.6)]" />
                          <span className="min-w-0 flex-1 leading-relaxed break-words">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {hasMore ? (
                      <motion.ul
                        id={extraId}
                        aria-hidden={!isExpanded}
                        className="mt-3 space-y-3 overflow-hidden text-sm text-muted"
                        initial={false}
                        animate={
                          isExpanded
                            ? { height: "auto", opacity: 1, marginTop: 8 }
                            : { height: 0, opacity: shouldReduceMotion ? 1 : 0, marginTop: 0 }
                        }
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.25,
                          ease: "easeOut",
                        }}
                      >
                        {extraBullets.map((bullet) => (
                          <li key={bullet} className="flex min-w-0 gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold/80 shadow-[0_0_10px_rgb(var(--gold)/0.6)]" />
                            <span className="min-w-0 flex-1 leading-relaxed break-words">{bullet}</span>
                          </li>
                        ))}
                      </motion.ul>
                    ) : null}

                    {hasMore ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.step)}
                        aria-expanded={isExpanded}
                        aria-controls={extraId}
                        aria-label={`Toggle more details for ${item.title}`}
                        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-gold/80 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                      >
                        {isExpanded ? "Less" : "More"}
                        <span className="text-[10px] text-gold/70">{isExpanded ? "-" : "+"}</span>
                      </button>
                    ) : null}

                    {item.footer ? (
                      <div className="mt-4 text-xs text-muted/80">{item.footer}</div>
                    ) : null}

                    {item.disclaimer ? (
                      <div className="mt-4 text-[11px] text-muted/70">{item.disclaimer}</div>
                    ) : null}

                    {item.cta ? (
                      <div className="mt-5">
                        <Button
                          href={item.cta.href}
                          size="md"
                        >
                          {item.cta.label}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </motion.div>

                <div className={`hidden md:block md:col-span-4 ${spacerCol}`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default function Page() {
  const { ref: featuresScope, inView: featuresInView } = useInView({ threshold: 0.2, once: true });
  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.35, once: true });

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  useEffect(() => {
    if (statsInView && step === 0) setStep(1);
  }, [statsInView, step]);

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* HERO */}
      <section className="grid grid-cols-12 items-center gap-10 md:gap-16">
        {/* LEFT */}
        <div ref={featuresScope as any} className="col-span-12 md:col-span-6 md:pr-10">
          {/* Titles back to big, but keep safe gap from chart via gap+pr */}
          <h1 className="font-display text-silver text-[33px] md:text-[42px] leading-[1.06] font-extrabold tracking-tight">
            Your Market Edge with
          </h1>

          <div className="font-display text-[72px] md:text-[92px] leading-[1.02] font-extrabold tracking-tight text-metal-silver">
            AlphaAlerts
          </div>

          <p className="mt-3 max-w-[56ch] text-[15px] md:text-base text-muted">
            Real-time scans, smart filters, and pro alerts.
            <span className="hidden sm:inline"> Built for serious traders who need reliability.</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/pricing#plans" size="lg">
              Get Alerts
            </Button>
            <Button
              href="#sample-alerts"
              variant="outline"
              size="lg"
            >
              View Sample Alerts
            </Button>
          </div>

          {/* Pills now sit lower (mt-6) and stay in ONE row on desktop */}
          <FeatureRow active={featuresInView} />
        </div>

        {/* RIGHT */}
        <div className="col-span-12 md:col-span-6 md:pl-4">
          <HeroChart height={340} />
        </div>
      </section>

      <section className="rounded-2xl border border-stroke/70 bg-surface/80 p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted/80">How it works</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="flex gap-3">
            <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold">
              1
            </div>
            <div>
              <div className="text-sm font-semibold text-silver">Pick your tier</div>
              <div className="text-sm text-muted">
                Choose Early, Trend, Runner, or the Bundle.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold">
              2
            </div>
            <div>
              <div className="text-sm font-semibold text-silver">Pay and connect</div>
              <div className="text-sm text-muted">
                Manual USDC payment, then we invite you to Telegram.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold">
              3
            </div>
            <div>
              <div className="text-sm font-semibold text-silver">Get alerts live</div>
              <div className="text-sm text-muted">
                Clean signals with links, filters, and scoring in real time.
              </div>
            </div>
          </div>
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

      <section id="sample-alerts" className="grid items-start gap-6 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted/80">Sample alerts</div>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-silver">
            See what hits your Telegram
          </h2>
          <p className="mt-2 text-muted">
            One clean message with entry links, safety checks, and clear market state labels.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
            <span className="rounded-full border border-stroke/70 bg-surface/70 px-3 py-1.5">
              120ms median latency
            </span>
            <span className="rounded-full border border-stroke/70 bg-surface/70 px-3 py-1.5">
              99.9% uptime
            </span>
            <span className="rounded-full border border-stroke/70 bg-surface/70 px-3 py-1.5">
              100+ pairs watched
            </span>
          </div>
          <div className="mt-5">
            <Button href="/pricing#plans" size="md">
              Get Alerts
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-stroke/70 bg-surface2/80 p-5 font-mono text-sm text-text shadow-[0_0_0_1px_rgb(var(--stroke)/0.3)]">
          <div className="flex items-center justify-between text-xs text-muted/80">
            <span>AlphaAlerts / TREND</span>
            <span>now</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="text-silver font-semibold">SOL/USDC / 5m</div>
            <div className="text-text">Signal: BREAKING / Momentum + Volume</div>
            <div className="text-muted">
              Entry: 96.20 / SL: 92.80 / TP1: 101.40 / TP2: 108.00
            </div>
            <div className="text-muted">
              Filters: Mint Renounced / Liquidity Locked / Holders 1,240
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-muted">
            <div className="rounded-lg border border-stroke/70 bg-surface/70 px-2 py-1 text-center">
              Chart
            </div>
            <div className="rounded-lg border border-stroke/70 bg-surface/70 px-2 py-1 text-center">
              Dex
            </div>
            <div className="rounded-lg border border-stroke/70 bg-surface/70 px-2 py-1 text-center">
              Wallet
            </div>
          </div>
        </div>
      </section>

      <section ref={statsRef as any} className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-muted/80">Performance</div>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-tight text-silver">
              Speed and transparency
            </h2>
          </div>
          <div className="text-xs text-muted">Live metrics from recent activity</div>
        </div>

        <div className="rounded-2xl border border-stroke/70 bg-surface/80 p-5 shadow-[0_0_0_1px_rgb(var(--stroke)/0.35)]">
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
              <Button href="/pricing#plans" size="md">
                Get Alerts
              </Button>
            </div>
          </div>
        </div>
      </section>

      <RoadmapSection />

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


