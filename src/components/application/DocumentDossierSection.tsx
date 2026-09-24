import React from 'react';
import { FileCheck2, CheckSquare, Square, Printer, AlertCircle, Building2 } from 'lucide-react';
import type { Scheme } from '../../types/scheme';
import { useTranslation } from '../../i18n';

interface DocumentDossierSectionProps {
  scheme: Scheme;
  preparedDocIds: string[];
  onToggleDocument: (docId: string) => void;
  onPrintDossier?: () => void;
}

// Maps standard government documents to likely issuing authorities to help citizens procure them
const getIssuingAuthority = (docName: string): string => {
  const lower = docName.toLowerCase();
  if (lower.includes('caste') || lower.includes('community') || lower.includes('income') || lower.includes('domicile') || lower.includes('residence') || lower.includes('nativity')) {
    return 'Revenue Department / Tahsildar / MeeSeva / e-Seva';
  }
  if (lower.includes('udyam') || lower.includes('msme') || lower.includes('registration')) {
    return 'Ministry of MSME (udyamregistration.gov.in) / DIC';
  }
  if (lower.includes('project report') || lower.includes('dpr') || lower.includes('financial') || lower.includes('balance sheet')) {
    return 'Chartered Accountant / Certified Consultant / DIC Helpdesk';
  }
  if (lower.includes('bank') || lower.includes('statement') || lower.includes('sanction') || lower.includes('passbook')) {
    return 'Lending Bank Branch / Scheduled Commercial Bank';
  }
  if (lower.includes('aadhaar')) {
    return 'UIDAI (Aadhaar Seva Kendra)';
  }
  if (lower.includes('pan')) {
    return 'Income Tax Department (Protean / NSDL)';
  }
  if (lower.includes('quotation') || lower.includes('machinery') || lower.includes('invoice')) {
    return 'Authorized Equipment Supplier / Vendor';
  }
  return 'Competent District Licensing Authority / Notary';
};

export const DocumentDossierSection: React.FC<DocumentDossierSectionProps> = ({
  scheme,
  preparedDocIds,
  onToggleDocument,
  onPrintDossier,
}) => {
  const { t } = useTranslation();
  const requiredDocs = scheme.requiredDocuments || [];
  const totalCount = requiredDocs.length;
  const readyCount = requiredDocs.filter((d) => preparedDocIds.includes(d)).length;
  const allReady = totalCount > 0 && readyCount === totalCount;

  return (
    <div id="document-dossier-section" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E9E7] dark:border-[var(--border-subtle)]">
        <div>
          <h3 className="text-base font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t('workspace.documentsTitle')}
          </h3>
          <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1">
            {t('workspace.documentsDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onPrintDossier || (() => window.print())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-[#1F2421] dark:text-[var(--text-main)] hover:bg-[#F4F7F5] dark:hover:bg-[var(--bg-raised)] transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#5A6561] dark:text-[var(--text-secondary)]" />
            <span>{t('workspace.printChecklistBtn')}</span>
          </button>
        </div>
      </div>

      {/* Progress alert banner */}
      {allReady ? (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center gap-2.5">
          <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t('workspace.allDocsReady')}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-[#FAFAF9] dark:bg-[#1d2822]/50 text-xs">
          <div className="flex items-center gap-2 text-[#5A6561] dark:text-[var(--text-secondary)]">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t('workspace.mandatoryNotice')}</span>
          </div>
          <div className="font-bold text-[#1F2421] dark:text-[var(--text-main)]">
            {readyCount} of {totalCount} ready ({totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 100}%)
          </div>
        </div>
      )}

      {/* Interactive checklist */}
      {totalCount === 0 ? (
        <div className="p-8 text-center text-xs text-[#5A6561] dark:text-[var(--text-secondary)] border border-dashed border-[#E5E9E7] dark:border-[var(--border-subtle)] rounded-xl">
          No specific certificates mandated for this scheme dataset.
        </div>
      ) : (
        <div className="space-y-3">
          {requiredDocs.map((doc, idx) => {
            const isPrepared = preparedDocIds.includes(doc);
            const authority = getIssuingAuthority(doc);

            return (
              <div
                key={idx}
                onClick={() => onToggleDocument(doc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isPrepared
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] hover:border-[#1E6A50]/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    aria-label={doc}
                    className="mt-0.5 text-[#1E6A50] dark:text-[var(--accent-green)] shrink-0"
                  >
                    {isPrepared ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-[#8E9B94]" />
                    )}
                  </button>

                  <div>
                    <div
                      className={`text-sm font-semibold ${
                        isPrepared
                          ? 'line-through text-[#5A6561] dark:text-[var(--text-secondary)]'
                          : 'text-[#1F2421] dark:text-[var(--text-main)]'
                      }`}
                    >
                      {doc}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1">
                      <Building2 className="w-3.5 h-3.5 text-[#8E9B94]" />
                      <span>Issuing Desk: {authority}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border shrink-0 ${
                    isPrepared
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-[#F4F7F5] dark:bg-[var(--bg-raised)] text-[#5A6561] dark:text-[var(--text-secondary)] border-[#E5E9E7] dark:border-[var(--border-subtle)]'
                  }`}
                >
                  {isPrepared ? 'Ready in Dossier' : t('workspace.markPrepared')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
