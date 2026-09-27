import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getStatusMeta } from '../../../../lib/tracker/applicationTracker';
import type { TrackedApplication } from '../../../../types/tracker';
import { SectionHeading, ENTRANCE } from './SectionHeading';

function formatDate(iso: string, lang: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

interface ApplicationsCardProps {
  applications: TrackedApplication[];
  onOpenTracker: () => void;
  onOpenResults: () => void;
}

export const ApplicationsCard: React.FC<ApplicationsCardProps> = ({
  applications,
  onOpenTracker,
  onOpenResults,
}) => {
  const { language, t } = useTranslation();

  return (
    <section aria-labelledby="dash-apps-title" className={`yj-card flex flex-col p-5 sm:p-6 ${ENTRANCE}`}>
      <SectionHeading level={2} id="dash-apps-title" title={t('dashApplicationsTitle')} className="mb-4" />
      {applications.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-3 py-4">
          <FileText className="h-8 w-8 text-[#8A9A92] dark:text-[var(--yj-text-3)]" aria-hidden="true" />
          <p className="text-sm text-[#3E4F47] dark:text-[var(--yj-text-2)]">{t('dashApplicationsEmpty')}</p>
          <button
            type="button"
            onClick={onOpenResults}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1E6A50] dark:text-[var(--accent-green)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] rounded"
          >
            {t('dashExploreYourMatches')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <ul className="flex-1 space-y-3">
            {applications.map((app) => (
              <li
                key={`${app.schemeId}-${app.status}-${app.updatedAt}`}
                className="rounded-xl border border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] p-3.5"
              >
                <p className="truncate text-sm font-bold text-[#14453D] dark:text-[var(--yj-text-1)]">
                  {app.schemeName}
                </p>
                <p className="mt-1 flex items-center justify-between gap-2 text-xs text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                  <span className="font-semibold">{getStatusMeta(app.status, language).label}</span>
                  {app.updatedAt && <span>{formatDate(app.updatedAt, language)}</span>}
                </p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onOpenTracker}
            className="mt-4 inline-flex items-center gap-2 self-start text-sm font-bold text-[#1E6A50] dark:text-[var(--accent-green)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] rounded"
          >
            {t('dashViewApplications')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
};

export default ApplicationsCard;
