"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import styles from "../apps.module.css";

type AppId = "focus" | "vibe" | "notes";
type Capture = {
  id: string; app: AppId; name: string; color: string; hex: string;
  view: string; src: string; width: number; height: number; caption: string;
};

const ROOT = "/apps/showcase/";
const captures: Capture[] = [
  { id: "focus-gold-workspace", app: "focus", name: "Signature Gold", color: "Gold", hex: "#e7bc67", view: "Desktop", src: ROOT + "alpha-grind-focus-notes-desktop-gold.png", width: 1908, height: 1033, caption: "Focus and Notes, side by side in the Windows workspace." },
  { id: "focus-gold-stacked", app: "focus", name: "Signature Gold", color: "Gold", hex: "#e7bc67", view: "Stacked", src: ROOT + "alpha-focus-notes-gold-stacked.png", width: 1075, height: 1874, caption: "A full-size Focus session with Notes below." },
  { id: "focus-gold-compact", app: "focus", name: "Signature Gold", color: "Gold", hex: "#e7bc67", view: "Compact", src: ROOT + "alpha-focus-gold-compact-layout.png", width: 1074, height: 941, caption: "A compact Focus timer beside the Notes editor." },
  { id: "focus-violet-work", app: "focus", name: "Electric Violet", color: "Violet", hex: "#b57be7", view: "Deep work", src: ROOT + "alpha-focus-purple-deep-work.png", width: 1076, height: 1917, caption: "Violet focus mode with a sound-reactive spectrum." },
  { id: "focus-violet-break", app: "focus", name: "Electric Violet", color: "Violet", hex: "#b57be7", view: "Recovery", src: ROOT + "alpha-focus-purple-recovery.png", width: 1075, height: 1917, caption: "Violet recovery session with layered audio visualization." },
  { id: "focus-cyan-work", app: "focus", name: "Arctic Blue", color: "Cyan", hex: "#70caea", view: "Deep work", src: ROOT + "alpha-focus-cyan-deep-work.png", width: 1075, height: 1919, caption: "Arctic blue deep-work session." },
  { id: "focus-red-break", app: "focus", name: "Signal Red", color: "Red", hex: "#f06670", view: "Recovery", src: ROOT + "alpha-focus-red-recovery.png", width: 1068, height: 1919, caption: "Red recovery mode with warm-spectrum visualization." },
  { id: "focus-rose-light", app: "focus", name: "Soft Rose", color: "Rose", hex: "#db90b4", view: "Light Notes", src: ROOT + "alpha-focus-pink-light-notes.png", width: 1079, height: 1913, caption: "Rose Focus paired with the light Notes interface." },
  { id: "vibe-gold-spectrum", app: "vibe", name: "Signature Gold", color: "Gold", hex: "#e7bc67", view: "Spectrum", src: ROOT + "alpha-vibe-frequency-spectrum-gold.png", width: 1075, height: 720, caption: "Alpha Vibe's real frequency-spectrum player interface." },
  { id: "notes-gold-editor", app: "notes", name: "Signature Gold", color: "Gold", hex: "#e7bc67", view: "Editor", src: ROOT + "alpha-notes-gold-editor.png", width: 1072, height: 773, caption: "Alpha Notes in its charcoal-and-gold editor layout." },
  { id: "notes-gold-workspace", app: "notes", name: "Signature Gold", color: "Gold", hex: "#e7bc67", view: "Workspace", src: ROOT + "alpha-grind-focus-notes-desktop-gold.png", width: 1908, height: 1033, caption: "Notes and Focus shown together in a desktop workspace." },
  { id: "notes-rose-light", app: "notes", name: "Soft Rose", color: "Rose", hex: "#db90b4", view: "Light", src: ROOT + "alpha-focus-pink-light-notes.png", width: 1079, height: 1913, caption: "The Notes light appearance shown with rose-colored Focus." },
];

