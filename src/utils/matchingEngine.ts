import {
  AlternativeRecommendation,
  BusinessType,
  MatchResult,
  MatchStatus,
  PrimaryGap,
  Scheme,
  SchemeFactorKey,
  SchemeRuleBreakdown,
  SocialCategory,
  UserProfile,
} from '../types';
import { hiSchemesData } from '../i18n/schemesData';

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  trading: 'Trading & Retail',
  manufacturing: 'Manufacturing & Processing',
  services: 'Services & Operations',
  agri: 'Agri & Allied Units',
  handicraft: 'Handicrafts & Artisans',
  food: 'Food Processing & Catering',
  tech: 'Tech & Digital Solutions',
};

export const BUSINESS_TYPE_LABELS_HI: Record<BusinessType, string> = {
  manufacturing: 'विनिर्माण एवं उत्पादन',
  trading: 'व्यापार एवं खुदरा',
  services: 'सेवाएं एवं परिचालन',
  agri: 'कृषि एवं संबद्ध इकाइयां',
  handicraft: 'हस्तशिल्प एवं कारीगर',
  food: 'खाद्य प्रसंस्करण एवं खानपान',
  tech: 'तकनीकी एवं डिजिटल समाधान',
};

export const CATEGORY_LABELS: Record<SocialCategory, string> = {
  SC: 'Scheduled Caste (SC)',
  ST: 'Scheduled Tribe (ST)',
  OBC: 'Other Backward Class (OBC)',
  General: 'General Category',
  Woman: 'Woman Entrepreneur',
  Minority: 'Minority Community',
};

export const CATEGORY_LABELS_HI: Record<SocialCategory, string> = {
  SC: 'अनुसूचित जाति (SC)',
  ST: 'अनुसूचित जनजाति (ST)',
  Woman: 'महिला उद्यमी (Woman)',
  OBC: 'अन्य पिछड़ा वर्ग (OBC)',
  Minority: 'अल्पसंख्यक समुदाय',
  General: 'सामान्य वर्ग (General)',
};

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
 */
export function checkMandatoryCriteria(
  scheme: Scheme,
  profile: UserProfile,
  breakdown: SchemeRuleBreakdown[]
): { satisfied: boolean; failedMandatory: SchemeFactorKey[] } {
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
  for (const key of mandatoryKeys) {
    const item = breakdown.find((b) => b.factorKey === key);
    if (item && !item.matched) {
      failedMandatory.push(key);
    }
  }

  return {
    satisfied: failedMandatory.length === 0,
    failedMandatory,
  };
}

/**
 * Determines exact statutory eligibility.
 * High match score does NOT imply eligibility if critical mandatory factors fail.
 */
