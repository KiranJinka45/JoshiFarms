/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'farm-green': '#16a34a',
        'farm-green-dark': '#15803d',
        'farm-beige': '#fef3c7',
      }
    },
  },
  plugins: [],
}
