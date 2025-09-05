// app/pay/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { PLANS, BUNDLE } from "@/lib/plans";
import SubmitTxForm from "@/components/SubmitTxForm";

type SP = Record<string, string | string[] | undefined>;

export default async function PayPage({
  params,
  searchParams,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: Promise<SP>;
}) {
  const p = await Promise.resolve(params);
  const sp = (await searchParams) ?? {};
  const raw = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const period = raw === "annual" ? "annual" : "monthly";

  const allPlans = [...PLANS, BUNDLE];
  const plan = allPlans.find((pl) => pl.slug === p.slug);
  if (!plan) return notFound();

  const price = period === "annual" ? plan.priceAnnual : plan.priceMonthly;
  const chain = "Solana";
  const token = "USDC";
  const address = process.env.NEXT_PUBLIC_SOLANA_ADDRESS || "4tDVS6pJKirFnXtM3btbP2VfCQbombUotCqtPjoEXkHm";

  return (
    <div className="mx-auto max-w-2xl py-10 px-5">
      <h1 className="text-2xl font-semibold tracking-tight">
        Subscribe — <span className="opacity-70">{plan.title}</span>
      </h1>
      <p className="mt-2 text-white/70">
        You selected <span className="font-medium">{period}</span> billing.
      </p>

      <div className="mt-6 rounded-2xl border border-edge bg-card/80 p-6 shadow-glow">
        <div className="text-lg font-semibold">
          {plan.emoji} {plan.title}
        </div>
        <div className="mt-1 text-white/60">
          Price: <span className="text-white font-medium">${price}</span> / {period === "annual" ? "year" : "month"}
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <p className="text-white/80">
            1) Send <span className="font-semibold">${price} {token}</span> on <span className="font-semibold">{chain}</span> to:
          </p>
          <div className="rounded-lg border border-edge bg-black/30 p-3 font-mono text-white/90 break-all">
            {address}
          </div>

          <p className="text-white/80">
            2) In the transaction memo (if available), include your email: <span className="font-mono">{`<your@email>`}</span>.
          </p>

          <p className="text-white/80">
            3) After confirmation, send the <span className="font-medium">TX link or screenshot</span> to our Telegram or email. We’ll reply with your private Telegram invite.
          </p>

          <div className="mt-4">
            <Link href="/pricing" className="inline-flex h-10 items-center rounded-xl bg-white/5 px-4 text-white hover:bg-white/10">
              Back to pricing
            </Link>
          </div>

          <SubmitTxForm plan={plan.slug} price={price} />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-edge/60 bg-white/5 p-4 text-sm text-white/70">
        <p className="font-medium text-white/80">What happens next?</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>We verify the payment on-chain.</li>
          <li>You’ll receive a private Telegram link for <span className="font-medium">{plan.title}</span>.</li>
          <li>For bundles, you’ll get invites to all included channels.</li>
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
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: Promise<SP>;
}) {
  const p = await Promise.resolve(params);
  const sp = (await searchParams) ?? {};
  const raw = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const period = raw === "annual" ? "annual" : "monthly";
  return { title: `Subscribe — ${p.slug} (${period})` };
}
