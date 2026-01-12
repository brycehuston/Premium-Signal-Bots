// app/page.tsx
"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Timer, Webhook, Bell } from "lucide-react";
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
      className="font-display tabular-nums text-2xl md:text-3xl font-semibold tracking-tight text-silver"
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
        <BellIconDing active={active} />
        <div className="text-small font-medium leading-none text-silver whitespace-nowrap">
          24/7 Alerts
        </div>
      </div>
    </div>
  );
}

type StepItemProps = {
  step: number;
  title: string;
  description: string;
};

function StepItem({ step, title, description }: StepItemProps) {
  return (
    <li className="flex gap-3 rounded-card border border-stroke/70 bg-surface/70 p-4 shadow-soft md:p-5">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold text-sm font-semibold">
        {step}
      </div>
      <div>
        <div className="text-small font-semibold text-silver">{title}</div>
        <div className="text-small text-muted">{description}</div>
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
    title: "Phase 2 - ALPHA-X Auto Trader",
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
    title: "Phase 3 - Multi-Chain Alerts",
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
    title: "Phase 5 - Pro Dashboard + Self-Serve Billing",
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
    <div className="flex flex-col gap-10 md:gap-14">
      <section className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
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
              AI-powered crypto alerts for SOL, BSC, and ETH. Catch new tokens, trends, and
              runners before the crowd.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/pricing#plans" size="lg">
              Go Alpha
            </Button>
            <Button href="#sample-alerts" variant="outline" size="lg">
              View Sample Alerts
            </Button>
          </div>

          <FeatureRow active={featuresInView} />
        </div>

        <div className="md:col-span-6 md:pl-4">
          <HeroChart height={340} />
        </div>
      </section>

      <section className="rounded-card border border-stroke/70 bg-surface/80 p-6 shadow-soft md:p-8">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to go live"
          subtitle="Pick a tier, pay in USDC, and get clean alerts in Telegram."
        />
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          <StepItem
            step={1}
            title="Pick your tier"
            description="Choose Early, Trend, Runner, or the Alpha Alerts Bundle."
          />
          <StepItem
            step={2}
            title="Pay and connect"
            description="Manual USDC payment, then we invite you to Telegram."
          />
          <StepItem
            step={3}
            title="Get alerts live"
            description="Clean signals with links, filters, and scoring in real time."
          />
        </ol>
      </section>

      <section className="space-y-6">
        <SectionHeading
          align="center"
          eyebrow="Built to keep you early"
          title="Early, safe, and in control"
          subtitle="Cleaner signals, fewer rugs, and a simple way to stay early across SOL, BSC, and ETH."
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
      </section>

      <section id="sample-alerts" className="grid items-start gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/80">Sample alerts</div>
          <h2 className="font-display text-h2 font-semibold tracking-tight text-silver">
            See what hits your Telegram
          </h2>
          <p className="text-body text-muted">
            One clean message with entry links, safety checks, and clear market state labels.
          </p>
          <div className="flex flex-wrap gap-3">
            <Pill>120ms median latency</Pill>
            <Pill>99.9% uptime</Pill>
            <Pill>100+ pairs watched</Pill>
          </div>
          <div>
            <Button href="/pricing#plans" size="md">
              Go Alpha
            </Button>
          </div>
        </div>

        <Card className="bg-surface2/80">
          <CardBody className="space-y-4 text-small text-text">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-muted/80">
              <span>AlphaAlerts / Trend</span>
              <span className="text-gold">Live</span>
            </div>
            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Pair / TF</dt>
                <dd className="text-silver font-semibold">SOL/USDC / 5m</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Signal</dt>
                <dd className="text-silver">BREAKING / Momentum + Volume</dd>
              </div>
              <div className="rounded-control border border-stroke/70 bg-surface/70 p-3">
                <div className="flex items-center justify-between text-muted">
                  <span>Entry</span>
                  <span className="text-silver font-semibold">96.20</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-muted">
                  <div className="flex items-center justify-between">
                    <span>SL</span>
                    <span className="text-silver">92.80</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TP1</span>
                    <span className="text-silver">101.40</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TP2</span>
                    <span className="text-silver">108.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>State</span>
                    <span className="text-silver">TREND</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Filters</dt>
                <dd className="text-silver">
                  Mint Renounced / Liquidity Locked / Holders 1,240
                </dd>
              </div>
            </dl>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-muted">
              <span className="rounded-pill border border-stroke/70 bg-surface/70 px-2 py-1 text-center">
                Chart
              </span>
              <span className="rounded-pill border border-stroke/70 bg-surface/70 px-2 py-1 text-center">
                Dex
              </span>
              <span className="rounded-pill border border-stroke/70 bg-surface/70 px-2 py-1 text-center">
                Wallet
              </span>
            </div>
          </CardBody>
        </Card>
      </section>

      <section ref={statsRef as any} className="space-y-6">
        <SectionHeading
          eyebrow="Performance"
          title="Speed and transparency"
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
          <Button href="/pricing#plans" size="md">
            Go Alpha
          </Button>
        </div>
      </section>

      <RoadmapSection />

    </div>
  );
}


