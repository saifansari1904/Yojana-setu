import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Upload,
  Info,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import type { Scheme } from '../../types/scheme';
import type { UserProfile } from '../../types/user';
import type { MatchResult } from '../../types/matching';
import type { SuccessRatePrediction } from '../../lib/application/successPredictor';
import { AnimatedScore } from '../ui/AnimatedScore';
import { useTranslation } from '../../i18n';

interface SuccessRatePredictorSectionProps {
  scheme: Scheme;
  userProfile: UserProfile;
  matchResult: MatchResult;
  prediction: SuccessRatePrediction;
  onOpenDocumentDossier: () => void;
  onUploadFile?: (docId: string, file: File) => void;
  onToggleDocument?: (docId: string) => void;
}

export const SuccessRatePredictorSection: React.FC<SuccessRatePredictorSectionProps> = ({
  scheme,
  prediction,
  onOpenDocumentDossier,
  onUploadFile,
  onToggleDocument,
}) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isBlocked = prediction.statutoryBlockerPresent;
  const isHindi = lang === 'hi';

  const getTierBadge = () => {
    switch (prediction.probabilityTier) {
      case 'VERY_HIGH':
        return {
          label: isHindi ? 'अत्यंत उच्च संभावना' : 'High Prospect — Low Dossier Risk',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        };
      case 'HIGH':
        return {
          label: isHindi ? 'उच्च संभावना' : 'Good Prospect — Standard Review',
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        };
      case 'MODERATE':
        return {
          label: isHindi ? 'मध्यम संभावना — दस्तावेज लंबित' : 'Moderate — Key Documents Needed',
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        };
      case 'LOW':
        return {
          label: isHindi ? 'कम संभावना — अधूरा डोजियर' : 'High Scrutiny Risk — Dossier Incomplete',
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        };
      case 'BLOCKED':
      default:
        return {
          label: isHindi ? 'वैधानिक सीमा — आवेदन अवरुद्ध' : 'Statutory Blocker Present',
          bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700',
        };
    }
  };

  const tier = getTierBadge();
  const netGain = Math.max(0, prediction.probabilityPercent - prediction.baselineRate);

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(docId, file);
      // Reset input value so re-uploading same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div id="success-rate-predictor-section" className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E9E7] dark:border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-[#1E6A50] dark:text-[var(--accent-green)]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E6A50] dark:text-[var(--accent-green)]">
              {isHindi ? 'ऐतिहासिक स्वीकृति विश्लेषण' : 'Historical Approval Intelligence'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1F2421] dark:text-[var(--text-main)]">
            {isHindi ? 'योजना सफलता संभावना विश्लेषक' : 'Scheme Success Rate Predictor'}
          </h2>
          <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
            {isHindi
              ? 'आधिकारिक मंत्रालयी स्वीकृति रिपोर्टों एवं आपके अपलोड किए गए दस्तावेजों के आधार पर अनुमानित सफलता दर।'
              : 'Statistical likelihood estimated from audited ministry sanction data and your current verified document dossier.'}
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

      {/* Main Predictor Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white via-[#F9FBFA] to-[#EDF4F0] dark:from-[var(--bg-card)] dark:via-[var(--bg-raised)] dark:to-[#17271F] border border-[#DEE7E2] dark:border-[var(--border-subtle)] shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Column: Probability Gauge & Classification */}
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
                      : prediction.probabilityPercent >= 75
                      ? 'stroke-emerald-500'
                      : prediction.probabilityPercent >= 50
                      ? 'stroke-blue-500'
                      : 'stroke-amber-500'
                  }
                  strokeWidth="8"
                  strokeDasharray="264"
                  initial={shouldReduceMotion ? false : { strokeDashoffset: 264 }}
                  animate={{
                    strokeDashoffset: 264 - (264 * prediction.probabilityPercent) / 100,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <AnimatedScore
                  value={prediction.probabilityPercent}
                  className="text-2xl sm:text-3xl font-extrabold text-[#1F2421] dark:text-[var(--text-main)]"
                />
                <span className="text-[10px] font-semibold text-[#5A6561] dark:text-[var(--text-secondary)] -mt-1">
                  {isHindi ? 'सफलता दर' : 'Est. Rate'}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tier.bg}`}>
                  <Sparkles className="w-3 h-3" />
                  {tier.label}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)]">
                {isBlocked
                  ? (isHindi ? 'वैधानिक पात्रता अवरुद्ध' : 'Statutory Restrictions Found')
                  : `${prediction.probabilityPercent}% ${isHindi ? 'स्वीकृति संभावना' : 'Estimated Success Likelihood'}`}
              </h3>

              <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1 max-w-md">
                {isBlocked
                  ? (isHindi ? 'कृपया आवेदन से पूर्व आवश्यक पात्रता सीमाओं का समाधान करें।' : 'Resolve confirmed statutory limitations before submitting to official portal.')
                  : netGain > 0
                  ? (isHindi
                      ? `आपके तैयार दस्तावेजों ने ऐतिहासिक सामान्य आधार दर (${prediction.baselineRate}%) की तुलना में +${netGain}% की वृद्धि की है।`
                      : `Your prepared documentation adds +${netGain}% above the historical baseline (${prediction.baselineRate}% unvetted rate).`)
                  : (isHindi
                      ? `वर्तमान में आधार दर पर है। आवश्यक दस्तावेज अपलोड कर दर को ${prediction.maxPossibleRate}% तक बढ़ाएं।`
                      : `Currently at historical baseline. Upload documents to increase success rate up to ${prediction.maxPossibleRate}%.`)}
              </p>
            </div>
          </div>

          {/* Right Column: Comparative Benchmarks */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 min-w-[240px] bg-white dark:bg-[var(--bg-card)] p-4 rounded-xl border border-[#E0E6E2] dark:border-[var(--border-subtle)]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5A6561] dark:text-[var(--text-secondary)]">
              {isHindi ? 'ऐतिहासिक स्वीकृति तुलना' : 'Historical Sanction Benchmark'}
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#5A6561] dark:text-[var(--text-secondary)]">
                    {isHindi ? 'सामान्य आधार दर (अपूर्ण आवेदन)' : 'Unassisted Baseline Rate'}
                  </span>
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                    {prediction.baselineRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${prediction.baselineRate}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-medium text-[#1E6A50] dark:text-[var(--accent-green)]">
                    {isHindi ? 'आपकी वर्तमान अनुमानित दर' : 'Your Estimated Rate'}
                  </span>
                  <span className="font-bold text-[#1E6A50] dark:text-[var(--accent-green)]">
                    {prediction.probabilityPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${prediction.probabilityPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#5A6561] dark:text-[var(--text-secondary)]">
                    {isHindi ? 'पूर्ण सत्यापित डोजियर (अधिकतम)' : 'Complete Dossier Potential'}
                  </span>
                  <span className="font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
                    {prediction.maxPossibleRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-600/50 rounded-full" style={{ width: `${prediction.maxPossibleRate}%` }} />
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#5A6561] dark:text-[var(--text-secondary)] flex items-center gap-1 pt-1 border-t border-[#EDF1EF] dark:border-zinc-800">
              <Clock className="w-3 h-3 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              <span>
                {isHindi
                  ? `औसत जांच अवधि: ~${prediction.benchmark.averageScrutinyDays} कार्य दिवस`
                  : `Avg. Departmental Scrutiny: ~${prediction.benchmark.averageScrutinyDays} days`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Risk Mitigation Radar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[#E5E9E7] dark:border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              {isHindi ? 'ऐतिहासिक अस्वीकृति जोखिम विश्लेषण' : 'Historical Rejection Risk Factors'}
            </h3>
            <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-0.5">
              {isHindi
                ? 'सरकारी ऑडिट के अनुसार इस योजना में आवेदन खारिज होने के मुख्य कारण एवं आपकी तैयारी:'
                : 'Top causes of application rejection from official audits and how your dossier mitigates them:'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F4F7F5] dark:bg-[var(--bg-raised)] text-[#1F2421] dark:text-[var(--text-main)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {prediction.mitigatedRejectionRisks.length} / {prediction.benchmark.topRejectionFactors.length}{' '}
              {isHindi ? 'जोखिम दूर किए गए' : 'Risks Mitigated'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prediction.benchmark.topRejectionFactors.map((factor) => {
            const isMitigated = prediction.mitigatedRejectionRisks.some((m) => m.id === factor.id);

            return (
              <div
                key={factor.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isMitigated
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
                    {isMitigated ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span>{isHindi ? factor.causeHi : factor.causeEn}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {factor.sharePercentage}% {isHindi ? 'खारिज दर' : 'rejections'}
                  </span>
                </div>

                <div className="pl-6 text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)]">
                  {isMitigated ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      ✓ {isHindi ? 'आपके डोजियर में सत्यापित दस्तावेज उपलब्ध है।' : 'Mitigated: Matching document marked ready in dossier.'}
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

      {/* Document Contribution & Upload Status Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[#E5E9E7] dark:border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {isHindi ? 'दस्तावेज प्रभाव एवं अपलोड स्थिति' : 'Document Impact & Upload Matrix'}
            </h3>
            <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-0.5">
              {isHindi
                ? 'प्रत्येक दस्तावेज आपकी स्वीकृति संभावना में कितना योगदान देता है:'
                : 'Individual statistical contribution of each mandatory document to your approval rate:'}
            </p>
          </div>

          <div className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)]">
            <span className="font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {prediction.uploadedDocumentsCount}
            </span>{' '}
            {isHindi ? 'अपलोड' : 'uploaded'},{' '}
            <span className="font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {prediction.preparedDocumentsCount}
            </span>{' '}
            / {prediction.totalDocumentsCount} {isHindi ? 'तैयार' : 'ready'}
          </div>
        </div>

        {prediction.documentImpacts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#5A6561] dark:text-[var(--text-secondary)] border border-dashed rounded-xl">
            {isHindi ? 'इस योजना में कोई विशिष्ट अनिवार्य दस्तावेज अपेक्षित नहीं है।' : 'No statutory documents mandated for this scheme.'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {prediction.documentImpacts.map((doc) => {
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
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{doc.uploadedRecord.fileName}</span>
                          <span>({(doc.uploadedRecord.fileSize / 1024).toFixed(0)} KB)</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)] mt-0.5">
                          {doc.isPrepared
                            ? (isHindi ? 'भौतिक प्रति चिह्नित • डिजिटल स्कैन अपलोड कर +15% प्रभाव सुरक्षित करें' : 'Marked in physical dossier • Upload scan for full digital verification')
                            : (isHindi ? 'दस्तावेज अभी लंबित है' : 'Document pending preparation')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Impact Contribution & Upload Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{doc.potentialGainPercent}% {isHindi ? 'संभावना' : 'Impact'}
                      </div>
                      <div className="text-[10px] text-[#5A6561] dark:text-[var(--text-secondary)]">
                        {doc.isUploaded
                          ? (isHindi ? 'पूर्ण अर्जित (+100%)' : 'Earned (100%)')
                          : doc.isPrepared
                          ? (isHindi ? 'आंशिक (+85%)' : 'Partial (85%)')
                          : (isHindi ? 'लंबित' : '0% Earned')}
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

      {/* Top Actionable Recommendations */}
      {prediction.topRecommendations.length > 0 && !isBlocked && (
        <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isHindi ? 'सफलता दर अधिकतम करने के उपाय' : 'Optimizations to Maximize Your Success Rate'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {prediction.topRecommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-emerald-200 dark:border-emerald-900/60 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[#1F2421] dark:text-[var(--text-main)] truncate">
                      {rec.docName}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                      +{rec.gainPercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)] leading-relaxed">
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
                  className="mt-3 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#1E6A50] dark:text-[var(--accent-green)] hover:underline"
                >
                  <Upload className="w-3 h-3" />
                  <span>{isHindi ? 'अपलोड करें' : 'Attach Scan Now'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory & Provenance Transparency Footnote */}
      <div className="p-4 rounded-xl bg-[#F4F7F5] dark:bg-[var(--bg-raised)] border border-[#E0E6E2] dark:border-[var(--border-subtle)] text-xs text-[#5A6561] dark:text-[var(--text-secondary)] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
            {isHindi ? 'डेटा प्रामाणिकता एवं परामर्श अस्वीकरण' : 'Audit Data Provenance & Advisory Notice'}
          </div>
          <p className="text-[11px] leading-relaxed">
            {isHindi ? prediction.methodologyNoteHi : prediction.methodologyNoteEn}
          </p>
          <p className="text-[10px] text-[#71827A] dark:text-[var(--text-secondary)]">
            {isHindi
              ? 'योजना सेतु एक स्वतंत्र तैयारी सहायक है। यह सांख्यिकीय अनुमान है, कोई कानूनी अथवा बैंक स्वीकृति गारंटी नहीं। अंतिम ऋण अथवा सब्सिडी स्वीकृति केवल सक्षम सरकारी नोडल एजेंसी अथवा नामित बैंक द्वारा भौतिक सत्यापन के अधीन है।'
              : 'Yojana Setu is an advisory preparation platform. This predictor provides an empirical estimate based on historical sanction ratios to help eliminate procedural defects. Final loan sanction or subsidy disbursement is subject to physical verification by the designated nodal department or lending institution.'}
          </p>
        </div>
      </div>
    </div>
  );
};
