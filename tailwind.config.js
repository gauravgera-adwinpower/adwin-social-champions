/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adwin: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcddfe',
          300: '#8ec6fe',
          400: '#59a4fb',
          500: '#3281f6',
          600: '#1d63ea',
          700: '#174ecc',
          800: '#1841a5',
          900: '#0f2963',
          950: '#0b193f',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      }
    },
  },
  plugins: [],
}
