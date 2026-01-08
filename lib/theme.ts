/**
 * Premium Enterprise SaaS Design System
 * Inspired by Intercom, Stripe, Linear
 * 
 * Color Palette:
 * - Primary: Deep navy/indigo (#1a1f35)
 * - Accent: Vibrant orange (#ff6b35, #f7931e)
 * - Secondary: Soft teal (#4fc3f7)
 * - Neutrals: Clean white, light gray, slate
 */

export const theme = {
  colors: {
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      200: '#c7d7fe',
      300: '#a4b8fc',
      400: '#8190f8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#1a1f35', // Deep navy
      900: '#0f1322',
    },
    accent: {
      orange: '#ff6b35',
      orangeLight: '#f7931e',
      orangeDark: '#e55a2b',
      teal: '#4fc3f7',
      tealLight: '#81d4fa',
      tealDark: '#29b6f6',
    },
    neutral: {
      white: '#ffffff',
      gray50: '#f8fafc',
      gray100: '#f1f5f9',
      gray200: '#e2e8f0',
      gray300: '#cbd5e1',
      gray400: '#94a3b8',
      gray500: '#64748b',
      gray600: '#475569',
      gray700: '#334155',
      gray800: '#1e293b',
      gray900: '#0f172a',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  spacing: {
    grid: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['12px', { lineHeight: '1.5' }],
      sm: ['14px', { lineHeight: '1.6' }],
      base: ['16px', { lineHeight: '1.6' }],
      lg: ['18px', { lineHeight: '1.6' }],
      xl: ['20px', { lineHeight: '1.5' }],
      '2xl': ['24px', { lineHeight: '1.4' }],
      '3xl': ['30px', { lineHeight: '1.3' }],
      '4xl': ['36px', { lineHeight: '1.2' }],
      '5xl': ['48px', { lineHeight: '1.1' }],
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    card: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  borderRadius: {
    sm: '4px',
    DEFAULT: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  transitions: {
    DEFAULT: 'all 300ms ease',
    fast: 'all 150ms ease',
    slow: 'all 500ms ease',
  },
};

export default theme;
