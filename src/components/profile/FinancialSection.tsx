/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndianRupee, PieChart, TrendingUp, Target, Edit2, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { calculateFundingGap, formatLakhCrore } from '../../lib/business';
import { useTranslation, PROFILE_I18N } from '../../i18n';

interface FinancialSectionProps {
  profile: UserProfile;
  onEditSection: (tab: 'financial') => void;
}

export const FinancialSection: React.FC<FinancialSectionProps> = ({
  profile,
  onEditSection,
}) => {
  const { lang, formatCurrency, getLocalizedSupportNeed } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const totalCost = profile.totalProjectCost || profile.fundingRequired || 500000;
  const ownMargin = profile.existingInvestment || profile.investmentAmount || 0;
  const fundingGap = profile.fundingGap || calculateFundingGap(totalCost, ownMargin);

  const marginRatio = totalCost > 0 ? Math.min(100, Math.round((ownMargin / totalCost) * 100)) : 10;
  const gapRatio = 100 - marginRatio;

  const primaryNeed = profile.primarySupportNeed || 'WORKING_CAPITAL';
  const primaryNeedLabel = getLocalizedSupportNeed(primaryNeed);

  return (
    <div
      id="profile-financial-section"
      className="bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)]" />
            {strings.financialTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5">
            {strings.financialSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEditSection('financial')}
          className="text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] hover:bg-[#D9E8DF] dark:hover:bg-[var(--bg-subtle)] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{strings.editProfileBtn}</span>
        </button>
      </div>

      {/* Capital Architecture Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Total Project Cost */}
        <div className="p-4 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.totalProjectCost}
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[#1F2421] dark:text-[var(--text-main)] mt-1 block">
            {formatCurrency(totalCost)}
          </span>
          <span className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5 block">
            ({formatLakhCrore(totalCost)})
          </span>
        </div>

        {/* Own Promoter Contribution */}
        <div className="p-4 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider">
            {strings.ownInvestment} ({marginRatio}%)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[#14453D] dark:text-[var(--accent-green)] mt-1 block">
            {formatCurrency(ownMargin)}
          </span>
          <span className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5 block">
            Promoter Margin
          </span>
        </div>

        {/* Calculated Funding Gap */}
        <div className="p-4 bg-[#F4F8F5] dark:bg-[var(--bg-card)] rounded-xl border border-[#D9E8DF] dark:border-[#1E3E2E]">
          <span className="text-[11px] font-semibold text-[#14453D] dark:text-[var(--accent-green)] block uppercase tracking-wider">
            {strings.fundingGap} ({gapRatio}%)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[#1E6A50] dark:text-[var(--accent-green)] mt-1 block">
            {formatCurrency(fundingGap)}
          </span>
          <span className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5 block">
            Eligible for Bank / Scheme Credit
          </span>
        </div>
      </div>

      {/* Visual Stack Proportion Bar */}
      <div className="mb-5 p-4 rounded-xl bg-[#F9FAF9] dark:bg-[var(--bg-card)] border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-xs font-semibold text-[#1F2421] dark:text-[var(--text-main)] mb-2">
          <span>Capital Structure Distribution</span>
          <span>{formatCurrency(totalCost)}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#E8EFEA] dark:bg-[var(--bg-raised)] overflow-hidden flex">
          <div
            className="bg-[#14453D] dark:bg-[#1F6E5E] h-full transition-all"
            style={{ width: `${marginRatio}%` }}
            title={`Promoter Margin: ${marginRatio}%`}
          />
          <div
            className="bg-[#175741] dark:bg-[var(--accent-green)] h-full transition-all"
            style={{ width: `${gapRatio}%` }}
            title={`Scheme Financing Gap: ${gapRatio}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] mt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14453D] dark:bg-[#1F6E5E]" />
            Promoter Margin: {marginRatio}% ({formatCurrency(ownMargin)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#175741] dark:bg-[var(--accent-green)]" />
            Scheme / Debt Credit: {gapRatio}% ({formatCurrency(fundingGap)})
          </span>
        </div>
      </div>

      {/* Support Priorities and Turnover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary Priority */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider mb-1">
            {strings.primaryNeed}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]">
            <Target className="w-3.5 h-3.5" />
            {primaryNeedLabel}
          </span>
        </div>

        {/* Annual Turnover */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider mb-1">
            {strings.turnover}
          </span>
          <span className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)]">
            {profile.existingTurnover != null && profile.existingTurnover > 0
              ? formatCurrency(profile.existingTurnover)
              : profile.hasExistingBusiness
              ? 'Below ₹5 Lakh'
              : 'New Enterprise (Pre-revenue)'}
          </span>
        </div>
      </div>
    </div>
  );
};
