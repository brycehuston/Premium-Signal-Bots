import type { MetadataRoute } from "next";

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND} Pro`,
    short_name: BRAND,
    description:
      "AI-powered Solana alerts with clean signals, smart risk filters, and fast Telegram delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#050506",
    theme_color: "#060606",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}