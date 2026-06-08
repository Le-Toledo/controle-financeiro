/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6fff9',
          100: '#b3ffe8',
          300: '#33ddb3',
          500: '#00d4a0',
          600: '#00aa82',
          700: '#007a5e',
        },
        surface: {
          bg:     '#080D1A',
          base:   '#0E1525',
          card:   '#15202E',
          raised: '#1C2A3A',
          border: '#1E2D42',
        },
        positive: '#00d4a0',
        negative: '#FF5C7D',
        warning:  '#FFB347',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
