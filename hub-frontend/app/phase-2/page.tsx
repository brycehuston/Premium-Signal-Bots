import type { Metadata } from "next";
import StaticHtmlPage from "../_components/StaticHtmlPage";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: `Phase 2 | ${BRAND}`,
  description: `Phase 2 system flow visualization for ${BRAND}.`,
  alternates: {
    canonical: `${SITE_URL}/phase-2`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Phase2Page() {
  return <StaticHtmlPage src="/Part2-python-scanner-bots.html" phaseId="phase-2" />;
}
