/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
      },
      colors: {
        'navy-dark': '#000033',
        hafi: {
          green: '#43A047',
          greenLight: '#66BB6A',
          orange: '#F57C00',
          teal: '#00838F',
          black: '#222',
          white: '#ffffff',
          navy: '#000080',
        },
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'scroll': 'scroll 100s linear infinite',
      },
    },
  },
  plugins: [],
}
