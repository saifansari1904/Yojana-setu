/**
 * Yojana Setu — "Premium Government Intelligence" design tokens.
 *
 * Single source of truth for colour, typography, spacing, radius, shadow,
 * motion, z-index and breakpoint values used by the presentation layer.
 * Business logic never imports this file.
 *
 * The same values are mirrored as CSS custom properties in `src/index.css`
 * (`--yj-*`) so that both Tailwind arbitrary values and raw CSS can use them.
 */

/* ── Colour ──────────────────────────────────────────────────────────────── */

export const palette = {
  /** Deep emerald / Indian green — the trust anchor of the brand. */
  primary: {
    900: '#07221E',
    800: '#0B302B',
    700: '#0B5D4B',
    600: '#0F766E',
    500: '#047857',
    400: '#16A34A',
    300: '#34D399',
    200: '#4ADE80',
    100: '#C1E2D0',
    50: '#D4EFE1',
  },
  /** Dark-theme surfaces: deep green-black, never pure black. */
  dark: {
    page: '#071A17',
    surface: '#0B2420',
    surfaceRaised: '#102E29',
    surfaceSubtle: '#1B2720',
    border: '#24342D',
    borderStrong: '#2E4137',
  },
  /** Light-theme surfaces. */
  light: {
    page: '#F7FAF8',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSubtle: '#F1F5F3',
    border: '#E2E2E0',
    borderStrong: '#D3DAD6',
  },
  /** Restrained warm saffron/gold — highlights, verified marks, milestones. */
  gold: {
    600: '#B9801F',
    500: '#D99A2B',
    400: '#E3A83B',
    100: '#FBEFD6',
    dark: '#3B2F14',
  },
  text: {
    primary: '#0F1512',
    secondary: '#42544C',
    tertiary: '#6F7A73',
    onDarkPrimary: '#F0F4F2',
    onDarkSecondary: '#A9BDB3',
    onDarkTertiary: '#8E9F97',
    inverse: '#FFFFFF',
  },
} as const

/**
 * Semantic status system. Every status carries an icon + label in the UI, so
 * colour is never the only signal (WCAG 1.4.1).
 */
export const status = {
  success: { fg: '#0F6B4C', bg: '#D4EFE1', darkFg: '#4ADE80', darkBg: '#12352B' },
  warning: { fg: '#92610A', bg: '#FEF3C7', darkFg: '#FCD34D', darkBg: '#3B2F14' },
  danger: { fg: '#A6412A', bg: '#FFDAD6', darkFg: '#F87171', darkBg: '#3D1A14' },
  information: { fg: '#0F766E', bg: '#DCF1EE', darkFg: '#5EEAD4', darkBg: '#0F3330' },
  unknown: { fg: '#516A5F', bg: '#F1F5F3', darkFg: '#9EB0A7', darkBg: '#1E2723' },
  verified: { fg: '#B9801F', bg: '#FBEFD6', darkFg: '#E3A83B', darkBg: '#3B2F14' },
  pending: { fg: '#42544C', bg: '#EDF1EF', darkFg: '#A9BDB3', darkBg: '#1B2720' },
} as const

export type StatusToken = keyof typeof status

/* ── Gradients (subtle by design: no neon, no purple) ───────────────────── */

export const gradients = {
  hero: 'linear-gradient(135deg, #0B5D4B 0%, #0F766E 55%, #14453D 100%)',
  heroDark: 'linear-gradient(135deg, #071A17 0%, #0B2420 55%, #102E29 100%)',
  page: 'linear-gradient(180deg, #F7FAF8 0%, #F1F5F3 100%)',
  pageDark: 'linear-gradient(180deg, #071A17 0%, #0B2420 100%)',
  accent: 'linear-gradient(90deg, #047857 0%, #0F766E 100%)',
  highlight: 'linear-gradient(90deg, #D99A2B 0%, #E3A83B 100%)',
} as const

/* ── Typography ─────────────────────────────────────────────────────────── */

export const typography = {
  fontFamily: {
    sans: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    hindi: "'Noto Sans Devanagari', 'Inter', -apple-system, sans-serif",
  },
  /** Fluid ramp: mobile → desktop, expressed as clamp() in index.css. */
  scale: {
    display: { min: 32, max: 60, lineHeight: 1.05, tracking: '-0.03em', weight: 700 },
    h1: { min: 28, max: 44, lineHeight: 1.1, tracking: '-0.025em', weight: 700 },
    h2: { min: 24, max: 32, lineHeight: 1.18, tracking: '-0.02em', weight: 700 },
    h3: { min: 19, max: 24, lineHeight: 1.28, tracking: '-0.012em', weight: 600 },
    bodyLg: { min: 16, max: 17, lineHeight: 1.6, tracking: '0em', weight: 400 },
    body: { min: 15, max: 16, lineHeight: 1.6, tracking: '0em', weight: 400 },
    support: { min: 13, max: 14, lineHeight: 1.5, tracking: '0em', weight: 400 },
    caption: { min: 11, max: 12, lineHeight: 1.45, tracking: '0.01em', weight: 500 },
    eyebrow: { min: 10, max: 11, lineHeight: 1.4, tracking: '0.14em', weight: 700 },
  },
  /** Comfortable reading measure for prose blocks. */
  measure: { narrow: '46ch', default: '64ch', wide: '76ch' },
} as const

/* ── Spacing / radius / shadow ──────────────────────────────────────────── */

export const spacing = {
  '3xs': '0.25rem',
  '2xs': '0.5rem',
  xs: '0.75rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  '2xl': '4rem',
  '3xl': '6rem',
} as const

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const

/** Elevation levels 0–4. Green-tinted, never heavy black. */
export const shadow = {
  level0: 'none',
  level1: '0 1px 2px rgba(7, 26, 23, 0.05), 0 1px 3px rgba(7, 26, 23, 0.04)',
  level2: '0 2px 4px rgba(7, 26, 23, 0.05), 0 6px 16px rgba(7, 26, 23, 0.06)',
  level3: '0 6px 12px rgba(7, 26, 23, 0.07), 0 16px 32px rgba(7, 26, 23, 0.08)',
  level4: '0 12px 24px rgba(7, 26, 23, 0.10), 0 32px 64px rgba(7, 26, 23, 0.12)',
} as const

/* ── Motion (mirrors src/animations/transitions.ts) ─────────────────────── */

export const motion = {
  duration: {
    micro: 120,
    fast: 180,
    normal: 240,
    page: 320,
    reveal: 480,
    sequence: 700,
  },
  easing: {
    /** Crisp decelerate for entrances and hovers. */
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  /** Stagger windows for list reveals. */
  stagger: { tight: 50, normal: 70, loose: 100 },
} as const

/* ── Z-index / breakpoints ──────────────────────────────────────────────── */

export const zIndex = {
  background: 0,
  content: 10,
  stickyAction: 30,
  header: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
} as const

export const breakpoints = {
  mobileSm: 375,
  mobile: 390,
  mobileLg: 430,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  desktopLg: 1440,
} as const

export const designTokens = {
  palette,
  status,
  gradients,
  typography,
  spacing,
  radius,
  shadow,
  motion,
  zIndex,
  breakpoints,
} as const

export type DesignTokens = typeof designTokens
