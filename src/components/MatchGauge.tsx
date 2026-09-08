import React, { useEffect, useState, useRef } from 'react';
import { motion, animate, useReducedMotion } from 'motion/react';
import { useTranslation } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

interface MatchGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
  id?: string;
}

export const MatchGauge: React.FC<MatchGaugeProps> = ({
  percentage,
  size = 72,
  strokeWidth = 6,
  showLabel = true,
  className = '',
  id,
}) => {
  const { lang } = useTranslation();
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const clampedPercent = Math.min(100, Math.max(0, isNaN(percentage) ? 0 : Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Smooth number count-up state
  const [displayPercent, setDisplayPercent] = useState<number>(shouldReduceMotion ? clampedPercent : 0);
  const prevPercentRef = useRef<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayPercent(clampedPercent);
      prevPercentRef.current = clampedPercent;
      return;
    }

    const startVal = prevPercentRef.current;
    const controls = animate(startVal, clampedPercent, {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (val) => setDisplayPercent(Math.round(val)),
      onComplete: () => {
        prevPercentRef.current = clampedPercent;
      },
    });

    return () => controls.stop();
  }, [clampedPercent, shouldReduceMotion]);

  // Determine tone
  const isHighMatch = clampedPercent >= 75;
  const isMediumMatch = clampedPercent >= 50 && clampedPercent < 75;

  const strokeColor = isDark
    ? isHighMatch
      ? '#34D399' // Bright mint
      : isMediumMatch
      ? '#86B5A1' // Sage
      : '#F87171' // Coral red
    : isHighMatch
    ? '#0F6B4C' // Emerald
    : isMediumMatch
    ? '#4B6459' // Secondary Slate Green
    : '#C2603F'; // Terracotta

  const bgColor = isDark
    ? isHighMatch
      ? '#173629'
      : isMediumMatch
      ? '#24342D'
      : '#3B1F1A'
    : isHighMatch
    ? '#D4EFE1' // Soft mint track
    : isMediumMatch
    ? '#E2E2E0'
    : '#FFDAD6';

  const matchLabelText = lang === 'hi' ? 'पात्रता' : 'Match';

  return (
    <div
      id={id || `match-gauge-${clampedPercent}`}
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={clampedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Eligibility match score: ${clampedPercent}%`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="rotate-[-90deg] transform"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Smooth animated progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: shouldReduceMotion ? strokeDashoffset : circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Animated Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2] leading-none tabular-nums"
            style={{ fontSize: size > 80 ? '22px' : size > 60 ? '16px' : '13px' }}
          >
            {displayPercent}%
          </span>
          {size >= 70 && (
            <span className="text-[9px] uppercase tracking-wider font-semibold text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
              {matchLabelText}
            </span>
          )}
        </div>
      </div>

      {showLabel && size > 90 && (
        <span
          className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded ${
            isHighMatch
              ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#34D399]'
              : isMediumMatch
              ? 'bg-[#E2E2E0] dark:bg-[#24342D] text-[#3F4943] dark:text-[#C5D5CC]'
              : 'bg-[#FFDAD6] dark:bg-[#3D1A14] text-[#C2603F] dark:text-[#F87171]'
          }`}
        >
          {isHighMatch
            ? lang === 'hi'
              ? 'उच्च पात्रता'
              : 'High Eligibility'
            : isMediumMatch
            ? lang === 'hi'
              ? 'आंशिक मिलान'
              : 'Partial Match'
            : lang === 'hi'
            ? 'शर्त शेष'
            : 'Gap Criteria'}
        </span>
      )}
    </div>
  );
};
