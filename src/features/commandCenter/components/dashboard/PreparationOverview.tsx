import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, CircleDashed } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { MatchResult } from '../../../../types';
import type { ApplicationReadiness } from '../../../../types/supportPathway';
import {
  getLocalizedReadiness,
  getLocalizedReadinessCheck,
} from '../../../../lib/business/supportPathway';
import { SectionHeading, ENTRANCE } from './SectionHeading';

type RowState = 'COMPLETE' | 'ATTENTION' | 'NOT_ASSESSED';

const STATE_ICON: Record<RowState, React.ReactNode> = {
  COMPLETE: <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />,
  ATTENTION: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
  NOT_ASSESSED: <CircleDashed className="h-5 w-5 shrink-0 text-[#8A9A92] dark:text-[var(--yj-text-3)]" aria-hidden="true" />,
};

const STATE_KEY = {
  COMPLETE: 'dashPrepComplete',
  ATTENTION: 'dashPrepAttention',
  NOT_ASSESSED: 'dashPrepNotAssessed',
} as const;

interface PreparationOverviewProps {
  readiness: ApplicationReadiness;
  focusMatch: MatchResult | null;
  onOpenWorkspace: () => void;
}

export const PreparationOverview: React.FC<PreparationOverviewProps> = ({
  readiness,
  focusMatch,
  onOpenWorkspace,
}) => {
  const { language, t } = useTranslation();
  const summary = getLocalizedReadiness(readiness, language).summary;

  const portalUrl = focusMatch?.scheme.officialPortalUrl;

  return (
    <section aria-labelledby="dash-prep-title" className={`yj-card p-5 sm:p-6 ${ENTRANCE}`}>
      <SectionHeading level={2} id="dash-prep-title" title={t('dashPrepTitle')} className="mb-1" />
      <p className="mb-4 text-[13px] text-[#5A6B63] dark:text-[var(--yj-text-3)]">{summary}</p>
      <ul className="space-y-2.5">
        {readiness.checks.map((check) => {
          const state: RowState =
            check.state === 'SATISFIED'
              ? 'COMPLETE'
              : check.state === 'PENDING'
                ? 'ATTENTION'
                : 'NOT_ASSESSED';
          const { label, detail } = getLocalizedReadinessCheck(check, language);
          return (
            <li
              key={check.key}
              className="flex items-start gap-3 rounded-xl border border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] px-3.5 py-3"
            >
              {STATE_ICON[state]}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#14453D] dark:text-[var(--yj-text-1)]">
                  {label}
                </span>
                <span className="block text-xs text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                  {detail}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                {t(STATE_KEY[state])}
              </span>
            </li>
          );
        })}
        {portalUrl && (
          <li className="flex items-start gap-3 rounded-xl border border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] px-3.5 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#14453D] dark:text-[var(--yj-text-1)]">
                {t('dashPrepPortal')}
              </span>
              <span className="block truncate text-xs text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                {t('dashPrepPortalAvailable')}
              </span>
            </span>
          </li>
        )}
      </ul>
      {focusMatch && (
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#14453D]/30 px-4 py-2.5 text-sm font-semibold text-[#14453D] transition hover:bg-[#14453D] hover:text-white active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] dark:border-[var(--accent-green)]/40 dark:text-[var(--accent-green)] dark:hover:bg-[var(--accent-green)] dark:hover:text-[#0A2420] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {t('dashPrepOpenWorkspace')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  );
};

export default PreparationOverview;
