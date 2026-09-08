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

// Subtle Fade Down
export const fadeDown: Variants = {
  hidden: {
    opacity: 0,
    y: -12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: transitions.fast,
  },
};

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
// Forward (direction > 0): enters from right (+24px), exits to left (-24px)
// Backward (direction < 0): enters from left (-24px), exits to right (+24px)
export const questionVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: transitions.questionSlide,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
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
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
};

// Micro-interaction presets (hover, tap)
export const cardInteractive = {
  whileHover: {
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  whileTap: {
    scale: 0.99,
  },
};

export const buttonInteractive = {
  whileHover: {
    y: -1,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  whileTap: {
    scale: 0.98,
  },
};

export const iconInteractive = {
  whileHover: {
    scale: 1.08,
    transition: { duration: 0.15 },
  },
  whileTap: {
    scale: 0.94,
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
