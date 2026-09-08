import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { YojanaSetuLogo } from '../components/YojanaSetuLogo';

interface SetuLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const SetuLoader: React.FC<SetuLoaderProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const dimensions = {
    sm: { container: 'w-10 h-10', iconSize: 18, ringWidth: 2 },
    md: { container: 'w-16 h-16', iconSize: 28, ringWidth: 2.5 },
    lg: { container: 'w-24 h-24', iconSize: 42, ringWidth: 3 },
  }[size];

  return (
    <div
      className={`inline-flex flex-col items-center justify-center gap-3 select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`relative flex items-center justify-center ${dimensions.container}`}>
        {/* Subtle Outer Glowing Ring Track */}
        <div className="absolute inset-0 rounded-full border border-[#D4EFE1] dark:border-[#1A382D]" />

        {/* Animated Rotating Green Accent Arc */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { rotate: 360 }}
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  repeat: Infinity,
                  duration: 1.4,
                  ease: 'linear',
                }
          }
          className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#16A34A] dark:border-[#4ADE80] opacity-90"
        />

        {/* Center Setu Emblem */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { scale: [0.96, 1.02, 0.96] }}
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }
          }
          className="relative z-10 flex items-center justify-center"
        >
          <YojanaSetuLogo size={dimensions.iconSize} iconOnly={true} />
        </motion.div>
      </div>

      {label && (
        <p className="text-xs font-semibold tracking-wide text-[#14453D] dark:text-[#9EB0A7] animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};
