import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./apps.module.css";

export function AlphaMark({ size = 36 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="alpha-mark-metal" x1="8" y1="5" x2="56" y2="59">
          <stop stopColor="#FFF0B7" /><stop offset=".44" stopColor="#F5C45F" />
          <stop offset=".77" stopColor="#AE722B" /><stop offset="1" stopColor="#F2BE55" />
        </linearGradient>
      </defs>
      <path d="M31.6 4 4 56h13.3L31.6 29l15.2 27H60L31.6 4Z" fill="url(#alpha-mark-metal)" />
      <path d="M31.9 37 22 56h22.5L31.9 37Zm1.3 8.5L36.4 51h-6.2l3-5.5Z" fill="url(#alpha-mark-metal)" fillRule="evenodd" />
    </svg>
  );
}

export function AppsShell({ active, children }: { active: "intro" | "software"; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/apps" aria-label="Alpha Alerts, Alpha Apps home">
          <AlphaMark size={38} /><span>ALPHA <b>ALERTS</b></span>
        </Link>
        <nav className={styles.nav} aria-label="Alpha Apps">
          <Link href="/">Overview</Link>
          <Link aria-current={active === "intro" ? "page" : undefined} href="/apps">Alpha Apps</Link>
          <Link aria-current={active === "software" ? "page" : undefined} href="/apps/software">Software</Link>
          <Link href="/apps/software#upcoming">Releases</Link>
          <Link href="/contact">Support</Link>
        </nav>
        <Link className={styles.topAction} href="/pricing">Get Alpha Alerts</Link>
      </header>
      {children}
      <footer className={styles.footer}>
        <span>© FRUXLABS</span>
        <span>ALPHA APPS <i /> FOCUS · VIBE · NOTES</span>
        <Link href="/">ALPHA ALERTS</Link>
      </footer>
    </div>
  );
}

export function GoldWaves() {
  return (
    <svg className={styles.waves} viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="wave-gold" x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="#D69734" stopOpacity="0" /><stop offset=".19" stopColor="#DBA044" stopOpacity=".48" />
          <stop offset=".47" stopColor="#F9CF6C" stopOpacity=".96" /><stop offset=".75" stopColor="#D39738" stopOpacity=".62" />
          <stop offset="1" stopColor="#A56A23" stopOpacity="0"/>
        </linearGradient>
        <filter id="wave-glow" x="-30%" width="160%" y="-80%" height="260%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {Array.from({ length: 13 }, (_, i) => {
        const y = 70 + i * 6;
        return <path key={i} d={`M -50 ${y} C 190 ${y + 100} 265 ${y - 60} 490 ${y + 13} S 810 ${y + 102} 1000 ${y + 22} S 1330 ${y - 24} 1490 ${y + 34}`}
          fill="none" stroke="url(#wave-gold)" strokeWidth={i === 0 ? 1.4 : .6} opacity={.8 - i * .041}/>;
      })}
      <path d="M -30 88 C 195 167 303 35 504 103 S 800 181 1002 102 S 1340 54 1470 118"
        fill="none" stroke="#F5C65D" strokeWidth="3" filter="url(#wave-glow)" opacity=".68" />
    </svg>
  );
}

export function StackArt() {
  return (
    <svg className={styles.stackArt} role="img" aria-label="Alpha emblem centered on three metallic layers representing Focus, Vibe, and Notes"
      viewBox="0 0 560 490" fill="none">
      <defs>
        <radialGradient id="stack-back" cx="50%" cy="48%" r="52%">
          <stop stopColor="#C68436" stopOpacity=".29" /><stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="top-plate" x1="55" y1="115" x2="495" y2="365">
          <stop stopColor="#35404A" /><stop offset=".36" stopColor="#0E151B"/>
          <stop offset=".72" stopColor="#08121B"/><stop offset="1" stopColor="#20394C"/>
        </linearGradient>
        <linearGradient id="edge-plate" x1="80" y1="0" x2="475" y2="0">
          <stop stopColor="#D3A357"/><stop offset=".48" stopColor="#F9CC66"/><stop offset="1" stopColor="#0395B2"/>
        </linearGradient>
        <linearGradient id="logo-metal" x1="230" y1="117" x2="370" y2="215">
          <stop stopColor="#FFF3B8"/><stop offset=".3" stopColor="#F8CC68"/><stop offset=".61" stopColor="#B8782D"/><stop offset="1" stopColor="#F0B74F"/>
        </linearGradient>
        <filter id="stack-glow" x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="9"/>
        </filter>
        <filter id="stack-shadow" x="-30%" y="-40%" width="160%" height="200%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000" floodOpacity=".83" />
        </filter>
      </defs>
      <ellipse cx="280" cy="250" rx="270" ry="240" fill="url(#stack-back)"/>
      {[{y:290},{y:212},{y:135}].map(({y},i) => {
        const p=`80,${y+58} 277,${y-31} 478,${y+59} 279,${y+148}`;
        return (
          <g key={i} filter="url(#stack-shadow)">
            <path d={`M80 ${y+60} L278 ${y+150} L478 ${y+62} L478 ${y+81} L278 ${y+169} L80 ${y+78}Z`}
              fill="#101215" stroke="url(#edge-plate)" strokeWidth="2" />
            <polygon points={p} fill="url(#top-plate)" stroke="url(#edge-plate)" strokeWidth="1.7" strokeLinejoin="round"/>
            <path d={`M80 ${y+59} L278 ${y+148} L478 ${y+59}`} stroke="#FFD270" strokeWidth="4" opacity=".75" filter="url(#stack-glow)" />
            <path d={`M80 ${y+59} L278 ${y+148} L478 ${y+59}`} stroke="url(#edge-plate)" strokeWidth="1.8" opacity=".85" />
          </g>
        );
      })}
      <g transform="translate(280 195)" filter="url(#stack-shadow)">
        <path d="M0 -57 L-64 45 H-34 L0 -12 L35 45 H65 Z" fill="url(#logo-metal)"/>
        <path d="M-1 5 L-28 45 H26 L-1 5 Z" fill="url(#logo-metal)"/>
        <path d="M-1 17 L7 31 H-10 Z" fill="#11171C"/>
        <path d="M0 -57 L-34 45" stroke="#FFF4C2" strokeWidth="2" opacity=".7"/>
      </g>
    </svg>
  );
}
