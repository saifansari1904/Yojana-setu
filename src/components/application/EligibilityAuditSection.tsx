import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import type { MatchResult } from '../../types/matching';
import type { UserProfile } from '../../types/user';
import { useTranslation } from '../../i18n';

interface EligibilityAuditSectionProps {
  matchResult: MatchResult;
  userProfile: UserProfile;
}

export const EligibilityAuditSection: React.FC<EligibilityAuditSectionProps> = ({
  matchResult,
  userProfile,
}) => {
  const { t, getLocalizedCategory, getLocalizedBusinessType, getLocalizedState } = useTranslation();

  const blockers = matchResult.confirmedBlockers || [];
  const unknowns = matchResult.unknownCriteria || [];
  const metCriteria = matchResult.matchedCriteria || [];

  return (
    <div id="eligibility-audit-section" className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7] dark:border-[#22332A]">
        <div>
          <h3 className="text-base font-bold text-[#1F2421] dark:text-[#F0F4F2] flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#1E6A50] dark:text-[#4ADE80]" />
            {t('workspace.eligibilityTitle')}
          </h3>
          <p className="text-xs text-[#5A6561] dark:text-[#97A7A0] mt-1">
            {t('workspace.eligibilityDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          <span>{matchResult.matchPercentage}% Statutory Fit</span>
        </div>
      </div>

      {/* Blockers alert if any */}
      {blockers.length > 0 ? (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{t('workspace.blockersFound')}</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1">
            {blockers.map((b, idx) => (
              <li key={idx}>
                <strong>{b.factorLabel}:</strong> {b.explanation || b.statutoryRequirement}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold">{t('workspace.noBlockers')}: </span>
            <span>Your enterprise profile satisfies all statutory age, community, territorial, and activity limits.</span>
          </div>
        </div>
      )}

      {/* Unknown criteria if any */}
      {unknowns.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t('workspace.unknownFactors')}</span>
          </div>
          <p className="text-xs text-[#5A6561] dark:text-[#97A7A0] mb-2">
            The following criteria could not be evaluated strictly from your current profile answers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unknowns.map((u, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white dark:bg-[#141b17] border border-amber-200 dark:border-amber-900 text-xs"
              >
                <div className="font-semibold">{u.factorLabel}</div>
                <div className="text-[11px] text-[#5A6561] dark:text-[#97A7A0]">{u.explanation || u.statutoryRequirement}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory Parameters Table */}
      <div className="rounded-xl border border-[#E5E9E7] dark:border-[#22332A] overflow-hidden">
        <div className="bg-[#F4F7F5] dark:bg-[#1d2822] px-4 py-3 border-b border-[#E5E9E7] dark:border-[#22332A] text-xs font-bold text-[#1F2421] dark:text-[#F0F4F2]">
          Statutory Verification Profile
        </div>
        <div className="divide-y divide-[#E5E9E7] dark:divide-[#22332A] text-xs">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[#5A6561] dark:text-[#97A7A0]">Target Beneficiary & Social Category</span>
            <span className="font-semibold text-[#1F2421] dark:text-[#F0F4F2]">
              {getLocalizedCategory(userProfile.category)}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[#5A6561] dark:text-[#97A7A0]">Applicant Age & Legal Majority</span>
            <span className="font-semibold text-[#1F2421] dark:text-[#F0F4F2]">
              {userProfile.age} years (Verified Majority)
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[#5A6561] dark:text-[#97A7A0]">Business Activity Domain</span>
            <span className="font-semibold text-[#1F2421] dark:text-[#F0F4F2]">
              {getLocalizedBusinessType(userProfile.businessType)}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[#5A6561] dark:text-[#97A7A0]">State / Territorial Jurisdiction</span>
            <span className="font-semibold text-[#1F2421] dark:text-[#F0F4F2]">
              {getLocalizedState(userProfile.state)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
