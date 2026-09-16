/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionPriority,
  ApplicationRecord,
  OpportunityItem,
  OpportunityLifecycle,
  Phase3MatchResult,
  Scheme,
  UserDocumentState,
  UserProfile,
} from '../../types';
import { getSchemeDocumentReadiness } from '../documents/documentReadiness';

/**
 * Maps existing application tracker statuses and user interactions to presentation-level OpportunityLifecycle.
 * Preserves existing tracker semantics: interested, docs-ready, applied, approved.
 */
export function determineOpportunityLifecycle(
  applicationRecord?: ApplicationRecord,
  isSaved?: boolean,
  documentProgress?: { prepared: number; total: number }
): OpportunityLifecycle {
  if (!applicationRecord) {
    if (isSaved) return 'SAVED';
    return 'DISCOVERED';
  }

  switch (applicationRecord.status) {
    case 'approved':
      return 'COMPLETED';
    case 'applied':
      return 'TRACKING';
    case 'docs-ready':
      return 'READY_TO_APPLY';
    case 'preparing':
      return 'PREPARING';
    case 'interested':
      if (documentProgress && documentProgress.prepared > 0) {
        return 'PREPARING';
      }
      return 'REVIEWED';
    default:
      return 'DISCOVERED';
  }
}

/**
 * Authoritative Phase 6 Action Priority Engine.
 * Answers: "Which opportunity should the entrepreneur act on first?"
 *
 * Deterministic priorities:
 * - ACTION_NOW: High match, eligible, no blockers, ready or preparing documents, active official channel
 * - HIGH_PRIORITY: High match, good fit, but requires preparation
 * - INFORMATION_NEEDED: Incomplete profile / unknown criteria hindering confident decision
 * - REVIEW: Moderate match or lower urgency
 * - LOW_PRIORITY: Low match, mismatch, or confirmed blocker
 *
 * CRITICAL RULE: Confirmed blocker can NEVER be ACTION_NOW.
 */
export function calculateActionPriority(
  matchResult: Phase3MatchResult,
  scheme: Scheme,
  applicationRecord?: ApplicationRecord,
  userDocs: Record<string, UserDocumentState> = {},
  profile?: UserProfile
): ActionPriority {
  // RULE 1: Confirmed blocker -> NEVER ACTION_NOW
  if (matchResult.hasBlocker || !matchResult.isEligible) {
    return 'LOW_PRIORITY';
  }

  const docReadiness = getSchemeDocumentReadiness(scheme, userDocs);
  const matchScore = matchResult.totalMatchScore;
  const isApplied = applicationRecord?.status === 'applied' || applicationRecord?.status === 'approved';

  // If already applied/approved, it is in tracking phase
  if (isApplied) {
    return 'REVIEW';
  }

  // RULE 2: High match with significant missing information / unknown criteria
  // If user profile has unknown fields impacting this scheme, prompt for information
  if (matchResult.unknownCriteriaCount >= 2 || (profile?.annualIncome === undefined && scheme.maxIncome)) {
    if (matchScore >= 70) {
      return 'INFORMATION_NEEDED';
    }
  }

  // RULE 3: Ready to Apply or Preparing with high match
  const isReadyToApply = applicationRecord?.status === 'docs-ready' || docReadiness.isAllPrepared;
  const isPreparing = applicationRecord?.status === 'preparing' || docReadiness.prepared >= 2;

  if (matchScore >= 80) {
    if (isReadyToApply || isPreparing) {
      return 'ACTION_NOW';
    }
    return 'HIGH_PRIORITY';
  }

  if (matchScore >= 65) {
    if (isReadyToApply) {
      return 'REVIEW';
    }
    return 'REVIEW';
  }

  return 'LOW_PRIORITY';
}

/**
 * Builds the complete OpportunityItem including "Why this scheme — and why now?" and next best action.
 */
