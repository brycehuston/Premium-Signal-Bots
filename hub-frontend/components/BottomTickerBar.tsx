// components/BottomTickerBar.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Send, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Sym = "BTC" | "ETH" | "SOL";
type PriceState = Record<Sym, number | null>;
type DirState = Record<Sym, "up" | "down" | "flat">;
type FearGreedTone = "green" | "red" | "neutral";
type FearGreedState = {
  label: "GREED" | "FEAR" | "EXTREME" | "NEUTRAL";
  tone: FearGreedTone;
  isExtreme: boolean;
};

function mapFearGreed(value: number | null): FearGreedState {
  if (value == null) return { label: "NEUTRAL", tone: "neutral", isExtreme: false };
  if (value >= 75) return { label: "EXTREME", tone: "green", isExtreme: true };
  if (value >= 55) return { label: "GREED", tone: "green", isExtreme: false };
  if (value >= 45) return { label: "NEUTRAL", tone: "neutral", isExtreme: false };
  if (value <= 25) return { label: "EXTREME", tone: "red", isExtreme: true };
  return { label: "FEAR", tone: "red", isExtreme: false };
}

function formatCompactUsd(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function computeDir(prev: number | null, next: number | null): "up" | "down" | "flat" {
  if (prev == null || next == null) return "flat";
  if (next > prev) return "up";
  if (next < prev) return "down";
  return "flat";
}

function Chip({
  symbol,
  price,
  dir,
  flash,
}: {
  symbol: Sym;
  price: number | null;
  dir: "up" | "down" | "flat";
  flash: "up" | "down" | null;
}) {
  const Icon =
    dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : null;

  return (
    <div
      className={[
        "relative flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm",
        "bg-surface/70 backdrop-blur border-stroke/60",
        flash === "up" ? "tick-flash-up" : "",
        flash === "down" ? "tick-flash-down" : "",
      ].join(" ")}
    >
      <span className="text-muted">{symbol}</span>

      <span className="font-semibold text-silver tabular-nums">
        {price == null ? "--" : formatCompactUsd(price)}
      </span>

      {Icon ? (
        <Icon
          className={[
            "h-3 w-3 sm:h-4 sm:w-4",
            dir === "up" ? "text-emerald-400" : "text-rose-400",
          ].join(" ")}
        />
      ) : (
        <span className="h-3 w-3 sm:h-4 sm:w-4" />
      )}
    </div>
  );
}

export default function BottomTickerBar({
  telegramUrl,
  xUrl,
  refreshMs = 8000,
}: {
  telegramUrl: string;
  xUrl: string;
  refreshMs?: number;
}) {
  const [prices, setPrices] = useState<PriceState>({ BTC: null, ETH: null, SOL: null });
  const [dirs, setDirs] = useState<DirState>({ BTC: "flat", ETH: "flat", SOL: "flat" });
  const [flash, setFlash] = useState<Record<Sym, "up" | "down" | null>>({
    BTC: null,
    ETH: null,
    SOL: null,
  });
  const [fearGreed, setFearGreed] = useState<FearGreedState>(mapFearGreed(null));
  const [fearGreedValue, setFearGreedValue] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const fearGreedTimerRef = useRef<number | null>(null);
  const fearGreedInFlightRef = useRef<boolean>(false);
  const pathname = usePathname();
  const shouldFetch =
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/waitlist") ||
    pathname.startsWith("/stage-") ||
    pathname.startsWith("/pay");

  const url = useMemo(() => {
    const ids = "bitcoin,ethereum,solana";
    return `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  }, []);
  const fearGreedUrl = useMemo(
    () => "https://api.alternative.me/fng/?limit=1&format=json",
    []
  );

  async function fetchPrices() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();

      const next: PriceState = {
        BTC: j?.bitcoin?.usd ?? null,
        ETH: j?.ethereum?.usd ?? null,
        SOL: j?.solana?.usd ?? null,
      };

      (["BTC", "ETH", "SOL"] as Sym[]).forEach((sym) => {
        const d = computeDir(prices[sym], next[sym]);
        if (d !== "flat") {
          setFlash((p) => ({ ...p, [sym]: d }));
          setTimeout(() => {
            setFlash((p) => ({ ...p, [sym]: null }));
          }, 600);
        }
      });

      setDirs({
        BTC: computeDir(prices.BTC, next.BTC),
        ETH: computeDir(prices.ETH, next.ETH),
        SOL: computeDir(prices.SOL, next.SOL),
      });

      setPrices(next);
    } catch {
      // ignore errors, keep last prices
    } finally {
      inFlightRef.current = false;
    }
  }

  async function fetchFearGreed() {
    if (fearGreedInFlightRef.current) return;
    fearGreedInFlightRef.current = true;

    try {
      const res = await fetch(fearGreedUrl, { cache: "no-store" });
      const j = await res.json();
      const raw = j?.data?.[0]?.value;
      const parsed = raw != null ? Number(raw) : null;
      if (parsed != null && !Number.isNaN(parsed)) {
        setFearGreedValue(parsed);
        setFearGreed(mapFearGreed(parsed));
      }
    } catch {
      // ignore errors, keep last state
    } finally {
      fearGreedInFlightRef.current = false;
    }
  }

  useEffect(() => {
    if (!shouldFetch) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    fetchPrices();
    timerRef.current = window.setInterval(fetchPrices, refreshMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs, shouldFetch]);

  useEffect(() => {
    if (!shouldFetch) {
      if (fearGreedTimerRef.current) window.clearInterval(fearGreedTimerRef.current);
      return;
    }
    fetchFearGreed();
    fearGreedTimerRef.current = window.setInterval(fetchFearGreed, 60_000);
    return () => {
      if (fearGreedTimerRef.current) window.clearInterval(fearGreedTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetch]);

  const fearGreedClass = [
    "fear-greed-box",
    fearGreed.tone === "green"
      ? "fear-greed-box--green"
      : fearGreed.tone === "red"
      ? "fear-greed-box--red"
      : "fear-greed-box--neutral",
    fearGreed.isExtreme ? "fear-greed-box--extreme" : "",
  ].join(" ");
  const showFearGreed =
    pathname.startsWith("/dashboard") ||
    (shouldFetch && fearGreedValue != null && fearGreed.tone === "green");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="h-px w-full bg-stroke/70" />

      <div className="relative flex items-center justify-center px-2 py-2 bg-bg/75 backdrop-blur sm:px-4">
        {/* CENTERED TICKERS */}
        <div className="flex items-center gap-1.5 whitespace-nowrap md:gap-3">
          <Chip symbol="BTC" price={prices.BTC} dir={dirs.BTC} flash={flash.BTC} />
          <Chip symbol="ETH" price={prices.ETH} dir={dirs.ETH} flash={flash.ETH} />
          <Chip symbol="SOL" price={prices.SOL} dir={dirs.SOL} flash={flash.SOL} />
        </div>

        {/* LEFT FEAR/GREED */}
        {showFearGreed ? (
          <div className="absolute left-2 flex items-center gap-2 sm:left-4">
            <div className={fearGreedClass}>{fearGreed.label}</div>
          </div>
        ) : null}

        {/* RIGHT SOCIAL ICONS */}
        <div className="absolute right-2 flex items-center gap-2 sm:right-4">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            title="Telegram"
            data-no-link-style
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stroke/60 bg-surface/70 text-muted hover:text-text hover:border-gold/40 transition sm:h-9 sm:w-9"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </a>

          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            title="X"
            data-no-link-style
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stroke/60 bg-surface/70 text-muted hover:text-text hover:border-gold/40 transition sm:h-9 sm:w-9"
          >
            {/* Custom X logo using text, not the icon */}
            <span className="text-[10px] font-bold leading-none sm:text-sm">X</span>
          </a>
        </div>
      </div>

    </div>
  );
}
