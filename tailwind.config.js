/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // University of Peradeniya maroon
        primary: {
          50: '#fbf3f4',
          100: '#f6e4e6',
          200: '#ecc6cb',
          300: '#dc9aa2',
          400: '#c4636f',
          500: '#a83a48',
          600: '#8e2a37',
          700: '#76202c',
          800: '#621b25',
          900: '#4f1620',
          950: '#2e0a10',
        },
        // Academic gold
        secondary: {
          50: '#fdf8ec',
          100: '#faefcf',
          200: '#f4dc9c',
          300: '#ecc566',
          400: '#e3ae3d',
          500: '#d49a2a',
          600: '#b67d1e',
          700: '#91601b',
          800: '#774d1c',
          900: '#63401b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}