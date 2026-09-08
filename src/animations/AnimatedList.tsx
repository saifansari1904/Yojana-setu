import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, staggerItem, fastStaggerContainer } from './variants';
import { reducedMotionTransition } from './transitions';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  fast?: boolean;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  id,
  fast = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      variants={shouldReduceMotion ? undefined : fast ? fastStaggerContainer : staggerContainer}
      initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
      animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
      transition={shouldReduceMotion ? reducedMotionTransition : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      variants={shouldReduceMotion ? undefined : staggerItem}
      initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
      animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
      transition={shouldReduceMotion ? reducedMotionTransition : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
};
