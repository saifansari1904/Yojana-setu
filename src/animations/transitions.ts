import { Transition } from 'motion/react';

/**
 * Yojana Setu Central Motion System Tokens
 * Defines consistent durations and easings matching the UX specification:
 * - Micro interaction: 100–180ms
 * - Standard interaction: 180–300ms
 * - Page transition: 250–450ms
 * - Major reveal: 350–600ms
 * All transitions respect prefers-reduced-motion.
 */

export const motionTokens = {
  duration: {
    micro: 0.15,       // 150ms
    standard: 0.24,    // 240ms
    page: 0.32,        // 320ms
    major: 0.45,       // 450ms
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1],       // Crisp ease-out for entrances & hovers
    easeInOut: [0.4, 0, 0.2, 1],     // Balanced ease-in-out
    emphasized: [0.2, 0, 0, 1],       // Decelerated for focal actions
  },
};

export const transitions = {
  /** Micro interactions: tooltips, buttons, small toggles, arrow nudges (120–180ms) */
  micro: {
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1],
  } satisfies Transition,

  /** Fast interactions: buttons, small badges (150–200ms) */
  fast: {
    duration: 0.18,
    ease: [0.16, 1, 0.3, 1],
  } satisfies Transition,

  /** Standard UI: cards, list items, dropdowns, options (200–280ms) */
  normal: {
    duration: 0.24,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,

  /** Smooth UI: modal panels, drawers, large panels (320–380ms) */
  smooth: {
    duration: 0.34,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,

  /** Screen and page transitions (280–360ms) */
  page: {
    duration: 0.32,
    ease: [0.25, 1, 0.35, 1],
  } satisfies Transition,

  /** Direction-aware form question slides (240–300ms) */
  questionSlide: {
    duration: 0.26,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,

  /** Spring for physical interactions: checkmarks, badges, status indicators */
  spring: {
    type: 'spring',
    stiffness: 420,
    damping: 28,
  } satisfies Transition,

  /** Gentle spring for subtle modal pops & card hovers */
  gentleSpring: {
    type: 'spring',
    stiffness: 320,
    damping: 26,
  } satisfies Transition,

  /** Stagger children timing for results cascade (50–70ms stagger) */
  stagger: {
    staggerChildren: 0.06,
    delayChildren: 0.03,
  } satisfies Transition,

  /** Fast stagger for short criteria lists (30–40ms stagger) */
  fastStagger: {
    staggerChildren: 0.035,
    delayChildren: 0.02,
  } satisfies Transition,
};

/**
 * Transition override when prefers-reduced-motion is active
 */
export const reducedMotionTransition: Transition = {
  duration: 0.01,
  ease: 'linear',
};

