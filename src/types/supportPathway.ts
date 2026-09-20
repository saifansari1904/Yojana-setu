import type {
  BusinessJourneyStage,
  BusinessStageKey,
  BusinessRelevanceLevel,
  SupportNeedType,
} from './business';
import type { MatchStatus } from './matching';

// ==========================================
// PHASE 4.2 — SUPPORT AREA TAXONOMY
// ==========================================
/**
 * Phase 4.2 deliberately REUSES the Phase 4.1 `SupportNeedType` taxonomy as its
 * canonical support-area vocabulary instead of introducing a parallel enum.
 *
 * The Phase 4.2 brief listed candidate areas such as FUNDING, REGISTRATION,
 * DIGITALIZATION, INCUBATION, EXPORT and EMPLOYMENT. Each already has an
 * equivalent canonical value, so they are mapped rather than duplicated:
 *
 *   FUNDING            -> CAPITAL / CREDIT / SUBSIDY (financial instrument is explicit)
 *   REGISTRATION       -> BUSINESS_REGISTRATION
 *   COMPLIANCE         -> BUSINESS_REGISTRATION
 *   DIGITALIZATION     -> TECHNOLOGY
 *   INCUBATION         -> MENTORSHIP
 *   EXPORT             -> MARKET_ACCESS
 *   EMPLOYMENT         -> SKILL_DEVELOPMENT
 *   EXPANSION_FINANCE  -> CREDIT
 *   LARGER_FINANCE     -> CREDIT
 *   PROJECT_PREPARATION-> MENTORSHIP (DPR advisory)
 *   VALIDATION         -> MENTORSHIP
 *
 * This keeps one vocabulary across relevance scoring, the support stack and the
 * scheme-need mapping in `businessRelevanceEngine`.
 */
export type SupportArea = SupportNeedType;

/** Why a support area entered the pathway. Ordered by strength of evidence. */
export type SupportAreaSource =
  | 'PRIMARY_NEED'
  | 'DERIVED_FROM_PRIMARY_NEED'
  | 'SECONDARY_NEED'
  | 'BUSINESS_STAGE';

export interface RecommendedSupportArea {
  area: SupportArea;
  /** 1 = highest priority. Deterministic. */
  rank: number;
  source: SupportAreaSource;
  labelKey?: string;
  reasonKey?: string;
  /** @deprecated Compatibility snapshots for existing reports. */
  labelEn: string;
  labelHi: string;
  /** Data-derived justification, never generative. */
  reasonEn: string;
  reasonHi: string;
}

// ==========================================
// PATHWAY ACTIONS
// ==========================================
export type PathwayActionStatus =
  | 'COMPLETED'
  | 'READY'
  | 'RECOMMENDED'
  | 'BLOCKED'
  | 'NEEDS_INFORMATION'
  | 'NOT_RELEVANT';

export type PathwayActionType =
  | 'COMPLETE_PROFILE'
  | 'PROVIDE_MISSING_INFORMATION'
  | 'PREPARE_DOCUMENTS'
  | 'COMPLETE_REGISTRATION'
  | 'PREPARE_PROJECT_REPORT'
  | 'REVIEW_SCHEME_ELIGIBILITY'
  | 'CHECK_FINANCIAL_FIT'
  | 'COMPARE_SCHEMES'
  | 'OPEN_OFFICIAL_PORTAL'
  | 'SAVE_SCHEME';

/** Where the CTA leads. Must always map to an action that already exists in the app. */
export type PathwayActionTarget =
  | 'form'
  | 'checklist'
  | 'details'
  | 'alternatives'
  | 'compare'
  | 'portal'
  | 'save';

export interface PathwayAction {
  id: string;
  actionType: PathwayActionType;
  titleKey?: string;
  descriptionKey?: string;
  reasonKey?: string;
  ctaKey?: string;
  /** @deprecated Compatibility snapshots for tracker history and tests. */
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  /** Support area this action serves, when one applies. */
  supportArea?: SupportArea;
  status: PathwayActionStatus;
  priority: number; // 1 = act on this first
  /** Explainability: built only from structured profile/scheme data. */
  reasonEn: string;
  reasonHi: string;
  relatedSchemeIds: string[];
  /** Action ids that must be resolved before this one becomes actionable. */
  requiredBefore: string[];
  /** True only when the action is the real government application step. */
  officialAction: boolean;
  ctaLabelEn: string;
  ctaLabelHi: string;
  actionTarget: PathwayActionTarget;
  actionUrl?: string;
}

