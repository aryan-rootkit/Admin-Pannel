import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Enterprise Palette
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a4b8fc',
          400: '#8190f8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#1a1f35', // Deep navy primary
          900: '#0f1322',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6b35', // Vibrant orange accent
          600: '#f7931e',
          700: '#e55a2b',
          800: '#c2410c',
          900: '#9a3412',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#4fc3f7', // Soft teal highlight
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'micro': ['10px', { lineHeight: '1.5' }], // Tooltips, badges
        xs: ['12px', { lineHeight: '1.5' }], // Labels, metrics
        sm: ['14px', { lineHeight: '1.5' }], // Small text, table cells
        base: ['16px', { lineHeight: '1.5' }], // Body text, forms
        lg: ['18px', { lineHeight: '1.5' }], // Large body
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.5' }], // Page titles
        '3xl': ['30px', { lineHeight: '1.5' }],
        '4xl': ['36px', { lineHeight: '1.5' }], // Dashboard totals
        '5xl': ['48px', { lineHeight: '1.5' }], // Large displays
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'card': '16px',
        'input': '8px',
      },
      transitionDuration: {
        '300': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
    },
  },
  plugins: [],
}
export default config
