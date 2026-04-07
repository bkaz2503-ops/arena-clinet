import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          50: "#f4f8ff",
          100: "#e8f0ff",
          500: "#2458d3",
          700: "#183a8b",
          900: "#0f1d43"
        }
      }
    }
  },
  plugins: []
};

export default config;
