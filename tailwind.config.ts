import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warna utama — teal/hijau lembut
        primary: {
          50: "#EFF7F5",
          100: "#D9EDE8",
          200: "#B3DAD1",
          300: "#8AC5B8",
          400: "#62B0A0",
          500: "#3F9686",
          600: "#327A6D",
          700: "#285F55",
          800: "#1E4640",
          900: "#142F2B",
        },
        // Warna sekunder — krem
        secondary: {
          50: "#FDFBF7",
          100: "#F8F1E7",
          200: "#F0E4CF",
          300: "#E4D2AE",
          400: "#D4BA84",
          500: "#C2A05F",
          700: "#8A6F3F",
        },
        // Netral — putih & abu-abu muda
        neutral: {
          50: "#FAFAF9",
          100: "#F4F4F3",
          200: "#E7E7E5",
          300: "#D3D3D0",
          400: "#A8A8A3",
          500: "#7C7C77",
          600: "#5B5B57",
          700: "#434340",
          800: "#2C2C2A",
          900: "#1A1A18",
        },
        // Warna status
        success: { 50: "#EEF8F1", 500: "#4CAF7D", 600: "#3C8F65" },
        warning: { 50: "#FDF5E7", 500: "#E0A83E", 600: "#BC8A2A" },
        danger: { 50: "#FBEEEE", 500: "#D96C6C", 600: "#C24F4F" },
        info: { 50: "#EEF3F9", 500: "#5B8DBE", 600: "#4573A0" },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(20, 40, 35, 0.04), 0 2px 8px -2px rgba(20, 40, 35, 0.06)",
        "card-hover": "0 4px 16px -4px rgba(20, 40, 35, 0.14)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
