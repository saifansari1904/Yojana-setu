import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  ClipboardList,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import type { MatchResult, UserProfile } from '../types';
import type { TrackedApplication } from '../types/tracker';
import { summariseByStatus } from '../lib/tracker/applicationTracker';
import {
  evaluateFollowUp,
  evaluateSchemeFreshness,
  getLocalizedFollowUp,
  getLocalizedFreshness,
} from '../lib/tracker/schemeFreshness';
import { staggerContainer, staggerItem } from '../animations/variants';
import { AnimatedCounter } from '../animations/AnimatedCounter';
import { EmptyState } from './common/EmptyState';
import { useTranslation } from '../i18n';

interface HomeDashboardScreenProps {
  userProfile: UserProfile | null;
  matchResults: MatchResult[];
  applications: TrackedApplication[];
  savedSchemeIds: Set<string>;
  onStartCheck: () => void;
  onOpenResults: () => void;
  onOpenTracker: () => void;
  onSelectScheme: (match: MatchResult) => void;
}

/** One attention item derived from real tracker / verification data only. */
interface AttentionItem {
  id: string;
  schemeName: string;
  message: string;
  match?: MatchResult;
  tone: 'urgent' | 'caution';
}

/**
 * PHASE 4.4 — HOME DASHBOARD
 *
 * A read-only overview built entirely from existing engines: the matching
 * engine for matches, the tracker for progress, and Phase 4.3 freshness /
 * follow-up evaluators for what needs attention. It computes no new scores
 * and makes no eligibility or approval claims of its own.
 */
