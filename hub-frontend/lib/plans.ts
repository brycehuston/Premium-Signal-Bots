// lib/plans.ts
export const PLANS = [
  {
    slug: "ema-tracker",
    emoji: "📈",
    title: "EMA Tracker",
    priceMonthly: 29,
    priceAnnual: 240,
    bullets: [
      "EMA cross alerts across 100+ coins",
      "Custom timeframe add-on (1m, 5m, 15m, 1h, …)",
      "Side/position context (uptrend/downtrend)",
      "No-code, instant Telegram alerts",
    ],
  },
  {
    slug: "whaleflow",
    emoji: "🐋",
    title: "WhaleFlow",
    priceMonthly: 39,
    priceAnnual: 360,
    bullets: [
      "Large wallet flow & whale prints",
      "Strength score on each event",
      "Sudden block orders & spoof detection",
      "Telegram alerts with pair & venue",
    ],
  },
  {
    slug: "signal-plus",
    emoji: "✨",
    title: "Signal Plus",
    priceMonthly: 49,
    priceAnnual: 480,
    bullets: [
      "5-condition premium entries",
      "Trade idea w/ stop loss & take profits",
      "Multi-timeframe confirmation",
      "Telegram alerts + quick context",
    ],
  },
  {
    slug: "liquidation-guard",
    emoji: "🛡️",
    title: "Liquidation Guard",
    priceMonthly: 29,
    priceAnnual: 240,
    bullets: [
      "Aggressive liq cluster warnings",
      "Fast spikes & risk zones",
      "High-impact liquidation cascades",
      "Instant Telegram alerts",
    ],
  },
  {
    slug: "divergence-scan",
    emoji: "🔎",
    title: "Divergence Scan",
    priceMonthly: 39,
    priceAnnual: 360,
    bullets: [
      "RSI / MACD divergences (bull/bear)",
      "Multi-TF filters to reduce noise",
      "Break/confirm logic for entries",
      "Telegram alerts with chart hints",
    ],
  },
];

export const BUNDLE = {
  slug: "all-bots",
  emoji: "💫",
  title: "All Bots Bundle",
  priceMonthly: 99,
  priceAnnual: 999,
  bullets: [
    "Everything above in one subscription",
    "Best value for power users",
    "Priority support & feature previews",
  ],
};
