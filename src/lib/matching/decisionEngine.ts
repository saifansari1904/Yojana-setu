import { MatchResult, UserProfile } from '../../types';

export type NextActionType =
  | 'COMPLETE_PROFILE'
  | 'CHECK_ELIGIBILITY'
  | 'PREPARE_DOCUMENTS'
  | 'VERIFY_INFORMATION'
  | 'EXPLORE_ALTERNATIVES'
  | 'VISIT_OFFICIAL_PORTAL'
  | 'COMPLETE_BUSINESS_PROFILE'
  | 'ADD_FUNDING_REQUIREMENT'
  | 'CONFIRM_REGISTRATION'
  | 'EXPLORE_PRIMARY_NEED';

export type NextBestAction = import('../../i18n/decisionActionI18n').LocalizedNextBestAction;

export interface SemanticNextBestAction {
  actionType: NextActionType;
  titleKey: string;
  descriptionKey: string;
  badgeKey: string;
  ctaKey: string;
  priority: 'high' | 'medium' | 'low';
  actionTarget: 'portal' | 'checklist' | 'alternatives' | 'form' | 'details' | 'compare';
  actionUrl?: string;
}

function semanticAction(actionType: NextActionType, priority: SemanticNextBestAction['priority'], actionTarget: SemanticNextBestAction['actionTarget'], actionUrl?: string): SemanticNextBestAction {
  const keyBase = `nextAction.${actionType}`;
  return { actionType, titleKey: `${keyBase}.title`, descriptionKey: `${keyBase}.description`, badgeKey: `${keyBase}.badge`, ctaKey: `${keyBase}.cta`, priority, actionTarget, actionUrl };
}

/**
 * Authoritative Decision Layer (Phase 3.1 + Phase 4.1 Enhanced):
 * Evaluates the authoritative MatchResult, statutory audit, and business-need intelligence
 * to synthesize the exact, highest-utility Next Best Action for the entrepreneur.
 */
export function deriveNextBestAction(
  matchResult: MatchResult,
  profile: UserProfile
): SemanticNextBestAction {
  const { scheme, isEligible, matchPercentage, confirmedBlockers, unknownCriteria, businessRelevance } = matchResult;

  const hasBlockers = Boolean(confirmedBlockers && confirmedBlockers.length > 0);
  const hasUnknowns = Boolean(unknownCriteria && unknownCriteria.length > 0);
  const isTrustOutdated =
    scheme.trustProfile?.freshness.status === 'OUTDATED' ||
    scheme.trustProfile?.freshness.status === 'DUE_FOR_REVIEW';

  // 1. Confirmed Statutory Blocker -> Recommend Alternatives
  if (hasBlockers || matchResult.eligibilityClassification === 'BLOCKED') {
    return semanticAction('EXPLORE_ALTERNATIVES', 'high', 'alternatives', `#alternatives-${scheme.id}`);
  }

  // 2. Missing Core Statutory Information -> Complete Profile
  if (hasUnknowns || matchResult.eligibilityClassification === 'NEEDS_INFORMATION') {
    return semanticAction('COMPLETE_PROFILE', 'high', 'form');
  }

  // 3. Phase 4.1 Business Intelligence Refinements
  const hasBusinessDetails = Boolean(
    profile.businessStageKey ||
    profile.businessIdea ||
    profile.totalProjectCost !== undefined ||
    profile.primarySupportNeed
  );

  // 3a. If business registration is specifically unknown
  const regReq = scheme.intelligence?.eligibility.registrationRequirement;
  const requiresRegistration =
    (regReq !== undefined && regReq !== 'none') ||
    scheme.requiredDocuments.some(
      (d) => d.toLowerCase().includes('udyam') || d.toLowerCase().includes('registration')
    );

  if (profile.registrationStatus === 'UNKNOWN' && requiresRegistration) {
    return semanticAction('CONFIRM_REGISTRATION', 'medium', 'form');
  }

  // 3b. If user has no business details at all
  if (!hasBusinessDetails) {
    return semanticAction('COMPLETE_BUSINESS_PROFILE', 'medium', 'form');
  }

  // 3c. If business defined but funding requirement is missing
  if (profile.totalProjectCost === undefined && profile.fundingGap === undefined) {
    return semanticAction('ADD_FUNDING_REQUIREMENT', 'medium', 'form');
  }

  // 3d. Weak business relevance despite statutory eligibility
  if (isEligible && businessRelevance && businessRelevance.relevanceLevel === 'LOW') {
    return semanticAction('EXPLORE_PRIMARY_NEED', 'medium', 'alternatives');
  }

  // 4. Scheme trust profile indicates outdated information -> Verify Guidelines
  if (isTrustOutdated) {
    return semanticAction('VERIFY_INFORMATION', 'medium', 'portal', scheme.officialPortalUrl);
  }

  // 5. Strong Eligible Match + High Business Need Fit -> Prepare Documents & Apply
  if (isEligible && matchPercentage >= 80) {
    if (businessRelevance && businessRelevance.relevanceLevel === 'HIGH') {
      return semanticAction('PREPARE_DOCUMENTS', 'high', 'checklist');
    }

    if (scheme.requiredDocuments && scheme.requiredDocuments.length >= 4) {
      return semanticAction('PREPARE_DOCUMENTS', 'high', 'checklist');
    }

    return semanticAction('VISIT_OFFICIAL_PORTAL', 'high', 'portal', scheme.officialPortalUrl);
  }

  // 6. Near Match -> Review specific gap and prepare
  return semanticAction('CHECK_ELIGIBILITY', 'medium', 'details');
}

export { getLocalizedNextBestAction as getNextBestAction } from '../../i18n/decisionActionI18n';
