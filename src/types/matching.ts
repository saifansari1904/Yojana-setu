import type { Scheme, SchemeFactorKey } from './scheme';
import type { SchemeBusinessRelevance } from './business';

export type MatchStatus = 'eligible' | 'near-match' | 'low-match';

/**
 * Three distinct evaluation states for every evaluated criterion:
 * - MATCHED: User profile satisfies the statutory criterion
 * - MISMATCHED: User profile conclusively contradicts or fails the requirement
 * - UNKNOWN: Incomplete or unprovided profile info prevents conclusive verification
 */
export type CriterionEvaluationState = 'MATCHED' | 'MISMATCHED' | 'UNKNOWN';

/** Stable domain reason identifiers; presentation resolves these through i18n. */
export type MatchReasonCode =
  | 'CATEGORY_MATCHED' | 'CATEGORY_UNKNOWN' | 'CATEGORY_MISMATCHED'
  | 'BUSINESS_TYPE_MATCHED' | 'BUSINESS_TYPE_UNKNOWN' | 'BUSINESS_TYPE_MISMATCHED'
  | 'INCOME_NOT_CAPPED' | 'INCOME_WITHIN_LIMIT' | 'INCOME_UNKNOWN' | 'INCOME_ABOVE_LIMIT'
  | 'AGE_WITHIN_LIMIT' | 'AGE_UNKNOWN' | 'AGE_OUTSIDE_LIMIT'
  | 'STATE_NATIONAL_SCHEME' | 'STATE_MATCHED' | 'STATE_UNKNOWN' | 'STATE_MISMATCHED';

/**
 * Standardized eligibility classification:
 * - POTENTIALLY_ELIGIBLE: All known mandatory criteria satisfied, score >= 75
 * - NEEDS_INFORMATION: Missing data without confirmed blockers
 * - BLOCKED: Conclusive statutory blocker identified
 */
export type EligibilityClassification = 'POTENTIALLY_ELIGIBLE' | 'NEEDS_INFORMATION' | 'BLOCKED';

export interface SchemeRuleBreakdown {
  factorKey: SchemeFactorKey;
  factorLabel: string;
  userValue: string;
  statutoryRequirement: string;
  matched: boolean; // Backward-compatible: true if state === 'MATCHED'
  state: CriterionEvaluationState;
  /** Semantic explanation code; explanation remains a compatibility presentation field. */
  reasonCode?: MatchReasonCode;
  explanation: string;
  severity?: 'critical' | 'moderate' | 'info';
  scoreContribution: number;
  maxContribution: number;
  isMandatory?: boolean;
}

export type PrimaryGapCode =
  | 'INCOME_ABOVE_LIMIT'
  | 'AGE_BELOW_MINIMUM'
  | 'AGE_ABOVE_MAXIMUM'
  | 'STATE_NOT_SUPPORTED'
  | 'BUSINESS_TYPE_MISMATCH'
  | 'CATEGORY_MISMATCH';

export interface PrimaryGap {
  /** Stable semantic reason identifier; UI resolves the wording. */
  code?: PrimaryGapCode;
  /** Numeric/string distance used by the presentation adapter. */
  gapValue?: number | string;
  factorKey: SchemeFactorKey;
  factorLabel: string;
  userValue: string;
  statutoryRequirement: string;
  explanation: string;
  gapDistance?: string;
  isActionable?: boolean;
}

export interface AlternativeRecommendation {
  scheme: Scheme;
  matchPercentage: number;
  matchStatus: MatchStatus;
  reason: string;
}

export interface MatchResult {
  scheme: Scheme;
  matchPercentage: number;
  breakdown: SchemeRuleBreakdown[];
  /** Stable reason identifiers used by presentation adapters. */
  reasonCodes: MatchReasonCode[];
  /** Compatibility presentation field; new UI code should resolve reasonCodes. */
  plainLanguageExplanation: string;
  isEligible: boolean;
  matchStatus: MatchStatus;
  mandatoryCriteriaSatisfied: boolean;
  gapSummary?: string;
  matchedCount: number;
  totalFactorsCount: number;
  unmetCriteria: SchemeRuleBreakdown[];
  matchedCriteria: SchemeRuleBreakdown[];
  primaryGap?: PrimaryGap;
  recommendedAlternatives?: AlternativeRecommendation[];

  // Phase 3.1 Match Audit & Decision Layer extensions
  eligibilityClassification?: EligibilityClassification;
  confirmedBlockers?: SchemeRuleBreakdown[];
  unknownCriteria?: SchemeRuleBreakdown[];
  strongestFactors?: SchemeRuleBreakdown[];
  auditBreakdown?: {
    totalWeightEvaluated: number;
    totalWeightEarned: number;
    factorAudits: Array<{
      factorKey: SchemeFactorKey;
      factorLabel: string;
      weightAssigned: number;
      weightEarned: number;
      state: CriterionEvaluationState;
      userValue: string;
      requirement: string;
    }>;
  };
  mathematicalIntegrityVerified?: boolean;

  // Phase 4.1 Business Need Relevance (Completely separate from statutory match score)
  businessRelevance?: SchemeBusinessRelevance;

  // Compatibility fields
  mandatorySatisfied?: boolean;
  matchedCriteriaCount?: number;
  totalCriteriaCount?: number;
  factorAudits?: Array<{
    factorKey: SchemeFactorKey;
    factorLabel: string;
    weightAssigned: number;
    pointsAwarded: number;
    isMandatoryMet: boolean;
    rawUserMetric: string;
    ruleRequirement: string;
  }>;
}

export type FundingFitStatus =
  | 'UNSPECIFIED_IN_SCHEME'
  | 'NOT_SPECIFIED_BY_USER'
  | 'WITHIN_RANGE'
  | 'ABOVE_RANGE'
  | 'BELOW_RANGE';

export interface FundingFitAnalysis {
  fitStatus: FundingFitStatus;
  statedRange: string;
  userRequirement?: number;
  schemeMinAmount: number;
  schemeMaxAmount: number;
  difference?: number;
  explanation: string;
  estimatedSubsidy?: number;
  subsidyExplanation?: string;
  subsidyRatePercent?: number;
}
