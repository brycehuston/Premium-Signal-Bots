import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Me a Beer — Support FruxLabs",
  description: "Get help with Alpha software or optionally support independent FruxLabs development with a one-time tip.",
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
