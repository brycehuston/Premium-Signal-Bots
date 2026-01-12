'use client';

import dynamic from 'next/dynamic';

const BtcMiniChart = dynamic(() => import('@/components/BtcMiniChart'), {
  ssr: false,
});

export default function ClientChartShell({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-card border border-stroke/70 bg-surface/60 backdrop-blur shadow-soft">
      <div className="p-4">
        <BtcMiniChart height={height} />
      </div>
    </div>
  );
}
