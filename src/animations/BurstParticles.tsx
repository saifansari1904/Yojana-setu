import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface BurstParticlesProps {
  active: boolean;
  count?: number;
  radius?: number;
  color?: string;
}

/**
 * Small radial spark burst for confirmation micro-interactions
 * (saving a scheme, completing a checklist item).
 * Purely decorative and skipped under prefers-reduced-motion.
 */
export const BurstParticles: React.FC<BurstParticlesProps> = ({
  active,
  count = 6,
  radius = 14,
  color = '#16A34A',
}) => {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {active && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0.9, scale: 1, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 0.4, x, y }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: color }}
                className="absolute w-1 h-1 rounded-full"
              />
            );
          })}
        </span>
      )}
    </AnimatePresence>
  );
};
