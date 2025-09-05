// components/HeroChart.tsx
"use client";

import dynamic from "next/dynamic";

// Only render this on the client to avoid SSR issues for the chart
const BtcMiniChart = dynamic(() => import("@/components/BtcMiniChart"), { ssr: false });

export default function HeroChart({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-edge/70 bg-card/60 backdrop-blur shadow-glow">
      <div className="p-4">
        <BtcMiniChart height={height} />
      </div>
    </div>
  );
}
