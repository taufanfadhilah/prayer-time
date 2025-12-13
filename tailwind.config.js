/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'prayer-green': '#4CAF50',
        'dark-background': '#1a1a1a',
        'card-background': '#F8F8F8',
        'dark-text': '#333333',
        'light-border': 'rgba(44, 51, 59, 0.5)',
        'islamic-date': '#A59574',
      },
    },
  },
  plugins: [],
}

