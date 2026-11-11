"use client";

import Link from "next/link";

type StaticHtmlPageProps = {
  src: string;
  phaseId: string;
};

/**
 * Stage visualizations are standalone HTML applications with their own CSS,
 * global handlers and requestAnimationFrame loops. A same-origin iframe keeps
 * those resources isolated, and navigation destroys the previous document.
 * Script injection into the Next document leaked styles and running loops.
 */
export default function StaticHtmlPage({ src, phaseId }: StaticHtmlPageProps) {
  return (
    <div className="fixed inset-0 z-40 h-[100dvh] w-screen overflow-hidden bg-[#09090b]">
      <iframe
        key={phaseId}
        title={`Alpha Alerts — ${phaseId} system visualization`}
        src={src}
        loading="eager"
        className="block h-full w-full border-0 bg-[#09090b]"
        allowFullScreen
      />
      <a
        href={src}
        aria-label={`Open ${phaseId} directly without the embedded viewer`}
        className="fixed right-3 top-3 z-[70] rounded-lg border border-[#3d3f45]/70 bg-[#090a0c]/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#aeb2bc] transition-colors hover:border-[#e7bc67]/50 hover:text-[#e7bc67] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7bc67] sm:right-5 sm:top-5"
        style={{ textDecoration: "none" }}
      >
        Direct view
      </a>
      <Link
        href="/"
        aria-label="Return to Alpha Alerts homepage"
        className="fixed bottom-3 left-3 z-[70] inline-flex min-h-11 items-center rounded-lg border border-[#806b43]/70 bg-[#090a0c]/95 px-4 py-2 text-[11px] font-bold tracking-[0.12em] text-[#e7bc67] shadow-lg transition-colors hover:border-[#e7bc67] hover:bg-[#14151a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7bc67] sm:bottom-5 sm:left-5"
        style={{ textDecoration: "none", bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        ← ALPHA ALERTS
      </Link>
    </div>
  );
}
