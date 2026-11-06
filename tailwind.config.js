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
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      colors: {
        'navy-dark': '#000033',
        brand: {
          red: '#E5252A',
          redHover: '#C81E23',
          redLight: '#FDF2F2',
          black: '#0A0A0A',
          gray: '#151515',
          muted: '#666666',
          surface: '#F5F5F5',
          border: '#E5E5E5',
        },
        gray: {
          850: '#182030',
        },
        ecom: {
          price: '#E11D48',
          deal: '#FF4747',
          cta: '#FF6000',
          ctaHover: '#E55600',
          trust: '#059669',
          star: '#F59E0B',
          bg: '#F8F9FA',
          card: '#FFFFFF',
          darkCard: '#111827',
          darkBg: '#0B0F17',
        },
        hafi: {
          green: '#43A047',
          greenLight: '#66BB6A',
          orange: '#FF6000',
          teal: '#00838F',
          black: '#111827',
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
