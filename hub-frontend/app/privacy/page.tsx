"use client"

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Card, CardBody, SectionHeading } from "@/components/ui";

const AT_A_GLANCE = [
  {
    title: "Data we collect",
    body: "Email, Telegram username (if provided), plan tier, and payment verification details.",
  },
  {
    title: "Data we do NOT collect",
    body: "We never ask for seed phrases or private keys.",
  },
  {
    title: "Why we collect",
    body: "To deliver alerts, manage access, verify payments, and provide support.",
  },
  {
    title: "Sharing",
    body: "We do not sell data. We only share with service providers when needed to operate the service.",
  },
  {
    title: "Retention",
    body: "We keep data only as long as needed for service, support, and compliance.",
  },
  {
    title: "Your choices",
    body: "You can request access, correction, or deletion by emailing support.",
  },
];

const DETAIL_SECTIONS = [
  {
    title: "What we collect",
    body: [
      "Account details such as email, plan tier, and timestamps.",
      "Telegram username if you provide it for onboarding.",
      "Payment verification details (transaction hash, chain, amount, status).",
    ],
  },
  {
    title: "How we use it",
    body: [
      "To provide alerts and manage private channel access.",
      "To verify payments and confirm entitlements.",
      "To respond to support requests and maintain service quality.",
    ],
  },
  {
    title: "What we do not collect",
    body: [
      "We never request or store seed phrases or private keys.",
      "We do not access your wallets or move funds.",
    ],
  },
  {
    title: "Sharing and disclosures",
    body: [
      "We do not sell personal data.",
      "We may share limited data with service providers (hosting, analytics, messaging) only to operate the service.",
      "We may disclose information if required by law.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "We may use essential cookies for session and security purposes.",
      "We may use privacy-friendly analytics to improve the product.",
    ],
  },
  {
    title: "Blockchain note (public transactions)",
    body: [
      "Blockchain transactions are public by nature. We only store what is required to verify payment status.",
    ],
  },
  {
    title: "Retention",
    body: [
      "We retain data only as long as needed for service, support, and compliance.",
      "You may request deletion; some records may be retained where required.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use standard security practices to protect data.",
      "No system is perfect; please use strong passwords and keep your accounts secure.",
    ],
  },
  {
    title: "Your rights and requests",
    body: [
      "You can request access, correction, or deletion of your data.",
      "Contact support and we will respond within a reasonable timeframe.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Email: support@alphaalerts.pro",
      "Telegram: @alphaalerts",
    ],
  },
];

const FLOW_STEPS = [
  {
    label: "Signup Info",
    tooltip: "Collects email and plan selection.",
  },
  {
    label: "Payment Verification",
    tooltip: "Confirms payment and unlocks access.",
  },
  {
    label: "Telegram Access",
    tooltip: "Sends invite link and grants role.",
  },
];