export function buildOpportunityItem(
  scheme: Scheme,
  matchResult: Phase3MatchResult,
  applicationRecord: ApplicationRecord | undefined,
  isSaved: boolean,
  userDocs: Record<string, UserDocumentState>,
  profile: UserProfile
): OpportunityItem {
  const docReadiness = getSchemeDocumentReadiness(scheme, userDocs);
  const actionPriority = calculateActionPriority(matchResult, scheme, applicationRecord, userDocs, profile);
  const lifecycleStage = determineOpportunityLifecycle(applicationRecord, isSaved, {
    prepared: docReadiness.prepared,
    total: docReadiness.total,
  });

  // Next Best Action determination
  let actionText = 'Explore Scheme Details';
  let actionTextHi = 'योजना विवरण देखें';
  let reasonText = 'Review scheme guidelines and official eligibility terms.';
  let reasonTextHi = 'योजना के दिशानिर्देश और पात्रता शर्तों की समीक्षा करें।';
  let targetWorkspace: 'WORKSPACE' | 'TRACKER' | 'PROFILE' | 'OFFICIAL_PORTAL' = 'WORKSPACE';

  if (matchResult.hasBlocker) {
    actionText = 'Ineligible — View Alternatives';
    actionTextHi = 'अपात्र — वैकल्पिक योजनाएं देखें';
    reasonText = 'Your profile does not satisfy one or more statutory eligibility criteria.';
    reasonTextHi = 'आपकी प्रोफ़ाइल वैधानिक पात्रता मानदंडों को पूरा नहीं करती है।';
    targetWorkspace = 'WORKSPACE';
  } else if (actionPriority === 'INFORMATION_NEEDED') {
    actionText = 'Complete Profile Details';
    actionTextHi = 'प्रोफ़ाइल विवरण पूरा करें';
    reasonText = 'Provide missing information to confirm higher subsidy and exact eligibility.';
    reasonTextHi = 'सटीक पात्रता और सब्सिडी की पुष्टि के लिए छूटी हुई जानकारी दें।';
    targetWorkspace = 'PROFILE';
  } else if (applicationRecord?.status === 'applied') {
    actionText = 'Track Application Progress';
    actionTextHi = 'आवेदन की प्रगति ट्रैक करें';
    reasonText = 'Check official portal updates and follow-up timeline.';
    reasonTextHi = 'आधिकारिक पोर्टल अपडेट और समयसीमा देखें।';
    targetWorkspace = 'TRACKER';
  } else if (docReadiness.isAllPrepared || applicationRecord?.status === 'docs-ready') {
    actionText = 'Proceed to Official Portal';
    actionTextHi = 'आधिकारिक पोर्टल पर आगे बढ़ें';
    reasonText = 'All required documents are prepared. Ready for official filing.';
    reasonTextHi = 'सभी आवश्यक दस्तावेज तैयार हैं। आधिकारिक आवेदन के लिए तैयार।';
    targetWorkspace = 'OFFICIAL_PORTAL';
  } else {
    // Find first unprepared mandatory document
    const unpreparedDoc = scheme.requiredDocuments.find(d => {
      const key = d.type === 'REUSABLE' ? d.id : `${scheme.id}_${d.id}`;
      const state = userDocs[key] || userDocs[d.id];
      return !state || state.status !== 'PREPARED';
    });

    if (unpreparedDoc) {
      actionText = `Prepare ${unpreparedDoc.name}`;
      actionTextHi = `${unpreparedDoc.nameHi} तैयार करें`;
      reasonText = `This will move your ${scheme.code} application closer to Ready to Apply.`;
      reasonTextHi = `यह आपके ${scheme.code} आवेदन को आवेदन के लिए तैयार स्थिति के करीब ले जाएगा।`;
      targetWorkspace = 'WORKSPACE';
    } else {
      actionText = 'Continue Application Preparation';
      actionTextHi = 'आवेदन की तैयारी जारी रखें';
      reasonText = `Advance preparation for ${scheme.code}.`;
      reasonTextHi = `${scheme.code} के लिए तैयारी आगे बढ़ाएं।`;
      targetWorkspace = 'WORKSPACE';
    }
  }

  // Why this scheme points
  const points: { text: string; textHi: string; type: 'positive' | 'neutral' | 'attention' }[] = [];

  if (matchResult.socialCategoryScore >= 25) {
    points.push({
      text: 'Strong social-category alignment and subsidy eligibility',
      textHi: 'मजबूत सामाजिक श्रेणी संरेखण और सब्सिडी पात्रता',
      type: 'positive',
    });
  }
  if (matchResult.businessTypeScore === 25) {
    points.push({
      text: `Directly supports ${profile.businessType || 'enterprise'} operations`,
      textHi: `सीधे ${profile.businessType || 'उद्यम'} संचालन का समर्थन करता है`,
      type: 'positive',
    });
  }
  if (matchResult.financialFit.fitsBudget) {
    points.push({
      text: 'Financial scale and investment fit within loan ceilings',
      textHi: 'वित्तीय स्तर और निवेश ऋण सीमा के अनुकूल है',
      type: 'positive',
    });
  }
  if (scheme.level === 'state' && profile.state?.toLowerCase() === scheme.state?.toLowerCase()) {
    points.push({
      text: `Dedicated state government support in ${scheme.state}`,
      textHi: `${scheme.state} में समर्पित राज्य सरकार की सहायता`,
      type: 'positive',
    });
  }
  if (scheme.freshnessStatus === 'NEEDS_VERIFICATION') {
    points.push({
      text: 'Scheme audit date older than 180 days; review official source',
      textHi: 'योजना की समीक्षा 180 दिनों से अधिक पुरानी है; आधिकारिक स्रोत देखें',
      type: 'attention',
    });
  }

  return {
    scheme,
    matchResult,
    actionPriority,
    lifecycleStage,
    applicationStatus: applicationRecord?.status,
    isSaved,
    documentReadiness: {
      total: docReadiness.total,
      prepared: docReadiness.prepared,
      needsPreparation: docReadiness.needsPreparation,
      unknown: docReadiness.unknown,
      isReady: docReadiness.isAllPrepared,
    },
    nextBestAction: {
      actionText,
      actionTextHi,
      reasonText,
      reasonTextHi,
      targetWorkspace,
    },
    whyThisScheme: {
      points,
    },
  };
}

export const determineActionPriority = calculateActionPriority;
