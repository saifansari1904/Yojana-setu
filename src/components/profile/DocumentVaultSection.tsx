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
import {
  CORE_REUSABLE_DOCUMENTS,
  VAULT_SCHEME_KEY,
  notifyVaultChanged,
} from '../../lib/documents/reusableDocuments';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

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
    // Let other mounted sections (registrations) refresh their vault linkage.
    notifyVaultChanged();
  };

  const preparedCount = CORE_REUSABLE_DOCUMENTS.filter((d) => vaultDocIds.includes(d.id)).length;
  const totalCount = CORE_REUSABLE_DOCUMENTS.length;
  const readinessPercent = Math.round((preparedCount / totalCount) * 100);

  return (
    <div
      id="profile-document-vault-section"
      className="bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)]" />
            {strings.documentsTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5">
            {strings.documentsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] bg-[#D9E8DF] dark:bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[#D9E8DF] dark:border-[#1E3E2E]">
            {preparedCount} / {totalCount} {strings.docPrepared} ({readinessPercent}%)
          </span>
        </div>
      </div>

      <div className="w-full bg-[#E8EFEA] dark:bg-[var(--bg-raised)] h-2 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-[#14453D] to-[#1E6A50] rounded-full transition-all duration-300"
          style={{ width: `${readinessPercent}%` }}
        />
      </div>

      <p className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] mb-3 italic">
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
                  ? 'bg-[#F4F8F5] dark:bg-[var(--bg-raised)] border-[#A8D5BC] dark:border-[#224A37]'
                  : 'bg-[#F9FAF9] dark:bg-[var(--bg-card)] border-[#E8EFEA] dark:border-[var(--border-subtle)] hover:border-[#1E6A50]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isPrepared
                        ? 'text-[#14453D] dark:text-[var(--accent-green)]'
                        : 'text-[#1F2421] dark:text-[var(--text-main)]'
                    }`}
                  >
                    {name}
                  </span>
                </div>
                <p className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="shrink-0 mt-0.5">
                {isPrepared ? (
                  <CheckCircle2 className="w-5 h-5 text-[#1E6A50] dark:text-[var(--accent-green)]" />
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
