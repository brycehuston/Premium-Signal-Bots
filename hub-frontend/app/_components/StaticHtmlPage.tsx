"use client";

import { useEffect, useRef } from "react";

type StaticHtmlPageProps = {
  src: string;
  phaseId: string;
};

export default function StaticHtmlPage({ src, phaseId }: StaticHtmlPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const injectAttr = `data-phase-inject-${phaseId}`;
    const prevOverflow = document.body.style.overflow;
    const injectedScripts: HTMLScriptElement[] = [];
    const injectedStyles: HTMLStyleElement[] = [];
    let rafId: number | null = null;

    const updatePhaseVh = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--phase-vh", `${height * 0.01}px`);
    };

    const schedulePhaseVhUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePhaseVh);
    };

    const cleanup = () => {
      document.head.querySelectorAll(`[${injectAttr}]`).forEach((node) => node.remove());
      injectedScripts.forEach((script) => script.remove());
      injectedStyles.forEach((style) => style.remove());
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.removeProperty("--phase-vh");
      if (rafId) cancelAnimationFrame(rafId);
      if (containerRef.current) containerRef.current.innerHTML = "";
    };

    const run = async () => {
      const res = await fetch(src, { cache: "no-store" });
      const html = await res.text();
      if (cancelled) return;

      const doc = new DOMParser().parseFromString(html, "text/html");
      const container = containerRef.current;
      if (!container) return;

      cleanup();

      document.body.style.overflow = "hidden";
      updatePhaseVh();

      for (const node of Array.from(doc.head.children)) {
        if (node.tagName === "SCRIPT") continue;
        const clone = node.cloneNode(true) as Element;
        clone.setAttribute(injectAttr, "");
        document.head.appendChild(clone);
      }

      const phaseStyle = document.createElement("style");
      phaseStyle.setAttribute(injectAttr, "");
      phaseStyle.textContent = `
        :root { --phase-vh: 1vh; }
        body { overflow: hidden; }
        .stage { height: calc(var(--phase-vh, 1vh) * 100); }
        .frame { height: calc(var(--phase-vh, 1vh) * 100); }
        @media (max-width: 430px){
          .frame { height: 100%; }
        }
      `;
      document.head.appendChild(phaseStyle);
      injectedStyles.push(phaseStyle);

      for (const node of Array.from(doc.body.children)) {
        if (node.tagName === "SCRIPT") continue;
        container.appendChild(node.cloneNode(true));
      }

      for (const script of Array.from(doc.querySelectorAll("script"))) {
        const injected = document.createElement("script");
        injected.setAttribute(injectAttr, "");
        injected.type = script.type || "text/javascript";
        if (script.src) {
          injected.src = script.src;
          injected.async = script.async;
          injected.defer = script.defer;
        } else {
          injected.text = script.textContent || "";
        }
        document.body.appendChild(injected);
        injectedScripts.push(injected);
      }
    };

    run().catch(() => cleanup());

    schedulePhaseVhUpdate();
    window.addEventListener("resize", schedulePhaseVhUpdate, { passive: true });
    window.addEventListener("orientationchange", schedulePhaseVhUpdate, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", schedulePhaseVhUpdate, { passive: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("resize", schedulePhaseVhUpdate);
      window.removeEventListener("orientationchange", schedulePhaseVhUpdate);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", schedulePhaseVhUpdate);
      }
      cleanup();
    };
  }, [src, phaseId]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "calc(var(--phase-vh, 1vh) * 100)",
        minHeight: "100vh",
        zIndex: 40,
        background: "#000",
        overflow: "hidden",
      }}
    />
  );
}
