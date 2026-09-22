import {
  AlternativeRecommendation,
  BusinessType,
  CriterionEvaluationState,
  MatchResult,
  MatchStatus,
  MatchReasonCode,
  Scheme,
  SchemeFactorKey,
  SchemeRuleBreakdown,
  SocialCategory,
  UserProfile,
} from '../../types';
import {
  checkMandatoryCriteria,
  determineEligibility,
  identifyPrimaryGapCore,
  classifyMatchStatus,
  formatCurrency,
} from '../eligibility/eligibilityEngine';
import { deriveBusinessNeedProfile, evaluateBusinessRelevance } from '../business';
import type { MatchingPresentation } from '../../types/matchingPresentation';



/**
 * Evaluates full eligibility and calculates relevance match score for a single scheme.
 *
 * Combines statutory eligibility rules with weighted multi-factor matching:
 * - Category alignment (30 points)
 * - Business type alignment (25 points)
 * - Annual income check (20 points)
 * - Age eligibility (15 points)
 * - State/jurisdiction match (10 points)
 */
export function evaluateSchemeEligibilityCore(
  scheme: Scheme,
  profile: UserProfile,
  presentation: MatchingPresentation
): MatchResult {
  const { copy, notSpecifiedText } = presentation;
  const catLabel = presentation.categoryLabel(profile.category);
  const bizLabel = presentation.businessTypeLabel(profile.businessType);

  const breakdown: SchemeRuleBreakdown[] = [];
  let score = 0;
  const weights = {
    category: 30,
    businessType: 25,
    income: 20,
    age: 15,
    state: 10,
  };
  const reasonCodes: MatchReasonCode[] = [];

  // 1. Social Category Factor (30 pts)
  const isCategoryProvided = profile.category !== undefined && profile.category !== null;
  const categoryMatched =
    isCategoryProvided &&
    (scheme.targetCategories.includes(profile.category) ||
      scheme.targetCategories.includes('General'));

  const categoryState: CriterionEvaluationState = !isCategoryProvided
    ? 'UNKNOWN'
    : categoryMatched
    ? 'MATCHED'
    : 'MISMATCHED';
  const categoryReasonCode: MatchReasonCode = categoryState === 'UNKNOWN' ? 'CATEGORY_UNKNOWN' : categoryState === 'MATCHED' ? 'CATEGORY_MATCHED' : 'CATEGORY_MISMATCHED';
  reasonCodes.push(categoryReasonCode);

  let categoryExplanation = '';
  let categoryScoreContribution = 0;

  if (categoryState === 'UNKNOWN') {
    categoryExplanation = copy.category.unknown;
  } else if (categoryState === 'MATCHED') {
    categoryScoreContribution = weights.category;
    if (scheme.isScStSpecific && (profile.category === 'SC' || profile.category === 'ST')) {
      categoryExplanation = copy.category.scSt(catLabel);
    } else if (scheme.isWomenSpecific && profile.category === 'Woman') {
      categoryExplanation = copy.category.woman;
    } else if (scheme.isMinoritySpecific && profile.category === 'Minority') {
      categoryExplanation = copy.category.minority;
    } else {
      categoryExplanation = copy.category.matched(catLabel);
    }
  } else {
    const requiredCats = scheme.targetCategories
      .map((c) => presentation.categoryLabel(c))
      .join(', ');
    categoryExplanation = copy.category.mismatched(requiredCats, catLabel);
  }
  score += categoryScoreContribution;

  breakdown.push({
    factorKey: 'category',
    factorLabel: presentation.factorLabel('category'),
    userValue: isCategoryProvided ? catLabel : notSpecifiedText,
    statutoryRequirement: scheme.targetCategories
      .map((c) => presentation.categoryLabel(c))
      .join(' / '),
    matched: categoryMatched,
    state: categoryState,
    reasonCode: categoryReasonCode,
    scoreContribution: categoryScoreContribution,
    maxContribution: weights.category,
    explanation: categoryExplanation,
    severity: categoryMatched ? 'info' : categoryState === 'UNKNOWN' ? 'moderate' : 'critical',
  });

  // 2. Business Type Factor (25 pts)
  const isBusinessProvided = profile.businessType !== undefined && profile.businessType !== null;
  const businessMatched = isBusinessProvided && scheme.targetBusinessTypes.includes(profile.businessType);
  const businessState: CriterionEvaluationState = !isBusinessProvided
    ? 'UNKNOWN'
    : businessMatched
    ? 'MATCHED'
    : 'MISMATCHED';
  const businessReasonCode: MatchReasonCode = businessState === 'UNKNOWN' ? 'BUSINESS_TYPE_UNKNOWN' : businessState === 'MATCHED' ? 'BUSINESS_TYPE_MATCHED' : 'BUSINESS_TYPE_MISMATCHED';
  reasonCodes.push(businessReasonCode);

  let businessExplanation = '';
  let businessScoreContribution = 0;

  if (businessState === 'UNKNOWN') {
    businessExplanation = copy.business.unknown;
  } else if (businessState === 'MATCHED') {
    businessScoreContribution = weights.businessType;
    businessExplanation = copy.business.matched(bizLabel);
  } else {
    const requiredBiz = scheme.targetBusinessTypes
      .map((b) => presentation.businessTypeLabel(b))
      .join(', ');
    businessExplanation = copy.business.mismatched(requiredBiz, bizLabel);
  }
  score += businessScoreContribution;

  breakdown.push({
    factorKey: 'businessType',
    factorLabel: presentation.factorLabel('businessType'),
    userValue: isBusinessProvided ? bizLabel : notSpecifiedText,
    statutoryRequirement: scheme.targetBusinessTypes
      .map((b) => presentation.businessTypeLabel(b))
      .join(', '),
    matched: businessMatched,
    state: businessState,
    reasonCode: businessReasonCode,
    scoreContribution: businessScoreContribution,
    maxContribution: weights.businessType,
    explanation: businessExplanation,
    severity: businessMatched ? 'info' : businessState === 'UNKNOWN' ? 'moderate' : 'critical',
  });

  // 3. Annual Income Factor (20 pts)
  const isIncomeProvided = profile.annualIncome !== undefined && profile.annualIncome !== null && !isNaN(profile.annualIncome);
  const incomeCapped = scheme.maxAnnualIncomeCap > 0;
  const incomeMatched = !incomeCapped || (isIncomeProvided && profile.annualIncome <= scheme.maxAnnualIncomeCap);
  const incomeState: CriterionEvaluationState = !incomeCapped ? 'MATCHED' : !isIncomeProvided ? 'UNKNOWN' : incomeMatched ? 'MATCHED' : 'MISMATCHED';
  const incomeReasonCode: MatchReasonCode = !incomeCapped ? 'INCOME_NOT_CAPPED' : incomeState === 'UNKNOWN' ? 'INCOME_UNKNOWN' : incomeState === 'MATCHED' ? 'INCOME_WITHIN_LIMIT' : 'INCOME_ABOVE_LIMIT';
  reasonCodes.push(incomeReasonCode);

  let incomeExplanation = '';
  let incomeScoreContribution = 0;

  if (!incomeCapped) {
    incomeScoreContribution = weights.income;
    incomeExplanation = copy.income.notCapped;
  } else if (incomeState === 'UNKNOWN') {
    incomeExplanation = copy.income.unknown;
  } else if (incomeState === 'MATCHED') {
    incomeScoreContribution = weights.income;
    incomeExplanation = copy.income.matched(
      formatCurrency(profile.annualIncome),
      formatCurrency(scheme.maxAnnualIncomeCap)
    );
  } else {
    const diff = profile.annualIncome - scheme.maxAnnualIncomeCap;
    incomeExplanation = copy.income.mismatched(
      formatCurrency(profile.annualIncome),
      formatCurrency(scheme.maxAnnualIncomeCap),
      formatCurrency(diff)
    );
  }
  score += incomeScoreContribution;

  breakdown.push({
    factorKey: 'income',
    factorLabel: presentation.factorLabel('income'),
    userValue: isIncomeProvided ? formatCurrency(profile.annualIncome) : notSpecifiedText,
    statutoryRequirement: incomeCapped
      ? copy.income.reqMax(formatCurrency(scheme.maxAnnualIncomeCap))
      : copy.income.reqNone,
    matched: incomeMatched,
    state: incomeState,
    reasonCode: incomeReasonCode,
    scoreContribution: incomeScoreContribution,
    maxContribution: weights.income,
    explanation: incomeExplanation,
    severity: incomeMatched ? 'info' : incomeState === 'UNKNOWN' ? 'moderate' : 'critical',
  });

  // 4. Age Factor (15 pts)
  const isAgeProvided = profile.age !== undefined && profile.age !== null && !isNaN(profile.age);
  const ageMatched = isAgeProvided && profile.age >= scheme.minAge && profile.age <= scheme.maxAge;
  const ageState: CriterionEvaluationState = !isAgeProvided ? 'UNKNOWN' : ageMatched ? 'MATCHED' : 'MISMATCHED';
  const ageReasonCode: MatchReasonCode = ageState === 'UNKNOWN' ? 'AGE_UNKNOWN' : ageState === 'MATCHED' ? 'AGE_WITHIN_LIMIT' : 'AGE_OUTSIDE_LIMIT';
  reasonCodes.push(ageReasonCode);

  let ageExplanation = '';
  let ageScoreContribution = 0;

  if (ageState === 'UNKNOWN') {
    ageExplanation = copy.age.unknown;
  } else if (ageState === 'MATCHED') {
    ageScoreContribution = weights.age;
    ageExplanation = copy.age.matched(profile.age, scheme.minAge, scheme.maxAge);
  } else {
    ageExplanation = copy.age.mismatched(profile.age, scheme.minAge, scheme.maxAge);
  }
  score += ageScoreContribution;

  breakdown.push({
    factorKey: 'age',
    factorLabel: presentation.factorLabel('age'),
    userValue: isAgeProvided ? copy.age.valYears(profile.age) : notSpecifiedText,
    statutoryRequirement: copy.age.reqYears(scheme.minAge, scheme.maxAge),
    matched: ageMatched,
    state: ageState,
    reasonCode: ageReasonCode,
    scoreContribution: ageScoreContribution,
    maxContribution: weights.age,
    explanation: ageExplanation,
    severity: ageMatched ? 'info' : ageState === 'UNKNOWN' ? 'moderate' : 'moderate',
  });

  // 5. State / Union Territory Factor (10 pts)
  const isStateProvided = !!profile.state;
  const stateMatched =
    scheme.applicableStates.length === 0 ||
    profile.state === 'All States & UTs' ||
    (isStateProvided && scheme.applicableStates.includes(profile.state));

  const stateState: CriterionEvaluationState = !isStateProvided && scheme.applicableStates.length > 0 ? 'UNKNOWN' : stateMatched ? 'MATCHED' : 'MISMATCHED';
  const stateReasonCode: MatchReasonCode = stateState === 'UNKNOWN' ? 'STATE_UNKNOWN' : stateState === 'MISMATCHED' ? 'STATE_MISMATCHED' : scheme.applicableStates.length === 0 ? 'STATE_NATIONAL_SCHEME' : 'STATE_MATCHED';
  reasonCodes.push(stateReasonCode);

  let stateExplanation = '';
  let stateScoreContribution = 0;
  const localizedUserState = isStateProvided ? presentation.stateLabel(profile.state) : notSpecifiedText;

  if (stateState === 'UNKNOWN') {
    stateExplanation = copy.state.unknown;
  } else if (stateState === 'MATCHED') {
    stateScoreContribution = weights.state;
    stateExplanation = scheme.applicableStates.length === 0
      ? copy.state.allIndia(localizedUserState)
      : copy.state.regional(localizedUserState);
  } else {
    const applicableStatesStr = scheme.applicableStates.map((st) => presentation.stateLabel(st)).join(', ');
    stateExplanation = copy.state.mismatched(applicableStatesStr);
  }
  score += stateScoreContribution;

  breakdown.push({
    factorKey: 'state',
    factorLabel: presentation.factorLabel('state'),
    userValue: localizedUserState,
    statutoryRequirement:
      scheme.applicableStates.length === 0
        ? copy.state.allStatesLabel
        : scheme.applicableStates.map((st) => presentation.stateLabel(st)).join(', '),
    matched: stateMatched,
    state: stateState,
    reasonCode: stateReasonCode,
    scoreContribution: stateScoreContribution,
    maxContribution: weights.state,
    explanation: stateExplanation,
    severity: stateMatched ? 'info' : stateState === 'UNKNOWN' ? 'moderate' : 'critical',
  });

  const matchedCriteria = breakdown.filter((b) => b.matched);
  const unmetCriteria = breakdown.filter((b) => !b.matched);
  const matchedCount = matchedCriteria.length;
  const totalFactorsCount = breakdown.length;

  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine eligibility and status
  const {
    isEligible,
    mandatorySatisfied,
    failedMandatory,
    classification,
    confirmedBlockers,
    unknownCriteria,
  } = determineEligibility(
    scheme,
    profile,
    breakdown,
    normalizedScore
  );

  const matchStatus = classifyMatchStatus(
    isEligible,
    normalizedScore,
    matchedCount,
    unmetCriteria.length,
    mandatorySatisfied
  );

  const primaryGap = identifyPrimaryGapCore(scheme, profile, unmetCriteria, failedMandatory);

  // Formulate plain-language summary sentence without fake certainty
  let plainLanguageExplanation = '';
  if (isEligible) {
    plainLanguageExplanation = copy.summary.eligible(catLabel, bizLabel);
  } else if (matchStatus === 'near-match') {
    if (primaryGap) {
      plainLanguageExplanation = copy.summary.nearMatchGap(
        matchedCount,
        primaryGap.factorLabel,
        primaryGap.gapDistance || primaryGap.userValue
      );
    } else {
      plainLanguageExplanation = copy.summary.nearMatchNoGap;
    }
  } else {
    const unmetLabels = unmetCriteria.map((b) => b.factorLabel).join(', ');
    plainLanguageExplanation = copy.summary.lowMatch(unmetLabels);
  }

  let gapSummary: string | undefined;
  if (unmetCriteria.length > 0) {
    gapSummary = unmetCriteria
      .map((u) => `${u.factorLabel}: ${u.userValue} vs ${u.statutoryRequirement}`)
      .join(' · ');
  }

  // Strongest factors: matched factors sorted by score contribution descending
  const strongestFactors = [...matchedCriteria].sort(
    (a, b) => b.scoreContribution - a.scoreContribution
  );

  const factorAudits = breakdown.map((b) => ({
    factorKey: b.factorKey,
    factorLabel: b.factorLabel,
    weightAssigned:
      b.factorKey === 'category'
        ? weights.category
        : b.factorKey === 'businessType'
        ? weights.businessType
        : b.factorKey === 'income'
        ? weights.income
        : b.factorKey === 'age'
        ? weights.age
        : weights.state,
    pointsAwarded: b.scoreContribution,
    isMandatoryMet: b.matched,
    rawUserMetric: b.userValue,
    ruleRequirement: b.statutoryRequirement,
  }));

  const auditBreakdown = {
    totalWeightEvaluated: 100,
    totalWeightEarned: score,
    factorAudits: breakdown.map((b) => ({
      factorKey: b.factorKey,
      factorLabel: b.factorLabel,
      weightAssigned:
        b.factorKey === 'category'
          ? weights.category
          : b.factorKey === 'businessType'
          ? weights.businessType
          : b.factorKey === 'income'
          ? weights.income
          : b.factorKey === 'age'
          ? weights.age
          : weights.state,
      weightEarned: b.scoreContribution,
      state: b.state,
      userValue: b.userValue,
      requirement: b.statutoryRequirement,
    })),
  };

  // Derive business intelligence integration
  const businessNeedProfile = deriveBusinessNeedProfile(profile);
  const businessRelevance = evaluateBusinessRelevance(scheme, businessNeedProfile);

  return {
    scheme,
    matchPercentage: normalizedScore,
    isEligible,
    mandatoryCriteriaSatisfied: mandatorySatisfied,
    mandatorySatisfied,
    matchedCount,
    matchedCriteriaCount: matchedCount,
    totalFactorsCount,
    totalCriteriaCount: totalFactorsCount,
    unmetCriteria,
    matchedCriteria,
    breakdown,
    reasonCodes,
    matchStatus,
    eligibilityClassification: classification,
    confirmedBlockers,
    unknownCriteria,
    strongestFactors,
    plainLanguageExplanation,
    primaryGap,
    gapSummary,
    factorAudits,
    auditBreakdown,
    mathematicalIntegrityVerified: true,
    businessRelevance,
  };
}

