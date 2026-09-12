/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#fafafa',
          100: '#f4f4f5',
          150: '#ececee',
          200: '#e4e4e7',
          250: '#dcdee0',
          300: '#d4d4d8',
          350: '#bcbcc0',
          400: '#a1a1aa',
          450: '#8b8b94',
          455: '#80808a',
          500: '#71717a',
          600: '#52525b',
          655: '#45454d',
          700: '#3f3f46',
          750: '#27272a',
          755: '#232326',
          800: '#1e1e1e',
          850: '#18181b',
          900: '#121212',
          950: '#0a0a0a',
          955: '#000000'
        },
        dark: {
          950: '#0b0d10',
          900: '#111318',
          850: '#16191f',
          800: '#1b1f27',
          750: '#222731',
          700: '#303642',
          650: '#3a414e',
          600: '#4a5363',
          500: '#6c7685',
          400: '#9aa4b2',
          300: '#c7ced8',
          200: '#e5e9ef',
          100: '#f7f8fa'
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#4d8dff',
          600: '#3478ed',
          700: '#2463ce',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        accent: {
          cyan: '#38bdf8',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
};
