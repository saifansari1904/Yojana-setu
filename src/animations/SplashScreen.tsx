import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { YojanaSetuLogo } from '../components/YojanaSetuLogo';
import { useTranslation } from '../i18n';
import { Language } from '../i18n/types';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

const SPLASH_I18N: Record<Language, { motto: string; description: string; loading: string }> = {
  en: {
    motto: 'Right Scheme • Right Support • Right Pathway',
    description: 'Connecting marginalized entrepreneurs to eligible schemes',
    loading: 'Loading portal...',
  },
  hi: {
    motto: 'सही योजना • सही सहायता • सही रास्ता',
    description: 'नागरिक सशक्तिकरण एवं पात्रता सेतु',
    loading: 'लोड हो रहा है...',
  },
  ta: {
    motto: 'சரியான திட்டம் • சரியான ஆதரவு • சரியான பாதை',
    description: 'தொழில்முனைவோரை தகுதியான திட்டங்களுடன் இணைக்கிறது',
    loading: 'இணையதளம் ஏற்றப்படுகிறது...',
  },
  te: {
    motto: 'సరైన పథకం • సరైన మద్దతు • సరైన మార్గం',
    description: 'ఔత్సాహిక పారిశ్రామికవేత్తలను అర్హతగల పథకాలతో అనుసంధానిస్తుంది',
    loading: 'పోర్టల్ లోడ్ అవుతోంది...',
  },
  kn: {
    motto: 'ಸರಿಯಾದ ಯೋಜನೆ • ಸರಿಯಾದ ಬೆಂಬಲ • ಸರಿಯಾದ ದಾರಿ',
    description: 'ಉದ್ಯಮಿಗಳನ್ನು ಅರ್ಹ ಯೋಜನೆಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ',
    loading: 'ಪೋರ್ಟಲ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  },
  ml: {
    motto: 'ശരിയായ പദ്ധതി • ശരിയായ പിന്തുണ • ശരിയായ വഴി',
    description: 'സംരംഭകരെ അർഹമായ പദ്ധതികളുമായി ബന്ധിപ്പിക്കുന്നു',
    loading: 'പോർട്ടൽ ലോഡുചെയ്യുന്നു...',
  },
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, minDuration = 1500 }) => {
  const { lang, t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const copy = SPLASH_I18N[lang] || SPLASH_I18N.en;

  useEffect(() => {
    // If user prefers reduced motion, complete almost immediately
    if (shouldReduceMotion) {
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }

    // Standard splash duration ~ 1.7 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1500);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, 1850);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete, shouldReduceMotion]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onComplete, 200);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="yojana-setu-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          onClick={handleSkip}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFAF9] dark:bg-[#0B1512] px-6 select-none cursor-pointer"
          role="dialog"
          aria-label="Yojana Setu Gateway Initializing"
        >
          {/* Subtle Ambient Radial Center Glow */}
          <div className="absolute w-72 h-72 rounded-full bg-[#D4EFE1]/50 dark:bg-[#16A34A]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
            {/* 1. Logo fades & scales in */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-4 flex items-center justify-center"
            >
              {/* Subtle Glowing Pulse Behind Emblem */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.6, 0.3], scale: [0.9, 1.15, 1] }}
                transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-[#34D399]/20 blur-xl"
              />
              <YojanaSetuLogo size="lg" showTaglines={false} showEnglishPill={false} />
            </motion.div>

            {/* 2. Brand Subtitle & Portal Header */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="space-y-1"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4EFE1] dark:bg-[#153428] text-[#14453D] dark:text-[#34D399] text-[11px] font-bold tracking-wider uppercase">
                <span>{t('common.citizenPortal')}</span>
              </div>

              <p className="text-sm font-semibold text-[#14453D] dark:text-[#E2E8E4] pt-1">
                {copy.motto}
              </p>
              <p className="text-xs text-[#516A5F] dark:text-[#8E9F97] tracking-tight">
                {copy.description}
              </p>
            </motion.div>

            {/* 3. Small sleek animated loading bar */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="w-48 h-1 bg-[#E2E2E0] dark:bg-[#1E2E27] rounded-full overflow-hidden mt-6 relative"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: 'easeInOut',
                }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#16A34A] to-transparent"
              />
            </motion.div>

            <span className="text-[10px] text-[#6F7A73] dark:text-[#6C7E76] mt-3 font-medium">
              {copy.loading}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
