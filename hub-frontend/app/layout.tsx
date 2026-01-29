// app/layout.tsx
// Updates: refined layout structure, spacing rhythm, performance hooks, and motion polish.
import "./globals.css";
import { Manrope, Sora } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import React from "react";
import BottomTickerBar from "@/components/BottomTickerBar";
import Header from "@/components/Header";
import StructuredData from "@/components/StructuredData";
import { ClerkProvider } from "@clerk/nextjs";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const display = Sora({ subsets: ["latin"], variable: "--font-display" });
const BRAND = process.env.NEXT_PUBLIC_BRAND || "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Optional but nice: tell mobile browsers your theme color
export const viewport: Viewport = {
  themeColor: "#060606",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND} Pro`,
    template: `%s | ${BRAND}`,
  },
  description: "Premium crypto alerts with clean signals, smart filters, and fast delivery.",
  openGraph: {
    title: `${BRAND} Pro`,
    description: "Premium crypto alerts with clean signals, smart filters, and fast delivery.",
    url: SITE_URL,
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
    title: `${BRAND} Pro`,
    description: "Premium crypto alerts with clean signals, smart filters, and fast delivery.",
    images: ["/favicon.ico"],
  },

  // Force favicon paths (App Router)
  icons: {
    icon: [{ url: "/favicon.ico" }],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [],
  },
};

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${sans.variable} ${display.variable} overflow-x-hidden`}
        suppressHydrationWarning
      >
      <body className="min-h-screen bg-bg text-text antialiased font-sans overflow-x-hidden">
        {/* decorative bg layers */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0" style={{ backgroundImage: "var(--vignette)" }} />
          <div className="absolute inset-0 opacity-[0.05] bg-hero-grid bg-grid" />
          <div className="absolute -top-56 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[140px]" />
          <div className="absolute bottom-0 right-10 h-[22rem] w-[22rem] rounded-full bg-silver/10 blur-[120px]" />
        </div>

        {/* Global JSON-LD structured data */}
        <StructuredData />

        <Toaster richColors position="top-center" />

        {/* navbar */}
        <Header brand={BRAND} />

        {/*
          IMPORTANT:
          - pb-16 reserves space for the fixed BottomTickerBar
        */}
        <div className="pb-16">
          <main className="py-10">
            <Container>{children}</Container>
          </main>

          <footer className="mt-14 border-t border-stroke/60">
            <Container>
              <div className="flex flex-col gap-3 py-8 text-small text-muted sm:flex-row sm:items-center sm:justify-between">
                <div>© {new Date().getFullYear()} HUSTON SOLUTIONS</div>
                <div className="flex flex-wrap items-center gap-4">
                  <a className="hover:text-text" href="/privacy" data-no-link-style>
                    Privacy
                  </a>
                  <a className="hover:text-text" href="/terms" data-no-link-style>
                    Terms
                  </a>
                  <a className="hover:text-text" href="/safety" data-no-link-style>
                    Safety Guide
                  </a>
                  <a className="hover:text-text" href="/contact" data-no-link-style>
                    Contact
                  </a>
                </div>
              </div>
            </Container>
          </footer>
        </div>

        {/* Bottom live ticker bar (BTC / ETH / SOL + social links) */}
        <BottomTickerBar
          telegramUrl={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/alphaalerts"}
          xUrl={process.env.NEXT_PUBLIC_X_URL || "https://x.com/alphaalerts"}
          refreshMs={8000}
        />

        </body>
      </html>
    </ClerkProvider>
  );
}
