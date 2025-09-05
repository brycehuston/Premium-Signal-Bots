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
        bg: "#09090f",
        card: "#0f1117",
        edge: "#1a1d29",
        brand: { 500: "#6ee7ff", 600: "#52d7ff", 700: "#2ab3e6" }
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)"
      },
      backgroundSize: { grid: "24px 24px" },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      boxShadow: {
        glass: "0 0 0 1px rgba(255,255,255,.06), 0 6px 24px rgba(0,0,0,.28)",
        glow: "0 0 0 1px rgba(110,231,255,.10), 0 10px 30px rgba(82,215,255,.10), 0 30px 60px rgba(82,215,255,.05)"
      }
    }
  },
  plugins: []
}
