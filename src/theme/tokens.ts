/**
 * Astryx-aligned Design Tokens for Bibi's Treats D2C Production
 * High-contrast, clean typography, refined surfaces, zero slop.
 */

export const tokens = {
  colors: {
    // Brand D2C Palette: Crisp Powder Blue & Deep Indigo Navy
    brand: {
      50: '#F0F7FF',
      100: '#E0F0FE',
      200: '#BAE0FD',
      300: '#7CC4FA',
      400: '#38A4F6',
      500: '#0F87E8', // Primary Action Blue
      600: '#026AC7',
      700: '#0354A1',
      800: '#074884',
      900: '#0C3D6D',
      950: '#082749',
    },
    // Neutrals: High-contrast Slate / Zinc
    neutral: {
      0: '#FFFFFF',
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    // Functional States
    success: {
      50: '#F0FDF4',
      500: '#16A34A',
      600: '#15803D',
      700: '#166534',
    },
    warning: {
      50: '#FFFBEB',
      500: '#D97706',
      600: '#B45309',
    },
    danger: {
      50: '#FEF2F2',
      500: '#DC2626',
      600: '#B91C1C',
    },
    accent: {
      warm: '#FAF7F2', // Warm bakery stone
      sand: '#F5EFEB',
    }
  },
  typography: {
    fontFamily: {
      sans: "'Plus Jakarta Sans', 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "'Plus Jakarta Sans', 'Prompt', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
  },
  radii: {
    none: '0px',
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
    hover: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
    elevated: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
  }
} as const;

export type ThemeTokens = typeof tokens;
