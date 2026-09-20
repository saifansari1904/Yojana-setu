import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface SuccessCheckmarkProps {
  size?: number;
  className?: string;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  size = 24,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 24 }}
      className={`inline-flex items-center justify-center rounded-full bg-[#175741] dark:bg-[#22C55E] text-white shadow-xs ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Success"
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M 4 12 L 9 17 L 20 6"
          initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  );
};
