import type { Metadata } from "next";
import StaticHtmlPage from "../_components/StaticHtmlPage";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: `Phase 1 | ${BRAND}`,
  description: `Phase 1 system flow visualization for ${BRAND}.`,
  alternates: {
    canonical: `${SITE_URL}/phase-1`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Phase1Page() {
  return <StaticHtmlPage src="/Part1-source-node.html" phaseId="phase-1" />;
}
