import {
  MatchResult,
  PrimaryGap,
  SchemeRuleBreakdown,
  UserProfile,
  EligibilityClassification,
} from '../../types';
import type { Language } from '../../i18n/types';

interface PrioritizedGap {
  priority: 1 | 2 | 3 | 4 | 5;
  type: 'BLOCKER' | 'MISSING_INFO' | 'MAJOR_MISMATCH' | 'MINOR_MISMATCH' | 'ADVISORY';
  factorKey: string;
  factorLabel: string;
  userValue: string;
  statutoryRequirement: string;
  explanation: string;
  gapDistance?: string;
  isActionable: boolean;
}

interface MatchExplanation {
  overallStatus: EligibilityClassification;
  plainLanguageSummary: string;
  strongestFactors: SchemeRuleBreakdown[];
  primaryGap?: PrimaryGap;
  prioritizedGaps: PrioritizedGap[];
  blockers: SchemeRuleBreakdown[];
  unknownRequirements: SchemeRuleBreakdown[];
  recommendationReason: string;
}

import { MANDATORY_REQUIREMENT_LABELS, RECOMMENDATION_TEMPLATES } from '../../i18n/matchExplanationI18n';

/**
 * Builds a structured, explainable breakdown from an authoritative MatchResult.
 * Ensures complete mathematical consistency between score, criteria states, and summary.
 */
export function buildMatchExplanation(
  matchResult: MatchResult,
  profile: UserProfile,
  lang: Language = 'en'
): MatchExplanation {
  const l: Language = (lang in RECOMMENDATION_TEMPLATES.NEAR_MATCH) ? lang : 'en';
  const { breakdown, matchPercentage, isEligible, primaryGap } = matchResult;

  // 1. Classify factors into Matched, Unknown, and Blockers
  const strongestFactors = (matchResult.strongestFactors && matchResult.strongestFactors.length > 0)
    ? matchResult.strongestFactors
    : breakdown
        .filter((b) => b.matched || b.state === 'MATCHED')
        .sort((a, b) => (b.scoreContribution || 0) - (a.scoreContribution || 0));

  const blockers = (matchResult.confirmedBlockers && matchResult.confirmedBlockers.length > 0)
    ? matchResult.confirmedBlockers
    : breakdown.filter((b) => b.state === 'MISMATCHED' || (!b.matched && b.severity === 'critical'));

  const unknownRequirements = (matchResult.unknownCriteria && matchResult.unknownCriteria.length > 0)
    ? matchResult.unknownCriteria
    : breakdown.filter((b) => b.state === 'UNKNOWN');

  // 2. Prioritized gaps ranking (1: Blocker, 2: Missing mandatory info, 3: Major mismatch, 4: Minor mismatch, 5: Advisory)
  const prioritizedGaps: PrioritizedGap[] = [];

  // Group 1: Confirmed Mandatory Blockers
  blockers.forEach((b) => {
    prioritizedGaps.push({
      priority: 1,
      type: 'BLOCKER',
      factorKey: b.factorKey,
      factorLabel: b.factorLabel,
      userValue: b.userValue,
      statutoryRequirement: b.statutoryRequirement,
      explanation: b.explanation,
      isActionable: false,
    });
  });

  // Group 2: Unknown requirements (Missing Profile Info)
  unknownRequirements.forEach((u) => {
    prioritizedGaps.push({
      priority: 2,
      type: 'MISSING_INFO',
      factorKey: u.factorKey,
      factorLabel: u.factorLabel,
      userValue: u.userValue,
      statutoryRequirement: u.statutoryRequirement,
      explanation: u.explanation,
      isActionable: true,
    });
  });

  // Group 3 & 4: Other unmet criteria not already included in blockers
  breakdown
    .filter((b) => !b.matched && !blockers.some((blk) => blk.factorKey === b.factorKey))
    .forEach((um) => {
      const isMajor = (um.maxContribution || 0) >= 20;
      prioritizedGaps.push({
        priority: isMajor ? 3 : 4,
        type: isMajor ? 'MAJOR_MISMATCH' : 'MINOR_MISMATCH',
        factorKey: um.factorKey,
        factorLabel: um.factorLabel,
        userValue: um.userValue,
        statutoryRequirement: um.statutoryRequirement,
        explanation: um.explanation,
        gapDistance: primaryGap?.factorKey === um.factorKey ? primaryGap.gapDistance : undefined,
        isActionable: um.factorKey === 'income' || um.factorKey === 'age' ? false : true,
      });
    });

  // Sort by priority ascending (1 highest)
  prioritizedGaps.sort((a, b) => a.priority - b.priority);

  // 3. Calibrated plain-language summary without false certainty
  const plainLanguageSummary = matchResult.plainLanguageExplanation;
  const overallStatus = matchResult.eligibilityClassification ||
    (blockers.length > 0 ? 'BLOCKED' : unknownRequirements.length > 0 ? 'NEEDS_INFORMATION' : isEligible ? 'POTENTIALLY_ELIGIBLE' : 'NEEDS_INFORMATION');

  let recommendationReason = '';
  if (overallStatus === 'POTENTIALLY_ELIGIBLE') {
    recommendationReason = RECOMMENDATION_TEMPLATES.POTENTIALLY_ELIGIBLE[l](
      profile.category,
      profile.businessType
    );
  } else if (overallStatus === 'BLOCKED') {
    const firstBlocker = blockers[0];
    const defaultLabel = MANDATORY_REQUIREMENT_LABELS[l] || MANDATORY_REQUIREMENT_LABELS.en;
    recommendationReason = RECOMMENDATION_TEMPLATES.BLOCKED[l](
      firstBlocker ? firstBlocker.factorLabel : defaultLabel,
      firstBlocker ? firstBlocker.userValue : '',
      firstBlocker ? firstBlocker.statutoryRequirement : ''
    );
  } else {
    recommendationReason = RECOMMENDATION_TEMPLATES.NEAR_MATCH[l](matchPercentage);
  }

  return {
    overallStatus,
    plainLanguageSummary,
    strongestFactors,
    primaryGap,
    prioritizedGaps,
    blockers,
    unknownRequirements,
    recommendationReason,
  };
}
