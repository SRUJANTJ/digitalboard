/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#21232B",
        paper: "#F5F1E6",
        card: "#FFFDF8",
        navy: {
          DEFAULT: "#1D2B4F",
          light: "#2E4270",
          dark: "#141D38",
        },
        rust: "#B23A20",
        gold: "#C79A2E",
        sage: "#3E7A66",
        steel: "#3B6E8F",
        berry: "#A63D6B",
        teal: "#2E8B8B",
        amber: "#C97A2E",
        moss: "#5C8A3A",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        pin: "0 2px 6px rgba(33, 35, 43, 0.12), 0 8px 20px rgba(33, 35, 43, 0.08)",
        pinHover: "0 4px 10px rgba(33, 35, 43, 0.16), 0 14px 28px rgba(33, 35, 43, 0.12)",
      },
    },
  },
  plugins: [],
};
