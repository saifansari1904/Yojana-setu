import React from 'react';
import { useTranslation as useAppTranslation } from '../../../../i18n';
import { useTranslation } from '../../i18n';
import type { MatchResult } from '../../../../types';
import { VerificationBadge } from '../../../../components/ui/VerificationBadge';
import { classifyPortalDomain } from '../../lib/trust/trustEngine';
import { evaluateSchemeFreshness, getLocalizedFreshness } from '../../../../lib/tracker/schemeFreshness';
import { SectionHeading, ENTRANCE } from './SectionHeading';
import { freshnessDotClass } from './freshnessDot';

interface TrustCardProps {
  matches: MatchResult[];
}

export const TrustCard: React.FC<TrustCardProps> = ({ matches }) => {
  const { language, t } = useTranslation();
  const { getLocalizedScheme } = useAppTranslation();

  return (
    <section aria-labelledby="dash-trust-title" className={`yj-card p-5 sm:p-6 ${ENTRANCE}`}>
      <SectionHeading level={2} id="dash-trust-title" title={t('dashTrustTitle')} className="mb-4" />
      <p className="mb-4 text-[13px] leading-relaxed text-[#3E4F47] dark:text-[var(--yj-text-2)]">
        {t('dashTrustIntro')}
      </p>
      {matches.length > 0 && (
        <ul className="space-y-2.5">
          {matches.map((match) => {
            const localized = getLocalizedScheme(match.scheme);
            const freshness = evaluateSchemeFreshness(match.scheme);
            return (
              <li
                key={match.scheme.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--yj-border-subtle)] bg-[var(--yj-surface-1)] px-3.5 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#14453D] dark:text-[var(--yj-text-1)]">
                    {localized.name}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${freshnessDotClass(freshness.state)}`}
                      aria-hidden="true"
                    />
                    {getLocalizedFreshness(freshness, language).label}
                  </span>
                </span>
                <span className="shrink-0">
                  <VerificationBadge classification={classifyPortalDomain(match.scheme.officialPortalUrl)} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default TrustCard;
