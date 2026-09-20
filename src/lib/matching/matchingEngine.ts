import type { Language } from '../../i18n/types';
import type { AlternativeRecommendation, MatchResult, Scheme, UserProfile } from '../../types';
import { getMatchingPresentation } from '../../i18n/matchingI18n';
import { formatPrimaryGapDistance } from '../../i18n/gapI18n';
import {
  evaluateSchemeEligibilityCore,
  findAlternativeSchemesCore,
  rankSchemesForProfileCore,
  getNearMissResults,
  getEligibleResults,
} from './matchingCore';

export {
  evaluateSchemeEligibilityCore,
  findAlternativeSchemesCore,
  rankSchemesForProfileCore,
  getNearMissResults,
  getEligibleResults,
} from './matchingCore';
export { formatCurrency, checkMandatoryCriteria, determineEligibility, identifyPrimaryGapCore, classifyMatchStatus } from '../eligibility/eligibilityEngine';
export { BUSINESS_TYPE_LABELS, BUSINESS_TYPE_LABELS_HI, CATEGORY_LABELS, CATEGORY_LABELS_HI } from '../../constants/business';

function presentMatchResult(result: MatchResult, lang: Language): MatchResult {
  if (!result.primaryGap) return result;
  return {
    ...result,
    primaryGap: {
      ...result.primaryGap,
      gapDistance: formatPrimaryGapDistance(result.primaryGap, lang),
    },
  };
}

/** Presentation compatibility facade. New domain callers should use the core APIs. */
export function evaluateSchemeEligibility(scheme: Scheme, profile: UserProfile, lang: Language = 'en'): MatchResult {
  return presentMatchResult(evaluateSchemeEligibilityCore(scheme, profile, getMatchingPresentation(lang)), lang);
}

export function findAlternativeSchemes(targetScheme: Scheme, allSchemes: Scheme[], profile: UserProfile, lang: Language = 'en'): AlternativeRecommendation[] {
  return findAlternativeSchemesCore(targetScheme, allSchemes, profile, getMatchingPresentation(lang));
}

export function rankSchemesForProfile(schemes: Scheme[], profile: UserProfile, lang: Language = 'en'): MatchResult[] {
  return rankSchemesForProfileCore(schemes, profile, getMatchingPresentation(lang)).map((result) => presentMatchResult(result, lang));
}

export function calculateMatchScore(profile: UserProfile, scheme: Scheme, lang: Language = 'en'): MatchResult {
  return evaluateSchemeEligibility(scheme, profile, lang);
}
