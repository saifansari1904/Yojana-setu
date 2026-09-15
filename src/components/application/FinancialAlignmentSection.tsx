import React from 'react';
import { IndianRupee, ShieldCheck, Coins, Percent, Clock, AlertCircle } from 'lucide-react';
import type { Scheme } from '../../types/scheme';
import type { UserProfile } from '../../types/user';
import { useTranslation } from '../../i18n';
import { evaluateFundingFit } from '../../lib/matching/fundingFit';

interface FinancialAlignmentSectionProps {
  scheme: Scheme;
  userProfile: UserProfile;
}

export const FinancialAlignmentSection: React.FC<FinancialAlignmentSectionProps> = ({
  scheme,
  userProfile,
}) => {
  const { t, formatCurrency, lang } = useTranslation();
  const fundingFit = evaluateFundingFit(scheme, userProfile, lang);

  // Derive estimated promoter contribution and subsidy percentage
  const investment = userProfile.investmentAmount || userProfile.fundingRequired || scheme.maxAmount || 1000000;
  const isSpecialCategory = ['SC', 'ST', 'OBC', 'WOMAN'].includes(userProfile.category.toUpperCase());
  const promoterMarginRate = isSpecialCategory ? 0.05 : 0.1;
  const estimatedMargin = Math.round(investment * promoterMarginRate);

  const subsidyRate = scheme.subsidyRatePercent ? scheme.subsidyRatePercent / 100 : 0.25;
  const estimatedSubsidy = scheme.subsidyCap
    ? Math.min(investment * subsidyRate, scheme.subsidyCap)
    : investment * subsidyRate;

  return (
    <div id="financial-alignment-section" className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7] dark:border-[#22332A]">
        <div>
          <h3 className="text-base font-bold text-[#1F2421] dark:text-[#F0F4F2] flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {t('workspace.financialTitle')}
          </h3>
          <p className="text-xs text-[#5A6561] dark:text-[#97A7A0] mt-1">
            {t('workspace.financialDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <ShieldCheck className="w-4 h-4" />
          <span>Statutory Alignment</span>
        </div>
      </div>

      {/* Funding fit status banner */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 text-xs">
        <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 mb-1">
          <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Financial Scope Evaluation</span>
        </div>
        <p className="text-[#5A6561] dark:text-[#97A7A0] leading-relaxed">
          {fundingFit.explanation}
        </p>
      </div>

      {/* Key Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-white dark:bg-[#151D19]">
          <span className="text-[11px] font-semibold text-[#5A6561] dark:text-[#97A7A0] uppercase tracking-wider block mb-1">
            {t('workspace.projectCostLabel')}
          </span>
          <div className="text-lg font-bold text-[#1F2421] dark:text-[#F0F4F2]">
            {formatCurrency(investment)}
          </div>
          <span className="text-[11px] text-[#5A6561] dark:text-[#97A7A0] mt-1 block">
            Ceiling: {scheme.maxAmount ? formatCurrency(scheme.maxAmount) : 'As per DPR'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-white dark:bg-[#151D19]">
          <span className="text-[11px] font-semibold text-[#5A6561] dark:text-[#97A7A0] uppercase tracking-wider block mb-1">
            {t('workspace.promoterMarginLabel')}
          </span>
          <div className="text-lg font-bold text-[#0F6B4C] dark:text-[#4ADE80]">
            ~{formatCurrency(estimatedMargin)}
          </div>
          <span className="text-[11px] text-[#5A6561] dark:text-[#97A7A0] mt-1 block">
            {Math.round(promoterMarginRate * 100)}% based on {userProfile.category} category
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-white dark:bg-[#151D19]">
          <span className="text-[11px] font-semibold text-[#5A6561] dark:text-[#97A7A0] uppercase tracking-wider block mb-1">
            {t('workspace.subsidyEligibleLabel')}
          </span>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {scheme.subsidyRatePercent ? `Up to ${scheme.subsidyRatePercent}%` : formatCurrency(estimatedSubsidy)}
          </div>
          <span className="text-[11px] text-[#5A6561] dark:text-[#97A7A0] mt-1 block">
            {scheme.subsidyCap ? `Max cap: ${formatCurrency(scheme.subsidyCap)}` : 'Subject to guidelines'}
          </span>
        </div>
      </div>

      {/* Additional Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-[#FAFAF9] dark:bg-[#1A2520]/40 flex items-start gap-3">
          <Percent className="w-4 h-4 text-[#8E9B94] mt-0.5" />
          <div>
            <div className="font-semibold text-[#1F2421] dark:text-[#F0F4F2]">Indicative Interest & Concession</div>
            <div className="text-[#5A6561] dark:text-[#97A7A0] mt-0.5">
              {scheme.baseInterestRate ? `${scheme.baseInterestRate}% per annum` : 'Governed by lending bank benchmark rates (MCLR / Repo)'}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-[#FAFAF9] dark:bg-[#1A2520]/40 flex items-start gap-3">
          <Clock className="w-4 h-4 text-[#8E9B94] mt-0.5" />
          <div>
            <div className="font-semibold text-[#1F2421] dark:text-[#F0F4F2]">Loan Repayment & Moratorium</div>
            <div className="text-[#5A6561] dark:text-[#97A7A0] mt-0.5">
              {scheme.standardTenureYears ? `${scheme.standardTenureYears} Years Tenure` : 'Standard 3 to 7 years'}{' '}
              {scheme.moratoriumPeriodMonths ? `(${scheme.moratoriumPeriodMonths} months moratorium)` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
