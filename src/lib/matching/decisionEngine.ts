import { MatchResult, UserProfile } from '../../types';

export type NextActionType =
  | 'COMPLETE_PROFILE'
  | 'CHECK_ELIGIBILITY'
  | 'PREPARE_DOCUMENTS'
  | 'VERIFY_INFORMATION'
  | 'EXPLORE_ALTERNATIVES'
  | 'VISIT_OFFICIAL_PORTAL';

export interface NextBestAction {
  actionType: NextActionType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  badgeText: string;
  buttonLabel: string;
  actionTarget: 'portal' | 'checklist' | 'alternatives' | 'form' | 'details' | 'compare';
  actionUrl?: string;
}

/**
 * Authoritative Decision Layer:
 * Evaluates the authoritative MatchResult and user context to synthesize
 * the exact, highest-utility Next Best Action for the entrepreneur.
 */
export function getNextBestAction(
  matchResult: MatchResult,
  profile: UserProfile,
  lang: 'hi' | 'en' = 'en'
): NextBestAction {
  const isHi = lang === 'hi';
  const { scheme, isEligible, matchPercentage, confirmedBlockers, unknownCriteria } = matchResult;

  const hasBlockers = (confirmedBlockers && confirmedBlockers.length > 0);
  const hasUnknowns = (unknownCriteria && unknownCriteria.length > 0);
  const isTrustOutdated =
    scheme.trustProfile?.freshness.status === 'OUTDATED' ||
    scheme.trustProfile?.freshness.status === 'DUE_FOR_REVIEW';

  // 1. Confirmed Statutory Blocker -> Recommend Alternatives
  if (hasBlockers || matchResult.eligibilityClassification === 'BLOCKED') {
    return {
      actionType: 'EXPLORE_ALTERNATIVES',
      title: isHi ? 'वैकल्पिक योजनाएं खोजें' : 'Explore Qualified Alternatives',
      description: isHi
        ? 'इस योजना में वैधानिक प्रतिबंध हैं। अपनी प्रोफ़ाइल के अनुकूल अन्य योजनाएं देखें।'
        : 'Statutory criteria not met for this scheme. Explore tailored schemes suited for your business.',
      priority: 'high',
      badgeText: isHi ? 'विकल्प उपलब्ध' : 'Alternatives Ready',
      buttonLabel: isHi ? 'विकल्प देखें' : 'View Alternatives',
      actionTarget: 'alternatives',
      actionUrl: `#alternatives-${scheme.id}`,
    };
  }

  // 2. Missing Profile Information -> Complete Profile
  if (hasUnknowns || matchResult.eligibilityClassification === 'NEEDS_INFORMATION') {
    return {
      actionType: 'COMPLETE_PROFILE',
      title: isHi ? 'प्रोफ़ाइल विवरण पूर्ण करें' : 'Complete Profile Verification',
      description: isHi
        ? 'अनिर्दिष्ट जानकारी प्रदान करके निश्चित पात्रता स्थिति जानें।'
        : 'Provide unspecified details (e.g. registration, turnover) to confirm statutory qualification.',
      priority: 'high',
      badgeText: isHi ? 'जानकारी आवश्यक' : 'Info Needed',
      buttonLabel: isHi ? 'विवरण भरें' : 'Update Profile',
      actionTarget: 'form',
    };
  }

  // 3. Scheme trust profile indicates outdated information -> Verify Guidelines
  if (isTrustOutdated) {
    return {
      actionType: 'VERIFY_INFORMATION',
      title: isHi ? 'नवीनतम दिशानिर्देश जांचें' : 'Verify Current Notification',
      description: isHi
        ? 'आवेदन से पूर्व विभाग की आधिकारिक अधिसूचना एवं दिशानिर्देश अवश्य जांचें।'
        : 'Check the official ministry notification for recent amendments or quota revisions.',
      priority: 'medium',
      badgeText: isHi ? 'पुष्टि आवश्यक' : 'Review Due',
      buttonLabel: isHi ? 'अधिसूचना देखें' : 'Check Portal',
      actionTarget: 'portal',
      actionUrl: scheme.officialPortalUrl,
    };
  }

  // 4. Strong Eligible Match with verified portal -> Visit Portal or Prepare Docs
  if (isEligible && matchPercentage >= 80) {
    if (scheme.requiredDocuments && scheme.requiredDocuments.length >= 4) {
      return {
        actionType: 'PREPARE_DOCUMENTS',
        title: isHi ? 'दस्तावेज चेकलिस्ट तैयार करें' : 'Prepare Statutory Checklist',
        description: isHi
          ? `योजना हेतु आवश्यक ${scheme.requiredDocuments.length} दस्तावेज तैयार रखें ताकि आवेदन में विलंब न हो।`
          : `Prepare all ${scheme.requiredDocuments.length} required verification documents before applying.`,
        priority: 'high',
        badgeText: isHi ? 'आवेदन तैयार' : 'Ready to Apply',
        buttonLabel: isHi ? 'चेकलिस्ट देखें' : 'View Checklist',
        actionTarget: 'checklist',
      };
    }

    return {
      actionType: 'VISIT_OFFICIAL_PORTAL',
      title: isHi ? 'आधिकारिक पोर्टल पर आवेदन करें' : 'Apply on Official Portal',
      description: isHi
        ? 'आपकी प्रोफ़ाइल पूर्णतः अनुकूल है। सीधे सरकारी पोर्टल पर आवेदन आरंभ करें।'
        : 'Your profile satisfies all core statutory criteria. Proceed directly to the government portal.',
      priority: 'high',
      badgeText: isHi ? 'पात्र - सीधे आवेदन' : 'Eligible to Apply',
      buttonLabel: isHi ? 'पोर्टल पर जाएं' : 'Open Portal',
      actionTarget: 'portal',
      actionUrl: scheme.officialPortalUrl,
    };
  }

  // 5. Near Match -> Review specific gap and prepare
  return {
    actionType: 'CHECK_ELIGIBILITY',
    title: isHi ? 'पात्रता अंतर की समीक्षा करें' : 'Review Eligibility Requirements',
    description: isHi
      ? 'समीप मिलान: मामूली शर्तों को पूरा करके पात्रता प्राप्त की जा सकती है।'
      : 'Near match: Review statutory details to determine compliance pathway.',
    priority: 'medium',
    badgeText: isHi ? 'समीक्षा योग्य' : 'Review Gap',
    buttonLabel: isHi ? 'शर्तें देखें' : 'Review Criteria',
    actionTarget: 'details',
  };
}
