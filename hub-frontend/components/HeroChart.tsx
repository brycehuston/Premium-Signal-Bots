// components/HeroChart.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

// Load chart client-side only
const BtcMiniChart = dynamic(() => import("@/components/BtcMiniChart"), { ssr: false });

export default function HeroChart({ height = 340 }: { height?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reserve space including padding so the card never changes size
  const minH = useMemo(() => height + 32, [height]); // p-4 top+bottom = 32px

  return (
    <div
      className="rounded-2xl border border-stroke/70 bg-surface/60 backdrop-blur shadow-glow"
      style={{ minHeight: minH }}
    >
      <div className="p-4 h-full">
        {!mounted ? (
          <div className="w-full rounded-xl bg-surface/70 animate-pulse" style={{ height }} />
        ) : (
          <BtcMiniChart height={height} />
        )}
      </div>
    </div>
  );
}
