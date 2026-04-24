/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dime: {
          orange: {
            50: "#FFF4EA",
            100: "#FFE4CC",
            200: "#FFCF9E",
            300: "#FFB56B",
            400: "#FE9C3F",
            500: "#FC8019",
            600: "#E06E10",
            700: "#B85A0B",
            800: "#8A4208",
            900: "#5C2B05",
          },
          ink: {
            DEFAULT: "#1C1C1E",
            2: "#3C3C43",
            3: "#8E8E93",
            4: "#C7C7CC",
          },
          bg: {
            DEFAULT: "#FFFFFF",
            2: "#F7F7F7",
            card: "#FFFFFF",
            grouped: "#F2F2F7",
          },
          border: "rgba(60, 60, 67, 0.12)",
          success: "#22C55E",
          warn: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
          gold: "#FFD700",
          "gold-2": "#FFA500",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "38px", fontWeight: "600" }],
        "title-1": ["24px", { lineHeight: "30px", fontWeight: "600" }],
        "title-2": ["20px", { lineHeight: "26px", fontWeight: "600" }],
        "title-3": ["17px", { lineHeight: "22px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "22px", fontWeight: "400" }],
        callout: ["15px", { lineHeight: "20px", fontWeight: "400" }],
        footnote: ["13px", { lineHeight: "18px", fontWeight: "400" }],
        caption: ["11px", { lineHeight: "14px", fontWeight: "500", letterSpacing: "0.5px" }],
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
