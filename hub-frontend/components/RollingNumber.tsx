"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RollingNumberProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  durationMs?: number;
  cycles?: number;
  staggerMs?: number;
  ease?: string;
};

export default function RollingNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  durationMs = 6000,
  cycles = 1,
  staggerMs = 34,
  ease = "cubic-bezier(0.22, 1, 0.36, 1)",
}: RollingNumberProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const [inView, setInView] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || inView) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    io.observe(node);

    const raf = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const visible =
        rect.top <= window.innerHeight * 0.65 &&
        rect.bottom >= window.innerHeight * 0.35;
      if (visible) {
        setInView(true);
        io.disconnect();
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [inView]);

  const formatted = useMemo(() => value.toFixed(decimals), [value, decimals]);
  const chars = useMemo(() => formatted.split(""), [formatted]);
  const digitIndexes = useMemo(
    () => chars.map((c, i) => (c >= "0" && c <= "9" ? i : -1)).filter((i) => i >= 0),
    [chars]
  );
  const digitsCount = digitIndexes.length;

  const digitPositionFromRight = useMemo(() => {
    const map = new Map<number, number>();
    digitIndexes.forEach((idx, i) => {
      map.set(idx, digitsCount - 1 - i);
    });
    return map;
  }, [digitIndexes, digitsCount]);

  useEffect(() => {
    if (!inView || hasPlayed) return;
    setHasPlayed(true);

    if (prefersReduced) {
      setIsRolling(false);
      return;
    }

    setIsRolling(true);
    const totalMs = durationMs + Math.max(0, digitsCount - 1) * staggerMs;
    const timer = window.setTimeout(() => setIsRolling(false), totalMs);
    return () => window.clearTimeout(timer);
  }, [inView, hasPlayed, prefersReduced, durationMs, staggerMs, digitsCount]);

  const stackDigits = useMemo(() => {
    const total = (cycles + 1) * 10;
    return Array.from({ length: total }, (_, i) => String(i % 10));
  }, [cycles]);

  return (
    <span
      ref={rootRef}
      className={cn("inline-flex items-baseline", className)}
      style={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1' }}
    >
      {prefix ? <span className="inline-block">{prefix}</span> : null}
      {chars.map((char, index) => {
        if (char === ".") {
          return (
            <span
              key={`${char}-${index}`}
              className="inline-block text-center"
              style={{ width: "0.5ch" }}
            >
              .
            </span>
          );
        }

        if (char < "0" || char > "9") {
          return (
            <span key={`${char}-${index}`} className="inline-block">
              {char}
            </span>
          );
        }

        const digit = Number(char);
        const positionFromRight = digitPositionFromRight.get(index) ?? 0;
        const delayMs = positionFromRight * staggerMs;
        const translate = (cycles * 10 + digit) * 1;
        const shouldShowFinal = prefersReduced || inView;
        const transform = shouldShowFinal ? `translate3d(0, -${translate}em, 0)` : "translate3d(0, 0, 0)";
        const transition =
          shouldShowFinal && !prefersReduced
            ? `transform ${durationMs}ms ${ease} ${delayMs}ms`
            : "none";

        return (
          <span
            key={`${char}-${index}`}
            className="inline-block overflow-hidden"
            style={{ width: "1ch", height: "1em", lineHeight: "1em" }}
          >
            <span
              className="block tabular-nums"
              style={{
                transform,
                transition,
                lineHeight: "1em",
                willChange: "transform",
                opacity: prefersReduced ? 1 : isRolling ? 0.84 : 1,
              }}
            >
              {stackDigits.map((d, i) => (
                <span key={`${index}-${i}`} className="block" style={{ height: "1em" }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix ? <span className="inline-block">{suffix}</span> : null}
    </span>
  );
}
