import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          dark: "#0b241c",
          card: "#143028",
          input: "#081a14",
          border: "#1d4034",
        },
        mint: {
          DEFAULT: "#57cc99",
          hover: "#80ed99",
          light: "#c7f9cc",
        },
        proforma: {
          teal: "#24695c",
          darkTeal: "#1b5e54",
        }
      },
      borderRadius: {
        "card": "40px",
        "card-sm": "32px",
      }
    },
  },
  plugins: [],
};
export default config;

