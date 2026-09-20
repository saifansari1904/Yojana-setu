import React from 'react';
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

  if (shouldReduceMotion) {
    return (
      <motion.div
        id={id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reducedMotionTransition}
        className={`w-full ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      id={id}
      custom={direction}
      variants={direction === 0 ? pageVariants : directionalPageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
