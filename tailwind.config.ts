import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0F0FE',
          200: '#BAE0FD',
          300: '#7CC4FA',
          400: '#38A4F6',
          500: '#0F87E8',
          600: '#026AC7',
          700: '#0354A1',
          800: '#074884',
          900: '#0C3D6D',
          950: '#082749',
        },
        bibi: {
          50: '#F0F7FF',
          100: '#E0F0FE',
          200: '#BAE0FD',
          300: '#7CC4FA',
          400: '#38A4F6',
          500: '#0F87E8',
          600: '#026AC7',
          700: '#0354A1',
          800: '#074884',
          900: '#0C3D6D',
          950: '#082749',
        },
        surface: {
          ground: '#FAFCFE',
          card: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
          dark: '#0F172A',
        },
        stone: {
          warm: '#FAF7F2',
          sand: '#F5EFEB',
        }
      },
      fontFamily: {
        sans: ['var(--font-rubik)', 'var(--font-prompt)', "'Rubik'", "'Prompt'", 'sans-serif'],
        display: ['var(--font-rubik)', 'var(--font-prompt)', "'Rubik'", "'Prompt'", 'sans-serif'],
        rubik: ['var(--font-rubik)', "'Rubik'", 'sans-serif'],
        signature: ["'Great Vibes'", 'var(--font-signature)', 'cursive'],
        hairline: ["'Great Vibes'", 'var(--font-signature)', 'cursive'],
        handwriting: ["'Great Vibes'", 'var(--font-signature)', 'cursive'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'hover': '0 10px 20px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
        'elevated': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      spacing: {
        '70': '17.5rem',
        '76': '19rem',
      }
    },
  },
  plugins: [],
};
export default config;