export default function PrivacyPage() {
  const prefersReduced = useReducedMotion();
  const glanceRef = useRef<HTMLDivElement | null>(null);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const [glanceActive, setGlanceActive] = useState(false);
  const [flowActive, setFlowActive] = useState(false);

  useEffect(() => {
    if (prefersReduced) return;
    const handleObserve = (ref: React.RefObject<HTMLDivElement>, setter: (v: boolean) => void) => {
      const node = ref.current;
      if (!node) return;
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setter(true);
            io.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      io.observe(node);
      return () => io.disconnect();
    };

    const cleanupGlance = handleObserve(glanceRef, setGlanceActive);
    const cleanupFlow = handleObserve(flowRef, setFlowActive);
    return () => {
      cleanupGlance && cleanupGlance();
      cleanupFlow && cleanupFlow();
    };
  }, [prefersReduced]);

  return (
    <div className="mx-auto max-w-5xl py-6 space-y-10">
      <Card>
        <CardBody className="space-y-4">
          <h1 className="font-display text-h2 md:text-hero font-semibold tracking-tight text-silver">
            Privacy Policy
          </h1>
          <p className="text-body text-muted">How we handle data across AlphaAlerts Pro.</p>
          <div className="text-small text-muted/80 uppercase tracking-[0.25em]">
            Last updated: January 29, 2026
          </div>
        </CardBody>
      </Card>

      <section className="space-y-6">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted/70">
          Summary
        </div>
        <div
          ref={glanceRef}
          className={[
            "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
            glanceActive ? "glance-animate" : "",
          ].join(" ")}
        >
          {AT_A_GLANCE.map((item) => (
            <Card key={item.title} className="relative overflow-hidden glance-card">
              <CardBody className="space-y-3">
                <div className="flex items-center justify-end">
                  <span className="glance-dot" aria-hidden />
                </div>
                <h3 className="font-display text-title-lg font-semibold text-silver">
                  {item.title}
                </h3>
                <p className="text-small text-muted">{item.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          title="Policy details"
          subtitle="Full transparency on collection, usage, and retention."
        />
        <div className="space-y-3">
          {DETAIL_SECTIONS.map((section) => (
            <details key={section.title} className="rounded-card border border-stroke/70 bg-surface/70 p-4 shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-silver font-semibold">
                <span>{section.title}</span>
                <span className="text-muted transition group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 space-y-2 text-body text-muted">
                <ul className="list-disc pl-5 space-y-1">
                  {section.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Data flow" subtitle="How access is unlocked." />
        <div
          ref={flowRef}
          className={[
            "rounded-card border border-stroke/70 bg-surface/70 p-4",
            flowActive ? "flow-animate" : "",
          ].join(" ")}
        >
          <div className="flex items-center justify-between text-small text-muted flow-steps">
            {FLOW_STEPS.map((step, index) => (
              <div key={step.label} className="relative flow-step">
                <button
                  type="button"
                  className="flow-step-btn"
                  aria-describedby={`flow-tip-${index}`}
                >
                  {step.label}
                </button>
                <span className="flow-node" data-index={index} aria-hidden />
                <span id={`flow-tip-${index}`} role="tooltip" className="flow-tooltip">
                  {step.tooltip}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-3 h-2">
            <div className="flow-line" aria-hidden />
            <div className="flow-pulse" aria-hidden />
            <div className="flow-particles" aria-hidden />
          </div>
        </div>
      </section>

      <style>{`
        .glance-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: -30%;
          width: 60%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(246, 212, 139, 0.8), transparent);
          opacity: 0;
        }
        .glance-animate .glance-card::before {
          animation: glanceSweep 1.2s ease-out 1;
        }
        .glance-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(246, 212, 139, 0.9);
          box-shadow: 0 0 6px rgba(246, 212, 139, 0.6);
          opacity: 0.6;
        }
        .glance-animate .glance-dot {
          animation: glanceDot 1.1s ease-out 1;
        }
        .flow-steps {
          position: relative;
        }
        .flow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .flow-step-btn {
          background: transparent;
          border: 0;
          padding: 0;
          margin: 0;
          color: inherit;
          font: inherit;
          cursor: pointer;
          transition: color 200ms ease;
        }
        .flow-step:hover .flow-step-btn,
        .flow-step:focus-within .flow-step-btn {
          color: rgba(246, 238, 218, 0.95);
        }
        .flow-node {
          position: absolute;
          bottom: -14px;
          left: 50%;
          width: 7px;
          height: 7px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: rgba(246, 212, 139, 0.45);
          box-shadow: 0 0 6px rgba(246, 212, 139, 0.2);
          transition: background 200ms ease, box-shadow 200ms ease, transform 200ms ease;
        }
        .flow-step:hover .flow-node,
        .flow-step:focus-within .flow-node {
          background: rgba(246, 212, 139, 0.9);
          box-shadow: 0 0 10px rgba(246, 212, 139, 0.45);
          transform: translateX(-50%) scale(1.05);
        }
        .flow-tooltip {
          position: absolute;
          top: -36px;
          left: 50%;
          transform: translate(-50%, -6px);
          min-width: 190px;
          max-width: 220px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(246, 212, 139, 0.18);
          background: rgba(9, 10, 12, 0.95);
          color: rgba(245, 242, 232, 0.92);
          font-size: 12px;
          line-height: 1.35;
          text-align: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms ease, transform 200ms ease;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.4);
        }
        .flow-step:hover .flow-tooltip,
        .flow-step:focus-within .flow-tooltip {
          opacity: 1;
          transform: translate(-50%, -10px);
        }
        .flow-line {
          position: absolute;
          inset: 0;
          height: 1px;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(90deg, rgba(110, 114, 120, 0.6), rgba(110, 114, 120, 0.25), rgba(110, 114, 120, 0.1));
        }
        .flow-pulse,
        .flow-particles {
          position: absolute;
          top: 50%;
          left: 0;
          height: 2px;
          transform: translateY(-50%);
          opacity: 0;
        }
        .flow-pulse {
          width: 56px;
          background: linear-gradient(90deg, transparent, rgba(246, 212, 139, 1), transparent);
          filter: drop-shadow(0 0 9px rgba(246, 212, 139, 0.65));
        }
        .flow-particles {
          width: 28px;
          background: linear-gradient(90deg, transparent, rgba(246, 212, 139, 0.35), transparent);
          filter: blur(1px);
        }
        .flow-animate .flow-pulse {
          animation: flowPulse 6s ease-in-out infinite;
        }
        .flow-animate .flow-particles {
          animation: flowParticles 6s ease-in-out infinite;
        }
        .flow-animate .flow-node[data-index="0"] {
          animation: nodePing 6s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .flow-animate .flow-node[data-index="1"] {
          animation: nodePing 6s ease-in-out infinite;
          animation-delay: 1.4s;
        }
        .flow-animate .flow-node[data-index="2"] {
          animation: nodePing 6s ease-in-out infinite;
          animation-delay: 2.6s;
        }
        @keyframes glanceSweep {
          0% { opacity: 0; transform: translateX(0); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translateX(240%); }
        }
        @keyframes glanceDot {
          0% { opacity: 0.25; }
          60% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }
        @keyframes flowPulse {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          45% { left: calc(100% - 56px); opacity: 1; }
          58% { opacity: 0; }
          100% { left: calc(100% - 56px); opacity: 0; }
        }
        @keyframes flowParticles {
          0% { left: 0; opacity: 0; }
          12% { opacity: 0.45; }
          47% { left: calc(100% - 28px); opacity: 0.25; }
          60% { opacity: 0; }
          100% { left: calc(100% - 28px); opacity: 0; }
        }
        @keyframes nodePing {
          0% { background: rgba(246, 212, 139, 0.4); box-shadow: 0 0 6px rgba(246, 212, 139, 0.2); }
          10% { background: rgba(246, 212, 139, 1); box-shadow: 0 0 14px rgba(246, 212, 139, 0.75); }
          18% { background: rgba(246, 212, 139, 0.45); box-shadow: 0 0 6px rgba(246, 212, 139, 0.2); }
          100% { background: rgba(246, 212, 139, 0.45); box-shadow: 0 0 6px rgba(246, 212, 139, 0.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glance-animate .glance-card::before,
          .glance-animate .glance-dot,
          .flow-animate .flow-pulse,
          .flow-animate .flow-particles,
          .flow-animate .flow-node[data-index="0"],
          .flow-animate .flow-node[data-index="1"],
          .flow-animate .flow-node[data-index="2"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

