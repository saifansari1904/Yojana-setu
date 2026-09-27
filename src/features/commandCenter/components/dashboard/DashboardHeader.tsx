import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { ResumeDecision } from '../../lib/dashboard/dashboardSelectors';
import { SectionHeading, ENTRANCE } from './SectionHeading';

interface DashboardHeaderProps {
  /** Actual profile name only — never a placeholder. */
  profileName: string | null;
  readinessPct: number;
  pendingActions: number;
  activeApplications: number;
  savedCount: number;
  resume: ResumeDecision;
  onResume: () => void;
}

function greetingKey(hour: number): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  if (hour < 12) return 'greetingMorning';
  if (hour < 17) return 'greetingAfternoon';
  return 'greetingEvening';
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  profileName,
  readinessPct,
  pendingActions,
  activeApplications,
  savedCount,
  resume,
  onResume,
}) => {
  const { t } = useTranslation();
  // Locale greetings carry terminal punctuation ("Good morning."). Strip it
  // before joining with the profile name so we never render "Good morning., Saif".
  const greeting = t(greetingKey(new Date().getHours())).replace(/[.\s।]+$/, '');

  const indicators = [
    { label: t('dashIndicatorReadiness'), value: `${readinessPct}%` },
    { label: t('dashIndicatorActions'), value: String(pendingActions) },
    { label: t('dashIndicatorApplications'), value: String(activeApplications) },
    { label: t('dashIndicatorSaved'), value: String(savedCount) },
  ];

  return (
    <header className={`yj-card yj-card-lg p-5 sm:p-7 ${ENTRANCE}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#5A6B63] dark:text-[var(--yj-text-3)]">
            {t('brandTagline')}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14453D] dark:text-[var(--yj-text-1)]">
            {profileName ? `${greeting}, ${profileName}` : greeting}
          </h1>
          <p className="mt-1.5 text-sm text-[#3E4F47] dark:text-[var(--yj-text-2)]">
            {t('dashSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onResume}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14453D] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0F352D] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] dark:bg-[#2E7B61] dark:hover:bg-[#256A54] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {resume.hasPendingJourney ? t('dashContinueJourney') : t('dashExploreMatches')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {indicators.map((ind) => (
          <div
            key={ind.label}
            className="rounded-xl border border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] px-4 py-3"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6B63] dark:text-[var(--yj-text-3)]">
              {ind.label}
            </dt>
            <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-[#14453D] dark:text-[var(--yj-text-1)]">
              {ind.value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
};

export default DashboardHeader;
