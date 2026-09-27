import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, CircleDashed } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { ReadinessCategory } from '../../lib/dashboard/dashboardSelectors';
import { SectionHeading, ENTRANCE } from './SectionHeading';

const CATEGORY_KEY = {
  personal: 'dashReadinessPersonal',
  business: 'dashReadinessBusiness',
  financial: 'dashReadinessFinancial',
  registrations: 'dashReadinessRegistrations',
  documents: 'dashReadinessDocuments',
} as const;

const STATE_KEY = {
  COMPLETE: 'dashPrepComplete',
  ATTENTION: 'dashPrepAttention',
  NOT_ASSESSED: 'dashPrepNotAssessed',
} as const;

interface ProfileReadinessCardProps {
  categories: ReadinessCategory[];
  onOpenProfile: () => void;
}

export const ProfileReadinessCard: React.FC<ProfileReadinessCardProps> = ({
  categories,
  onOpenProfile,
}) => {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="dash-readiness-title" className={`yj-card p-5 sm:p-6 ${ENTRANCE}`}>
      <SectionHeading level={2} id="dash-readiness-title" title={t('dashReadinessTitle')} className="mb-1" />
      <p className="mb-4 text-[13px] text-[#5A6B63] dark:text-[var(--yj-text-3)]">
        {t('dashReadinessIntro')}
      </p>
      <ul className="space-y-2.5">
        {categories.map((cat) => (
          <li
            key={cat.key}
            className="flex items-center gap-3 rounded-xl border border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] px-3.5 py-3"
          >
            {cat.state === 'COMPLETE' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
            ) : cat.state === 'ATTENTION' ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            ) : (
              <CircleDashed className="h-5 w-5 shrink-0 text-[#8A9A92] dark:text-[var(--yj-text-3)]" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#14453D] dark:text-[var(--yj-text-1)]">
                {t(CATEGORY_KEY[cat.key])}
              </span>
              <span className="block text-xs text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                {t(STATE_KEY[cat.state])}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onOpenProfile}
        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1E6A50] dark:text-[var(--accent-green)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] rounded"
      >
        {t('dashViewProfile')}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  );
};

export default ProfileReadinessCard;
