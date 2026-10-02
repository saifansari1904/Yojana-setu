import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { useTranslation as useAppTranslation } from '../../../../i18n';
import { useTranslation } from '../../i18n';
import type { MatchResult } from '../../../../types';
import { AnimatedScore } from '../../../../components/ui/AnimatedScore';
import { BookmarkButton } from '../../../../components/ui/BookmarkButton';
import { VerificationBadge } from '../../../../components/ui/VerificationBadge';
import { classifyPortalDomain } from '../../lib/trust/trustEngine';
import { evaluateSchemeFreshness, getLocalizedFreshness } from '../../../../lib/tracker/schemeFreshness';
import { SectionHeading, ENTRANCE } from './SectionHeading';
import { freshnessDotClass } from './freshnessDot';

interface OpportunityCardProps {
  match: MatchResult;
  isSaved: boolean;
  onToggleSave: (schemeId: string) => void;
  onOpenScheme: (match: MatchResult) => void;
  rank: number;
}

const StatusPill: React.FC<{ match: MatchResult }> = ({ match }) => {
  const { t } = useAppTranslation();
  if (match.matchStatus === 'eligible') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-[#D9E8DF] px-2.5 py-0.5 text-xs font-bold text-[#14453D] border border-[#B2CDBF] dark:bg-[#1A382D] dark:text-[var(--accent-green)] dark:border-[#285743]">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('results.statusEligible')}</span>
      </span>
    );
  }
  if (match.matchStatus === 'near-match') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('results.statusNearMatch')}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-[#F3F4F3] px-2.5 py-0.5 text-xs font-bold text-[#7C2C0F] border border-[#FFDAD6] dark:bg-[var(--bg-raised)] dark:text-[#FCA5A5] dark:border-[#5A2B20]">
      <Info className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{t('results.statusLowMatch')}</span>
    </span>
  );
};

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  match,
  isSaved,
  onToggleSave,
  onOpenScheme,
  rank,
}) => {
  const { language, t } = useTranslation();
  const { getLocalizedScheme } = useAppTranslation();
  const [whyOpen, setWhyOpen] = useState(false);
  const localized = getLocalizedScheme(match.scheme);
  const trust = classifyPortalDomain(match.scheme.officialPortalUrl);
  const freshness = evaluateSchemeFreshness(match.scheme);
  const freshnessLabel = getLocalizedFreshness(freshness, language).label;

  const factors = (match.strongestFactors || []).slice(0, 3);
  const gap = match.primaryGap || (match.unmetCriteria || [])[0] || null;

  return (
    <article
      aria-label={localized.name}
      className={`yj-card yj-hoverable relative flex flex-col p-5 ${ENTRANCE}`}
      style={{ animationDelay: `${Math.min(rank, 4) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug text-[#14453D] dark:text-[var(--yj-text-1)]">
            {localized.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusPill match={match} />
            {match.matchStatus !== 'eligible' && (
              <span className="text-xs font-medium text-[#5A6B63] dark:text-[var(--yj-text-3)]">
                {t('dashPotentiallyRelevant')}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <AnimatedScore
            value={match.matchPercentage}
            className="text-2xl font-bold tabular-nums text-[#14453D] dark:text-[var(--yj-text-1)]"
          />
          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onToggleSave(match.scheme.id)}
            schemeName={localized.name}
            compact
          />
        </div>
      </div>

      {factors.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label={t('dashWhyMatches')}>
          {factors.map((f, i) => (
            <li
              key={`${f.factorKey}-${i}`}
              className="flex items-start gap-2 text-[13px] text-[#2E4239] dark:text-[var(--yj-text-2)]"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#1E6A50] dark:text-[var(--accent-green)]"
                aria-hidden="true"
              />
              <span>{f.factorLabel}</span>
            </li>
          ))}
        </ul>
      )}

      {gap && (
        <p className="mt-2.5 flex items-start gap-2 text-[13px] text-[#7C2C0F] dark:text-amber-200/90">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{gap.factorLabel}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <VerificationBadge classification={trust} />
        <span className="inline-flex items-center gap-1.5 text-xs text-[#5A6B63] dark:text-[var(--yj-text-3)]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${freshnessDotClass(freshness.state)}`}
            aria-hidden="true"
          />
          {freshnessLabel}
        </span>
      </div>

      {match.plainLanguageExplanation && (
        <div className="mt-3 border-t border-[var(--yj-border-subtle)] pt-2">
          <button
            type="button"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1E6A50] dark:text-[var(--accent-green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] rounded"
          >
            {t('dashWhyMatches')}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${whyOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          {whyOpen && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#3E4F47] dark:text-[var(--yj-text-2)]">
              {match.plainLanguageExplanation}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => onOpenScheme(match)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#14453D]/30 px-4 py-2.5 text-sm font-semibold text-[#14453D] transition hover:bg-[#14453D] hover:text-white active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] dark:border-[var(--accent-green)]/40 dark:text-[var(--accent-green)] dark:hover:bg-[var(--accent-green)] dark:hover:text-[#0A2420] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {t('dashViewScheme')}
        </button>
      </div>
    </article>
  );
};

interface TopOpportunitiesProps {
  matches: MatchResult[];
  savedSchemeIds: Set<string>;
  onToggleSave: (schemeId: string) => void;
  onOpenScheme: (match: MatchResult) => void;
}

export const TopOpportunities: React.FC<TopOpportunitiesProps> = ({
  matches,
  savedSchemeIds,
  onToggleSave,
  onOpenScheme,
}) => {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="dash-opportunities-title" className={ENTRANCE}>
      <SectionHeading level={2} id="dash-opportunities-title" title={t('dashOpportunitiesTitle')} className="mb-3" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {matches.map((match, i) => (
          <OpportunityCard
            key={match.scheme.id}
            match={match}
            rank={i}
            isSaved={savedSchemeIds.has(match.scheme.id)}
            onToggleSave={onToggleSave}
            onOpenScheme={onOpenScheme}
          />
        ))}
      </div>
    </section>
  );
};

export default TopOpportunities;
