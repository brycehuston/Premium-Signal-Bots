"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** The Apps and Support pages provide their own navigation and footer. */
export default function HideOnStandalone({children}:{children:ReactNode}) {
  const path=usePathname();
  if(path==="/support"||path?.startsWith("/support/")||path==="/apps"||path?.startsWith("/apps/"))return null;
  return <>{children}</>;
}
