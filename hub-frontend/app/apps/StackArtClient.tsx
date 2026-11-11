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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }

    // The entrance starts only after both the page has finished loading and
    // the hero has remained in view for 4.2 seconds. Hidden tabs never consume
    // the delay; unmount or scroll-away cancels the pending entrance.
    let active = true;
    let inView = typeof IntersectionObserver === "undefined";
    let loaded = document.readyState === "complete";
    let assetsReady = false;
    // Keep the original 4.2s first-look pause on desktop; scrolling users on
    // smaller screens should not encounter a blank visual for that long.
    const holdMs = window.innerWidth <= 650 ? 1000 : window.innerWidth <= 880 ? 2300 : 4200;
    let timer: number | undefined;
    let observer: IntersectionObserver | null = null;
    const schedule = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      if (!active || !loaded || !assetsReady || !inView || document.visibilityState !== "visible") return;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (!active || !inView || document.visibilityState !== "visible") return;
        setEntered(true);
        observer?.disconnect();
        document.removeEventListener("visibilitychange", schedule);
        window.removeEventListener("load", markLoaded);
      }, holdMs);
    };
    const markLoaded = () => {
      loaded = true;
      schedule();
    };
    if (!loaded) window.addEventListener("load", markLoaded);
    // A tile must be decoded before its entrance begins. The same URLs are
    // consumed by the SVG image layers, so the decoded images are cacheable.
    Promise.all(plates.map(({ source }) => new Promise<void>((resolve) => {
      const image = new window.Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = source;
      if (image.complete) resolve();
    }))).then(() => {
      if (!active) return;
      assetsReady = true;
      schedule();
    });
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (inView !== visible) {
          inView = visible;
          schedule();
        }
      }, { threshold: 0.12 });
      observer.observe(node);
    }
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("load", markLoaded);
    };
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
        viewBox="20 8 314 338"
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