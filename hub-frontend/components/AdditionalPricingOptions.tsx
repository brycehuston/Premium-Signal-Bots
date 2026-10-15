/** Pricing-only preview for lanes and bundles awaiting commercial approval.
 * Never link unpriced products to the manual USDC checkout route.
 */
const ADDITIONAL_LANES = [
  {
    name: "ALPHA GENESIS",
    icon: "🧬",
    summary: "New launch formation",
    details: "Early structure, smoother launches, and developing participation.",
  },
  {
    name: "ALPHA STRICT",
    icon: "🛡️",
    summary: "Fewer, more selective alerts",
    details: "Stronger qualification requirements; accuracy is evaluated, not guaranteed.",
  },
  {
    name: "ALPHA RECLAIM",
    icon: "♻️",
    summary: "Recovery and renewed momentum",
    details: "Finds tokens showing recovery and structural reconfirmation after setbacks.",
  },
] as const;

const UPCOMING_BUNDLES = [
  {
    title: "ALPHA DUO",
    detail: "Choose any 2 of the 6 alert lanes",
    accent: false,
  },
  {
    title: "ALPHA TRIO",
    detail: "Choose any 3 of the 6 alert lanes",
    accent: false,
  },
  {
    title: "ALPHA CONTINUATION",
    detail: "Featured Reclaim + Runner pairing",
    accent: true,
  },
  {
    title: "ALPHA COMPLETE",
    detail: "All 6 public alert lanes in one package",
    accent: true,
  },
] as const;

export default function AdditionalPricingOptions() {
  return (
    <div className="md:col-span-2 lg:col-span-3 space-y-12">
      <section aria-labelledby="more-lanes-title">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            Expanding the lineup
          </p>
          <h2
            id="more-lanes-title"
            className="mt-2 font-display text-[27px] font-semibold text-silver sm:text-[34px]"
          >
            THREE MORE ALPHA LANES
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-small text-muted">
            Six public alert lanes, each with a distinct purpose. The additional
            subscription options below are being prepared; no pricing is live yet.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {ADDITIONAL_LANES.map((lane) => (
            <article
              key={lane.name}
              className="flex h-full flex-col rounded-card border border-stroke/70 bg-surface/80 p-6 shadow-soft transition-colors hover:border-gold/40"
            >
              <span className="text-3xl" aria-hidden="true">{lane.icon}</span>
              <h3 className="mt-4 font-display text-[21px] font-semibold tracking-tight text-silver">
                {lane.name}
              </h3>
              <p className="mt-2 font-semibold text-gold">{lane.summary}</p>
              <p className="mt-3 flex-1 text-small leading-relaxed text-muted">
                {lane.details}
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted">
                Subscription pricing coming soon
              </p>
              <a
                href="/waitlist"
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control border border-gold/40 px-4 text-small font-semibold text-gold transition-colors hover:bg-gold/10"
              >
                Get updates
              </a>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="packages-title">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            Choose your combination
          </p>
          <h2
            id="packages-title"
            className="mt-2 font-display text-[27px] font-semibold text-silver sm:text-[34px]"
          >
            NEW ALPHA PACKAGES
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-small text-muted">
            Buy lanes individually, or combine them for a package discount when
            the new options launch. Alpha Trend always includes Entry,
            Unconfirmed, and Risk states within its one lane subscription.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {UPCOMING_BUNDLES.map((bundle) => (
            <article
              key={bundle.title}
              className={
                "flex h-full flex-col rounded-card border bg-surface/70 p-5 " +
                (bundle.accent ? "border-gold/40" : "border-stroke/70")
              }
            >
              <h3 className="font-display text-[17px] font-semibold text-silver">
                {bundle.title}
              </h3>
              <p className="mt-3 flex-1 text-small leading-relaxed text-muted">
                {bundle.detail}
              </p>
              <p className="mt-5 text-xs uppercase tracking-wider text-muted">
                Price to be announced
              </p>
              <a
                href="/waitlist"
                className="mt-3 text-small font-semibold text-gold underline underline-offset-4"
              >
                Join the waitlist
              </a>
            </article>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          The existing priced plans and original three-lane bundle remain unchanged.
          No payments are enabled for these new products.
        </p>
      </section>
    </div>
  );
}
