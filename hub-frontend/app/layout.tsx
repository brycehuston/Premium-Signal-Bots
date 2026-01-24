// app/layout.tsx
// Updates: refined layout structure, spacing rhythm, performance hooks, and motion polish.
import "./globals.css";
import { Manrope, Sora } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import Link from "next/link";
import React from "react";
import BottomTickerBar from "@/components/BottomTickerBar";
import { Button } from "@/components/ui";
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
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} Pro`,
    description: "Premium crypto alerts with clean signals, smart filters, and fast delivery.",
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

        <Toaster richColors position="top-center" />

        {/* navbar */}
        <header className="sticky top-0 z-30 border-b border-stroke/60 bg-bg/80 backdrop-blur">
          <Container>
            <div className="flex h-16 items-center justify-between gap-4">
              <Link href="/" className="text-lg sm:text-xl font-semibold tracking-tight">
                <span className="text-metal-silver">{BRAND}</span>
                <span className="ml-1 text-muted">Pro</span>
              </Link>

              <nav className="flex items-center gap-2">
                <Link
                  className="rounded-pill px-3 py-1.5 text-small text-muted hover:bg-surface2/60 hover:text-text"
                  href="/pricing"
                  data-no-link-style
                >
                  Pricing
                </Link>
                <Link
                  className="rounded-pill px-3 py-1.5 text-small text-muted hover:bg-surface2/60 hover:text-text hidden md:inline-flex"
                  href="/dashboard"
                  data-no-link-style
                >
                  Dashboard
                </Link>
                <Link
                  className="rounded-pill px-3 py-1.5 text-small text-muted hover:bg-surface2/60 hover:text-text hidden md:inline-flex"
                  href="/billing"
                  data-no-link-style
                >
                  Billing
                </Link>
                <Link
                  className="rounded-pill px-3 py-1.5 text-small text-muted hover:bg-surface2/60 hover:text-text hidden sm:inline-flex"
                  href="/login"
                  data-no-link-style
                >
                  Login
                </Link>
                <Button
                  href="/pricing#plans"
                  size="sm"
                  className="hidden h-9 px-4 text-small sm:inline-flex font-extrabold tracking-[0.06em] !text-black !rounded-[6px] !bg-[linear-gradient(135deg,rgb(var(--gold3)_/_0.95),rgb(var(--gold)_/_0.85))] !border-[rgb(var(--gold3)_/_0.9)] !shadow-[0_6px_16px_rgb(var(--gold3)/0.4)] hover:!shadow-[0_10px_24px_rgb(var(--gold3)/0.5)] !before:opacity-0 !after:opacity-0"
                >
                  GO ALPHA
                </Button>
              </nav>
            </div>
          </Container>
        </header>

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
              <div className="py-8 text-small text-muted">
                © {new Date().getFullYear()} HUSTON SOLUTIONS
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
