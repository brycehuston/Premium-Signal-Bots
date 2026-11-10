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

/* Source-corrected complete Alpha Grind stack.
 * The original approved logo and all three metallic plates are preserved.
 * The asset is transparent with deliberate edge padding, so no tile is cropped.
 * Only illumination changes; no reconstructed shapes, labels or trims. */
export function StackArt() {
  const top = "M167 39 L178 41 L289 94 L300 99 L304 104 L303 124 L297 134 L177 181 L168 184 L156 180 L59 139 L54 130 L53 108 L55 100 L61 95 Z";
  const middle = "M166 137 L175 137 L291 168 L300 170 L304 177 L303 195 L299 205 L178 248 L168 254 L157 251 L59 214 L54 204 L53 183 L55 173 L62 169 Z";
  const bottom = "M165 227 L176 226 L291 240 L300 243 L304 248 L303 274 L299 285 L175 314 L166 318 L156 315 L59 282 L54 274 L53 250 L55 245 L63 242 Z";
  const plates = [
    { id: "top", shape: top, className: styles.stackPulseTop, front: [] },
    { id: "middle", shape: middle, className: styles.stackPulseMiddle, front: [top] },
    { id: "bottom", shape: bottom, className: styles.stackPulseBottom, front: [top, middle] },
  ];
  const src = "/apps/alpha-grind-stack-complete.avif";
  return (
    <div className={styles.stackArt} role="img"
      aria-label="Three complete, parallel charcoal and gold Alpha Grind tiles with a centered Alpha emblem, illuminating one at a time from top to bottom.">
      <svg className={styles.stackPulseOverlay} viewBox="0 0 335 370"
        preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <defs>
          {plates.map((plate) => (
            <mask id={"alphaStackComplete-" + plate.id} key={plate.id}
              maskUnits="userSpaceOnUse" x="0" y="0" width="335" height="370">
              <rect width="335" height="370" fill="black" />
              <path d={plate.shape} fill="white" />
              {plate.front.map((shape, i) => <path key={i} d={shape} fill="black" />)}
            </mask>
          ))}
          <radialGradient id="alphaStackCompleteWarm">
            <stop offset="0" stopColor="#ffe3a0" stopOpacity=".22" />
            <stop offset="1" stopColor="#cd8a30" stopOpacity=".07" />
          </radialGradient>
        </defs>
        <image href={src} width="335" height="370" />
        {plates.map((plate) => (
          <g key={plate.id} className={styles.stackPulsePlate + " " + plate.className}
             mask={"url(#alphaStackComplete-" + plate.id + ")"}>
            <image href={src} width="335" height="370" className={styles.stackPulseBright} />
            <path d={plate.shape} fill="url(#alphaStackCompleteWarm)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
