"use client";
/* eslint-disable @next/next/no-img-element -- static fallback for users without JavaScript */

import { useEffect, useRef, useState } from "react";
import styles from "./apps.module.css";

/** Three unbroken matching metallic plates source-aligned to the approved Alpha artwork. The top-only logo is preserved. */
const plates = [
  { name: "bottom", source: "/apps/alpha-stack-v2-bottom.webp", drop: styles.stackAssemblyBottom, pulse: styles.stackPulseBottom },
  { name: "middle", source: "/apps/alpha-stack-v2-middle.webp", drop: styles.stackAssemblyMiddle, pulse: styles.stackPulseMiddle },
  { name: "top", source: "/apps/alpha-stack-v2-top.webp", drop: styles.stackAssemblyTop, pulse: styles.stackPulseTop },
] as const;

export function StackArtClient() {
  const root = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={root}
      className={styles.stackArt}
      data-entered={entered ? "true" : "false"}
      role="img"
      aria-label="Three parallel charcoal and gold Alpha Grind plates assemble bottom first, middle second and Alpha-logo top last, then illuminate from top to bottom."
    >
      <svg
        className={styles.stackPulseOverlay}
        viewBox="39 26 280 299"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="alphaGrindFloorGlow">
            <stop offset="0" stopColor="#d5a054" stopOpacity=".19" />
            <stop offset=".6" stopColor="#9b723f" stopOpacity=".07" />
            <stop offset="1" stopColor="#9b723f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="alphaGrindTileGold" cx="50%" cy="45%" r="70%">
            <stop offset="0" stopColor="#ffe2a2" stopOpacity=".35" />
            <stop offset=".68" stopColor="#d9a34c" stopOpacity=".16" />
            <stop offset="1" stopColor="#bb7f2f" stopOpacity=".03" />
          </radialGradient>
          {plates.map((plate) => (
            <mask
              key={plate.name}
              id={"alphaGrindPlateMask-" + plate.name}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              className={styles.stackImageAlphaMask}
              x="0" y="0" width="335" height="370"
            >
              <image href={plate.source} width="335" height="370" />
            </mask>
          ))}
        </defs>
        <ellipse
          className={styles.stackGroundShadow}
          cx="169" cy="310" rx="100" ry="19"
          fill="url(#alphaGrindFloorGlow)"
        />
        {plates.map((plate) => (
          <g key={plate.name} className={styles.stackAssemblyLayer + " " + plate.drop}>
            <image
              href={plate.source}
              x="0" y="0" width="335" height="370"
              className={styles.stackBaseTile}
            />
            <g
              className={styles.stackPulsePlate + " " + plate.pulse}
              mask={"url(#alphaGrindPlateMask-" + plate.name + ")"}
            >
              <image
                href={plate.source}
                x="0" y="0" width="335" height="370"
                className={styles.stackPulseBright}
              />
              <rect x="0" y="0" width="335" height="370" fill="url(#alphaGrindTileGold)" />
            </g>
          </g>
        ))}
      </svg>
      <noscript>
        <img
          src="/apps/alpha-stack-v2-assembled.webp"
          alt="Alpha Grind three-tile metallic stack"
          className={styles.stackFallbackImage}
        />
      </noscript>
    </div>
  );
}