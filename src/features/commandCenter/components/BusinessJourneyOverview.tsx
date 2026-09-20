/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BusinessStage } from '../types';
import { JOURNEY_STAGES } from '../lib/business/businessIntelligence';
import { useTranslation } from '../i18n';
import { Language } from '../../../i18n/types';
import { ArrowFillButton } from '../../../components/ui';
import { Check } from 'lucide-react';

const STAGE_TITLES: Record<BusinessStage, Partial<Record<Language, string>>> = {
  IDEA: {
    en: 'Idea',
    hi: 'विचार',
    ta: 'சிந்தனை',
    te: 'ఆలోచన',
    kn: 'ಕಲ್ಪನೆ',
    ml: 'ആശയം',
  },
  REGISTRATION: {
    en: 'Registration',
    hi: 'पंजीकरण',
    ta: 'பதிவு',
    te: 'నమోదు',
    kn: 'ನೋಂದಣಿ',
    ml: 'രജിസ്ട്രേഷൻ',
  },
  FUNDING: {
    en: 'Funding',
    hi: 'वित्तपोषण',
    ta: 'நிதி உதவி',
    te: 'నిధులు',
    kn: 'ಹಣಕಾಸು',
    ml: 'ധനസഹായം',
  },
  MARKET_ACCESS: {
    en: 'Market Access',
    hi: 'बाजार पहुंच',
    ta: 'சந்தை அணுகல்',
    te: 'మార్కెట్ సదుపాయం',
    kn: 'ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ',
    ml: 'വിപണി പ്രവേശനം',
  },
  EXPANSION: {
    en: 'Expansion',
    hi: 'विस्तार',
    ta: 'விரிவாக்கம்',
    te: 'విస్తరణ',
    kn: 'ವಿಸ್ತರಣೆ',
    ml: 'വിപുലീകരണം',
  },
};

interface BusinessJourneyOverviewProps {
  currentStage: BusinessStage;
  relevantSchemesCount: number;
  supportPathwaysCount: number;
  applicationsUnderwayCount: number;
  onExploreStage: (stage: BusinessStage) => void;
  id?: string;
}

export const BusinessJourneyOverview: React.FC<BusinessJourneyOverviewProps> = ({
  currentStage,
  relevantSchemesCount,
  supportPathwaysCount,
  applicationsUnderwayCount,
  onExploreStage,
  id = 'business-journey-overview',
}) => {
  const { t, language } = useTranslation();

  const currentStageIndex = JOURNEY_STAGES.findIndex(s => s.stage === currentStage);
  const activeStageInfo = JOURNEY_STAGES[currentStageIndex] || JOURNEY_STAGES[0];

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7A73] dark:text-[#8E9F97]">
            {t('businessJourneyTitle')}
          </h3>
          <span className="text-xs text-[#6F7A73] dark:text-[#8E9F97] font-medium">
            Stage {currentStageIndex + 1} of {JOURNEY_STAGES.length}
          </span>
        </div>

        {/* Stepper Stages */}
        <div className="space-y-2 mb-6" role="list" aria-label="Business Journey Stages">
          {JOURNEY_STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = s.stage === currentStage;
            const isUpcoming = idx > currentStageIndex;

            return (
              <div
                key={s.stage}
                role="listitem"
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs sm:text-sm transition-colors ${
                  isCurrent
                    ? 'bg-[#14453D] text-white font-medium shadow-xs'
                    : isCompleted
                    ? 'bg-[#FAFAF9] dark:bg-[#1A2420] text-[#3F4943] dark:text-[#C5D5CC] hover:bg-[#F3F4F3] dark:hover:bg-[#22302A]'
                    : 'bg-transparent text-[#8E9F97] dark:text-[#6F7A73]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-emerald-400 text-slate-950'
                        : isCompleted
                        ? 'bg-[#C1E2D0] dark:bg-[#22503E] text-[#0F6B4C] dark:text-[#4ADE80]'
                        : 'border border-[#E2E2E0] dark:border-[#2A3C34] text-[#8E9F97] dark:text-[#6F7A73]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>
                  <span>{STAGE_TITLES[s.stage]?.[language] || STAGE_TITLES[s.stage]?.en || s.title}</span>
                </div>

                <div>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Current
                    </span>
                  )}
                  {isCompleted && <span className="text-[#16A34A] dark:text-[#34D399] font-semibold">✓</span>}
                  {isUpcoming && <span className="text-[#C5D5CC] dark:text-[#516A5F]">○</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Focus Card */}
      <div className="pt-4 border-t border-[#EAECEB] dark:border-[#24342D]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7A73] dark:text-[#8E9F97] mb-1">
          {t('currentFocus')}
        </div>
        <div className="text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
          {STAGE_TITLES[currentStage]?.[language] || STAGE_TITLES[currentStage]?.en || activeStageInfo.title}
        </div>

        <div className="space-y-1 text-xs text-[#516A5F] dark:text-[#9EB0A7] mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E9F97] shrink-0"></span>
            <span>
              <strong className="text-[#14453D] dark:text-[#E8EFEA] font-semibold">{relevantSchemesCount}</strong>{' '}
              {t('relevantSchemes')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E9F97] shrink-0"></span>
            <span>
              <strong className="text-[#14453D] dark:text-[#E8EFEA] font-semibold">{supportPathwaysCount}</strong>{' '}
              {t('supportPathways')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E9F97] shrink-0"></span>
            <span>
              <strong className="text-[#14453D] dark:text-[#E8EFEA] font-semibold">{applicationsUnderwayCount}</strong>{' '}
              {applicationsUnderwayCount === 1 ? t('applicationUnderway') : t('applicationsUnderway')}
            </span>
          </div>
        </div>

        <ArrowFillButton
          id="explore-current-focus-btn"
          variant="outline"
          onClick={() => onExploreStage(currentStage)}
          className="w-full"
        >
          {`${t('exploreCategory')} ${STAGE_TITLES[currentStage]?.[language] || STAGE_TITLES[currentStage]?.en || activeStageInfo.title}`}
        </ArrowFillButton>
      </div>
    </div>
  );
};
