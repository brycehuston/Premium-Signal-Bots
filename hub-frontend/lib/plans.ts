// filename: lib/plans.ts

export type PlanTone = "bronze" | "platinum" | "gold";

export type Plan = {
  slug: string;
  emoji: string;

  titleLeft: string;       // "ALPHA"
  titleEmphasis: string;   // "EARLY" | "TREND" | "RUNNER"
  titleRight: string;      // "ALERTS"

  tone: PlanTone;

  priceMonthly: number;
  priceAnnual: number;
  bullets: string[];
};

export const PLANS: Plan[] = [
  {
    slug: "alpha-early-alerts",
    emoji: "⚡",
    titleLeft: "ALPHA",
    titleEmphasis: "EARLY",
    titleRight: "ALERTS",
    tone: "bronze",
    priceMonthly: 49,
    priceAnnual: 399,
    bullets: [
      "Ultra-early Solana pool + token detection",
      "Ultra-early Solana pool & token alerts (on-chain + WS)",
      "Safety filters: mint/freeze authority, holders, liquidity",
      "Transparent scoring with clear skip reasons",
      "Clean Telegram alerts with one-tap links",
      "Built for fast entries and quick exits",
      "Best for: speed, early discovery, first entries",
    ],
  },
  {
    slug: "alpha-trend-alerts",
    emoji: "📈",
    titleLeft: "ALPHA",
    titleEmphasis: "TREND",
    titleRight: "ALERTS",
    tone: "platinum",
    priceMonthly: 59,
    priceAnnual: 499,
    bullets: [
      "Multi-signal momentum & continuation setups",
      "Multi-signal filtering (liq, 5m tx, buy/sell, avg trade)",
      "Momentum + acceleration trend detection",
      "Quality-first scoring over raw speed",
      "Clear market states: BREAKING / ACCUM / CHOPPY",
      "Clean Telegram alerts with one-tap links",
      "Best for: cleaner entries, higher-quality follow-through",
    ],
  },
  {
    slug: "alpha-runner-alerts",
    emoji: "🏃",
    titleLeft: "ALPHA",
    titleEmphasis: "RUNNER",
    titleRight: "ALERTS",
    tone: "gold",
    priceMonthly: 69,
    priceAnnual: 599,
    bullets: [
      "Second-leg & continuation move detection",
      "Runner detection (second leg / continuation moves)",
      "Base -> breakout -> continuation logic",
      "Scoring + tier gating to reduce noise",
      "Designed to catch larger follow-through moves",
      "Clean Telegram alerts with one-tap links",
      "Best for: holding winners, catching extended moves",
    ],
  },
];

export const BUNDLE = {
  slug: "alpha-bundle",
  emoji: "💫",
  title: "ALPHA BUNDLE",
  priceMonthly: 149,
  priceAnnual: 1299,
  bullets: [
    "ALPHA EARLY + TREND + RUNNER",
    "Best value for serious traders",
    "Priority support + new feature previews",
  ],
};
