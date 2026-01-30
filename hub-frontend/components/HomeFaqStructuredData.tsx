const FAQ_ITEMS = [
  {
    q: "How do alerts get delivered?",
    a: "Alerts are delivered in private Telegram channels tied to your plan. Each alert includes a clean summary, safety checks, and one-tap links.",
  },
  {
    q: "What's inside an alert?",
    a: "A score, quick risk checks, and fast links (Axiom, explorer, and trading tools) so you can verify before you enter.",
  },
  {
    q: "How does payment verification work?",
    a: "Payments are manual for now via USDC on Solana. We verify on-chain, then invite you to the correct private channels.",
  },
  {
    q: "Do you guarantee profits?",
    a: "No. These are informational alerts, not financial advice. This market is high-risk and you are responsible for your own decisions.",
  },
  {
    q: "What is a honeypot, bundlers, or fake volume?",
    a: "Honeypot means you can buy but you can't sell. Bundlers and fake volume can make a chart look \"busy\" even when activity is manipulated. Use Axiom to verify.",
  },
  {
    q: "Why do some tokens dump after Dex Paid or migration?",
    a: "Not always, but it happens a lot. Treat Dex Paid and migration as volatility events, not bullish signals. Wait for the reaction and real strength.",
  },
  {
    q: "How do I verify faster with Axiom?",
    a: "Use Axiom to check holder concentration, insiders, bundlers, and dev activity. It helps you spot traps faster before risking money.",
  },
];

export default function HomeFaqStructuredData() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
    />
  );
}

