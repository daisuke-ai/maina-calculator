// Design System - Consistent styling across the application

export const colors = {
  // Primary brand colors (slate/blue-gray)
  primary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',  // Main brand color
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Success (green) - for financial positives
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },

  // Warning (amber) - subdued
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },

  // Error (red) - subdued
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  // Neutral grays
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },

  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F4F4F5',
  }
}

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
}

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
}

export const typography = {
  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
}

export const transitions = {
  fast: 'all 150ms ease-in-out',
  normal: 'all 250ms ease-in-out',
  slow: 'all 350ms ease-in-out',
}

// Common component styles
export const componentStyles = {
  card: `
    bg-white rounded-xl shadow-md border border-neutral-200
    hover:shadow-lg transition-shadow duration-300
  `,

  input: `
    h-12 px-4 rounded-lg border-2 border-neutral-300
    focus:border-primary-500 focus:ring-4 focus:ring-primary-100
    transition-all duration-200
    text-base font-medium
    placeholder:text-neutral-400
  `,

  button: {
    primary: `
      h-12 px-6 rounded-lg font-semibold text-base
      bg-primary-600 text-white
      hover:bg-primary-700 active:bg-primary-800
      focus:ring-4 focus:ring-primary-200
      transition-all duration-200
      shadow-sm hover:shadow-md
      disabled:opacity-50 disabled:cursor-not-allowed
    `,

    secondary: `
      h-12 px-6 rounded-lg font-semibold text-base
      bg-white text-primary-600 border-2 border-primary-600
      hover:bg-primary-50 active:bg-primary-100
      focus:ring-4 focus:ring-primary-200
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `,

    ghost: `
      h-10 px-4 rounded-lg font-medium text-sm
      text-neutral-700 hover:bg-neutral-100
      focus:ring-2 focus:ring-neutral-200
      transition-all duration-200
    `,
  },

  badge: {
    success: 'px-3 py-1 rounded-full text-sm font-semibold bg-success-100 text-success-700',
    warning: 'px-3 py-1 rounded-full text-sm font-semibold bg-warning-100 text-warning-700',
    error: 'px-3 py-1 rounded-full text-sm font-semibold bg-error-100 text-error-700',
    neutral: 'px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700',
  }
}

// Utility classes
export const utils = {
  truncate: 'overflow-hidden text-ellipsis whitespace-nowrap',
  visuallyHidden: 'absolute w-px h-px p-0 -m-px overflow-hidden clip-rect(0,0,0,0) whitespace-nowrap border-0',
}
