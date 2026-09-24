import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { transitions } from '../../animations';
import { BusinessJourneyStage, BUSINESS_JOURNEY_STAGES } from '../../types/business';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

interface JourneyProgressProps {
  currentStage: BusinessJourneyStage;
  id?: string;
  className?: string;
}

const COPY = {
  sectionTitle: {
    en: 'Your business journey',
    hi: 'आपकी व्यावसायिक यात्रा',
    ta: 'உங்கள் வணிகப் பயணம்',
    te: 'మీ వ్యాపార ప్రయాణం',
    kn: 'ನಿಮ್ಮ ವ್ಯವಹಾರ ಪಯಣ',
    ml: 'നിങ്ങളുടെ ബിസിനസ്സ് യാത്ര',
    mr: 'तुमचा व्यवसाय प्रवास',
  },
  youAreHere: {
    en: '← You are here',
    hi: '← आप यहां हैं',
    ta: '← நீங்கள் இங்கே உள்ளீர்கள்',
    te: '← మీరు ఇక్కడ ఉన్నారు',
    kn: '← ನೀವು ಇಲ್ಲಿದ್ದೀರಿ',
    ml: '← നിങ്ങൾ ഇവിടെയാണ്',
    mr: '← तुम्ही येथे आहात',
  },
  completed: {
    en: 'completed',
    hi: 'पूर्ण',
    ta: 'முடிந்தது',
    te: 'పూర్తయింది',
    kn: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    ml: 'പൂർത്തിയായി',
    mr: 'पूर्ण',
  },
};

const STAGE_LABELS: Record<BusinessJourneyStage, Record<Language, string>> = {
  IDEA: {
    en: 'Conceive Idea',
    hi: 'विचार निर्माण',
    ta: 'யோசனை உருவாக்கம்',
    te: 'ఆలోచన సృష్టి',
    kn: 'ಯೋಜನೆ ಕಲ್ಪನೆ',
    ml: 'ആശയം രൂപീകരിക്കൽ',
    mr: 'कल्पना तयार करा',
  },
  VALIDATE: {
    en: 'Validate Market',
    hi: 'बाजार सत्यापन',
    ta: 'சந்தை சரிபார்ப்பு',
    te: 'మార్కెట్ ధృవీకరణ',
    kn: 'ಮಾರುಕಟ್ಟೆ ಪರಿಶೀಲನೆ',
    ml: 'വിപണി സാധൂകരണം',
    mr: 'बाजारपेठ प्रमाणीकरण',
  },
  REGISTER: {
    en: 'Formalize Entity',
    hi: 'पंजीकरण',
    ta: 'பதிவு செய்தல்',
    te: 'నమోదు',
    kn: 'ನೋಂದಣಿ',
    ml: 'രജിസ്ട്രേഷൻ',
    mr: 'नोंदणी',
  },
  FUND: {
    en: 'Secure Funding',
    hi: 'पूंजी व्यवस्था',
    ta: 'நிதி திரட்டுதல்',
    te: 'నిధుల సేకరణ',
    kn: 'ನಿಧಿ ಸಂಗ್ರಹ',
    ml: 'ഫണ്ട് സമാഹരണം',
    mr: 'भांडवल उभारणी',
  },
  LAUNCH: {
    en: 'Launch Enterprise',
    hi: 'उद्यम शुरुआत',
    ta: 'தொழில் தொடங்குதல்',
    te: 'ప్రారంభం',
    kn: 'ಉದ್ಯಮ ಪ್ರಾರಂಭ',
    ml: 'ആരംഭം',
    mr: 'उपक्रम प्रारंभ',
  },
  OPERATE: {
    en: 'Daily Operations',
    hi: 'दैनिक संचालन',
    ta: 'தினசரி செயல்பாடுகள்',
    te: 'రోజువారీ కార్యకలాపాలు',
    kn: 'ದೈನಂದಿನ ಕಾರ್ಯಾಚರಣೆ',
    ml: 'പ്രവർത്തനങ്ങൾ',
    mr: 'दैनंदिन कामकाज',
  },
  GROW: {
    en: 'Revenue Growth',
    hi: 'व्यवसाय वृद्धि',
    ta: 'வருவாய் வளர்ச்சி',
    te: 'ఆదాయ వృద్ధి',
    kn: 'ಆದಾಯ ಬೆಳವಣಿಗೆ',
    ml: 'വളർച്ച',
    mr: 'व्यवसाय वाढ',
  },
  EXPAND: {
    en: 'Scale & Expand',
    hi: 'बृहद विस्तार',
    ta: 'விரிவாக்கம்',
    te: 'విస్తరణ',
    kn: 'ವಿಸ್ತರಣೆ',
    ml: 'വിപുಲീകരണം',
    mr: 'विस्तार',
  },
};

/**
 * Phase 4.2 — Visual business journey tracker.
 * Renders the existing canonical journey (Idea → Expand) and emphasises the
 * entrepreneur's current position. No new stage model is introduced here.
 */
export const JourneyProgress: React.FC<JourneyProgressProps> = ({
  currentStage,
  id,
  className = '',
}) => {
  const { lang } = useTranslation();
  const l: Language = (lang in COPY.sectionTitle) ? lang : 'en';
  const shouldReduceMotion = useReducedMotion();

  const title = COPY.sectionTitle[l];
  const youAreHereText = COPY.youAreHere[l];
  const completedText = COPY.completed[l];

  const currentIndex = BUSINESS_JOURNEY_STAGES.findIndex((s) => s.stage === currentStage);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progressPercent =
    (safeIndex / Math.max(BUSINESS_JOURNEY_STAGES.length - 1, 1)) * 100;

  return (
    <section
      id={id}
      aria-label={title}
      className={`rounded-2xl border border-[#E4E8E4] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] p-4 sm:p-5 ${className}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[var(--text-secondary)] mb-4">
        {title}
      </h3>

      {/* Progress rail */}
      <div className="relative mb-4" aria-hidden="true">
        <div className="h-1 w-full rounded-full bg-[#E4E8E4] dark:bg-[var(--bg-raised)]" />
        <motion.div
          className="absolute left-0 top-0 h-1 rounded-full bg-[#175741]"
          initial={shouldReduceMotion ? false : { width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={shouldReduceMotion ? { duration: 0.01 } : transitions.smooth}
        />
      </div>

      <ol className="flex flex-wrap gap-2 sm:gap-2.5" role="list">
        {BUSINESS_JOURNEY_STAGES.map((stage, index) => {
          const isCurrent = stage.stage === currentStage;
          const isPast = index < safeIndex;
          const label = STAGE_LABELS[stage.stage]?.[l] || resolveLocalizedPair(stage.labelEn, stage.labelHi, l);

          return (
            <li key={stage.stage}>
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px]',
                  isCurrent
                    ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#23584E] shadow-xs'
                    : isPast
                      ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#1E6A50] dark:text-[var(--accent-green)] border-[#B2CDBF] dark:border-[#285743]'
                      : 'bg-transparent text-[#3F4943] dark:text-[var(--text-secondary)] border-[#E4E8E4] dark:border-[var(--border-subtle)]',
                ].join(' ')}
              >
                {label}
                {/* Status is never conveyed by colour alone. */}
                {isCurrent && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {youAreHereText}
                  </span>
                )}
                {isPast && <span className="sr-only">{completedText}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default JourneyProgress;
