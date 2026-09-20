/**
 * Phase 5 — Guided Application & Preparation Workspace Types
 *
 * Models the citizen's journey from "Here is a scheme that matches you" to
 * "Here is everything you need to understand, prepare, and review before
 * applying through the official government channel."
 *
 * Core Principles:
 *  1. Yojana Setu is an advisory preparation workspace, NOT an application processor.
 *  2. No government requirements or deadlines are fabricated.
 *  3. Applications are only recorded as "applied" when explicitly confirmed by the citizen.
 */

import type { MatchResult } from './matching';
import type { TrackedApplication } from './tracker';

export type PreparationStepKey =
  | 'ELIGIBILITY_AUDIT'
  | 'DOCUMENT_CHECKLIST'
  | 'FINANCIAL_ALIGNMENT'
  | 'SUBMISSION_PROCESS'
  | 'PORTAL_HANDOFF';

type PreparationStepStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'NEEDS_ATTENTION'
  | 'PENDING';

type WorkspaceReadinessState =
  | 'NOT_READY'
  | 'PARTIALLY_READY'
  | 'READY_TO_REVIEW'
  | 'READY_TO_APPLY';

type ReadinessPillarKey =
  | 'eligibility'
  | 'documents'
  | 'financial'
  | 'process';

export interface WorkspaceReadinessPillar {
  key: ReadinessPillarKey;
  labelKey?: string;
  summaryKey?: string;
  detailKey?: string;
  /** @deprecated Compatibility display snapshots. */
  labelEn: string;
  labelHi: string;
  /** Percentage score 0-100 */
  score: number;
  state: 'SATISFIED' | 'PARTIAL' | 'PENDING' | 'BLOCKED' | 'UNKNOWN';
  summaryEn: string;
  summaryHi: string;
  detailEn: string;
  detailHi: string;
}

export interface WorkspaceReadiness {
  /** Weighted aggregate score 0-100 */
  overallScore: number;
  state: WorkspaceReadinessState;
  labelKey?: string;
  summaryKey?: string;
  /** @deprecated Compatibility display snapshots. */
  labelEn: string;
  labelHi: string;
  summaryEn: string;
  summaryHi: string;
  pillars: WorkspaceReadinessPillar[];
  /** Whether citizen has resolved statutory blockers to proceed with handoff */
  canProceedToOfficialPortal: boolean;
}

export interface PreparationStep {
  key: PreparationStepKey;
  labelKey?: string;
  descriptionKey?: string;
  /** @deprecated Compatibility display snapshots. */
  labelEn: string;
  labelHi: string;
  descriptionEn: string;
  descriptionHi: string;
  status: PreparationStepStatus;
  isMandatory: boolean;
}

export interface StepInstruction {
  stepNumber: number;
  titleKey?: string;
  descriptionKey?: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  isMandatory: boolean;
  agency?: string;
}

export interface OfficialApplicationProcess {
  applicationMode: string;
  sponsoringMinistry: string;
  implementingAgency?: string;
  officialPortalUrl: string;
  isVerifiedGovtDomain: boolean;
  portalDomain: string;
  instructions: StepInstruction[];
  nodalOffice?: string;
  helpline?: string;
}

export interface ApplicationWorkspace {
  schemeId: string;
  schemeName: string;
  shortCode: string;
  sponsoringMinistry: string;
  implementingAgency?: string;
  officialPortalUrl: string;
  applicationMode: string;
  matchResult: MatchResult;
  readiness: WorkspaceReadiness;
  steps: PreparationStep[];
  preparedDocumentIds: string[];
  totalDocumentsCount: number;
  officialProcess: OfficialApplicationProcess;
  trackedApplication?: TrackedApplication;
}

export interface CitizenSubmissionConfirmation {
  schemeId: string;
  /** ISO date string YYYY-MM-DD */
  submittedAt: string;
  applicationReferenceNumber?: string;
  portalUsed: string;
  submissionNotes?: string;
  confirmationDisclaimerAccepted: boolean;
}
