// app/page.tsx
"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { Easing } from "motion-utils";
import { Webhook } from "lucide-react";
import HeroChart from "@/components/HeroChart";
import { Badge, Button, Card, CardBody, Pill, SectionHeading } from "@/components/ui";

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
  const doneNotifiedRef = useRef(false);
  const abortedRef = useRef(false);
  const format = useFormatter(decimals);

  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    doneNotifiedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!window.__counterDone) window.__counterDone = {};
    if (window.__counterDone[id]) {
      if (spanRef.current) spanRef.current.textContent = `${prefix}${format(target)}${suffix}`;
      finishedRef.current = true;
      if (!doneNotifiedRef.current) {
        doneNotifiedRef.current = true;
        onDone && onDone();
      }
    } else if (spanRef.current && spanRef.current.textContent === "") {
      spanRef.current.textContent = `${prefix}${format(0)}${suffix}`;
    }
  }, [id, target, prefix, suffix, format, onDone]);

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
        if (!doneNotifiedRef.current) {
          doneNotifiedRef.current = true;
          onDone && onDone();
        }
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
      className="font-display tabular-nums text-2xl md:text-3xl font-semibold tracking-tight text-silver"
      style={{ display: "inline-block", transform: "translateZ(0)" }}
    />
  );
}

function ClockIcon({ active }: { active: boolean }) {
  return (
    <div className="relative h-5 w-5">
      <svg
        className="absolute inset-0 h-5 w-5"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="8.25" className="clock-face" strokeWidth="1.5" />
        <g className="clock-ticks" strokeWidth="1.2" strokeLinecap="round">
          <line x1="10" y1="2.6" x2="10" y2="4.2" />
          <line x1="17.4" y1="10" x2="15.8" y2="10" />
          <line x1="10" y1="17.4" x2="10" y2="15.8" />
          <line x1="2.6" y1="10" x2="4.2" y2="10" />
        </g>
        <g className={active ? "clock-hand-rotate" : ""} style={{ transformOrigin: "50% 50%" }}>
          <line x1="10" y1="10" x2="10" y2="4.8" className="clock-hand" strokeWidth="1.6" />
          <circle cx="10" cy="10" r="1.1" className="clock-center" />
        </g>
      </svg>
    </div>
  );
}

function WebhookIconSpin({ active }: { active: boolean }) {
  return (
    <div className={`relative h-5 w-5 webhook-wrap ${active ? "webhook-wind" : ""}`}>
      <span className={`webhook-rays ${active ? "webhook-rays-active" : ""}`} aria-hidden="true" />
      <span className={`webhook-blast ${active ? "webhook-blast-on" : ""}`} aria-hidden="true" />
      <Webhook
        className={`h-5 w-5 webhook-icon ${active ? "webhook-spin" : ""}`}
        strokeWidth={2.2}
      />
    </div>
  );
}