export function determineEligibility(
  scheme: Scheme,
  profile: UserProfile,
  breakdown: SchemeRuleBreakdown[],
  score: number
): { isEligible: boolean; mandatorySatisfied: boolean; failedMandatory: SchemeFactorKey[] } {
  const { satisfied: mandatorySatisfied, failedMandatory } = checkMandatoryCriteria(
    scheme,
    profile,
    breakdown
  );

  const matchedCount = breakdown.filter((b) => b.matched).length;

  // To be legally eligible:
  // 1. All mandatory criteria must be satisfied
  // 2. At least 4 of the 5 criteria must match
  // 3. Match score must be >= 75%
  const isEligible = mandatorySatisfied && matchedCount >= 4 && score >= 75;

  return {
    isEligible,
    mandatorySatisfied,
    failedMandatory,
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

/**
 * Evaluates full eligibility for a single scheme.
 */
export function evaluateSchemeEligibility(
  scheme: Scheme,
  profile: UserProfile,
  lang: 'hi' | 'en' = 'hi'
): MatchResult {
  const isHi = lang === 'hi';
  const hiData = hiSchemesData[scheme.id];
  const schemeName = isHi && hiData ? hiData.name : scheme.name;
  const ministryName = isHi && hiData ? hiData.sponsoringMinistry : scheme.sponsoringMinistry;

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
  const categoryMatched =
    scheme.targetCategories.includes(profile.category) ||
    scheme.targetCategories.includes('General');

  let categoryExplanation = '';
  if (categoryMatched) {
    if (scheme.isScStSpecific && (profile.category === 'SC' || profile.category === 'ST')) {
      categoryExplanation = isHi
        ? `${catLabel} वर्ग के लिए इस योजना में विशेष आरक्षण एवं समर्पित पूंजीगत सब्सिडी उपलब्ध है।`
        : `Priority reservation and dedicated capital subsidy available for ${CATEGORY_LABELS[profile.category]}.`;
      score += weights.category;
    } else if (scheme.isWomenSpecific && profile.category === 'Woman') {
      categoryExplanation = isHi
        ? `महिला उद्यमियों के लिए रियायती मार्जिन मनी एवं विशेष ऋण सुविधा उपलब्ध है।`
        : `Dedicated allocation for women-led enterprises with concessional margin requirements.`;
      score += weights.category;
    } else if (scheme.isMinoritySpecific && profile.category === 'Minority') {
      categoryExplanation = isHi
        ? `अधिसूचित अल्पसंख्यक समुदाय के उद्यमियों हेतु विशेष रियायती मियादी ऋण उपलब्ध है।`
        : `Targeted credit assistance exclusively reserved for notified minority entrepreneurs.`;
      score += weights.category;
    } else {
      categoryExplanation = isHi
        ? `आपकी श्रेणी (${catLabel}) योजना के पात्र सामाजिक वर्गों के अनुकूल है।`
        : `Your category (${CATEGORY_LABELS[profile.category]}) meets the scheme target beneficiary criteria.`;
      score += weights.category;
    }
  } else {
    const requiredCats = scheme.targetCategories
      .map((c) => (isHi ? CATEGORY_LABELS_HI[c] || c : CATEGORY_LABELS[c] || c))
      .join(', ');
    categoryExplanation = isHi
      ? `योजना केवल इन वर्गों के लिए है: ${requiredCats}। आपकी श्रेणी: ${catLabel}।`
      : `Scheme mandates applicant belong to: ${scheme.targetCategories.map((c) => CATEGORY_LABELS[c] || c).join(', ')}. Your profile: ${CATEGORY_LABELS[profile.category]}.`;
    score += 0;
  }

  breakdown.push({
    factorKey: 'category',
    factorLabel: isHi ? 'सामाजिक वर्ग' : 'Social Category',
    userValue: catLabel,
    statutoryRequirement: scheme.targetCategories
      .map((c) => (isHi ? CATEGORY_LABELS_HI[c] || c : c))
      .join(' / '),
    matched: categoryMatched,
    explanation: categoryExplanation,
    severity: categoryMatched ? 'info' : 'critical',
  });

  // 2. Business Type Factor (25 pts)
  const businessMatched = scheme.targetBusinessTypes.includes(profile.businessType);
  let businessExplanation = '';
  if (businessMatched) {
    businessExplanation = isHi
      ? `${bizLabel} इस योजना के तहत वित्तीय सहायता हेतु निर्धारित योग्य कार्यक्षेत्र है।`
      : `${BUSINESS_TYPE_LABELS[profile.businessType]} is recognized as an eligible activity for financing.`;
    score += weights.businessType;
  } else {
    const requiredBiz = scheme.targetBusinessTypes
      .map((b) => (isHi ? BUSINESS_TYPE_LABELS_HI[b] : BUSINESS_TYPE_LABELS[b]))
      .join(', ');
    businessExplanation = isHi
      ? `योजना केवल इन कार्यक्षेत्रों हेतु है: ${requiredBiz}। आपका कार्यक्षेत्र: ${bizLabel}।`
      : `Scheme is restricted to: ${scheme.targetBusinessTypes.map((b) => BUSINESS_TYPE_LABELS[b]).join(', ')}. Your activity: ${BUSINESS_TYPE_LABELS[profile.businessType]}.`;
    score += 0;
  }

  breakdown.push({
    factorKey: 'businessType',
    factorLabel: isHi ? 'व्यवसाय क्षेत्र' : 'Business Domain',
    userValue: bizLabel,
    statutoryRequirement: scheme.targetBusinessTypes
      .map((b) => (isHi ? BUSINESS_TYPE_LABELS_HI[b] : BUSINESS_TYPE_LABELS[b]))
      .join(', '),
    matched: businessMatched,
    explanation: businessExplanation,
    severity: businessMatched ? 'info' : 'critical',
  });

  // 3. Annual Income Factor (20 pts)
  const incomeCapped = scheme.maxAnnualIncomeCap > 0;
  const incomeMatched = !incomeCapped || profile.annualIncome <= scheme.maxAnnualIncomeCap;
  let incomeExplanation = '';
  if (!incomeCapped) {
    incomeExplanation = isHi
      ? `इस उद्यम योजना के लिए कोई अधिकतम पारिवारिक आय सीमा लागू नहीं है।`
      : `No upper household income ceiling enforced for this enterprise scheme.`;
    score += weights.income;
  } else if (incomeMatched) {
    incomeExplanation = isHi
      ? `आपकी वार्षिक पारिवारिक आय (${formatCurrency(profile.annualIncome)}) योजना की अधिकतम सीमा (${formatCurrency(scheme.maxAnnualIncomeCap)}) के अंदर है।`
      : `Your annual income of ${formatCurrency(profile.annualIncome)} is within the maximum ceiling of ${formatCurrency(scheme.maxAnnualIncomeCap)}.`;
    score += weights.income;
  } else {
    const diff = profile.annualIncome - scheme.maxAnnualIncomeCap;
    incomeExplanation = isHi
      ? `आपकी वार्षिक पारिवारिक आय (${formatCurrency(profile.annualIncome)}) योजना सीमा (${formatCurrency(scheme.maxAnnualIncomeCap)}) से ${formatCurrency(diff)} अधिक है।`
      : `Your annual income of ${formatCurrency(profile.annualIncome)} exceeds the scheme limit of ${formatCurrency(scheme.maxAnnualIncomeCap)} by ${formatCurrency(diff)}.`;
    score += 0;
  }

  breakdown.push({
    factorKey: 'income',
    factorLabel: isHi ? 'वार्षिक आय' : 'Annual Income',
    userValue: formatCurrency(profile.annualIncome),
    statutoryRequirement: incomeCapped
      ? isHi
        ? `अधिकतम ${formatCurrency(scheme.maxAnnualIncomeCap)}`
        : `Max ${formatCurrency(scheme.maxAnnualIncomeCap)}`
      : isHi
      ? 'कोई आय सीमा नहीं'
      : 'No Income Ceiling',
    matched: incomeMatched,
    explanation: incomeExplanation,
    severity: incomeMatched ? 'info' : 'critical',
  });

  // 4. Age Factor (15 pts)
  const ageMatched = profile.age >= scheme.minAge && profile.age <= scheme.maxAge;
  let ageExplanation = '';
  if (ageMatched) {
    ageExplanation = isHi
      ? `आपकी आयु (${profile.age} वर्ष) निर्धारित पात्रता सीमा (${scheme.minAge} से ${scheme.maxAge} वर्ष) के अनुकूल है।`
      : `Age ${profile.age} is within the required eligibility window (${scheme.minAge}–${scheme.maxAge} years).`;
    score += weights.age;
  } else {
    ageExplanation = isHi
      ? `आपकी आयु (${profile.age} वर्ष) योजना के निर्धारित दायरे (${scheme.minAge} से ${scheme.maxAge} वर्ष) से बाहर है।`
      : `Your age (${profile.age} years) falls outside the mandated window of ${scheme.minAge}–${scheme.maxAge} years.`;
    score += 0;
  }

  breakdown.push({
    factorKey: 'age',
    factorLabel: isHi ? 'आवेदक की आयु' : 'Applicant Age',
    userValue: isHi ? `${profile.age} वर्ष` : `${profile.age} Years`,
    statutoryRequirement: isHi
      ? `${scheme.minAge} से ${scheme.maxAge} वर्ष`
      : `${scheme.minAge} to ${scheme.maxAge} Years`,
    matched: ageMatched,
    explanation: ageExplanation,
    severity: ageMatched ? 'info' : 'moderate',
  });

  // 5. State / Union Territory Factor (10 pts)
  const stateMatched =
    scheme.applicableStates.length === 0 ||
    scheme.applicableStates.includes(profile.state) ||
    profile.state === 'All States & UTs';

  let stateExplanation = '';
  if (stateMatched) {
    stateExplanation = isHi
      ? scheme.applicableStates.length === 0
        ? `यह अखिल भारतीय केंद्रीय योजना है जो ${profile.state} में पूरी तरह संचालित है।`
        : `यह योजना ${profile.state} में संचालित है।`
      : scheme.applicableStates.length === 0
      ? `All-India central scheme operational across ${profile.state}.`
      : `State scheme actively operational in ${profile.state}.`;
    score += weights.state;
  } else {
    stateExplanation = isHi
      ? `यह योजना वर्तमान में केवल विशिष्ट राज्यों में उपलब्ध है: ${scheme.applicableStates.join(', ')}।`
      : `Scheme is currently restricted to: ${scheme.applicableStates.join(', ')}.`;
    score += 0;
  }

  breakdown.push({
    factorKey: 'state',
    factorLabel: isHi ? 'कार्यक्षेत्र / राज्य' : 'Jurisdiction / State',
    userValue: profile.state,
    statutoryRequirement:
      scheme.applicableStates.length === 0
        ? isHi
          ? 'सभी राज्य एवं केंद्र शासित प्रदेश (राष्ट्रीय)'
          : 'All States & UTs (National)'
        : scheme.applicableStates.join(', '),
    matched: stateMatched,
    explanation: stateExplanation,
    severity: stateMatched ? 'info' : 'critical',
  });

  const matchedCriteria = breakdown.filter((b) => b.matched);
  const unmetCriteria = breakdown.filter((b) => !b.matched);
  const matchedCount = matchedCriteria.length;
  const totalFactorsCount = breakdown.length;

  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine eligibility and status
  const { isEligible, mandatorySatisfied, failedMandatory } = determineEligibility(
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

  // Formulate plain-language summary sentence
  let plainLanguageExplanation = '';
  if (isEligible) {
    plainLanguageExplanation = isHi
      ? `पूर्ण पात्रता: आप ${catLabel} एवं ${bizLabel} हेतु योजना के सभी मुख्य मानदंडों को पूरी तरह संतुष्ट करते हैं।`
      : `Fully eligible: You satisfy all statutory criteria with affirmative terms for ${CATEGORY_LABELS[profile.category]} in ${BUSINESS_TYPE_LABELS[profile.businessType]}.`;
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

