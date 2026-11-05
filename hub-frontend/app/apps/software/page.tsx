import type { Metadata } from "next";
import Link from "next/link";
import { AlphaMark, AppsShell } from "../AppsShell";
import styles from "../apps.module.css";

export const metadata: Metadata = {
  title: "Alpha Software — Focus, Vibe & Notes",
  description: "Explore the Alpha Grind software suite: Alpha Focus, Alpha Vibe and Alpha Notes. Windows previews and release updates from FruxLabs.",
  alternates: { canonical: "/apps/software" },
  openGraph: {
    title: "Alpha Software | The Alpha Grind Suite",
    description: "Focus, sound and notes in one deliberate workflow.",
    url: "/apps/software", type: "website",
  },
};

const products = [
  {
    id: "focus",
    name: "Alpha Focus",
    description: "A visual focus timer that makes deep-work sessions simple and deliberate.",
    detail: "A quiet 25/5 timer experience with clear session state and minimal controls.",
    theme: "goldCard",
    kind: "focus",
    meta: "TIME & ATTENTION",
  },
  {
    id: "vibe",
    name: "Alpha Vibe",
    description: "Local music and visual atmosphere designed to help you find your rhythm.",
    detail: "A music player with sound-reactive visuals and controls designed for concentration.",
    theme: "violetCard",
    kind: "vibe",
    meta: "SOUND & IMMERSION",
  },
  {
    id: "notes",
    name: "Alpha Notes",
    description: "A calm, organized place to capture ideas and keep important details close.",
    detail: "Local-first notes, folders and quick capture without unnecessary friction.",
    theme: "blueCard",
    kind: "notes",
    meta: "IDEAS & ORGANIZATION",
  },
] as const;

function AppWindow({ kind, name }: { kind: "focus" | "vibe" | "notes"; name: string }) {
  return (
    <div className={styles.window} role="img" aria-label={`Illustrative interface preview for ${name}`}>
      <div className={styles.windowBar}>
        <span>ALPHA {kind.toUpperCase()}</span>
        <span className={styles.windowControls} aria-hidden="true">● ● ●</span>
      </div>
      {kind === "focus" ? (
        <div className={styles.clockFace}>
          <small>DEEP WORK</small><strong>25:00</strong>
        </div>
      ) : kind === "vibe" ? (
        <>
          <div className={styles.waveform} aria-hidden="true">
            {[14,30,51,65,36,79,100,58,33,83,46,68,92,40,25,73,56,28,46,16,31,11].map((height,i) => (
              <i key={i} style={{height: `${height}%`}} />
            ))}
          </div>
          <div className={styles.waveControls} aria-hidden="true">‹　◉　›</div>
        </>
      ) : (
        <div className={styles.notesUi}>
          <div className={styles.notesSidebar} aria-hidden="true"><i/><i/><i/><i/></div>
          <div className={styles.notesMain}><strong>Welcome to Alpha Notes</strong><i/><i/><i/></div>
        </div>
      )}
    </div>
  );
}

export default function SoftwareCatalog() {
  return (
    <AppsShell active="software">
      <div className={styles.catalog}>
        <header className={styles.catalogIntro}>
          <div>
            <p className={styles.kicker}>ALPHA SOFTWARE</p>
            <h1 className={styles.catalogTitle}>THREE TOOLS.<br/>ONE <span>FLOW.</span></h1>
          </div>
          <p className={styles.catalogCopy}>
            Built for focused work, immersive sound and ideas worth keeping.
            Meet the first three applications in the growing Alpha ecosystem.
          </p>
        </header>

        <div className={styles.catalogMicro}>THE GRIND COLLECTION</div>
        <div className={styles.grindBar}>
          <div className={styles.grindBadge}><AlphaMark size={39}/> ALPHA GRIND</div>
          <div className={styles.grindMeta}>FOCUS <span aria-hidden="true"> · </span> VIBE <span aria-hidden="true"> · </span> NOTES<br/>LOCAL-FIRST WINDOWS SOFTWARE</div>
        </div>

        <section className={styles.cards} aria-label="Alpha Grind applications">
          {products.map((app) => (
            <article id={app.id} key={app.id} className={`${styles.card} ${styles[app.theme]}`}>
              <AppWindow kind={app.kind} name={app.name} />
              <div className={styles.cardInfo}>
                <div className={styles.cardTop}>
                  <h2 className={styles.appName}>{app.name}</h2>
                  <span className={styles.tag}>PREVIEW</span>
                </div>
                <p>{app.description}</p>
                <div className={styles.cardBottom}>
                  <span>{app.meta}</span>
                  <span>WINDOWS</span>
                </div>
                <details className={styles.details}>
                  <summary>View details</summary>
                  <p>{app.detail} Download links will appear after installer verification.</p>
                </details>
              </div>
            </article>
          ))}
        </section>

        <div className={styles.releaseNote} role="note">
          <strong>Download status:</strong> These are interface previews, not released installers.
          Downloads will be enabled only after Windows installation, upgrade and security checks pass.
          No account is required to browse the software.
        </div>

        <section className={styles.upcoming} id="upcoming" aria-labelledby="upcoming-heading">
          <div className={styles.sectionEyebrow}>WHAT'S NEXT</div>
          <h2 id="upcoming-heading" className={styles.sectionTitle}>The ecosystem keeps growing.</h2>
          <p>More tools are in development. Availability and features will be published when verified.</p>
          <div className={styles.upcomingGrid}>
            {["Alpha Flow","Alpha Studio","Alpha Defender"].map((name) => (
              <div className={styles.upcomingItem} key={name}>
                <strong>{name}</strong><span>IN DEVELOPMENT</span>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.bottomCta}>
          <div>
            <strong>Designed for actual work.</strong>
            <p>No unnecessary noise. Just the tools you need, as they become ready.</p>
          </div>
          <Link className={styles.goldButton} href="/apps">Back to Alpha Apps <span aria-hidden="true">→</span></Link>
        </aside>
      </div>
    </AppsShell>
  );
}
