import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import HomeFaqStructuredData from "@/components/HomeFaqStructuredData";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `${BRAND} Pro - Solana signals that cut the noise`;
const DESCRIPTION =
  "We scan new tokens and on-chain activity, filter obvious traps, and send clean Telegram alerts with risk scoring.";

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
  return (
    <>
      <HomeFaqStructuredData />
      <HomePage />
    </>
  );
}
