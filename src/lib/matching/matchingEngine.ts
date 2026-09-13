import {
  AlternativeRecommendation,
  BusinessType,
  CriterionEvaluationState,
  MatchResult,
  MatchStatus,
  Scheme,
  SchemeRuleBreakdown,
  SocialCategory,
  UserProfile,
} from '../../types';
import { hiSchemesData } from '../../i18n/schemesData';
import {
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_LABELS_HI,
  CATEGORY_LABELS,
  CATEGORY_LABELS_HI,
} from '../../constants/business';
import {
  checkMandatoryCriteria,
  determineEligibility,
  identifyPrimaryGap,
  classifyMatchStatus,
  formatCurrency,
} from '../eligibility/eligibilityEngine';
import { deriveBusinessNeedProfile, evaluateBusinessRelevance } from '../business';

export {
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_LABELS_HI,
  CATEGORY_LABELS,
  CATEGORY_LABELS_HI,
  formatCurrency,
  checkMandatoryCriteria,
  determineEligibility,
  identifyPrimaryGap,
  classifyMatchStatus,
};

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
export function evaluateSchemeEligibility(
  scheme: Scheme,
  profile: UserProfile,
  lang: 'hi' | 'en' = 'hi'
): MatchResult {
  const isHi = lang === 'hi';
  const hiData = hiSchemesData[scheme.id];

  const catLabel = isHi ? CATEGORY_LABELS_HI[profile.category] : CATEGORY_LABELS[profile.category];
  const bizLabel = isHi ? BUSINESS_TYPE_LABELS_HI[profile.businessType] : BUSINESS_TYPE_LABELS[profile.businessType];

  const breakdown: SchemeRuleBreakdown[] = [];
  let score = 0;
  const weights = {
    category: 30,
    businessType: 25,
    income: 20,
    age: 15,
    state: 10,
  };

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

  let categoryExplanation = '';
  let categoryScoreContribution = 0;

  if (categoryState === 'UNKNOWN') {
    categoryExplanation = isHi
      ? 'सामाजिक वर्ग की जानकारी उपलब्ध नहीं है। कृपया पात्रता सत्यापन हेतु वर्ग चुनें।'
      : 'Social category not specified. Please provide your category for statutory verification.';
  } else if (categoryState === 'MATCHED') {
    categoryScoreContribution = weights.category;
    if (scheme.isScStSpecific && (profile.category === 'SC' || profile.category === 'ST')) {
      categoryExplanation = isHi
        ? `${catLabel} वर्ग के लिए इस योजना में विशेष आरक्षण एवं समर्पित पूंजीगत सब्सिडी उपलब्ध है।`
        : `Priority reservation and dedicated capital subsidy available for ${CATEGORY_LABELS[profile.category]}.`;
    } else if (scheme.isWomenSpecific && profile.category === 'Woman') {
      categoryExplanation = isHi
        ? `महिला उद्यमियों के लिए रियायती मार्जिन मनी एवं विशेष ऋण सुविधा उपलब्ध है।`
        : `Dedicated allocation for women-led enterprises with concessional margin requirements.`;
    } else if (scheme.isMinoritySpecific && profile.category === 'Minority') {
      categoryExplanation = isHi
        ? `अधिसूचित अल्पसंख्यक समुदाय के उद्यमियों हेतु विशेष रियायती मियादी ऋण उपलब्ध है।`
        : `Targeted credit assistance exclusively reserved for notified minority entrepreneurs.`;
    } else {
      categoryExplanation = isHi
        ? `आपकी श्रेणी (${catLabel}) योजना के पात्र सामाजिक वर्गों के अनुकूल है।`
        : `Your category (${CATEGORY_LABELS[profile.category]}) meets the scheme target beneficiary criteria.`;
    }
  } else {
    const requiredCats = scheme.targetCategories
      .map((c) => (isHi ? CATEGORY_LABELS_HI[c] || c : CATEGORY_LABELS[c] || c))
      .join(', ');
    categoryExplanation = isHi
      ? `योजना केवल इन वर्गों के लिए है: ${requiredCats}। आपकी श्रेणी: ${catLabel}।`
      : `Scheme mandates applicant belong to: ${scheme.targetCategories.map((c) => CATEGORY_LABELS[c] || c).join(', ')}. Your profile: ${CATEGORY_LABELS[profile.category]}.`;
  }
  score += categoryScoreContribution;

  breakdown.push({
    factorKey: 'category',
    factorLabel: isHi ? 'सामाजिक वर्ग' : 'Social Category',
    userValue: isCategoryProvided ? catLabel : (isHi ? 'अनिर्दिष्ट' : 'Not Specified'),
    statutoryRequirement: scheme.targetCategories
      .map((c) => (isHi ? CATEGORY_LABELS_HI[c] || c : c))
      .join(' / '),
    matched: categoryMatched,
    state: categoryState,
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

  let businessExplanation = '';
  let businessScoreContribution = 0;

  if (businessState === 'UNKNOWN') {
    businessExplanation = isHi
      ? 'व्यवसाय क्षेत्र की जानकारी उपलब्ध नहीं है।'
      : 'Business domain not specified in profile.';
  } else if (businessState === 'MATCHED') {
    businessScoreContribution = weights.businessType;
    businessExplanation = isHi
      ? `${bizLabel} इस योजना के तहत वित्तीय सहायता हेतु निर्धारित योग्य कार्यक्षेत्र है।`
      : `${BUSINESS_TYPE_LABELS[profile.businessType]} is recognized as an eligible activity for financing.`;
  } else {
    const requiredBiz = scheme.targetBusinessTypes
      .map((b) => (isHi ? BUSINESS_TYPE_LABELS_HI[b] : BUSINESS_TYPE_LABELS[b]))
      .join(', ');
    businessExplanation = isHi
      ? `योजना केवल इन कार्यक्षेत्रों हेतु है: ${requiredBiz}। आपका कार्यक्षेत्र: ${bizLabel}।`
      : `Scheme is restricted to: ${scheme.targetBusinessTypes.map((b) => BUSINESS_TYPE_LABELS[b]).join(', ')}. Your activity: ${BUSINESS_TYPE_LABELS[profile.businessType]}.`;
  }
  score += businessScoreContribution;

  breakdown.push({
    factorKey: 'businessType',
    factorLabel: isHi ? 'व्यवसाय क्षेत्र' : 'Business Domain',
    userValue: isBusinessProvided ? bizLabel : (isHi ? 'अनिर्दिष्ट' : 'Not Specified'),
    statutoryRequirement: scheme.targetBusinessTypes
      .map((b) => (isHi ? BUSINESS_TYPE_LABELS_HI[b] : BUSINESS_TYPE_LABELS[b]))
      .join(', '),
    matched: businessMatched,
    state: businessState,
    scoreContribution: businessScoreContribution,
    maxContribution: weights.businessType,
    explanation: businessExplanation,
    severity: businessMatched ? 'info' : businessState === 'UNKNOWN' ? 'moderate' : 'critical',
  });

  // 3. Annual Income Factor (20 pts)
  const isIncomeProvided = profile.annualIncome !== undefined && profile.annualIncome !== null && !isNaN(profile.annualIncome);
  const incomeCapped = scheme.maxAnnualIncomeCap > 0;
  const incomeMatched = !incomeCapped || (isIncomeProvided && profile.annualIncome <= scheme.maxAnnualIncomeCap);
  const incomeState: CriterionEvaluationState = !incomeCapped
    ? 'MATCHED'
    : !isIncomeProvided
    ? 'UNKNOWN'
    : incomeMatched
    ? 'MATCHED'
    : 'MISMATCHED';

  let incomeExplanation = '';
  let incomeScoreContribution = 0;

  if (!incomeCapped) {
    incomeScoreContribution = weights.income;
    incomeExplanation = isHi
      ? `इस उद्यम योजना के लिए कोई अधिकतम पारिवारिक आय सीमा लागू नहीं है।`
      : `No upper household income ceiling enforced for this enterprise scheme.`;
  } else if (incomeState === 'UNKNOWN') {
    incomeExplanation = isHi
      ? 'पारिवारिक आय अनिर्दिष्ट है। योजना सीमा से मिलान हेतु आय सत्यापन आवश्यक है।'
      : 'Household income not specified. Verification required against scheme income ceiling.';
  } else if (incomeState === 'MATCHED') {
    incomeScoreContribution = weights.income;
    incomeExplanation = isHi
      ? `आपकी वार्षिक पारिवारिक आय (${formatCurrency(profile.annualIncome)}) योजना की अधिकतम सीमा (${formatCurrency(scheme.maxAnnualIncomeCap)}) के अंदर है।`
      : `Your annual income of ${formatCurrency(profile.annualIncome)} is within the maximum ceiling of ${formatCurrency(scheme.maxAnnualIncomeCap)}.`;
  } else {
    const diff = profile.annualIncome - scheme.maxAnnualIncomeCap;
    incomeExplanation = isHi
      ? `आपकी वार्षिक पारिवारिक आय (${formatCurrency(profile.annualIncome)}) योजना सीमा (${formatCurrency(scheme.maxAnnualIncomeCap)}) से ${formatCurrency(diff)} अधिक है।`
      : `Your annual income of ${formatCurrency(profile.annualIncome)} exceeds the scheme limit of ${formatCurrency(scheme.maxAnnualIncomeCap)} by ${formatCurrency(diff)}.`;
  }
  score += incomeScoreContribution;

  breakdown.push({
    factorKey: 'income',
    factorLabel: isHi ? 'वार्षिक आय' : 'Annual Income',
    userValue: isIncomeProvided ? formatCurrency(profile.annualIncome) : (isHi ? 'अनिर्दिष्ट' : 'Not Specified'),
    statutoryRequirement: incomeCapped
      ? isHi
        ? `अधिकतम ${formatCurrency(scheme.maxAnnualIncomeCap)}`
        : `Max ${formatCurrency(scheme.maxAnnualIncomeCap)}`
      : isHi
      ? 'कोई आय सीमा नहीं'
      : 'No Income Ceiling',
    matched: incomeMatched,
    state: incomeState,
    scoreContribution: incomeScoreContribution,
    maxContribution: weights.income,
    explanation: incomeExplanation,
    severity: incomeMatched ? 'info' : incomeState === 'UNKNOWN' ? 'moderate' : 'critical',
  });

  // 4. Age Factor (15 pts)
  const isAgeProvided = profile.age !== undefined && profile.age !== null && !isNaN(profile.age);
  const ageMatched = isAgeProvided && profile.age >= scheme.minAge && profile.age <= scheme.maxAge;
  const ageState: CriterionEvaluationState = !isAgeProvided
    ? 'UNKNOWN'
    : ageMatched
    ? 'MATCHED'
    : 'MISMATCHED';

  let ageExplanation = '';
  let ageScoreContribution = 0;

  if (ageState === 'UNKNOWN') {
    ageExplanation = isHi
      ? 'आयु अनिर्दिष्ट है। पात्रता सत्यापन हेतु आयु आवश्यक है।'
      : 'Age not specified. Age required for statutory verification.';
  } else if (ageState === 'MATCHED') {
    ageScoreContribution = weights.age;
    ageExplanation = isHi
      ? `आपकी आयु (${profile.age} वर्ष) निर्धारित पात्रता सीमा (${scheme.minAge} से ${scheme.maxAge} वर्ष) के अनुकूल है।`
      : `Age ${profile.age} is within the required eligibility window (${scheme.minAge}–${scheme.maxAge} years).`;
  } else {
    ageExplanation = isHi
      ? `आपकी आयु (${profile.age} वर्ष) योजना के निर्धारित दायरे (${scheme.minAge} से ${scheme.maxAge} वर्ष) से बाहर है।`
      : `Your age (${profile.age} years) falls outside the mandated window of ${scheme.minAge}–${scheme.maxAge} years.`;
  }
  score += ageScoreContribution;

  breakdown.push({
    factorKey: 'age',
    factorLabel: isHi ? 'आवेदक की आयु' : 'Applicant Age',
    userValue: isAgeProvided ? (isHi ? `${profile.age} वर्ष` : `${profile.age} Years`) : (isHi ? 'अनिर्दिष्ट' : 'Not Specified'),
    statutoryRequirement: isHi
      ? `${scheme.minAge} से ${scheme.maxAge} वर्ष`
      : `${scheme.minAge} to ${scheme.maxAge} Years`,
    matched: ageMatched,
    state: ageState,
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

  const stateState: CriterionEvaluationState = !isStateProvided && scheme.applicableStates.length > 0
    ? 'UNKNOWN'
    : stateMatched
    ? 'MATCHED'
    : 'MISMATCHED';

  let stateExplanation = '';
  let stateScoreContribution = 0;

  if (stateState === 'UNKNOWN') {
    stateExplanation = isHi
      ? 'राज्य/स्थान अनिर्दिष्ट है। राज्य-विशिष्ट योजनाओं हेतु स्थान आवश्यक है।'
      : 'State not specified. Jurisdiction verification required for regional schemes.';
  } else if (stateState === 'MATCHED') {
    stateScoreContribution = weights.state;
    stateExplanation = isHi
      ? scheme.applicableStates.length === 0
        ? `यह अखिल भारतीय केंद्रीय योजना है जो ${profile.state} में पूरी तरह संचालित है।`
        : `यह योजना ${profile.state} में संचालित है।`
      : scheme.applicableStates.length === 0
      ? `All-India central scheme operational across ${profile.state}.`
      : `State scheme actively operational in ${profile.state}.`;
  } else {
    stateExplanation = isHi
      ? `यह योजना वर्तमान में केवल विशिष्ट राज्यों में उपलब्ध है: ${scheme.applicableStates.join(', ')}।`
      : `Scheme is currently restricted to: ${scheme.applicableStates.join(', ')}.`;
  }
  score += stateScoreContribution;

  breakdown.push({
    factorKey: 'state',
    factorLabel: isHi ? 'कार्यक्षेत्र / राज्य' : 'Jurisdiction / State',
    userValue: isStateProvided ? profile.state : (isHi ? 'अनिर्दिष्ट' : 'Not Specified'),
    statutoryRequirement:
      scheme.applicableStates.length === 0
        ? isHi
          ? 'सभी राज्य एवं केंद्र शासित प्रदेश (राष्ट्रीय)'
          : 'All States & UTs (National)'
        : scheme.applicableStates.join(', '),
    matched: stateMatched,
    state: stateState,
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

  const primaryGap = identifyPrimaryGap(scheme, profile, unmetCriteria, failedMandatory, isHi);

  // Formulate plain-language summary sentence without fake certainty
  let plainLanguageExplanation = '';
  if (isEligible) {
    plainLanguageExplanation = isHi
      ? `संभावित रूप से पात्र: आपकी प्रोफ़ाइल ${catLabel} एवं ${bizLabel} हेतु योजना के उपलब्ध मुख्य पात्रता मानदंडों से मेल खाती है।`
      : `Potentially eligible: Your profile matches the statutory criteria for ${CATEGORY_LABELS[profile.category]} in ${BUSINESS_TYPE_LABELS[profile.businessType]}. Final sanction subject to official verification.`;
  } else if (matchStatus === 'near-match') {
    if (primaryGap) {
      plainLanguageExplanation = isHi
        ? `समीप पात्रता (${matchedCount}/5 मानदंड पूर्ण): मुख्य अंतर - ${primaryGap.factorLabel} (${primaryGap.gapDistance || primaryGap.userValue})।`
        : `Near match (${matchedCount}/5 criteria met): Main gap - ${primaryGap.factorLabel} (${primaryGap.gapDistance || primaryGap.userValue}).`;
    } else {
      plainLanguageExplanation = isHi
        ? `समीप पात्रता: अधिकांश मानदंड अनुकूल हैं, केवल मामूली शर्तों में अंतर है।`
        : `Near match: Meets most requirements, with minor adjustments needed.`;
    }
  } else {
    const unmetLabels = unmetCriteria.map((b) => b.factorLabel).join(', ');
    plainLanguageExplanation = isHi
      ? `पात्रता शर्तें पूरी नहीं हैं क्योंकि प्रोफ़ाइल ${unmetLabels} के नियमों से मेल नहीं खाती।`
      : `Does not satisfy core eligibility because profile differs on ${unmetLabels}.`;
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
    weightEarned: b.matched ? b.scoreContribution : 0,
    state: b.state || (b.matched ? 'MATCHED' : 'MISMATCHED'),
    userValue: b.userValue,
    requirement: b.statutoryRequirement,
  }));

  const calculatedTotal = factorAudits.reduce((acc, f) => acc + f.weightEarned, 0);
  const mathematicalIntegrityVerified = calculatedTotal === normalizedScore;

  const auditBreakdown = {
    totalWeightEvaluated: 100,
    totalWeightEarned: normalizedScore,
    factorAudits,
  };

  // Phase 4.1: Compute Business Need Relevance as a dedicated separate layer
  const needProfile =
    profile.businessNeedProfile ||
    (profile.businessStageKey ||
    profile.primarySupportNeed ||
    profile.totalProjectCost !== undefined ||
    profile.existingInvestment !== undefined ||
    profile.businessStage
      ? deriveBusinessNeedProfile(profile)
      : undefined);

  const businessRelevance = needProfile
    ? evaluateBusinessRelevance(scheme, needProfile, lang)
    : undefined;

  return {
    scheme,
    matchPercentage: normalizedScore,
    breakdown,
    plainLanguageExplanation,
    isEligible,
    matchStatus,
    mandatoryCriteriaSatisfied: mandatorySatisfied,
    gapSummary,
    matchedCount,
    totalFactorsCount,
    unmetCriteria,
    matchedCriteria,
    primaryGap,
    eligibilityClassification: classification,
    confirmedBlockers,
    unknownCriteria,
    strongestFactors,
    auditBreakdown,
    mathematicalIntegrityVerified,
    businessRelevance,
  };
}

/**
 * Finds alternative recommendations for near-match or ineligible schemes.
 */
export function findAlternativeSchemes(
  targetScheme: Scheme,
  allSchemes: Scheme[],
  profile: UserProfile,
  lang: 'hi' | 'en' = 'hi'
): AlternativeRecommendation[] {
  const isHi = lang === 'hi';

  const candidates = allSchemes
    .filter((s) => s.id !== targetScheme.id)
    .map((s) => evaluateSchemeEligibility(s, profile, lang));

  // Filter candidates that are eligible or near-match with higher score
  const viable = candidates.filter((c) => {
    // Must be either eligible, or near-match with at least 60%
    if (c.matchStatus === 'low-match') return false;
    // Must match category or be open to general
    const catOk =
      c.scheme.targetCategories.includes(profile.category) ||
      c.scheme.targetCategories.includes('General');
    // Must match state
    const stateOk =
      c.scheme.applicableStates.length === 0 ||
      c.scheme.applicableStates.includes(profile.state);
    return catOk && stateOk;
  });

  // Sort by eligibility first, then matchPercentage
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
        reason = isHi
          ? `इस योजना में कोई आय सीमा नहीं है और आपकी प्रोफ़ाइल 100% पात्र है।`
          : `No household income ceiling enforced; profile is fully eligible.`;
      } else if (
        targetScheme.applicableStates.length > 0 &&
        v.scheme.applicableStates.length === 0
      ) {
        reason = isHi
          ? `यह अखिल भारतीय योजना है जो आपके राज्य (${profile.state}) में लागू है।`
          : `National scheme with pan-India coverage across ${profile.state}.`;
      } else if (v.scheme.subsidyRatePercent && v.scheme.subsidyRatePercent > 0) {
        reason = isHi
          ? `${v.scheme.subsidyRatePercent}% तक पूंजीगत सब्सिडी सहायता के साथ पूर्ण पात्रता।`
          : `Fully eligible with up to ${v.scheme.subsidyRatePercent}% capital subsidy.`;
      } else {
        reason = isHi
          ? `आपके व्यवसाय (${BUSINESS_TYPE_LABELS_HI[profile.businessType]}) के लिए उच्च अनुकूलता।`
          : `High compatibility for your ${BUSINESS_TYPE_LABELS[profile.businessType]} venture.`;
      }
    } else {
      reason = isHi
        ? `${v.matchPercentage}% उच्च मिलान एवं कम पात्रता प्रतिबंध।`
        : `Higher match (${v.matchPercentage}%) with broader qualification window.`;
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
export function rankSchemesForProfile(
  schemes: Scheme[],
  profile: UserProfile,
  lang: 'hi' | 'en' = 'hi'
): MatchResult[] {
  // First evaluate all schemes
  const evaluated = schemes.map((scheme) => evaluateSchemeEligibility(scheme, profile, lang));

  // Populate recommended alternatives for near-match and low-match schemes
  const enriched = evaluated.map((res) => {
    if (res.matchStatus !== 'eligible') {
      const alternatives = findAlternativeSchemes(res.scheme, schemes, profile, lang);
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
 * Authoritative alias for evaluateSchemeEligibility
 */
export function calculateMatchScore(
  profile: UserProfile,
  scheme: Scheme,
  lang: 'hi' | 'en' = 'en'
): MatchResult {
  return evaluateSchemeEligibility(scheme, profile, lang);
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
