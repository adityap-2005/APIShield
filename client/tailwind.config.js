/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gh: {
          bg: "#0d1117",
          surface: "#161b22",
          subsurface: "#21262d",
          border: "#30363d",
          text: "#f0f6fc",
          muted: "#8b949e",
          accent: "#58a6ff",
          green: "#238636",
          greenHover: "#2ea043",
          danger: "#da3633",
        },
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#79c0ff",
          400: "#58a6ff",
          500: "#1f6feb",
          600: "#238636",
          700: "#2ea043",
          800: "#388bfd",
          900: "#161b22",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "Liberation Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
