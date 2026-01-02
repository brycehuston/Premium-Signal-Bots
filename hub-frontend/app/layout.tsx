// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import Link from "next/link";
import Script from "next/script";
import React from "react";
import BottomTickerBar from "@/components/BottomTickerBar";

const inter = Inter({ subsets: ["latin"] });
const BRAND = process.env.NEXT_PUBLIC_BRAND || "AlphaAlerts";

export const metadata: Metadata = {
  title: `${BRAND} — Pro`,
  description: "Latency-optimized crypto signals, smart alerts, and bot control.",

  // ✅ FAVICON (App Router way)
  // Make sure favicon.ico exists at: /app/favicon.ico
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-bg text-neutral-100 antialiased">
        {/* decorative bg layers */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute -top-40 right-10 h-[32rem] w-[32rem] rounded-full bg-brand-600/15 blur-[120px]" />
          <div className="absolute bottom-0 left-10 h-[24rem] w-[24rem] rounded-full bg-[#a78bfa]/10 blur-[100px]" />
        </div>

        <Toaster richColors position="top-center" />

        {/* navbar */}
        <header className="sticky top-0 z-30 border-b border-edge/70 bg-bg/70 backdrop-blur">
          <Container>
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="font-semibold tracking-tight">
                <span className="text-white">{BRAND}</span>
                <span className="ml-1 text-white/50">— Pro</span>
              </Link>

              <nav className="flex items-center gap-1.5">
                <Link
                  className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                  href="/pricing"
                >
                  Pricing
                </Link>
                <Link
                  className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                  href="/billing"
                >
                  Billing
                </Link>
                <Link
                  className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                  href="/login"
                >
                  Login
                </Link>
              </nav>
            </div>
          </Container>
        </header>

        {/* 
          IMPORTANT:
          - pb-16 reserves space for the fixed BottomTickerBar
          - Without this, the last part of your pages will be hidden behind the bar
        */}
        <div className="pb-16">
          <main className="py-10">
            <Container>{children}</Container>
          </main>

          <footer className="mt-14 border-t border-edge/70">
            <Container>
              <div className="py-8 text-sm text-white/50">
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

        {/* Google Identity Services */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
