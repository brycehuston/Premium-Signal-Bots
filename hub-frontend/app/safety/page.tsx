import type { Metadata } from "next";
import { Card, CardBody, Button, SectionHeading } from "@/components/ui";
import Link from "next/link";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `Safety Guide | ${BRAND}`;
const DESCRIPTION =
  "Learn how to spot common traps, verify faster with Axiom, and stay cautious with microcap alerts.";

const SAFETY_FAQ = [
  {
    question: "What is a honeypot-",
    answer: "A honeypot lets you buy but blocks selling or makes selling impossible.",
  },
  {
    question: "What are bundlers or bundled buys-",
    answer: "Coordinated wallets buying together to manufacture hype.",
  },
  {
    question: "What is fake volume or wash trading-",
    answer: "Bots trading to fake activity and trick real buyers.",
  },
  {
    question: "How to Verify Fast with Axiom",
    answer:
      "Axiom helps show top holders, insiders, bundlers, dev activity, and wallet behavior.",
  },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/safety`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/safety`,
    siteName: BRAND,
    type: "article",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/favicon.ico"],
  },
};

export default function SafetyPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SAFETY_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">Safety Guide</div>
        <h1 className="font-display text-[40px] font-semibold tracking-tight text-silver sm:text-[58px]">
          Spot traps faster. Stay clean.
        </h1>
        <p className="mx-auto max-w-2xl text-body text-muted">
          Short, practical checks to reduce obvious risk before you enter. Informational only.
        </p>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Scam Stuff Explained"
          title="Know the common traps"
          subtitle="Learn the basics so you can scan faster."
          align="center"
        />
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-display text-title-lg font-semibold text-silver">
                What is a honeypot-
              </h3>
              <p className="text-small text-muted">
                A honeypot lets you buy but blocks selling or makes selling impossible.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-display text-title-lg font-semibold text-silver">
                What are bundlers or bundled buys-
              </h3>
              <p className="text-small text-muted">
                Coordinated wallets buying together to manufacture hype.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-display text-title-lg font-semibold text-silver">
                What is fake volume or wash trading-
              </h3>
              <p className="text-small text-muted">
                Bots trading to fake activity and trick real buyers.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardBody className="space-y-4">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">Reality Check</div>
            <ul className="space-y-3 text-small text-muted">
              <li>Alerts are suggestions, not guarantees.</li>
              <li>Most microcaps dump. Manage risk. Don't get greedy.</li>
            </ul>
          </CardBody>
        </Card>
        <Card className="h-full">
          <CardBody className="space-y-4">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">
              Dex Paid and Migration
            </div>
            <p className="text-small text-muted leading-relaxed">
              I've noticed (not always) tokens can dump right after Dex Paid or migration. Don't
              treat these as bullish by default. Wait for the reaction and strength. If it dips,
              reclaims, and continues trending, that is stronger than the event itself.
            </p>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardBody className="space-y-4">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">
              Dev Buys Can Be a Trap
            </div>
            <p className="text-small text-muted leading-relaxed">
              Sometimes devs or insiders buy to create confidence, then sell into the hype. Use
              wallet behavior and distribution checks.
            </p>
          </CardBody>
        </Card>
        <Card className="h-full">
          <CardBody className="space-y-4">
            <div className="text-eyebrow uppercase tracking-[0.35em] text-muted/70">
              How to Verify Fast with Axiom
            </div>
            <ul className="space-y-2 text-small text-muted">
              <li>
                Axiom helps show top holders, insiders, bundlers, dev activity, and wallet behavior.
              </li>
              <li>
                Chart tip: toggle "Show All Bubbles" to see more context (dev buys or sells, Dex
                Paid or migration markers, and tweets if available).
              </li>
            </ul>
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardBody className="space-y-4">
            <SectionHeading
              eyebrow="Baseline Audit Caps"
              title="Quick filters (not foolproof)"
              subtitle="Use these to reduce obvious junk."
              align="left"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>Top 10 Holders %</span>
                <span className="font-semibold text-silver">max 25</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>Insider Holding %</span>
                <span className="font-semibold text-silver">max 5</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>Bundlers %</span>
                <span className="font-semibold text-silver">max 5</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>Dev Holdings %</span>
                <span className="font-semibold text-silver">max 5</span>
              </div>
            </div>
            <p className="text-small text-muted/80">
              These filters reduce obvious junk but do not guarantee safety or profit.
            </p>
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardBody className="space-y-4">
            <SectionHeading
              eyebrow="Axiom Suggested Filters"
              title="Momentum sanity checks"
              subtitle="Helpful starting points before you go deeper."
              align="left"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>MC min</span>
                <span className="font-semibold text-silver">30-50k</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>Liquidity min</span>
                <span className="font-semibold text-silver">15-20k</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>Volume (5m) min</span>
                <span className="font-semibold text-silver">10-15k</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
                <span>M5 TX min</span>
                <span className="font-semibold text-silver">150-250</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted sm:col-span-2">
                <span>B/S ratio</span>
                <span className="font-semibold text-silver">{">= 1.2"}</span>
              </div>
            </div>
            <p className="text-small text-muted/80">
              Suggested ranges are directional only. Combine with holder checks and trend behavior.
            </p>
          </CardBody>
        </Card>
      </section>

      <section className="flex flex-col items-center gap-3 text-center">
        <Button href="/pricing" size="lg" className="w-full sm:w-auto px-10">
          View Pricing
        </Button>
        <Link className="text-[12px] text-gold/80 hover:text-gold" href="/#sample-alerts" data-no-link-style>
          See Sample Alerts
        </Link>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
