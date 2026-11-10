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

/* Exact Alpha Grind tiles isolated from the approved user-supplied reference.
 * Three parallel metallic plates with their actual perspective-aligned A emblem.
 * Source image is never reconstructed or covered by hand-drawn border/logo layers.
 * Native SVG masks only control the per-plate illumination. */
export function StackArt() {
  const top = "M 42 99 C 41 92 45 87 53 83 L 194 29 Q 207 21 222 27 L 364 80 Q 374 86 373 97 L 373 116 Q 372 125 365 130 L 221 178 Q 203 185 191 179 L 52 129 Q 42 125 42 117 Z";
  const middle = "M 42 179 Q 40 173 53 167 L 192 113 Q 205 106 219 115 L 364 166 Q 374 172 373 180 L 373 201 Q 371 211 364 217 L 219 269 Q 203 275 191 268 L 53 216 Q 42 210 42 201 Z";
  const bottom = "M 42 266 Q 40 257 53 251 L 190 198 Q 205 193 219 199 L 364 251 Q 373 257 373 269 L 372 289 Q 371 299 363 304 L 219 365 Q 204 369 191 365 L 53 306 Q 42 300 42 288 Z";
  const plates = [
    { id: "top", shape: top, className: styles.stackPulseTop, front: [] },
    { id: "middle", shape: middle, className: styles.stackPulseMiddle, front: [top] },
    { id: "bottom", shape: bottom, className: styles.stackPulseBottom, front: [top, middle] },
  ];
  const src = "/apps/alpha-grind-reference-stack.avif";
  return (
    <div className={styles.stackArt} role="img"
      aria-label="Three identical parallel charcoal-and-gold Alpha Grind tiles with a correctly integrated Alpha emblem. Each tile glows from top to bottom in a slow cinematic sequence.">
      <svg className={styles.stackPulseOverlay} viewBox="0 0 420 402"
        preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <defs>
          {plates.map(plate => (
            <mask id={"alphaTilePulse-" + plate.id} key={plate.id}
              maskUnits="userSpaceOnUse" x="0" y="0" width="420" height="402">
              <rect width="420" height="402" fill="#000" />
              <path d={plate.shape} fill="#fff" />
              {plate.front.map((shape, i) => <path d={shape} fill="#000" key={i} />)}
            </mask>
          ))}
          <radialGradient id="alphaTileWarmth">
            <stop offset="0" stopColor="#ffe5a0" stopOpacity=".40" />
            <stop offset=".8" stopColor="#eab75e" stopOpacity=".22" />
            <stop offset="1" stopColor="#a36e28" stopOpacity=".05" />
          </radialGradient>
        </defs>
        <image href={src} width="420" height="402" />
        {plates.map(plate => (
          <g key={plate.id} className={styles.stackPulsePlate + " " + plate.className}
            mask={"url(#alphaTilePulse-" + plate.id + ")"}>
            <image href={src} width="420" height="402" className={styles.stackPulseBright} />
            <path d={plate.shape} fill="url(#alphaTileWarmth)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
