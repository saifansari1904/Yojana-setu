/**
 * COMMAND CENTER SCREEN
 *
 * The merged Yojana Setu Command Center: one decision surface that answers
 * "what should this entrepreneur focus on right now?".
 *
 * It composes existing systems only — the authoritative matching engine
 * supplies match results, the tracker supplies applications and follow-ups,
 * and the document progress store supplies readiness. Nothing is recomputed
 * and no data is invented.
 */

import React, { useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import { ArrowFillButton } from '../../components/ui/ArrowFillButton';
import type { MatchResult, UserProfile as AppProfile } from '../../types';
import type { TrackedApplication } from '../../types/tracker';
import { loadDocumentProgress } from '../../lib/tracker/documentProgress';
import { useTranslation as useAppTranslation } from '../../i18n';
import { useTranslation } from './i18n';
import {
  toApplicationRecords,
  toFeatureMatchResult,
  toFeatureProfile,
  toFeatureScheme,
  toFollowUpItems,
  toUserDocumentStates,
} from './adapter';
import { generateDashboardInsights } from './lib/dashboard/dashboardInsights';
import type { BusinessStage, FollowUpItem, OpportunityItem, SupportCategory } from './types';
import { ApplicationOverview } from './components/ApplicationOverview';
import { BusinessJourneyOverview } from './components/BusinessJourneyOverview';
import { DocumentOverview } from './components/DocumentOverview';
import { EmptyCommandCenter } from './components/EmptyCommandCenter';
import { FollowUpOverview } from './components/FollowUpOverview';
import { NoMatchState } from './components/NoMatchState';
import { OpportunityPriorityCard } from './components/OpportunityPriorityCard';
import { PartialProfileBanner } from './components/PartialProfileBanner';
import { SupportStackOverview } from './components/SupportStackOverview';
import { TopOpportunitiesList } from './components/TopOpportunitiesList';
import { TrustOverview } from './components/TrustOverview';
import { AddReminderModal } from './components/AddReminderModal';

export interface CommandCenterScreenProps {
  userProfile: AppProfile | null;
  matchResults: MatchResult[];
  applications: TrackedApplication[];
  savedSchemeIds: Set<string>;
  onStartCheck: () => void;
  onOpenResults: () => void;
  onOpenTracker: () => void;
  onSelectScheme: (match: MatchResult) => void;
  onToggleSave?: (schemeId: string) => void;
}

export const CommandCenterScreen: React.FC<CommandCenterScreenProps> = ({
  userProfile,
  matchResults,
  applications,
  savedSchemeIds,
  onStartCheck,
  onOpenResults,
  onOpenTracker,
  onSelectScheme,
  onToggleSave,
}) => {
  const { t, language } = useTranslation();
  const { getLocalizedScheme } = useAppTranslation();
  const [localFollowUps, setLocalFollowUps] = useState<FollowUpItem[]>([]);
  const [completedFollowUpIds, setCompletedFollowUpIds] = useState<string[]>([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const matchByScheme = useMemo(() => {
    const map = new Map<string, MatchResult>();
    matchResults.forEach(m => map.set(m.scheme.id, m));
    return map;
  }, [matchResults]);

  const insights = useMemo(() => {
    const profile = toFeatureProfile(userProfile);
    const schemes = matchResults.map(m => {
      const localized = getLocalizedScheme ? getLocalizedScheme(m.scheme) : undefined;
      return toFeatureScheme(
        m.scheme,
        localized ? { name: localized.name, description: localized.description } : undefined,
      );
    });

    const trackerFollowUps = toFollowUpItems(applications);
    const followUps = [...trackerFollowUps, ...localFollowUps].map(f => ({
      ...f,
      completed: f.completed || completedFollowUpIds.includes(f.id),
    }));

    return generateDashboardInsights({
      profile,
      schemes,
      matchResults: matchResults.map(toFeatureMatchResult),
      applicationRecords: toApplicationRecords(applications),
      userDocs: toUserDocumentStates(loadDocumentProgress()),
      savedSchemeIds: Array.from(savedSchemeIds),
      followUps,
    });
  }, [
    userProfile,
    matchResults,
    applications,
    savedSchemeIds,
    localFollowUps,
    completedFollowUpIds,
    getLocalizedScheme,
  ]);

  const openScheme = (schemeId: string) => {
    const match = matchByScheme.get(schemeId);
    if (match) {
      onSelectScheme(match);
      return;
    }
    onOpenResults();
  };

  const handleOpportunity = (opportunity: OpportunityItem) => {
    if (opportunity.nextBestAction.targetWorkspace === 'PROFILE') {
      onStartCheck();
      return;
    }
    if (opportunity.nextBestAction.targetWorkspace === 'TRACKER') {
      onOpenTracker();
      return;
    }
    openScheme(opportunity.scheme.id);
  };

  const handleToggleSave = (schemeId: string) => {
    if (onToggleSave) onToggleSave(schemeId);
  };

  // New user: no profile yet, so no metrics are shown at all.
  if (!insights.hasProfile) {
    return <EmptyCommandCenter onStartProfile={onStartCheck} id="command-new-user" />;
  }

  const { profileCompleteness, nextBestAction } = insights;

  return (
    <div
      className={`max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 ${language === 'hi' ? 'font-hindi' : ''}`}
    >
      <header id="command-header" className="space-y-1">
        <p className="yj-eyebrow text-[#6F7A73] dark:text-[#8E9F97]">
          {t('navHome')}
        </p>
        {/* Time-of-day greeting: presentation only, no business logic depends on it. */}
        <h1 className="yj-h2 text-[#0B5D4B] dark:text-[#F0F4F2]">
          {(() => {
            const hour = new Date().getHours();
            const isHindi = language === 'hi';
            const greeting =
              hour < 12
                ? isHindi
                  ? 'सुप्रभात।'
                  : 'Good morning.'
                : hour < 17
                ? isHindi
                  ? 'नमस्कार।'
                  : 'Good afternoon.'
                : isHindi
                ? 'शुभ संध्या।'
                : 'Good evening.';
            const name = userProfile?.applicantName || userProfile?.businessName;
            return name ? `${greeting.replace(/[।.]$/, '')}, ${name}.` : greeting;
          })()}
        </h1>
        <p className="yj-body text-[#42544C] dark:text-[#A9BDB3]">
          {insights.hasMatches ? t('headerSubtitle') : t('headerSubtitleEmpty')}
        </p>
      </header>

      {!profileCompleteness.isComplete && (
        <PartialProfileBanner
          completeness={profileCompleteness}
          onCompleteProfile={onStartCheck}
          id="command-partial-profile"
        />
      )}

      {nextBestAction && (
        <section
          id="command-next-action"
          aria-labelledby="command-next-action-heading"
          className="yj-card yj-card-lg border-[#D4EFE1] dark:border-[#22503E] bg-[#F6F8F7] dark:bg-[#142E25] p-4 sm:p-5"
        >
          <h2
            id="command-next-action-heading"
            className="flex items-center gap-2 yj-eyebrow text-[#0F6B4C] dark:text-[#4ADE80]"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            {t('nextBestActionTitle')}
          </h2>
          <p className="mt-2 yj-h3 text-[#0B5D4B] dark:text-[#E8EFEA]">
            {nextBestAction.title}
          </p>
          <p className="mt-1 yj-support text-[#42544C] dark:text-[#9EB0A7] yj-measure">
            {nextBestAction.description}
          </p>
          <div className="mt-3">
            <ArrowFillButton
              id="command-next-action-cta"
              variant="primary"
              size="md"
              onClick={() => {
                if (nextBestAction.targetWorkspace === 'PROFILE') onStartCheck();
                else if (nextBestAction.targetWorkspace === 'TRACKER') onOpenTracker();
                else if (nextBestAction.schemeId) openScheme(nextBestAction.schemeId);
                else onOpenResults();
              }}
            >
              {nextBestAction.actionLabel}
            </ArrowFillButton>
          </div>
        </section>
      )}

      {insights.topOpportunity ? (
        <OpportunityPriorityCard
          opportunity={insights.topOpportunity}
          onContinue={handleOpportunity}
          onToggleSave={handleToggleSave}
          onOpenSchemeDetail={opportunity => openScheme(opportunity.scheme.id)}
          id="command-top-opportunity"
        />
      ) : (
        <NoMatchState
          onReviewProfile={onStartCheck}
          onExploreSupport={onOpenResults}
          onViewNearMatches={onOpenResults}
          id="command-no-matches"
        />
      )}

      <TopOpportunitiesList
        opportunities={insights.priorityOpportunities}
        onSelectOpportunity={opportunity => openScheme(opportunity.scheme.id)}
        onToggleSave={handleToggleSave}
        id="command-opportunities"
      />

      {/* Modular dashboard grid: paired modules on wide screens, stacked on mobile. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
        <BusinessJourneyOverview
          currentStage={insights.currentBusinessStage as BusinessStage}
          relevantSchemesCount={insights.supportSummary.currentStagePathways.schemesCount}
          supportPathwaysCount={insights.supportSummary.currentStagePathways.pathwaysCount}
          applicationsUnderwayCount={insights.supportSummary.currentStagePathways.applicationsUnderwayCount}
          onExploreStage={() => onOpenResults()}
          id="command-journey"
        />

        <SupportStackOverview
          categoryCounts={insights.supportSummary.categoryCounts as Record<SupportCategory, number>}
          onSelectCategory={() => onOpenResults()}
          id="command-support-stack"
        />

        <ApplicationOverview
          summary={insights.applicationSummary}
          onOpenTracker={onOpenTracker}
          onOpenWorkspace={schemeId => openScheme(schemeId)}
          id="command-applications"
        />

        <DocumentOverview
          summary={insights.documentSummary}
          onOpenDocumentCenter={onOpenTracker}
          id="command-documents"
        />

        <FollowUpOverview
          followUps={insights.followUpSummary.upcoming}
          onToggleComplete={id => setCompletedFollowUpIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))}
          onAddReminder={() => setIsReminderOpen(true)}
          onViewAll={onOpenTracker}
          id="command-followups"
        />

        <TrustOverview summary={insights.trustSummary} id="command-trust" />
      </div>

      <AddReminderModal
        schemes={insights.allOpportunities.map(o => o.scheme)}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onAdd={reminder =>
          setLocalFollowUps(prev => [
            ...prev,
            {
              id: `local-${prev.length + 1}-${reminder.schemeId || 'general'}`,
              schemeId: reminder.schemeId || '',
              schemeName: reminder.schemeName || '',
              title: reminder.title,
              titleHi: reminder.titleHi,
              date: reminder.date,
              // Always a reminder the citizen set for themselves.
              type: 'USER_REMINDER',
              completed: false,
            },
          ])
        }
      />
    </div>
  );
};

export default CommandCenterScreen;
