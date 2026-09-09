/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        shield: {
          bg: "#0d1117",
          sidebar: "#131822",
          surface: "#161b22",
          card: "#161b22",
          subsurface: "#0e131b",
          panel: "#1c2128",
          btn: "#1f242c",
        },
        brand: {
          50:  "#f0f6fc",
          100: "#e1ecf8",
          200: "#cae0f5",
          300: "#a5ccf0",
          400: "#79b1eb",
          500: "#58a6ff",
          600: "#2f81f7",
          700: "#1f6feb",
          800: "#1158c7",
          900: "#0d419d",
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
