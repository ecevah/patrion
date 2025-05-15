/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          50: "#1E1E2E",
          100: "#181825",
          200: "#11111B",
          300: "#0D0D15",
          400: "#0A0A10",
          500: "#2b2b36", // Logo'daki koyu renk
        },
        accent: {
          primary: "#ff5169", // Ana vurgu rengi (logo'dan gelen kırmızı)
          secondary: "#EC4899", // İkincil vurgu rengi (pembe)
          tertiary: "#10B981", // Üçüncül vurgu rengi (yeşil)
        },
        text: {
          primary: "#E9E9EC",
          secondary: "#A9A9B2",
          tertiary: "#69697C",
        },
        border: {
          primary: "#2D2D3D",
          secondary: "#363646",
        },
        card: {
          primary: "#242433",
          secondary: "#1E1E2E",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      boxShadow: {
        "dark-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        "dark-md":
          "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.4)",
        "dark-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
        "dark-xl":
          "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
