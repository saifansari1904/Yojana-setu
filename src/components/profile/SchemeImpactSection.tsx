/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react';
import { MatchResult, Scheme } from '../../types';
import { useTranslation, PROFILE_I18N } from '../../i18n';

interface SchemeImpactSectionProps {
  matchResults: MatchResult[];
  onViewMatches: () => void;
  onViewDashboard: () => void;
  onViewTracker: () => void;
  onSelectScheme: (scheme: Scheme) => void;
}

export const SchemeImpactSection: React.FC<SchemeImpactSectionProps> = ({
  matchResults,
  onViewMatches,
  onViewDashboard,
  onViewTracker,
  onSelectScheme,
}) => {
  const { lang, getLocalizedScheme } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const eligible = matchResults.filter((m) => m.isEligible && m.matchPercentage >= 75);
  const nearMatches = matchResults.filter((m) => m.matchPercentage >= 40 && m.matchPercentage < 75);
  const topMatches = matchResults.slice(0, 3);

  return (
    <div
      id="profile-scheme-impact-section"
      className="bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1E6A50] dark:text-[var(--accent-green)]" />
            {strings.impactTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5">
            {strings.impactSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewMatches}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#1E6A50] dark:hover:bg-[#15803D] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <span>{strings.viewMatchesBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="p-4 rounded-xl bg-[#F4F8F5] dark:bg-[var(--bg-card)] border border-[#D9E8DF] dark:border-[#1E3E2E] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] block">
              {strings.eligibleCount}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#14453D] dark:text-[var(--accent-green)] mt-1 block">
              {eligible.length}
            </span>
          </div>
          <CheckCircle className="w-8 h-8 text-[#1E6A50] dark:text-[var(--accent-green)] opacity-80" />
        </div>

        <div className="p-4 rounded-xl bg-[#FFFBEB] dark:bg-[#1D1708] border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
              {strings.nearMatchesCount}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
              {nearMatches.length}
            </span>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 opacity-80" />
        </div>
      </div>

      {/* Top matched schemes preview cards */}
      {topMatches.length > 0 && (
        <div className="space-y-2.5 mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#516A5F] dark:text-[var(--text-secondary)] block">
            Top Matched Central / State Schemes
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topMatches.map((res) => {
              const locScheme = getLocalizedScheme(res.scheme);
              return (
                <button
                  key={res.scheme.id}
                  type="button"
                  onClick={() => onSelectScheme(res.scheme)}
                  className="p-3.5 rounded-xl bg-[#F9FAF9] dark:bg-[var(--bg-card)] border border-[#E8EFEA] dark:border-[var(--border-subtle)] hover:border-[#1E6A50] transition-all text-left flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-[#516A5F] dark:text-[var(--text-secondary)] truncate">
                        {locScheme.sponsoringMinistry || locScheme.department}
                      </span>
                      <span className="text-xs font-black text-[#14453D] dark:text-[var(--accent-green)] bg-[#D9E8DF] dark:bg-[var(--bg-subtle)] px-2 py-0.5 rounded-full">
                        {res.matchPercentage}% Match
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] group-hover:text-[#14453D] dark:group-hover:text-[#4ADE80] line-clamp-2 transition-colors">
                      {locScheme.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E8EFEA] dark:border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)]">
                    <span className="truncate">{locScheme.fundingRangeText || 'Government Credit'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#14453D] dark:text-[var(--accent-green)] shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Synchronization footnote */}
      <div className="p-3.5 rounded-xl bg-[#F4F7F5] dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#516A5F] dark:text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)] shrink-0" />
          {strings.syncNotice}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onViewDashboard}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:underline cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{strings.viewDashboardBtn}</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onViewTracker}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:underline cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>{strings.viewTrackerBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