const products: Record<AppId, {
  name: string; eyebrow: string; headline: string; description: string;
  details: string[]; image: string; width: number; height: number;
}> = {
  focus: {
    name: "Alpha Focus", eyebrow: "01 / TIME & ATTENTION",
    headline: "Make every minute count.",
    description: "Focused work, intentional breaks, and one beautifully clear countdown. Explore actual Windows captures of its different color treatments and window arrangements.",
    details: ["DEEP WORK / RECOVERY", "VISUAL SESSION PROGRESS", "COMPACT & FULL-SIZE VIEWS"],
    image: ROOT + "alpha-focus-gold-compact-layout.png", width: 1074, height: 941,
  },
  vibe: {
    name: "Alpha Vibe", eyebrow: "02 / SOUND & ATMOSPHERE",
    headline: "See what you hear.",
    description: "A restrained music workspace with real-time sound-reactive visualization and straightforward playback controls. The spectrum shown here is from the actual application.",
    details: ["AUDIO-REACTIVE SPECTRUM", "LOCAL / SYSTEM SOURCES", "PLAYBACK CONTROLS"],
    image: ROOT + "alpha-vibe-frequency-spectrum-gold.png", width: 1075, height: 720,
  },
  notes: {
    name: "Alpha Notes", eyebrow: "03 / IDEAS & ORGANIZATION",
    headline: "A quieter place to think.",
    description: "A clean writing space for notes, ideas and markdown. Browse the original gold editor and the contrasting light appearance.",
    details: ["LOCAL NOTES", "MARKDOWN EDITING", "DARK / LIGHT APPEARANCE"],
    image: ROOT + "alpha-notes-gold-editor.png", width: 1072, height: 773,
  },
};
const order: AppId[] = ["focus", "vibe", "notes"];

