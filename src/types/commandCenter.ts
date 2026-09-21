/**
 * Phase 6 — Intelligent Entrepreneur Command Center Types
 *
 * Models the executive decision layer connecting Business Profile,
 * Matching Engine, Application Journey, Support Pathway, and Preparation Workspace.
 *
 * Strict Principles:
 * 1. Zero fake metrics: All numbers derived from actual application/profile state.
 * 2. Deterministic priority: Rigorous rules dictate what to focus on right now.
 * 3. Preserve Phase 3.1 & 4.3 authority: Does not tamper with match or tracker status.
 */

import type { MatchResult } from './matching';
import type { TrackedApplication } from './tracker';

export type ActionPriorityCategory =
  | 'ACTION_NOW'
  | 'HIGH_PRIORITY'
  | 'REVIEW'
  | 'INFORMATION_NEEDED'
  | 'LOW_PRIORITY';

export type OpportunityLifecycleState =
  | 'DISCOVERED'
  | 'SAVED'
  | 'REVIEWED'
  | 'PREPARING'
  | 'READY_TO_APPLY'
  | 'APPLIED'
  | 'TRACKING'
  | 'COMPLETED';

export interface PriorityOpportunity {
  schemeId: string;
  matchResult: MatchResult;
  priorityCategory: ActionPriorityCategory;
  lifecycleState: OpportunityLifecycleState;
  priorityScore: number;
  whyThisScheme: {
    headlineEn: string;
    headlineHi: string;
    reasonsEn: string[];
    reasonsHi: string[];
    benefitSnippetEn: string;
    benefitSnippetHi: string;
  };
  whyNow: {
    reasonEn: string;
    reasonHi: string;
    urgencyLevel: 'high' | 'medium' | 'normal';
  };
  nextAction: {
    titleEn: string;
    titleHi: string;
    descriptionEn: string;
    descriptionHi: string;
    ctaLabelEn: string;
    ctaLabelHi: string;
    actionType: 'workspace' | 'tracker' | 'eligibility' | 'review';
  };
  trackedApp?: TrackedApplication;
}

export interface BusinessStageInsights {
  stage: string;
  labelEn: string;
  labelHi: string;
  completedStages: string[];
  upcomingStages: string[];
  currentFocusCount: number;
  currentFocusBenefitCount: number;
}

export interface BusinessNeedInsights {
  primaryNeedEn: string;
  primaryNeedHi: string;
  topSectors: string[];
}

export interface NextBestAction {
  titleEn: string;
  titleHi: string;
  reasonEn: string;
  reasonHi: string;
  targetSchemeId?: string;
  targetMatch?: MatchResult;
  actionType: 'start_profile' | 'complete_profile' | 'open_workspace' | 'track_status' | 'view_matches';
  ctaLabelEn: string;
  ctaLabelHi: string;
}

export interface ApplicationDashboardSummary {
  totalCount: number;
  readyToApplyCount: number;
  preparingCount: number;
  appliedCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface DocumentDashboardSummary {
  totalUniqueMandatory: number;
  preparedCount: number;
  pendingCount: number;
  verifiedDocumentTypes: string[];
}

export interface SupportCategorySummary {
  id: string;
  nameEn: string;
  nameHi: string;
  count: number;
  active: boolean;
  iconName: string;
}

export interface SupportDashboardSummary {
  totalIdentifiedSchemes: number;
  categories: SupportCategorySummary[];
}

export interface FollowUpItem {
  id: string;
  schemeId: string;
  schemeName: string;
  note: string;
  reminderDate?: string;
  tone: 'urgent' | 'caution' | 'neutral';
  match?: MatchResult;
}

export interface FollowUpDashboardSummary {
  pendingRemindersCount: number;
  upcomingActionItems: FollowUpItem[];
}

export interface TrustDashboardSummary {
  totalMatchesConsidered: number;
  verifiedOfficialPortalsCount: number;
  highProvenanceCount: number;
  lastAuditedDate?: string;
}

export interface ProfileCompletenessSummary {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
}

export interface CommandCenterInsights {
  currentBusinessStage: BusinessStageInsights;
  currentBusinessNeed: BusinessNeedInsights;
  nextBestAction: NextBestAction;
  priorityOpportunities: PriorityOpportunity[];
  applicationSummary: ApplicationDashboardSummary;
  documentSummary: DocumentDashboardSummary;
  supportSummary: SupportDashboardSummary;
  followUpSummary: FollowUpDashboardSummary;
  trustSummary: TrustDashboardSummary;
  profileCompleteness: ProfileCompletenessSummary;
}
