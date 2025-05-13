/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#1a1c2e',
        'deep-purple': '#6366f1',
        'accent-blue': '#3b82f6',
        'dark-bg': '#0f172a',
        'light-bg': '#1e293b'
      }
    },
  },
  plugins: [],
}
