import { Button, Card, CardBody } from "@/components/ui";

const NEW_LANES = [
  {
    name: "GENESIS",
    emoji: "🧬",
    tone: "bronze",
    bullets: [
      "Emerging launch structure and early participation",
      "Formation and momentum development",
      "Liquidity, activity, and risk context",
      "Clean Telegram alerts with research links",
    ],
  },
  {
    name: "STRICT",
    emoji: "🛡️",
    tone: "platinum",
    bullets: [
      "Fewer alerts and tighter qualification criteria",
      "Selective momentum and safety checks",
      "Clear reasons for alerts and risk context",
      "Clean Telegram alerts with research links",
    ],
  },
  {
    name: "RECLAIM",
    emoji: "♻️",
    tone: "gold",
    bullets: [
      "Recovery and renewed momentum detection",
      "Structural reclaim and confirmation signals",
      "Follow-through and lifecycle monitoring",
      "Clean Telegram alerts with research links",
    ],
  },
] as const;

/** Reuses existing pricing-card styling; new products are not yet priced or enabled for checkout. */
export default function AdditionalPricingOptions() {
  return (
    <>
      {NEW_LANES.map((lane) => (
        <Card
          key={lane.name}
          className={
            "group relative overflow-hidden border transition-all duration-200 will-change-transform " +
            (lane.tone === "bronze"
              ? "border-bronze/20 hover:shadow-[0_0_0_1px_rgb(var(--tone-bronze)/0.18),0_26px_90px_-26px_rgb(var(--tone-bronze)/0.25)]"
              : lane.tone === "platinum"
                ? "border-platinum/20 hover:shadow-[0_0_0_1px_rgb(var(--tone-platinum)/0.18),0_26px_90px_-26px_rgb(var(--tone-platinum)/0.22)]"
                : "border-gold/25 hover:shadow-[0_0_0_1px_rgb(var(--gold)/0.18),0_26px_90px_-26px_rgb(var(--gold)/0.28)]")
          }
        >
          <div
            aria-hidden="true"
            className={
              "plan-aura pointer-events-none absolute inset-0 -z-10 rounded-card opacity-80 " +
              (lane.tone === "bronze"
                ? "plan-aura-bronze"
                : lane.tone === "platinum"
                  ? "plan-aura-platinum"
                  : "plan-aura-gold")
            }
          />
          <CardBody className="flex h-full flex-col space-y-6 sm:space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full border border-stroke/60 bg-surface/70 text-[18px]" aria-hidden="true">
                  {lane.emoji}
                </span>
                <h3 className="font-display text-title-lg font-semibold tracking-tight text-silver">
                  ALPHA <span className={
                    lane.tone === "bronze" ? "text-bronze"
                      : lane.tone === "platinum" ? "text-platinum" : "text-gold"
                  }>{lane.name}</span> ALERTS
                </h3>
              </div>
              <span className="rounded-pill border border-stroke/70 bg-surface2/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Coming soon
              </span>
            </div>

            <div className="space-y-1">
              <div className="font-display text-[24px] font-semibold leading-none text-silver">
                Pricing TBA
              </div>
              <div className="text-muted/80 text-sm">
                Monthly and annual options to be confirmed
              </div>
            </div>

            <ul className="space-y-3 text-small text-muted sm:space-y-2.5">
              {lane.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5">
                  <svg viewBox="0 0 20 20" className={
                    "h-[18px] w-[18px] -mt-[1px] flex-none " +
                    (lane.tone === "bronze" ? "text-bronze" : lane.tone === "platinum" ? "text-platinum" : "text-gold")
                  } fill="none" aria-hidden="true">
                    <path d="M7.5 10.5l2 2 4.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              <Button variant="primary" size="sm" full disabled className="!h-11 sm:!h-10">
                Coming Soon
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </>
  );
}
