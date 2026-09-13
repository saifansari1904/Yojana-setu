import {
  CriterionEvaluationState,
  EligibilityClassification,
  MatchStatus,
  PrimaryGap,
  Scheme,
  SchemeFactorKey,
  SchemeRuleBreakdown,
  UserProfile,
} from '../../types';
import {
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_LABELS_HI,
  CATEGORY_LABELS,
  CATEGORY_LABELS_HI,
} from '../../constants/business';

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Checks which mandatory statutory criteria apply to a given scheme
 * and whether the user profile satisfies all of them.
 * Distinguishes confirmed blockers (MISMATCHED) from missing information (UNKNOWN).
 */
export function checkMandatoryCriteria(
  scheme: Scheme,
  profile: UserProfile,
  breakdown: SchemeRuleBreakdown[]
): {
  satisfied: boolean;
  failedMandatory: SchemeFactorKey[];
  confirmedBlockers: SchemeRuleBreakdown[];
  unknownMandatory: SchemeRuleBreakdown[];
} {
  // Determine mandatory criteria for this scheme
  let mandatoryKeys: SchemeFactorKey[] = scheme.mandatoryCriteria || [];

  if (mandatoryKeys.length === 0) {
    // Default sensible statutory rules:
    // 1. Regional restriction is always mandatory
    if (scheme.applicableStates.length > 0) {
      mandatoryKeys.push('state');
    }
    // 2. Strict category reservation (SC/ST only, Woman only, Minority only)
    if (scheme.isScStSpecific || scheme.isWomenSpecific || scheme.isMinoritySpecific) {
      if (!scheme.targetCategories.includes('General')) {
        mandatoryKeys.push('category');
      }
    }
    // 3. Strict income ceiling
    if (scheme.maxAnnualIncomeCap > 0) {
      mandatoryKeys.push('income');
    }
    // 4. Age limits
    mandatoryKeys.push('age');
  }

  const failedMandatory: SchemeFactorKey[] = [];
  const confirmedBlockers: SchemeRuleBreakdown[] = [];
  const unknownMandatory: SchemeRuleBreakdown[] = [];

  for (const key of mandatoryKeys) {
    const item = breakdown.find((b) => b.factorKey === key);
    if (item) {
      if (item.state === 'MISMATCHED' || !item.matched) {
        failedMandatory.push(key);
        confirmedBlockers.push(item);
      } else if (item.state === 'UNKNOWN') {
        unknownMandatory.push(item);
      }
    }
  }

  return {
    satisfied: failedMandatory.length === 0 && unknownMandatory.length === 0,
    failedMandatory,
    confirmedBlockers,
    unknownMandatory,
  };
}

/**
 * Determines exact statutory eligibility.
 * Answers: Can this user potentially qualify for this scheme?
 * High match score does NOT imply eligibility if critical mandatory factors fail.
 *
 * Categorizes outcome into:
 * - POTENTIALLY_ELIGIBLE: All mandatory criteria met, high score (>=75%), >=4 factors matched
 * - NEEDS_INFORMATION: Incomplete profile or unknown requirements without confirmed blocker
 * - BLOCKED: Conclusive statutory violation of mandatory criteria
 */
export function determineEligibility(
  scheme: Scheme,
  profile: UserProfile,
  breakdown: SchemeRuleBreakdown[],
  score: number
): {
  isEligible: boolean;
  mandatorySatisfied: boolean;
  failedMandatory: SchemeFactorKey[];
  classification: EligibilityClassification;
  confirmedBlockers: SchemeRuleBreakdown[];
  unknownCriteria: SchemeRuleBreakdown[];
} {
  const { satisfied: mandatorySatisfied, failedMandatory, confirmedBlockers, unknownMandatory } =
    checkMandatoryCriteria(scheme, profile, breakdown);

  const unknownCriteria = breakdown.filter((b) => b.state === 'UNKNOWN');
  const matchedCount = breakdown.filter((b) => b.matched).length;

  // Check if any mandatory criterion is a confirmed blocker
  const hasConfirmedBlocker = confirmedBlockers.length > 0;

  // To be legally eligible:
  // 1. All mandatory criteria must be satisfied
  // 2. At least 4 of the 5 criteria must match
  // 3. Match score must be >= 75%
  const isEligible = mandatorySatisfied && matchedCount >= 4 && score >= 75;

  let classification: EligibilityClassification;
  if (hasConfirmedBlocker) {
    classification = 'BLOCKED';
  } else if (unknownCriteria.length > 0 || unknownMandatory.length > 0) {
    classification = 'NEEDS_INFORMATION';
  } else if (isEligible) {
    classification = 'POTENTIALLY_ELIGIBLE';
  } else {
    // If not eligible due to overall score or non-mandatory factors, but no hard blocker:
    classification = 'NEEDS_INFORMATION';
  }

  return {
    isEligible,
    mandatorySatisfied,
    failedMandatory,
    classification,
    confirmedBlockers,
    unknownCriteria,
  };
}

