import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MapPin, Building2, Users, Wallet, Gauge, Sparkles, Check } from 'lucide-react';
import { useTranslation } from '../i18n';

interface MatchingTransitionProps {
  onComplete: () => void;
  totalSchemesCount?: number;
}

interface StepItem {
  id: string;
  labels: Record<string, string>;
  icon: React.ElementType;
}

const TRANSITION_I18N: Record<string, { title: string; subtitle: string }> = {
  en: { title: 'Matching schemes for you', subtitle: 'Deterministic, verified sources' },
  hi: { title: 'योजना सेतु मिलान इंजन', subtitle: 'नियम-आधारित, सत्यापित स्रोत' },
  ta: { title: 'உங்களுக்கான திட்டங்கள் பொருந்துகின்றன', subtitle: 'விதிமுறை சார்ந்த, சரிபார்க்கப்பட்ட ஆதாரங்கள்' },
  te: { title: 'మీ కోసం పథకాల సరిపోలిక', subtitle: 'నియమాల ఆధారిత, ధృవీకరించబడిన వనరులు' },
  kn: { title: 'ನಿಮಗಾಗಿ ಯೋಜನೆಗಳ ಹೊಂದಾಣಿಕೆ', subtitle: 'ನಿಯಮ-ಆಧಾರಿತ, ಪರಿಶೀಲಿಸಿದ ಮೂಲಗಳು' },
  ml: { title: 'നിങ്ങൾക്കായുള്ള പദ്ധതികൾ കണ്ടെത്തുന്നു', subtitle: 'നിയമാധിഷ്ഠിത, സ്ഥിരീകരിച്ച വിവരങ്ങൾ' },
};

/**
 * Signature matching sequence.
 *
 * Narrates the deterministic evaluation order the matching engine already
 * uses (state filter → sector & investment → social category & stage →
 * confidence scoring) as six short stages with animated checkmarks, a
 * connected rail and a counting progress number. Purely presentational: the
 * engine is untouched and `onComplete` still fires on the same ~1.65s budget,
 * with a 300ms fast path under reduced motion.
 */
