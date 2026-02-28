/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-teal': '#0f766e',
        'brand-dark': '#0f172a',
        'brand-surface': '#1e293b',
      },
    },
  },
  plugins: [],
}
