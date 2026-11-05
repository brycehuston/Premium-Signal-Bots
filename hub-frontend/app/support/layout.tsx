import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Me a Beer — Support FruxLabs",
  description: "Alpha Apps are free. Support independent FruxLabs software development with an optional one-time tip.",
  alternates: { canonical: "/support" },
  openGraph: {
    title: "Buy Me a Beer — Support FruxLabs",
    description: "No ads. No sign-ups. No BS. Totally optional support for free Alpha Apps.",
    url: "/support",
    type: "website",
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
