import React, { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Printer, X } from 'lucide-react';
import type { MatchResult } from '../types/matching';
import type { UserProfile } from '../types/user';
import type { SupportPathway } from '../types/supportPathway';
import type { TrackedApplication } from '../types/tracker';
import { buildPathwayReport } from '../lib/report/pathwayReport';
import { getLocalizedCombinabilityNotice } from '../lib/business/supportPathway';
import { useTranslation } from '../i18n';

interface PathwayReportModalProps {
  pathway: SupportPathway;
  matchResults: MatchResult[];
  userProfile: UserProfile | null;
  applications?: TrackedApplication[];
  onClose: () => void;
}

/**
 * PHASE 4.3 — SHAREABLE PATHWAY REPORT
 *
 * A print-first one-pager the citizen can take to a bank branch / DIC office.
 * "Save as PDF" is the browser's own print-to-PDF, so no new dependency and
 * no server round-trip. Print CSS hides the app shell and keeps only the sheet.
 */
export const PathwayReportModal: React.FC<PathwayReportModalProps> = ({
  pathway,
  matchResults,
  userProfile,
  applications,
  onClose,
}) => {
  const { lang, t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const report = useMemo(
    () =>
      buildPathwayReport({
        profile: userProfile,
        pathway,
        matchResults,
        applications,
        lang,
      }),
    [userProfile, pathway, matchResults, applications, lang],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const generatedOn = report.generatedAt.slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-6 print:static print:block print:bg-transparent print:p-0"
      role="dialog"
      aria-modal="true"
      aria-label={report.title}
    >
      {/* Print rules: only the report sheet reaches the paper. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pathway-report-sheet, #pathway-report-sheet * { visibility: visible !important; }
          #pathway-report-sheet {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border: 0 !important;
          }
          .report-no-print { display: none !important; }
        }
      `}</style>

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <div className="report-no-print mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-white/90">
            {report.printHint}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#16A34A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#15803D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t('report.printBtn')}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('report.close')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          id="pathway-report-sheet"
          className="rounded-2xl bg-white p-6 text-[#1F2A24] shadow-xl sm:p-8 print:rounded-none print:p-6"
        >
          <header className="mb-5 border-b border-[#E2E2E0] pb-4">
            <h1 className="text-xl font-bold text-[#14453D] sm:text-2xl">{report.title}</h1>
            <p className="mt-1 text-sm text-[#3F4943]">{report.subtitle}</p>
            <p className="mt-1 text-xs text-[#6F7A73]">
              {t('report.generated')}: {generatedOn}
            </p>
          </header>

          <section className="mb-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#14453D]">
              {report.journeyLine.label}
            </h2>
            <p className="text-base font-semibold">{report.journeyLine.value}</p>
            {report.priorityLabels.length > 0 && (
              <ol className="mt-2 list-decimal pl-5 text-sm text-[#3F4943]">
                {report.priorityLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ol>
            )}
          </section>

          <section className="mb-5 rounded-xl border border-[#B2CDBF] bg-[#F4F8F6] p-4">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-[#14453D]">
              {t('report.nextAction')}
            </h2>
            <p className="text-base font-semibold">{report.nextAction.title}</p>
            <p className="mt-1 text-sm text-[#3F4943]">{report.nextAction.reason}</p>
          </section>

          <section className="mb-5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-[#14453D] sm:col-span-2">
              {t('report.profileSummary')}
            </h2>
            {report.profileLines.map((line) => (
              <div key={line.label} className="flex justify-between gap-3 text-sm">
                <span className="text-[#6F7A73]">{line.label}</span>
                <span className="font-medium capitalize">{line.value}</span>
              </div>
            ))}
          </section>

          {report.fundingLines.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#14453D]">
                {t('report.fundingRequirement')}
              </h2>
              {report.fundingLines.map((line) => (
                <div key={line.label} className="flex justify-between gap-3 text-sm">
                  <span className="text-[#6F7A73]">{line.label}</span>
                  <span className="font-medium">{line.value}</span>
                </div>
              ))}
            </section>
          )}

          <section className="mb-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#14453D]">
              {t('report.supportStack')}
            </h2>
            {report.schemes.length === 0 ? (
              <p className="text-sm text-[#6F7A73]">
                {t('report.noSchemes')}
              </p>
            ) : (
              <ul className="space-y-2">
                {report.schemes.map((scheme, index) => (
                  <li
                    key={`${scheme.schemeName}-${index}`}
                    className="rounded-lg border border-[#E2E2E0] p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold">
                        {scheme.schemeName}
                        {scheme.shortCode ? ` (${scheme.shortCode})` : ''}
                      </span>
                      <span className="text-[#6F7A73]">
                        {scheme.areaLabel} · {scheme.matchPercentage}% · {scheme.matchStatusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#6F7A73]">
                      {scheme.source ? `${scheme.source} · ` : ''}
                      {scheme.verificationLine}
                    </p>
                    {scheme.sourceUrl && (
                      <p className="mt-0.5 break-all text-xs text-[#0F6B4C]">{scheme.sourceUrl}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-[#6F7A73]">
              {getLocalizedCombinabilityNotice(pathway, lang)}
            </p>
          </section>

          <section className="mb-5">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-[#14453D]">
              {t('report.readiness')}
            </h2>
            <p className="text-sm font-semibold">{report.readiness.stateLabel}</p>
            <p className="mb-2 text-sm text-[#3F4943]">{report.readiness.summary}</p>
            <ul className="space-y-1 text-sm">
              {report.readiness.checks.map((check) => (
                <li key={check.label} className="flex justify-between gap-3">
                  <span className="text-[#6F7A73]">{check.label}</span>
                  <span className="font-medium">{check.value}</span>
                </li>
              ))}
            </ul>
          </section>

          {report.checklist.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#14453D]">
                {t('report.checklist')}
              </h2>
              <ul className="space-y-1 text-sm">
                {report.checklist.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="flex justify-between gap-3">
                    <span>
                      {item.label}
                      {item.isMandatory ? ' *' : ''}
                    </span>
                    <span className="text-[#6F7A73]">{item.stateLabel}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.trackedLines.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#14453D]">
                {t('report.trackedApps')}
              </h2>
              <ul className="space-y-1 text-sm">
                {report.trackedLines.map((line) => (
                  <li key={line.label} className="flex justify-between gap-3">
                    <span>{line.label}</span>
                    <span className="capitalize text-[#6F7A73]">{line.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="border-t border-[#E2E2E0] pt-3">
            <ul className="space-y-1 text-xs text-[#6F7A73]">
              {report.disclaimers.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </footer>
        </div>
      </motion.div>
    </div>
  );
};

export default PathwayReportModal;
