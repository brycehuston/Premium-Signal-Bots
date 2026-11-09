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

/* Exact original image pixels provide the metal rims and Alpha logo.
 * Remove approximated SVG outlines and fuzzy oval logo masking.
 * The three whole-tile pulse masks and mobile layout are retained. */
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
      aria-label="Three dark metallic Alpha Grind tiles with a subtle gold edge and a visible gold Alpha emblem. One whole tile glows warm gold at a time from top to bottom, then pauses before repeating.">
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
          <linearGradient id="alphaStackGoldCharge" x1=".15" y1="0" x2=".8" y2="1">
            <stop offset="0" stopColor="#ffe1a0" stopOpacity=".29" />
            <stop offset="1" stopColor="#c9882a" stopOpacity=".20" />
          </linearGradient>
          {/* Loose crop around the emblem; the logo itself is never redrawn.
              Its exact original pixels and shading come from the source image. */}
          <clipPath id="alphaOriginalEmblemCrop">
            <path d="M142 129 L195 42 L254 130 Z" />
          </clipPath>
        </defs>
        <image href="/apps/alpha-stack.webp" width="365" height="365"
          className={styles.stackBaseMetal} mask="url(#alphaStackSilhouette)" />
        {/* Matching source pixels supply the exact borders, light catches,
            and emblem instead of freehand gold paths offset from the object. */}
        <image href="/apps/alpha-stack.webp" width="365" height="365"
          className={styles.stackIdleSourceColor} mask="url(#alphaStackSilhouette)" />
        <image href="/apps/alpha-stack.webp" width="365" height="365"
          className={styles.stackIdleLogo} clipPath="url(#alphaOriginalEmblemCrop)" />
        {plates.map((plate) => (
          <g key={plate.id}
            className={`${styles.stackPulsePlate} ${plate.className}`}
            mask={`url(#alphaStackMask-${plate.id})`}>
            <image href="/apps/alpha-stack.webp" width="365" height="365"
              className={styles.stackPulseBright} />
            <path d={plate.shape} fill="url(#alphaStackGoldCharge)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
