import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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

  if (animationFailed) {
    return (
      <div id={id} className={`w-full ${className}`}>
        {children}
      </div>
    );
  }

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
    >
      {children}
    </motion.div>
  );
};
