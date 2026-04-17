/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Syne'", "sans-serif"],
      },
      colors: {
        canvas: {
          DEFAULT: "#0d1117",
          subtle: "#161b22",
          inset: "#010409",
        },
        border: {
          DEFAULT: "#21262d",
          muted: "#1b2028",
        },
        fg: {
          DEFAULT: "#e6edf3",
          muted: "#7d8590",
          subtle: "#484f58",
          accent: "#58a6ff",
        },
        accent: {
          blue: "#58a6ff",
          green: "#3fb950",
          red: "#f85149",
          orange: "#d29922",
          purple: "#bc8cff",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideDown: { from: { opacity: 0, transform: "translateY(-8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
