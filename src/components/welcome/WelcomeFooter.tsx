import React from 'react';
import { YojanaSetuLogo } from '../YojanaSetuLogo';
import { useTranslation } from '../../i18n';

export const WelcomeFooter: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#141b17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <YojanaSetuLogo size="sm" iconOnly />
            <span className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
              {t('welcome.footerTagline')}
            </span>
          </div>
          <p className="text-[11px] text-[#516A5F] dark:text-[#8FA197] max-w-md leading-relaxed">
            {t('welcome.footerNote')}
          </p>
        </div>
      </div>
    </footer>
  );
};
