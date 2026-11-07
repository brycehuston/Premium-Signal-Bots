import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./apps.module.css";

/**
 * Alpha Apps uses the existing Alpha Alerts header, fonts, container and footer.
 * This local nav adds only software-specific destinations.
 */
export function AppsShell({ active, children }: { active: "intro" | "software"; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <nav className={styles.subnav} aria-label="Alpha Apps sections">
        <Link className={styles.subnavBrand} href="/apps">FRUXLABS <span>/</span> ALPHA APPS</Link>
        <div className={styles.subnavLinks}>
          <Link href="/apps" aria-current={active === "intro" ? "page" : undefined}>Overview</Link>
          <Link href="/apps/software" aria-current={active === "software" ? "page" : undefined}>Software</Link>
          <Link href="/apps/software#upcoming">Upcoming</Link>
        </div>
      </nav>
      {children}
    </div>
  );
}

/* Uses the approved three-tier image rather than recreating the brand mark. */
export function StackArt() {
  return (
    <div className={styles.stackArt} role="img"
      aria-label="The Alpha emblem on three dark metallic layers representing Focus, Vibe and Notes" />
  );
}
