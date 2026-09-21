import { Variants } from 'motion/react';
import { transitions } from './transitions';

/**
 * Yojana Setu Central Motion Variants
 * Clean, subtle, accessible animations without gaudy bouncing or neon styling.
 */

// Simple Fade
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
};

// Subtle Fade Up (for headings, cards, containers)
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitions.fast,
  },
};
export const fadeSlideUp = fadeUp;

// Subtle Scale In (for logos, icons, badges)
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: transitions.fast,
  },
};

// Pop In (for checkmarks, badges)
export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.75,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: transitions.fast,
  },
};

// Page Transition Variants (between major screen modes)
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.page,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
};

// Direction-aware Question Variants for Step-by-Step Questionnaire
// Forward (direction > 0): enters from right (+15px), exits to left (-15px)
// Backward (direction < 0): enters from left (-15px), exits to right (+15px)
export const questionVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 15 : -15,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: transitions.questionSlide,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -15 : 15,
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

// Staggered Container for lists (results, criteria items)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.stagger,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
};

// Fast Stagger Container for short criteria lists
export const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.fastStagger,
  },
};

// Stagger Item (individual card in a list)
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
};

// Modal Backdrop Overlay
export const modalOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// Slide-Over Modal Panel (from right edge)
export const slideOverVariants: Variants = {
  hidden: {
    x: '100%',
    boxShadow: '0 0 0 rgba(0,0,0,0)',
  },
  visible: {
    x: 0,
    transition: transitions.smooth,
  },
  exit: {
    x: '100%',
    transition: { duration: 0.26, ease: [0.32, 0, 0.67, 0] },
  },
};

// Validation Error Shake (targeted to just the error alert)
export const errorShakeVariants: Variants = {
  initial: {
    opacity: 0,
    y: -6,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    x: [0, -3, 3, -2, 2, 0],
    transition: {
      duration: 0.32,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

// ── Added motion primitives ──────────────────────────────────────────────

// Restrained celebration glow for very high match scores (no confetti)
export const glowPulse: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: [0, 0.55, 0],
    scale: [0.85, 1.35, 1.5],
    transition: { duration: 1.1, ease: 'easeOut', delay: 0.35 },
  },
};

// Column-wise stagger for the comparison matrix
export const columnStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
};

export const columnStaggerItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.gentleSpring,
  },
};

// Winning cell highlight flash in the comparison matrix
export const winnerFlash: Variants = {
  hidden: { backgroundColor: 'rgba(22,163,74,0)' },
  visible: {
    backgroundColor: ['rgba(22,163,74,0)', 'rgba(22,163,74,0.16)', 'rgba(22,163,74,0.06)'],
    transition: { duration: 0.9, ease: 'easeOut', delay: 0.5 },
  },
};

// Toast slide-in for copy/share confirmations
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.gentleSpring },
  exit: { opacity: 0, y: 10, scale: 0.97, transition: transitions.fast },
};

// Field-level validation tick
export const validationTick: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.6, transition: transitions.micro },
};

// Direction-aware page variants. Forward navigation slides in from the right,
// back navigation slides in from the left — the classic native-app feel.
// Receives the direction (-1 | 0 | 1) via the `custom` prop. Direction 0
// (including the results <-> scheme-detail shared-layout morph) keeps the
// neutral fade from pageVariants so the two systems never fight.
export const directionalPageVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : 40 * direction,
    y: direction === 0 ? 8 : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: transitions.page,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : -40 * direction,
    y: direction === 0 ? -8 : 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  }),
};

// Scheme detail hero entrance choreography. The hero arrives as a sequence —
// badges, then title block, then the gauge/actions column — instead of one
// flat fade.
export const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// Nested stagger container for the hero's left column: fades up as one item
// of the hero sequence while cascading its own children.
export const heroNested: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};
