import React from 'react';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, FileCheck2, Scale, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { WorkspaceReadiness } from '../../types/application';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';
import { AnimatedScore } from '../ui/AnimatedScore';

const PILLAR_NAMES: Record<string, Record<Language, string>> = {
  profile: {
    en: 'Profile Alignment',
    hi: 'प्रोफ़ाइल अनुकूलता',
    ta: 'சுயவிவர பொருத்தம்',
    te: 'ప్రొఫైల్ సమలేఖనం',
    kn: 'ಪ್ರೊಫೈಲ್ ಹೊಂದಾಣಿಕೆ',
    ml: 'പ്രൊഫൈൽ അനുയോജ്യത',
    mr: 'प्रोफाइल जुळणी',
  },
  eligibility: {
    en: 'Eligibility Rules',
    hi: 'पात्रता नियम',
    ta: 'தகுதி விதிகள்',
    te: 'అర్హత నిబంధనలు',
    kn: 'ಅರ್ಹತಾ ನಿಯಮಗಳು',
    ml: 'യോഗ്യതാ മാനദണ്ഡങ്ങൾ',
    mr: 'पात्रता नियम',
  },
  documents: {
    en: 'Mandatory Documents',
    hi: 'अनिवार्य दस्तावेज',
    ta: 'கட்டாய ஆவணங்கள்',
    te: 'తప్పనిసరి పత్రాలు',
    kn: 'ಕಡ್ಡಾಯ ದಾಖಲೆಗಳು',
    ml: 'നിർബന്ധിത രേഖകൾ',
    mr: 'अनिवार्य कागदपत्रे',
  },
  financial: {
    en: 'Financial Alignment',
    hi: 'वित्तीय अनुकूलता',
    ta: 'நிதி பொருத்தம்',
    te: 'ఆర్థిక సమలేఖనం',
    kn: 'ಹಣಕಾಸು ಹೊಂದಾಣಿಕೆ',
    ml: 'സാമ്പത്തിക അനുയോജ്യത',
    mr: 'वित्तीय जुळणी',
  },
  process: {
    en: 'Official Channel & Mode',
    hi: 'आधिकारिक माध्यम एवं प्रक्रिया',
    ta: 'அதிகாரப்பூர்வ வழிமுறை',
    te: 'అధికారిక విధానం & మాధ్యమం',
    kn: 'ಅಧಿಕೃತ ಚಾನಲ್ ಮತ್ತು ವಿಧಾನ',
    ml: 'ഔദ്യോഗിക രീതിയും മാധ്യമവും',
    mr: 'अधिकृत माध्यम व प्रक्रिया',
  },
};

const READINESS_STATE_LABELS: Record<string, Record<Language, string>> = {
  READY_TO_APPLY: {
    en: 'Ready to Apply',
    hi: 'आवेदन हेतु तैयार',
    ta: 'விண்ணப்பிக்க தயார்',
    te: 'దరఖాస్తుకు సిద్ధం',
    kn: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಿದ್ಧ',
    ml: 'അപേക്ഷിക്കാൻ തയ്യാറാണ്',
    mr: 'अर्ज करण्यासाठी तयार',
  },
  READY_TO_REVIEW: {
    en: 'Ready for Review',
    hi: 'समीक्षा हेतु तैयार',
    ta: 'மதிப்பாய்வுக்கு தயார்',
    te: 'సమీక్షకు సిద్ధం',
    kn: 'ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧ',
    ml: 'പരിಶോധനയ്ക്ക് തയ്യാറാണ്',
    mr: 'आढाव्यासाठी तयार',
  },
  PARTIAL: {
    en: 'Preparation In Progress',
    hi: 'तैयारी प्रगति पर है',
    ta: 'தயாரிப்பு செயல்பாட்டில் உள்ளது',
    te: 'తయారీ పురోగతిలో ఉంది',
    kn: 'ಸಿದ್ಧತೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    ml: 'തയ്യാറെടുപ്പ് പുരോഗമിക്കുന്നു',
    mr: 'तयारी सुरू आहे',
  },
  NOT_READY: {
    en: 'Action Required',
    hi: 'कार्रवाई आवश्यक',
    ta: 'நடவடிக்கை தேவை',
    te: 'చర్య అవసరం',
    kn: 'ಕ್ರಮ ಅಗತ್ಯವಿದೆ',
    ml: 'നടപടി ആവശ്യമാണ്',
    mr: 'कृती आवश्यक',
  },
  STATUTORY_CLEARED: {
    en: 'Statutory Cleared',
    hi: 'वैधानिक मंज़ूरी प्राप्त',
    ta: 'சட்டப்பூர்வ அனுமதி பெறப்பட்டது',
    te: 'చట్టబద్ధమైన అనుమతి పొందబడింది',
    kn: 'ಶಾಸನಬದ್ಧ ಅನುಮತಿ ಪಡೆಯಲಾಗಿದೆ',
    ml: 'നിയമപരമായ അനുമതി ലഭിച്ചു',
    mr: 'वैधानिक मंजुरी मिळाली',
  },
};

