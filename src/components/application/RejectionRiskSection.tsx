import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Upload,
  Info,
  CheckCircle2,
  ArrowRight,
  FileText,
  ListChecks,
} from 'lucide-react';
import type { RejectionRiskAssessment } from '../../lib/application/rejectionRisk';
import { AnimatedScore } from '../ui/AnimatedScore';
import { useTranslation } from '../../i18n';

interface RejectionRiskSectionProps {
  assessment: RejectionRiskAssessment;
  onOpenDocumentDossier: () => void;
  onUploadFile?: (docId: string, file: File) => void;
  onToggleDocument?: (docId: string) => void;
}

export const RejectionRiskSection: React.FC<RejectionRiskSectionProps> = ({
  assessment,
  onOpenDocumentDossier,
  onUploadFile,
  onToggleDocument,
}) => {
  const { lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isBlocked = assessment.statutoryBlockerPresent;
  const isHindi = lang === 'hi';
  const allCovered = assessment.status === 'ALL_COVERED';

  const statusBadge = isBlocked
    ? {
        label: isHindi ? 'वैधानिक सीमा — आवेदन अवरुद्ध' : 'Statutory Blocker Present',
        bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700',
      }
    : allCovered
    ? {
        label: isHindi ? 'सभी ज्ञात जोखिम दस्तावेजों से कवर' : 'All Known Risks Covered by Dossier',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      }
    : {
        label: isHindi
          ? `${assessment.openRisks.length} जोखिम अभी भी खुले`
          : `${assessment.openRisks.length} Risk${assessment.openRisks.length === 1 ? '' : 's'} Still Open`,
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      };

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(docId, file);
      // Reset input value so re-uploading same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div id="rejection-risk-section" className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E9E7] dark:border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-[#1E6A50] dark:text-[var(--accent-green)]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E6A50] dark:text-[var(--accent-green)]">
              {isHindi ? 'दस्तावेज जोखिम समीक्षा' : 'Document Risk Review'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1F2421] dark:text-[var(--text-main)]">
            {isHindi ? 'अस्वीकृति जोखिम जांच' : 'Rejection Risk Check'}
          </h2>
          <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
            {isHindi
              ? 'इस योजना में आवेदन लौटाए या खारिज होने के सामान्य कारण — आपके डोजियर के दस्तावेजों से जांचे गए। यह केवल तैयारी मार्गदर्शन है; योजना सेतु स्वीकृति की भविष्यवाणी नहीं करता।'
              : 'Common reasons applications for this scheme are returned or rejected, checked against the documents in your dossier. Preparation guidance only — Yojana Setu does not predict approval outcomes.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDocumentDossier}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E6A50] hover:bg-[#154d3a] text-white dark:bg-[var(--accent-green)] dark:text-[#0E1311] transition-colors shrink-0 shadow-xs"
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>{isHindi ? 'दस्तावेज डोजियर खोलें' : 'Manage Document Dossier'}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* Dossier Status Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white via-[#F9FBFA] to-[#EDF4F0] dark:from-[var(--bg-card)] dark:via-[var(--bg-raised)] dark:to-[#17271F] border border-[#DEE7E2] dark:border-[var(--border-subtle)] shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Column: Document readiness ring & status */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#E0E6E2] dark:stroke-zinc-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={
                    isBlocked
                      ? 'stroke-rose-500'
                      : allCovered
                      ? 'stroke-emerald-500'
                      : 'stroke-amber-500'
                  }
                  strokeWidth="8"
                  strokeDasharray="264"
                  initial={shouldReduceMotion ? false : { strokeDashoffset: 264 }}
                  animate={{
                    strokeDashoffset: 264 - (264 * assessment.documentReadinessPercent) / 100,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <AnimatedScore
                  value={assessment.documentReadinessPercent}
                  className="text-2xl sm:text-3xl font-bold text-[#1F2421] dark:text-[var(--text-main)]"
                />
                <span className="text-xs font-semibold text-[#5A6561] dark:text-[var(--text-secondary)] -mt-1">
                  {isHindi ? 'डोजियर तैयार' : 'Dossier Ready'}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                  <ShieldCheck className="w-3 h-3" />
                  {statusBadge.label}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)]">
                {isBlocked
                  ? (isHindi ? 'वैधानिक पात्रता अवरुद्ध' : 'Statutory Restrictions Found')
                  : isHindi
                  ? `${assessment.preparedDocumentsCount} / ${assessment.totalDocumentsCount} दस्तावेज तैयार`
                  : `${assessment.preparedDocumentsCount} of ${assessment.totalDocumentsCount} Documents Ready`}
              </h3>

              <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1 max-w-md">
                {isBlocked
                  ? (isHindi
                      ? `आवेदन से पूर्व इन पात्रता सीमाओं का समाधान करें: ${assessment.blockerLabels.join(', ')}`
                      : `Resolve these eligibility limitations before submitting: ${assessment.blockerLabels.join(', ')}`)
                  : isHindi
                  ? `आपके तैयार दस्तावेज ${assessment.riskFactors.length} ज्ञात अस्वीकृति जोखिमों में से ${assessment.mitigatedRisks.length} को कवर करते हैं।`
                  : `Your prepared documents address ${assessment.mitigatedRisks.length} of the ${assessment.riskFactors.length} known rejection risks for this scheme.`}
              </p>
            </div>
          </div>

          {/* Right Column: Dossier facts (citizen's own progress only) */}
          <div className="w-full md:w-auto flex flex-col gap-2 shrink-0 min-w-[240px] bg-white dark:bg-[var(--bg-card)] p-4 rounded-xl border border-[#E0E6E2] dark:border-[var(--border-subtle)] text-xs">
            <div className="flex justify-between gap-6">
              <span className="text-[#5A6561] dark:text-[var(--text-secondary)]">{isHindi ? 'दस्तावेज तैयार' : 'Documents ready'}</span>
              <span className="font-bold text-[#1F2421] dark:text-[var(--text-main)]">
                {assessment.preparedDocumentsCount} / {assessment.totalDocumentsCount}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-[#5A6561] dark:text-[var(--text-secondary)]">{isHindi ? 'डिजिटल स्कैन अपलोड' : 'Scans uploaded'}</span>
              <span className="font-bold text-[#1F2421] dark:text-[var(--text-main)]">{assessment.uploadedDocumentsCount}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-[#5A6561] dark:text-[var(--text-secondary)]">{isHindi ? 'जोखिम कवर' : 'Risks covered'}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {assessment.mitigatedRisks.length} / {assessment.riskFactors.length}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-[#5A6561] dark:text-[var(--text-secondary)]">{isHindi ? 'जोखिम खुले' : 'Risks still open'}</span>
              <span className={`font-bold ${assessment.openRisks.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-[#1F2421] dark:text-[var(--text-main)]'}`}>
                {assessment.openRisks.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Risk Factors */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[#E5E9E7] dark:border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              {isHindi ? 'सामान्य अस्वीकृति कारण एवं आपकी तैयारी' : 'Common Rejection Reasons & Your Preparation'}
            </h3>
            <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-0.5">
              {isHindi
                ? 'प्रत्येक कारण के सामने देखें कि आपका डोजियर उसे कवर करता है या नहीं, और यदि नहीं तो उपाय क्या है:'
                : 'For each common cause, see whether your dossier already covers it — and what to do if it does not:'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F4F7F5] dark:bg-[var(--bg-raised)] text-[#1F2421] dark:text-[var(--text-main)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {assessment.mitigatedRisks.length} / {assessment.riskFactors.length}{' '}
              {isHindi ? 'जोखिम कवर किए गए' : 'Risks Covered'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assessment.riskFactors.map((factor) => {
            const isMitigated = assessment.mitigatedRisks.some((m) => m.id === factor.id);

            return (
              <div
                key={factor.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isMitigated
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  {isMitigated ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <span className="font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
                    {isHindi ? factor.causeHi : factor.causeEn}
                  </span>
                </div>

                <div className="pl-6 text-xs text-[#5A6561] dark:text-[var(--text-secondary)]">
                  {isMitigated ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      ✓ {isHindi ? 'कवर किया गया: संबंधित दस्तावेज डोजियर में तैयार चिह्नित है।' : 'Covered: a matching document is marked ready in your dossier.'}
                    </span>
                  ) : (
                    <span className="text-amber-800 dark:text-amber-300">
                      ⚠ {isHindi ? factor.remedyHi : factor.remedyEn}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Status & Upload Matrix */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[#E5E9E7] dark:border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {isHindi ? 'दस्तावेज स्थिति एवं अपलोड' : 'Document Status & Uploads'}
            </h3>
            <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-0.5">
              {isHindi
                ? 'प्रत्येक आवश्यक दस्तावेज की स्थिति — तैयार चिह्नित करें या डिजिटल स्कैन अपलोड करें:'
                : 'Status of each required document — mark it ready or upload a digital scan:'}
            </p>
          </div>

          <div className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)]">
            <span className="font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {assessment.uploadedDocumentsCount}
            </span>{' '}
            {isHindi ? 'अपलोड' : 'uploaded'},{' '}
            <span className="font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {assessment.preparedDocumentsCount}
            </span>{' '}
            / {assessment.totalDocumentsCount} {isHindi ? 'तैयार' : 'ready'}
          </div>
        </div>

        {assessment.documents.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#5A6561] dark:text-[var(--text-secondary)] border border-dashed rounded-xl">
            {isHindi ? 'इस योजना में कोई विशिष्ट अनिवार्य दस्तावेज अपेक्षित नहीं है।' : 'No statutory documents mandated for this scheme.'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {assessment.documents.map((doc) => {
              return (
                <div
                  key={doc.docName}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    doc.isUploaded
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : doc.isPrepared
                      ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                      : 'bg-white dark:bg-[var(--bg-card)] border-[#E5E9E7] dark:border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleDocument?.(doc.docName)}
                      className="mt-0.5 text-zinc-400 hover:text-emerald-600 transition-colors shrink-0"
                      title={doc.isPrepared ? 'Marked Ready' : 'Mark as Ready'}
                    >
                      {doc.isPrepared ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-zinc-400 dark:border-zinc-600" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
                          {doc.docName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            doc.criticality === 'CRITICAL'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              : doc.criticality === 'HIGH'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {doc.criticality}
                        </span>
                      </div>

                      {doc.isUploaded && doc.uploadedRecord ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{doc.uploadedRecord.fileName}</span>
                          <span>({(doc.uploadedRecord.fileSize / 1024).toFixed(0)} KB)</span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-0.5">
                          {doc.isPrepared
                            ? (isHindi ? 'भौतिक प्रति तैयार चिह्नित • डिजिटल सत्यापन हेतु स्कैन अपलोड करें' : 'Marked ready in physical dossier • Upload a scan for digital verification')
                            : (isHindi ? 'दस्तावेज अभी लंबित है' : 'Document pending preparation')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Upload Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
                    <div className="text-right">
                      <div className={`text-xs font-bold ${doc.isUploaded ? 'text-emerald-600 dark:text-emerald-400' : doc.isPrepared ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {doc.isUploaded
                          ? (isHindi ? 'अपलोड किया गया' : 'Uploaded')
                          : doc.isPrepared
                          ? (isHindi ? 'तैयार चिह्नित' : 'Marked Ready')
                          : (isHindi ? 'लंबित' : 'Pending')}
                      </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[doc.docName] = el; }}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange(doc.docName, e)}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[doc.docName]?.click()}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                        doc.isUploaded
                          ? 'border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] hover:bg-[#F4F7F5] dark:hover:bg-[var(--bg-raised)] text-[#1F2421] dark:text-[var(--text-main)]'
                          : 'bg-[#1E6A50] hover:bg-[#154d3a] text-white dark:bg-[var(--accent-green)] dark:text-[#0E1311]'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>{doc.isUploaded ? (isHindi ? 'बदलें' : 'Replace') : (isHindi ? 'अपलोड करें' : 'Upload')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Actionable Next Steps */}
      {assessment.topRecommendations.length > 0 && !isBlocked && (
        <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
            <ListChecks className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isHindi ? 'खुले जोखिम दूर करने के अगले कदम' : 'Next Steps to Close Open Risks'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assessment.topRecommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-emerald-200 dark:border-emerald-900/60 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-[#1F2421] dark:text-[var(--text-main)] mb-1">
                    {rec.docName}
                  </div>
                  <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] leading-relaxed">
                    {isHindi ? rec.reasonHi : rec.reasonEn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const inputEl = fileInputRefs.current[rec.docName];
                    if (inputEl) {
                      inputEl.click();
                    } else {
                      onOpenDocumentDossier();
                    }
                  }}
                  className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-bold text-[#1E6A50] dark:text-[var(--accent-green)] hover:underline"
                >
                  <Upload className="w-3 h-3" />
                  <span>{isHindi ? 'अपलोड करें' : 'Attach Scan Now'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisory Footnote */}
      <div className="p-4 rounded-xl bg-[#F4F7F5] dark:bg-[var(--bg-raised)] border border-[#E0E6E2] dark:border-[var(--border-subtle)] text-xs text-[#5A6561] dark:text-[var(--text-secondary)] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
            {isHindi ? 'यह जांच कैसे काम करती है' : 'How This Check Works'}
          </div>
          <p className="text-xs leading-relaxed">
            {isHindi
              ? 'यह जांच इस योजना के आवश्यक दस्तावेजों और सामान्य प्रक्रियात्मक अस्वीकृति कारणों पर आधारित है। यह आपके अपने डोजियर की स्थिति बताती है — किसी स्वीकृति संभावना का अनुमान नहीं देती, क्योंकि ऐसी कोई सत्यापित आधिकारिक सांख्यिकी उपलब्ध नहीं है।'
              : 'This check is based on the documents this scheme requires and common procedural rejection reasons. It reports the state of your own dossier — it does not estimate any approval probability, because no verified official statistics for that exist.'}
          </p>
          <p className="text-xs text-[#71827A] dark:text-[var(--text-secondary)]">
            {isHindi
              ? 'योजना सेतु एक स्वतंत्र तैयारी सहायक है। अंतिम ऋण अथवा सब्सिडी स्वीकृति केवल सक्षम सरकारी नोडल एजेंसी अथवा नामित बैंक द्वारा भौतिक सत्यापन के अधीन है।'
              : 'Yojana Setu is an advisory preparation platform. Final loan sanction or subsidy disbursement is subject to physical verification by the designated nodal department or lending institution.'}
          </p>
        </div>
      </div>
    </div>
  );
};
