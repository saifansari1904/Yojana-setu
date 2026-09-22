/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  CheckCircle2,
  Circle,
  HelpCircle,
  ShieldCheck,
  FileCheck,
  FileText,
} from 'lucide-react';
import { UserProfile } from '../../types/user';
import {
  loadDocumentProgress,
  saveDocumentProgress,
  DocumentProgressMap,
} from '../../lib/tracker/documentProgress';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

interface CoreDocumentDefinition {
  id: string;
  nameEn: string;
  nameHi: string;
  category: 'IDENTITY' | 'FINANCIAL' | 'BUSINESS' | 'STATUTORY';
  descriptionEn: string;
  descriptionHi: string;
}

const CORE_REUSABLE_DOCUMENTS: CoreDocumentDefinition[] = [
  {
    id: 'aadhaar_card',
    nameEn: 'Aadhaar Card',
    nameHi: 'आधार कार्ड',
    category: 'IDENTITY',
    descriptionEn: 'Universal proof of identity, age, and domicile.',
    descriptionHi: 'पहचान, आयु एवं निवास का सार्वभौमिक प्रमाण।',
  },
  {
    id: 'pan_card',
    nameEn: 'PAN Card',
    nameHi: 'पैन कार्ड',
    category: 'IDENTITY',
    descriptionEn: 'Income tax identity required for all commercial credit sanctions.',
    descriptionHi: 'वाणिज्यिक ऋण स्वीकृति हेतु अनिवार्य आयकर पहचान।',
  },
  {
    id: 'bank_statement',
    nameEn: 'Bank Passbook / 6-Month Statement',
    nameHi: 'बैंक पासबुक / 6 माह का विवरण',
    category: 'FINANCIAL',
    descriptionEn: 'Active savings or current account showing transaction continuity.',
    descriptionHi: 'लेन-देन निरंतरता दर्शाने वाला सक्रिय बैंक खाता।',
  },
  {
    id: 'caste_certificate',
    nameEn: 'Caste / Category Certificate',
    nameHi: 'जाति / श्रेणी प्रमाण पत्र',
    category: 'STATUTORY',
    descriptionEn: 'Competent authority certificate for SC/ST/OBC subsidy concessions.',
    descriptionHi: 'एससी/एसटी/ओबीसी सब्सिडी छूट हेतु सक्षम प्राधिकारी प्रमाण पत्र।',
  },
  {
    id: 'income_certificate',
    nameEn: 'Income Certificate / ITR',
    nameHi: 'आय प्रमाण पत्र / आईटीआर',
    category: 'FINANCIAL',
    descriptionEn: 'Revenue officer certificate or return proving family income slab.',
    descriptionHi: 'पारिवारिक आय स्लैब सत्यापित करने वाला प्राधिकृत प्रमाण।',
  },
  {
    id: 'project_report',
    nameEn: 'Detailed Project Report (DPR) / Quotation',
    nameHi: 'विस्तृत परियोजना रिपोर्ट (डीपीआर) / कोटेशन',
    category: 'BUSINESS',
    descriptionEn: 'Itemized machinery invoices, project feasibility, and working capital needs.',
    descriptionHi: 'मशीनरी कोटेशन, परियोजना व्यवहार्यता एवं कार्यशील पूंजी का विवरण।',
  },
  {
    id: 'udyam_certificate',
    nameEn: 'Udyam MSME Registration Certificate',
    nameHi: 'उद्यम एमएसएमई पंजीकरण प्रमाण पत्र',
    category: 'BUSINESS',
    descriptionEn: 'Official MSME certificate unlocking CGTMSE guarantee and subsidy.',
    descriptionHi: 'क्रेडिट गारंटी एवं ब्याज छूट हेतु आधिकारिक एमएसएमई प्रमाण।',
  },
  {
    id: 'address_proof_business',
    nameEn: 'Business Premises Proof (Rent Agreement / Utility Bill)',
    nameHi: 'व्यवसाय स्थल प्रमाण (किरायानामा / बिजली बिल)',
    category: 'BUSINESS',
    descriptionEn: 'Proof of commercial operating location or land ownership.',
    descriptionHi: 'व्यावसायिक संचालन स्थल या भूमि स्वामित्व का वैध प्रमाण।',
  },
];

const VAULT_SCHEME_KEY = '__reusable_vault__';

interface DocumentVaultSectionProps {
  profile: UserProfile;
}

export const DocumentVaultSection: React.FC<DocumentVaultSectionProps> = ({ profile }) => {
  const { lang } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const [docProgress, setDocProgress] = useState<DocumentProgressMap>({});

  useEffect(() => {
    setDocProgress(loadDocumentProgress());
  }, []);

  const vaultDocIds = docProgress[VAULT_SCHEME_KEY] || [];

  const handleToggleDoc = (docId: string) => {
    const current = docProgress[VAULT_SCHEME_KEY] || [];
    const updated = current.includes(docId)
      ? current.filter((id) => id !== docId)
      : [...current, docId];

    const nextMap = {
      ...docProgress,
      [VAULT_SCHEME_KEY]: updated,
    };
    saveDocumentProgress(nextMap);
    setDocProgress(nextMap);
  };

  const preparedCount = CORE_REUSABLE_DOCUMENTS.filter((d) => vaultDocIds.includes(d.id)).length;
  const totalCount = CORE_REUSABLE_DOCUMENTS.length;
  const readinessPercent = Math.round((preparedCount / totalCount) * 100);

  return (
    <div
      id="profile-document-vault-section"
      className="bg-white dark:bg-[#151C19] border border-[#DEE7E2] dark:border-[#223F30] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8EFEA] dark:border-[#223F30] mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[#F0F4F2] flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-[#14453D] dark:text-[#4ADE80]" />
            {strings.documentsTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
            {strings.documentsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D9E8DF] dark:bg-[#162B22] px-3 py-1 rounded-full border border-[#D9E8DF] dark:border-[#1E3E2E]">
            {preparedCount} / {totalCount} {strings.docPrepared} ({readinessPercent}%)
          </span>
        </div>
      </div>

      <div className="w-full bg-[#E8EFEA] dark:bg-[#1C2822] h-2 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-[#14453D] to-[#1E6A50] rounded-full transition-all duration-300"
          style={{ width: `${readinessPercent}%` }}
        />
      </div>

      <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] mb-3 italic">
        {strings.toggleHelp}
      </p>

      {/* Grid of reusable documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CORE_REUSABLE_DOCUMENTS.map((doc) => {
          const isPrepared = vaultDocIds.includes(doc.id);
          const name = resolveLocalizedPair(doc.nameEn, doc.nameHi, lang);
          const desc = resolveLocalizedPair(doc.descriptionEn, doc.descriptionHi, lang);

          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => handleToggleDoc(doc.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                isPrepared
                  ? 'bg-[#F4F8F5] dark:bg-[#111F18] border-[#A8D5BC] dark:border-[#224A37]'
                  : 'bg-[#F9FAF9] dark:bg-[#121915] border-[#E8EFEA] dark:border-[#1E2E27] hover:border-[#1E6A50]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isPrepared
                        ? 'text-[#14453D] dark:text-[#4ADE80]'
                        : 'text-[#1F2421] dark:text-[#F0F4F2]'
                    }`}
                  >
                    {name}
                  </span>
                </div>
                <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] line-clamp-2 leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="shrink-0 mt-0.5">
                {isPrepared ? (
                  <CheckCircle2 className="w-5 h-5 text-[#1E6A50] dark:text-[#4ADE80]" />
                ) : (
                  <Circle className="w-5 h-5 text-[#CBD5E1] dark:text-[#334155]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
