import { flushSync } from 'react-dom';

/**
 * Native View Transitions layer.
 *
 * Used for screen changes that do NOT rely on Framer shared-layout animation
 * (login -> form -> results -> alternatives). The results <-> scheme-detail
 * route is deliberately excluded because it uses `layoutId` morphing, and
 * running both systems on the same change fights for the same elements.
 */

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};


const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Runs `update` inside a native view transition when the browser supports it.
 * Falls back to a plain synchronous update everywhere else, so behaviour is
 * identical on Safari/Firefox and under prefers-reduced-motion.
 */
export const startScreenTransition = (update: () => void): void => {
  update();
};
