import React, { useEffect, useState, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

export interface AnimatedScoreProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
  id?: string;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  value,
  duration = 0.6,
  suffix = '%',
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : Math.round(value)));
  const [displayValue, setDisplayValue] = useState<number>(shouldReduceMotion ? clampedValue : 0);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(clampedValue);
      prevValueRef.current = clampedValue;
      return;
    }

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
  }, [clampedValue, duration, shouldReduceMotion]);

  return (
    <span id={id} className={`inline-block tabular-nums font-bold ${className}`}>
      {displayValue}
      {suffix}
    </span>
  );
};
