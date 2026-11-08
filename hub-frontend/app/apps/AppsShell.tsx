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
        <defs>
          <linearGradient id="alphaFaceLight" x1="0" x2="0.8" y1="0" y2="1">
            <stop stopColor="#ffe3a1" stopOpacity=".36" />
            <stop offset=".6" stopColor="#ffc66b" stopOpacity=".22" />
            <stop offset="1" stopColor="#c99042" stopOpacity=".16" />
          </linearGradient>
          <linearGradient id="alphaSideLight" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#ffca75" stopOpacity=".28" />
            <stop offset="1" stopColor="#cf8f3e" stopOpacity=".22" />
          </linearGradient>
          <mask id="alphaMiddleVisible" maskUnits="userSpaceOnUse">
            <rect width="365" height="365" fill="white" />
            <path fill="black" d="M43 103 Q43 94 54 90 L185 30 Q196 25 206 30 L343 91 Q353 95 353 105 L353 118 Q353 127 343 133 L209 193 Q198 200 185 192 L54 132 Q43 127 43 119Z" />
          </mask>
          <mask id="alphaBottomVisible" maskUnits="userSpaceOnUse">
            <rect width="365" height="365" fill="white" />
            <path fill="black" d="M43 103 Q43 94 54 90 L185 30 Q196 25 206 30 L343 91 Q353 95 353 105 L353 118 Q353 127 343 133 L209 193 Q198 200 185 192 L54 132 Q43 127 43 119Z" />
            <path fill="black" d="M43 184 Q43 177 54 172 L185 116 Q198 109 210 117 L343 173 Q353 178 353 186 L353 206 Q353 216 343 221 L209 273 Q198 280 185 273 L54 220 Q43 215 43 207Z" />
          </mask>
        </defs>
        <g className={`${styles.stackPulsePlate} ${styles.stackPulseTop}`}>
          <path className={styles.stackPulseFace} d="M43 102 Q43 94 54 90 L185 30 Q196 25 206 30 L343 91 Q353 95 353 105 L209 170 Q198 178 186 172 L52 117 Q43 113 43 102Z" />
          <path className={styles.stackPulseSide} d="M43 109 L44 120 Q44 127 56 133 L185 191 Q198 199 209 192 L342 132 Q352 127 353 113 L352 104 L207 175 Q197 182 186 178 L55 119Z" />
          <path className={styles.stackPulseEdge} d="M44 114 L184 178 Q197 186 210 179 L352 111 M44 121 L185 193 Q197 200 210 193 L352 121" />
        </g>
        <g className={`${styles.stackPulsePlate} ${styles.stackPulseMiddle}`} mask="url(#alphaMiddleVisible)">
          <path className={styles.stackPulseFace} d="M43 188 Q43 182 52 177 L183 117 Q198 109 212 118 L342 176 Q353 180 353 189 L207 251 Q198 258 185 252 L52 199 Q43 197 43 188Z" />
          <path className={styles.stackPulseSide} d="M43 191 L43 207 Q43 216 54 220 L186 271 Q198 278 210 272 L342 219 Q352 215 353 205 L353 187 L207 254 Q198 261 185 255 L54 203Z" />
          <path className={styles.stackPulseEdge} d="M44 199 L184 253 Q197 261 210 253 L352 193 M44 211 L186 274 Q199 280 210 273 L352 207" />
        </g>
        <g className={`${styles.stackPulsePlate} ${styles.stackPulseBottom}`} mask="url(#alphaBottomVisible)">
          <path className={styles.stackPulseFace} d="M43 267 Q43 258 54 255 L184 192 Q197 187 210 192 L343 254 Q353 259 353 265 L208 329 Q198 335 186 330 L52 278 Q43 276 43 267Z" />
          <path className={styles.stackPulseSide} d="M43 270 L43 290 Q43 298 54 304 L185 348 Q198 354 210 348 L343 300 Q353 296 353 286 L353 264 L208 330 Q198 339 186 333 L54 280Z" />
          <path className={styles.stackPulseEdge} d="M43 279 L185 332 Q198 339 210 332 L353 275 M43 291 L185 351 Q198 358 211 352 L353 291" />
        </g>
      </svg>
    </div>
  );
}
