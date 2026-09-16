/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OpportunityItem } from '../types';
import { useTranslation } from '../i18n';
import { AnimatedCounter } from '../../../animations';
import { VerificationBadge } from '../../../components/ui';
import { ArrowFillButton } from '../../../components/ui';
import { SuccessCheckmark } from '../../../animations';
import { BookmarkButton } from '../../../components/ui';
import { Sparkles, FileText, IndianRupee, AlertCircle, HelpCircle } from 'lucide-react';

interface OpportunityPriorityCardProps {
  opportunity: OpportunityItem;
  onContinue: (opportunity: OpportunityItem) => void;
  onToggleSave: (schemeId: string) => void;
  onOpenSchemeDetail: (opportunity: OpportunityItem) => void;
  id?: string;
}

export const OpportunityPriorityCard: React.FC<OpportunityPriorityCardProps> = ({
  opportunity,
  onContinue,
  onToggleSave,
  onOpenSchemeDetail,
  id = 'top-opportunity-card',
}) => {
  const { t, language } = useTranslation();
  const { scheme, matchResult, actionPriority, nextBestAction, documentReadiness, whyThisScheme, isSaved } = opportunity;

  // Badge configuration based on deterministic action priority
  const priorityBadgeConfig = {
    ACTION_NOW: {
      label: t('actionNowBadge'),
      classes: 'bg-[#16A34A] text-white font-semibold shadow-xs',
    },
    HIGH_PRIORITY: {
      label: t('highPriorityBadge'),
      classes: 'bg-[#14453D] text-white font-semibold',
    },
    REVIEW: {
      label: t('reviewBadge'),
      classes: 'bg-[#FEF3C7] dark:bg-[#3B2F14] text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 font-medium',
    },
    INFORMATION_NEEDED: {
      label: t('infoNeededBadge'),
      classes: 'bg-blue-100 dark:bg-[#0E2A38] text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-medium',
    },
    LOW_PRIORITY: {
      label: t('lowPriorityBadge'),
      classes: 'bg-[#F3F4F3] dark:bg-[#1E2924] text-[#3F4943] dark:text-[#C5D5CC] font-medium',
    },
  }[actionPriority];

  const schemeTitle = language === 'hi' ? scheme.nameHi : scheme.name;
  const deptTitle = language === 'hi' ? scheme.departmentHi : scheme.department;

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-6 sm:p-7 relative"
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6F7A73] dark:text-[#8E9F97]">
              {t('topOpportunityHeading')}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full ${priorityBadgeConfig.classes}`}>
              {priorityBadgeConfig.label}
            </span>
            <VerificationBadge classification={scheme.portalDomainClass} />
          </div>

          <h3
            onClick={() => onOpenSchemeDetail(opportunity)}
            className="text-xl sm:text-xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] cursor-pointer hover:text-[#0F6B4C] dark:hover:text-[#4ADE80] transition-colors"
          >
            {scheme.code} — {schemeTitle}
          </h3>
          <p className="text-xs text-[#6F7A73] dark:text-[#8E9F97] mt-1">{deptTitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <BookmarkButton
            id={`bookmark-${scheme.id}`}
            isSaved={isSaved}
            onToggle={() => onToggleSave(scheme.id)}
          />
          {/* Match Score Badge (Authoritative Phase 3.1 Score) */}
          <div className="text-right bg-[#FAFAF9] dark:bg-[#1A2420] px-3.5 py-2 rounded-lg border border-[#E2E2E0] dark:border-[#24342D]">
            <div className="text-xl sm:text-xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] leading-tight">
              <AnimatedCounter value={matchResult.totalMatchScore} id={`match-counter-${scheme.id}`} />
              <span className="text-xs font-normal text-[#6F7A73] dark:text-[#8E9F97] ml-0.5">/100</span>
            </div>
            <div className="text-[11px] font-medium text-[#6F7A73] dark:text-[#8E9F97] uppercase tracking-wide">
              {t('matchScoreLabel')}
            </div>
          </div>
        </div>
      </div>

      {/* Status Signals Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 py-3.5 px-4 bg-slate-50/80 dark:bg-[#1A2420] rounded-lg border border-[#EAECEB] dark:border-[#24342D]">
        <div className="flex items-center gap-2.5 text-xs text-[#3F4943] dark:text-[#C5D5CC]">
          <SuccessCheckmark size={18} />
          <span className="font-medium">{t('eligibilityReviewed')}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[#3F4943] dark:text-[#C5D5CC]">
          {matchResult.financialFit.fitsBudget ? (
            <>
              <SuccessCheckmark size={18} />
              <span className="font-medium">{t('financialFit')}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-[#92610A] dark:text-[#FCD34D] shrink-0" />
              <span className="text-[#92610A] dark:text-[#FCD34D]">{matchResult.financialFit.reason}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[#3F4943] dark:text-[#C5D5CC]">
          <FileText className="w-4 h-4 text-[#6F7A73] dark:text-[#8E9F97] shrink-0" />
          <span>
            <strong className="font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">{documentReadiness.prepared}</strong>
            {' '}/ {documentReadiness.total} {t('documentsPrepared')}
          </span>
        </div>
      </div>

      {/* "WHY THIS SCHEME — AND WHY NOW?" */}
      <div className="my-5">
        <div className="text-xs font-bold text-[#516A5F] dark:text-[#9EB0A7] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('whyThisSchemeTitle')}</span>
        </div>
        <div className="space-y-1.5">
          {whyThisScheme.points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#3F4943] dark:text-[#C5D5CC]">
              {pt.type === 'positive' && <span className="text-[#16A34A] dark:text-[#34D399] font-bold shrink-0">✓</span>}
              {pt.type === 'attention' && <AlertCircle className="w-3.5 h-3.5 text-[#92610A] dark:text-[#FCD34D] mt-0.5 shrink-0" />}
              {pt.type === 'neutral' && <span className="text-[#8E9F97] dark:text-[#6F7A73] font-bold shrink-0">•</span>}
              <span>{language === 'hi' ? pt.textHi : pt.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NEXT BEST ACTION Box */}
      <div className="mt-5 p-4 rounded-lg bg-emerald-50/70 dark:bg-[#142E25] border border-emerald-200/80 dark:border-[#22503E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80] uppercase tracking-wider block mb-0.5">
            {t('nextBestActionTitle')}
          </span>
          <div className="text-sm font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
            {language === 'hi' ? nextBestAction.actionTextHi : nextBestAction.actionText}
          </div>
          <div className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
            {language === 'hi' ? nextBestAction.reasonTextHi : nextBestAction.reasonText}
          </div>
        </div>

        <ArrowFillButton
          id="continue-top-opportunity-btn"
          variant="secondary"
          onClick={() => onContinue(opportunity)}
          ariaLabel={`${t('continueApplication')} for ${scheme.code}`}
          className="shrink-0 w-full sm:w-auto"
        >
          {t('continueApplication')}
        </ArrowFillButton>
      </div>
    </div>
  );
};
