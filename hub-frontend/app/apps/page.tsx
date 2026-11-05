import type { Metadata } from "next";
import Link from "next/link";
import { AppsShell, GoldWaves, StackArt } from "./AppsShell";
import styles from "./apps.module.css";

export const metadata: Metadata = {
  title: "Alpha Apps — Build. Focus. Create. Execute.",
  description: "Introducing Alpha Apps by FruxLabs: a growing suite of local-first Windows tools for focus, music and notes.",
  alternates: { canonical: "/apps" },
  openGraph: {
    title: "Alpha Apps | Build. Focus. Create. Execute.",
    description: "Focus, Vibe and Notes. Three tools, one focused workflow.",
    url: "/apps", type: "website",
  },
};

const benefits = ["Premium apps", "Local & private", "No ads or sign-ups", "Built for real work"];

export default function AppsWelcome() {
  return (
    <AppsShell active="intro">
      <div>
        <section className={styles.hero} aria-labelledby="apps-hero-heading">
          <div className={styles.heroText}>
            <p className={styles.kicker}>THE ALPHA ECOSYSTEM</p>
            <h1 id="apps-hero-heading" className={styles.headline}>
              BUILD<br/>FOCUS<br/>CREATE<span>EXECUTE</span>
            </h1>
          </div>
          <div className={styles.stackWrap}>
            <StackArt />
          </div>
          <div className={styles.benefits}>
            {benefits.map((benefit) => (
              <div className={styles.benefit} key={benefit}>
                <span className={styles.check} aria-hidden="true">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
            <Link className={styles.goldButton} href="/apps/software">
              Explore Alpha Apps <span aria-hidden="true">→</span>
            </Link>
          </div>
          <GoldWaves />
        </section>
        <div className={styles.heroSub}>
          <p>INTRODUCING <strong>ALPHA GRIND</strong> — FOCUS <span aria-hidden="true"> · </span> VIBE <span aria-hidden="true"> · </span> NOTES</p>
        </div>
      </div>
    </AppsShell>
  );
}
