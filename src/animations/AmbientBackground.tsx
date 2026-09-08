import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const AmbientBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-30"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#D4EFE1]/40 dark:bg-[#143D32]/25 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-[#E5F3EC]/30 dark:bg-[#0F2D25]/20 blur-3xl" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Top-Right Soft Emerald Ambient Orb */}
      <motion.div
        animate={{
          x: [0, 25, 0, -20, 0],
          y: [0, -20, 15, 0],
          opacity: [0.35, 0.45, 0.35],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-radial from-[#D4EFE1]/50 to-transparent dark:from-[#17483B]/20 dark:to-transparent blur-3xl"
      />

      {/* Mid-Left Subtle Sage Ambient Orb */}
      <motion.div
        animate={{
          x: [0, -20, 15, 0],
          y: [0, 25, -15, 0],
          opacity: [0.25, 0.35, 0.25],
        }}
        transition={{
          repeat: Infinity,
          duration: 22,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 -left-32 w-[28rem] h-[28rem] rounded-full bg-radial from-[#E2F0EA]/40 to-transparent dark:from-[#0F3329]/15 dark:to-transparent blur-3xl"
      />

      {/* Bottom Subtle Center Glow */}
      <motion.div
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 16,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[36rem] h-[24rem] rounded-full bg-radial from-[#DFF2E9]/45 to-transparent dark:from-[#143E33]/15 dark:to-transparent blur-3xl"
      />
    </div>
  );
};