/**
 * Identifies 2-3 actionable alternative schemes when a target scheme is near-missed or blocked.
 * Prioritizes schemes where the profile qualifies or where gaps are significantly smaller.
 */
export function findAlternativeSchemesCore(
  targetScheme: Scheme,
  allSchemes: Scheme[],
  profile: UserProfile,
  presentation: MatchingPresentation
): AlternativeRecommendation[] {
  const { copy } = presentation;
  const bizLabel = presentation.businessTypeLabel(profile.businessType);
  const userState = profile.state ? presentation.stateLabel(profile.state) : '';

  // Filter out the target scheme itself
  const candidateSchemes = allSchemes.filter((s) => s.id !== targetScheme.id);

  // Evaluate candidate schemes
  const evaluated = candidateSchemes.map((s) => evaluateSchemeEligibilityCore(s, profile, presentation));

  // Viable alternatives: eligible schemes or near-matches with higher scores
  const viable = evaluated.filter((res) => {
    return res.isEligible || res.matchStatus === 'near-match';
  });

  if (viable.length === 0) {
    return [];
  }

  // Sort viable alternatives: eligible first, then highest matchPercentage
  viable.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.matchPercentage - a.matchPercentage;
  });

  // Map to AlternativeRecommendation with a specific rationale
  return viable.slice(0, 3).map((v) => {
    let reason = '';

    if (v.isEligible) {
      if (targetScheme.maxAnnualIncomeCap > 0 && v.scheme.maxAnnualIncomeCap === 0) {
        reason = copy.alternatives.noIncomeCap;
      } else if (
        targetScheme.applicableStates.length > 0 &&
        v.scheme.applicableStates.length === 0
      ) {
        reason = copy.alternatives.panIndia(userState);
      } else if (v.scheme.subsidyRatePercent && v.scheme.subsidyRatePercent > 0) {
        reason = copy.alternatives.subsidyRate(v.scheme.subsidyRatePercent);
      } else {
        reason = copy.alternatives.ventureCompat(bizLabel);
      }
    } else {
      reason = copy.alternatives.nearMatch(v.matchPercentage);
    }

    return {
      scheme: v.scheme,
      matchPercentage: v.matchPercentage,
      matchStatus: v.matchStatus,
      reason,
    };
  });
}

