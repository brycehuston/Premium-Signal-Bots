// filename: app/pay/[slug]/page.tsx
import { notFound } from "next/navigation";
import { PLANS, BUNDLE } from "@/lib/plans";
import SubmitTxForm from "@/components/SubmitTxForm";
import { Button } from "@/components/ui";
import AnalyticsEvent from "@/components/AnalyticsEvent";

type SearchParams = Record<string, string | string[] | undefined>;

function normalizePeriod(sp: SearchParams) {
  const raw = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  return raw === "annual" ? "annual" : "monthly";
}

/**
 * Your plans now come in 2 shapes:
 * - NEW (Plan): titleLeft/titleEmphasis/titleRight
 * - BUNDLE: title
 *
 * This builds a safe display title for either shape.
 */
function getPlanTitle(plan: any): string {
  if (plan && typeof plan.title === "string") {
    // Bundle case
    return plan.title;
  }

  // Plan case
  const left = typeof plan?.titleLeft === "string" ? plan.titleLeft : "";
  const emphasis = typeof plan?.titleEmphasis === "string" ? plan.titleEmphasis : "";
  const right = typeof plan?.titleRight === "string" ? plan.titleRight : "";

  const built = `${left} ${emphasis} ${right}`.replace(/\s+/g, " ").trim();
  return built || "Subscription";
}

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const period = normalizePeriod(sp);

  // Combine: 3 plans + bundle
  const allPlans = [...PLANS, BUNDLE];
  const plan = allPlans.find((pl) => pl.slug === slug);
  if (!plan) return notFound();

  const title = getPlanTitle(plan);

  const price = period === "annual" ? plan.priceAnnual : plan.priceMonthly;
  const chain = "Solana";
  const token = "USDC";
  const address =
    process.env.NEXT_PUBLIC_SOLANA_ADDRESS ||
    "4tDVS6pJKirFnXtM3btbP2VfCQbombUotCqtPjoEXkHm";

  return (
    <div className="mx-auto max-w-2xl py-12 px-5">
      <AnalyticsEvent
        name="checkout_start"
        props={{ plan: plan.slug, period }}
      />
      <h1 className="font-display text-h2 font-semibold tracking-tight text-silver">
        Subscribe - <span className="opacity-70">{title}</span>
      </h1>

      <p className="mt-4 text-body text-muted">
        You selected <span className="font-medium text-silver">{period}</span> billing.
      </p>

      <div className="mt-8 rounded-card border border-stroke/70 bg-surface/80 p-7 shadow-soft md:p-8">
        <div className="text-title-lg font-semibold text-silver">
          {plan.emoji} {title}
        </div>

        <div className="mt-2 text-small text-muted">
          Price: <span className="text-silver font-medium">${price}</span> /{" "}
          {period === "annual" ? "year" : "month"}
        </div>

        <div className="mt-7 space-y-4 text-small">
          <p className="text-muted leading-relaxed">
            1) Send <span className="font-semibold text-silver">${price} {token}</span> on{" "}
            <span className="font-semibold text-silver">{chain}</span> to:
          </p>

          <div className="rounded-control border border-stroke/70 bg-surface2/80 p-3 font-mono text-silver break-all">
            {address}
          </div>

          <p className="text-muted leading-relaxed">
            2) In the transaction memo (if available), include your email:{" "}
            <span className="font-mono text-silver">{`<your@email>`}</span>.
          </p>

          <p className="text-muted leading-relaxed">
            3) After confirmation, send the{" "}
            <span className="font-medium text-silver">TX link or screenshot</span> to our Telegram or email.
            We'll reply with your private Telegram invite.
          </p>

          <div className="mt-6">
            <Button href="/pricing" variant="outline" size="md">
              Back to pricing
            </Button>
          </div>

          <SubmitTxForm plan={plan.slug} price={price} />
        </div>
      </div>

      <div className="mt-10 rounded-card border border-stroke/60 bg-surface/70 p-5 text-small text-muted">
        <p className="font-medium text-silver">What happens next?</p>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li>We verify the payment on-chain.</li>
          <li>
            You'll receive a private Telegram link for{" "}
            <span className="font-medium text-silver">{title}</span>.
          </li>
          <li>For bundles, you'll get invites to all included channels.</li>
          <li>Renewals: just repeat the same payment when due.</li>
        </ul>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const period = normalizePeriod(sp);
  const allPlans = [...PLANS, BUNDLE];
  const plan = allPlans.find((pl) => pl.slug === slug);
  const planTitle = getPlanTitle(plan ?? { title: slug });

  const title = `Subscribe - ${planTitle} (${period}) | ${BRAND}`;
  const description = `Complete your ${planTitle} subscription with ${period} billing on ${BRAND}.`;
  const canonical = `${SITE_URL}/pay/${slug}?period=${period}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: BRAND,
      images: [
        {
          url: `${SITE_URL}/favicon.ico`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/favicon.ico`],
    },
  };
}
