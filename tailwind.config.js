/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Alexandria",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        "prayer-green": "#008449",
        "dark-background": "#2C333B",
        "card-background": "#F8F8F8",
        "dark-text": "#333333",
        "light-border": "rgba(44, 51, 59, 0.5)",
        "islamic-date": "#A59574",
      },
    },
  },
  plugins: [],
};

