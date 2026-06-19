import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f3f6fb",
          100: "#e3ebf6",
          200: "#cad8ec",
          300: "#a3bcdc",
          400: "#7497c7",
          500: "#5278b4",
          600: "#3f5f97",
          700: "#1f3864",   // Excel header blue
          800: "#1a2f54",
          900: "#172948",
        },
        accent: {
          input:    "#fff2cc",  // yellow input
          inputBd:  "#e6c200",
          total:    "#e2efda",  // light green
          totalBd:  "#9fcf8a",
          month:    "#c6e0b4",  // monthly subtotal
          monthBd:  "#7fae5d",
          odbc:     "#fce4d6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