function BellIconDing({ active, heavy }: { active: boolean; heavy: boolean }) {
  const swingClass = active ? (heavy ? "bell-ding-heavy" : "bell-ding") : "";
  return (
    <div className="relative h-6 w-6">
      <svg
        className="absolute inset-0 h-6 w-6"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <g className={swingClass} style={{ transformOrigin: "50% 20%" }}>
          <path
            d="M10 3.6c-2.6 0-4.6 2.1-4.6 5v2.7L4.3 13.6h11.4l-1.1-2.3V8.6c0-2.9-2-5-4.6-5z"
            className="bell-shell"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 3.6c-2.6 0-4.6 2.1-4.6 5v2.7L4.3 13.6h11.4l-1.1-2.3V8.6c0-2.9-2-5-4.6-5z"
            className="bell-highlight"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.6 14.6c.4 1.2 1.3 1.9 2.4 1.9s2-.7 2.4-1.9"
            className="bell-base"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="10" cy="13.3" r="1.2" className="bell-clapper" />
        </g>
        <g className={`bell-rings ${active ? "bell-ringing" : ""} ${heavy ? "bell-ringing-heavy" : ""}`}>
          <path
            d="M3.4 7.1c-.9 1-.9 2.6 0 3.6"
            className="bell-ring bell-ring-left"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M16.6 7.1c.9 1 .9 2.6 0 3.6"
            className="bell-ring bell-ring-right"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

function SectionDivider() {
  const prefersReduced = useReducedMotion();
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: dividerRef,
    offset: ["start end", "end start"],
  });
  const travel = useTransform(scrollYProgress, [0, 1], ["15%", "85%"]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1, 0.7]);
  const sweep = useTransform(scrollYProgress, [0, 1], ["6%", "94%"]);
  const sweepGlow = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 0.4]);

  return (
    <div ref={dividerRef} aria-hidden className="relative flex items-center justify-center py-12 md:py-20">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stroke/70 to-transparent" />
      <span className="divider-dust bell-dust-shower bell-dust-loop bell-dust-boost dust-cycle" aria-hidden="true" />
      <span
        className="divider-dust bell-dust-shower bell-dust-loop bell-dust-boost-2 dust-cycle"
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute top-1/2 h-px w-40 -translate-y-1/2 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_0_18px_rgb(var(--gold)/0.45)] md:w-56"
        style={{
          left: prefersReduced ? "50%" : sweep,
          opacity: prefersReduced ? 0.6 : sweepGlow,
          translateX: "-50%",
        }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/2 flex items-center gap-2 -translate-y-1/2 relative"
        style={{
          left: prefersReduced ? "50%" : travel,
          opacity: prefersReduced ? 1 : glow,
          translateX: "-50%",
        }}
      >
        <span
          className="divider-dust divider-dust--trail bell-dust-shower bell-dust-loop bell-dust-boost dust-cycle"
          aria-hidden="true"
        />
        <span
          className="divider-dust divider-dust--trail bell-dust-shower bell-dust-loop bell-dust-boost-2 dust-cycle"
          aria-hidden="true"
        />
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_12px_rgb(var(--gold)/0.55)]" />
        <span className="h-1 w-1 rounded-full bg-gold/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_12px_rgb(var(--gold)/0.55)]" />
      </motion.div>
    </div>
  );
}

function FeatureRow({ active }: { active: boolean }) {
  const [heavyRing, setHeavyRing] = useState(false);

  useEffect(() => {
    if (!active) {
      setHeavyRing(false);
      return;
    }

    let triggerId: number | undefined;
    let resetId: number | undefined;
    let cancelled = false;

    const schedule = () => {
      triggerId = window.setTimeout(() => {
        if (cancelled) return;
        setHeavyRing(true);
        resetId = window.setTimeout(() => {
          if (cancelled) return;
          setHeavyRing(false);
          schedule();
        }, 2000);
      }, 5000);
    };

    schedule();
    return () => {
      cancelled = true;
      if (triggerId) window.clearTimeout(triggerId);
      if (resetId) window.clearTimeout(resetId);
    };
  }, [active]);

  return (
    <div className="mt-6 flex flex-wrap gap-3 md:flex-nowrap">
      <div className="flex items-center gap-2 rounded-pill border border-stroke/70 bg-surface/70 px-4 py-2">
        <ClockIcon active={active} />
        <div className="text-small font-medium leading-none text-silver whitespace-nowrap">
          Live Trade Signals
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-pill border border-stroke/70 bg-surface/70 px-4 py-2">
        <WebhookIconSpin active={active} />
        <div className="text-small font-medium leading-none text-silver whitespace-nowrap">
          Webhook-Ready
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-pill border border-stroke/70 bg-surface/70 px-4 py-2">
        <span className="relative inline-flex overflow-visible">
          <BellIconDing active={active} heavy={heavyRing} />
          <span className="bell-dust-shower bell-dust-loop bell-dust-local dust-cycle" aria-hidden="true" />
          <span
            className="bell-dust-shower bell-dust-loop bell-dust-local bell-dust-boost dust-cycle"
            aria-hidden="true"
          />
          <span
            className="bell-dust-shower bell-dust-loop bell-dust-local bell-dust-boost-2 dust-cycle"
            aria-hidden="true"
          />
        </span>
        <div className="text-small font-medium leading-none text-silver whitespace-nowrap">
          24/7 Alerts
        </div>
      </div>
    </div>
  );
}

type AlertReelTone = "bronze" | "platinum" | "gold";

