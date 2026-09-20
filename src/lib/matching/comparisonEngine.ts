import { MatchResult, UserProfile } from '../../types';
import { getNextBestAction, NextBestAction } from '../../i18n/decisionActionI18n';
import { evaluateFundingFit, FundingFitAnalysis } from './fundingFit';
import { Language } from '../../i18n/types';
import { allLocalizedSchemes } from '../../i18n/schemesData';
import { getComparisonPhrases } from '../../i18n/comparisonI18n';

interface SchemeComparisonColumn {
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
  lang: Language = 'en'
): SchemeComparisonResult {
  if (!selectedMatches || selectedMatches.length < 2) {
    throw new Error('Comparison requires at least 2 schemes.');
  }

  const boundedMatches = selectedMatches.slice(0, 3);
  const locMap = allLocalizedSchemes[lang] || {};

  const phrases = getComparisonPhrases(lang);

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
    const loc = locMap[scheme.id];
    const schemeName = loc?.name || scheme.name;
    const sponsoringMinistry = loc?.sponsoringMinistry || scheme.sponsoringMinistry;
    const nextBestAction = getNextBestAction(result, profile, lang);
    const fundingFit = evaluateFundingFit(scheme, profile, lang);

    const applicableStatesText = scheme.applicableStates.length === 0
      ? phrases.allIndia
      : scheme.applicableStates.join(', ');

    const targetCategoriesText = scheme.targetCategories.includes('General')
      ? phrases.allCategories
      : scheme.targetCategories.join(' / ');

    const targetBusinessTypesText = scheme.targetBusinessTypes.join(', ');

    const subsidyText = scheme.subsidyRatePercent && scheme.subsidyRatePercent > 0
      ? `${scheme.subsidyRatePercent}% ${phrases.capitalSubsidy}${scheme.subsidyCap ? ` (Max ₹${(scheme.subsidyCap / 100000).toFixed(1)}L)` : ''}`
      : phrases.noSubsidy;

    const interestRateText = scheme.baseInterestRate
      ? `${scheme.baseInterestRate}% ${phrases.pa}`
      : phrases.bankTerms;

    const tenureText = scheme.standardTenureYears
      ? `${scheme.standardTenureYears} ${phrases.years}${scheme.moratoriumPeriodMonths ? ` (+${scheme.moratoriumPeriodMonths}m moratorium)` : ''}`
      : phrases.standardTenure;

    const sourceVerificationText = scheme.trustProfile
      ? `${scheme.trustProfile.verification.status} (${scheme.trustProfile.freshness.status})`
      : 'OFFICIAL_GOVERNMENT';

    // Highlights
    const standoutHighlights: string[] = [];
    if (scheme.id === bestScoreId) {
      standoutHighlights.push(phrases.highestScore);
    }
    if (scheme.id === highestSubsidyId && highestSubsidy > 0) {
      standoutHighlights.push(phrases.highestSubsidy);
    }
    if (scheme.applicableStates.length === 0) {
      standoutHighlights.push(phrases.allIndiaCoverage);
    }
    if (scheme.schemeType === 'Credit Guarantee') {
      standoutHighlights.push(phrases.collateralFree);
    }

    return {
      schemeId: scheme.id,
      schemeName,
      sponsoringMinistry,
      schemeType: loc?.schemeType || scheme.schemeType,
      matchPercentage: result.matchPercentage,
      isEligible: result.isEligible,
      matchStatus: result.matchStatus,
      eligibilityClassification: result.eligibilityClassification || (result.isEligible ? 'POTENTIALLY_ELIGIBLE' : 'NEEDS_INFORMATION'),
      applicableStatesText,
      targetCategoriesText,
      targetBusinessTypesText,
      fundingRangeText: loc?.fundingRangeText || scheme.fundingRangeText,
      subsidyText,
      interestRateText,
      tenureText,
      documentsCount: (loc?.requiredDocuments || scheme.requiredDocuments).length,
      keyDocuments: (loc?.requiredDocuments || scheme.requiredDocuments).slice(0, 4),
      applicationMode: scheme.applicationMode,
      sourceVerificationText,
      nextBestAction,
      fundingFit,
      standoutHighlights,
    };
  });

  const summaryNote = phrases.summaryNote(columns.length);

  return {
    columns,
    bestMatchSchemeId: bestScoreId,
    highestSubsidySchemeId: highestSubsidyId || undefined,
    summaryNote,
  };
}
