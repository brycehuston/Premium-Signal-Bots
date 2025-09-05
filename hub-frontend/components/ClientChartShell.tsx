'use client';

import dynamic from 'next/dynamic';

const BtcMiniChart = dynamic(() => import('@/components/BtcMiniChart'), {
  ssr: false,
});

export default function ClientChartShell({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-edge/70 bg-card/60 backdrop-blur shadow-glow">
      <div className="p-4">
        <BtcMiniChart height={height} />
      </div>
    </div>
  );
}
