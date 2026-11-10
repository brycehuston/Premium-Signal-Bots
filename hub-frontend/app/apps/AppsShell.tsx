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

/* Approved Alpha Grind stack, cropped from the user-selected mockup.
 * Exactly the original rotated Alpha emblem; no reconstructed logo or fake rims.
 * Render the source image at rest and animate illuminated copies behind per-plate
 * clipping masks. Masks have NO stroke and never change the object silhouette. */
export function StackArt() {
  const top = "M76 103 Q76 94 91 88 L185 57 Q199 50 211 56 L318 95 Q334 103 333 114 L333 133 Q329 141 316 147 L211 178 Q198 182 186 176 L91 148 Q76 143 76 133 Z";
  const middle = "M77 172 Q78 164 92 157 L187 122 Q199 119 211 123 L319 161 Q333 167 333 180 L333 201 Q332 211 316 216 L211 246 Q199 250 186 245 L90 216 Q77 211 77 198 Z";
  const bottom = "M77 240 Q78 233 93 227 L188 192 Q200 188 213 193 L318 230 Q332 236 332 248 L333 269 Q331 278 315 284 L210 311 Q197 317 185 311 L89 284 Q77 279 77 265 Z";
  const plates = [
    { id: "top", outline: top, className: styles.stackPulseTop, front: [] },
    { id: "middle", outline: middle, className: styles.stackPulseMiddle, front: [top] },
    { id: "bottom", outline: bottom, className: styles.stackPulseBottom, front: [top, middle] },
  ];
  const src = "/apps/alpha-grind-approved-stack.webp";
  return (
    <div className={styles.stackArt} role="img"
      aria-label="Three aligned metallic Alpha Grind tiles with the approved rotated gold Alpha logo. Each plate gently illuminates top to bottom, then pauses before repeating.">
      <svg className={styles.stackPulseOverlay} viewBox="0 0 365 363"
        preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <defs>
          {plates.map(plate => (
            <mask id={"alphaTilePulse-" + plate.id} key={plate.id}
              maskUnits="userSpaceOnUse" x="0" y="0" width="365" height="363">
              <rect width="365" height="363" fill="#000" />
              <path d={plate.outline} fill="#fff" />
              {plate.front.map((outline, i) => <path d={outline} fill="#000" key={i} />)}
            </mask>
          ))}
          <radialGradient id="alphaTileWarmth">
            <stop offset="0" stopColor="#ffe9ae" stopOpacity=".38" />
            <stop offset=".8" stopColor="#e9aa45" stopOpacity=".16" />
            <stop offset="1" stopColor="#a76b24" stopOpacity=".04" />
          </radialGradient>
        </defs>
        <image href={src} width="365" height="363" />
        {plates.map(plate => (
          <g key={plate.id} className={styles.stackPulsePlate + " " + plate.className}
            mask={"url(#alphaTilePulse-" + plate.id + ")"}>
            <image href={src} width="365" height="363" className={styles.stackPulseBright} />
            <path d={plate.outline} fill="url(#alphaTileWarmth)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
