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

/* Preserve the original Alpha Grind artwork and golden A emblem.
 * The metallic plates are desaturated to dark graphite, removing the baked
 * gold-trim treatment without changing the image or duplicating its silhouette.
 * A softly overlapping, neutral illumination travels top to bottom. */
export function StackArt() {
  const top = "M43 103 Q43 94 54 90 L185 30 Q196 25 206 30 L343 91 Q353 95 353 105 L353 118 Q353 127 343 133 L209 193 Q198 200 185 192 L54 132 Q43 127 43 119Z";
  const middle = "M43 184 Q43 177 54 172 L185 116 Q198 109 210 117 L343 173 Q353 178 353 186 L353 206 Q353 216 343 221 L209 273 Q198 280 185 273 L54 220 Q43 215 43 207Z";
  const bottom = "M43 263 Q43 254 54 251 L185 190 Q197 186 211 190 L343 251 Q353 255 353 264 L353 290 Q353 298 343 303 L210 350 Q198 357 185 351 L54 306 Q43 300 43 291Z";
  const plates = [
    { id: "top", shape: top, className: styles.stackPulseTop, occludedBy: [] },
    { id: "middle", shape: middle, className: styles.stackPulseMiddle, occludedBy: [top] },
    { id: "bottom", shape: bottom, className: styles.stackPulseBottom, occludedBy: [top, middle] },
  ];
  return (
    <div className={styles.stackArt} role="img"
      aria-label="Three floating dark metallic Alpha Grind tiles with a gold Alpha emblem. A soft white pulse illuminates each tile from top to bottom every ten seconds.">
      <svg className={styles.stackPulseOverlay} aria-hidden="true" focusable="false"
        viewBox="0 0 365 365" preserveAspectRatio="xMidYMid meet">
        <defs>
          <mask id="alphaStackSilhouette" maskUnits="userSpaceOnUse">
            <rect width="365" height="365" fill="black" />
            {plates.map((plate) => <path key={plate.id} d={plate.shape} fill="white" />)}
          </mask>
          {plates.map((plate) => (
            <mask key={plate.id} id={`alphaStackMask-${plate.id}`} maskUnits="userSpaceOnUse">
              <rect width="365" height="365" fill="black" />
              <path d={plate.shape} fill="white" />
              {plate.occludedBy.map((shape, i) => <path key={i} d={shape} fill="black" />)}
            </mask>
          ))}
          <radialGradient id="alphaLogoReveal" cx="50%" cy="50%" r="50%">
            <stop offset="48%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id="alphaLogoOnly" maskUnits="userSpaceOnUse">
            <rect width="365" height="365" fill="black" />
            <ellipse cx="195" cy="92" rx="65" ry="56" fill="url(#alphaLogoReveal)" />
          </mask>
        </defs>
        <image href="/apps/alpha-stack.webp" width="365" height="365"
          className={styles.stackBaseMetal} mask="url(#alphaStackSilhouette)" />
        <image href="/apps/alpha-stack.webp" width="365" height="365"
          mask="url(#alphaLogoOnly)" />
        {plates.map((plate) => (
          <g key={plate.id}
            className={`${styles.stackPulsePlate} ${plate.className}`}
            mask={`url(#alphaStackMask-${plate.id})`}>
            <image href="/apps/alpha-stack.webp" width="365" height="365"
              className={styles.stackPulseBright} />
          </g>
        ))}
      </svg>
    </div>
  );
}