type AlertReelItem = {
  id: string;
  tone: AlertReelTone;
  label: string;
  pair: string;
  signal: string;
  score: string;
  meta: string[];
};

const ALERT_REEL_ITEMS: AlertReelItem[] = [
  {
    id: "early",
    tone: "bronze",
    label: "EARLY",
    pair: "SOL/USDC",
    signal: "New pool detected + safety clear",
    score: "Score 86",
    meta: ["Liq 17k", "Holders 114", "Age 2m"],
  },
  {
    id: "trend",
    tone: "platinum",
    label: "TREND",
    pair: "SOL/USDC",
    signal: "Momentum + continuation setup",
    score: "Score 91",
    meta: ["Tx 1.4k", "Vol +38%", "State BREAKING"],
  },
  {
    id: "runner",
    tone: "gold",
    label: "RUNNER",
    pair: "SOL/USDC",
    signal: "Second-leg breakout confirmed",
    score: "Score 88",
    meta: ["Vol +52%", "Liq 410k", "Trend strong"],
  },
];

const ALERT_REEL_TONES: Record<
  AlertReelTone,
  { text: string; dot: string; chip: string; scan: string }
> = {
  bronze: {
    text: "text-bronze",
    dot: "bg-bronze/80 shadow-[0_0_12px_rgb(var(--tone-bronze)/0.6)]",
    chip: "border-bronze/40 text-bronze bg-bronze/10",
    scan: "rgb(var(--tone-bronze) / 0.35)",
  },
  platinum: {
    text: "text-platinum",
    dot: "bg-platinum/80 shadow-[0_0_12px_rgb(var(--tone-platinum)/0.55)]",
    chip: "border-platinum/40 text-platinum bg-platinum/10",
    scan: "rgb(var(--tone-platinum) / 0.35)",
  },
  gold: {
    text: "text-gold",
    dot: "bg-gold/80 shadow-[0_0_12px_rgb(var(--gold)/0.55)]",
    chip: "border-gold/40 text-gold bg-gold/10",
    scan: "rgb(var(--gold) / 0.35)",
  },
};

