// app/page.tsx
"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import type { Easing } from "motion-utils";
import { Webhook } from "lucide-react";
import HeroChart from "@/components/HeroChart";
import RollingNumber from "@/components/RollingNumber";
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
  const finishedRef = useRef(false);
  const doneNotifiedRef = useRef(false);
  const lastShownRef = useRef<number | null>(null);
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

    if (prefersReduced) {
      if (spanRef.current) spanRef.current.textContent = `${prefix}${format(target)}${suffix}`;
      finishedRef.current = true;
      window.__counterDone![id] = true;
      onDone && onDone();
      return;
    }

    lastShownRef.current = null;
    const tickStep = decimals ? Math.pow(10, -decimals) : 1;
    const snapEps = tickStep * 0.5;
    let controls: ReturnType<typeof animate> | null = null;
    const tid = window.setTimeout(() => {
      controls = animate(0, target, {
        duration: durationMs / 1000,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => {
          const nearTarget = Math.abs(v - target) <= snapEps;
          const stepped = nearTarget
            ? target
            : Math.floor(v / tickStep) * tickStep;
          const stable = decimals ? Number(stepped.toFixed(decimals)) : Math.round(stepped);
          if (lastShownRef.current === stable) return;
          lastShownRef.current = stable;
          if (spanRef.current) {
            spanRef.current.textContent = `${prefix}${format(stable)}${suffix}`;
          }
        },
        onComplete: () => {
          if (spanRef.current) spanRef.current.textContent = `${prefix}${format(target)}${suffix}`;
          finishedRef.current = true;
          window.__counterDone![id] = true;
          if (!doneNotifiedRef.current) {
            doneNotifiedRef.current = true;
            onDone && onDone();
          }
        },
      });
    }, delayMs);

    return () => {
      window.clearTimeout(tid);
      if (controls) controls.stop();
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
  const prefersReduced = useReducedMotion();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotorRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    const rotor = rotorRef.current;
    if (!shell || !canvas || !rotor) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const spinRPM = 170;
    const airflowStrength = 0.9;
    const particleCount = 52;
    const blurAmount = 6;
    const spinUpMs: number = 1200;
    const spinHoldMs: number = 2200;
    const spinDownMs: number = 3200;
    const restMs: number = 3000;

    const effectiveRPM = prefersReduced ? Math.min(spinRPM, 120) : spinRPM;
    const effectiveStrength = prefersReduced ? 0 : airflowStrength;

    shell.style.setProperty("--webhook-blur", `${blurAmount}px`);

    const TAU = Math.PI * 2;
    const dprMax = 2;
    const pad = 24;
    const cycleMs = spinUpMs + spinHoldMs + spinDownMs + restMs;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let cx = 0;
    let cy = 0;
    let angle = 0;
    const startTime = performance.now() + 7000;
    let lastTime = startTime;
    let rafId = 0;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInCubic = (t: number) => t * t * t;

    const rpmForCycle = (elapsedMs: number) => {
      if (cycleMs <= 0) return 0;
      const t = elapsedMs % cycleMs;
      if (t < spinUpMs) {
        const p = spinUpMs === 0 ? 1 : t / spinUpMs;
        return effectiveRPM * easeOutCubic(p);
      }
      if (t < spinUpMs + spinHoldMs) {
        return effectiveRPM;
      }
      if (t < spinUpMs + spinHoldMs + spinDownMs) {
        const p = spinDownMs === 0 ? 1 : (t - spinUpMs - spinHoldMs) / spinDownMs;
        return effectiveRPM * (1 - easeOutCubic(p));
      }
      return 0;
    };

    const resize = () => {
      const rect = shell.getBoundingClientRect();
      dpr = Math.min(dprMax, window.devicePixelRatio || 1);
      W = rect.width + pad * 2;
      H = rect.height + pad * 2;

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      canvas.style.left = `${-pad}px`;
      canvas.style.top = `${-pad}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H / 2;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(shell);
    resize();

    const mulberry32 = (seed: number) => {
      let t = seed;
      return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    };

    const rand = mulberry32(1337);
    const colors = {
      white: [248, 252, 255],
      gold: [255, 214, 128],
    };

    const particles = Array.from({ length: particleCount }, () => {
      const tone = rand() > 0.45 ? colors.white : colors.gold;
      return {
        baseAngle: rand() * TAU,
        phase: rand(),
        speed: 0.08 + rand() * 0.24,
        drift: (rand() - 0.5) * 0.8,
        length: 6 + rand() * 16,
        width: 0.8 + rand() * 1.4,
        tone,
        seed: rand() * 10,
      };
    });

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const elapsed = Math.max(0, now - startTime);
      const rpm = active ? rpmForCycle(elapsed) : 0;
      const omega = rpm * TAU / 60;
      angle += omega * dt;
      rotor.style.transform = `translateZ(0) rotate(${angle}rad)`;

      const spinIntensity = effectiveRPM > 0 ? rpm / effectiveRPM : 0;
      const ramp = easeInCubic(Math.min(1, Math.max(0, spinIntensity)));
      const strengthNow = effectiveStrength * ramp;

      ctx.clearRect(0, 0, W, H);
      if (strengthNow <= 0.001) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      const t = now / 1000;
      const spinPhase = angle * 0.12;
      const inner = 12;
      const outer = 52 * (0.7 + strengthNow);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (const p of particles) {
        const life = (t * p.speed + p.phase) % 1;
        const ease = life * life * (3 - 2 * life);
        const radius = inner + ease * outer;
        const wobble = Math.sin((t + p.seed) * 1.2) * 0.15;
        const swirl = (1 - life) * 0.45 * (p.drift + wobble);
        const angle = p.baseAngle + spinPhase + swirl;

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        const tangent = angle + Math.PI / 2;
        const curl = (1 - life) * 0.55 * p.drift;
        const dx = Math.cos(tangent + curl);
        const dy = Math.sin(tangent + curl);

        const len = p.length * (0.65 + strengthNow) * (0.4 + ease);
        const alpha = (1 - life) * 0.65 * strengthNow;
        if (alpha <= 0.01) continue;

        const startX = x - dx * len;
        const startY = y - dy * len;
        const ctrlX = x - dx * len * 0.5 + Math.cos(angle) * len * 0.2 * p.drift;
        const ctrlY = y - dy * len * 0.5 + Math.sin(angle) * len * 0.2 * p.drift;

        const grad = ctx.createLinearGradient(startX, startY, x, y);
        grad.addColorStop(0, `rgba(${p.tone[0]},${p.tone[1]},${p.tone[2]},0)`);
        grad.addColorStop(0.6, `rgba(${p.tone[0]},${p.tone[1]},${p.tone[2]},${alpha})`);
        grad.addColorStop(1, `rgba(${p.tone[0]},${p.tone[1]},${p.tone[2]},${alpha * 0.8})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, x, y);
        ctx.stroke();
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [active, prefersReduced]);

  return (
    <div ref={shellRef} className="relative h-5 w-5 webhook-fan-shell">
      <canvas ref={canvasRef} className="webhook-airflow" aria-hidden="true" />
      <Webhook
        ref={rotorRef}
        className="h-5 w-5 webhook-rotor"
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

function SectionDivider({ showDust = true }: { showDust?: boolean }) {
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
    <div ref={dividerRef} aria-hidden className="relative flex items-center justify-center overflow-x-clip py-12 md:py-20">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stroke/70 to-transparent" />
      {showDust ? (
        <>
          <span
            className="divider-dust bell-dust-shower bell-dust-loop bell-dust-boost dust-cycle"
            aria-hidden="true"
          />
          <span
            className="divider-dust bell-dust-shower bell-dust-loop bell-dust-boost-2 dust-cycle"
            aria-hidden="true"
          />
        </>
      ) : null}
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
        {showDust ? (
          <>
            <span
              className="divider-dust divider-dust--trail bell-dust-shower bell-dust-loop bell-dust-boost dust-cycle"
              aria-hidden="true"
            />
            <span
              className="divider-dust divider-dust--trail bell-dust-shower bell-dust-loop bell-dust-boost-2 dust-cycle"
              aria-hidden="true"
            />
          </>
        ) : null}
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_12px_rgb(var(--gold)/0.55)]" />
        <span className="h-1 w-1 rounded-full bg-gold/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_12px_rgb(var(--gold)/0.55)]" />
      </motion.div>
    </div>
  );
}

