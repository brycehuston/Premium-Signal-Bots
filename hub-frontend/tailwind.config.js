/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Arial",
          "sans-serif"
        ],
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Arial",
          "sans-serif"
        ]
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        card: "rgb(var(--surface) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        edge: "rgb(var(--stroke) / <alpha-value>)",
        stroke: "rgb(var(--stroke) / <alpha-value>)",
        stroke2: "rgb(var(--stroke2) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        silver: "rgb(var(--silver) / <alpha-value>)",
        "silver-strong": "rgb(var(--silver-strong) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        gold2: "rgb(var(--gold2) / <alpha-value>)",
        bronze: "rgb(var(--tone-bronze) / <alpha-value>)",
        platinum: "rgb(var(--tone-platinum) / <alpha-value>)",
        brand: {
          500: "rgb(var(--gold) / <alpha-value>)",
          600: "rgb(var(--gold2) / <alpha-value>)",
          700: "rgb(var(--gold3) / <alpha-value>)",
        }
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)"
      },
      backgroundSize: { grid: "24px 24px" },
      borderRadius: {
        xl: "1rem",
        "2xl": "var(--radius-card)",
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        pill: "var(--radius-pill)"
      },
      fontSize: {
        hero: ["clamp(2.6rem, 5.6vw, 4.9rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "hero-sub": ["clamp(1.1rem, 2.2vw, 1.5rem)", { lineHeight: "1.5" }],
        h2: ["clamp(1.9rem, 2.9vw, 2.8rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        h3: ["1.35rem", { lineHeight: "1.3" }],
        "title-lg": ["1.15rem", { lineHeight: "1.35" }],
        body: ["1rem", { lineHeight: "1.7" }],
        small: ["0.875rem", { lineHeight: "1.6" }],
        eyebrow: ["0.7rem", { lineHeight: "1.4", letterSpacing: "0.35em" }]
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-hover)"
      }
    }
  },
  plugins: []
}
