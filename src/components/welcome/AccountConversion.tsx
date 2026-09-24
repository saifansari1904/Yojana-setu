import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { RevealOnScroll } from '../../animations/RevealOnScroll';
import { ArrowFillButton } from '../ui';

interface AccountConversionProps {
  onSignIn: () => void;
  onFindSchemes: () => void;
}

export const AccountConversion: React.FC<AccountConversionProps> = ({ onSignIn, onFindSchemes }) => {
  const { t } = useTranslation();

  return (
    <section id="welcome-account" className="bg-white dark:bg-[#141b17] border-y border-[#E4E8E4] dark:border-[#24342D]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
        <RevealOnScroll>
          <div className="w-12 h-12 rounded-2xl bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-6 h-6 text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] leading-snug mb-3">
            {t('welcome.accountTitle')}
          </h2>
          <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed mb-8 max-w-xl mx-auto">
            {t('welcome.accountDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <ArrowFillButton onClick={onSignIn} variant="primary" size="lg" className="group min-w-[220px] justify-center">
              {t('welcome.accountCtaPrimary')}
            </ArrowFillButton>
            <button
              onClick={onFindSchemes}
              className="px-6 py-3 min-h-[48px] rounded-xl text-sm font-bold text-[#14453D] dark:text-[#4ADE80] hover:bg-[#14453D]/5 dark:hover:bg-[#4ADE80]/5 transition-colors cursor-pointer"
            >
              {t('welcome.accountSecondary')}
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};
