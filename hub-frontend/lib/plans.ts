// filename: lib/plans.ts

export type PlanTone = "bronze" | "platinum" | "gold" | "green";

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
    tone: "green",
    priceMonthly: 69,
    priceAnnual: 599,
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
    priceMonthly: 49,
    priceAnnual: 399,
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
  emoji: "✨",
  title: "ALPHA ALERTS BUNDLE",
  priceMonthly: 149,
  priceAnnual: 1299,
  bullets: [
    "Includes Alpha Early Alerts + Alpha Trend Alerts + Alpha Runner Alerts",
    "One unified flow: new tokens → healthy trends → big runners",
    "Best value for serious traders",
    "Priority support + early access to new features",
  ],
};

export type AlphaLaneName = "EARLY" | "GENESIS" | "TREND" | "STRICT" | "RECLAIM" | "RUNNER";
export type AlphaLaneOffer = {
 key:AlphaLaneName; slug:string; emoji:string; priceMonthly:number;priceAnnual:number;
 accent:string;summary:string;benefits:readonly string[];availability:"request"|"planned";
};
// Display catalogue only. Existing PLANS and BUNDLE slugs and fulfillment are unchanged.
export const ALPHA_LANES:readonly AlphaLaneOffer[] = [
 {key:"EARLY",slug:"alpha-early-alerts",emoji:"⚡",priceMonthly:69,priceAnnual:599,accent:"#a3ce64",availability:"planned",summary:"Earliest-stage discovery and screening.",benefits:["Early on-chain observations","Liquidity and safety context","Structured scoring","Telegram lane identity"]},
 {key:"GENESIS",slug:"alpha-genesis-alerts",emoji:"💠",priceMonthly:59,priceAnnual:499,accent:"#a78bfa",availability:"planned",summary:"Developing momentum and emerging structure.",benefits:["Early participation context","Emerging market structure","Distinct lane scoring","Historical transitions"]},
 {key:"TREND",slug:"alpha-trend-alerts",emoji:"📈",priceMonthly:59,priceAnnual:499,accent:"#89cff0",availability:"request",summary:"Momentum and continuation observations.",benefits:["Trend and momentum context","Transaction and liquidity filters","Qualification signals","Telegram delivery when approved"]},
 {key:"STRICT",slug:"alpha-strict-alerts",emoji:"🛡️",priceMonthly:49,priceAnnual:399,accent:"#d97777",availability:"planned",summary:"Selective market-structure qualification.",benefits:["Additional quality gates","Safety and participation checks","Selective signals","Qualification context"]},
 {key:"RECLAIM",slug:"alpha-reclaim-alerts",emoji:"🔄",priceMonthly:69,priceAnnual:599,accent:"#4bb8d1",availability:"planned",summary:"Recovery and renewed strength.",benefits:["Reclaim structure tracking","Renewed interest observations","Repeat alert context","Lane transition awareness"]},
 {key:"RUNNER",slug:"alpha-runner-alerts",emoji:"🏃",priceMonthly:49,priceAnnual:399,accent:"#e7bc67",availability:"request",summary:"Later-stage continuation and runners.",benefits:["Continuation detection","Base and breakout context","Risk and quality observations","Telegram delivery when approved"]}
] as const;
export const ALPHA_COMPLETE = {slug:"alpha-complete",title:"ALPHA COMPLETE",priceMonthly:199,priceAnnual:1699,availability:"planned" as const,lanes:ALPHA_LANES.map(l=>l.key)};
