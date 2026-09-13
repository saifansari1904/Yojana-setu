import React, { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2,
  FileText,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { MatchResult, UserProfile } from '../types';
import { useTranslation } from '../i18n';
import { compareSchemes, SchemeComparisonResult } from '../lib/matching/comparisonEngine';
import { MatchGauge } from './MatchGauge';
import { VerificationBadge } from './ui';

interface SchemeComparisonModalProps {
  isOpen: boolean;
  selectedMatches: MatchResult[];
  profile: UserProfile;
  onClose: () => void;
  onSelectScheme?: (match: MatchResult) => void;
  onRemoveScheme?: (schemeId: string) => void;
}

export const SchemeComparisonModal: React.FC<SchemeComparisonModalProps> = ({
  isOpen,
  selectedMatches,
  profile,
  onClose,
  onSelectScheme,
  onRemoveScheme,
}) => {
  const { lang, t } = useTranslation();
  const isHi = lang === 'hi';
  const modalId = useId();

  if (!isOpen || selectedMatches.length < 2) return null;

  let comparison: SchemeComparisonResult;
  try {
    comparison = compareSchemes(selectedMatches, profile, lang);
  } catch (err) {
    console.error('Error computing scheme comparison:', err);
    return null;
  }

  const { columns, bestMatchSchemeId, highestSubsidySchemeId, summaryNote } = comparison;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          id={`scheme-comparison-dialog-${modalId}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="comparison-modal-title"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-[#121815] border border-[#D5DDD8] dark:border-[#24342D] rounded-lg shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1A1C1B] dark:text-[#F0F4F2]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E2E2E0] dark:border-[#24342D] flex items-center justify-between bg-[#F8FAF9] dark:bg-[#16201B]">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#14453D] dark:bg-[#34D399]" />
                <h2
                  id="comparison-modal-title"
                  className="text-base sm:text-lg font-bold text-[#14453D] dark:text-[#34D399]"
                >
                  {isHi ? 'योजनाओं की आधिकारिक तुलना' : 'Statutory Scheme Comparison'}
                </h2>
                <span className="text-xs bg-[#E2EAE6] dark:bg-[#1E2E26] text-[#14453D] dark:text-[#4ADE80] px-2 py-0.5 rounded font-semibold">
                  {columns.length} / 3 {isHi ? 'योजनाएं' : 'Schemes'}
                </span>
              </div>
              <p className="text-xs text-[#516A5F] dark:text-[#8E9F97] mt-0.5">
                {summaryNote}
              </p>
            </div>

            <button
              id="close-comparison-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#516A5F] hover:text-[#1A1C1B] dark:text-[#8E9F97] dark:hover:text-[#F0F4F2] hover:bg-[#EAECEB] dark:hover:bg-[#202D26] transition-colors cursor-pointer"
              aria-label={isHi ? 'तुलना बंद करें' : 'Close comparison'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparison Content Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
            <div className={`grid grid-cols-1 md:grid-cols-${columns.length} gap-4 min-w-[640px]`}>
              {columns.map((col) => {
                const isBestMatch = col.schemeId === bestMatchSchemeId;
                const matchResult = selectedMatches.find((m) => m.scheme.id === col.schemeId);

                return (
                  <div
                    key={col.schemeId}
                    id={`compare-column-${col.schemeId}`}
                    className={`rounded-lg border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                      isBestMatch
                        ? 'border-[#14453D] dark:border-[#34D399] bg-[#FAFDFB] dark:bg-[#15221C] shadow-sm'
                        : 'border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#141C18]'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Best Match Badge and Remove button */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isBestMatch && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#14453D] text-white dark:bg-[#34D399] dark:text-[#0B251F] px-2 py-0.5 rounded">
                              <Award className="w-3 h-3" />
                              {isHi ? 'शीर्ष मिलान' : 'Top Match'}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold bg-[#EAECEB] dark:bg-[#223129] px-2 py-0.5 rounded text-[#516A5F] dark:text-[#A0B0A7]">
                            {col.schemeType}
                          </span>
                        </div>

                        {onRemoveScheme && columns.length > 2 && (
                          <button
                            onClick={() => onRemoveScheme(col.schemeId)}
                            className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 rounded transition-colors cursor-pointer"
                            title={isHi ? 'हटाएं' : 'Remove'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Scheme Title */}
                      <h3 className="text-base font-bold leading-snug line-clamp-2 text-[#1A1C1B] dark:text-[#F0F4F2] mb-1">
                        {col.schemeName}
                      </h3>
                      <p className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] line-clamp-1 mb-4">
                        {col.sponsoringMinistry}
                      </p>

                      {/* Match Score & Status Header */}
                      <div className="flex items-center gap-3 p-3 rounded-md bg-[#F4F6F5] dark:bg-[#1B2720] border border-[#E2E2E0] dark:border-[#25362C] mb-4">
                        <MatchGauge percentage={col.matchPercentage} size={54} strokeWidth={5} />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block">
                            {isHi ? 'आधिकारिक स्कोर' : 'Engine Match Score'}
                          </span>
                          <span className="text-lg font-bold text-[#14453D] dark:text-[#34D399]">
                            {Math.round(col.matchPercentage)}%
                          </span>
                          <div className="mt-0.5">
                            {col.isEligible ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.2 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                {isHi ? 'संभावित रूप से पात्र' : 'Potentially Eligible'}
                              </span>
                            ) : col.matchStatus === 'near-match' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-1.5 py-0.2 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                {isHi ? 'समीप मिलान' : 'Near Match'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 px-1.5 py-0.2 rounded">
                                <Info className="w-3 h-3" />
                                {isHi ? 'प्रतिबंधित / कम मिलान' : 'Blocked / Low Match'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Highlights */}
                      {col.standoutHighlights.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {col.standoutHighlights.map((h, hIdx) => (
                            <span
                              key={hIdx}
                              className="text-[10px] font-bold bg-[#D4EFE1] dark:bg-[#1E382C] text-[#14453D] dark:text-[#4ADE80] px-2 py-0.5 rounded"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Detailed Metric Rows */}
                      <div className="space-y-2.5 text-xs">
                        {/* Funding Quantum */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'ऋण / सहायता राशि' : 'Funding Quantum'}
                          </span>
                          <span className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.fundingRangeText}
                          </span>
                        </div>

                        {/* Capital Subsidy */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'पूंजीगत सब्सिडी' : 'Capital Subsidy'}
                          </span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {col.subsidyText}
                          </span>
                        </div>

                        {/* Interest & Tenure */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'ब्याज एवं अवधि' : 'Interest Rate & Tenure'}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2] block">
                            {col.interestRateText} · {col.tenureText}
                          </span>
                        </div>

                        {/* Geographic Scope */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'भौगोलिक दायरा' : 'Geographic Scope'}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.applicableStatesText}
                          </span>
                        </div>

                        {/* Target Categories */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'लक्षित सामाजिक वर्ग' : 'Target Categories'}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.targetCategoriesText}
                          </span>
                        </div>

                        {/* Target Sectors */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'स्वीकार्य कार्यक्षेत्र' : 'Eligible Domains'}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.targetBusinessTypesText}
                          </span>
                        </div>

                        {/* Required Documents */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'आवश्यक दस्तावेज' : 'Required Documents'}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.documentsCount} {isHi ? 'वैधानिक दस्तावेज' : 'statutory documents'}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {col.keyDocuments.map((doc, dIdx) => (
                              <span
                                key={dIdx}
                                className="text-[9px] bg-[#EAECEB] dark:bg-[#1E2E26] px-1.5 py-0.5 rounded text-[#334038] dark:text-[#A0B0A7]"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Application Mode */}
                        <div>
                          <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase font-semibold">
                            {isHi ? 'आवेदन प्रक्रिया' : 'Application Mode'}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2] capitalize">
                            {col.applicationMode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="mt-5 pt-3 border-t border-[#EAECEB] dark:border-[#223129]">
                      <div className="mb-2.5">
                        <span className="text-[10px] font-bold text-[#14453D] dark:text-[#4ADE80] uppercase tracking-wider block">
                          {isHi ? 'सर्वोत्तम अगला कदम:' : 'Next Best Action:'}
                        </span>
                        <p className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] font-medium mt-0.5">
                          {col.nextBestAction.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {matchResult && onSelectScheme && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectScheme(matchResult);
                            }}
                            className="flex-1 bg-[#14453D] hover:bg-[#0E352E] dark:bg-[#34D399] dark:hover:bg-[#28B781] text-white dark:text-[#0B251F] text-xs font-bold py-2 px-3 rounded text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>{isHi ? 'विवरण देखें' : 'View Full Details'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {col.nextBestAction.actionUrl && (
                          <a
                            href={col.nextBestAction.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-[#D5DDD8] dark:border-[#2E4137] rounded hover:bg-[#F3F5F4] dark:hover:bg-[#1E2E26] text-[#14453D] dark:text-[#4ADE80] transition-colors cursor-pointer"
                            title={col.nextBestAction.buttonLabel}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div className="px-5 py-3 border-t border-[#E2E2E0] dark:border-[#24342D] bg-[#F8FAF9] dark:bg-[#16201B] flex flex-wrap items-center justify-between gap-3 text-xs text-[#516A5F] dark:text-[#8E9F97]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {isHi
                  ? 'सभी मानदंड एवं स्कोर योजना सेतु के केंद्रीय मिलान इंजन द्वारा मूल्यांकित हैं।'
                  : 'All scores and statutory criteria are certified by Yojana Setu matching engine.'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-xs font-bold text-[#14453D] dark:text-[#4ADE80] bg-white dark:bg-[#1B2720] border border-[#D5DDD8] dark:border-[#2B3E33] hover:bg-[#EAECEB] dark:hover:bg-[#23332A] transition-colors cursor-pointer"
            >
              {isHi ? 'बंद करें' : 'Close Comparison'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