export const HomeDashboardScreen: React.FC<HomeDashboardScreenProps> = ({
  userProfile,
  matchResults,
  applications,
  savedSchemeIds,
  onStartCheck,
  onOpenResults,
  onOpenTracker,
  onSelectScheme,
}) => {
  const { lang, t, getLocalizedScheme } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const summary = useMemo(() => summariseByStatus(applications), [applications]);
  const inProgress = summary.interested + summary['docs-ready'] + summary.applied;

  const eligibleMatches = useMemo(
    () => matchResults.filter((match) => match.matchStatus === 'eligible'),
    [matchResults],
  );

  const savedMatches = useMemo(
    () => matchResults.filter((match) => savedSchemeIds.has(match.scheme.id)).slice(0, 5),
    [matchResults, savedSchemeIds],
  );

  const activeApplications = useMemo(
    () =>
      applications
        .filter((app) => app.status !== 'approved' && app.status !== 'rejected')
        .slice(0, 5),
    [applications],
  );

  /**
   * Attention items come from two verifiable sources only:
   *  1. a follow-up date the citizen set themselves that is now due/overdue
   *  2. a scheme record whose verification is stale, inactive or unknown
   * Nothing here invents a government deadline.
   */
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    applications.forEach((app) => {
      const match = matchResults.find((m) => m.scheme.id === app.schemeId);
      const schemeName = match ? getLocalizedScheme(match.scheme).name : app.schemeName;

      const followUp = evaluateFollowUp(app.followUp);
      if (followUp.state === 'OVERDUE' || followUp.state === 'DUE_TODAY') {
        items.push({
          id: `followup-${app.schemeId}`,
          schemeName,
          message: `${t('dashboard.attentionFollowUp')} — ${getLocalizedFollowUp(followUp, lang)}`,
          match,
          tone: 'urgent',
        });
      }

      if (match) {
        const freshness = evaluateSchemeFreshness(match.scheme);
        if (freshness.shouldRecheckOfficialSource) {
          items.push({
            id: `freshness-${app.schemeId}`,
            schemeName,
            message: `${t('dashboard.attentionFreshness')} — ${getLocalizedFreshness(freshness, lang).label}`,
            match,
            tone: 'caution',
          });
        }
      }
    });

    // Urgent first, then stable ordering by scheme name.
    return items.sort((a, b) => {
      if (a.tone !== b.tone) return a.tone === 'urgent' ? -1 : 1;
      return a.schemeName.localeCompare(b.schemeName);
    });
  }, [applications, matchResults, getLocalizedScheme, t, lang]);

  const topMatch = eligibleMatches[0] || matchResults[0] || null;

  if (!userProfile) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <EmptyState
          type="no-data"
          title={t('dashboard.noProfileTitle')}
          description={t('dashboard.noProfileDesc')}
          actionLabel={t('dashboard.startCheck')}
          onAction={onStartCheck}
        />
      </div>
    );
  }

  const stats: Array<{ id: string; label: string; value: number; onClick?: () => void }> = [
    { id: 'matches', label: t('dashboard.statMatches'), value: eligibleMatches.length, onClick: onOpenResults },
    { id: 'saved', label: t('dashboard.statSaved'), value: savedSchemeIds.size, onClick: onOpenResults },
    { id: 'progress', label: t('dashboard.statInProgress'), value: inProgress, onClick: onOpenTracker },
    { id: 'attention', label: t('dashboard.statAttention'), value: attentionItems.length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="mb-1.5 flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-[#16A34A] dark:text-[#4ADE80]" aria-hidden="true" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#516A5F] dark:text-[#9EB0A7]">
            {t('dashboard.badge')}
          </p>
        </div>
        <h1 className="text-xl font-bold text-[#14453D] sm:text-2xl dark:text-[#E8EFEA]">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-[#516A5F] sm:text-sm dark:text-[#9EB0A7]">
          {t('dashboard.subtitle')}
        </p>
        <p className="mt-1.5 text-[11px] text-[#6F7A73] dark:text-[#8E9F97]">
          {t('dashboard.privacyNote')}
        </p>
      </header>

      {/* Stat tiles */}
      <motion.div
        variants={shouldReduceMotion ? undefined : staggerContainer}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {stats.map((stat) => {
          const content = (
            <>
              <span className="block text-2xl font-bold text-[#14453D] dark:text-[#E8EFEA]">
                <AnimatedCounter value={stat.value} />
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7]">
                {stat.label}
              </span>
            </>
          );

          return (
            <motion.div key={stat.id} variants={shouldReduceMotion ? undefined : staggerItem}>
              {stat.onClick ? (
                <button
                  id={`dashboard-stat-${stat.id}`}
                  type="button"
                  onClick={stat.onClick}
                  className="min-h-[44px] w-full cursor-pointer rounded-md border border-[#E2E2E0] bg-white p-3 text-left transition-colors hover:border-[#B2CDBF] focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:border-[#24342D] dark:bg-[#151C19] dark:hover:border-[#285743]"
                >
                  {content}
                </button>
              ) : (
                <div
                  id={`dashboard-stat-${stat.id}`}
                  className="min-h-[44px] rounded-md border border-[#E2E2E0] bg-white p-3 dark:border-[#24342D] dark:bg-[#151C19]"
                >
                  {content}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Next step — reuses the matching engine's own explanation, no new claims */}
      {topMatch && (
        <section
          id="dashboard-next-step"
          className="mb-6 rounded-md border border-[#B2CDBF] bg-[#D4EFE1]/50 p-4 dark:border-[#285743] dark:bg-[#132720]"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0F6B4C] dark:text-[#4ADE80]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-[#14453D] dark:text-[#E8EFEA]">
              {t('dashboard.nextStepTitle')}
            </h2>
          </div>
          <p className="text-sm font-semibold text-[#14453D] dark:text-[#E8EFEA]">
            {getLocalizedScheme(topMatch.scheme).name}
          </p>
          <p className="mt-1 text-xs text-[#3F4943] dark:text-[#C5D5CC]">
            {topMatch.plainLanguageExplanation}
          </p>
          <button
            id="dashboard-open-top-match"
            type="button"
            onClick={() => onSelectScheme(topMatch)}
            className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded bg-[#14453D] px-3 text-[11px] font-bold text-white transition-colors hover:bg-[#0B302B] focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:bg-[#1C5045] dark:hover:bg-[#14453D]"
          >
            <span>{t('dashboard.openScheme')}</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Saved schemes */}
        <section
          id="dashboard-saved"
          className="rounded-md border border-[#E2E2E0] bg-white p-4 dark:border-[#24342D] dark:bg-[#151C19]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-[#14453D] dark:text-[#E8EFEA]">
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.savedTitle')}
            </h2>
            <button
              type="button"
              onClick={onOpenResults}
              className="min-h-[44px] cursor-pointer rounded px-2 text-[11px] font-bold text-[#0F6B4C] underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:text-[#4ADE80]"
            >
              {t('dashboard.viewAllMatches')}
            </button>
          </div>

          {savedMatches.length === 0 ? (
            <p className="text-xs text-[#6F7A73] dark:text-[#8E9F97]">{t('dashboard.savedEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {savedMatches.map((match) => (
                <li key={match.scheme.id}>
                  <button
                    type="button"
                    onClick={() => onSelectScheme(match)}
                    className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 rounded border border-[#EAECEB] bg-[#F6F8F7] px-3 py-2 text-left transition-colors hover:border-[#B2CDBF] focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:border-[#24342D] dark:bg-[#1B2720] dark:hover:border-[#285743]"
                  >
                    <span className="min-w-0 truncate text-xs font-semibold text-[#14453D] dark:text-[#C5D5CC]">
                      {getLocalizedScheme(match.scheme).name}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold text-[#516A5F] dark:text-[#9EB0A7]">
                      {match.matchPercentage}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Applications in progress */}
        <section
          id="dashboard-applications"
          className="rounded-md border border-[#E2E2E0] bg-white p-4 dark:border-[#24342D] dark:bg-[#151C19]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-[#14453D] dark:text-[#E8EFEA]">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.trackerTitle')}
            </h2>
            <button
              type="button"
              onClick={onOpenTracker}
              className="min-h-[44px] cursor-pointer rounded px-2 text-[11px] font-bold text-[#0F6B4C] underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:text-[#4ADE80]"
            >
              {t('dashboard.viewTracker')}
            </button>
          </div>

          {activeApplications.length === 0 ? (
            <p className="text-xs text-[#6F7A73] dark:text-[#8E9F97]">{t('dashboard.trackerEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {activeApplications.map((app) => {
                const match = matchResults.find((m) => m.scheme.id === app.schemeId);
                const name = match ? getLocalizedScheme(match.scheme).name : app.schemeName;
                return (
                  <li
                    key={app.schemeId}
                    className="rounded border border-[#EAECEB] bg-[#F6F8F7] px-3 py-2 dark:border-[#24342D] dark:bg-[#1B2720]"
                  >
                    <p className="truncate text-xs font-semibold text-[#14453D] dark:text-[#C5D5CC]">
                      {name}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#516A5F] dark:text-[#9EB0A7]">
                      {app.status}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Needs attention */}
      <section
        id="dashboard-attention"
        className="mt-4 rounded-md border border-[#E2E2E0] bg-white p-4 dark:border-[#24342D] dark:bg-[#151C19]"
      >
        <h2 className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#14453D] dark:text-[#E8EFEA]">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {t('dashboard.attentionTitle')}
        </h2>

        {attentionItems.length === 0 ? (
          <p className="text-xs text-[#6F7A73] dark:text-[#8E9F97]">{t('dashboard.attentionNone')}</p>
        ) : (
          <ul className="space-y-2">
            {attentionItems.map((item) => (
              <li
                key={item.id}
                className={`rounded border px-3 py-2 ${
                  item.tone === 'urgent'
                    ? 'border-[#FFCCBD] bg-[#FFDAD6]/50 dark:border-[#5A2B20] dark:bg-[#3D1A14]/50'
                    : 'border-[#FCD34D] bg-[#FEF3C7]/70 dark:border-[#5B4718] dark:bg-[#3B2F14]/60'
                }`}
              >
                <p className="text-xs font-semibold text-[#14453D] dark:text-[#E8EFEA]">
                  {item.schemeName}
                </p>
                <p className="mt-0.5 text-[11px] text-[#3F4943] dark:text-[#C5D5CC]">{item.message}</p>
                {item.match && (
                  <button
                    type="button"
                    onClick={() => item.match && onSelectScheme(item.match)}
                    className="mt-1 min-h-[44px] cursor-pointer rounded px-1 text-[11px] font-bold text-[#0F6B4C] underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:text-[#4ADE80]"
                  >
                    {t('dashboard.openScheme')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default HomeDashboardScreen;
