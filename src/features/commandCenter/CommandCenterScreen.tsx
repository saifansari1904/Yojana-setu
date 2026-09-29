import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { MatchResult, UserProfile } from '../../types';
import type { TrackedApplication } from '../../types/tracker';
import type { PathwayAction, SupportPathway } from '../../types/supportPathway';
import { useTranslation } from './i18n';
import { NextBestActionCard } from '../../components/business/NextBestActionCard';
import { NoMatchState } from './components/NoMatchState';
import { deriveBusinessNeedProfile } from '../../lib/business/businessNeedProfile';
import { buildSupportPathway } from '../../lib/business/supportPathway';
import { calculateBusinessProfileCompleteness } from '../../lib/business/businessProfileCompleteness';
import { loadDocumentProgress } from '../../lib/tracker/documentProgress';
import {
  deriveEngagementStage,
  resolveResumeTarget,
  deriveReadinessCategories,
  collectRecentActivity,
  selectTopOpportunities,
  selectActiveApplications,
} from './lib/dashboard/dashboardSelectors';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { StatCard } from '../../components/ui/StatCard';
import { TopOpportunities } from './components/dashboard/TopOpportunities';
import { JourneyStageStrip } from './components/dashboard/JourneyStageStrip';
import { PreparationOverview } from './components/dashboard/PreparationOverview';
import { ApplicationsCard } from './components/dashboard/ApplicationsCard';
import { SavedSchemesCard } from './components/dashboard/SavedSchemesCard';
import { ProfileReadinessCard } from './components/dashboard/ProfileReadinessCard';
import { TrustCard } from './components/dashboard/TrustCard';
import { RecentActivityCard } from './components/dashboard/RecentActivityCard';

interface CommandCenterScreenProps {
  userProfile: UserProfile | null;
  matchResults: MatchResult[];
  applications: TrackedApplication[];
  savedSchemeIds: Set<string>;
  onStartCheck: () => void;
  onOpenResults: () => void;
  onOpenTracker: () => void;
  onOpenProfile: () => void;
  onOpenWorkspace: (match: MatchResult) => void;
  onSelectScheme: (match: MatchResult) => void;
  onToggleSave: (schemeId: string) => void;
}

/**
 * DASHBOARD 2.0 — Entrepreneur Command Center.
 *
 * Presentation layer only. Every number, ranking, eligibility verdict, and
 * recommended action on this screen is produced by the existing business
 * layer (buildSupportPathway / the matching engine). This file chooses what
 * to show and where — never what the underlying answer is.
 */
