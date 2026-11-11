import type { Metadata } from "next";
import Link from "next/link";
import { AppsShell } from "../AppsShell";
import SoftwareShowcase from "./SoftwareShowcase";
import styles from "../apps.module.css";

export const metadata: Metadata = {
  title: "FRUXLABS SOFTWARE — Alpha Grind",
  description: "Explore genuine Windows screenshots and practical benefits of Alpha Focus, Alpha Vibe and Alpha Notes, the Alpha Grind productivity suite.",
  alternates: { canonical: "/apps/software" },
  openGraph: {
    title: "FRUXLABS SOFTWARE | Alpha Grind",
    description: "Explore authentic screenshots of Focus, Vibe and Notes.",
    url: "/apps/software", type: "website",
  },
};

const featuredRoadmap = [
  {
    number: "01",
    code: "SN",
    category: "CAPTURE & KEEP",
    name: "Alpha Snip",
    headline: "Capture the whole idea.",
    description: "An ambitious take on screenshots, screen capture and clipping—built to make saving and sharing visual context feel effortless.",
  },
  {
    number: "02",
    code: "ST",
    category: "CREATE & EDIT",
    name: "Alpha Studio",
    headline: "Bring the vision to life.",
    description: "A focused video-editing and content-creation workspace with professional capability and a simpler creative flow.",
  },
  {
    number: "03",
    code: "AT",
    category: "WORK SMARTER",
    name: "Alpha Atlas",
    headline: "One intelligent workspace.",
    description: "An AI-powered workspace direction for organizing work, finding what matters and coordinating useful assistance.",
  },
] as const;

const roadmapGroups = [
  {
    number: "01",
    title: "SYSTEMS & CONTROL",
    detail: "Know your environment. Keep it running clean.",
    apps: [
      { name: "Alpha Market Clock", detail: "World clocks and global market sessions." },
      { name: "Alpha Systems", detail: "PC monitoring, health and diagnostics." },
      { name: "Alpha Clean", detail: "Storage analysis and intelligent cleanup." },
      { name: "Alpha Defender", detail: "Protective security utilities." },
    ],
  },
  {
    number: "02",
    title: "WORK & ORGANIZATION",
    detail: "Tools that keep the day moving.",
    apps: [
      { name: "Alpha Invoice", detail: "Professional invoices and business tools." },
      { name: "Alpha Space", detail: "Productivity and workspace organization." },
      { name: "Alpha Link", detail: "A simpler approach to connected workflows." },
      { name: "Alpha", detail: "An additional product concept, still being defined." },
    ],
  },
  {
    number: "03",
    title: "CREATIVE & SOUND",
    detail: "A sharper toolkit for making things.",
    apps: [
      { name: "Alpha Media", detail: "Media downloads and management." },
      { name: "Alpha Craft", detail: "Creative tools and content production." },
      { name: "Alpha Flow", detail: "Recording, effects and audio workflows." },
      { name: "Alpha Voice", detail: "Voice creation and audio tools." },
      { name: "Alpha Audio Lab", detail: "Creative sound experimentation." },
    ],
  },
] as const;

export default function SoftwareCatalog() {
  return (
    <AppsShell active="software">
      <div className={styles.catalog}>
        <SoftwareShowcase />
        <section className={styles.roadmap} id="upcoming" aria-labelledby="upcoming-heading">
          <div className={styles.roadmapHeader}>
            <div className={styles.roadmapHeaderCopy}>
              <p className={styles.roadmapKicker}><span aria-hidden="true" /> THE ALPHA ROADMAP / FRUXLABS SOFTWARE</p>
              <h2 id="upcoming-heading">The next chapter <span>is taking shape.</span></h2>
              <p className={styles.roadmapLead}>
                More ways to create, organize, explore and stay in control.
                A growing family of thoughtfully designed Windows tools—each built with the same attention to simplicity, performance and detail.
              </p>
            </div>
            <div className={styles.roadmapCount} aria-label="16 named products and concepts on the roadmap">
              <strong>16<span aria-hidden="true">+</span></strong>
              <span>PRODUCTS &amp;<br />CONCEPTS</span>
            </div>
          </div>

          <div className={styles.roadmapSectionLabel}>
            <span>IN FOCUS</span>
            <span>THREE DIRECTIONS. ONE DESIGN PHILOSOPHY.</span>
          </div>
          <div className={styles.roadmapFeatures} aria-label="Featured Alpha software projects">
            {featuredRoadmap.map((app) => (
              <article className={styles.roadmapFeature} key={app.name}>
                <div className={styles.roadmapFeatureTop}>
                  <span>{app.number} / {app.category}</span>
                  <span className={styles.roadmapFeatureCode} aria-hidden="true">{app.code}</span>
                </div>
                <div className={styles.roadmapFeatureCopy}>
                  <h3>{app.name}</h3>
                  <strong>{app.headline}</strong>
                  <p>{app.description}</p>
                </div>
                <span className={styles.roadmapFeatureFoot}>WINDOWS SOFTWARE <i aria-hidden="true" /> IN THE WORKS</span>
              </article>
            ))}
          </div>

          <div className={styles.roadmapSectionLabel}>
            <span>THE WIDER COLLECTION</span>
            <span>PURPOSE-BUILT. CLEAN BY DESIGN.</span>
          </div>
          <div className={styles.roadmapGroups} aria-label="Additional Alpha software projects">
            {roadmapGroups.map((group) => (
              <section className={styles.roadmapGroup} key={group.title} aria-label={group.title}>
                <div className={styles.roadmapGroupHead}>
                  <span className={styles.roadmapGroupNumber}>{group.number}</span>
                  <div>
                    <h3>{group.title}</h3>
                    <p>{group.detail}</p>
                  </div>
                </div>
                <ul className={styles.roadmapItems}>
                  {group.apps.map((app) => (
                    <li key={app.name} className={styles.roadmapItem}>
                      <span className={styles.roadmapItemMark} aria-hidden="true" />
                      <span>
                        <strong>{app.name}</strong>
                        <small>{app.detail}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className={styles.roadmapBottom}>
            <div>
              <p>BUILT WITH INTENTION. RELEASED WHEN READY.</p>
              <span>
                This is an evolving roadmap, not a release schedule. Apps may be in development, prototype or planning stages.
                Alpha Focus, Vibe and Notes are already showcased above as part of Alpha Grind.
              </span>
            </div>
            <Link href="/apps">EXPLORE ALPHA GRIND <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
        <div className={styles.closing}>
          <span>NO ADS. NO SIGN-UPS. NO BS.</span>
          <Link href="/">← BACK TO ALPHA ALERTS</Link>
        </div>
      </div>
    </AppsShell>
  );
}
