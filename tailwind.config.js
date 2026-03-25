/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        frammer: {
          bg: '#0e0f11',
          surface: '#161719',
          border: '#252628',
          text: '#ffffff',
          muted: '#8a8c93',
          red: '#e9434a',
        }
      },
    },
  },
  plugins: [],
};