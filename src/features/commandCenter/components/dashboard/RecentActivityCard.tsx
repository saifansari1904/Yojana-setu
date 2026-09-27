import React from 'react';
import { useTranslation } from '../../i18n';
import { getLocalizedJourneyEvent } from '../../../../lib/tracker/schemeFreshness';
import type { ActivityItem } from '../../lib/dashboard/dashboardSelectors';
import { SectionHeading, ENTRANCE } from './SectionHeading';

function formatDateTime(iso: string, lang: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

interface RecentActivityCardProps {
  items: ActivityItem[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ items }) => {
  const { language, t } = useTranslation();

  return (
    <section aria-labelledby="dash-activity-title" className={`yj-card p-5 sm:p-6 ${ENTRANCE}`}>
      <SectionHeading level={2} id="dash-activity-title" title={t('dashActivityTitle')} className="mb-4" />
      {items.length === 0 ? (
        <p className="py-4 text-sm text-[#3E4F47] dark:text-[var(--yj-text-2)]">
          {t('dashActivityEmpty')}
        </p>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-[var(--yj-border-subtle)] pl-5">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <span
                className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-[#1E6A50] dark:bg-[var(--accent-green)]"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-[#14453D] dark:text-[var(--yj-text-1)]">
                {item.schemeName}
              </p>
              <p className="text-[13px] text-[#3E4F47] dark:text-[var(--yj-text-2)]">
                {getLocalizedJourneyEvent(item.event, language)}
              </p>
              <p className="mt-0.5 text-xs text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                {formatDateTime(item.at, language)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default RecentActivityCard;