export default function SoftwareShowcase() {
  const [app, setApp] = useState<AppId>("focus");
  const [captureId, setCaptureId] = useState("focus-gold-workspace");
  const options = captures.filter((item) => item.app === app);
  const selected = options.find((item) => item.id === captureId) ?? options[0];
  const colors = options.filter((item, i, all) => all.findIndex((x) => x.color === item.color) === i);
  const views = options.filter((item) => item.color === selected.color);
  const product = products[app];
  const accentStyle = { "--capture-accent": selected.hex } as CSSProperties;

  function chooseApp(next: AppId) {
    setApp(next);
    const first = captures.find((item) => item.app === next);
    if (first) setCaptureId(first.id);
  }
  function chooseColor(next: string) {
    const first = options.find((item) => item.color === next);
    if (first) setCaptureId(first.id);
  }

  return (
    <>
      <div className={styles.showcaseHead}>
        <div className={styles.showcaseIntro}>
          <p className={styles.eyebrow}>THE GRIND COLLECTION / REAL WINDOWS CAPTURES</p>
          <h2 className={styles.showcaseTitle}>Find your <span>flow.</span></h2>
          <p>Three independent tools. One deliberate aesthetic. Select an app, explore its actual captured layouts and choose the color treatment you want to see.</p>
        </div>
        <div className={styles.showcaseEdition}>ALPHA GRIND <span> / </span> VISUAL SHOWCASE</div>
      </div>

      <section className={styles.showcase} style={accentStyle} aria-label="Explore Alpha software screenshots">
        <div className={styles.showcaseTopbar}>
          <div className={styles.showcaseProductTabs} aria-label="Choose an application">
            {order.map((id) => (
              <button key={id} type="button" aria-pressed={app === id} onClick={() => chooseApp(id)} className={app === id ? styles.productTabSelected : styles.productTab}>
                {products[id].name}
              </button>
            ))}
          </div>
          <span className={styles.showcaseTopCaption}>REAL CAPTURES <i /> NO RENDERS</span>
        </div>

        <div className={styles.showcaseGrid}>
          <div className={styles.showcaseImagePane}>
            <div className={styles.imagePaneTop}>
              <span className={styles.captureStatus}><span aria-hidden="true" /> WINDOWS / PREVIEW</span>
              <span>{selected.view.toUpperCase()} <span className={styles.captureSeparator}>/</span> {selected.color.toUpperCase()}</span>
            </div>
            <div className={styles.showcaseImageFrame}>
              <Image
                key={selected.id}
                src={selected.src}
                alt={selected.caption}
                width={selected.width}
                height={selected.height}
                sizes="(max-width: 760px) 92vw, (max-width: 1100px) 60vw, 800px"
                quality={90}
                className={styles.showcaseImage}
                priority={app === "focus" && selected.id === "focus-gold-workspace"}
              />
            </div>
            <div className={styles.showcaseImageFooter}>
              <span>{selected.caption}</span>
              <a href={selected.src} target="_blank" rel="noopener noreferrer" aria-label={"Open original full-resolution image: " + selected.view}>OPEN ORIGINAL <span aria-hidden="true">↗</span></a>
            </div>
          </div>

          <div className={styles.showcaseSide}>
            <div>
              <p className={styles.showcaseEyebrow}>{product.eyebrow}</p>
              <h3>{product.headline}</h3>
              <p className={styles.showcaseDetail}>{product.description}</p>
            </div>
            <div className={styles.captureControls}>
              <div className={styles.captureControlHead}>
                <span>01 / CHOOSE A COLOR</span>
                <strong>{selected.name}</strong>
              </div>
              <div className={styles.colorOptions}>
                {colors.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    className={styles.colorOption}
                    style={{ "--swatch": item.hex } as CSSProperties}
                    aria-pressed={selected.color === item.color}
                    aria-label={item.name}
                    title={item.name}
                    onClick={() => chooseColor(item.color)}
                  >
                    <span aria-hidden="true" />
                    <small>{item.color === "Cyan" ? "BLUE" : item.color.toUpperCase()}</small>
                  </button>
                ))}
              </div>
              <div className={styles.captureControlHead}>
                <span>02 / CHOOSE A VIEW</span>
                <strong>{selected.view}</strong>
              </div>
              <div className={styles.viewOptions}>
                {views.map((item) => (
                  <button key={item.id} type="button" className={styles.viewOption} aria-pressed={selected.id === item.id} onClick={() => setCaptureId(item.id)}>
                    {item.view}
                  </button>
                ))}
              </div>
              <p className={styles.captureHint}>These controls browse authentic screenshots. They do not change your installed apps.</p>
            </div>
            <div className={styles.showcaseDetails}>
              {product.details.map((detail) => <span key={detail}><i aria-hidden="true" />{detail}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.collection} aria-labelledby="grind-heading">
        <div className={styles.collectionHead}>
          <h2 id="grind-heading">Built for the way you work.</h2>
          <span>THREE DISTINCT TOOLS / ONE STANDARD</span>
        </div>
        <div className={styles.cards}>
          {order.map((id, index) => {
            const item = products[id];
            return (
              <article className={styles.card} id={id} key={id}>
                <button type="button" className={styles.cardImageButton} onClick={() => { chooseApp(id); document.querySelector("." + styles.showcase)?.scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",block: "start"}); }} aria-label={"Explore screenshots of " + item.name}>
                  <Image src={item.image} width={item.width} height={item.height} alt={item.name + " real Windows application screenshot"} sizes="(max-width: 650px) 92vw, (max-width: 1100px) 46vw, 390px" quality={85} className={styles.cardImage}/>
                  <span>EXPLORE THE DETAILS <span aria-hidden="true">↗</span></span>
                </button>
                <div className={styles.cardInfo}>
                  <div className={styles.cardHeading}>
                    <h3>{item.name}</h3><span className={styles.tag}>PREVIEW</span>
                  </div>
                  <p>{id === "focus" ? "A precise timer for deep work and recovery." : id === "vibe" ? "A sound-reactive space for your music." : "A clean writing environment that keeps ideas close."}</p>
                  <div className={styles.cardBottom}>
                    <span>{index === 0 ? "TIME & ATTENTION" : index === 1 ? "SOUND & ATMOSPHERE" : "IDEAS & ORGANIZATION"}</span>
                    <span>WINDOWS</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className={styles.releaseNote}><strong>Release status:</strong> Downloads appear only after native Windows installation, upgrade, safety and usability checks pass. These are real product screenshots, not installer links.</p>
      </section>
    </>
  );
}
