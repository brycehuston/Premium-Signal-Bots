import type { Metadata } from "next";
import HomePage from "@/components/HomePage";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `${BRAND} - AI Solana Alerts & Crypto Trading Signals`;
const DESCRIPTION =
  "AI-powered Solana alerts for new tokens, trends, and runners. Clean signals, smart risk filters, and fast Telegram delivery.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: BRAND,
    type: "website",
    images: [
      {
        url: "/favicon.ico",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/favicon.ico"],
  },
};

export default function Page() {
  return <HomePage />;
}