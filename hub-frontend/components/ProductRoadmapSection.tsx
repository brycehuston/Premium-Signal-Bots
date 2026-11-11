type Milestone = {
  number: string;
  title: string;
  status: "LIVE" | "RESEARCH / PAPER" | "IN BUILD" | "PLANNED";
  summary: string;
  details: readonly string[];
};

const MILESTONES: readonly Milestone[] = [
  {
    number: "01",
    title: "SOLANA ALERTS",
    status: "LIVE",
    summary: "The existing Solana discovery and Telegram alert foundation. Individual lane availability is managed separately.",
    details: ["Solana token monitoring", "Lane-specific signals and safety filters", "Telegram-first alert delivery"],
  },
  {
    number: "02",
    title: "ALPHA-X AUTO TRADER",
    status: "RESEARCH / PAPER",
    summary: "Execution research and simulated trading come before any public live-execution service.",
    details: ["Entry and position-size research", "Partial profits, stops and trailing exits", "Execution-adjusted strategy validation"],
  },
  {
    number: "03",
    title: "MULTI-CHAIN ALERTS",
    status: "PLANNED",
    summary: "Expansion beyond Solana to BNB Smart Chain (BSC) and Ethereum (ETH), subject to validation. No release date is announced.",
    details: ["BSC: additional scam and trap filters", "ETH: liquidity and momentum context", "Unified chain-aware scoring, Telegram alerts and dashboard"],
  },
  {
    number: "04",
    title: "ALPHA ACCESS TOKEN",
    status: "PLANNED",
    summary: "Proposed access utility only. No token, staking offer or discount is available through this website today.",
    details: ["Optional subscription utility", "Potential loyalty and early-access features", "Community roadmap participation"],
  },
  {
    number: "05",
    title: "PRO DASHBOARD + BILLING",
    status: "IN BUILD",
    summary: "A verified subscriber intelligence workspace, followed by self-service billing once tested.",
    details: ["Searchable alert history and saved filters", "Evidence-backed performance reports", "Future self-service billing and webhooks"],
  },
];

export default function ProductRoadmapSection() {
  return (
    <section id="roadmap" aria-labelledby="product-roadmap-title" className="scroll-mt-28 rounded-[16px] border border-[#303137] bg-[#101115] p-5 sm:p-7 lg:p-9">
      <div className="flex flex-col gap-5 border-b border-[#2b2d32] pb-7 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#e7bc67]">THE PRODUCT ROADMAP</p>
          <h2 id="product-roadmap-title" className="mt-3 font-display text-[clamp(1.9rem,4vw,3.15rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-[#f0f0f2]">
            Built on Solana. <span className="text-[#e7bc67]">Designed to expand.</span>
          </h2>
        </div>
        <p className="max-w-[39ch] text-[13px] leading-[1.8] text-[#b7b9c2]">
          Current capabilities and planned research are shown separately. Future milestones are not promises of availability, pricing or release dates.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MILESTONES.map((item) => (
          <article key={item.number} className={`relative flex min-w-0 flex-col rounded-[13px] border bg-[#15161a] p-5 sm:p-6 ${item.number === "03" ? "border-[#779fb2]/45" : "border-[#32343a]"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-display text-[11px] font-semibold tracking-[0.21em] text-[#d3af69]">{item.number} / 05</span>
              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.11em] ${item.status === "LIVE" ? "border-emerald-400/30 text-emerald-200" : item.status === "IN BUILD" ? "border-[#b99a66]/45 text-[#e7bc67]" : "border-[#414249] text-[#adb0b9]"}`}>
                {item.status}
              </span>
            </div>
            <h3 className="mt-5 font-display text-[18px] font-semibold tracking-[-0.02em] text-[#f0f0f2]">{item.title}</h3>
            <p className="mt-3 text-[12px] leading-[1.82] text-[#b9bbc4]">{item.summary}</p>
            <ul className="mt-5 space-y-2.5 border-t border-[#303137] pt-4">
              {item.details.map((detail) => (
                <li key={detail} className="flex min-w-0 gap-2.5 text-[11px] leading-[1.7] text-[#adb0ba]">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8b46c]" aria-hidden="true" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="mt-6 text-[11px] leading-[1.75] text-[#999da7]">
        Roadmap milestones depend on research, security and release validation. BSC and ETH alerts are planned future scope and are not included in current Solana subscriptions.
      </p>
    </section>
  );
}
