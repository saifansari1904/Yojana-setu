/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building2, Layers, Briefcase, Globe, Edit2, Clock, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { useTranslation, PROFILE_I18N } from '../../i18n';

interface BusinessSectionProps {
  profile: UserProfile;
  onEditSection: (tab: 'business') => void;
}

export const BusinessSection: React.FC<BusinessSectionProps> = ({
  profile,
  onEditSection,
}) => {
  const {
    lang,
    getLocalizedBusinessType,
    getLocalizedBusinessStage,
    getLocalizedEntity,
    getLocalizedState,
  } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const businessTypeLabel = getLocalizedBusinessType(profile.businessType);
  const stageKey = profile.businessStageKey || 'PRE_LAUNCH';
  const stageLabel = getLocalizedBusinessStage(stageKey);
  const entityType = profile.businessEntityType || 'SOLE_PROPRIETORSHIP';
  const entityLabel = getLocalizedEntity(entityType);

  const operatingState = profile.businessState || profile.state;
  const operatingStateLabel = getLocalizedState(operatingState);
  const isInterstate = profile.isInterstate || (profile.businessState && profile.businessState !== profile.state);

  return (
    <div
      id="profile-business-section"
      className="bg-white dark:bg-[#151C19] border border-[#DEE7E2] dark:border-[#223F30] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#E8EFEA] dark:border-[#223F30] mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[#F0F4F2] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#14453D] dark:text-[#4ADE80]" />
            {strings.businessTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
            {strings.businessSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEditSection('business')}
          className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:bg-[#D9E8DF] dark:hover:bg-[#162B22] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{strings.editProfileBtn}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Enterprise Name */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[#121915] rounded-xl border border-[#E8EFEA] dark:border-[#1E2E27]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] block uppercase tracking-wider">
            {strings.businessName}
          </span>
          <span className="text-sm font-bold text-[#1F2421] dark:text-[#F0F4F2] mt-1 block">
            {profile.businessName || strings.notSpecified}
          </span>
        </div>

        {/* Industry Sector */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[#121915] rounded-xl border border-[#E8EFEA] dark:border-[#1E2E27]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] block uppercase tracking-wider">
            {strings.sector}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-[#14453D] dark:text-[#4ADE80]">
              {businessTypeLabel}
            </span>
            {profile.subSector && (
              <span className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7]">
                • {profile.subSector}
              </span>
            )}
          </div>
        </div>

        {/* Enterprise Stage */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[#121915] rounded-xl border border-[#E8EFEA] dark:border-[#1E2E27]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] block uppercase tracking-wider">
            {strings.businessStage}
          </span>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9E8DF] dark:bg-[#162B22] text-[#14453D] dark:text-[#4ADE80] border border-[#D9E8DF] dark:border-[#1E3E2E]">
              <Layers className="w-3 h-3" />
              {stageLabel}
            </span>
          </div>
        </div>

        {/* Legal Structure */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[#121915] rounded-xl border border-[#E8EFEA] dark:border-[#1E2E27]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] block uppercase tracking-wider">
            {strings.entityType}
          </span>
          <span className="text-sm font-bold text-[#1F2421] dark:text-[#F0F4F2] mt-1 block">
            {entityLabel}
          </span>
        </div>

        {/* Operating Location */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[#121915] rounded-xl border border-[#E8EFEA] dark:border-[#1E2E27]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] block uppercase tracking-wider">
            {strings.businessLocation}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-[#1F2421] dark:text-[#F0F4F2]">
              {operatingStateLabel}
            </span>
            {isInterstate && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Interstate
              </span>
            )}
          </div>
        </div>

        {/* Experience */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[#121915] rounded-xl border border-[#E8EFEA] dark:border-[#1E2E27]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] block uppercase tracking-wider">
            {strings.experienceYears}
          </span>
          <span className="text-sm font-bold text-[#1F2421] dark:text-[#F0F4F2] mt-1 block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#516A5F]" />
            {profile.entrepreneurExperienceYears != null
              ? `${profile.entrepreneurExperienceYears} Years`
              : strings.notSpecified}
          </span>
        </div>
      </div>

      {/* Business Concept / Activity Summary */}
      {profile.businessIdea && (
        <div className="mt-4 p-3.5 rounded-xl bg-[#F8FAF9] dark:bg-[#101714] border border-[#E0E9E4] dark:border-[#1E2E27]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#9EB0A7] block mb-1">
            {strings.businessIdea}
          </span>
          <p className="text-xs sm:text-sm text-[#1F2421] dark:text-[#F0F4F2] leading-relaxed">
            {profile.businessIdea}
          </p>
        </div>
      )}

      {/* Interstate Notice if applicable */}
      {isInterstate && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Interstate Unit Note:</strong> Your business operates in {operatingStateLabel}, while your domicile state is {getLocalizedState(profile.state)}. Central schemes like PMEGP and Mudra function nationwide, but state-sponsored subsidies apply based on unit location.
          </span>
        </div>
      )}
    </div>
  );
};
