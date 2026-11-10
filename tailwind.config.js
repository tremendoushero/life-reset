/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        foreground: 'var(--text-main)',
        card: {
          DEFAULT: 'var(--card-bg)',
          foreground: 'var(--text-main)',
        },
        primary: {
          DEFAULT: 'var(--accent-orange)',
          foreground: '#FFFFFF',
        },
        espresso: {
          DEFAULT: '#30251F',
          50: '#F5F3F1',
          100: '#E8E4DF',
          200: '#C7BDB4',
          300: '#A49688',
          400: '#7B6F63',
          500: '#5A4F44',
          600: '#463D34',
          700: '#383029',
          800: '#30251F',
          900: '#231A15',
        },
        ivory: {
          DEFAULT: '#F5F0E8',
          50: '#FDFBF7',
          100: '#FAF6EF',
          200: '#F5F0E8',
          300: '#EAE1D3',
          400: '#DCCFBD',
          500: '#CCBCA5',
        },
        sage: {
          DEFAULT: '#A4B58A',
          light: '#E2E8D8',
          dark: '#586A41',
        },
        lavender: {
          DEFAULT: '#B6A4E8',
          light: '#ECE7FA',
          dark: '#574291',
        },
        softblue: {
          DEFAULT: '#A8CDE0',
          light: '#E3F0F7',
          dark: '#35637D',
        },
        softpeach: {
          DEFAULT: '#F4C7A8',
          light: '#FDF1E8',
          dark: '#8C512A',
        },
        softpink: {
          DEFAULT: '#E9A9B5',
          light: '#FAEAEE',
          dark: '#883747',
        },
        cardwhite: '#FFFEFC',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(48, 37, 31, 0.05), 0 1px 2px rgba(48, 37, 31, 0.03)',
        'soft-md': '0 4px 12px -2px rgba(48, 37, 31, 0.06), 0 2px 6px -1px rgba(48, 37, 31, 0.04)',
        'soft-lg': '0 12px 24px -4px rgba(48, 37, 31, 0.08), 0 4px 12px -2px rgba(48, 37, 31, 0.04)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
