/**
 * Phase 1 — Application Tracker
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
}
