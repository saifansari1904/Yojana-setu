import { MatchResult, UserProfile } from '../../types';
import { getNextBestAction, NextBestAction } from './decisionEngine';
import { evaluateFundingFit, FundingFitAnalysis } from './fundingFit';

export interface SchemeComparisonColumn {
  schemeId: string;
  schemeName: string;
  sponsoringMinistry: string;
  schemeType: string;
  matchPercentage: number;
  isEligible: boolean;
  matchStatus: string;
  eligibilityClassification: string;
  applicableStatesText: string;
  targetCategoriesText: string;
  targetBusinessTypesText: string;
  fundingRangeText: string;
  subsidyText: string;
  interestRateText: string;
  tenureText: string;
  documentsCount: number;
  keyDocuments: string[];
  applicationMode: string;
  sourceVerificationText: string;
  nextBestAction: NextBestAction;
  fundingFit: FundingFitAnalysis;
  standoutHighlights: string[];
}

export interface SchemeComparisonResult {
  columns: SchemeComparisonColumn[];
  bestMatchSchemeId: string;
  highestSubsidySchemeId?: string;
  broadestGeographySchemeId?: string;
  summaryNote: string;
}

/**
 * Builds side-by-side comparison for 2 to 3 schemes.
 * STRICTLY consumes existing authoritative MatchResult objects to ensure
 * 100% mathematical consistency with search and detail screens.
 */
export function compareSchemes(
  selectedMatches: MatchResult[],
  profile: UserProfile,
  lang: 'hi' | 'en' = 'en'
): SchemeComparisonResult {
  if (!selectedMatches || selectedMatches.length < 2) {
    throw new Error('Comparison requires at least 2 schemes.');
  }

  const isHi = lang === 'hi';
  const boundedMatches = selectedMatches.slice(0, 3);

  // Identify standout metrics
  let bestScore = -1;
  let bestScoreId = '';
  let highestSubsidy = 0;
  let highestSubsidyId = '';

  boundedMatches.forEach((m) => {
    if (m.matchPercentage > bestScore) {
      bestScore = m.matchPercentage;
      bestScoreId = m.scheme.id;
    }
    if ((m.scheme.subsidyRatePercent || 0) > highestSubsidy) {
      highestSubsidy = m.scheme.subsidyRatePercent || 0;
      highestSubsidyId = m.scheme.id;
    }
  });

  const columns: SchemeComparisonColumn[] = boundedMatches.map((result) => {
    const { scheme } = result;
    const nextBestAction = getNextBestAction(result, profile, lang);
    const fundingFit = evaluateFundingFit(scheme, profile, lang);

    const applicableStatesText = scheme.applicableStates.length === 0
      ? (isHi ? 'अखिल भारतीय (सभी राज्य)' : 'All-India (National)')
      : scheme.applicableStates.join(', ');

    const targetCategoriesText = scheme.targetCategories.includes('General')
      ? (isHi ? 'सभी सामाजिक वर्ग' : 'All Social Categories')
      : scheme.targetCategories.join(' / ');

    const targetBusinessTypesText = scheme.targetBusinessTypes.join(', ');

    const subsidyText = scheme.subsidyRatePercent && scheme.subsidyRatePercent > 0
      ? `${scheme.subsidyRatePercent}% ${isHi ? 'सरकारी अनुदान' : 'Capital Subsidy'}${scheme.subsidyCap ? ` (Max ₹${(scheme.subsidyCap / 100000).toFixed(1)}L)` : ''}`
      : (isHi ? 'कोई पूंजीगत अनुदान नहीं' : 'No direct subsidy');

    const interestRateText = scheme.baseInterestRate
      ? `${scheme.baseInterestRate}% ${isHi ? 'वार्षिक' : 'p.a.'}`
      : (isHi ? 'संबंधित बैंक नियमानुसार' : 'Bank standard terms');

    const tenureText = scheme.standardTenureYears
      ? `${scheme.standardTenureYears} ${isHi ? 'वर्ष' : 'Years'}${scheme.moratoriumPeriodMonths ? ` (+${scheme.moratoriumPeriodMonths}m moratorium)` : ''}`
      : (isHi ? 'बैंक नियमानुसार' : 'Standard bank tenure');

    const sourceVerificationText = scheme.trustProfile
      ? `${scheme.trustProfile.verification.status} (${scheme.trustProfile.freshness.status})`
      : 'OFFICIAL_GOVERNMENT';

    // Highlights
    const standoutHighlights: string[] = [];
    if (scheme.id === bestScoreId) {
      standoutHighlights.push(isHi ? 'सर्वोच्च मिलान स्कोर' : 'Highest Match Score');
    }
    if (scheme.id === highestSubsidyId && highestSubsidy > 0) {
      standoutHighlights.push(isHi ? 'अधिकतम पूंजीगत सब्सिडी' : 'Highest Capital Subsidy');
    }
    if (scheme.applicableStates.length === 0) {
      standoutHighlights.push(isHi ? 'राष्ट्रीय स्वीकार्यता' : 'All-India Coverage');
    }
    if (scheme.schemeType === 'Credit Guarantee') {
      standoutHighlights.push(isHi ? 'बिना संपार्श्विक (कोलेटरल मुक्त)' : 'Collateral-Free');
    }

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      sponsoringMinistry: scheme.sponsoringMinistry,
      schemeType: scheme.schemeType,
      matchPercentage: result.matchPercentage,
      isEligible: result.isEligible,
      matchStatus: result.matchStatus,
      eligibilityClassification: result.eligibilityClassification || (result.isEligible ? 'POTENTIALLY_ELIGIBLE' : 'NEEDS_INFORMATION'),
      applicableStatesText,
      targetCategoriesText,
      targetBusinessTypesText,
      fundingRangeText: scheme.fundingRangeText,
      subsidyText,
      interestRateText,
      tenureText,
      documentsCount: scheme.requiredDocuments.length,
      keyDocuments: scheme.requiredDocuments.slice(0, 4),
      applicationMode: scheme.applicationMode,
      sourceVerificationText,
      nextBestAction,
      fundingFit,
      standoutHighlights,
    };
  });

  const summaryNote = isHi
    ? `${columns.length} चयनित योजनाओं की तुलना पूरी हो चुकी है। सभी स्कोर आधिकारिक इंजन द्वारा सत्यापित हैं।`
    : `Side-by-side comparison for ${columns.length} schemes evaluated with identical statutory criteria.`;

  return {
    columns,
    bestMatchSchemeId: bestScoreId,
    highestSubsidySchemeId: highestSubsidyId || undefined,
    summaryNote,
  };
}
