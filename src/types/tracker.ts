/**
 * Phase 1 — Application Tracker
 * Phase 4.3 — Application Journey (pathway wiring, follow-ups, freshness)
 *
 * Turns a saved scheme into something the citizen can actually follow through on.
 * Persisted locally; no server involved.
 */

export type ApplicationStatus =
  | 'interested'
  | 'docs-ready'
  | 'applied'
  | 'approved'
  | 'rejected';

/* ===================== PHASE 4.3 — APPLICATION JOURNEY ===================== */

/** What caused a journey event. Never inferred from government data. */
export type JourneyEventSource =
  | 'USER_ACTION'
  | 'PATHWAY_START'
  | 'STATUS_CHANGE'
  | 'DOCUMENT_PROGRESS';

export interface JourneyEvent {
  id: string;
  /** ISO timestamp recorded on the user's device. */
  at: string;
  source: JourneyEventSource;
  /** Status the application moved to, when the event was a status change. */
  status?: ApplicationStatus;
  labelEn: string;
  labelHi: string;
}

/**
 * Immutable snapshot of the Phase 4.2 pathway at the moment the citizen
 * started this application. Stored so the tracker can show what was
 * recommended without recomputing (and without drifting) later.
 */
export interface PathwaySnapshot {
  capturedAt: string;
  journeyStage: string;
  stageLabelEn: string;
  stageLabelHi: string;
  primaryNeed?: string;
  readinessState: string;
  readinessLabelEn: string;
  readinessLabelHi: string;
  nextActionId: string;
  nextActionTitleEn: string;
  nextActionTitleHi: string;
  /** Document ids from the Phase 4.2 preparation checklist. */
  preparationItemIds: string[];
}

/**
 * A follow-up the citizen set for themselves. This is NOT a government
 * deadline — the scheme dataset does not carry verified application windows,
 * so no deadline is ever fabricated.
 */
export interface FollowUpReminder {
  /** ISO date (YYYY-MM-DD). */
  dueOn: string;
  noteEn?: string;
  noteHi?: string;
  /** Set by the citizen when the follow-up has been dealt with. */
  completedOn?: string;
}

export interface TrackedApplication {
  schemeId: string;
  /** Denormalised so the tracker still renders if a scheme leaves the dataset. */
  schemeName: string;
  status: ApplicationStatus;
  /** Free-text citizen note: reference numbers, branch visited, officer name. */
  note?: string;
  /** ISO date (YYYY-MM-DD) the application was submitted. */
  appliedOn?: string;
  createdAt: string;
  updatedAt: string;

  /* Phase 4.3 additions — all optional so existing stored entries stay valid. */
  /** True when the entry was created from the Phase 4.2 support pathway. */
  startedFromPathway?: boolean;
  pathwaySnapshot?: PathwaySnapshot;
  journey?: JourneyEvent[];
  followUp?: FollowUpReminder;
}

/* ===================== PHASE 4.3 — DATA FRESHNESS ===================== */

/**
 * Derived purely from the scheme's own `lastVerifiedDate` / `isActive` data.
 * Never a statement about the scheme's own validity period.
 */
export type SchemeFreshnessState =
  | 'RECENTLY_VERIFIED'
  | 'VERIFICATION_AGEING'
  | 'VERIFICATION_STALE'
  | 'VERIFICATION_UNKNOWN'
  | 'MARKED_INACTIVE';

export interface SchemeFreshness {
  state: SchemeFreshnessState;
  /** Whole days since lastVerifiedDate; null when the date is missing/invalid. */
  ageInDays: number | null;
  lastVerifiedDate?: string;
  verificationStatus?: string;
  labelEn: string;
  labelHi: string;
  adviceEn: string;
  adviceHi: string;
  /** True when the citizen should re-check the official portal before relying on it. */
  shouldRecheckOfficialSource: boolean;
}

/** Follow-up urgency, computed against a caller-supplied "today". */
export type FollowUpState = 'NONE' | 'SCHEDULED' | 'DUE_TODAY' | 'OVERDUE' | 'COMPLETED';

export interface FollowUpStatus {
  state: FollowUpState;
  dueOn?: string;
  daysUntilDue: number | null;
  labelEn: string;
  labelHi: string;
}