export const CommandCenterScreen: React.FC<CommandCenterScreenProps> = ({
  userProfile,
  matchResults,
  applications,
  savedSchemeIds,
  onStartCheck,
  onOpenResults,
  onOpenTracker,
  onOpenProfile,
  onOpenWorkspace,
  onSelectScheme,
  onToggleSave,
}) => {
  const { t } = useTranslation();

  const docProgress = useMemo(() => loadDocumentProgress(), []);

  const needProfile = useMemo(
    () => deriveBusinessNeedProfile(userProfile),
    [userProfile],
  );
  const completeness = useMemo(
    () => (userProfile ? calculateBusinessProfileCompleteness(userProfile) : null),
    [userProfile],
  );

  // Top opportunities: the engine's own ordering, eligible first, capped.
  const topOpportunities = useMemo(
    () => selectTopOpportunities(matchResults, 4),
    [matchResults],
  );

  /**
   * Scheme in focus for scheme-contextual actions: the first-ranked
   * opportunity. selectTopOpportunities preserves the engine's ordering
   * (eligible first), so [0] is the engine's top pick — no dashboard-side
   * ranking happens here.
   */
  const focusMatch = useMemo(() => topOpportunities[0] ?? null, [topOpportunities]);

  const pathway: SupportPathway | null = useMemo(() => {
    if (!userProfile) return null;
    const focusPreparedIds =
      focusMatch && docProgress[focusMatch.scheme.id]
        ? new Set(docProgress[focusMatch.scheme.id])
        : new Set<string>();
    return buildSupportPathway({
      profile: userProfile,
      needProfile,
      matchResults,
      selectedMatch: focusMatch,
      preparedDocIds: focusPreparedIds,
    });
  }, [userProfile, needProfile, matchResults, focusMatch, docProgress]);

  const engagementStage = useMemo(
    () =>
      deriveEngagementStage({
        profile: userProfile,
        matchResults,
        applications,
        savedSchemeIds,
        docProgress,
      }),
    [userProfile, matchResults, applications, savedSchemeIds, docProgress],
  );

  const resume = useMemo(
    () => resolveResumeTarget({ matchResults, applications }),
    [matchResults, applications],
  );

  const readinessCategories = useMemo(
    () => (userProfile ? deriveReadinessCategories(userProfile, docProgress) : []),
    [userProfile, docProgress],
  );

  const activeApplications = useMemo(
    () => selectActiveApplications(applications, 5),
    [applications],
  );

  const savedMatches = useMemo(
    () => matchResults.filter((m) => savedSchemeIds.has(m.scheme.id)),
    [matchResults, savedSchemeIds],
  );

  const recentActivity = useMemo(() => collectRecentActivity(applications, 5), [applications]);

  const pendingActions = pathway ? 1 + pathway.secondaryActions.length : 0;

  const handleResume = () => {
    if (resume.target === 'tracker') onOpenTracker();
    else if (resume.target === 'form') onOpenProfile();
    else onOpenResults();
  };

  const handleJourneyNavigate = (target: 'form' | 'results' | 'tracker' | 'workspace') => {
    if (target === 'form') onOpenProfile();
    else if (target === 'tracker') onOpenTracker();
    else if (target === 'workspace') {
      if (focusMatch) onOpenWorkspace(focusMatch);
      else onOpenResults();
    } else onOpenResults();
  };

  /** Maps the existing deterministic action's target onto app navigation. */
  const handlePathwayAction = (action: PathwayAction) => {
    const target = action.actionTarget;
    if (target === 'form') {
      onOpenProfile();
      return;
    }
    if (target === 'compare') {
      onOpenResults();
      return;
    }
    if (target === 'portal' && action.actionUrl) {
      window.open(action.actionUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (target === 'checklist') {
      if (focusMatch) onOpenWorkspace(focusMatch);
      else if (action.relatedSchemeIds && action.relatedSchemeIds.length > 0) {
        const m = matchResults.find((mm) => mm.scheme.id === action.relatedSchemeIds![0]);
        if (m) onOpenWorkspace(m);
        else onOpenResults();
      } else onOpenResults();
      return;
    }
    if (target === 'details') {
      const m =
        action.relatedSchemeIds && action.relatedSchemeIds.length > 0
          ? matchResults.find((mm) => mm.scheme.id === action.relatedSchemeIds![0])
          : focusMatch;
      if (m) onSelectScheme(m);
      else onOpenResults();
      return;
    }
    onOpenResults();
  };

  if (!userProfile || !pathway) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#14453D] dark:text-[var(--yj-text-1)] sm:text-3xl">
          {t('welcomeTitle')}
        </h1>
        <p className="mt-3 max-w-md text-sm text-[#3E4F47] dark:text-[var(--yj-text-2)]">
          {t('welcomeSubtitle')}
        </p>
        <button
          type="button"
          onClick={onStartCheck}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#14453D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0F352D] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D] dark:bg-[#2E7B61] dark:hover:bg-[#256A54] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {t('buildProfileBtn')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* 1 — Command header */}
      <DashboardHeader
        profileName={userProfile.applicantName?.trim() || null}
        readinessPct={completeness ? completeness.percentage : 0}
        pendingActions={pendingActions}
        activeApplications={activeApplications.length}
        savedCount={savedSchemeIds.size}
        resume={resume}
        onResume={handleResume}
      />

      {/* 1b — Key stats (21st.dev-inspired stat cards) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title={t('dashStatMatches')}
          value={matchResults.length}
          description={t('dashStatMatchesDesc')}
          onActionClick={onOpenResults}
          actionLabel={t('dashStatMatchesAction')}
        />
        <StatCard
          title={t('dashStatApplications')}
          value={activeApplications.length}
          description={t('dashStatApplicationsDesc')}
          onActionClick={onOpenTracker}
          actionLabel={t('dashStatApplicationsAction')}
        />
        <StatCard
          title={t('dashStatSaved')}
          value={savedSchemeIds.size}
          description={t('dashStatSavedDesc')}
          onActionClick={onOpenResults}
          actionLabel={t('dashStatSavedAction')}
        />
        <StatCard
          title={t('dashStatReadiness')}
          value={completeness ? completeness.percentage : 0}
          valueSuffix="%"
          description={t('dashStatReadinessDesc')}
          onActionClick={onOpenProfile}
          actionLabel={t('dashStatReadinessAction')}
        />
      </div>

      {/* 2 — Next best action (existing deterministic engine) */}
      <section aria-label={t('nextBestActionTitle')}>
        <NextBestActionCard
          action={pathway.nextBestAction}
          secondaryActions={pathway.secondaryActions}
          onAction={handlePathwayAction}
        />
      </section>

      {/* 3 — Top opportunities */}
      {topOpportunities.length > 0 ? (
        <TopOpportunities
          matches={topOpportunities}
          savedSchemeIds={savedSchemeIds}
          onToggleSave={onToggleSave}
          onOpenScheme={onSelectScheme}
        />
      ) : (
        <NoMatchState
          onReviewProfile={onOpenProfile}
          onExploreSupport={onOpenResults}
          onViewNearMatches={onOpenResults}
        />
      )}

      {/* 4 — Journey + Preparation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <JourneyStageStrip stage={engagementStage} onNavigate={handleJourneyNavigate} />
        <PreparationOverview
          readiness={pathway.readiness}
          focusMatch={focusMatch}
          onOpenWorkspace={() => focusMatch && onOpenWorkspace(focusMatch)}
        />
      </div>

      {/* 5 — Applications + Saved schemes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ApplicationsCard
          applications={activeApplications}
          onOpenTracker={onOpenTracker}
          onOpenResults={onOpenResults}
        />
        <SavedSchemesCard
          matches={savedMatches}
          savedSchemeIds={savedSchemeIds}
          onToggleSave={onToggleSave}
          onOpenScheme={onSelectScheme}
          onOpenResults={onOpenResults}
        />
      </div>

      {/* 6 — Profile readiness */}
      <ProfileReadinessCard categories={readinessCategories} onOpenProfile={onOpenProfile} />

      {/* 7 — Trust + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrustCard matches={topOpportunities} />
        <RecentActivityCard items={recentActivity} />
      </div>
    </div>
  );
};

export default CommandCenterScreen;
