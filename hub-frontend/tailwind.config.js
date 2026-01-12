/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
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
      borderRadius: { xl: "1rem", "2xl": "var(--radius-card)" },
      boxShadow: {
        glass: "var(--shadow-soft)",
        glow: "var(--shadow-hover)"
      }
    }
  },
  plugins: []
}
