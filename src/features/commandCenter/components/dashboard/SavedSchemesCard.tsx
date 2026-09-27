import React from 'react';
import { ArrowRight, Bookmark } from 'lucide-react';
import { useTranslation as useAppTranslation } from '../../../../i18n';
import { useTranslation } from '../../i18n';
import type { MatchResult } from '../../../../types';
import { VerificationBadge } from '../../../../components/ui/VerificationBadge';
import { classifyPortalDomain } from '../../lib/trust/trustEngine';
import { SectionHeading, ENTRANCE } from './SectionHeading';

interface SavedSchemesCardProps {
  matches: MatchResult[];
  savedSchemeIds: Set<string>;
  onToggleSave: (schemeId: string) => void;
  onOpenScheme: (match: MatchResult) => void;
  onOpenResults: () => void;
}

export const SavedSchemesCard: React.FC<SavedSchemesCardProps> = ({
  matches,
  savedSchemeIds,
  onToggleSave,
  onOpenScheme,
  onOpenResults,
}) => {
  const { t } = useTranslation();
  const { getLocalizedScheme } = useAppTranslation();

  return (
    <section aria-labelledby="dash-saved-title" className={`yj-card flex flex-col p-5 sm:p-6 ${ENTRANCE}`}>
      <SectionHeading level={2} id="dash-saved-title" title={t('dashSavedTitle')} className="mb-4" />
      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-3 py-4">
          <Bookmark className="h-8 w-8 text-[#8A9A92] dark:text-[var(--yj-text-3)]" aria-hidden="true" />
          <p className="text-sm text-[#3E4F47] dark:text-[var(--yj-text-2)]">{t('dashSavedEmpty')}</p>
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
        <ul className="flex-1 space-y-2.5">
          {matches.map((match) => {
            const localized = getLocalizedScheme(match.scheme);
            return (
              <li key={match.scheme.id}>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] px-3.5 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenScheme(match)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] rounded"
                  >
                    <span className="block truncate text-sm font-bold text-[#14453D] dark:text-[var(--yj-text-1)]">
                      {localized.name}
                    </span>
                    <span className="mt-1 block">
                      <VerificationBadge classification={classifyPortalDomain(match.scheme.officialPortalUrl)} />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleSave(match.scheme.id)}
                    aria-pressed="true"
                    aria-label={`${t('dashRemoveSaved')}: ${localized.name}`}
                    className="shrink-0 rounded-lg p-2 text-[#1E6A50] transition hover:bg-[#D9E8DF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] dark:text-[var(--accent-green)] dark:hover:bg-[#1A382D] motion-reduce:transition-none"
                  >
                    <Bookmark className="h-5 w-5 fill-current" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default SavedSchemesCard;
