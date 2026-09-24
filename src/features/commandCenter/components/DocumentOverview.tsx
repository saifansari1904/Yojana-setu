/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { resolveLocalizedPair } from '../../../i18n/resolveLocalized';
import type { Language } from '../../../i18n/types';
import { DocumentStatus } from '../types';
import { useTranslation } from '../i18n';
import { FileCheck, AlertCircle, HelpCircle, ShieldCheck, ArrowRight } from 'lucide-react';

const COMMON_DOC_LOCALIZED: Record<string, Record<string, string>> = {
  aadhaar: {
    en: 'Aadhaar Card',
    hi: 'आधार कार्ड',
    ta: 'ஆதார் அட்டை',
    te: 'ఆధార్ కార్డు',
    kn: 'ಆಧಾರ್ ಕಾರ್ಡ್',
    ml: 'ആധാർ കാർഡ്',
    mr: 'आधार कार्ड',
  },
  pan: {
    en: 'PAN Card',
    hi: 'पैन कार्ड',
    ta: 'பான் அட்டை',
    te: 'పాన్ కార్డు',
    kn: 'ಪ್ಯಾನ್ ಕಾರ್ಡ್',
    ml: 'പാൻ കാർഡ്',
    mr: 'पॅन कार्ड',
  },
  photo: {
    en: 'Passport Photograph',
    hi: 'पासपोर्ट फोटो',
    ta: 'பாஸ்போர்ட் புகைப்படம்',
    te: 'పాస్‌పోర్ట్ ఫోటో',
    kn: 'ಪಾಸ್‌ಪೋರ್ಟ್ ಭಾವಚಿತ್ರ',
    ml: 'പാസ്‌പോർട്ട് ഫോട്ടോ',
    mr: 'पासपोर्ट छायाचित्र',
  },
  bank: {
    en: 'Bank Passbook / Statement',
    hi: 'बैंक पासबुक / विवरण',
    ta: 'வங்கி கணக்கு புத்தகம் / அறிக்கை',
    te: 'బ్యాంక్ పాస్‌బుక్ / స్టేట్‌మెంట్',
    kn: 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ / ಸ್ಟೇಟ್‌ಮೆಂಟ್',
    ml: 'ബാങ്ക് പാസ്ബുക്ക് / സ്റ്റേറ്റ്മെന്റ്',
    mr: 'बँक पासबुक / विवरणपत्र',
  },
  caste: {
    en: 'Caste Certificate',
    hi: 'जाति प्रमाण पत्र',
    ta: 'சாதிச் சான்றிதழ்',
    te: 'కుల ధృవీకరణ పత్రం',
    kn: 'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ',
    ml: 'ജാതി സർട്ടിഫിക്കറ്റ്',
    mr: 'जात प्रमाणपत्र',
  },
  income: {
    en: 'Income Certificate',
    hi: 'आय प्रमाण पत्र',
    ta: 'வருமானச் சான்றிதழ்',
    te: 'ఆదాయ ధృవీకరణ పత్రం',
    kn: 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ',
    ml: 'വരുമാന സർട്ടിഫിക്കറ്റ്',
    mr: 'उत्पन्न प्रमाणपत्र',
  },
  address: {
    en: 'Address Proof / Domicile',
    hi: 'निवास / पते का प्रमाण',
    ta: 'முகவரிச் சான்று / இருப்பிடச் சான்று',
    te: 'చిరునామా రుజువు / నివాస ధృవీకరణ పత్రం',
    kn: 'ವಿಳಾಸ ಪುರಾವೆ / ನಿವಾಸ ಪ್ರಮಾಣಪತ್ರ',
    ml: 'മേൽവിലാസ രേഖ / സ്ഥിരതാമസ സർട്ടിഫിക്കറ്റ്',
    mr: 'पत्ता पुरावा / रहिवासी प्रमाणपत्र',
  },
  signature: {
    en: 'Specimen Signature',
    hi: 'हस्ताक्षर नमूना',
    ta: 'மாதிரி கையொப்பம்',
    te: 'సంతకం నమూనా',
    kn: 'ಮಾದರಿ ಸಹಿ',
    ml: 'മാതൃകാ ഒപ്പ്',
    mr: 'नमुना स्वाक्षरी',
  },
};

function getLocalizedDocName(doc: { name: string; nameHi?: string }, lang: Language): string {
  const lower = doc.name.toLowerCase();
  for (const [key, mapping] of Object.entries(COMMON_DOC_LOCALIZED)) {
    if (lower.includes(key)) {
      return mapping[lang] || mapping.en;
    }
  }
  return resolveLocalizedPair(doc.name, doc.nameHi, lang);
}

interface DocumentOverviewProps {
  summary: {
    prepared: number;
    needPreparation: number;
    unknown: number;
    reusable: { id: string; name: string; nameHi: string; status: DocumentStatus }[];
    applicationSpecific: { id: string; name: string; nameHi: string; schemeCode?: string; status: DocumentStatus }[];
  };
  onOpenDocumentCenter: () => void;
  id?: string;
}

