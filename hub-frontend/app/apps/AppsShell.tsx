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

/* Original Alpha Grind artwork is rendered unchanged, but clipped to the
 * actual 3D silhouette so its baked rectangular image background disappears.
 * Exactly one plate lights up per beat; never duplicate a visible tile. */
export function StackArt() {
  const top = "M43 103 Q43 94 54 90 L185 30 Q196 25 206 30 L343 91 Q353 95 353 105 L353 118 Q353 127 343 133 L209 193 Q198 200 185 192 L54 132 Q43 127 43 119Z";
  const middle = "M43 184 Q43 177 54 172 L185 116 Q198 109 210 117 L343 173 Q353 178 353 186 L353 206 Q353 216 343 221 L209 273 Q198 280 185 273 L54 220 Q43 215 43 207Z";
  const bottom = "M43 263 Q43 254 54 251 L185 190 Q197 186 211 190 L343 251 Q353 255 353 264 L353 290 Q353 298 343 303 L210 350 Q198 357 185 351 L54 306 Q43 300 43 291Z";
  const plates = [
    { id: "top", shape: top, face: "M43 102 Q43 94 54 90 L185 30 Q196 25 206 30 L343 91 Q353 95 353 105 L209 170 Q198 178 186 172 L52 117 Q43 113 43 102Z", edge: "M44 114 L184 178 Q197 186 210 179 L352 111 M44 121 L185 193 Q197 200 210 193 L352 121", className: styles.stackPulseTop, occludedBy: [] },
    { id: "middle", shape: middle, face: "M43 188 Q43 182 52 177 L183 117 Q198 109 212 118 L342 176 Q353 180 353 189 L207 251 Q198 258 185 252 L52 199 Q43 197 43 188Z", edge: "M44 199 L184 253 Q197 261 210 253 L352 193 M44 211 L186 274 Q199 280 210 273 L352 207", className: styles.stackPulseMiddle, occludedBy: [top] },
    { id: "bottom", shape: bottom, face: "M43 267 Q43 258 54 255 L184 192 Q197 187 210 192 L343 254 Q353 259 353 265 L208 329 Q198 335 186 330 L52 278 Q43 276 43 267Z", edge: "M43 279 L185 332 Q198 339 210 332 L353 275 M43 291 L185 351 Q198 358 211 352 L353 291", className: styles.stackPulseBottom, occludedBy: [top, middle] }
  ];
  return (
    <div className={styles.stackArt} role="img"
      aria-label="Alpha Grind emblem on three floating metallic tiles. A single smooth gold pulse lights each tile, top to bottom, once every ten seconds.">
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
          <linearGradient id="alphaStackWarmGlow" x1="0" y1="0" x2=".4" y2="1">
            <stop stopColor="#ffe2a7" stopOpacity=".22" />
            <stop offset="1" stopColor="#d89c44" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <image href="/apps/alpha-stack.webp" x="0" y="0" width="365" height="365"
          mask="url(#alphaStackSilhouette)" />
        {plates.map((plate) => (
          <g key={plate.id}
            className={`${styles.stackPulsePlate} ${plate.className}`}
            mask={`url(#alphaStackMask-${plate.id})`}>
            <image href="/apps/alpha-stack.webp" width="365" height="365"
              className={styles.stackPulseBright} />
            <path d={plate.face} fill="url(#alphaStackWarmGlow)" />
            <path d={plate.edge} className={styles.stackPulseEdge} />
          </g>
        ))}
      </svg>
    </div>
  );
}
