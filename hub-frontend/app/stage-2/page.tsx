import type { Metadata } from "next";
import Stage2Frame from "./Stage2Frame";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Stage 2",
  description: `Stage 2 system flow visualization for ${BRAND}.`,
  alternates: {
    canonical: `${SITE_URL}/stage-2`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Stage2Page() {
  return <Stage2Frame />;
}
