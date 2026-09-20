import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { pageVariants } from './variants';
import { reducedMotionTransition } from './transitions';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      variants={shouldReduceMotion ? undefined : pageVariants}
      initial={shouldReduceMotion ? { opacity: 0 } : 'initial'}
      animate={shouldReduceMotion ? { opacity: 1 } : 'animate'}
      exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
      transition={shouldReduceMotion ? reducedMotionTransition : undefined}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
