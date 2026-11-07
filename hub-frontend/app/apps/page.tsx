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
          <p className={styles.eyebrow}><span aria-hidden="true" /> INTRODUCING</p>
          <div className={styles.grindBrand}>
            <Image src="/apps/alpha-grind-mark.svg" alt="Alpha Grind emblem" width={55} height={53} />
            <span>ALPHA <strong>GRIND</strong></span>
          </div>
          <h1 id="apps-title" className={styles.heroTitle}>
            THE ALPHA<br />SOFTWARE <span>SUITE.</span>
          </h1>
          <p className={styles.heroDescription}>
            Three purpose-built Windows apps for better focus, immersive sound,
            and ideas worth keeping. Everything you need to make room for real work.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/apps/software">
              Explore the Suite <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.grindSecondary} href="#grind-benefits">Discover Alpha Grind <span aria-hidden="true">↘</span></Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <StackArt />
          <div className={styles.visualCaption}>ALPHA GRIND <span> / </span> THREE APPS. ONE WORKSPACE.</div>
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
      <section className={styles.landingPreview} id="grind-benefits" aria-labelledby="alpha-apps-preview">
        <div className={styles.landingPreviewHead}>
          <div>
            <p className={styles.eyebrow}>THREE APPS. ONE WORKSPACE.</p>
            <h2 id="alpha-apps-preview">One space. Zero unnecessary noise.</h2>
          </div>
          <Link href="/apps/software">EXPLORE THE COLLECTION <span aria-hidden="true">↗</span></Link>
        </div>
        <div className={styles.landingPreviewCards}>
          {[
            {
              title: "Alpha Focus", category: "OWN YOUR TIME",
              src: "/apps/showcase/alpha-focus-gold-compact-layout.png", width: 1074, height: 941,
              description: "Adjustable sessions and a clear visual countdown. Structure your work, then take a deliberate break."
            },
            {
              title: "Alpha Vibe", category: "FIND YOUR RHYTHM",
              src: "/apps/showcase/alpha-vibe-frequency-spectrum-gold.png", width: 1075, height: 720,
              description: "Music and sound-reactive visuals to build the right atmosphere around your work."
            },
            {
              title: "Alpha Notes", category: "CAPTURE EVERYTHING",
              src: "/apps/showcase/alpha-notes-gold-editor.png", width: 1072, height: 773,
              description: "Local-first notes, folders, Markdown and quick capture to keep your research organized."
            },
          ].map((item) => (
            <Link href="/apps/software" className={styles.landingPreviewCard} key={item.title}>
              <Image src={item.src} width={item.width} height={item.height}
                sizes="(max-width: 650px) 92vw, 32vw"
                quality={85} alt={item.title + " genuine Windows application interface"} />
              <span>{item.title}<small>{item.category}</small></span>
              <p className={styles.grindCardDetail}>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className={styles.grindQuiet} aria-labelledby="grind-quiet-title">
        <div>
          <p className={styles.eyebrow}>FOCUS, YOUR WAY.</p>
          <h2 id="grind-quiet-title">Made for minds that <span>work differently.</span></h2>
        </div>
        <p>Not everyone works best in silence or with a rigid routine. Some of us need movement, music, a visible deadline, or somewhere to catch an idea before it disappears. Choose the combination that helps you work. <strong>Less setup. More focus.</strong></p>
      </section>
      <section className={styles.grindEcosystem} aria-labelledby="grind-ecosystem-title">
        <div className={styles.grindEcosystemHead}>
          <div>
            <p className={styles.eyebrow}>THE ALPHA ECOSYSTEM</p>
            <h2 id="grind-ecosystem-title">More than a workspace.</h2>
          </div>
          <p>Alpha Grind is the productivity foundation. Alpha Alerts and Alpha Pulse are separate intelligence tools within the wider FruxLabs vision.</p>
        </div>
        <div className={styles.grindEcosystemSteps} aria-label="FruxLabs ecosystem concept">
          <div><span>01 / PREPARE</span><strong>Alpha Grind</strong><small>FOCUS & ORGANIZE</small></div>
          <div><span>02 / ANALYZE</span><strong>Alpha Pulse</strong><small>MARKET CONTEXT</small></div>
          <div><span>03 / IDENTIFY</span><strong>Alpha Alerts</strong><small>POTENTIAL OPPORTUNITIES</small></div>
          <div><span>04 / ACT</span><strong>Future tools</strong><small>ROADMAP CONCEPT</small></div>
        </div>
        <p className={styles.grindRoadmap}>Conceptual ecosystem flow. Planned integrations and execution tools are not current Alpha Grind features.</p>
      </section>
      <section className={styles.grindFinal} aria-labelledby="grind-final-title">
        <div>
          <p className={styles.eyebrow}>YOUR EDGE STARTS BEFORE THE SIGNAL.</p>
          <h2 id="grind-final-title">Less noise. <span>More signal.</span></h2>
          <p>Lock in. Stay ready. Go Alpha.</p>
        </div>
        <Link className={styles.primaryAction} href="/apps/software">Explore Alpha Grind <span aria-hidden="true">→</span></Link>
      </section>
    </AppsShell>
  );
}
