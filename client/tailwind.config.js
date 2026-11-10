/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          500: '#E04838',
          600: '#C93B2C',
          700: '#B23023'
        },
        emerald: {
          500: '#10B981',
          600: '#059669'
        }
      },
      boxShadow: {
        '3d-card': '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        '3d-card-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        '3d-btn': '0 4px 0 0 #B23023, 0 10px 20px -5px rgba(224, 72, 56, 0.4)',
        '3d-btn-income': '0 4px 0 0 #047857, 0 10px 20px -5px rgba(16, 185, 129, 0.4)',
        'neumorphic-ring': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.8), 0 10px 30px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}
