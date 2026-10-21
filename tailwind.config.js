/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'on-light': 'var(--text-on-light)',
        'on-light-emphasis': 'var(--text-on-light-emphasis)',
        'on-dark': 'var(--text-on-dark)',
        'pill-bg': 'var(--pill-bg)',
        'pill-text': 'var(--pill-text)',
        'pill-border': 'var(--pill-border)',
        'chip-bg': 'var(--chip-bg)',
        'chip-text': 'var(--chip-text)',
        'chip-border': 'var(--chip-border)',
        'chip-selected-bg': 'var(--chip-selected-bg)',
        'chip-selected-text': 'var(--chip-selected-text)',
        'chip-selected-border': 'var(--chip-selected-border)',
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        civic: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#0f2c59',
          950: '#071630',
        },
        warmbg: {
          light: '#FBF9F5',
          card: '#FFFFFF',
          dark: '#0F172A',
          darkcard: '#1E293B',
        }
      },
      fontFamily: {
        devanagari: ['Mukta', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['1.125rem', { lineHeight: '1.75rem' }], // 18px base text
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      boxShadow: {
        'glow-saffron': '0 0 25px -3px rgba(249, 115, 22, 0.45)',
        'glow-blue': '0 0 25px -3px rgba(30, 58, 138, 0.45)',
      }
    },
  },
  plugins: [],
}
