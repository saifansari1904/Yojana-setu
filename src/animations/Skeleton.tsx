import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  rounded?: string;
}

/**
 * Shimmering placeholder block. Uses a travelling highlight instead of a
 * pulsing opacity so long lists feel like loading content, not flashing boxes.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'rounded' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[#EEEEED] dark:bg-[#1E2924] ${rounded} ${className}`}
    >
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 dark:via-white/10 to-transparent"
          initial={{ x: '-150%' }}
          animate={{ x: '250%' }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        />
      )}
    </div>
  );
};

/**
 * Mirrors the real scheme card layout (gauge on the left, text block on the
 * right) so results do not jump when data arrives.
 */
const SchemeCardSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : index * 0.08 }}
      className="yj-card p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:w-32">
          <Skeleton className="w-[66px] h-[66px]" rounded="rounded-full" />
          <Skeleton className="w-20 h-4" />
        </div>
        <div className="flex-1 w-full space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </motion.div>
  );
};

