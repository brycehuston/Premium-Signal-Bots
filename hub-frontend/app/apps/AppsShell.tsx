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
          d="M47 121 L47 132 Q47 143 62 149 L178 201 Q187 207 199 201 L345 140 L345 121" />
        <path className={`${styles.stackPulseTrace} ${styles.stackPulseMiddle}`}
          d="M47 190 L47 212 Q47 221 61 228 L178 270 Q189 275 201 270 L345 218 L345 191" />
        <path className={`${styles.stackPulseTrace} ${styles.stackPulseBottom}`}
          d="M47 264 L47 296 Q48 305 62 311 L179 350 Q188 356 201 351 L345 300 L345 269" />
      </svg>
    </div>
  );
}
