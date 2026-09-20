/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n';
import { ShieldCheck, Building2, AlertTriangle, ExternalLink, Info } from 'lucide-react';

interface TrustOverviewProps {
  summary: {
    visibleSchemesCount: number;
    recentlyVerifiedCount: number;
    recentlyVerifiedPercentage: number;
    officialSourcesCount: number;
    needsVerificationCount: number;
    nodalSourcesCount: number;
  };
  id?: string;
}

export const TrustOverview: React.FC<TrustOverviewProps> = ({
  summary,
  id = 'trust-overview',
}) => {
  const { t } = useTranslation();

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EAECEB] dark:border-[#24342D]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#1E6A50] dark:text-[#4ADE80]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#3F4943] dark:text-[#C5D5CC]">
            {t('trustTitle')}
          </h3>
        </div>
        <span className="text-xs text-[#516A5F] dark:text-[#8E9F97] font-medium">
          {t('statutoryAuditNotice')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Verified Percentage */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-[#142E25] border border-[#D9E8DF] dark:border-[#22503E]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#14453D] dark:text-[#4ADE80]">{t('recentlyVerified')}</span>
            <ShieldCheck className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80]" />
          </div>
          <div className="text-xl font-bold text-emerald-950 dark:text-[#D9E8DF] mt-1 tabular-nums">
            {summary.recentlyVerifiedPercentage}%
          </div>
          <p className="text-[11px] text-[#1E6A50] dark:text-[#4ADE80] mt-0.5">
            {summary.recentlyVerifiedCount} of {summary.visibleSchemesCount} schemes audited within 180 days
          </p>
        </div>

        {/* Metric 2: Official Sources */}
        <div className="p-3.5 rounded-lg bg-[#FAFAF9] dark:bg-[#1A2420] border border-[#E4E8E4] dark:border-[#24342D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#3F4943] dark:text-[#C5D5CC]">{t('officialSources')}</span>
            <Building2 className="w-4 h-4 text-[#516A5F] dark:text-[#9EB0A7]" />
          </div>
          <div className="text-xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mt-1 tabular-nums">
            {summary.officialSourcesCount}
          </div>
          <p className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] mt-0.5">
            Verified .gov.in and .nic.in apex portals
          </p>
        </div>

        {/* Metric 3: Nodal Agencies */}
        <div className="p-3.5 rounded-lg bg-sky-50/70 dark:bg-[#0E2A38] border border-sky-100 dark:border-[#164459]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-800 dark:text-sky-300">{t('nodalSources')}</span>
            <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-950 dark:text-sky-100 mt-1 tabular-nums">
            {summary.nodalSourcesCount}
          </div>
          <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">
            Statutory platforms (SIDBI, KVIC, CGTMSE)
          </p>
        </div>

        {/* Metric 4: Needs Verification */}
        <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-[#3B2F14] border border-[#FCD34D]/40 dark:border-amber-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#92610A] dark:text-[#FCD34D]">{t('needsVerification')}</span>
            <AlertTriangle className="w-4 h-4 text-[#92610A] dark:text-[#FCD34D]" />
          </div>
          <div className="text-xl font-bold text-amber-950 dark:text-[#FCD34D] mt-1 tabular-nums">
            {summary.needsVerificationCount}
          </div>
          <p className="text-[11px] text-[#92610A] dark:text-[#FCD34D] mt-0.5">
            Flagged for scheduled quarterly re-verification
          </p>
        </div>
      </div>
    </div>
  );
};
