/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n';
import { ArrowRight, UserCheck } from 'lucide-react';

interface PartialProfileBannerProps {
  completeness: {
    percentage: number;
    missingFields: string[];
    missingFieldsHi: string[];
  };
  onCompleteProfile: () => void;
  id?: string;
}

export const PartialProfileBanner: React.FC<PartialProfileBannerProps> = ({
  completeness,
  onCompleteProfile,
  id = 'partial-profile-banner',
}) => {
  const { t, language } = useTranslation();

  if (completeness.percentage >= 100) {
    return null;
  }

  const missingList = language === 'hi' ? completeness.missingFieldsHi : completeness.missingFields;

  return (
    <div
      id={id}
      className="mb-6 p-4 sm:p-5 rounded-xl bg-blue-50/80 dark:bg-[#0D2438] border border-blue-200/80 dark:border-[#194366] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              {t('navProfile')}
            </span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-[#153854] px-2 py-0.5 rounded-full">
              {completeness.percentage}%
            </span>
          </div>

          <p className="text-sm font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] mt-1">
            {missingList.length} {t('missingFieldsAlert')} ({missingList.slice(0, 3).join(', ')})
          </p>
          <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
            {t('completeProfilePrompt')}
          </p>
        </div>
      </div>

      <button
        id="complete-profile-btn"
        type="button"
        onClick={onCompleteProfile}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
      >
        <span>{t('completeProfileBtn')}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
