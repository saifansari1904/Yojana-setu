import React from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'motion/react';

interface ScrollProgressBarProps {
  /** Only show the bar when the page is actually long enough to scroll */
  minScrollPx?: number;
  className?: string;
}

/**
 * Thin reading-progress bar pinned under the header.
 * Scroll-linked (not time-based), spring-smoothed, and disabled under
 * prefers-reduced-motion.
 */
export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({
  minScrollPx = 600,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 34,
    restDelta: 0.001,
  });

  const [isScrollable, setIsScrollable] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      const doc = document.documentElement;
      setIsScrollable(doc.scrollHeight - window.innerHeight > minScrollPx);
    };
    check();
    window.addEventListener('resize', check);
    const interval = window.setInterval(check, 800);
    return () => {
      window.removeEventListener('resize', check);
      window.clearInterval(interval);
    };
  }, [minScrollPx]);

  if (shouldReduceMotion || !isScrollable) return null;

  return (
    <motion.div
      id="scroll-progress-bar"
      aria-hidden="true"
      style={{ scaleX }}
      className={`fixed top-0 left-0 right-0 z-50 h-[3px] origin-left bg-gradient-to-r from-[#14453D] via-[#1E6A50] to-[#1E6A50] ${className}`}
    />
  );
};
