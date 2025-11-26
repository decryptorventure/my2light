/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        slate: {
          850: '#151b28', // Slightly lighter than 900 for cards
          900: '#0f172a',
        },
        lime: {
          400: '#a3e635',
          500: '#84cc16',
        },
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
        }
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan 2.5s linear infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)', opacity: '0.6' },
          '50%': { transform: 'translateY(100%)', opacity: '1' },
          '51%': { opacity: '0' },
          '100%': { transform: 'translateY(0%)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      }
    },
  },
  plugins: [],
}
