import type { Metadata } from "next";
import Link from "next/link";
import { AppsShell } from "../AppsShell";
import styles from "../apps.module.css";

export const metadata: Metadata = {
  title: "Alpha Grind — Focus, Vibe & Notes",
  description: "Explore Alpha Focus, Alpha Vibe and Alpha Notes, three local-first Windows apps built by FruxLabs.",
  alternates: { canonical: "/apps/software" },
  openGraph: {
    title: "Alpha Grind | Alpha Software",
    description: "Focus, Vibe and Notes. Three tools made for focused work.",
    url: "/apps/software",
    type: "website",
  },
};

const apps = [
  {
    id: "focus",
    name: "Alpha Focus",
    type: "TIME & ATTENTION",
    description: "A clear visual timer for focused sessions, breaks and staying on track.",
    preview: "focusPreview",
  },
  {
    id: "vibe",
    name: "Alpha Vibe",
    type: "MUSIC & ATMOSPHERE",
    description: "A local music player with immersive, sound-reactive visuals.",
    preview: "vibePreview",
  },
  {
    id: "notes",
    name: "Alpha Notes",
    type: "IDEAS & ORGANIZATION",
    description: "A quiet space to capture ideas, keep notes organized and pick up where you left off.",
    preview: "notesPreview",
  },
] as const;

export default function SoftwareCatalog() {
  return (
    <AppsShell active="software">
      <div className={styles.catalog}>
        <header className={styles.catalogIntro}>
          <div>
            <p className={styles.eyebrow}><span aria-hidden="true" /> ALPHA SOFTWARE</p>
            <h1 className={styles.catalogTitle}>Meet <span>Alpha Grind.</span></h1>
            <p className={styles.catalogDescription}>
              Focus, sound and notes. Three deliberately simple tools for getting real work done.
            </p>
          </div>
          <div className={styles.catalogMeta}>FRUXLABS SOFTWARE <span> / </span> WINDOWS</div>
        </header>

        <section aria-labelledby="grind-heading" className={styles.collection}>
          <div className={styles.collectionHead}>
            <h2 id="grind-heading">Focus · Vibe · Notes</h2>
            <span>THE GRIND COLLECTION</span>
          </div>
          <div className={styles.cards}>
            {apps.map(app => (
              <article className={styles.card} id={app.id} key={app.id}>
                <div className={`${styles.appPreview} ${styles[app.preview]}`}
                  role="img" aria-label={`Preview screenshot of ${app.name} on Windows`}/>
                <div className={styles.cardInfo}>
                  <div className={styles.cardHeading}>
                    <h3>{app.name}</h3>
                    <span className={styles.tag}>PREVIEW</span>
                  </div>
                  <p>{app.description}</p>
                  <div className={styles.cardBottom}>
                    <span>{app.type}</span>
                    <span>WINDOWS</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.releaseNote}>
            <strong>Release status:</strong> Downloads will appear once Windows installers
            pass installation, upgrade, safety and usability testing.
            The screenshots above show the applications; they are not download links.
          </p>
        </section>

        <section className={styles.upcoming} id="upcoming" aria-labelledby="upcoming-heading">
          <div className={styles.sectionTop}>
            <div>
              <p className={styles.eyebrow}>IN DEVELOPMENT</p>
              <h2 id="upcoming-heading">More from FruxLabs.</h2>
            </div>
            <p>Additional tools will be listed here as they become ready.</p>
          </div>
          <div className={styles.upcomingList}>
            {["Alpha Flow", "Alpha Studio", "Alpha Defender"].map(name => (
              <div key={name}><span>{name}</span><small>IN DEVELOPMENT</small></div>
            ))}
          </div>
        </section>

        <div className={styles.closing}>
          <span>NO ADS. NO SIGN-UPS. NO BS.</span>
          <Link href="/apps">Back to Alpha Apps <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </AppsShell>
  );
}
