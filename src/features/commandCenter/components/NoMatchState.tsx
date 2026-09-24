/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n';
import { SearchX, UserCheck, Layers, Eye } from 'lucide-react';

interface NoMatchStateProps {
  onReviewProfile: () => void;
  onExploreSupport: () => void;
  onViewNearMatches: () => void;
  id?: string;
}

export const NoMatchState: React.FC<NoMatchStateProps> = ({
  onReviewProfile,
  onExploreSupport,
  onViewNearMatches,
  id = 'no-match-state',
}) => {
  const { t } = useTranslation();

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-8 text-center max-w-2xl mx-auto my-8"
    >
      <div className="w-12 h-12 rounded-full bg-[#FEF3C7] dark:bg-[var(--status-warning-bg)] text-[#92610A] dark:text-[var(--text-accent)] flex items-center justify-center mx-auto mb-4 border border-[#FCD34D]/40 dark:border-amber-700/60">
        <SearchX className="w-6 h-6" />
      </div>

      <h3 className="text-xl font-bold text-[#1A1C1B] dark:text-[var(--text-main)] mb-2">
        {t('noMatchTitle')}
      </h3>
      <p className="text-sm text-[#516A5F] dark:text-[var(--text-secondary)] max-w-md mx-auto mb-6">
        {t('noMatchSubtitle')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          id="review-profile-nomatch-btn"
          type="button"
          onClick={onReviewProfile}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#14453D] text-white hover:bg-[#14453D] transition-colors min-h-[44px]"
        >
          <UserCheck className="w-4 h-4" />
          <span>{t('reviewProfileBtn')}</span>
        </button>

        <button
          id="explore-support-nomatch-btn"
          type="button"
          onClick={onExploreSupport}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-[var(--bg-card)] text-[#3F4943] dark:text-[var(--text-secondary)] border border-[#E4E8E4] dark:border-[var(--border-subtle)] hover:bg-[#FAFAF9] dark:hover:bg-[var(--bg-raised)] transition-colors min-h-[44px]"
        >
          <Layers className="w-4 h-4" />
          <span>{t('exploreSupportBtn')}</span>
        </button>

        <button
          id="view-near-matches-nomatch-btn"
          type="button"
          onClick={onViewNearMatches}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#F3F4F3] dark:bg-[var(--bg-raised)] text-[#3F4943] dark:text-[var(--text-secondary)] hover:bg-[#EEEEED] dark:hover:bg-[#26352E] transition-colors min-h-[44px]"
        >
          <Eye className="w-4 h-4" />
          <span>{t('viewNearMatchesBtn')}</span>
        </button>
      </div>
    </div>
  );
};
