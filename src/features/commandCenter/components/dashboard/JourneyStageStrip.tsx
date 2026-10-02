import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  ENGAGEMENT_STAGES,
  type EngagementStage,
} from '../../lib/dashboard/dashboardSelectors';
import { SectionHeading, ENTRANCE } from './SectionHeading';

interface JourneyStageStripProps {
  stage: EngagementStage | null;
  onNavigate: (target: 'form' | 'results' | 'tracker' | 'workspace') => void;
}

const STAGE_CTA_TARGET: Record<EngagementStage, 'form' | 'results' | 'tracker' | 'workspace'> = {
  DISCOVER: 'form',
  MATCH: 'results',
  UNDERSTAND: 'results',
  PREPARE: 'workspace',
  APPLY: 'tracker',
  TRACK: 'tracker',
};

export const JourneyStageStrip: React.FC<JourneyStageStripProps> = ({ stage, onNavigate }) => {
  const { t } = useTranslation();
  if (!stage) return null;
  const currentIndex = ENGAGEMENT_STAGES.indexOf(stage);

  return (
    <section aria-labelledby="dash-journey-title" className={`yj-card p-5 sm:p-6 ${ENTRANCE}`}>
      <SectionHeading level={2} id="dash-journey-title" title={t('dashJourneyTitle')} className="mb-4" />

      <ol className="flex items-start" aria-label={t('dashJourneyTitle')}>
        {ENGAGEMENT_STAGES.map((s, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <li key={s} className="flex min-w-0 flex-1 items-start last:flex-none" aria-current={isCurrent ? 'step' : undefined}>
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors motion-reduce:transition-none ${
                    isCurrent
                      ? 'border-[#14453D] bg-[#14453D] text-white dark:border-[var(--accent-green)] dark:bg-[var(--accent-green)] dark:text-[#0A2420]'
                      : isPast
                        ? 'border-[#1E6A50] bg-[#D9E8DF] text-[#14453D] dark:border-[var(--accent-green)]/60 dark:bg-[#1A382D] dark:text-[var(--accent-green)]'
                        : 'border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] text-[#8A9A92] dark:text-[var(--yj-text-3)]'
                  }`}
                >
                  {isPast ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={`text-xs sm:text-xs font-bold uppercase tracking-wide text-center leading-tight break-words ${
                    isCurrent
                      ? 'text-[#14453D] dark:text-[var(--yj-text-1)]'
                      : 'text-[#8A9A92] dark:text-[var(--yj-text-3)]'
                  }`}
                >
                  {t(`dashStage${s}`)}
                </span>
              </div>
              {i < ENGAGEMENT_STAGES.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`mx-1 mt-4 h-0.5 flex-1 rounded ${
                    i < currentIndex ? 'bg-[#1E6A50] dark:bg-[var(--accent-green)]/70' : 'bg-[var(--yj-border-subtle)]'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 rounded-xl bg-[var(--yj-surface-1)] border border-[var(--yj-border-subtle)] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#5A6B63] dark:text-[var(--yj-text-3)]">
          {t('dashCurrentStage')}: {t(`dashStage${stage}`)}
        </p>
        <p className="mt-1 text-sm text-[#3E4F47] dark:text-[var(--yj-text-2)]">
          {t(`dashStageLine${stage}`)}
        </p>
        <button
          type="button"
          onClick={() => onNavigate(STAGE_CTA_TARGET[stage])}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#14453D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F352D] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] dark:bg-[#2E7B61] dark:hover:bg-[#256A54] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {t(`dashCta${stage}`)}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

export default JourneyStageStrip;
