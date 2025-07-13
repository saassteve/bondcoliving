/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5f4',
          100: '#d9e5e3',
          200: '#b3ccc8',
          300: '#8db2ac',
          400: '#679991',
          500: '#417f75',
          600: '#1E3D36',
          700: '#16332c',
          800: '#0f2822',
          900: '#071c17',
          950: '#041310',
        },
        neutral: {
          50: '#FAF8F6',
          100: '#E8E6E1',
          200: '#D3CEC4',
          300: '#B8B2A7',
          400: '#A39E93',
          500: '#857F72',
          600: '#625D52',
          700: '#504A40',
          800: '#27241D',
          900: '#141210',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        serif: [
          'Playfair Display',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};