// ==========================================
// SUPPORT STACK
// ==========================================
/** Provenance carried through from Phase 2.5 scheme data. Never synthesised. */
interface SupportStackProvenance {
  source: string;
  sourceUrl?: string;
  lastVerified?: string;
  verificationStatus?: string;
}

export interface SupportStackScheme {
  schemeId: string;
  schemeName: string;
  shortCode?: string;
  matchPercentage: number;
  matchStatus: MatchStatus;
  isEligible: boolean;
  relevanceLevel: BusinessRelevanceLevel;
  /** Bilingual, data-derived note on how this scheme relates to the area. */
  relationNoteEn: string;
  relationNoteHi: string;
  provenance: SupportStackProvenance;
}

export interface SupportStackGroup {
  area: SupportArea;
  labelEn: string;
  labelHi: string;
  iconName: string;
  rank: number;
  source: SupportAreaSource;
  schemes: SupportStackScheme[];
  /** Set when no verified scheme in the dataset addresses this area. */
  hasNoVerifiedSupport: boolean;
  noticeEn?: string;
  noticeHi?: string;
}

// ==========================================
// READINESS
// ==========================================
export type ApplicationReadinessState =
  | 'NOT_READY'
  | 'PARTIALLY_READY'
  | 'READY_TO_REVIEW'
  | 'READY_TO_APPLY';

/** Tri-state check so "unanswered" is never reported as "failed". */
type ReadinessCheckState = 'SATISFIED' | 'PENDING' | 'UNKNOWN' | 'NOT_APPLICABLE';

export interface ReadinessCheck {
  key: 'PROFILE' | 'ELIGIBILITY' | 'DOCUMENTS' | 'FINANCIAL_FIT';
  state: ReadinessCheckState;
  labelEn: string;
  labelHi: string;
  detailEn: string;
  detailHi: string;
}

export interface ApplicationReadiness {
  state: ApplicationReadinessState;
  labelEn: string;
  labelHi: string;
  summaryEn: string;
  summaryHi: string;
  checks: ReadinessCheck[];
}

// ==========================================
// PREPARATION CHECKLIST
// ==========================================
/**
 * `NOT_PREPARED` is only used where the user actively left an item unticked in
 * a checklist they have engaged with. An item the user never answered is
 * `UNKNOWN`, never "missing".
 */
export type PreparationItemState =
  | 'PREPARED'
  | 'NOT_PREPARED'
  | 'UNKNOWN'
  | 'NOT_REQUIRED';

export interface PreparationItem {
  id: string;
  labelEn: string;
  labelHi: string;
  state: PreparationItemState;
  /** True when the requirement comes from verified scheme data. */
  fromSchemeData: boolean;
  isMandatory?: boolean;
}

export interface PreparationChecklistResult {
  schemeId?: string;
  items: PreparationItem[];
  preparedCount: number;
  totalCount: number;
  unknownCount: number;
  /** True when the scheme data does not enumerate document requirements. */
  requirementsUnverified: boolean;
  summaryEn: string;
  summaryHi: string;
}

// ==========================================
// SUPPORT PATHWAY
// ==========================================
export interface SupportPathway {
  currentStage: BusinessStageKey;
  currentStageLabelEn: string;
  currentStageLabelHi: string;
  journeyStage: BusinessJourneyStage;
  stageSource: 'EXPLICIT' | 'INFERRED' | 'UNKNOWN';
  primaryNeed?: SupportArea;
  secondaryNeeds: SupportArea[];
  recommendedSupportAreas: RecommendedSupportArea[];
  supportStack: SupportStackGroup[];
  recommendedSchemeIds: string[];
  nextBestAction: PathwayAction;
  secondaryActions: PathwayAction[];
  blockedActions: PathwayAction[];
  completedActions: PathwayAction[];
  readiness: ApplicationReadiness;
  /** Scheme-scoped preparation checklist. Empty + unverified when no scheme is in focus. */
  preparationChecklist: PreparationChecklistResult;
  funding: {
    totalProjectCost: number;
    existingInvestment: number;
    fundingGap: number;
    hasFundingDetails: boolean;
    /** Compliance guard: the gap is the entrepreneur's requirement, not an entitlement. */
    disclaimerEn: string;
    disclaimerHi: string;
  };
  /** Shown whenever more than one support area is present. */
  combinabilityNoticeEn: string;
  combinabilityNoticeHi: string;
}
