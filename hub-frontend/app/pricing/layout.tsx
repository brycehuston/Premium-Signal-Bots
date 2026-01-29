import type { Metadata } from "next";
import type { ReactNode } from "react";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `Pricing | ${BRAND}`;
const DESCRIPTION =
  "Choose your lane for Solana alerts. Private Telegram delivery, manual verification, and USDC on Solana payments.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/pricing`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/pricing`,
    siteName: BRAND,
    type: "website",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/favicon.ico"],
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
