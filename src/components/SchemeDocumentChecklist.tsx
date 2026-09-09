import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

interface SchemeDocumentChecklistProps {
  documents: string[];
  schemeId: string;
  readyDocs: string[];
  onToggleDoc: (docName: string) => void;
  className?: string;
}

export const SchemeDocumentChecklist: React.FC<SchemeDocumentChecklistProps> = ({
  documents,
  schemeId,
  readyDocs,
  onToggleDoc,
  className = '',
}) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const totalCount = documents.length;
  const readyCount = documents.filter((doc) => readyDocs.includes(doc)).length;
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
  const isAllReady = totalCount > 0 && readyCount === totalCount;

  if (totalCount === 0) {
    return (
      <div
        id={`doc-checklist-${schemeId}-empty`}
        className={`bg-[#F3F4F3] dark:bg-[#1B2420] rounded-md p-4 text-center border border-[#E2E2E0] dark:border-[#283831] ${className}`}
      >
        <p className="text-xs text-[#6F7A73] dark:text-[#9EB0A7]">
          {t('schemeDetail.noDocumentsRequired')}
        </p>
      </div>
    );
  }

  return (
    <div
      id={`doc-checklist-${schemeId}`}
      className={`bg-white dark:bg-[#151C19] rounded-md border border-[#E2E2E0] dark:border-[#24342D] p-5 shadow-xs transition-colors duration-200 ${className}`}
    >
      {/* Header & Readiness Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
              {t('schemeDetail.documentsTitle')}
            </h3>
          </div>
          <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-1">
            {t('schemeDetail.documentsSubtitle')}
          </p>
        </div>

        {/* Readiness Count Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
              isAllReady
                ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border border-[#16A34A]/30'
                : 'bg-[#F3F4F3] dark:bg-[#1E2723] text-[#3F4943] dark:text-[#C5D5CC] border border-[#E2E2E0] dark:border-[#2B3D34]'
            }`}
          >
            {isAllReady ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#C2603F] dark:bg-amber-400" />
            )}
            <span>
              {t('schemeDetail.documentsReadyCount', {
                ready: readyCount,
                total: totalCount,
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-[#EEEEED] dark:bg-[#1E2924] h-2 rounded-full overflow-hidden"
        >
          <motion.div
            className={`h-full rounded-full transition-colors ${
              isAllReady
                ? 'bg-[#16A34A] dark:bg-[#4ADE80]'
                : 'bg-[#14453D] dark:bg-[#10B981]'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        {isAllReady && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            className="mt-2 text-[11px] font-semibold text-[#16A34A] dark:text-[#4ADE80] flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('schemeDetail.allDocumentsReady')}</span>
          </motion.div>
        )}
      </div>

      {/* Document Items List */}
      <div className="space-y-2">
        {documents.map((doc, idx) => {
          const isChecked = readyDocs.includes(doc);
          const itemId = `doc-check-${schemeId}-${idx}`;

          return (
            <div
              key={idx}
              id={itemId}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onClick={() => onToggleDoc(doc)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onToggleDoc(doc);
                }
              }}
              className={`group flex items-start gap-3 p-3 rounded border transition-all cursor-pointer select-none ${
                isChecked
                  ? 'bg-[#D4EFE1]/40 dark:bg-[#1A382D]/30 border-[#A3D9C9] dark:border-[#2A5C4B]'
                  : 'bg-[#FAFAF9] dark:bg-[#101613] hover:bg-[#F3F4F3] dark:hover:bg-[#161F1B] border-[#E2E2E0] dark:border-[#22332A]'
              }`}
            >
              {/* Checkbox box */}
              <div
                className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center shrink-0 border transition-all ${
                  isChecked
                    ? 'bg-[#14453D] dark:bg-[#16A34A] border-[#14453D] dark:border-[#16A34A] text-white shadow-xs'
                    : 'bg-white dark:bg-[#151C19] border-[#BFC9C2] dark:border-[#3D5247] group-hover:border-[#14453D] dark:group-hover:border-[#4ADE80]'
                }`}
              >
                {isChecked && (
                  <motion.div
                    initial={shouldReduceMotion ? undefined : { scale: 0.5, opacity: 0 }}
                    animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                )}
              </div>

              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-xs font-semibold block leading-snug transition-colors ${
                    isChecked
                      ? 'text-[#14453D] dark:text-[#A7F3D0] line-through decoration-[#16A34A]/50'
                      : 'text-[#1A1C1B] dark:text-[#F0F4F2]'
                  }`}
                >
                  {doc}
                </span>
                <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97]">
                  {isChecked
                    ? lang === 'hi'
                      ? '✓ आवेदन हेतु तैयार'
                      : '✓ Ready for application'
                    : lang === 'hi'
                    ? 'क्लिक करके तैयार चिह्नित करें'
                    : 'Click to mark as ready'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
