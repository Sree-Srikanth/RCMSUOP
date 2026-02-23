/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36aaf4',
          500: '#0c8ee4',
          600: '#006bb3',
          700: '#005a9e',
          800: '#064b83',
          900: '#0a3d6d',
          950: '#072b4f',
        },
        secondary: {
          50: '#fef9e7',
          100: '#fef0c3',
          200: '#fedd8a',
          300: '#fdc147',
          400: '#fca51f',
          500: '#f6850b',
          600: '#d96006',
          700: '#b44109',
          800: '#92320e',
          900: '#782b0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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