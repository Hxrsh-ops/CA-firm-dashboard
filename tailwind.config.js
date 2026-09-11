/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F7F4',
        card: '#FFFFFF',
        sidebar: '#FAF8F5',
        brand: {
          50: '#FBF9F7',
          100: '#F4EFEB',
          200: '#E8DDD5',
          300: '#D5C2B4',
          400: '#B89B85',
          500: '#8E6F58',
          600: '#755843',
          700: '#5F4635',
          800: '#3D2D22',
          900: '#261B14',
          950: '#1A120D',
        },
        espresso: {
          DEFAULT: '#2B231F',
          dark: '#1E1815',
          light: '#3C322C',
        },
        warm: {
          50: '#FAF9F6',
          100: '#F5F3ED',
          200: '#EAE6DD',
          300: '#DDD7CB',
          400: '#BDB3A1',
          500: '#9C907C',
          600: '#7A6E5C',
          700: '#5C5243',
          800: '#40382D',
          900: '#2A241C',
        },
        status: {
          missing: {
            bg: '#FDF2F2',
            text: '#B91C1C',
            border: '#FCA5A5',
            dot: '#DC2626',
          },
          review: {
            bg: '#FEF9EE',
            text: '#B45309',
            border: '#FDE68A',
            dot: '#F59E0B',
          },
          pending: {
            bg: '#EFF6FF',
            text: '#1D4ED8',
            border: '#BFDBFE',
            dot: '#3B82F6',
          },
          processed: {
            bg: '#F0FDF4',
            text: '#15803D',
            border: '#BBF7D0',
            dot: '#22C55E',
          },
          neutral: {
            bg: '#F3F4F6',
            text: '#4B5563',
            border: '#E5E7EB',
            dot: '#9CA3AF',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(43, 35, 31, 0.04), 0 1px 2px -1px rgba(43, 35, 31, 0.03)',
        'float': '0 10px 25px -5px rgba(43, 35, 31, 0.08), 0 8px 10px -6px rgba(43, 35, 31, 0.04)',
        'modal': '0 20px 35px -10px rgba(43, 35, 31, 0.15)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}