interface PreparationReadinessHeaderProps {
  readiness: WorkspaceReadiness;
  onSelectPillar?: (pillarKey: string) => void;
}

export const PreparationReadinessHeader: React.FC<PreparationReadinessHeaderProps> = ({
  readiness,
  onSelectPillar,
}) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const getBadgeStyle = (state: WorkspaceReadiness['state']) => {
    switch (state) {
      case 'READY_TO_APPLY':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'READY_TO_REVIEW':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'PARTIALLY_READY':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'NOT_READY':
      default:
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
  };

  const getPillarIcon = (key: string) => {
    switch (key) {
      case 'eligibility':
        return <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'documents':
        return <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'financial':
        return <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'process':
      default:
        return <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getPillarStateColor = (state: string) => {
    switch (state) {
      case 'SATISFIED':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60';
      case 'PARTIAL':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60';
      case 'BLOCKED':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60';
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <section
      id="workspace-readiness-header"
      className="yj-card yj-card-lg p-6 mb-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E5E9E7] dark:border-[#22332A]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="yj-eyebrow text-[#1E6A50] dark:text-[#4ADE80]">
              {t('workspace.readinessTitle')}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
                readiness.state
              )}`}
            >
              {readiness.state === 'READY_TO_APPLY' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : readiness.state === 'NOT_READY' ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : null}
              {READINESS_STATE_LABELS[readiness.state]?.[lang] || resolveLocalizedPair(readiness.labelEn, readiness.labelHi, lang)}
            </span>
          </div>
          <p className="yj-body text-[#42544C] dark:text-[#97A7A0] yj-measure">
            {resolveLocalizedPair(readiness.summaryEn, readiness.summaryHi, lang)}
          </p>

          {/* Readiness progress: the same score, shown as a calm linear track */}
          <div
            className="mt-3 w-full max-w-md h-1.5 rounded-full bg-[#EDF1EF] dark:bg-[#102E29] overflow-hidden"
            role="img"
            aria-label={`${t('workspace.overallReadiness')}: ${readiness.overallScore}%`}
          >
            <motion.div
              className="h-full rounded-full yj-gradient-accent"
              initial={shouldReduceMotion ? false : { width: 0 }}
              whileInView={{ width: `${readiness.overallScore}%` }}
              viewport={{ once: true, amount: 0.6 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
              }
            />
          </div>
        </div>

        {/* Readiness Score Gauge */}
        <div className="flex items-center gap-4 shrink-0 bg-[#F4F7F5] dark:bg-[#1d2822] px-5 py-3 rounded-xl border border-[#E0E6E2] dark:border-[#26372E]">
          <div className="text-right">
            <div className="text-xs font-medium text-[#5A6561] dark:text-[#97A7A0]">
              {t('workspace.overallReadiness')}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {readiness.canProceedToOfficialPortal
                ? READINESS_STATE_LABELS.STATUTORY_CLEARED?.[lang] || 'Statutory Cleared'
                : READINESS_STATE_LABELS.NOT_READY?.[lang] || 'Action Required'}
            </div>
          </div>
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white dark:bg-[#141b17] border-2 border-emerald-500 shadow-sm">
            <AnimatedScore
              value={readiness.overallScore}
              className="text-base font-bold text-[#1F2421] dark:text-[#F0F4F2]"
            />
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6">
        {readiness.pillars.map((pillar) => (
          <button
            key={pillar.key}
            type="button"
            onClick={() => onSelectPillar?.(pillar.key)}
            className="flex flex-col text-left p-4 rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-[#FAFAF9] dark:bg-[#1d2822]/60 hover:border-[#1E6A50]/40 dark:hover:border-[#4ADE80]/40 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white dark:bg-[#141b17] border border-[#E0E6E2] dark:border-[#26372E]">
                  {getPillarIcon(pillar.key)}
                </span>
                <span className="text-xs font-bold text-[#1F2421] dark:text-[#F0F4F2]">
                  {PILLAR_NAMES[pillar.key]?.[lang] || resolveLocalizedPair(pillar.labelEn, pillar.labelHi, lang)}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPillarStateColor(
                  pillar.state
                )}`}
              >
                {pillar.score}%
              </span>
            </div>

            <p className="text-xs text-[#5A6561] dark:text-[#97A7A0] leading-snug line-clamp-2">
              {resolveLocalizedPair(pillar.summaryEn, pillar.summaryHi, lang)}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
