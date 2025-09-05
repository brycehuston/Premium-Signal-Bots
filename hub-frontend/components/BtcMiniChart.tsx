'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, Time, UTCTimestamp } from 'lightweight-charts';

type Props = { height?: number };
const WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@kline_1m';
const HIST_URL =
  'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=300';

export default function BtcMiniChart({ height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi['addCandlestickSeries']> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor: '#D1D5DB' },
      grid: { vertLines: { color: '#202531' }, horzLines: { color: '#202531' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: 0 },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Seed with recent candles
    (async () => {
      const res = await fetch(HIST_URL);
      const rows: any[] = await res.json();
      const data = rows.map((r) => ({
        time: (r[0] / 1000) as UTCTimestamp,
        open: parseFloat(r[1]),
        high: parseFloat(r[2]),
        low: parseFloat(r[3]),
        close: parseFloat(r[4]),
      }));
      series.setData(data);
      chart.timeScale().fitContent();
    })().catch(() => {});

    // Live updates
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const k = msg.k; // kline payload
        if (!k) return;
        series.update({
          time: (k.t / 1000) as UTCTimestamp,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        });
      } catch {}
    };

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      chart.remove();
    };
  }, [height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
