import React, { useEffect, useState, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

interface AnimatedScoreProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
  id?: string;
  /**
   * When true (default) the count-up only starts once the score scrolls into
   * view, so long lists animate as the user reaches them instead of all at
   * once off-screen. Set to false to count up immediately on mount.
   */
  startOnView?: boolean;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  value,
  duration = 0.6,
  suffix = '%',
  className = '',
  id,
  startOnView = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // once: true keeps the number stable after the first reveal (no re-counting).
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const clampedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : Math.round(value)));
  const [displayValue, setDisplayValue] = useState<number>(shouldReduceMotion ? clampedValue : 0);
  const prevValueRef = useRef<number>(0);

  const shouldStart = !startOnView || isInView;

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(clampedValue);
      prevValueRef.current = clampedValue;
      return;
    }

    if (!shouldStart) return;

    const start = prevValueRef.current;
    const controls = animate(start, clampedValue, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
      onComplete: () => {
        prevValueRef.current = clampedValue;
      },
    });

    return () => controls.stop();
  }, [clampedValue, duration, shouldReduceMotion, shouldStart]);

  return (
    <span ref={ref} id={id} className={`inline-block tabular-nums font-bold ${className}`}>
      {displayValue}
      {suffix}
    </span>
  );
};
