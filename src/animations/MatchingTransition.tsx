import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, CheckCircle2, Cpu, Scale, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';

interface MatchingTransitionProps {
  onComplete: () => void;
  totalSchemesCount?: number;
}

interface StepItem {
  id: string;
  labelEn: string;
  labelHi: string;
  icon: React.ElementType;
}

export const MatchingTransition: React.FC<MatchingTransitionProps> = ({
  onComplete,
  totalSchemesCount = 39,
}) => {
  const { lang, t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const isHindi = lang === 'hi';

  const steps: StepItem[] = [
    {
      id: 'profile',
      labelEn: 'Analyzing enterprise profile & statutory factors',
      labelHi: 'उद्यम प्रोफाइल और वैधानिक मानदंडों का विश्लेषण',
      icon: Cpu,
    },
    {
      id: 'eligibility',
      labelEn: 'Evaluating Central & State scheme guidelines',
      labelHi: 'केंद्रीय एवं राज्य योजना दिशानिर्देशों का मूल्यांकन',
      icon: Scale,
    },
    {
      id: 'ranking',
      labelEn: `Scoring & ranking ${totalSchemesCount} entrepreneur schemes`,
      labelHi: `${totalSchemesCount} उद्यम योजनाओं की रैंकिंग और मिलान`,
      icon: ShieldCheck,
    },
    {
      id: 'ready',
      labelEn: 'Personalized recommendations ready!',
      labelHi: 'आपकी व्यक्तिगत अनुशंसाएं तैयार हैं!',
      icon: Sparkles,
    },
  ];

  const [activeStepIdx, setActiveStepIdx] = useState(0);

  useEffect(() => {
    // If reduced motion is enabled, finish very fast
    if (shouldReduceMotion) {
      const fastTimer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(fastTimer);
    }

    // Step pacing: total ~1.6s
    // Step 0: 0 - 380ms
    // Step 1: 380 - 800ms
    // Step 2: 800 - 1250ms
    // Step 3: 1250 - 1600ms -> onComplete()
    const t1 = setTimeout(() => setActiveStepIdx(1), 400);
    const t2 = setTimeout(() => setActiveStepIdx(2), 850);
    const t3 = setTimeout(() => setActiveStepIdx(3), 1300);
    const tEnd = setTimeout(() => onComplete(), 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tEnd);
    };
  }, [onComplete, shouldReduceMotion]);

  const progressPercent = Math.min(100, Math.round(((activeStepIdx + 1) / steps.length) * 100));

  return (
    <motion.div
      id="matching-transition-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#FAFAF9]/95 dark:bg-[#101613]/95 backdrop-blur-md flex items-center justify-center p-4 transition-colors"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#151C19] rounded-xl border border-[#E2E2E0] dark:border-[#24342D] p-6 sm:p-8 shadow-xl text-center">
        {/* Emblem & Animated Pulse */}
        <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-[#16A34A]/20 dark:bg-[#4ADE80]/20"
            animate={shouldReduceMotion ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative w-12 h-12 rounded-full bg-[#14453D] dark:bg-[#1C5045] text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-[#4ADE80]" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-1">
          {isHindi ? 'योजना सेतु मिलान इंजन' : 'Matching Schemes For You'}
        </h2>
        <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mb-6">
          {isHindi
            ? 'आपकी पात्रता के अनुसार योजनाओं की जांच की जा रही है'
            : 'Analyzing your profile against verified government schemes'}
        </p>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-[#EEEEED] dark:bg-[#202B26] h-2 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-[#14453D] dark:bg-[#4ADE80] rounded-full"
            initial={{ width: '15%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Active Steps List */}
        <div className="space-y-2.5 text-left mb-4">
          {steps.map((step, idx) => {
            const isDone = idx < activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-colors duration-200 ${
                  isCurrent
                    ? 'bg-[#D4EFE1]/50 dark:bg-[#1A382D]/50 border-[#16A34A]/40 text-[#14453D] dark:text-[#A7F3D0] font-semibold'
                    : isDone
                    ? 'bg-[#FAFAF9] dark:bg-[#121915] border-[#E2E2E0]/60 dark:border-[#202B26] text-[#6F7A73] dark:text-[#8E9F97]'
                    : 'bg-transparent border-transparent text-[#9EB0A7] dark:text-[#4A5D54] opacity-50'
                }`}
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Icon className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
                    </motion.div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-700" />
                  )}
                </div>
                <span className="truncate">{isHindi ? step.labelHi : step.labelEn}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Subtitle / Footnote */}
        <div className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] flex items-center justify-center gap-1.5 pt-2 border-t border-[#E2E2E0]/60 dark:border-[#24342D]/60">
          <span>{isHindi ? 'नियम-आधारित निष्पक्ष मिलान' : 'Deterministic, gazette-verified matching'}</span>
        </div>
      </div>
    </motion.div>
  );
};
