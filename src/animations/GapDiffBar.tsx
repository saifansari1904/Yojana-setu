import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface GapDiffBarProps {
  /** Label for the left (applicant) value */
  yourLabel: string;
  /** Label for the right (statutory) value */
  requiredLabel: string;
  yourValue: string;
  requiredValue: string;
  /** 0-1 fill representing how close the applicant is to the requirement */
  closeness?: number;
  id?: string;
}

/**
 * Animated "you are here / you need to be here" bar for unmet criteria.
 * The fill grows from the applicant value toward the statutory requirement so
 * the size of the gap is visible, not just stated in text.
 */
export const GapDiffBar: React.FC<GapDiffBarProps> = ({
  yourLabel,
  requiredLabel,
  yourValue,
  requiredValue,
  closeness = 0.45,
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const pct = Math.min(0.96, Math.max(0.04, closeness)) * 100;

  return (
    <div id={id} className="mt-2.5">
      <div className="flex items-end justify-between gap-3 mb-1.5 text-[11px]">
        <div className="min-w-0">
          <span className="block text-[#516A5F] dark:text-[var(--text-tertiary)]">{yourLabel}</span>
          <strong className="block truncate text-[#1A1C1B] dark:text-[var(--text-main)]">{yourValue}</strong>
        </div>
        <div className="min-w-0 text-right">
          <span className="block text-[#516A5F] dark:text-[var(--text-tertiary)]">{requiredLabel}</span>
          <strong className="block truncate text-amber-800 dark:text-amber-300">{requiredValue}</strong>
        </div>
      </div>

      <div className="relative h-2 w-full rounded-full bg-[#EEEEED] dark:bg-[var(--bg-raised)] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#14453D] to-[#1E6A50] dark:from-[#22C55E] dark:to-[#4ADE80]"
          initial={shouldReduceMotion ? { width: `${pct}%` } : { width: '0%' }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-y-0 right-0 w-[2px] bg-amber-500 dark:bg-amber-400" />
      </div>
    </div>
  );
};