export const MatchingTransition: React.FC<MatchingTransitionProps> = ({
  onComplete,
  totalSchemesCount = 39,
}) => {
  const { lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const headerText = TRANSITION_I18N[lang] || TRANSITION_I18N.en;

  const steps: StepItem[] = [
    {
      id: 'location',
      labels: {
        en: 'Analyzing your location…',
        hi: 'आपके राज्य का विश्लेषण…',
        ta: 'உங்கள் இருப்பிடத்தை பகுப்பாய்வு செய்கிறது…',
        te: 'మీ స్థానాన్ని విశ్లేషిస్తోంది…',
        kn: 'ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…',
        ml: 'നിങ്ങളുടെ പ്രദേശം വിശകലനം ചെയ്യുന്നു…',
      },
      icon: MapPin,
    },
    {
      id: 'business',
      labels: {
        en: 'Understanding your business…',
        hi: 'आपके व्यवसाय को समझा जा रहा है…',
        ta: 'உங்கள் தொழிலைப் புரிந்துகொள்கிறது…',
        te: 'మీ వ్యాపారాన్ని అర్థం చేసుకుంటోంది…',
        kn: 'ನಿಮ್ಮ ವ್ಯವಹಾರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ…',
        ml: 'നിങ്ങളുടെ ബിസിനസ്സ് മനസ്സിലാക്കുന്നു…',
      },
      icon: Building2,
    },
    {
      id: 'eligibility',
      labels: {
        en: 'Checking eligibility signals…',
        hi: 'पात्रता संकेतों की जांच…',
        ta: 'தகுதி அளவுகோல்களை சரிபார்க்கிறது…',
        te: 'అర్హత సంకేతాలను తనిఖీ చేస్తోంది…',
        kn: 'ಅರ್ಹತಾ ನಿಯಮಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
        ml: 'അർഹതാ മാനദണ്ഡങ്ങൾ പരിശോധിക്കുന്നു…',
      },
      icon: Users,
    },
    {
      id: 'financial',
      labels: {
        en: 'Evaluating financial fit…',
        hi: 'वित्तीय अनुकूलता का मूल्यांकन…',
        ta: 'நிதி பொருத்தத்தை மதிப்பிடுகிறது…',
        te: 'ఆర్థిక అనుకూలతను అంచనా వేస్తోంది…',
        kn: 'ಹಣಕಾಸು ಹೊಂದಾಣಿಕೆಯನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗುತ್ತಿದೆ…',
        ml: 'സാമ്പത്തിക അനുയോജ്യത വിലയിരുത്തുന്നു…',
      },
      icon: Wallet,
    },
    {
      id: 'relevance',
      labels: {
        en: `Calculating relevance across ${totalSchemesCount} schemes…`,
        hi: `${totalSchemesCount} योजनाओं में प्रासंगिकता की गणना…`,
        ta: `${totalSchemesCount} திட்டங்களின் பொருத்தத்தைக் கணக்கிடுகிறது…`,
        te: `${totalSchemesCount} పథకాలలో ప్రాధాన్యతను లెక్కిస్తోంది…`,
        kn: `${totalSchemesCount} ಯೋಜನೆಗಳಲ್ಲಿ ಪ್ರಸ್ತುತತೆಯನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ…`,
        ml: `${totalSchemesCount} പദ്ധതികളിൽ അനുയോജ്യത കണക്കാക്കുന്നു…`,
      },
      icon: Gauge,
    },
    {
      id: 'ready',
      labels: {
        en: 'Preparing recommendations…',
        hi: 'अनुशंसाएं तैयार की जा रही हैं…',
        ta: 'பரிந்துரைகள் தயாராகின்றன…',
        te: 'సిఫార్సులను సిద్ధం చేస్తోంది…',
        kn: 'ಶಿಫಾರಸುಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ…',
        ml: 'ശുപാർശകൾ തയ്യാറാക്കുന്നു…',
      },
      icon: Sparkles,
    },
  ];

  const [activeStepIdx, setActiveStepIdx] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      const fastTimer = setTimeout(() => onComplete(), 300);
      return () => clearTimeout(fastTimer);
    }

    // Six stages inside the same ~1.65s budget as before.
    const timers = [
      setTimeout(() => setActiveStepIdx(1), 260),
      setTimeout(() => setActiveStepIdx(2), 520),
      setTimeout(() => setActiveStepIdx(3), 780),
      setTimeout(() => setActiveStepIdx(4), 1040),
      setTimeout(() => setActiveStepIdx(5), 1300),
      setTimeout(() => onComplete(), 1650),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete, shouldReduceMotion]);

  const progressPercent = Math.min(100, Math.round(((activeStepIdx + 1) / steps.length) * 100));

  return (
    <motion.div
      id="matching-transition-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 yj-glass flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md yj-card yj-card-lg yj-elev-4 p-6 sm:p-8">
        {/* Header: emblem + counting progress */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[#16A34A]/18 dark:bg-[#4ADE80]/18"
                animate={shouldReduceMotion ? undefined : { scale: [1, 1.22, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative w-9 h-9 rounded-full yj-gradient-hero text-white flex items-center justify-center">
                <Gauge className="w-[18px] h-[18px] text-[#4ADE80]" strokeWidth={1.75} />
              </span>
            </div>
            <div className="text-left">
              <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                {headerText.title}
              </h2>
              <p className="yj-caption text-[#6F7A73] dark:text-[#8E9F97]">
                {headerText.subtitle}
              </p>
            </div>
          </div>
          <motion.span
            key={progressPercent}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="yj-numeric yj-h3 text-[#0B5D4B] dark:text-[#4ADE80]"
          >
            {progressPercent}%
          </motion.span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#EDF1EF] dark:bg-[#102E29] h-1.5 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full yj-gradient-accent"
            initial={{ width: '8%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Connected stage rail */}
        <ol className="text-left">
          {steps.map((step, idx) => {
            const isDone = idx < activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            const isLast = idx === steps.length - 1;
            const Icon = step.icon;

            return (
              <li key={step.id} className="relative flex items-start gap-3 pb-3 last:pb-0">
                {/* Setu connector between stages; fills in as stages complete */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[13px] top-7 bottom-0 w-0.5 rounded-full transition-colors duration-300 ${
                      isDone ? 'bg-[#16A34A]/60 dark:bg-[#4ADE80]/50' : 'bg-[#E2E2E0] dark:bg-[#24342D]'
                    }`}
                  />
                )}

                <span
                  aria-hidden="true"
                  className={`relative z-10 w-[27px] h-[27px] shrink-0 rounded-full border flex items-center justify-center transition-colors duration-200 ${
                    isDone
                      ? 'bg-[#D4EFE1] dark:bg-[#12352B] border-[#16A34A]/45 text-[#0F6B4C] dark:text-[#4ADE80]'
                      : isCurrent
                      ? 'bg-[#F1F5F3] dark:bg-[#102E29] border-[#16A34A]/45 text-[#0B5D4B] dark:text-[#4ADE80]'
                      : 'bg-transparent border-[#E2E2E0] dark:border-[#24342D] text-[#9EB0A7] dark:text-[#4A5D54]'
                  }`}
                >
                  {isDone ? (
                    <motion.span
                      initial={shouldReduceMotion ? undefined : { scale: 0.6, opacity: 0 }}
                      animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </motion.span>
                  ) : (
                    <motion.span
                      animate={
                        shouldReduceMotion || !isCurrent ? undefined : { opacity: [1, 0.45, 1] }
                      }
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </motion.span>
                  )}
                </span>

                <span
                  className={`pt-1 yj-support transition-colors duration-200 ${
                    isCurrent
                      ? 'text-[#0F1512] dark:text-[#F0F4F2] font-semibold'
                      : isDone
                      ? 'text-[#42544C] dark:text-[#A9BDB3]'
                      : 'text-[#9EB0A7] dark:text-[#5C6F66]'
                  }`}
                >
                  {step.labels[lang] || step.labels.en}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </motion.div>
  );
};
