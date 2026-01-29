import { Card, CardBody, SectionHeading } from "@/components/ui";

const QUICK_READ = [
  "We send informational alerts, not trading instructions. Crypto can move fast and go to zero.",
  "Passing filters does not mean a token is safe or profitable. You are responsible for every trade you make.",
  "Never share paid access or repost alerts. We can revoke access if you do.",
  "Payments are manual (USDC on Solana) and verified on-chain. Blockchain transactions are typically irreversible.",
];

const SECTIONS = [
  {
    title: "What AlphaAlerts Is",
    body: [
      "AlphaAlerts is a signal and alert service designed to reduce noise by scanning tokens and filtering out obvious high-risk patterns.",
      "When a token passes filters, we may send an alert to Telegram with structured information to help you review faster.",
      "Important: We are not an exchange, broker, or custody service. We do not hold your funds and we do not execute trades for you.",
    ],
  },
  {
    title: "No Financial Advice",
    body: [
      "AlphaAlerts provides informational alerts only. Nothing in the Service is financial advice, investment advice, or a recommendation to buy, sell, or hold any asset.",
      "You are responsible for your own decisions, risk management, and compliance with your local laws.",
    ],
  },
  {
    title: "Risk Disclosure (Read This Twice)",
    body: [
      "Crypto, especially Solana micro-caps, is highly risky. Prices and liquidity can change fast, and you can lose all of your money.",
    ],
    bullets: [
      "Extreme volatility and rapid price swings",
      "Scams, manipulation, bot volume, and misleading activity",
      "Liquidity disappearing without warning",
      "Blockchain transactions being hard or impossible to reverse once sent",
      "No guarantee: Even good-looking tokens can dump immediately. Passing filters does not mean a token is safe, profitable, or suitable.",
    ],
  },
  {
    title: "Alerts, Accuracy, and Limitations",
    body: [
      "We try to provide useful signals, but you agree that:",
    ],
    bullets: [
      "Alerts may be delayed, incomplete, inaccurate, or missing.",
      "We may change scoring, filters, and alert formatting at any time.",
      "Telegram outages, RPC issues, API downtime, or network congestion can impact delivery.",
      "You should always verify token data yourself before taking action.",
    ],
  },
  {
    title: "Third-Party Links and Tools",
    body: [
      "Alerts may include links to third-party services (examples: explorers, analytics tools, trading UIs). These tools are not controlled by us.",
      "We do not guarantee their accuracy, uptime, or safety. Your use of third-party services is at your own risk.",
    ],
  },
  {
    title: "Eligibility",
    body: [
      "You must be legally allowed to use the Service in your location.",
      "If you are not the age of majority where you live, you must not use the Service.",
    ],
  },
  {
    title: "Access, Accounts, and Sharing Rules",
    body: [
      "Access is provided through private Telegram channels tied to your plan.",
      "You agree:",
    ],
    bullets: [
      "Do not share invite links, redistribute alerts, or mirror our channels.",
      "Do not sell, rent, or group-buy access.",
      "Do not scrape, copy, or republish alerts for a competing product.",
      "We can suspend or terminate access if we believe rules are being violated.",
    ],
  },
  {
    title: "Payments, Billing, and Renewals",
    body: [
      "Payments are currently manual and typically made in USDC on Solana.",
      "We verify payment on-chain before granting access.",
      "Renewals require a new payment when your period ends (unless we introduce automatic billing later).",
      "You are responsible for:",
    ],
    bullets: [
      "Sending the correct amount to the correct address",
      "Any network fees",
      "Using the correct chain and token",
      "Double-checking all details before sending, since blockchain transactions may be irreversible",
    ],
  },
  {
    title: "Cancellations and Refunds",
    body: [
      "Because payments are verified on-chain and access is digital, all sales are generally final once access is granted.",
      "If you want to cancel, you must contact support before your next cycle to avoid renewing.",
      "We may choose to issue refunds in rare cases (example: duplicate payment), but we are not required to do so.",
      "For support: alphaalerts.pro@gmail.com",
    ],
  },
  {
    title: "Acceptable Use (Do Not Do This)",
    body: [
      "You may not:",
    ],
    bullets: [
      "Use the Service for illegal activity",
      "Attempt to bypass access controls",
      "Attack or interfere with the Service (DDoS, spam, scraping, automation abuse)",
      "Reverse engineer or copy our scoring, filters, or alert formatting to clone the product",
      "Harass or abuse our team or community",
    ],
  },
  {
    title: "Intellectual Property",
    body: [
      "The Service, alert formats, copy, branding, and underlying systems are owned by AlphaAlerts or its licensors.",
      "We grant you a limited, personal, non-transferable right to access the Service for your own use during an active subscription. No resale.",
    ],
  },
  {
    title: "Continuous Improvement and Data",
    body: [
      "We may improve the Service over time by reviewing outcomes and refining filters to reduce false positives. Improvements do not guarantee results.",
    ],
  },
  {
    title: "Alpha-X and Future Features",
    body: [
      "Alpha-X is planned as an automation layer. It is not guaranteed, may change, and may require separate terms, pricing, and additional risk acknowledgements.",
      "Future expansion to other chains (BSC, Ethereum, others) may also come with changes to pricing, features, and risk.",
    ],
  },
  {
    title: "Disclaimers (Legal)",
    body: [
      "The Service is provided as is and as available. We make no warranties of any kind, including warranties of accuracy, reliability, availability, merchantability, or fitness for a particular purpose.",
      "These disclaimers are standard in SaaS agreements and help limit vendor exposure.",
    ],
  },
  {
    title: "Limitation of Liability",
    body: [
      "To the maximum extent allowed by law, AlphaAlerts is not liable for any losses, including trading losses, lost profits, missed opportunities, or indirect damages.",
      "If AlphaAlerts is found liable for any reason, our total liability will be limited to the amount you paid to AlphaAlerts in the most recent billing period (or the lowest amount allowed by your local law).",
      "Liability limitations are standard in SaaS agreements.",
    ],
  },
  {
    title: "Indemnification",
    body: [
      "You agree to defend and indemnify AlphaAlerts from claims or losses arising from your use of the Service, your violation of these Terms, or your violation of any law or third-party rights.",
    ],
  },
  {
    title: "Changes to the Service and Terms",
    body: [
      "We may update the Service, pricing, or these Terms at any time.",
      "If changes are material, we will update the Last updated date.",
      "Continuing to use the Service after changes means you accept the updated Terms.",
    ],
  },
  {
    title: "Governing Law",
    body: [
      "These Terms are governed by the laws of British Columbia, Canada, excluding conflict of law rules.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions or support: alphaalerts.pro@gmail.com",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl py-6 space-y-8">
      <Card>
        <CardBody className="space-y-4">
          <h1 className="font-display text-h2 md:text-hero font-semibold tracking-tight text-silver">
            Terms of Service
          </h1>
          <p className="text-body text-muted">Rules and expectations for using AlphaAlerts Pro.</p>
          <div className="text-small text-muted/80 uppercase tracking-[0.25em]">
            Last updated: January 29, 2026
          </div>
        </CardBody>
      </Card>

      <section className="space-y-4">
        <SectionHeading title="Quick read (plain English)" subtitle="Short, clear expectations." />
        <Card>
          <CardBody className="space-y-3 text-body text-muted">
            <ul className="list-disc pl-5 space-y-2">
              {QUICK_READ.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-5">
        {SECTIONS.map((section, index) => (
          <Card key={section.title} className="border border-stroke/70 bg-surface/70">
            <CardBody className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-title-lg font-semibold text-silver">
                  {index + 1}) {section.title}
                </h2>
              </div>
              <div className="space-y-2 text-body text-muted">
                {section.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
