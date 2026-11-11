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

export default function SoftwareCatalog() {
  return (
    <AppsShell active="software">
      <div className={styles.catalog}>
        <SoftwareShowcase />
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
          <Link href="/">← BACK TO ALPHA ALERTS</Link>
        </div>
      </div>
    </AppsShell>
  );
}
