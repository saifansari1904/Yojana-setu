import { Transition } from 'motion/react';

/**
 * Yojana Setu Central Motion Transitions
 * Designed for a modern, trustworthy, government-tech platform.
 * Fast, purposeful, minimal, and respecting reduced-motion preferences.
 */

export const transitions = {
  /** Fast interactions: tooltips, buttons, small toggles (150–220ms) */
  fast: {
    duration: 0.18,
    ease: [0.16, 1, 0.3, 1], // Crisp easeOut
  } satisfies Transition,

  /** Normal UI: cards, list items, dropdowns (250–320ms) */
  normal: {
    duration: 0.28,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,

  /** Smooth UI: modal panels, drawers, large panels (350–420ms) */
  smooth: {
    duration: 0.38,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,

  /** Screen and page transitions (350–450ms) */
  page: {
    duration: 0.36,
    ease: [0.25, 1, 0.35, 1],
  } satisfies Transition,

  /** Direction-aware form question slides */
  questionSlide: {
    duration: 0.32,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,

  /** Spring for checkmarks, badges, status indicators */
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 28,
  } satisfies Transition,

  /** Gentle spring for subtle modal pops */
  gentleSpring: {
    type: 'spring',
    stiffness: 300,
    damping: 24,
  } satisfies Transition,

  /** Stagger children timing for lists & results */
  stagger: {
    staggerChildren: 0.05,
    delayChildren: 0.03,
  } satisfies Transition,

  /** Fast stagger for criteria items */
  fastStagger: {
    staggerChildren: 0.04,
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