function HeroAlertReel() {
  const prefersReduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAutoPlay((prev) => !prev);
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (prefersReduced || !autoPlay) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ALERT_REEL_ITEMS.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [prefersReduced, autoPlay]);

  return (
    <div className="relative rounded-card border border-stroke/70 bg-surface/80 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-muted/80">
          <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_10px_rgb(var(--gold)/0.55)]" />
          Alert Reel
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted/70">
          <span
            className={[
              "relative h-4 w-9 rounded-full border border-stroke/70 bg-surface/70 transition-colors",
              autoPlay ? "border-emerald-400/40 bg-emerald-400/10" : "",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-transform",
                autoPlay
                  ? "translate-x-[18px] bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  : "translate-x-[3px] bg-muted/70",
              ].join(" ")}
            />
          </span>
          <span
            className={[
              "h-2 w-2 rounded-full",
              prefersReduced || !autoPlay ? "bg-muted/60" : "bg-success/80 animate-pulse",
              "shadow-[0_0_10px_rgb(var(--success)/0.55)]",
            ].join(" ")}
          />
          {autoPlay ? "Live" : "Idle"}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {ALERT_REEL_ITEMS.map((item, index) => {
          const tone = ALERT_REEL_TONES[item.tone];
          const isActive = index === activeIndex;
          return (
            <div
              key={item.id}
              className={[
                "alert-reel-item",
                isActive ? "alert-reel-item--active" : "opacity-70",
              ].join(" ")}
              style={{ ["--reel-color" as any]: tone.scan }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  <span className={`text-[11px] font-semibold tracking-[0.35em] ${tone.text}`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted/70">
                  {item.pair}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-4 text-small">
                <span className="text-silver">{item.signal}</span>
                <span className="text-muted">{item.score}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {item.meta.map((meta) => (
                  <span
                    key={meta}
                    className={`rounded-pill border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${tone.chip}`}
                  >
                    {meta}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type StepItemProps = {
  step: number;
  order: 1 | 2 | 3;
  title: string;
  description: string;
};

function StepItem({ step, order, title, description }: StepItemProps) {
  return (
    <li
      className={`how-step how-step-${order} flex gap-3 rounded-card border border-stroke/70 bg-surface/70 p-4.5 shadow-soft md:p-5`}
    >
      <div className="how-step-badge mt-0.5 grid h-9 w-9 place-items-center rounded-full text-sm font-semibold">
        {step}
      </div>
      <div className="space-y-1">
        <div className="how-step-title text-small font-semibold">{title}</div>
        <div className="how-step-desc text-small">{description}</div>
      </div>
    </li>
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
      className="rounded-card border border-stroke/70 bg-surface/80 p-5 text-center shadow-soft transition-transform duration-500 will-change-transform"
      style={{ transform: ready ? "translateY(0)" : "translateY(6px)", opacity: ready ? 1 : 0 }}
    >
      <div className="mb-2 flex items-baseline justify-center gap-1">
        <SmoothCounter
          id={id}
          start={start}
          target={target}
          decimals={decimals}
          suffix={suffix}
          durationMs={2600}
          delayMs={delayMs}
          onDone={onDone}
        />
      </div>
      <div className="text-[11px] uppercase tracking-[0.28em] text-muted/80">{label}</div>
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
const EASE_OUT: Easing = "easeOut";

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    step: 1,
    title: "Phase 1 ⚡ Solana AlphaAlerts",
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
    title: "Phase 2 🤖 ALPHA-X Auto Trader",
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
    title: "Phase 4 🪙 ALPHA Access Token",
    tag: "PLANNED",
    bullets: [
      "Pay for subscriptions with $ALPHA (optional)",
      "Discounts for paying with $ALPHA",
      "Staking perks (beta access, extra features, priority drops)",
      "Community votes on roadmap priorities",
    ],
    disclaimer: "Real Utility Token. Built for Access and Features.",
  },
  {
    step: 5,
    title: "Phase 5 🧭 Pro Dashboard + Self-Serve Billing",
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
      className="relative overflow-hidden rounded-card border border-stroke/70 bg-surface/70 p-6 shadow-soft md:p-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-52 w-[520px] -translate-x-1/2 rounded-full bg-gold/12 blur-[110px]"
      />
      <div className="relative">
        <div className="text-eyebrow uppercase tracking-[0.35em] text-gold/70">Roadmap</div>
        <div className="mt-4 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div className="space-y-3">
            <h2 className="font-display text-h2 font-semibold tracking-tight text-silver">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-silver-strong via-silver to-gold drop-shadow-[0_18px_50px_rgb(var(--gold)/0.25)]">
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
            <p className="text-body text-muted leading-relaxed">
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
                    ease: EASE_OUT,
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
                    ease: EASE_OUT,
                    delay: shouldReduceMotion ? 0 : index * 0.08,
                  }}
                  whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                  className={`order-2 md:order-none md:col-span-4 ${cardCol} pl-10 md:pl-0`}
                >
                  <div
                    className={[
                      "group relative rounded-card border bg-gradient-to-br from-surface2/80 via-surface/70 to-transparent p-6 md:p-7",
                      "shadow-soft transition-[box-shadow,background-color,border-color,transform] duration-200 will-change-transform",
                      "focus-within:ring-1 focus-within:ring-gold/40",
                      isActive
                        ? "border-gold/50 bg-surface/85 shadow-[0_0_0_1px_rgb(var(--gold)/0.25),0_26px_70px_-36px_rgb(var(--gold)/0.35)]"
                        : "border-stroke/70 hover:shadow-[0_0_0_1px_rgb(var(--gold)/0.2),0_18px_60px_-32px_rgb(var(--gold)/0.3)]",
                    ].join(" ")}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-card border border-stroke/30 opacity-60"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
                    />
                    <div
                      aria-hidden
                      className="roadmap-card-glow pointer-events-none absolute inset-0 -z-10 rounded-card opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <span className="text-eyebrow uppercase tracking-[0.35em] text-gold/70">
                          {phaseLabel}
                        </span>
                        <h3 className="font-display text-title-lg md:text-h3 font-semibold text-silver leading-snug break-words">
                          <span className="block max-w-full text-transparent bg-clip-text bg-gradient-to-r from-silver-strong via-silver to-gold drop-shadow-[0_12px_30px_rgb(var(--gold)/0.35)]">
                            {titleRest}
                          </span>
                        </h3>
                      </div>
                      <Badge tone={ROADMAP_STATUS_TONES[item.tag]}>{item.tag}</Badge>
                    </div>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-stroke/70 via-stroke/40 to-transparent" />

                    <ul className="mt-4 space-y-3 text-small text-muted">
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
                          ease: EASE_OUT,
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
  const { ref: howRef, inView: howInView } = useInView({ threshold: 0.35, once: false });
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const glowDrift = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const glowDriftAlt = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.35, 0.7, 0.35]);

  const [heroView, setHeroView] = useState<"chart" | "reel">("chart");
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [showStealthCta, setShowStealthCta] = useState(false);
  const stealthTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (statsInView && step === 0) setStep(1);
  }, [statsInView, step]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroView((prev) => (prev === "chart" ? "reel" : "chart"));
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  const { ref: stealthRef, inView: stealthInView } = useInView({
    threshold: 0.25,
    once: true,
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      setShowStealthCta(true);
      return;
    }
    if (!stealthInView || showStealthCta || stealthTimerRef.current) return;
    stealthTimerRef.current = window.setTimeout(() => {
      setShowStealthCta(true);
    }, 10000);
  }, [shouldReduceMotion, showStealthCta, stealthInView]);

  useEffect(() => {
    return () => {
      if (stealthTimerRef.current) window.clearTimeout(stealthTimerRef.current);
    };
  }, []);

  const revealProps = {
    initial: shouldReduceMotion
      ? { opacity: 1, y: 0, filter: "blur(0px)" }
      : { opacity: 0, y: 20, filter: "blur(6px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: shouldReduceMotion ? 0 : 0.85, ease: EASE_OUT },
  };
  const heroSwapTransition = {
    duration: shouldReduceMotion ? 0 : 0.9,
    ease: [0.22, 1, 0.36, 1] as Easing,
  };

  return (
    <div className="relative flex flex-col gap-8 md:gap-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-36 left-10 h-[26rem] w-[26rem] rounded-full bg-gold/10 blur-[140px]"
          style={{ y: glowDrift, opacity: glowOpacity }}
        />
        <motion.div
          className="absolute top-[38%] right-0 h-[30rem] w-[30rem] rounded-full bg-silver/10 blur-[160px]"
          style={{ y: glowDriftAlt, opacity: glowOpacity }}
        />
      </div>

      <motion.section {...revealProps} className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
        <div ref={featuresScope as any} className="md:col-span-6 md:pr-10">
          <div className="space-y-5">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">AlphaAlerts</div>
            <h1 className="font-display text-silver">
              <span className="block text-hero-sub font-semibold tracking-[-0.01em]">
                Your Market Edge with
              </span>
              <span className="block text-hero font-black text-metal-silver">AlphaAlerts</span>
            </h1>
            <p className="max-w-[56ch] text-body text-muted">
              AI-powered Solana alerts. Catch new tokens, trends, and runners before the crowd.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              href="/pricing#plans"
              size="lg"
              className="min-w-[180px] !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
            >
              GO ALPHA
            </Button>
            <Button href="#sample-alerts" variant="outline" size="lg" className="min-w-[180px]">
              SAMPLE ALERTS
            </Button>
          </div>

          <FeatureRow active={featuresInView} />
        </div>

        <div className="md:col-span-6 md:pl-4">
          <div className="space-y-4 md:space-y-6">
            <div className="flex justify-end">
              <div
                className="flex items-center gap-2 rounded-full border border-stroke/60 bg-surface/60 px-2 py-1"
                role="tablist"
                aria-label="Hero view"
              >
                <button
                  type="button"
                  onClick={() => setHeroView("chart")}
                  aria-pressed={heroView === "chart"}
                  aria-label="Show chart"
                  className={[
                    "h-2.5 w-2.5 rounded-full transition",
                    heroView === "chart"
                      ? "bg-gold shadow-[0_0_8px_rgb(var(--gold)/0.65)]"
                      : "bg-stroke/70 hover:bg-silver/40",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setHeroView("reel")}
                  aria-pressed={heroView === "reel"}
                  aria-label="Show alert reel"
                  className={[
                    "h-2.5 w-2.5 rounded-full transition",
                    heroView === "reel"
                      ? "bg-gold shadow-[0_0_8px_rgb(var(--gold)/0.65)]"
                      : "bg-stroke/70 hover:bg-silver/40",
                  ].join(" ")}
                />
              </div>
            </div>

            <div className="relative isolate min-h-[360px] md:min-h-[380px] overflow-visible">
              <motion.div
                aria-hidden={heroView !== "chart"}
                className="absolute inset-0"
                animate={
                  heroView === "chart"
                    ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                    : { opacity: 0, scale: 0.985, filter: "blur(8px)" }
                }
                transition={heroSwapTransition}
                style={{
                  zIndex: heroView === "chart" ? 2 : 1,
                  pointerEvents: heroView === "chart" ? "auto" : "none",
                }}
              >
                <HeroChart height={340} />
              </motion.div>
              <motion.div
                aria-hidden={heroView !== "reel"}
                className="absolute inset-0 flex items-center justify-center"
                animate={
                  heroView === "reel"
                    ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                    : { opacity: 0, scale: 0.985, filter: "blur(8px)" }
                }
                transition={heroSwapTransition}
                style={{
                  zIndex: heroView === "reel" ? 2 : 1,
                  pointerEvents: heroView === "reel" ? "auto" : "none",
                }}
              >
                <div className="w-full max-w-[520px]">
                  <HeroAlertReel />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      <SectionDivider />

      <motion.section
        {...revealProps}
        ref={howRef as any}
        className={`how-it-works ${howInView ? "how-it-works--active" : ""} rounded-card border border-stroke/70 bg-surface/80 p-6 shadow-soft md:p-8`}
      >
        <SectionHeading
          eyebrow="How it works"
          title="Three Steps To Go Live"
          subtitle="Pick a tier, pay in USDC, and get clean alerts in Telegram."
          className="space-y-3"
        />
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          <StepItem
            step={1}
            order={1}
            title="Pick Your Tier"
            description="Choose Early, Trend, Runner, or the Alpha Alerts Bundle."
          />
          <StepItem
            step={2}
            order={2}
            title="Pay and Connect"
            description="Manual USDC payment, then we invite you to Telegram."
          />
          <StepItem
            step={3}
            order={3}
            title="Get Alerts Live"
            description="Clean signals with links, filters, and scoring in real time."
          />
        </ol>
      </motion.section>

      <SectionDivider />

      <motion.section {...revealProps} className="space-y-8">
        <SectionHeading
          align="center"
          eyebrow="Built to keep you early"
          title="Early, Safe, And In Control"
          subtitle="Cleaner signals, fewer rugs, and a simple way to stay early on Solana."
        />
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
            />
            <CardBody className="space-y-3">
              <h3 className="font-display text-title-lg font-semibold text-silver">
                Smart Risk Filters
              </h3>
              <p className="text-small text-muted">
                Rugs, honeypots, and thin liquidity get filtered out before they hit your feed.
              </p>
            </CardBody>
          </Card>
          <Card className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
            />
            <CardBody className="space-y-3">
              <h3 className="font-display text-title-lg font-semibold text-silver">
                Alpha-Grade Alerts
              </h3>
              <p className="text-small text-muted">
                Early, Trend, and Runner alerts delivered to Telegram with only the essentials.
              </p>
            </CardBody>
          </Card>
          <Card className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
            />
            <CardBody className="space-y-3">
              <h3 className="font-display text-title-lg font-semibold text-silver">
                Stacked Alpha Flow
              </h3>
              <p className="text-small text-muted">
                Track a token from birth to breakout with one clean alert stack.
              </p>
            </CardBody>
          </Card>
        </div>
      </motion.section>

      <SectionDivider />

      <motion.section
        {...revealProps}
        id="sample-alerts"
        className="grid items-start gap-8 md:grid-cols-2 scroll-mt-24 md:scroll-mt-32"
      >
        <div className="space-y-5">
          <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/80">Sample Alerts</div>
          <h2 className="font-display text-h2 font-semibold tracking-tight text-silver">
            See What Hits Your Telegram
          </h2>
          <p className="text-body text-muted">
            One clean message with entry links, safety checks, and clear market state labels.
          </p>
          <div className="flex flex-wrap gap-3">
            <Pill className="pill-shimmer pill-shimmer-delay-1">Live Signal Feed</Pill>
            <Pill className="pill-shimmer pill-shimmer-delay-2">Scored + Filtered</Pill>
            <Pill className="pill-shimmer pill-shimmer-delay-3">One-Tap Links</Pill>
          </div>
          <div>
            <Button
              href="/pricing#plans"
              size="md"
              className="h-10 !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
            >
              GO ALPHA
            </Button>
          </div>
        </div>

        <Card className="bg-surface2/80">
          <CardBody className="space-y-4 text-text">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-muted/80">
              <span>AlphaAlerts / Alert</span>
              <span className="text-gold">Live</span>
            </div>

            <div className="space-y-1">
              <div className="font-display text-title-lg font-semibold text-silver leading-tight">
                New York Crime
              </div>
              <div className="text-small text-muted">
                <span className="text-silver font-semibold">$NYC</span>
              </div>
            </div>

            <div className="rounded-control border border-stroke/70 bg-surface/70 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted/80">
              <span className="text-silver">Score 8.25</span>
              <span className="mx-2 text-muted/50">/</span>
              <span>Since 1.00x</span>
              <span className="mx-2 text-muted/50">/</span>
              <span>Age 22.2m</span>
            </div>

            <div className="grid gap-2 rounded-control border border-stroke/70 bg-surface/70 p-3 text-[12px] text-muted sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3">
                <span>MC</span>
                <span className="text-silver font-semibold">60.95K</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Liq</span>
                <span className="text-silver font-semibold">24.79K</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Vol24</span>
                <span className="text-silver font-semibold">291.25K</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>V/MC</span>
                <span className="text-silver font-semibold">4.78</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>m5 tx</span>
                <span className="text-silver font-semibold">478</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>B/S</span>
                <span className="text-silver font-semibold">1.44x</span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <span>AvgTx</span>
                <span className="text-silver font-semibold">$85</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full !h-9 !rounded-pill !px-2 text-[11px] uppercase tracking-[0.25em]"
              >
                AXIOM
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full !h-9 !rounded-pill !px-2 text-[11px] uppercase tracking-[0.25em]"
              >
                PUMP.FUN
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full !h-9 !rounded-pill !px-2 text-[11px] uppercase tracking-[0.25em]"
              >
                RUGCHECK
              </Button>
            </div>

          </CardBody>
        </Card>
      </motion.section>

      <SectionDivider />

      <motion.section ref={statsRef as any} {...revealProps} className="space-y-7">
        <SectionHeading
          eyebrow="Performance"
          title="Speed And Transparency"
          subtitle="Live metrics from recent activity."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            id="median"
            label="Median alert time"
            start={step >= 1}
            target={120}
            suffix="ms"
            onDone={() => setTimeout(() => setStep(2), 600)}
          />
          <StatCard
            id="pairs"
            label="Pairs watched"
            start={step >= 2}
            target={100}
            suffix="+"
            onDone={() => setTimeout(() => setStep(3), 600)}
          />
          <StatCard
            id="uptime"
            label="Uptime"
            start={step >= 3}
            target={99.9}
            decimals={1}
            suffix="%"
          />
        </div>
        <div className="flex justify-center">
          <Button
            href="/pricing#plans"
            size="md"
            className="min-w-[150px] !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
          >
            GO ALPHA
          </Button>
        </div>
      </motion.section>

      <SectionDivider />

      <motion.div {...revealProps}>
        <RoadmapSection />
      </motion.div>

      <motion.section
        {...revealProps}
        ref={stealthRef as any}
        className="stealth-cta-wrap flex justify-center -mt-4 -mb-10 py-0"
      >
        <Button
          href="/pricing#plans"
          size="md"
          variant="outline"
          className={[
            "stealth-cta",
            showStealthCta ? "stealth-cta--show" : "stealth-cta--hidden",
            "!bg-surface/90 !border-gold/40 !text-white !shadow-none",
          ].join(" ")}
        >
          GET ALPHA ALERTS
        </Button>
      </motion.section>
    </div>
  );
}