/**
 * Calculates numerical distance or explicit explanation for the primary gap.
 */
export function identifyPrimaryGap(
  scheme: Scheme,
  profile: UserProfile,
  unmet: SchemeRuleBreakdown[],
  failedMandatory: SchemeFactorKey[],
  isHi: boolean
): PrimaryGap | undefined {
  if (unmet.length === 0) return undefined;

  // Prioritize failed mandatory criteria first, then by factor weight
  const priorityOrder: SchemeFactorKey[] = ['state', 'income', 'businessType', 'category', 'age'];

  let chosen: SchemeRuleBreakdown | undefined;
  for (const key of priorityOrder) {
    if (failedMandatory.includes(key)) {
      chosen = unmet.find((u) => u.factorKey === key);
      if (chosen) break;
    }
  }

  if (!chosen) {
    for (const key of priorityOrder) {
      chosen = unmet.find((u) => u.factorKey === key);
      if (chosen) break;
    }
  }

  if (!chosen) chosen = unmet[0];

  let gapDistance: string | undefined;
  let isActionable = false;

  if (chosen.factorKey === 'income' && scheme.maxAnnualIncomeCap > 0) {
    const diff = profile.annualIncome - scheme.maxAnnualIncomeCap;
    if (diff > 0) {
      gapDistance = isHi
        ? `सीमा से ${formatCurrency(diff)} अधिक`
        : `${formatCurrency(diff)} above ceiling`;
      isActionable = false;
    }
  } else if (chosen.factorKey === 'age') {
    if (profile.age < scheme.minAge) {
      const diff = scheme.minAge - profile.age;
      gapDistance = isHi
        ? `न्यूनतम आयु से ${diff} वर्ष कम`
        : `${diff} yr${diff > 1 ? 's' : ''} below minimum`;
    } else if (profile.age > scheme.maxAge) {
      const diff = profile.age - scheme.maxAge;
      gapDistance = isHi
        ? `अधिकतम आयु से ${diff} वर्ष अधिक`
        : `${diff} yr${diff > 1 ? 's' : ''} above maximum`;
    }
  } else if (chosen.factorKey === 'state') {
    gapDistance = isHi
      ? `केवल ${scheme.applicableStates.join(', ')} में मान्य`
      : `Restricted to ${scheme.applicableStates.join(', ')}`;
    isActionable = false;
  } else if (chosen.factorKey === 'businessType') {
    gapDistance = isHi ? `कार्यक्षेत्र भिन्नता` : `Different trade domain`;
  } else if (chosen.factorKey === 'category') {
    gapDistance = isHi ? `विशिष्ट आरक्षित वर्ग` : `Reserved target group`;
  }

  return {
    factorKey: chosen.factorKey,
    factorLabel: chosen.factorLabel,
    userValue: chosen.userValue,
    statutoryRequirement: chosen.statutoryRequirement,
    explanation: chosen.explanation,
    gapDistance,
    isActionable,
  };
}

/**
 * Classifies the scheme match status:
 * - 'eligible': Meets all mandatory rules, >=75% score, high factor alignment
 * - 'near-match': Close to qualifying (3+ factors satisfied or 1 primary gap)
 * - 'low-match': Mismatched across multiple domains
 */
export function classifyMatchStatus(
  isEligible: boolean,
  score: number,
  matchedCount: number,
  unmetCount: number,
  mandatorySatisfied: boolean
): MatchStatus {
  if (isEligible) {
    return 'eligible';
  }

  // Near match conditions:
  // 1. Matched count >= 3 AND score >= 50
  // 2. Or only 1-2 unmet criteria with score >= 50
  if (matchedCount >= 3 && score >= 50) {
    return 'near-match';
  }

  if (unmetCount === 1 && score >= 60) {
    return 'near-match';
  }

  return 'low-match';
}
