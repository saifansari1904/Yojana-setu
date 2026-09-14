import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BUSINESS_JOURNEY_STAGES, BusinessJourneyStage } from '../../types/business';
import { useTranslation } from '../../i18n';
import { transitions } from '../../animations/transitions';

interface JourneyProgressProps {
  currentStage: BusinessJourneyStage;
  id?: string;
  className?: string;
}

/**
 * Phase 4.2 — Business journey rail.
 * Renders the existing canonical journey (Idea → Expand) and emphasises the
 * entrepreneur's current position. No new stage model is introduced here.
 */
export const JourneyProgress: React.FC<JourneyProgressProps> = ({
  currentStage,
  id,
  className = '',
}) => {
  const { lang } = useTranslation();
  const isHi = lang === 'hi';
  const shouldReduceMotion = useReducedMotion();

  const currentIndex = BUSINESS_JOURNEY_STAGES.findIndex((s) => s.stage === currentStage);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progressPercent =
    (safeIndex / Math.max(BUSINESS_JOURNEY_STAGES.length - 1, 1)) * 100;

  return (
    <section
      id={id}
      aria-label={isHi ? 'आपकी व्यावसायिक यात्रा' : 'Your business journey'}
      className={`rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4 sm:p-5 ${className}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7] mb-4">
        {isHi ? 'आपकी व्यावसायिक यात्रा' : 'Your business journey'}
      </h3>

      {/* Progress rail */}
      <div className="relative mb-4" aria-hidden="true">
        <div className="h-1 w-full rounded-full bg-[#E2E2E0] dark:bg-[#24342D]" />
        <motion.div
          className="absolute left-0 top-0 h-1 rounded-full bg-[#16A34A]"
          initial={shouldReduceMotion ? false : { width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={shouldReduceMotion ? { duration: 0.01 } : transitions.smooth}
        />
      </div>

      <ol className="flex flex-wrap gap-2 sm:gap-2.5" role="list">
        {BUSINESS_JOURNEY_STAGES.map((stage, index) => {
          const isCurrent = stage.stage === currentStage;
          const isPast = index < safeIndex;
          const label = isHi ? stage.labelHi : stage.labelEn;

          return (
            <li key={stage.stage}>
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px]',
                  isCurrent
                    ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#23584E] shadow-xs'
                    : isPast
                      ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]'
                      : 'bg-transparent text-[#3F4943] dark:text-[#9EB0A7] border-[#E2E2E0] dark:border-[#24342D]',
                ].join(' ')}
              >
                {label}
                {/* Status is never conveyed by colour alone. */}
                {isCurrent && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {isHi ? '← आप यहां हैं' : '← You are here'}
                  </span>
                )}
                {isPast && <span className="sr-only">{isHi ? 'पूर्ण' : 'completed'}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default JourneyProgress;
