/**
 * PHASE 4.3 — APPLICATION JOURNEY
 *
 * Bridges the Phase 4.2 support pathway to the Phase 1 application tracker.
 * Deterministic, local-only, no AI, no fabricated government data.
 *
 * Reuses (never duplicates):
 *  - Phase 4.2 `SupportPathway` (stage, readiness, next best action, checklist)
 *  - Phase 1 tracker persistence (`applicationTracker.ts`)
 *  - Phase 4.3 document progress store (`documentProgress.ts`)
 */

import type { MatchResult } from '../../types/matching';
import type { SupportPathway } from '../../types/supportPathway';
import type {
  ApplicationStatus,
  JourneyEvent,
  JourneyEventSource,
  PathwaySnapshot,
  TrackedApplication,
} from '../../types/tracker';
import { createTrackedApplication, upsertTrackedApplication } from './applicationTracker';

const STATUS_LABELS: Record<ApplicationStatus, { en: string; hi: string }> = {
  interested: { en: 'Saved as interested', hi: 'रुचि के रूप में सहेजा गया' },
  'docs-ready': { en: 'Documents marked ready', hi: 'दस्तावेज़ तैयार चिह्नित' },
  applied: { en: 'Applied through official channel', hi: 'आधिकारिक माध्यम से आवेदन किया' },
  approved: { en: 'Recorded as approved', hi: 'स्वीकृत दर्ज किया गया' },
  rejected: { en: 'Recorded as not approved', hi: 'अस्वीकृत दर्ज किया गया' },
};

/** Stable, collision-resistant event id without any randomness. */
const buildEventId = (source: JourneyEventSource, at: string, suffix: string): string =>
  `evt-${source.toLowerCase()}-${suffix}-${at}`;

export const createJourneyEvent = (args: {
  source: JourneyEventSource;
  labelEn: string;
  labelHi: string;
  status?: ApplicationStatus;
  at?: string;
  suffix?: string;
}): JourneyEvent => {
  const at = args.at || new Date().toISOString();
  return {
    id: buildEventId(args.source, at, args.suffix || args.status || 'event'),
    at,
    source: args.source,
    status: args.status,
    labelEn: args.labelEn,
    labelHi: args.labelHi,
  };
};

/** Appends an event, keeping the journey in chronological order. */
export const appendJourneyEvent = (
  application: TrackedApplication,
  event: JourneyEvent,
): TrackedApplication => {
  const journey = [...(application.journey || []), event].sort((a, b) =>
    a.at.localeCompare(b.at),
  );
  return { ...application, journey, updatedAt: event.at };
};

export const statusChangeEvent = (
  status: ApplicationStatus,
  at?: string,
): JourneyEvent =>
  createJourneyEvent({
    source: 'STATUS_CHANGE',
    status,
    labelEn: STATUS_LABELS[status].en,
    labelHi: STATUS_LABELS[status].hi,
    at,
  });

/**
 * Freezes the pathway state that justified starting this application.
 * Stored verbatim so the tracker never re-derives (and never drifts from)
 * what the citizen was actually shown.
 */
export const capturePathwaySnapshot = (
  pathway: SupportPathway,
  at: string = new Date().toISOString(),
): PathwaySnapshot => ({
  capturedAt: at,
  journeyStage: String(pathway.journeyStage),
  stageLabelEn: pathway.currentStageLabelEn,
  stageLabelHi: pathway.currentStageLabelHi,
  primaryNeed: pathway.primaryNeed ? String(pathway.primaryNeed) : undefined,
  readinessState: pathway.readiness.state,
  readinessLabelEn: pathway.readiness.labelEn,
  readinessLabelHi: pathway.readiness.labelHi,
  nextActionId: pathway.nextBestAction.id,
  nextActionTitleEn: pathway.nextBestAction.titleEn,
  nextActionTitleHi: pathway.nextBestAction.titleHi,
  preparationItemIds: pathway.preparationChecklist.items.map((item) => item.id),
});

/**
 * Starts (or enriches) a tracked application from the support pathway.
 * Existing progress is never reset: status, notes and applied date are kept.
 */
export const startApplicationFromPathway = (
  applications: TrackedApplication[],
  match: MatchResult,
  pathway: SupportPathway,
  at: string = new Date().toISOString(),
): TrackedApplication[] => {
  const schemeId = match.scheme.id;
  const snapshot = capturePathwaySnapshot(pathway, at);
  const existing = applications.find((application) => application.schemeId === schemeId);

  const startEvent = createJourneyEvent({
    source: 'PATHWAY_START',
    labelEn: `Started from support pathway — ${snapshot.nextActionTitleEn}`,
    labelHi: `सहायता मार्ग से शुरू — ${snapshot.nextActionTitleHi}`,
    at,
    suffix: schemeId,
  });

  if (!existing) {
    const base = createTrackedApplication(schemeId, match.scheme.name);
    const created: TrackedApplication = {
      ...base,
      createdAt: at,
      updatedAt: at,
      startedFromPathway: true,
      pathwaySnapshot: snapshot,
      journey: [statusChangeEvent('interested', at), startEvent].sort((a, b) =>
        a.at.localeCompare(b.at),
      ),
    };
    return upsertTrackedApplication(applications, created);
  }

  const enriched = appendJourneyEvent(
    {
      ...existing,
      startedFromPathway: true,
      pathwaySnapshot: snapshot,
    },
    startEvent,
  );
  return upsertTrackedApplication(applications, enriched);
};

/**
 * Records document progress on the journey without touching status.
 * Only called when the citizen explicitly ticks or unticks an item.
 */
export const recordDocumentProgressEvent = (
  applications: TrackedApplication[],
  schemeId: string,
  preparedCount: number,
  totalCount: number,
  at: string = new Date().toISOString(),
): TrackedApplication[] =>
  applications.map((application) => {
    if (application.schemeId !== schemeId) return application;
    return appendJourneyEvent(
      application,
      createJourneyEvent({
        source: 'DOCUMENT_PROGRESS',
        labelEn: `Preparation progress: ${preparedCount} of ${totalCount} items marked prepared`,
        labelHi: `तैयारी प्रगति: ${totalCount} में से ${preparedCount} मदें तैयार`,
        at,
        suffix: `${schemeId}-${preparedCount}`,
      }),
    );
  });

/**
 * Suggests the tracker status implied by preparation progress.
 * Returns null when nothing should change — the citizen stays in control,
 * and terminal states are never overwritten automatically.
 */
export const suggestStatusFromPreparation = (
  application: TrackedApplication,
  preparedCount: number,
  totalCount: number,
): ApplicationStatus | null => {
  if (totalCount === 0) return null;
  if (application.status !== 'interested') return null;
  return preparedCount >= totalCount ? 'docs-ready' : null;
};
