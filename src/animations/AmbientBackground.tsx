import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Ambient background system — "Premium Government Intelligence".
 *
 * Four stacked, non-interactive layers, cheapest first:
 *  1. page gradient (off-white → pale green-grey; deep green-black in dark)
 *  2. faint 64px grid, radially masked so it fades below the fold
 *  3. two very low-opacity emerald radial glows that drift slowly
 *  4. extremely subtle fractal grain for paper-like depth
 *
 * Only `transform` and `opacity` are animated, so the layers stay off the
 * layout/paint path. With `prefers-reduced-motion` the drifting glows are
 * replaced by static ones.
 */
export const AmbientBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 1 — Page gradient */}
      <div className="absolute inset-0 yj-ambient-page" />

      {/* 2 — Faint structural grid, masked to the upper viewport */}
      <div className="absolute inset-0 yj-ambient-grid" />

      {/* 3 — Ambient emerald glows */}
      {shouldReduceMotion ? (
        <>
          <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-[#D9E8DF]/35 dark:bg-[#122019]/20 blur-3xl" />
          <div className="absolute top-1/3 -left-40 w-[28rem] h-[28rem] rounded-full bg-[#E2F0EA]/30 dark:bg-[#122019]/15 blur-3xl" />
        </>
      ) : (
        <>
          <motion.div
            animate={{ x: [0, 24, 0, -18, 0], y: [0, -18, 14, 0], opacity: [0.32, 0.42, 0.32] }}
            transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
            className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-radial from-[#D9E8DF]/50 to-transparent dark:from-[#12463A]/22 dark:to-transparent blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -18, 14, 0], y: [0, 22, -14, 0], opacity: [0.22, 0.32, 0.22] }}
            transition={{ repeat: Infinity, duration: 24, ease: 'easeInOut' }}
            className="absolute top-1/3 -left-32 w-[28rem] h-[28rem] rounded-full bg-radial from-[#E2F0EA]/40 to-transparent dark:from-[#0F3329]/18 dark:to-transparent blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
            className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[36rem] h-[24rem] rounded-full bg-radial from-[#DFF2E9]/45 to-transparent dark:from-[#123B31]/16 dark:to-transparent blur-3xl"
          />
        </>
      )}

      {/* 4 — Grain */}
      <div className="absolute inset-0 yj-ambient-grain" />
    </div>
  );
};
