/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { calculateBusinessProfileCompleteness, MissingFieldPrompt } from '../../lib/business/businessProfileCompleteness';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

interface ProfileCompletenessCardProps {
  profile: UserProfile;
  onCompleteField?: (fieldKey: string) => void;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  profile,
  onCompleteField,
}) => {
  const { lang, t } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const completeness = calculateBusinessProfileCompleteness(profile);
  const isComplete = completeness.percentage >= 100;

  return (
    <div
      id="profile-completeness-card"
      className="bg-white dark:bg-[var(--bg-card)] border border-[#D9E8DF] dark:border-[var(--border-subtle)] rounded-xl p-5 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#14453D] dark:text-[var(--accent-green)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              {strings.completenessTitle}
            </h3>
            {isComplete ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]">
                <CheckCircle className="w-3 h-3 text-[#1E6A50] dark:text-[var(--accent-green)]" />
                {strings.fullyCompleteBadge}
              </span>
            ) : (
              <span className="text-xs font-extrabold text-[#14453D] dark:text-[var(--accent-green)] bg-[#D9E8DF] dark:bg-[var(--bg-subtle)] px-2.5 py-0.5 rounded-full">
                {completeness.percentage}% {strings.completenessScore}
              </span>
            )}
          </div>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-1">
            {strings.completenessSubtitle}
          </p>
        </div>

        <div className="text-right sm:text-right shrink-0">
          <span className="text-2xl font-black text-[#14453D] dark:text-[var(--accent-green)]">
            {completeness.percentage}%
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-[#E8EFEA] dark:bg-[var(--bg-raised)] h-2.5 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-[#1E6A50] to-[#10B981]'
              : completeness.percentage >= 70
              ? 'bg-gradient-to-r from-[#14453D] to-[#1E6A50]'
              : 'bg-gradient-to-r from-amber-500 to-[#1E6A50]'
          }`}
          style={{ width: `${Math.max(completeness.percentage, 8)}%` }}
        />
      </div>

      {/* Missing high-value fields prompt */}
      {!isComplete && completeness.missingHighValueFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2421] dark:text-[var(--text-main)] mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{strings.missingFieldsHeader}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {completeness.missingHighValueFields.slice(0, 4).map((item: MissingFieldPrompt) => {
              const label = resolveLocalizedPair(item.labelEn, item.labelHi, lang);
              const helper = resolveLocalizedPair(item.helperEn, item.helperHi, lang);
              return (
                <div
                  key={item.fieldKey}
                  className="bg-[#F8FAF9] dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-lg p-2.5 flex items-center justify-between gap-2 hover:border-[#1E6A50] transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] block truncate">
                      {label}
                    </span>
                    {helper && (
                      <span className="text-[10px] text-[#516A5F] dark:text-[var(--text-secondary)] block truncate">
                        {helper}
                      </span>
                    )}
                  </div>
                  {onCompleteField && (
                    <button
                      type="button"
                      onClick={() => onCompleteField(item.fieldKey)}
                      className="shrink-0 text-[11px] font-bold text-[#14453D] dark:text-[var(--accent-green)] hover:bg-[#D9E8DF] dark:hover:bg-[#1A382D] px-2 py-1 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{strings.completeFieldBtn}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
