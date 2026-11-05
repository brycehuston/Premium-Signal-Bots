import type { Metadata } from "next";
import Link from "next/link";
import { AppsShell, StackArt } from "./AppsShell";
import styles from "./apps.module.css";

export const metadata: Metadata = {
  title: "Alpha Apps — Focus, Vibe & Notes",
  description: "Alpha Grind brings Focus, Vibe and Notes together: three local-first Windows tools made for getting things done.",
  alternates: { canonical: "/apps" },
  openGraph: {
    title: "Alpha Apps | Alpha Grind by FruxLabs",
    description: "Three focused tools for time, music and ideas.",
    url: "/apps",
    type: "website",
  },
};

export default function AppsWelcome() {
  return (
    <AppsShell active="intro">
      <section className={styles.hero} aria-labelledby="apps-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span aria-hidden="true" /> THE ALPHA ECOSYSTEM</p>
          <h1 id="apps-title" className={styles.heroTitle}>
            BUILD. FOCUS.<br />
            CREATE. <span>EXECUTE.</span>
          </h1>
          <p className={styles.heroDescription}>
            Meet Alpha Grind. Three purpose-built tools for focused sessions,
            immersive sound and ideas worth keeping.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/apps/software">
              Explore Alpha Software <span aria-hidden="true">→</span>
            </Link>
            <span className={styles.heroMeta}>FOCUS <i /> VIBE <i /> NOTES</span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <StackArt />
          <div className={styles.visualCaption}>ALPHA GRIND <span> / </span> THREE TOOLS. ONE WORKSPACE.</div>
        </div>
      </section>
      <div className={styles.valueRow} aria-label="Software principles">
        <span>LOCAL-FIRST</span>
        <span>NO ADS. NO SIGN-UPS.</span>
        <span>BUILT FOR REAL WORK</span>
      </div>
    </AppsShell>
  );
}
