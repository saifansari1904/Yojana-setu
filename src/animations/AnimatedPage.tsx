import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion, useIsPresent } from 'motion/react';
import { pageVariants, directionalPageVariants } from './variants';
import { reducedMotionTransition } from './transitions';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /**
   * Navigation direction: 1 = forward (slides in from the right),
   * -1 = back (slides in from the left), 0 = neutral fade.
   * Keep 0 for transitions driven by shared-layout morphing
   * (results <-> scheme-detail) so the two systems never fight.
   *
   * Captured once at mount (enterDirectionRef): the exit trajectory must
   * follow the screen's OWN enter direction, never a navigation that lands
   * while it is exiting. The global navDirection is updated by a separate
   * effect AFTER the navigation commits; if the exiting screen re-resolved
   * its `exit` variant (or switched variant sets) against the new direction
   * mid-exit, the animation could be retargeted and stall — freezing the
   * app on a faded screen. Freezing at mount eliminates that hazard while
   * preserving the directional design.
   */
  direction?: number;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = '',
  id,
  direction = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isPresent = useIsPresent();
  const enterDirectionRef = useRef(direction);
  const enterDirection = enterDirectionRef.current;

  /**
   * Safety net against stalled enter animations.
   * If the motion enter animation fails to complete (e.g., variant resolution
   * stalls and the page gets stuck at opacity: 0), fall back to a plain
   * non-animated div so the content is always visible. The timer is cancelled
   * when the animation completes normally.
   */
  const [animationFailed, setAnimationFailed] = useState(false);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    failTimerRef.current = setTimeout(() => setAnimationFailed(true), 1000);
    return () => {
      if (failTimerRef.current) clearTimeout(failTimerRef.current);
    };
  }, []);

  const handleAnimationComplete = () => {
    if (failTimerRef.current) {
      clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }
  };

  /**
   * Safety net against stalled exit animations.
   * In AnimatePresence mode="sync", a stuck exiting screen never unmounts and
   * can interfere with the entering screen's painting. If exit takes longer
   * than 1s, force display:none to remove it from layout.
   */
  const [exitStalled, setExitStalled] = useState(false);
  useEffect(() => {
    if (isPresent) {
      setExitStalled(false);
      return;
    }
    const t = setTimeout(() => setExitStalled(true), 1000);
    return () => clearTimeout(t);
  }, [isPresent]);

  if (animationFailed) {
    return (
      <div id={id} className={`w-full ${className}`}>
        {children}
      </div>
    );
  }

  const exitStyle = exitStalled ? { display: 'none' } : undefined;

  if (shouldReduceMotion) {
    return (
      <motion.div
        id={id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reducedMotionTransition}
        onAnimationComplete={handleAnimationComplete}
        className={`w-full ${className}`}
        style={exitStyle}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      id={id}
      custom={enterDirection}
      variants={enterDirection === 0 ? pageVariants : directionalPageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onAnimationComplete={handleAnimationComplete}
      className={`w-full ${className}`}
      style={exitStyle}
    >
      {children}
    </motion.div>
  );
};
// Force fresh Vercel build
