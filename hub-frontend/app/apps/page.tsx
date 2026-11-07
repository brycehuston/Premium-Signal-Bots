import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
      <section className={styles.lockIn} aria-labelledby="lock-in-title">
        <div>
          <p className={styles.eyebrow}>ALPHA GRIND / THE LOCK-IN MINDSET</p>
          <h2 id="lock-in-title">The work starts <span>before the opportunity.</span></h2>
          <p>Markets move. Projects evolve. Your next opportunity may arrive when you least expect it. Build the routine now: protect your attention, set your atmosphere and keep your ideas organized. Alpha Grind is made for traders, builders, students and anyone ready to get meaningful work done.</p>
        </div>
        <div className={styles.lockInAside}>
          <strong>LOCK IN.<br />STAY READY.<br />GO ALPHA.</strong>
          <span>YOUR EDGE STARTS BEFORE THE SIGNAL.</span>
        </div>
      </section>
      <section className={styles.landingPreview} aria-labelledby="alpha-apps-preview">
        <div className={styles.landingPreviewHead}>
          <h2 id="alpha-apps-preview">The software, up close.</h2>
          <Link href="/apps/software">EXPLORE THE COLLECTION <span aria-hidden="true">↗</span></Link>
        </div>
        <div className={styles.landingPreviewCards}>
          {[
            { title: "Alpha Focus", category: "DEEP WORK", src: "/apps/showcase/alpha-focus-gold-compact-layout.png", width: 1074, height: 941 },
            { title: "Alpha Vibe", category: "SOUND & VISUALS", src: "/apps/showcase/alpha-vibe-frequency-spectrum-gold.png", width: 1075, height: 720 },
            { title: "Alpha Notes", category: "CLEAR THINKING", src: "/apps/showcase/alpha-notes-gold-editor.png", width: 1072, height: 773 },
          ].map((item) => (
            <Link href="/apps/software" className={styles.landingPreviewCard} key={item.title}>
              <Image src={item.src} width={item.width} height={item.height}
                sizes="(max-width: 650px) 92vw, 32vw"
                quality={85} alt={item.title + " genuine Windows application interface"} />
              <span>{item.title}<small>{item.category}</small></span>
            </Link>
          ))}
        </div>
      </section>
    </AppsShell>
  );
}
