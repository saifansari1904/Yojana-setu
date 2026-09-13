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
  explanation: string;
  severity?: 'critical' | 'moderate' | 'info';
  scoreContribution: number;
  maxContribution: number;
  isMandatory?: boolean;
}

export interface PrimaryGap {
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
}
