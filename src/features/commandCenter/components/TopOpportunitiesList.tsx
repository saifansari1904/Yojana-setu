/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { resolveLocalizedPair } from '../../../i18n/resolveLocalized';
import { OpportunityItem } from '../types';
import { useTranslation } from '../i18n';
import { useTranslation as useAppTranslation } from '../../../i18n';
import { AnimatedCounter } from '../../../animations';
import { VerificationBadge } from '../../../components/ui';
import { BookmarkButton } from '../../../components/ui';
import { ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

interface TopOpportunitiesListProps {
  opportunities: OpportunityItem[];
  onSelectOpportunity: (opportunity: OpportunityItem) => void;
  onToggleSave: (schemeId: string) => void;
  id?: string;
}

export const TopOpportunitiesList: React.FC<TopOpportunitiesListProps> = ({
  opportunities,
  onSelectOpportunity,
  onToggleSave,
  id = 'top-opportunities-list',
}) => {
  const { t, language } = useTranslation();
  const { getLocalizedScheme } = useAppTranslation();

  if (opportunities.length === 0) return null;

  return (
    <div id={id} className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#8E9F97]">
          {t('topOpportunitiesTitle')}
        </h3>
        <span className="text-xs text-[#516A5F] dark:text-[#8E9F97] font-medium">
          Authoritative Match Ranked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {opportunities.map((opp, idx) => {
          const { scheme, matchResult, actionPriority, documentReadiness, isSaved, nextBestAction } = opp;
          const locScheme = getLocalizedScheme(scheme);
          const schemeTitle = locScheme.name || scheme.name;

          const priorityBadgeConfig = {
            ACTION_NOW: { label: t('actionNowBadge'), cls: 'bg-[#175741] text-white' },
            HIGH_PRIORITY: { label: t('highPriorityBadge'), cls: 'bg-[#14453D] text-white' },
            REVIEW: { label: t('reviewBadge'), cls: 'bg-[#FEF3C7] dark:bg-[#3B2F14] text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60' },
            INFORMATION_NEEDED: { label: t('infoNeededBadge'), cls: 'bg-blue-100 dark:bg-[#0E2A38] text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800' },
            LOW_PRIORITY: { label: t('lowPriorityBadge'), cls: 'bg-[#F3F4F3] dark:bg-[#1d2822] text-[#3F4943] dark:text-[#C5D5CC]' },
          }[actionPriority];

          return (
            <div
              key={scheme.id}
              id={`opp-card-${scheme.id}`}
              onClick={() => onSelectOpportunity(opp)}
              className="yj-card yj-hoverable p-5 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityBadgeConfig.cls}`}>
                      {priorityBadgeConfig.label}
                    </span>
                    <VerificationBadge classification={scheme.portalDomainClass} showText={false} />
                  </div>
                  <BookmarkButton
                    id={`bookmark-mini-${scheme.id}`}
                    isSaved={isSaved}
                    onToggle={() => onToggleSave(scheme.id)}
                  />
                </div>

                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h4 className="text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2] group-hover:text-[#1E6A50] dark:group-hover:text-[#4ADE80] transition-colors">
                    {scheme.code}
                  </h4>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2] tabular-nums">
                      <AnimatedCounter value={matchResult.totalMatchScore} id={`match-num-${scheme.id}`} />
                    </span>
                    <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] ml-0.5">{t('matchScoreLabel')}</span>
                  </div>
                </div>

                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] line-clamp-2 mb-3">
                  {schemeTitle}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-[#516A5F] dark:text-[#8E9F97] mb-3 bg-[#FAFAF9] dark:bg-[#1d2822] border border-[#EAECEB] dark:border-[#24342D] p-2 rounded">
                  <FileText className="w-3.5 h-3.5 text-[#516A5F] dark:text-[#6F7A73] shrink-0" />
                  <span>
                    {documentReadiness.prepared}/{documentReadiness.total} {t('documentsPrepared')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAECEB] dark:border-[#24342D] flex items-center justify-between text-xs text-[#1E6A50] dark:text-[#4ADE80] font-semibold group-hover:text-[#14453D] dark:group-hover:text-[#86EFAC]">
                <span className="truncate pr-2">
                  {nextBestAction.actionLocalized?.[language] ||
                    (resolveLocalizedPair(nextBestAction.actionText, nextBestAction.actionTextHi, language))}
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
