"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Keeps the established trading layout untouched outside /apps. */
export default function HideOnApps({ children }: { children: ReactNode }) {
  const path = usePathname();
  return path === "/apps" || path?.startsWith("/apps/") ? null : <>{children}</>;
}