export const DocumentOverview: React.FC<DocumentOverviewProps> = ({
  summary,
  onOpenDocumentCenter,
  id = 'document-overview',
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'reusable' | 'specific'>('reusable');

  const statusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'PREPARED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E6A50] dark:text-[#4ADE80] bg-[#C1E2D0] dark:bg-[#22503E] px-2 py-0.5 rounded-full">
            <FileCheck className="w-3 h-3" />
            {t('prepared')}
          </span>
        );
      case 'NEED_PREPARATION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#92610A] dark:text-[#FCD34D] bg-[#FEF3C7] dark:bg-[#3B2F14] px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            {t('needPreparation')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] bg-[#F3F4F3] dark:bg-[#1d2822] px-2 py-0.5 rounded-full">
            <HelpCircle className="w-3 h-3" />
            {t('unknown')}
          </span>
        );
    }
  };

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#8E9F97]">
            {t('documentCenterTitle')}
          </h3>
          <span className="text-xs text-[#516A5F] dark:text-[#8E9F97] font-medium">Readiness Tracker</span>
        </div>

        {/* Readiness Count Metrics */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="p-3 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] border border-[#D9E8DF] dark:border-[#22503E] text-center">
            <div className="text-xs font-semibold text-[#14453D] dark:text-[#4ADE80]">{t('prepared')}</div>
            <div className="text-xl font-bold text-[#0B302B] dark:text-[#D9E8DF] mt-1 tabular-nums">
              {summary.prepared}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#FEF3C7] dark:bg-[#3B2F14] border border-[#FCD34D]/40 dark:border-amber-700/60 text-center">
            <div className="text-xs font-semibold text-[#92610A] dark:text-[#FCD34D]">{t('needPreparation')}</div>
            <div className="text-xl font-bold text-amber-900 dark:text-[#FCD34D] mt-1 tabular-nums">
              {summary.needPreparation}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#FAFAF9] dark:bg-[#1d2822] border border-[#E4E8E4] dark:border-[#24342D] text-center">
            <div className="text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC]">{t('unknown')}</div>
            <div className="text-xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mt-1 tabular-nums">
              {summary.unknown}
            </div>
          </div>
        </div>

        {/* Tab Toggle: Reusable vs Application Specific */}
        <div className="flex border-b border-[#E4E8E4] dark:border-[#24342D] mb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('reusable')}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'reusable'
                ? 'border-[#14453D] dark:border-[#4ADE80] text-[#1A1C1B] dark:text-[#F0F4F2]'
                : 'border-transparent text-[#516A5F] dark:text-[#8E9F97] hover:text-[#3F4943] dark:hover:text-[#F0F4F2]'
            }`}
          >
            {t('reusableDocuments')} ({summary.reusable.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specific')}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'specific'
                ? 'border-[#14453D] dark:border-[#4ADE80] text-[#1A1C1B] dark:text-[#F0F4F2]'
                : 'border-transparent text-[#516A5F] dark:text-[#8E9F97] hover:text-[#3F4943] dark:hover:text-[#F0F4F2]'
            }`}
          >
            {t('applicationSpecificDocuments')} ({summary.applicationSpecific.length})
          </button>
        </div>

        {/* Document Items List */}
        <div className="space-y-1.5 mb-4 max-h-[160px] overflow-y-auto pr-1">
          {activeTab === 'reusable' ? (
            summary.reusable.length > 0 ? (
              summary.reusable.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF9] dark:bg-[#1d2822] text-xs border border-[#EAECEB] dark:border-[#24342D]"
                >
                  <span className="font-medium text-[#14453D] dark:text-[#E8EFEA] truncate pr-2">
                    {getLocalizedDocName(doc, language)}
                  </span>
                  {statusBadge(doc.status)}
                </div>
              ))
            ) : (
              <div className="text-xs text-[#516A5F] dark:text-[#8E9F97] py-3 text-center">No reusable documents mapped.</div>
            )
          ) : summary.applicationSpecific.length > 0 ? (
            summary.applicationSpecific.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF9] dark:bg-[#1d2822] text-xs border border-[#EAECEB] dark:border-[#24342D]"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-[#516A5F] dark:text-[#9EB0A7] mr-1.5">[{doc.schemeCode}]</span>
                  <span className="font-medium text-[#14453D] dark:text-[#E8EFEA]">
                    {getLocalizedDocName(doc, language)}
                  </span>
                </div>
                {statusBadge(doc.status)}
              </div>
            ))
          ) : (
            <div className="text-xs text-[#516A5F] dark:text-[#8E9F97] py-3 text-center">No specific documents mapped.</div>
          )}
        </div>
      </div>

      <div>
        {/* Strict Privacy Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97] bg-[#FAFAF9] dark:bg-[#1d2822] p-2 rounded-md mb-3 border border-[#EAECEB] dark:border-[#24342D]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80] shrink-0" />
          <span className="leading-tight">{t('privacyGuarantee')}</span>
        </div>

        <button
          id="view-document-center-btn"
          type="button"
          onClick={onOpenDocumentCenter}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2] bg-[#FAFAF9] dark:bg-[#1d2822] hover:bg-[#F3F4F3] dark:hover:bg-[#22302A] border border-[#E4E8E4] dark:border-[#24342D] transition-colors min-h-[44px]"
        >
          <span>{t('viewDocumentCenter')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
