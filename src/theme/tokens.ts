/**
 * Yojana Setu — Centralized Design System Tokens
 * 
 * Provides unified, authoritative tokens for spacing, border-radius,
 * subtle shadow levels, typography, and sovereign civic-tech colors.
 */

// ── Spacing Tokens (xs to 2xl) ───────────────────────────────────────────────
export const spacing = {
  xs: '4px',    // 0.25rem - Micro gap, tight badge padding
  sm: '8px',    // 0.5rem  - Compact button py, tight list item gap
  md: '12px',   // 0.75rem - Standard input py, card internal spacing
  lg: '16px',   // 1.0rem  - Container minimum padding, card default spacing
  xl: '24px',   // 1.5rem  - Generous section padding, modal padding
  '2xl': '32px', // 2.0rem  - Hero spacing, major layout breaks
} as const;

export type SpacingKey = keyof typeof spacing;

// Spacing Tailwind class mapping for standard convenience
export const spacingClasses = {
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6',
    '2xl': 'p-8',
  },
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
    '2xl': 'gap-8',
  },
} as const;

// ── Border Radius Tokens (sm to full) ────────────────────────────────────────
export const borderRadius = {
  sm: '4px',    // 0.25rem - Sub-elements, tags, small inputs
  md: '8px',    // 0.5rem  - Buttons, form controls, chips
  lg: '12px',   // 0.75rem - Standard cards, dialogs, popovers
  xl: '16px',   // 1.0rem  - Prominent cards, modal shells, feature panels
  '2xl': '24px', // 1.5rem  - Hero surfaces, sovereign banners
  full: '9999px', // Pills, round avatar badges, circular action buttons
} as const;

export type BorderRadiusKey = keyof typeof borderRadius;

// Border Radius Tailwind class mapping
export const borderRadiusClasses: Record<BorderRadiusKey, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

/**
 * Calculates nested corner radius according to geometric nesting rules:
 * Inner Radius = Outer Radius - Distance Between The Two (Padding)
 */
export function getNestedRadius(outerRadiusPx: number, paddingPx: number): number {
  return Math.max(0, outerRadiusPx - paddingPx);
}

// ── Subtle Shadow Tokens ─────────────────────────────────────────────────────
// Calibrated for fintech & civic-tech: soft ambient diffusion without murky dark glows
export const shadows = {
  none: 'none',
  // Micro elevation for table rows, hovered pills
  '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  // Subtle border support for cards
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  // Default resting elevation for interactive cards
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  // Hover elevation for cards and dropdown menus
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
  // Floating modal dialogues and popovers
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  // Heavy elevated drawers and command palettes
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.09), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
} as const;

export type ShadowKey = keyof typeof shadows;

// Dark mode shadow adaptations (relying on subtle border luminosity and faint dark tint)
export const darkShadows = {
  none: 'none',
  '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.6), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.65), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
} as const;

// ── Sovereign Color Palette Tokens ───────────────────────────────────────────
export const colors = {
  emerald: {
    950: '#061814',
    900: '#0B2A24',
    800: '#0F3E34',
    700: '#14453D', // Primary brand deep emerald
    600: '#0F6B4C', // Active action emerald
    500: '#16A34A', // Statutory verification green
    400: '#34D399', // Dark mode high-contrast accent
    300: '#6EE7B7',
    200: '#A7F3D0',
    100: '#D4EFE1', // Soft highlight tint
    50: '#F0F9F5',
  },
  saffron: {
    700: '#B45309',
    600: '#D97706',
    500: '#D99A2B', // Sovereign gold accent
    400: '#F59E0B',
    300: '#FCD34D',
    100: '#FEF3C7',
    50: '#FFFBEB',
  },
  surfaces: {
    light: {
      page: '#FAFAF9',
      card: '#FFFFFF',
      subtle: '#F4F7F5',
      hover: '#EEEEED',
    },
    dark: {
      page: '#0E1311',
      card: '#151C19',
      subtle: '#101714',
      hover: '#1E2723',
    },
  },
  borders: {
    light: {
      subtle: '#E2E2E0',
      strong: '#CDE3D7',
    },
    dark: {
      subtle: '#24342D',
      strong: '#2A3C34',
    },
  },
  text: {
    light: {
      primary: '#1A1C1B',
      secondary: '#516A5F',
      muted: '#6F7A73',
    },
    dark: {
      primary: '#F0F4F2',
      secondary: '#9EB0A7',
      muted: '#8E9F97',
    },
  },
} as const;

// ── Typography Tokens ────────────────────────────────────────────────────────
export const typography = {
  fonts: {
    primary: "'Plus Jakarta Sans', 'Inter', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Kannada', 'Noto Sans Malayalam', -apple-system, sans-serif",
    hindi: "'Noto Sans Devanagari', 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
    mono: "monospace",
  },
  sizes: {
    '2xs': '10px',
    xs: '11px',
    sm: '12px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
} as const;

// ── Combined Centralized Tokens Object ───────────────────────────────────────
export const tokens = {
  spacing,
  borderRadius,
  shadows,
  darkShadows,
  colors,
  typography,
  getNestedRadius,
} as const;

export type DesignTokens = typeof tokens;

export default tokens;
