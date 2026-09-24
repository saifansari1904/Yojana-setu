import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import type { BusinessStageInsights } from '../../types/commandCenter';
import { BUSINESS_STAGE_TAXONOMY, type BusinessStageKey } from '../../types/business';
import { useTranslation } from '../../i18n';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

interface BusinessJourneyOverviewProps {
  insights: BusinessStageInsights;
  onModifyProfile?: () => void;
}

export const BusinessJourneyOverview: React.FC<BusinessJourneyOverviewProps> = ({
  insights,
  onModifyProfile,
}) => {
  const { lang } = useTranslation();
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false);
  const currentStageInfo =
    BUSINESS_STAGE_TAXONOMY[insights.stage as BusinessStageKey] || BUSINESS_STAGE_TAXONOMY.IDEA;

  return (
    <section
      id="business-journey-overview"
      className="bg-white dark:bg-[var(--bg-raised)] border border-[#E3ECE7] dark:border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#EAF5EF] dark:bg-[var(--bg-subtle)] text-[#0F6B4C] dark:text-[var(--accent-green)]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {resolveLocalizedPair('Business Lifecycle Stage', 'व्यावसायिक जीवनचक्र चरण', lang)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {resolveLocalizedPair('Scheme prioritization aligned with enterprise maturity', 'आपकी वर्तमान स्थिति के आधार पर योजना प्राथमिकता', lang)}
            </p>
          </div>
        </div>

        {onModifyProfile && (
          <button
            id="modify-profile-stage-btn"
            onClick={onModifyProfile}
            className="text-xs font-semibold text-[#0F6B4C] dark:text-[var(--accent-green)] hover:underline px-2 py-1 min-h-[44px] flex items-center"
          >
            {resolveLocalizedPair('Update Stage', 'चरण बदलें', lang)}
          </button>
        )}
      </div>

      {/* Current Stage Card */}
      <div className="bg-gradient-to-br from-[#F4F9F6] to-[#EBF4EF] dark:from-[#172620] dark:to-[#12201A] border border-[#D5E6DC] dark:border-[#1E362C] rounded-lg p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#0F6B4C] dark:text-[var(--accent-green)] uppercase tracking-wider">
            {resolveLocalizedPair('Current Active Stage', 'वर्तमान सक्रिय चरण', lang)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-white dark:bg-[var(--bg-card)] text-slate-800 dark:text-white px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {insights.currentFocusCount} {resolveLocalizedPair('Active Opportunities', 'सक्रिय अवसर', lang)}
          </span>
        </div>

        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {resolveLocalizedPair(currentStageInfo.labelEn, currentStageInfo.labelHi, lang)}
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {resolveLocalizedPair(currentStageInfo.descEn, currentStageInfo.descHi, lang)}
        </p>
      </div>

      {/* Progression Milestones */}
      <div className="pt-2 border-t border-slate-100 dark:border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {resolveLocalizedPair('Lifecycle Milestones', 'जीवनचक्र प्रगति', lang)}
          </div>

          {insights.upcomingStages.length > 0 && (
            <button
              id="toggle-upcoming-stages"
              onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 min-h-[44px]"
            >
              <span>
                {isUpcomingExpanded
                  ? resolveLocalizedPair('Show Less', 'संक्षिप्त करें', lang)
                  : resolveLocalizedPair(`Upcoming Stages (${insights.upcomingStages.length})`, `आगामी चरण (${insights.upcomingStages.length})`, lang)}
              </span>
              {isUpcomingExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Milestone Steps Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {insights.completedStages.map((stageKey) => {
            const info = BUSINESS_STAGE_TAXONOMY[stageKey as BusinessStageKey];
            return (
              <span
                key={stageKey}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{resolveLocalizedPair(info?.labelEn || stageKey, info?.labelHi || stageKey, lang)}</span>
              </span>
            );
          })}

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0F6B4C] text-white font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{resolveLocalizedPair(currentStageInfo.labelEn, currentStageInfo.labelHi, lang)}</span>
          </span>
        </div>

        {/* Collapsible Upcoming Stages */}
        <AnimatePresence>
          {isUpcomingExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {resolveLocalizedPair('Future Expansion Milestones', 'भविष्य के विस्तार चरण', lang)}
                </div>
                <div className="space-y-1.5">
                  {insights.upcomingStages.map((stageKey) => {
                    const info = BUSINESS_STAGE_TAXONOMY[stageKey as BusinessStageKey];
                    return (
                      <div
                        key={stageKey}
                        className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">
                          {resolveLocalizedPair(info?.labelEn || stageKey, info?.labelHi || stageKey, lang)}:
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {resolveLocalizedPair(info?.descEn, info?.descHi, lang)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
