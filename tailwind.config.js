/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
      },
      boxShadow: {
        "card": "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 2px 4px rgba(15, 23, 42, 0.06), 0 16px 40px -8px rgba(15, 23, 42, 0.12)",
        "nav": "0 -4px 24px rgba(15, 23, 42, 0.06)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "compare-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "compare-check": {
          "0%": { transform: "scale(0.96)", boxShadow: "0 0 0 0 rgba(15, 118, 110, 0.24)" },
          "70%": { transform: "scale(1)", boxShadow: "0 0 0 7px rgba(15, 118, 110, 0)" },
          "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(15, 118, 110, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "compare-in": "compare-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "compare-check": "compare-check 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
