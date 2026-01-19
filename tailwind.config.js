/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        'glass-bg': 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'accent-cyan': '#06b6d4',
        'accent-violet': '#8b5cf6',
        'accent-rose': '#f43f5e',
      },
    },
  },
  plugins: [],
};
