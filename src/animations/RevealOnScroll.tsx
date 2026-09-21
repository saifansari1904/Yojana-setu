import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { transitions } from './transitions';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  distance?: number;
  delay?: number;
  amount?: number;
}

/**
 * Reveals a block once, the first time it scrolls into view.
 * Used on the long scheme-detail page so sections arrive as you read
 * instead of all animating on mount (which the user never sees).
 */
export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className = '',
  id,
  distance = 14,
  delay = 0,
  amount = 0.18,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ ...transitions.normal, delay }}
    >
      {children}
    </motion.div>
  );
};
