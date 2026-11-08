import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./apps.module.css";

/**
 * FruxLabs Software uses the existing Alpha Alerts brand shell and routes.
 * Product names and established /apps URLs remain unchanged.
 */
export function AppsShell({ active, children }: { active: "intro" | "software"; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <nav className={styles.subnav} aria-label="FruxLabs Software sections">
        <Link className={styles.subnavBrand} href="/">ALPHA ALERTS <span>/</span> FRUXLABS SOFTWARE</Link>
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
      aria-label="The Alpha emblem on three dark metallic layers representing Focus, Vibe and Notes. The layers pulse once each from top to bottom approximately every ten seconds.">
      <span aria-hidden="true" className={`${styles.stackPulse} ${styles.stackPulseTop}`} />
      <span aria-hidden="true" className={`${styles.stackPulse} ${styles.stackPulseMiddle}`} />
      <span aria-hidden="true" className={`${styles.stackPulse} ${styles.stackPulseBottom}`} />
    </div>
  );
}
