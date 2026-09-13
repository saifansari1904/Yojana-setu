import { Scheme, UserProfile } from '../../types';
import { formatCurrency } from '../eligibility/eligibilityEngine';

export type FundingFitStatus =
  | 'WITHIN_RANGE'
  | 'ABOVE_RANGE'
  | 'BELOW_RANGE'
  | 'UNSPECIFIED_IN_SCHEME'
  | 'NOT_SPECIFIED_BY_USER';

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

/**
 * Reusable Funding Fit Analysis:
 * Assesses whether the user's financing requirement fits within the scheme's
 * statutory minimum and maximum funding bounds.
 */
export function evaluateFundingFit(
  scheme: Scheme,
  profile: UserProfile,
  lang: 'hi' | 'en' = 'en'
): FundingFitAnalysis {
  const isHi = lang === 'hi';
  const min = scheme.minAmount || 0;
  const max = scheme.maxAmount || 0;
  const userFunding = profile.fundingRequired ?? profile.investmentAmount;

  const hasSchemeLimits = min > 0 || max > 0;
  const statedRange = scheme.fundingRangeText || (hasSchemeLimits ? `${formatCurrency(min)} - ${formatCurrency(max)}` : (isHi ? 'विवरण में निर्दिष्ट' : 'As per scheme guidelines'));

  // 1. If scheme has no statutory limits specified
  if (!hasSchemeLimits) {
    return {
      fitStatus: 'UNSPECIFIED_IN_SCHEME',
      statedRange,
      schemeMinAmount: min,
      schemeMaxAmount: max,
      explanation: isHi
        ? `योजना में कोई निश्चित सीमा निर्धारित नहीं है (${statedRange})।`
        : `Scheme funding quantum varies by project type (${statedRange}).`,
    };
  }

  // 2. If user hasn't specified funding requirement in profile
  if (userFunding === undefined || userFunding === null || isNaN(userFunding) || userFunding <= 0) {
    return {
      fitStatus: 'NOT_SPECIFIED_BY_USER',
      statedRange,
      schemeMinAmount: min,
      schemeMaxAmount: max,
      explanation: isHi
        ? `आपकी प्रोफ़ाइल में वित्तीय आवश्यकता अनिर्दिष्ट है। योजना सीमा: ${statedRange}।`
        : `Funding requirement not specified in profile. Scheme offers ${statedRange}.`,
    };
  }

  // 3. User specified funding - evaluate against bounds
  let fitStatus: FundingFitStatus = 'WITHIN_RANGE';
  let difference: number | undefined;
  let explanation = '';

  if (max > 0 && userFunding > max) {
    fitStatus = 'ABOVE_RANGE';
    difference = userFunding - max;
    explanation = isHi
      ? `आपकी आवश्यकता (${formatCurrency(userFunding)}) योजना की अधिकतम सीमा (${formatCurrency(max)}) से ${formatCurrency(difference)} अधिक है। आप अधिकतम ${formatCurrency(max)} तक आवेदन कर सकते हैं।`
      : `Requirement (${formatCurrency(userFunding)}) exceeds scheme ceiling (${formatCurrency(max)}) by ${formatCurrency(difference)}. Maximum eligible sanction under this scheme is ${formatCurrency(max)}.`;
  } else if (min > 0 && userFunding < min) {
    fitStatus = 'BELOW_RANGE';
    difference = min - userFunding;
    explanation = isHi
      ? `आपकी आवश्यकता (${formatCurrency(userFunding)}) योजना के न्यूनतम मानदंड (${formatCurrency(min)}) से ${formatCurrency(difference)} कम है।`
      : `Requirement (${formatCurrency(userFunding)}) is below the minimum threshold (${formatCurrency(min)}) by ${formatCurrency(difference)}.`;
  } else {
    fitStatus = 'WITHIN_RANGE';
    explanation = isHi
      ? `आपकी आवश्यकता (${formatCurrency(userFunding)}) योजना के स्वीकार्य दायरे (${statedRange}) के पूर्णतः अनुकूल है।`
      : `Your requirement (${formatCurrency(userFunding)}) is fully within the statutory scheme range (${statedRange}).`;
  }

  // Calculate estimated subsidy if applicable
  let estimatedSubsidy: number | undefined;
  let subsidyExplanation: string | undefined;

  if (scheme.subsidyRatePercent && scheme.subsidyRatePercent > 0) {
    const applicableBase = max > 0 ? Math.min(userFunding, max) : userFunding;
    const computedSubsidy = applicableBase * (scheme.subsidyRatePercent / 100);
    estimatedSubsidy = scheme.subsidyCap && scheme.subsidyCap > 0
      ? Math.min(computedSubsidy, scheme.subsidyCap)
      : computedSubsidy;

    subsidyExplanation = isHi
      ? `अनुमानित सांकेतिक पूंजीगत अनुदान (${scheme.subsidyRatePercent}%): लगभग ${formatCurrency(estimatedSubsidy)} (बैंक/एजेंसी अनुमोदन के अधीन)`
      : `Indicative statutory capital subsidy (${scheme.subsidyRatePercent}%): Approx. ${formatCurrency(estimatedSubsidy)} (subject to agency sanction)`;
  }

  return {
    fitStatus,
    statedRange,
    userRequirement: userFunding,
    schemeMinAmount: min,
    schemeMaxAmount: max,
    difference,
    explanation,
    estimatedSubsidy,
    subsidyExplanation,
    subsidyRatePercent: scheme.subsidyRatePercent,
  };
}
