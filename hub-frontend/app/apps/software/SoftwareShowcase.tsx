import Image from "next/image";
import Link from "next/link";
import styles from "../apps.module.css";

const products = [
  {
    id: "focus",
    number: "01",
    name: "Alpha Focus",
    eyebrow: "TIME & ATTENTION",
    headline: "Own your time.",
    description: "A clear, visual timer that gives your work sessions structure without getting in the way. Make room for deep work, deliberate breaks and the next task.",
    features: ["ADJUSTABLE WORK & BREAK SESSIONS", "VISUAL COUNTDOWN & PROGRESS", "SOUNDS & VOICE PROMPTS"],
    src: "/apps/showcase/alpha-focus-gold-compact-layout.png",
    width: 1074,
    height: 941,
    alt: "Original Windows screenshot of the Alpha Focus timer beside the Notes editor.",
    caption: "FOCUS / SIGNATURE GOLD · ORIGINAL WINDOWS CAPTURE",
  },
  {
    id: "vibe",
    number: "02",
    name: "Alpha Vibe",
    eyebrow: "SOUND & ATMOSPHERE",
    headline: "Find your rhythm.",
    description: "Original instrumental focus music, gradual builds and atmospheric tonal layers create a steady backdrop for deep work. The visuals respond to the sound while the playback controls stay simple.",
    features: ["ORIGINAL INSTRUMENTAL FOCUS MUSIC", "SUBTLE RHYTHMS & TONAL TEXTURES", "AUDIO-REACTIVE VISUALIZERS"],
    src: "/apps/showcase/alpha-vibe-frequency-spectrum-gold.png",
    width: 1075,
    height: 720,
    alt: "Original Windows screenshot of the Alpha Vibe player with its gold audio spectrum.",
    caption: "VIBE / GOLD SPECTRUM · ORIGINAL WINDOWS CAPTURE",
  },
  {
    id: "notes",
    number: "03",
    name: "Alpha Notes",
    eyebrow: "IDEAS & ORGANIZATION",
    headline: "Keep the idea.",
    description: "A quiet, local-first place to capture your thinking, organize research and keep useful details within reach whenever inspiration strikes.",
    features: ["NOTES, FOLDERS & SEARCH", "AUTOSAVE & MARKDOWN", "QUICK CAPTURE"],
    src: "/apps/showcase/alpha-notes-gold-editor.png",
    width: 1072,
    height: 773,
    alt: "Original Windows screenshot of the Alpha Notes editor in dark and gold.",
    caption: "NOTES / SIGNATURE GOLD · ORIGINAL WINDOWS CAPTURE",
  },
] as const;

export default function SoftwareShowcase() {
  return (
    <>
      <div className={styles.editorialIntro}>
        <p className={styles.eyebrow}>ALPHA GRIND / THREE APPS. ONE WORKSPACE.</p>
        <h1>Focus, <span>your way.</span></h1>
        <p>Structure your time. Set the atmosphere. Capture the ideas. Explore three focused Windows applications through their original product screenshots.</p>
        <Link className={styles.returnLink} href="/">← BACK TO ALPHA ALERTS</Link>
      </div>

      <section className={styles.editorialProducts} aria-label="Explore Alpha Grind applications">
        {products.map((product) => (
          <article key={product.id} id={product.id} className={styles.editorialProduct}>
            <div className={styles.editorialVisual}>
              <div className={styles.editorialVisualBar}>
                <span>ALPHA GRIND <i /> {product.name.toUpperCase()}</span>
                <span>ACTUAL SCREENSHOT</span>
              </div>
              <div className={styles.editorialImageWrap}>
                <Image
                  src={product.src}
                  alt={product.alt}
                  width={product.width}
                  height={product.height}
                  sizes="(max-width: 820px) 92vw, (max-width: 1200px) 53vw, 650px"
                  quality={90}
                  className={styles.editorialImage}
                />
              </div>
              <div className={styles.editorialImageFooter}>
                <span>{product.caption}</span>
                <a href={product.src} target="_blank" rel="noopener noreferrer">
                  VIEW ORIGINAL <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <div className={styles.editorialContent}>
              <p className={styles.editorialEyebrow}>{product.number} / {product.eyebrow}</p>
              <h2>{product.name}</h2>
              <h3>{product.headline}</h3>
              <p className={styles.editorialDescription}>{product.description}</p>
              <ul className={styles.editorialFeatures}>
                {product.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <span className={styles.editorialFootnote}>WINDOWS APPLICATION <i /> REAL PRODUCT CAPTURE</span>
            </div>
          </article>
        ))}
      </section>
      <p className={styles.releaseNote}>
        <strong>REAL WINDOWS CAPTURES.</strong> Appearance availability differs by application. Downloads will be listed after native Windows release verification.
      </p>
    </>
  );
}
