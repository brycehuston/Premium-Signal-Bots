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
      <svg className={styles.stackPulseOverlay} aria-hidden="true" focusable="false"
        viewBox="0 0 365 365" preserveAspectRatio="xMidYMid meet">
        <path className={`${styles.stackPulseTrace} ${styles.stackPulseTop}`}
          d="M47 132 L184 193 Q196 200 207 193 L345 133" />
        <path className={`${styles.stackPulseTrace} ${styles.stackPulseMiddle}`}
          d="M47 207 L184 272 Q196 279 207 272 L345 207" />
        <path className={`${styles.stackPulseTrace} ${styles.stackPulseBottom}`}
          d="M47 276 L184 346 Q196 354 207 347 L345 276" />
      </svg>
    </div>
  );
}
