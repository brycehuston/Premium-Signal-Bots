"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Suppress trading-only chrome on the shared FruxLabs app-support page. */
export default function HideOnSupport({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/support" || pathname?.startsWith("/support/")) {
    return null;
  }
  return <>{children}</>;
}
