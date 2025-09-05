// app/pay/[slug]/page.tsx
import Link from "next/link";
import { PLANS, BUNDLE } from "@/lib/plans";

// Helper to coerce the period query param
function normalizePeriod(v: unknown): "monthly" | "annual" {
  return v === "annual" ? "annual" : "monthly";
}

export default async function PayPage({
  params,
  searchParams,
}: {
  // ✅ Next 15 expects Promise-like props for App Router pages
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ period?: string }>;
}) {
  // Await both props to satisfy PageProps constraint
  const { slug } = await params;
  const qp = (await searchParams) ?? {};
  const period = normalizePeriod(qp.period);

  const plan =
    PLANS.find((p) => p.slug === slug) || (slug === BUNDLE.slug ? BUNDLE : null);

  if (!plan) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Plan not found</h1>
        <p className="text-white/70">
          The plan <code className="text-white/90">{slug}</code> doesn’t exist.
        </p>
        <Link href="/pricing" className="btn">
          Back to pricing
        </Link>
      </div>
    );
  }

  const price =
    period === "annual" ? plan.priceAnnual : plan.priceMonthly;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-edge bg-card/80 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold tracking-tight">
          Checkout — {plan.title}
        </h1>
        <p className="mt-1 text-white/70">
          You chose <span className="font-medium">{period}</span> billing.
        </p>

        <div className="mt-4 rounded-xl border border-edge/70 bg-black/30 p-4">
          <div className="text-sm text-white/70">Amount</div>
          <div className="text-3xl font-semibold mt-1">${price}</div>
        </div>

        <div className="mt-6 space-y-3 text-white/80">
          <p>
            For now we’re doing manual crypto payments (USDC on Solana or SOL).
            Send the funds to the address below and paste the transaction link /
            screenshot. You’ll receive the private Telegram invite automatically
            after confirmation.
          </p>

          <div className="rounded-xl border border-edge/60 bg-white/5 p-4">
            <div className="text-sm text-white/70">USDC (Solana) address</div>
            <div className="mt-1 select-all font-mono text-sm">
              YOUR_SOLANA_USDC_ADDRESS_HERE
            </div>
          </div>

          <div className="rounded-xl border border-edge/60 bg-white/5 p-4">
            <div className="text-sm text-white/70">SOL address (optional)</div>
            <div className="mt-1 select-all font-mono text-sm">
              YOUR_SOL_ADDRESS_HERE
            </div>
          </div>

          <ol className="list-decimal pl-5 space-y-1 text-sm text-white/70">
            <li>Send exactly ${price} {period === "annual" ? "(annual)" : "(monthly)"}.</li>
            <li>Copy the Solscan link (or a screenshot) of your tx.</li>
            <li>
              DM{" "}
              <a
                href="https://t.me/your_handle"
                target="_blank"
                className="underline"
              >
                @your_handle
              </a>{" "}
              in Telegram with your email and tx proof.
            </li>
          </ol>
        </div>

        <div className="mt-6 flex gap-2">
          <Link href="/pricing" className="btn bg-white/5 hover:bg-white/10">
            Choose another plan
          </Link>
          <Link href="/dashboard" className="btn">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
