/**
 * DASHBOARD 2.0 — PRESENTATION SELECTORS
 *
 * Small, pure, presentation-safe selectors for the Entrepreneur Command
 * Center. They read existing application state and the existing business
 * layer — they never recompute matching, eligibility, or ranking, and they
 * never invent data. Anything a selector cannot derive honestly is reported
 * as "not assessed" by the component, never filled in.
 */

import type { MatchResult, UserProfile } from '../../../../types';
import type { TrackedApplication, JourneyEvent } from '../../../../types/tracker';
import type { DocumentProgressMap } from '../../../../lib/tracker/documentProgress';

/** Scheme-engagement journey: where the citizen stands, from actual state. */
export type EngagementStage =
  | 'DISCOVER'
  | 'MATCH'
  | 'UNDERSTAND'
  | 'PREPARE'
  | 'APPLY'
  | 'TRACK';

export const ENGAGEMENT_STAGES: EngagementStage[] = [
  'DISCOVER',
  'MATCH',
  'UNDERSTAND',
  'PREPARE',
  'APPLY',
  'TRACK',
];

const TERMINAL_STATUSES = new Set(['applied', 'approved', 'rejected']);
const ACTIVE_STATUSES = new Set(['interested', 'docs-ready', 'applied']);

/**
 * Derives the current engagement stage from real state only:
 * tracked-application statuses, engaged document checklists, saved schemes,
 * and generated matches. Returns null when there is no profile yet (the
 * dashboard shows its new-user empty state instead of a fake stage).
 */
export function deriveEngagementStage(args: {
  profile: UserProfile | null;
  matchResults: MatchResult[];
  applications: TrackedApplication[];
  savedSchemeIds: Set<string>;
  docProgress: DocumentProgressMap;
}): EngagementStage | null {
  const { profile, matchResults, applications, savedSchemeIds, docProgress } = args;
  if (!profile) return null;

  const statuses = applications.map((a) => a.status);
  if (statuses.some((s) => TERMINAL_STATUSES.has(s))) return 'TRACK';
  if (statuses.includes('docs-ready')) return 'APPLY';

  const docsEngaged = Object.values(docProgress).some((ids) => ids.length > 0);
  if (docsEngaged || statuses.includes('interested')) return 'PREPARE';
  if (matchResults.length > 0 && savedSchemeIds.size > 0) return 'UNDERSTAND';
  if (matchResults.length > 0) return 'MATCH';
  return 'DISCOVER';
}

export type ResumeTarget = 'tracker' | 'results' | 'form';

export interface ResumeDecision {
  target: ResumeTarget;
  /** False when there is no pending journey state at all. */
  hasPendingJourney: boolean;
}

/**
 * "Continue where I left off": routes to the most advanced real state —
 * active applications first, then generated matches, then the assessment
 * form. When nothing exists yet there is no journey to continue.
 */
export function resolveResumeTarget(args: {
  matchResults: MatchResult[];
  applications: TrackedApplication[];
}): ResumeDecision {
  const { matchResults, applications } = args;
  const hasActive = applications.some((a) => ACTIVE_STATUSES.has(a.status));
  if (hasActive) return { target: 'tracker', hasPendingJourney: true };
  if (matchResults.length > 0) return { target: 'results', hasPendingJourney: true };
  return { target: 'results', hasPendingJourney: false };
}

/** Honest readiness states: never a fabricated percentage. */
export type ReadinessCategoryState = 'COMPLETE' | 'ATTENTION' | 'NOT_ASSESSED';

export interface ReadinessCategory {
  key: 'personal' | 'business' | 'financial' | 'registrations' | 'documents';
  state: ReadinessCategoryState;
}

function presence(values: unknown[]): number {
  return values.filter((v) => {
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return true;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
}

function toCategoryState(filled: number, total: number): ReadinessCategoryState {
  if (filled >= total) return 'COMPLETE';
  if (filled > 0) return 'ATTENTION';
  return 'NOT_ASSESSED';
}

/**
 * Profile-readiness categories from field presence on the existing profile
 * plus the existing document-progress store. Presence is factual; there is
 * no new scoring model here.
 */
export function deriveReadinessCategories(
  profile: UserProfile,
  docProgress: DocumentProgressMap,
): ReadinessCategory[] {
  const personalFields = [
    profile.applicantName,
    profile.age,
    profile.category,
    profile.annualIncome,
    profile.state || profile.residenceState,
  ];
  const businessFields = [
    profile.businessStageKey || profile.businessStage,
    profile.businessType || profile.sector,
    profile.operationalStatus !== undefined && profile.operationalStatus !== 'UNKNOWN'
      ? profile.operationalStatus
      : profile.hasExistingBusiness !== undefined
        ? profile.hasExistingBusiness
        : undefined,
    profile.businessEntityType,
  ];
  const financialFields = [
    profile.totalProjectCost && profile.totalProjectCost > 0 ? profile.totalProjectCost : undefined,
    profile.fundingRequired && profile.fundingRequired > 0 ? profile.fundingRequired : undefined,
    profile.fundingRangeId,
  ];

  const regKnown =
    profile.registrationStatus !== undefined &&
    profile.registrationStatus !== 'UNKNOWN' &&
    profile.registrationStatus !== null;
  const regState: ReadinessCategoryState = !regKnown
    ? 'NOT_ASSESSED'
    : profile.registrationStatus === 'REGISTERED'
      ? 'COMPLETE'
      : 'ATTENTION';

  const docsEngaged = Object.values(docProgress).some((ids) => ids.length > 0);
  const docsState: ReadinessCategoryState = docsEngaged ? 'ATTENTION' : 'NOT_ASSESSED';

  return [
    { key: 'personal', state: toCategoryState(presence(personalFields), personalFields.length) },
    { key: 'business', state: toCategoryState(presence(businessFields), businessFields.length) },
    { key: 'financial', state: toCategoryState(presence(financialFields), financialFields.length) },
    { key: 'registrations', state: regState },
    { key: 'documents', state: docsState },
  ];
}

export interface ActivityItem {
  id: string;
  at: string;
  event: JourneyEvent;
  schemeName: string;
}

/**
 * Recent activity from the application's own journey events — real
 * citizen actions with real device timestamps. Entries without a timestamp
 * are excluded rather than guessed at.
 */
export function collectRecentActivity(
  applications: TrackedApplication[],
  limit = 5,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const app of applications) {
    for (const event of app.journey || []) {
      if (!event.at) continue;
      items.push({
        id: event.id,
        at: event.at,
        event,
        schemeName: app.schemeName,
      });
    }
  }
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return items.slice(0, Math.max(0, limit));
}

/**
 * Top opportunities for the dashboard: eligible matches first (the engine's
 * own ordering preserved within each group), capped at `count`. This is a
 * presentation slice, not a re-ranking — no score is computed here.
 */
export function selectTopOpportunities(
  matchResults: MatchResult[],
  count = 4,
): MatchResult[] {
  const eligible = matchResults.filter((m) => m.matchStatus === 'eligible');
  const rest = matchResults.filter((m) => m.matchStatus !== 'eligible');
  return [...eligible, ...rest].slice(0, Math.max(0, count));
}

/** Active applications: everything not in a terminal decided state. */
export function selectActiveApplications(
  applications: TrackedApplication[],
  limit = 5,
): TrackedApplication[] {
  return applications
    .filter((a) => a.status !== 'approved' && a.status !== 'rejected')
    .slice(0, Math.max(0, limit));
}
