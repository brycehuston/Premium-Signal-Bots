// components/HeroChart.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

// Load chart client-side only
const BtcMiniChart = dynamic(() => import("@/components/BtcMiniChart"), { ssr: false });

export default function HeroChart({ height = 340 }: { height?: number }) {
  const [mounted, setMounted] = useState(false);
  const [autoLive, setAutoLive] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAutoLive((prev) => !prev);
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  // Reserve space including padding so the card never changes size
  const minH = useMemo(() => height + 32, [height]); // p-4 top+bottom = 32px

  return (
    <div
      className="relative rounded-card border border-stroke/70 bg-surface/60 backdrop-blur shadow-soft"
      style={{ minHeight: minH }}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted/70">
        <span
          className={[
            "relative h-4 w-9 rounded-full border border-stroke/70 bg-surface/70 transition-colors",
            autoLive ? "border-emerald-400/40 bg-emerald-400/10" : "",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-transform",
              autoLive
                ? "translate-x-[18px] bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                : "translate-x-[3px] bg-muted/70",
            ].join(" ")}
          />
        </span>
        <span className={autoLive ? "text-emerald-300" : "text-muted/60"}>
          {autoLive ? "Live" : "Idle"}
        </span>
      </div>
      <div className="p-4 h-full">
        {!mounted ? (
          <div className="w-full rounded-xl bg-surface/70 animate-pulse" style={{ height }} />
        ) : (
          <BtcMiniChart height={height} paused={!autoLive} />
        )}
      </div>
    </div>
  );
}