function FeatureRow({ active }: { active: boolean }) {
  const prefersReduced = useReducedMotion();
  const [heavyRing, setHeavyRing] = useState(false);
  const [bellActive, setBellActive] = useState(false);
  const [dustActive, setDustActive] = useState(false);
  const bellDelayRef = useRef<number | null>(null);
  // Premium pill row sequence (1 → 2 → 3) with reduced-motion safety.
  const pillRowContainer: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.12,
        delayChildren: prefersReduced ? 0 : 0.18,
      },
    },
  };
  const pillRowItem: Variants = {
    hidden: prefersReduced
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: -12 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: prefersReduced ? 0 : 0.34,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  useEffect(() => {
    if (!active) {
      if (bellDelayRef.current) {
        window.clearTimeout(bellDelayRef.current);
        bellDelayRef.current = null;
      }
      setBellActive(false);
      return;
    }

    if (bellDelayRef.current || bellActive) return;
    bellDelayRef.current = window.setTimeout(() => {
      bellDelayRef.current = null;
      setBellActive(true);
    }, 7000);

    return () => {
      if (bellDelayRef.current) {
        window.clearTimeout(bellDelayRef.current);
        bellDelayRef.current = null;
      }
    };
  }, [active, bellActive]);

  useEffect(() => {
    if (!bellActive) {
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
  }, [bellActive]);

  useEffect(() => {
    if (!bellActive) {
      setDustActive(false);
      return;
    }
    if (heavyRing) setDustActive(true);
  }, [bellActive, heavyRing]);

  return (
      <div className="mt-5 space-y-1.5 md:mt-6">
        {/* Pill sequence animation: keep layout stable and stagger each chip. */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 md:flex-nowrap md:justify-start"
          variants={pillRowContainer}
          initial={prefersReduced ? false : "hidden"}
          whileInView={prefersReduced ? undefined : "show"}
          viewport={prefersReduced ? undefined : { once: true, amount: 0.35 }}
        >
          <motion.div
            className="flex items-center gap-2 rounded-pill border border-stroke/70 bg-surface/70 px-4 py-2"
            variants={pillRowItem}
            style={{ willChange: "transform, opacity", transform: "translate3d(0,0,0)" }}
          >
            <ClockIcon active={active} />
            <div className="text-small font-medium leading-none text-silver whitespace-nowrap">
              Live Trade Signals
            </div>
          </motion.div>
          <motion.div
            className="flex items-center gap-2 rounded-pill border border-stroke/70 bg-surface/70 px-4 py-2"
            variants={pillRowItem}
            style={{ willChange: "transform, opacity", transform: "translate3d(0,0,0)" }}
          >
            <WebhookIconSpin active={active} />
            <div className="text-small font-medium leading-none text-silver whitespace-nowrap">
              Webhook-Ready
            </div>
          </motion.div>
          <motion.div
            className="flex items-center gap-2 rounded-pill border border-stroke/70 bg-surface/70 px-4 py-2"
            variants={pillRowItem}
            style={{ willChange: "transform, opacity", transform: "translate3d(0,0,0)" }}
          >
            <span className="relative inline-flex overflow-visible">
              <BellIconDing active={bellActive} heavy={heavyRing} />
              <span
                className={[
                  "bell-dust-shower bell-dust-local",
                  dustActive ? "bell-dust-heavy" : "",
                ].join(" ")}
                aria-hidden="true"
              />
              {dustActive ? (
                <span
                  className="bell-dust-shower bell-dust-local bell-dust-heavy bell-dust-heavy-2"
                  aria-hidden="true"
                />
              ) : null}
            </span>
            <div className="text-small font-medium leading-none text-silver whitespace-nowrap">
              24/7 Alerts
            </div>
          </motion.div>
        </motion.div>
        <div className="mx-auto mt-2 text-[10px] leading-relaxed text-muted/70 text-center md:mx-0 md:text-left md:max-w-[420px]">
          Informational alerts only. No profit guarantees.
        </div>
      </div>
  );
}

type VerifiedDailyAlert = {
  id: string;
  symbol: string;
  lane: string;
  score: number;
  timestamp_utc: string;
  alert_mc: number | null;
  liquidity_usd: number | null;
  m5_tx: number | null;
  observed_peak_pct?: number | null;
};
type VerifiedDailyFeed = {
  state: "loading" | "verified" | "archived" | "empty" | "unavailable";
  as_of_utc?: string;
  period?: "24h" | "7d" | null;
  public_delay_minutes?: number;
  reference_time_utc?: string;
  hour_alert?: VerifiedDailyAlert | null;
  alerts: VerifiedDailyAlert[];
};

const LANE_PALETTE: Record<string, { text: string; dot: string; chip: string; accent: string }> = {
  EARLY: {text:"text-[#a3ce64]",dot:"bg-[#a3ce64]",chip:"border-[#a3ce64]/40 text-[#a3ce64]",accent:"#a3ce64"},
  GENESIS: {text:"text-[#a78bfa]",dot:"bg-[#a78bfa]",chip:"border-[#a78bfa]/40 text-[#a78bfa]",accent:"#a78bfa"},
  TREND: {text:"text-[#cdd7e2]",dot:"bg-[#cdd7e2]",chip:"border-[#cdd7e2]/40 text-[#cdd7e2]",accent:"#cdd7e2"},
  STRICT: {text:"text-[#d97777]",dot:"bg-[#d97777]",chip:"border-[#d97777]/40 text-[#d97777]",accent:"#d97777"},
  RECLAIM: {text:"text-[#4bb8d1]",dot:"bg-[#4bb8d1]",chip:"border-[#4bb8d1]/40 text-[#4bb8d1]",accent:"#4bb8d1"},
  RUNNER: {text:"text-[#d8b879]",dot:"bg-[#d8b879]",chip:"border-[#d8b879]/40 text-[#d8b879]",accent:"#d8b879"},
};

function formatAlertMoney(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "N/A";
  return "$" + (n >= 1_000_000 ? (n/1_000_000).toFixed(2) + "M" : n >= 1_000 ? (n/1_000).toFixed(1) + "K" : Math.round(n).toLocaleString("en-US"));
}

type Mover24H = {
  id:string;symbol:string;lane:string;
  multiple:number;first_mc:number;peak_mc:number;
  called_at_utc:string;
};
type MoverFeed24H = {
  state:"loading"|"verified"|"historical"|"empty"|"unavailable";
  window?:"24h"|"historical";
  as_of_utc?:string;
  reference_time_utc?:string;
  movers:Mover24H[];
};
const MOVER_LANES:Record<string,string>={
  EARLY:"#a3ce64",GENESIS:"#a78bfa",TREND:"#cdd7e2",
  STRICT:"#d97777",RECLAIM:"#4bb8d1",RUNNER:"#d8b879"
};
function moverDate(iso:string){
  const time=Date.parse(iso);
  if(!Number.isFinite(time))return "DATE UNAVAILABLE";
  return new Intl.DateTimeFormat("en-CA",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",timeZone:"America/Vancouver",timeZoneName:"short"}).format(time);
}
function moverMoney(value:number){
  return "$"+Math.round(value).toLocaleString("en-US");
}
function HeroAlertReel(){
  const [feed,setFeed]=useState<MoverFeed24H>({state:"loading",movers:[]});
  useEffect(()=>{
    let live=true,request:AbortController|null=null;
    async function refresh(){
      if(document.hidden)return;
      request?.abort();
      const controller=new AbortController();request=controller;
      try{
        const response=await fetch("/api/public/top-movers",{cache:"no-store",signal:controller.signal});
        if(!response.ok)throw new Error("feed_unavailable");
        const data=await response.json();
        const movers:Mover24H[]=Array.isArray(data.movers)?
          data.movers.filter((x:unknown):x is Mover24H=>{
            if(!x||typeof x!=="object")return false;
            const item=x as Partial<Mover24H>;
            return typeof item.id==="string"&&typeof item.symbol==="string"&&typeof item.lane==="string"&&
              Boolean(MOVER_LANES[item.lane])&&typeof item.multiple==="number"&&
              Number.isFinite(item.multiple)&&item.multiple>=1&&typeof item.first_mc==="number"&&
              item.first_mc>0&&typeof item.peak_mc==="number"&&item.peak_mc>=item.first_mc&&
              typeof item.called_at_utc==="string"&&Number.isFinite(Date.parse(item.called_at_utc));
          }).slice(0,3):[];
        const ready=(data.state==="verified"||data.state==="historical")&&movers.length>0;
        if(live&&!controller.signal.aborted)setFeed({
          state:ready?(data.state==="historical"?"historical":"verified"):data.state==="empty"?"empty":"unavailable",
          window:data.window==="historical"?"historical":"24h",
          movers:ready?movers:[],
          as_of_utc:typeof data.as_of_utc==="string"?data.as_of_utc:undefined,
          reference_time_utc:typeof data.reference_time_utc==="string"?data.reference_time_utc:undefined
        });
      }catch{if(live&&!controller.signal.aborted)setFeed({state:"unavailable",movers:[]})}
    }
    void refresh();const timer=window.setInterval(()=>void refresh(),60000);
    document.addEventListener("visibilitychange",refresh);
    return()=>{live=false;request?.abort();clearInterval(timer);document.removeEventListener("visibilitychange",refresh)};
  },[]);
  const ready=feed.state==="verified"||feed.state==="historical";
  const [expandedId,setExpandedId]=useState<string|null>(null);
  const selected=ready?feed.movers.find(mover=>mover.id===expandedId):undefined;
  const average=ready&&feed.movers.length?feed.movers.reduce((total,mover)=>total+mover.multiple,0)/feed.movers.length:null;
  const top=ready?Math.max(...feed.movers.map(mover=>mover.multiple)):null;
  const cards=ready?Array.from({length:3},(_,index)=>feed.movers[index]??null):[null,null,null];
  const palette=[
    {accent:"#edbc72",rgb:"237,188,114",label:"#edbc72"},
    {accent:"#38bff2",rgb:"56,191,242",label:"#54c9ef"},
    {accent:"#b68bf9",rgb:"182,139,249",label:"#c6a2ff"}
  ];
  return <section aria-label="Alpha Alerts top movers" data-alpha-top3-frame className="mx-auto w-full max-w-[590px] min-w-0 rounded-[16px] border border-[#29333d] bg-[#0e1319] px-3.5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:rounded-[18px] sm:px-5 sm:py-6 lg:px-6">
    <header className="mb-6 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center">
      <h2 data-alpha-top3-heading className="font-display text-[13px] font-bold uppercase tracking-[.22em] text-[#eff0f3] sm:text-[14px]">Top 3 Movers</h2>
      <span className="hidden h-3 w-px bg-[#434951] min-[380px]:block" aria-hidden="true"/>
      <span className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#9fa8b4] sm:text-[10px]">
        {feed.state==="historical"?"Latest verified ranking":feed.state==="verified"?"Last 24 hours":"Observed market-cap peaks"}
      </span>
    </header>
    {feed.state==="historical"&&feed.reference_time_utc&&
      <p className="-mt-2 mb-3 text-center text-[10px] text-[#aeb5c1]">As of {moverDate(feed.reference_time_utc)}</p>}
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3" aria-label="Ranked market-cap movers">
      {cards.map((item,index)=>{
        const tone=palette[index];
        return <button
          key={item?.id??index}
          type="button"
          disabled={!item}
          onClick={()=>item&&setExpandedId(prev=>prev===item.id?null:item.id)}
          aria-expanded={item?expandedId===item.id:undefined}
          aria-controls={item?"alpha-mover-expanded":undefined}
          aria-label={item?String(index+1)+". "+item.symbol+", "+item.lane+", "+item.multiple.toFixed(2)+" times. Called "+moverDate(item.called_at_utc)+" at market cap "+moverMoney(item.first_mc)+", observed peak "+moverMoney(item.peak_mc)+". Select for details.":"Rank "+String(index+1)+": no verified mover"}
          title={item?item.symbol+" · "+item.lane+"\nCalled: "+moverDate(item.called_at_utc)+"\nMarket cap: "+moverMoney(item.first_mc)+" → "+moverMoney(item.peak_mc)+"\nObserved peak: "+item.multiple.toFixed(2)+"×":undefined}
          className="group relative flex min-h-[155px] min-w-0 flex-col items-center overflow-hidden rounded-[11px] border border-[#303b46] bg-gradient-to-b from-[#171e25] via-[#121921] to-[#10171e] px-1.5 pb-3 pt-3 text-center outline-none transition-[border-color,transform] duration-200 hover:border-[#65717c] focus-visible:border-[#e8bc77] focus-visible:ring-2 focus-visible:ring-[#e8bc77]/60 disabled:cursor-default disabled:hover:border-[#303b46] sm:min-h-[178px] sm:px-3 sm:pb-4 sm:pt-4 lg:min-h-[194px] motion-safe:hover:-translate-y-0.5"
          style={{boxShadow:"inset 0 -1px 0 rgba("+tone.rgb+",.48), 0 6px 18px -14px rgba("+tone.rgb+",.75)"}}>
          <span className="absolute left-2 top-2.5 font-display text-[10px] font-bold tabular-nums text-[#c7cbd2] sm:left-3 sm:top-3 sm:text-[11px]" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
          <span className="relative z-10 mt-1 block w-full max-w-full truncate px-3 font-display text-[10px] font-bold tracking-[-.03em] text-[#f0f1f3] min-[390px]:text-[11px] sm:mt-0.5 sm:text-[14px]">{item?"$"+item.symbol:"—"}</span>
          <span className="relative z-10 mt-1 block w-full truncate font-display text-[8px] font-bold uppercase tracking-[.02em] sm:text-[10px]" style={{color:item?tone.label:"#949ba6"}}>{item?.lane??"PENDING"}</span>
          <strong className="relative z-10 mt-auto block whitespace-nowrap font-display text-[clamp(21px,5.7vw,33px)] font-bold leading-none tracking-[-.045em] tabular-nums text-[#efc57e]">{item?item.multiple.toFixed(2)+"×":"—"}</strong>
          <span className="pointer-events-none absolute bottom-[-14px] left-[9%] right-[9%] h-[39px] rounded-full blur-[10px]" style={{background:"radial-gradient(ellipse at center,rgba("+tone.rgb+",.43) 0%,rgba("+tone.rgb+",.08) 44%,transparent 73%)"}} aria-hidden="true"/>
          <span className="pointer-events-none absolute bottom-0 left-[26%] right-[26%] h-px" style={{background:"linear-gradient(90deg,transparent,"+tone.accent+",transparent)"}} aria-hidden="true"/>
        </button>;
      })}
    </div>
    {selected&&<div id="alpha-mover-expanded" className="mt-2.5 rounded-[9px] border border-[#303944] bg-[#121a21] px-3.5 py-3 text-[11px] leading-[1.75] text-[#c8d0d8]" role="status">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span><strong className="text-[#edf0f3]">{"$"+selected.symbol}</strong> · Called {moverDate(selected.called_at_utc)}</span>
        <span>Call MC <strong className="text-[#f0f1f3]">{moverMoney(selected.first_mc)}</strong><span className="mx-1.5 text-[#d4b47d]">→</span>Peak <strong className="text-[#f0f1f3]">{moverMoney(selected.peak_mc)}</strong></span>
      </div>
    </div>}
    <div className="mt-6 grid grid-cols-3 divide-x divide-[#29333e] border-t border-[#2b3540] px-1.5 pt-5 pb-0 sm:mt-7 sm:px-3 sm:pt-6" aria-label="Top mover summary">
      {[
        {label:"RANKED",value:ready?String(feed.movers.length):"—",symbol:"◇"},
        {label:"TOP MOVE",value:top!==null?top.toFixed(2)+"×":"—",symbol:"↗"},
        {label:"AVG MOVE",value:average!==null?average.toFixed(2)+"×":"—",symbol:"⌁"}
      ].map(stat=><div key={stat.label} className="flex min-w-0 items-center justify-center gap-2 px-1 sm:gap-3 sm:px-2">
        <span className="hidden shrink-0 font-display text-[19px] font-semibold text-[#d6ab6d] sm:block" aria-hidden="true">{stat.symbol}</span>
        <div className="min-w-0 text-center sm:text-left">
          <div className="whitespace-nowrap text-[8px] font-semibold uppercase tracking-[.07em] text-[#a6afb9] sm:text-[9px]">{stat.label}</div>
          <div className="mt-0.5 whitespace-nowrap font-display text-[16px] font-bold leading-none tabular-nums text-[#e9edf2] sm:text-[20px]">{stat.value}</div>
        </div>
      </div>)}
    </div>
    <p className="mt-4 text-center text-[9px] leading-4 text-[#9ba6b2]">
      {ready?"Observed market-cap peaks, not realized trading returns. Select a mover for call details.":"No corroborated mover records are available. The latest verified historical ranking will appear when available."}
    </p>
  </section>;
}

type StepItemProps = {
  step: number;
  order: 1 | 2 | 3;
  title: string;
  description: string;
};

function StepItem({ step, order, title, description }: StepItemProps) {
  return (
    <li className={`how-step how-step-${order} flex h-full min-w-0 items-start gap-4 rounded-[13px] border p-5 sm:p-6`}>
      <span className="how-step-badge grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-[15px] font-semibold tabular-nums" aria-hidden="true">{step}</span>
      <div className="min-w-0 space-y-2">
        <h3 className="how-step-title font-display text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="how-step-desc max-w-[32ch] text-[13px] leading-[1.75]">{description}</p>
      </div>
    </li>
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
    title: "Stage 1 ⚡ Solana AlphaAlerts",
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
    title: "Stage 2 🤖 ALPHA-X Auto Trader",
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
    title: "Stage 3 🌐 Multi-Chain Alerts",
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
    title: "Stage 4 ALPHA Access Token",
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
    title: "Stage 5 🧭 Pro Dashboard + Self-Serve Billing",
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

const FAQ_ITEMS = [
  {
    q: "How do alerts get delivered?",
    a: "Alerts are delivered in private Telegram channels tied to your plan. Each alert includes a clean summary, safety checks, and one-tap links.",
  },
  {
    q: "What's inside an alert?",
    a: "A score, quick risk checks, and fast links (Axiom, explorer, and trading tools) so you can verify before you enter.",
  },
  {
    q: "How does payment verification work?",
    a: "Payments are manual for now via USDC on Solana. We verify on-chain, then invite you to the correct private channels.",
  },
  {
    q: "Do you guarantee profits?",
    a: "No. These are informational alerts, not financial advice. This market is high-risk and you are responsible for your own decisions.",
  },
  {
    q: "What is a honeypot, bundlers, or fake volume?",
    a: "Honeypot means you can buy but you can't sell. Bundlers and fake volume can make a chart look \"busy\" even when activity is manipulated. Use Axiom to verify.",
  },
  {
    q: "Why do some tokens dump after Dex Paid or migration?",
    a: "Not always, but it happens a lot. Treat Dex Paid and migration as volatility events, not bullish signals. Wait for the reaction and real strength.",
  },
  {
    q: "How do I verify faster with Axiom?",
    a: "Use Axiom to check holder concentration, insiders, bundlers, and dev activity. It helps you spot traps faster before risking money.",
  },
];

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
        <div className="text-[10px] font-bold uppercase tracking-[0.23em] text-gold">Release Plan</div>
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
              We ship in stages. Each stage makes alerts{" "}
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
          className="absolute left-3 top-0 h-full w-px bg-gradient-to-b from-gold/60 via-gold/25 to-transparent shadow-[0_0_14px_rgb(var(--gold)/0.35)] sm:left-4 md:left-1/2"
        />

        <div className="space-y-8 md:space-y-10">
          {ROADMAP_ITEMS.map((item, index) => {
            const side = index % 2 === 0 ? "left" : "right";
            const cardCol = side === "left" ? "md:col-start-1" : "md:col-start-6";
            const spacerCol = side === "left" ? "md:col-start-6" : "md:col-start-1";
            const isActive = activeIndex === index;
            const phaseMatch = item.title.match(/^Stage\s+\d+/);
            const phaseLabel = phaseMatch?.[0] ?? `Stage ${item.step}`;
            const titleRest = phaseMatch ? item.title.slice(phaseLabel.length).trim() : item.title;
            const previewBullets = item.bullets.slice(0, ROADMAP_PREVIEW_COUNT);
            const extraBullets = item.bullets.slice(ROADMAP_PREVIEW_COUNT);
            const hasMore = extraBullets.length > 0;
            const isExpanded = !!expanded[item.step];
            const extraId = `roadmap-extra-${item.step}`;
            const isStageFour = item.step === 4;
            const stageFourTitle = "ALPHA Access Token";

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
                  className={`order-2 md:order-none md:col-span-4 ${cardCol} pl-8 sm:pl-10 md:pl-0`}
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
                        <h3 className="font-display text-title-lg md:text-h3 font-semibold tracking-[-0.025em] text-[#f0f0f2] leading-snug break-words">
                          <span className="block max-w-full text-transparent bg-clip-text bg-gradient-to-r from-silver-strong via-silver to-gold drop-shadow-[0_12px_30px_rgb(var(--gold)/0.35)]">
                            {isStageFour ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="stage4-emoji">🜂</span>
                                <span>{stageFourTitle}</span>
                              </span>
                            ) : (
                              titleRest
                            )}
                          </span>
                        </h3>
                      </div>
                      <Badge
                        tone={ROADMAP_STATUS_TONES[item.tag]}
                        className={item.tag === "LIVE" ? "badge-live-pulse" : undefined}
                      >
                        {item.tag}
                      </Badge>
                    </div>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-stroke/70 via-stroke/40 to-transparent" />

                    <ul className="mt-4 space-y-3 text-[13px] leading-[1.7] text-[#b9bbc3]">
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
  const { ref: howRef, inView: howInView } = useInView({ threshold: 0.35, once: false });
  const { scrollYProgress } = useScroll();
  const glowDrift = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const glowDriftAlt = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.35, 0.7, 0.35]);

  const { ref: trustRef, inView: trustInView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px 20% 0px",
    once: false,
  });
  const shouldReduceMotion = useReducedMotion();

  const [heroView, setHeroView] = useState<"chart" | "reel">("reel");
  const [showStealthCta, setShowStealthCta] = useState(false);
  const stealthTimerRef = useRef<number | null>(null);
  const [trustStep, setTrustStep] = useState(0);
  const trustTimersRef = useRef<number[]>([]);
  const trustCycleRef = useRef<number | null>(null);

  // Preserve the visitor's chosen view; avoid surprising swaps while reading or interacting.

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

  useEffect(() => {
    const clearTimers = () => {
      trustTimersRef.current.forEach((id) => window.clearTimeout(id));
      trustTimersRef.current = [];
      if (trustCycleRef.current) {
        window.clearTimeout(trustCycleRef.current);
        trustCycleRef.current = null;
      }
    };

    if (shouldReduceMotion) {
      clearTimers();
      setTrustStep(1);
      return () => clearTimers();
    }

    if (!trustInView) {
      clearTimers();
      setTrustStep(0);
      return () => clearTimers();
    }

    const runCycle = () => {
      clearTimers();
      setTrustStep(0);

      const startDelay = 1000;
      const stepDelay = 5000;
      const groupDelay = 5000;
      const groupDuration = 2200;
      const ctaDuration = 1800;
      const cooldown = 2600;

      let t = startDelay;
      trustTimersRef.current.push(window.setTimeout(() => setTrustStep(1), t));
      t += stepDelay;
      trustTimersRef.current.push(window.setTimeout(() => setTrustStep(2), t));
      t += stepDelay;
      trustTimersRef.current.push(window.setTimeout(() => setTrustStep(3), t));
      t += stepDelay;
      trustTimersRef.current.push(window.setTimeout(() => setTrustStep(4), t));
      t += groupDelay;
      trustTimersRef.current.push(window.setTimeout(() => setTrustStep(5), t));
      t += groupDuration;
      trustTimersRef.current.push(window.setTimeout(() => setTrustStep(6), t));
      t += ctaDuration;
      trustTimersRef.current.push(window.setTimeout(() => setTrustStep(0), t));

      trustCycleRef.current = window.setTimeout(runCycle, t + cooldown);
    };

    runCycle();
    return () => clearTimers();
  }, [shouldReduceMotion, trustInView]);




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
    <div className="alpha-home-headings relative flex flex-col overflow-x-clip gap-8 md:gap-10">
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

      <motion.section
        {...revealProps}
        className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-6 lg:gap-8"
      >
        <div
          ref={featuresScope as any}
          className="text-center md:col-span-6 md:pr-2 md:pt-8 lg:pt-10 md:text-left"
        >
          <div className="space-y-6 lg:space-y-7">
            <div data-alpha-hero-eyebrow className="text-[0.8rem] uppercase tracking-[0.4em] text-muted/80 sm:text-eyebrow">
              AlphaAlerts
            </div>
            <h1 className="font-display text-silver leading-[1.12]">
              <span className="block text-[clamp(2.4rem,7.4vw,4.25rem)] font-black tracking-[-0.03em] text-metal-silver">
                <span className="block whitespace-nowrap">SOLANA</span>
                <span className="block whitespace-nowrap">SIGNALS THAT</span>
                <span className="block whitespace-nowrap">CUT THE NOISE.</span>
              </span>
            </h1>
            <p className="mx-auto max-w-[62ch] text-[0.98rem] leading-relaxed text-muted sm:text-[1rem] md:mx-0">
              We scan new tokens and on-chain activity, filter obvious traps,
              <span className="block">and send clean Telegram alerts with risk scoring.</span>
            </p>
          </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:mt-8">
            <Button
              href="/pricing"
              size="lg"
              className={[
                "w-full !h-12 text-[0.95rem] sm:min-w-[180px] sm:w-auto !rounded-[6px]",
                "!bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))]",
                "!border-[rgb(var(--gold3)_/_0.9)]",
                "!shadow-[0_8px_20px_rgb(var(--gold3)/0.45)] hover:!shadow-[0_14px_28px_rgb(var(--gold3)/0.55)]",
                "!before:opacity-0 !after:opacity-0",
                trustStep === 6 ? "trust-cta--pulse" : "",
              ].join(" ")}
            >
              GO ALPHA
            </Button>
            <Button
              href="#sample-alerts"
              variant="outline"
              size="lg"
              className="w-full !h-12 text-[0.95rem] sm:min-w-[180px] sm:w-auto"
            >
              SAMPLE ALERTS
            </Button>
          </div>

          <FeatureRow active={featuresInView} />
        </div>

        <div data-alpha-hero-right className="md:col-span-6 md:pl-2 md:pt-2 lg:pt-4">
          <div className="relative">
            <div className="relative z-20 mb-6 flex justify-center md:absolute md:-top-10 md:right-0 md:mb-0 md:justify-end">
              <div
                className="flex items-center gap-2 rounded-full border border-stroke/60 bg-surface/60 px-2 py-1"
                role="tablist"
                aria-label="Hero view"
              >
                <button
                  type="button"
                  onClick={() => setHeroView("reel")}
                  aria-pressed={heroView === "reel"}
                  aria-label="Show alert reel"
                  className="relative -m-2 rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  <span
                    className={[
                      "block h-2.5 w-2.5 rounded-full transition",
                      heroView === "reel"
                        ? "bg-gold shadow-[0_0_8px_rgb(var(--gold)/0.65)]"
                        : "bg-stroke/70 hover:bg-silver/40",
                    ].join(" ")}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setHeroView("chart")}
                  aria-pressed={heroView === "chart"}
                  aria-label="Show chart"
                  className="relative -m-2 rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  <span
                    className={[
                      "block h-2.5 w-2.5 rounded-full transition",
                      heroView === "chart"
                        ? "bg-gold shadow-[0_0_8px_rgb(var(--gold)/0.65)]"
                        : "bg-stroke/70 hover:bg-silver/40",
                    ].join(" ")}
                  />
                </button>
              </div>
            </div>

            <div className="relative isolate min-h-[430px] sm:min-h-[465px] md:min-h-[480px] overflow-hidden sm:overflow-visible">
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
                <HeroChart height={420} />
              </motion.div>
              <motion.div
                aria-hidden={heroView !== "reel"}
                className="absolute inset-0 flex items-start justify-center"
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
                <div className="w-full max-w-[640px]">
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
        ref={trustRef as any}
        className={[
          "trust-card mt-6 rounded-card border border-stroke/70 bg-surface/80 p-6 shadow-soft md:mt-8 md:p-8",
          shouldReduceMotion ? "trust-card--static" : "",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={`trust-glow ${shouldReduceMotion ? "trust-glow--static" : ""}`}
        />
        <div className="relative z-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-3">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">Trust & Access</div>
            <h2 className="font-display text-h2 font-semibold tracking-tight text-silver">
              Built For Fast, Safe Signals
            </h2>
            <p className="text-body text-muted">
              Private delivery, manual verification, and clear risk filters to keep your feed clean.
            </p>
          </div>
          <div className="grid gap-3">
              <div
                className={[
                  "trust-pill trust-pill--1 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted",
                  trustStep >= 1 ? "trust-pill--active" : "",
                  trustStep === 1 ? "trust-pill--pulse" : "",
                  trustStep === 5 ? "trust-pill--group" : "",
                ].join(" ")}
              >
                Manual payment verification before invites go live
              </div>
              <div
                className={[
                  "trust-pill trust-pill--2 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted",
                  trustStep >= 2 ? "trust-pill--active" : "",
                  trustStep === 2 ? "trust-pill--pulse" : "",
                  trustStep === 5 ? "trust-pill--group" : "",
                ].join(" ")}
              >
                Private Telegram channels tied to your plan
              </div>
              <div
                className={[
                  "trust-pill trust-pill--3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted",
                  trustStep >= 3 ? "trust-pill--active" : "",
                  trustStep === 3 ? "trust-pill--pulse" : "",
                  trustStep === 5 ? "trust-pill--group" : "",
                ].join(" ")}
              >
                Risk filters and scoring on every alert
              </div>
              <div
                className={[
                  "trust-pill trust-pill--4 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted",
                  trustStep >= 4 ? "trust-pill--active" : "",
                  trustStep === 4 ? "trust-pill--pulse" : "",
                  trustStep === 5 ? "trust-pill--group" : "",
                ].join(" ")}
              >
                We never ask for seed phrases.
              </div>
          </div>
        </div>
        <style jsx>{`
          .trust-card {
            position: relative;
            overflow: hidden;
            border-color: rgba(255, 214, 128, 0.22);
            box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.12);
          }
          .trust-glow {
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.18),
              0 0 28px rgba(244, 198, 90, 0.22);
            opacity: 0.28;
            animation: trustGlow 8s ease-in-out infinite;
            pointer-events: none;
          }
          .trust-glow--static {
            animation: none;
            opacity: 0.22;
          }
            .trust-pill {
              position: relative;
              transition: border-color 1600ms ease, box-shadow 1600ms ease;
              border-color: rgba(255, 255, 255, 0.18);
              box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.08), 0 0 18px rgba(244, 198, 90, 0.12);
            }
          .trust-pill--active {
            border-color: rgba(255, 214, 128, 0.4);
            box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.22), 0 0 20px rgba(244, 198, 90, 0.24);
          }
          .trust-card--static .trust-pill--1 {
            border-color: rgba(255, 214, 128, 0.26);
          }
          .trust-pill--pulse {
            animation: pillPulse 3.8s ease-in-out;
          }
          .trust-pill--group {
            animation: groupPulse 3.4s ease-in-out;
          }
          .trust-cta--pulse {
            animation: ctaPulse 2.2s ease-in-out;
          }
          @keyframes pillPulse {
            0%,
            100% {
              border-color: rgba(255, 214, 128, 0.26);
              box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.18), 0 0 18px rgba(244, 198, 90, 0.22);
            }
            50% {
              border-color: rgba(255, 214, 128, 0.46);
              box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.28), 0 0 26px rgba(244, 198, 90, 0.3);
            }
          }
          @keyframes groupPulse {
            0%,
            100% {
              border-color: rgba(255, 214, 128, 0.3);
              box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.18), 0 0 20px rgba(244, 198, 90, 0.22);
            }
            50% {
              border-color: rgba(255, 214, 128, 0.5);
              box-shadow: 0 0 0 1px rgba(255, 214, 128, 0.3), 0 0 28px rgba(244, 198, 90, 0.32);
            }
          }
          @keyframes ctaPulse {
            0%,
            100% {
              transform: translateZ(0);
              box-shadow: 0 0 0 rgba(0, 0, 0, 0);
            }
              50% {
                transform: translateY(-1px) scale(1.004);
                box-shadow: 0 0 16px rgba(244, 198, 90, 0.2);
              }
            }
          `}</style>
      </motion.section>

      <SectionDivider showDust={false} />

      <motion.section
        {...revealProps}
        ref={howRef as any}
        className={`how-it-works ${howInView ? "how-it-works--active" : ""} rounded-card border border-stroke/70 bg-surface/80 p-6 shadow-soft md:p-8`}
      >
        <SectionHeading
          eyebrow="HOW ACCESS WORKS"
          title="Go live in three steps."
          subtitle="Choose an available plan, confirm payment instructions with support, and receive access to your private Telegram channel."
          className="space-y-4"
        />
        <ol className="mt-8 grid items-stretch gap-4 md:grid-cols-3 md:auto-rows-fr">
          <StepItem
            step={1}
            order={1}
            title="Pick Your Plan"
            description="Choose an available plan and request access. New lane offerings may still be pending."
          />
          <StepItem
            step={2}
            order={2}
            title="Verify Payment"
            description="Follow confirmed payment instructions, then send your transaction link and Telegram username to support."
          />
          <StepItem
            step={3}
            order={3}
            title="Get Your Invite"
            description="After verification, receive the invite to the private channel included in your plan."
          />
        </ol>
      </motion.section>

      <SectionDivider />

      <motion.section {...revealProps} className="phase-section space-y-8">
        <div className="phase-container">
          <SectionHeading
            align="center"
            eyebrow="System Flow"
            title={
              <>
                <span>Real-time flow.</span>
                <span className="hidden md:inline"> </span>
                <br className="md:hidden" />
                <span>Real signals.</span>
                <br className="hidden md:block" />
                <span>Real Alpha.</span>
              </>
            }
            subtitle="A cinematic walkthrough of the system powering Alpha Alerts."
            className="phase-heading"
          />
        </div>
        <div className="phase-container">
          {/* NEW: premium phase flow card */}
          <Card className="phase-flow-card relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            {/* NEW: subtle ambient glow */}
            <div aria-hidden className="phase-card-ambient" />
            <CardBody className="phase-body relative text-left">
              <div className="phase-grid">
                <div className="phase-left">
                  <div className="phase-hero-line">Signal Pipeline</div>
                  <div className="phase-support-line">ON-CHAIN DATA • LANE FILTERS • ALERTS OUT</div>
                  {/* NEW: CTA aligned left */}
                  <div className="phase-cta-wrap">
                    <Button href="/stage-1" size="md" className="phase-cta">
                      ALPHA WORKFLOW
                    </Button>
                  </div>
                </div>
                {/* NEW: beam pulse module */}
                <div className="phase-right" aria-hidden>
                  <div className="beam-module">
                    <span className="beam-track" />
                    <span className="beam-glow" />
                    <span className="beam-station beam-station--source">
                      <span className="beam-ring" />
                      <span className="beam-label">Source</span>
                    </span>
                    <span className="beam-station beam-station--scanner">
                      <span className="beam-ring" />
                      <span className="beam-label">Scanner</span>
                    </span>
                    <span className="beam-station beam-station--router">
                      <span className="beam-ring" />
                      <span className="beam-label">Router</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        {/* NEW: scoped styles for this section */}
        <style jsx>{`
          .phase-section {
            padding-top: 80px;
          }
          .phase-container {
            width: 100%;
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 24px;
          }
          .phase-heading {
            text-align: center;
          }
          .phase-heading :global(h2) {
            max-width: 760px;
            margin: 0 auto;
            line-height: 1.05;
          }
          .phase-heading :global(p) {
            max-width: 560px;
            margin: 0 auto;
            color: rgba(255, 255, 255, 0.72);
          }
          .phase-flow-card {
            --phase-bronze: 199 142 84;
            --phase-silver: 215 224 238;
            --phase-gold: 255 205 110;
            --phase-ink: 8 11 16;
            background: linear-gradient(150deg, rgba(14, 18, 26, 0.86), rgba(8, 10, 16, 0.9));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }
          .phase-body {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 28px;
            min-height: 200px;
            text-align: left;
          }
          .phase-card-ambient {
            position: absolute;
            inset: -30% -20%;
            background: radial-gradient(
                circle at 20% 20%,
                rgba(var(--phase-gold), 0.08),
                transparent 60%
              ),
              radial-gradient(circle at 80% 20%, rgba(120, 220, 255, 0.07), transparent 55%);
            opacity: 0.12;
            animation: none;
            pointer-events: none;
          }
          .phase-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 36px;
            align-items: center;
          }
          .phase-hero-line {
            font-size: 18px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.92);
            font-weight: 800;
          }
          .phase-support-line {
            font-size: 12px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 2px;
          }
          .phase-left {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 380px;
          }
          .phase-right {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            align-self: center;
            padding-left: 8px;
          }
          .beam-module {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: min(360px, 100%);
            height: 90px;
            min-width: 260px;
            margin-left: 8px;
            transform: scale(1.15);
            transform-origin: center;
          }
          .beam-track {
            position: absolute;
            left: 10%;
            right: 10%;
            top: 50%;
            height: 10px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.1);
            box-shadow: inset 0 0 6px rgba(244, 198, 90, 0.1);
          }
          .beam-glow {
            position: absolute;
            left: 10%;
            right: 10%;
            top: 50%;
            height: 18px;
            border-radius: 999px;
            background: rgba(244, 198, 90, 0.08);
            transform: translateY(-50%);
            filter: blur(10px);
          }
          .beam-station {
            position: absolute;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            top: calc(50% - 26px);
            font-size: 12px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.75);
            animation: stationLabel 15s ease-in-out infinite;
          }
          .beam-station--source {
            left: 10%;
            transform: translateX(-50%);
            animation-delay: 0s;
          }
          .beam-station--scanner {
            left: 50%;
            transform: translateX(-50%);
            animation-delay: 5s;
          }
          .beam-station--router {
            left: 90%;
            transform: translateX(-50%);
            animation-delay: 10s;
          }
          .beam-ring {
            width: 14px;
            height: 14px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 0 10px rgba(244, 198, 90, 0);
            animation: stationHit 15s ease-in-out infinite;
          }
          .beam-station--source .beam-ring {
            animation-delay: 0s;
          }
          .beam-station--scanner .beam-ring {
            animation-delay: 5s;
          }
          .beam-station--router .beam-ring {
            animation-delay: 10s;
          }
          .beam-label {
            font-size: 12px;
            letter-spacing: 0.18em;
          }
          .beam-sub {
            font-size: 9px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.55);
          }
          .phase-cta-wrap {
            position: relative;
            display: flex;
            justify-content: flex-start;
            padding-top: 14px;
          }
          .phase-cta {
            position: relative;
            padding: 1.05rem 2.8rem;
            font-size: 1.02rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            border-radius: 999px;
            border: 1px solid rgba(246, 212, 139, 0.34);
            background: linear-gradient(180deg, rgba(246, 212, 139, 0.14), rgba(0, 0, 0, 0.18));
            box-shadow: 0 0 22px rgba(246, 212, 139, 0.10),
              inset 0 0 14px rgba(246, 212, 139, 0.06);
            overflow: hidden;
            transition: transform 160ms ease, box-shadow 200ms ease;
          }
          .phase-cta::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(
              120deg,
              transparent 0%,
              rgba(255, 255, 255, 0.45) 45%,
              transparent 70%
            );
            transform: translateX(-120%);
            transition: transform 600ms ease;
          }
          .phase-cta:hover {
            transform: translateY(-1px);
            box-shadow: 0 0 34px rgba(246, 212, 139, 0.14),
              inset 0 0 18px rgba(246, 212, 139, 0.08);
          }
          .phase-cta:hover::after {
            transform: translateX(120%);
          }
          .phase-cta:active {
            transform: translateY(1px) scale(0.98);
          }
          @keyframes stationHit {
            0% {
              border-color: rgba(255, 255, 255, 0.18);
              box-shadow: 0 0 10px rgba(244, 198, 90, 0);
              background-color: transparent;
              transform: scale(1);
            }
            5% {
              border-color: rgba(244, 198, 90, 0.7);
              box-shadow: 0 0 16px rgba(244, 198, 90, 0.35);
              background-color: rgba(244, 198, 90, 0.95);
              transform: scale(1.1);
            }
            12% {
              border-color: rgba(255, 255, 255, 0.18);
              box-shadow: 0 0 10px rgba(244, 198, 90, 0);
              background-color: transparent;
              transform: scale(1);
            }
            100% {
              border-color: rgba(255, 255, 255, 0.18);
              box-shadow: 0 0 10px rgba(244, 198, 90, 0);
              background-color: transparent;
              transform: scale(1);
            }
          }
          @keyframes stationLabel {
            0% {
              color: rgba(255, 255, 255, 0.75);
            }
            5% {
              color: rgba(255, 255, 255, 1);
            }
            12% {
              color: rgba(255, 255, 255, 0.75);
            }
            100% {
              color: rgba(255, 255, 255, 0.75);
            }
          }
          @keyframes phaseGlowDrift {
            0% {
              transform: translate(-8%, -6%) scale(1);
              opacity: 0.35;
            }
            50% {
              transform: translate(6%, 8%) scale(1.08);
              opacity: 0.55;
            }
            100% {
              transform: translate(-8%, -6%) scale(1);
              opacity: 0.35;
            }
          }
          @keyframes phaseCardPulse {
            0%,
            100% {
              opacity: 0.38;
            }
            50% {
              opacity: 0.55;
            }
          }
          @media (max-width: 640px) {
            .phase-section {
              padding-top: 56px;
            }
            .phase-container {
              padding: 0 18px;
            }
            .phase-heading :global(h2) {
              max-width: 320px;
            }
            .phase-heading :global(p) {
              max-width: 320px;
            }
            .phase-hero-line {
              font-size: 15px;
              letter-spacing: 0.16em;
            }
            .phase-support-line {
              font-size: 11px;
              letter-spacing: 0.16em;
              text-align: center;
              align-self: center;
            }
            .phase-body {
              text-align: center;
              padding: 22px 20px 24px;
            }
            .phase-grid {
              grid-template-columns: 1fr;
              gap: 18px;
            }
            .phase-left {
              align-items: center;
            }
            .phase-right {
              justify-content: center;
              width: 100%;
            }
            .beam-module {
              width: min(320px, 100%);
              height: 90px;
              min-width: 220px;
              transform: scale(1.05);
              transform-origin: center;
            }
            .beam-track {
              height: 8px;
            }
            .beam-label {
              font-size: 11px;
              letter-spacing: 0.16em;
            }
            .phase-cta {
              min-height: 44px;
              width: 100%;
              max-width: 260px;
              min-width: 0;
            }
          }
        `}</style>
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
                We try to block obvious traps before they hit your feed.
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
                One clean message with key stats and fast links.
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
                Early tokens, trend momentum, and runner moves in one system.
              </p>
            </CardBody>
          </Card>
        </div>
      </motion.section>

      <SectionDivider />

      <motion.section
        {...revealProps}
        id="sample-alerts"
        className="grid items-start gap-10 md:grid-cols-2 md:gap-8 scroll-mt-24 md:scroll-mt-32"
      >
        <div className="space-y-6 md:space-y-5">
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
              className="w-full sm:w-auto h-10 !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
            >
              GO ALPHA
            </Button>
          </div>
          <p className="text-[12px] text-muted/70">
            Pro tip: open Axiom first to check holders, bundles, insiders, and dev buys or sells before entering.
          </p>
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

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full !h-10 sm:!h-9 !rounded-pill !px-3 sm:!px-2 text-[12px] sm:text-[11px] uppercase tracking-[0.25em]"
                href="https://axiom.xyz"
                target="_blank"
                rel="noopener noreferrer"
              >
                AXIOM
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full !h-10 sm:!h-9 !rounded-pill !px-3 sm:!px-2 text-[12px] sm:text-[11px] uppercase tracking-[0.25em]"
                href="https://pump.fun"
                target="_blank"
                rel="noopener noreferrer"
              >
                PUMP.FUN
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full !h-10 sm:!h-9 !rounded-pill !px-3 sm:!px-2 text-[12px] sm:text-[11px] uppercase tracking-[0.25em]"
                href="https://rugcheck.xyz"
                target="_blank"
                rel="noopener noreferrer"
              >
                RUGCHECK
              </Button>
            </div>

          </CardBody>
        </Card>
      </motion.section>

      <SectionDivider />

      <motion.section {...revealProps} id="faq" className="space-y-8 scroll-mt-24 md:scroll-mt-32">
        <SectionHeading
          align="center"
          eyebrow="FAQ"
          title="Answers Before You Commit"
          subtitle="Quick clarity on delivery, payments, and access."
        />
        <div className="faq-list mx-auto max-w-3xl space-y-2">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="faq-item group rounded-card border border-stroke/70 bg-surface/70 p-4 shadow-soft md:p-5"
            >
              <summary className="faq-summary flex cursor-pointer list-none items-center justify-between gap-3 text-silver font-semibold">
                <span className="faq-question">{item.q}</span>
                <span className="faq-chevron" aria-hidden>
                  <svg viewBox="0 0 24 24" role="presentation">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </summary>
              <div className="faq-content">
                <div className="faq-content-inner">
                  <div className="faq-answer text-body text-muted">{item.a}</div>
                </div>
              </div>
            </details>
          ))}
        </div>
        <div className="mt-2 flex flex-col items-center gap-3">
          <Button
            href="/pricing#plans"
            size="md"
            className="min-w-[150px] !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
          >
            GO ALPHA
          </Button>
          <a
            className="text-[9px] leading-none uppercase tracking-[0.2em] text-gold/70 hover:text-gold"
            href="/safety"
            data-no-link-style
          >
            FULL SAFETY GUIDE
          </a>
        </div>
      </motion.section>

      <SectionDivider />

      <motion.section {...revealProps} aria-labelledby="alpha-numbers-title" className="space-y-7">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-gold">SYSTEM AT A GLANCE</p>
          <h2 id="alpha-numbers-title" className="font-display text-[28px] font-semibold tracking-[-0.025em] text-silver sm:text-[38px]">
            Alpha. <span className="text-gold">By the numbers.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-[13px] leading-[1.85] text-muted sm:text-sm">
            Six distinct alert lanes, three interactive system stages and two planned blockchain expansions.
            These are system and roadmap counts, not latency, uptime or trading-performance claims.
          </p>
        </div>
        <div data-alpha-number-grid className="grid gap-4 md:grid-cols-3 md:gap-5">
          {[
            { value: 6, label: "ALPHA LANES", detail: "Six distinct scanner identities" },
            { value: 3, label: "SYSTEM STAGES", detail: "Interactive workflow walkthrough" },
            { value: 2, label: "FUTURE CHAINS", detail: "BSC + ETH · planned, not live" },
          ].map((stat,index) => (
            <div data-alpha-number-order={index} key={stat.label} className="rounded-[15px] border border-[#32343a] bg-[#131417] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-7">
              <div className="flex min-h-[50px] items-center justify-center">
                <RollingNumber
                  value={stat.value}
                  durationMs={1150}
                  staggerMs={70}
                  startDelayMs={index*1350}
                  cycles={1}
                  className="font-display text-[42px] font-semibold tracking-[-0.035em] text-[#f0f0f2] sm:text-[48px]"
                />
              </div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.20em] text-[#e7bc67]">{stat.label}</div>
              <p className="mt-2 text-[12px] leading-[1.65] text-[#b7b9c2]">{stat.detail}</p>
            </div>
          ))}
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