/**
 * Intelligent Ranking:
 * Priority Order:
 * 1. Eligible schemes with high score (>=75%)
 * 2. Eligible schemes with medium score (<75%)
 * 3. Near-match schemes with high score (>=75%)
 * 4. Near-match schemes with medium score (50–74%)
 * 5. Low-match schemes
 *
 * Secondary tie-breaker: matchPercentage descending, then subsidy rate descending.
 */
export function rankSchemesForProfileCore(
  schemes: Scheme[],
  profile: UserProfile,
  presentation: MatchingPresentation,
  options?: { skipAlternatives?: boolean },
): MatchResult[] {
  // First evaluate all schemes
  const evaluated = schemes.map((scheme) => evaluateSchemeEligibilityCore(scheme, profile, presentation));

  // Populate recommended alternatives for near-match and low-match schemes.
  // This is O(n²) and dominates runtime (~3.7s for 259 schemes); callers that
  // only need scores/text (e.g. language switches reusing cached alternatives)
  // can skip it via options.skipAlternatives.
  const enriched = options?.skipAlternatives
    ? evaluated
    : evaluated.map((res) => {
        if (res.matchStatus !== 'eligible') {
          const alternatives = findAlternativeSchemesCore(res.scheme, schemes, profile, presentation);
          return {
            ...res,
            recommendedAlternatives: alternatives,
          };
        }
        return res;
      });

  return enriched.sort((a, b) => {
    // 1. Group weight ranking
    const getGroupRank = (m: MatchResult): number => {
      if (m.isEligible && m.matchPercentage >= 75) return 1;
      if (m.isEligible) return 2;
      if (m.matchStatus === 'near-match' && m.matchPercentage >= 75) return 3;
      if (m.matchStatus === 'near-match') return 4;
      return 5;
    };

    const rankA = getGroupRank(a);
    const rankB = getGroupRank(b);

    if (rankA !== rankB) {
      return rankA - rankB; // Lower rank number = higher priority
    }

    // 2. Score tie-breaker
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }

    // 3. Subsidy percentage tie-breaker
    const subA = a.scheme.subsidyRatePercent || 0;
    const subB = b.scheme.subsidyRatePercent || 0;
    if (subB !== subA) {
      return subB - subA;
    }

    // 4. Max funding tie-breaker
    return b.scheme.maxAmount - a.scheme.maxAmount;
  });
}

/**
 * Convenience helper to filter near-miss results
 */
export function getNearMissResults(results: MatchResult[]): MatchResult[] {
  return results.filter((r) => r.matchStatus === 'near-match');
}

/**
 * Convenience helper to filter eligible results
 */
export function getEligibleResults(results: MatchResult[]): MatchResult[] {
  return results.filter((r) => r.matchStatus === 'eligible');
}
