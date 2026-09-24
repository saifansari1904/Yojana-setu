/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Calendar, IndianRupee, MapPin, Edit2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { useTranslation, PROFILE_I18N } from '../../i18n';

interface DemographicsSectionProps {
  profile: UserProfile;
  onEditSection: (tab: 'personal') => void;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({
  profile,
  onEditSection,
}) => {
  const { lang, formatCurrency, getLocalizedCategory, getLocalizedState } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const categoryLabel = getLocalizedCategory(profile.category);
  const stateLabel = getLocalizedState(profile.state);

  // Policy insights
  const isSpecialCategory = ['sc', 'st', 'obc', 'woman', 'minority'].includes(profile.category.toLowerCase());
  const isYouth = profile.age >= 18 && profile.age <= 35;

  return (
    <div
      id="profile-demographics-section"
      className="bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <User className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)]" />
            {strings.personalTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5">
            {strings.personalSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEditSection('personal')}
          className="text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] hover:bg-[#D9E8DF] dark:hover:bg-[var(--bg-subtle)] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{strings.editProfileBtn}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Full Name */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.applicantName}
          </span>
          <span className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] mt-1 block">
            {profile.applicantName || strings.notSpecified}
          </span>
        </div>

        {/* Social Category */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.category}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {categoryLabel}
            </span>
            {isSpecialCategory && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]">
                Special Concession
              </span>
            )}
          </div>
        </div>

        {/* Age & Bracket */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.age} / {strings.ageBracket}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {profile.age} Years
            </span>
            {isYouth ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                Youth (18–35)
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                Standard (36+)
              </span>
            )}
          </div>
        </div>

        {/* Gender */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.gender}
          </span>
          <span className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] mt-1 block capitalize">
            {profile.gender || strings.notSpecified}
          </span>
        </div>

        {/* Annual Income */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.annualIncome}
          </span>
          <span className="text-sm font-bold text-[#14453D] dark:text-[var(--accent-green)] mt-1 block">
            {formatCurrency(profile.annualIncome)}
          </span>
        </div>

        {/* State & District */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.state} / {strings.district}
          </span>
          <span className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] mt-1 block">
            {profile.district ? `${profile.district}, ${stateLabel}` : stateLabel}
          </span>
        </div>
      </div>

      {/* Statutory Concession Callout Strip */}
      <div className="mt-4 p-3 rounded-xl bg-[#D9E8DF] dark:bg-[var(--bg-subtle)] border border-[#D9E8DF] dark:border-[#1E3E2E] flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)] shrink-0 mt-0.5" />
        <div className="text-xs text-[#14453D] dark:text-[var(--accent-green)]">
          <span className="font-bold">Statutory Reservation Notice: </span>
          {isSpecialCategory ? (
            <span>
              Under Government of India MSME guidelines (PMEGP, Stand-Up India), your social category unlocks elevated subsidy rates (up to 35% in rural areas) and reduced beneficiary promoter contribution (down to 5%).
            </span>
          ) : (
            <span>
              Standard General category rules apply. General category applicants are eligible for up to 25% margin money subsidy in rural areas and 15% in urban areas under PMEGP.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
