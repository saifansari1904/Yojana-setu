/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n';
import { Language } from '../../../i18n/types';
import { ArrowRight, UserCheck } from 'lucide-react';

const FIELD_TRANSLATIONS: Record<string, Partial<Record<Language, string>>> = {
  'Business Name': {
    en: 'Business Name',
    hi: 'व्यवसाय का नाम',
    ta: 'வணிகப் பெயர்',
    te: 'వ్యాపార పేరు',
    kn: 'ವ್ಯಾಪಾರದ ಹೆಸರು',
    ml: 'ബിസിനസ്സ് നാമം',
    mr: 'व्यवसायाचे नाव',
  },
  'Business Type': {
    en: 'Business Type',
    hi: 'व्यवसाय का प्रकार',
    ta: 'வணிக வகை',
    te: 'వ్యాపార రకం',
    kn: 'ವ್ಯಾಪಾರದ ಪ್ರಕಾರ',
    ml: 'ബിസിനസ്സ് തരം',
    mr: 'व्यवसायाचा प्रकार',
  },
  'Business Stage': {
    en: 'Business Stage',
    hi: 'व्यवसाय चरण',
    ta: 'வணிக நிலை',
    te: 'వ్యాపార దశ',
    kn: 'ವ್ಯಾಪಾರ ಹಂತ',
    ml: 'ബിസിനസ്സ് ഘട്ടം',
    mr: 'व्यवसाय टप्पा',
  },
  'State / Location': {
    en: 'State / Location',
    hi: 'राज्य / स्थान',
    ta: 'மாநிலம் / இருப்பிடம்',
    te: 'రాష్ట్రం / ప్రాంతం',
    kn: 'ರಾಜ್ಯ / ಸ್ಥಳ',
    ml: 'സംസ്ഥാനം / പ്രദേശം',
    mr: 'राज्य / स्थान',
  },
  'Social Category': {
    en: 'Social Category',
    hi: 'सामाजिक श्रेणी',
    ta: 'சமூகப் பிரிவு',
    te: 'సామాజిక వర్గం',
    kn: 'ಸಾಮಾಜಿಕ ವರ್ಗ',
    ml: 'സാമൂഹിക വിഭാഗം',
    mr: 'सामाजिक प्रवर्ग',
  },
  'Age': {
    en: 'Age',
    hi: 'आयु',
    ta: 'வயது',
    te: 'వయస్సు',
    kn: 'ವಯಸ್ಸು',
    ml: 'പ്രായം',
    mr: 'वय',
  },
  'Annual Income': {
    en: 'Annual Income',
    hi: 'वार्षिक आय',
    ta: 'ஆண்டு வருமானம்',
    te: 'వార్షిక ఆదాయం',
    kn: 'ವಾರ್ಷಿಕ ಆದಾಯ',
    ml: 'വാർഷിക വരുമാനം',
    mr: 'वार्षिक उत्पन्न',
  },
  'Investment Requirement': {
    en: 'Investment Requirement',
    hi: 'निवेश आवश्यकता',
    ta: 'முதலீட்டுத் தேவை',
    te: 'పెట్టుబడి అవసరం',
    kn: 'ಹೂಡಿಕೆ ಅಗತ್ಯತೆ',
    ml: 'നിക്ഷേപ ആവശ്യം',
    mr: 'गुंतवणूक गरज',
  },
};

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

  const missingList = completeness.missingFields.map(
    (field) => FIELD_TRANSLATIONS[field]?.[language] || FIELD_TRANSLATIONS[field]?.en || field
  );

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

          <p className="text-sm font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mt-1">
            {missingList.length} {t('missingFieldsAlert')} ({missingList.slice(0, 3).join(', ')})
          </p>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5">
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
