import React, { useRef } from 'react';
import {
  FileCheck2,
  CheckSquare,
  Square,
  Printer,
  AlertCircle,
  Building2,
  Upload,
  Trash2,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { Scheme } from '../../types/scheme';
import type { UploadedFileRecord } from '../../lib/tracker/documentProgress';
import type { RejectionRiskAssessment } from '../../lib/application/rejectionRisk';
import { useTranslation } from '../../i18n';

interface DocumentDossierSectionProps {
  scheme: Scheme;
  preparedDocIds: string[];
  uploadedFiles?: Record<string, UploadedFileRecord>;
  riskAssessment?: RejectionRiskAssessment;
  onToggleDocument: (docId: string) => void;
  onUploadFile?: (docId: string, file: File) => void;
  onRemoveUpload?: (docId: string) => void;
  onSwitchToRiskCheck?: () => void;
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
  uploadedFiles = {},
  riskAssessment,
  onToggleDocument,
  onUploadFile,
  onRemoveUpload,
  onSwitchToRiskCheck,
  onPrintDossier,
}) => {
  const { t, lang } = useTranslation();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const isHindi = lang === 'hi';

  const requiredDocs = scheme.requiredDocuments || [];
  const totalCount = requiredDocs.length;
  const readyCount = requiredDocs.filter((d) => preparedDocIds.includes(d)).length;
  const uploadedCount = Object.keys(uploadedFiles).length;
  const allReady = totalCount > 0 && readyCount === totalCount;

  const handleFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(docName, file);
      e.target.value = '';
    }
  };

  return (
    <div id="document-dossier-section" className="space-y-6">
      {/* Top Header */}
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

      {/* Rejection Risk Check Banner */}
      {riskAssessment && (
        <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 via-[#EAF4EF] to-emerald-50 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-950/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {riskAssessment.mitigatedRisks.length}/{riskAssessment.riskFactors.length}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-[#1F2421] dark:text-[var(--text-main)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isHindi
                    ? `अस्वीकृति जोखिम जांच: ${riskAssessment.riskFactors.length} में से ${riskAssessment.mitigatedRisks.length} जोखिम कवर`
                    : `Rejection Risk Check: ${riskAssessment.mitigatedRisks.length} of ${riskAssessment.riskFactors.length} risks covered`}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 ml-1">
                  {riskAssessment.openRisks.length === 0
                    ? (isHindi ? 'सभी कवर' : 'All Covered')
                    : (isHindi ? `${riskAssessment.openRisks.length} खुले` : `${riskAssessment.openRisks.length} Open`)}
                </span>
              </div>
              <p className="text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)] mt-0.5">
                {isHindi
                  ? `${readyCount} / ${totalCount} दस्तावेज तैयार (${uploadedCount} डिजिटल स्कैन अपलोड)।`
                  : `${readyCount} of ${totalCount} documents marked (${uploadedCount} uploaded).`}
              </p>
            </div>
          </div>

          {onSwitchToRiskCheck && (
            <button
              type="button"
              onClick={onSwitchToRiskCheck}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E6A50] dark:text-[var(--accent-green)] bg-white dark:bg-[var(--bg-card)] border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shrink-0"
            >
              <span>{isHindi ? 'जोखिम जांच देखें' : 'View Risk Check'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

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

      {/* Interactive checklist with Upload & Impact */}
      {totalCount === 0 ? (
        <div className="p-8 text-center text-xs text-[#5A6561] dark:text-[var(--text-secondary)] border border-dashed border-[#E5E9E7] dark:border-[var(--border-subtle)] rounded-xl">
          {isHindi ? 'इस योजना हेतु कोई विशिष्ट प्रमाण पत्र अनिवार्य नहीं है।' : 'No specific certificates mandated for this scheme dataset.'}
        </div>
      ) : (
        <div className="space-y-3">
          {requiredDocs.map((doc, idx) => {
            const isPrepared = preparedDocIds.includes(doc);
            const uploadedFile = uploadedFiles[doc];
            const isUploaded = Boolean(uploadedFile);
            const authority = getIssuingAuthority(doc);

            // Find matching document status from the risk assessment if available
            const docStatus = riskAssessment?.documents.find((d) => d.docName === doc);

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isUploaded
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : isPrepared
                    ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10'
                    : 'border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleDocument(doc)}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isPrepared
                              ? 'text-[#1F2421] dark:text-[var(--text-main)]'
                              : 'text-[#1F2421] dark:text-[var(--text-main)]'
                          }`}
                        >
                          {doc}
                        </span>

                        {docStatus && docStatus.criticality !== 'STANDARD' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            docStatus.criticality === 'CRITICAL'
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                          }`}>
                            {docStatus.criticality === 'CRITICAL'
                              ? (isHindi ? 'अत्यंत महत्वपूर्ण' : 'Critical Document')
                              : (isHindi ? 'महत्वपूर्ण' : 'Important')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1">
                        <Building2 className="w-3.5 h-3.5 text-[#8E9B94]" />
                        <span>{isHindi ? 'जारीकर्ता डेस्क' : 'Issuing Desk'}: {authority}</span>
                      </div>

                      {/* Uploaded File Chip */}
                      {isUploaded && uploadedFile && (
                        <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs border border-emerald-300 dark:border-emerald-800">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">{uploadedFile.fileName}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                            ({(uploadedFile.fileSize / 1024).toFixed(0)} KB)
                          </span>
                          {onRemoveUpload && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveUpload(doc);
                              }}
                              className="ml-1 text-emerald-700 dark:text-emerald-400 hover:text-rose-600 transition-colors"
                              title={isHindi ? 'फ़ाइल हटाएं' : 'Remove Upload'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex items-center gap-2 pl-8 sm:pl-0 shrink-0">
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[doc] = el; }}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange(doc, e)}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[doc]?.click()}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isUploaded
                          ? 'border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] hover:bg-[#F4F7F5] dark:hover:bg-[var(--bg-raised)] text-[#1F2421] dark:text-[var(--text-main)]'
                          : 'bg-[#1E6A50] hover:bg-[#154d3a] text-white dark:bg-[var(--accent-green)] dark:text-[#0E1311]'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploaded ? (isHindi ? 'स्कैन बदलें' : 'Replace Scan') : (isHindi ? 'दस्तावेज अपलोड करें' : 'Upload Scan')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleDocument(doc)}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-md border transition-colors ${
                        isPrepared
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-[#F4F7F5] dark:bg-[var(--bg-raised)] text-[#5A6561] dark:text-[var(--text-secondary)] border-[#E5E9E7] dark:border-[var(--border-subtle)]'
                      }`}
                    >
                      {isPrepared ? (isHindi ? 'डोजियर में तैयार' : 'Ready in Dossier') : t('workspace.markPrepared')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
