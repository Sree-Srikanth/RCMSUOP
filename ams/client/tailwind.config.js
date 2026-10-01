/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // University of Peradeniya identity: maroon and gold
        uop: {
          50: '#fbf3f3',
          100: '#f6e3e3',
          200: '#edc7c8',
          300: '#dd9c9e',
          400: '#c4676a',
          500: '#a83c40',
          600: '#8f2629',
          700: '#7a1416',
          800: '#621114',
          900: '#4d0f11',
        },
        gold: {
          100: '#fdf5d8',
          300: '#f5d76e',
          500: '#d4a017',
          600: '#b48610',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Roboto', '"Noto Sans"', '"Noto Sans Sinhala"', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
