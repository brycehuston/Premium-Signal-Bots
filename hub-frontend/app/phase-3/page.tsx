import type { Metadata } from "next";
import StaticHtmlPage from "../_components/StaticHtmlPage";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: `Phase 3 | ${BRAND}`,
  description: `Phase 3 system flow visualization for ${BRAND}.`,
  alternates: {
    canonical: `${SITE_URL}/phase-3`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Phase3Page() {
  return <StaticHtmlPage src="/Part3-magnetic-router-forwarder.html" phaseId="phase-3" />;
}
