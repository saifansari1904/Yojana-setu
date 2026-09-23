import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RevealOnScroll } from '../../animations/RevealOnScroll';

/* ------------------------------------------------------------------ */
/* Animated flow connector: a short line with a travelling pulse dot.  */
/* Static when the user prefers reduced motion.                        */
/* ------------------------------------------------------------------ */
export const FlowConnector = ({ className = '' }: { className?: string }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto w-px h-7 bg-gradient-to-b from-[#1E6A50]/10 via-[#1E6A50]/50 to-[#1E6A50]/10 dark:from-[#4ADE80]/10 dark:via-[#4ADE80]/50 dark:to-[#4ADE80]/10 ${className}`}
    >
      {!shouldReduceMotion && (
        <motion.span
          className="absolute left-1/2 top-0 -ml-[3px] w-1.5 h-1.5 rounded-full bg-[#1E6A50] dark:bg-[#4ADE80]"
          animate={{ y: [0, 22] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Section heading block                                               */
/* ------------------------------------------------------------------ */
export const SectionHeading = ({
  title,
  subtitle,
  align = 'center',
}: {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) => (
  <RevealOnScroll
    className={`mb-10 sm:mb-12 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : 'text-left'}`}
  >
    <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] leading-snug mb-3">
      {title}
    </h2>
    {subtitle && (
      <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
        {subtitle}
      </p>
    )}
  </RevealOnScroll>
);

/* ------------------------------------------------------------------ */
/* Small uppercase eyebrow pill used inside visualizations              */
/* ------------------------------------------------------------------ */
export const VizEyebrow = ({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) => (
  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197] mb-3 flex items-center gap-2">
    {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
    {children}
  </p>
);
