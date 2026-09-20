import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface AnimatedCounterProps {
  value: number | string;
  className?: string;
  id?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span id={id} className={`inline-block tabular-nums ${className}`}>{value}</span>;
  }

  return (
    <span
      id={id}
      className={`relative inline-flex items-center overflow-hidden tabular-nums ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
