import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from '../i18n';

interface TrustFooterStripProps {
  sourceMinistry?: string;
  verifiedDate?: string;
  className?: string;
}

export const TrustFooterStrip: React.FC<TrustFooterStripProps> = ({
  sourceMinistry = 'Ministry of Micro, Small and Medium Enterprises (MSME)',
  verifiedDate = 'August 2024',
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      id="trust-footer-strip"
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E2E0] dark:border-[#24342D] bg-[#F3F4F3] dark:bg-[#111714] px-4 py-2.5 text-xs text-[#3F4943] dark:text-[#9EB0A7] rounded-b-md transition-colors ${className}`}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#0F6B4C] dark:text-[#34D399]" aria-hidden="true" />
        <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
          {t('trustStrip.source')}{' '}
          <span className="font-normal text-[#3F4943] dark:text-[#9EB0A7]">{sourceMinistry}</span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-[#516A5F] dark:text-[#9EB0A7]">
        <span>
          {t('trustStrip.lastVerified')}{' '}
          <strong className="font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">{verifiedDate}</strong>
        </span>
        <span className="hidden sm:inline text-[#BEC9C1] dark:text-[#41534A]">•</span>
        <span className="hidden sm:inline bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#34D399] font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
          {t('trustStrip.ruleChecked')}
        </span>
      </div>
    </div>
  );
};
