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
 * Authoritative Decision Layer (Phase 3.1 + Phase 4.1 Enhanced):
 * Evaluates the authoritative MatchResult, statutory audit, and business-need intelligence
 * to synthesize the exact, highest-utility Next Best Action for the entrepreneur.
 */
export function getNextBestAction(
  matchResult: MatchResult,
  profile: UserProfile,
  lang: 'hi' | 'en' = 'en'
): NextBestAction {
  const isHi = lang === 'hi';
  const { scheme, isEligible, matchPercentage, confirmedBlockers, unknownCriteria, businessRelevance } = matchResult;

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

  // 2. Missing Core Statutory Information -> Complete Profile
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
    return {
      actionType: 'CONFIRM_REGISTRATION',
      title: isHi ? 'व्यवसाय पंजीकरण स्थिति की पुष्टि करें' : 'Confirm Business Registration',
      description: isHi
        ? 'यह योजना औपचारिक पंजीकरण (MSME/Udyam) मांगती है। अपनी पंजीकरण स्थिति स्पष्ट करें।'
        : 'This scheme requires formal registration. Confirm your Udyam/trade status.',
      priority: 'medium',
      badgeText: isHi ? 'पंजीकरण जांच' : 'Registration Check',
      buttonLabel: isHi ? 'स्थिति अपडेट करें' : 'Update Registration',
      actionTarget: 'form',
    };
  }

  // 3b. If user has no business details at all
  if (!hasBusinessDetails) {
    return {
      actionType: 'COMPLETE_BUSINESS_PROFILE',
      title: isHi ? 'व्यवसाय प्रोफ़ाइल पूर्ण करें' : 'Complete Your Business Profile',
      description: isHi
        ? 'परियोजना लागत, चरण और सहायता आवश्यकताएं जोड़कर सटीक सिफारिशें प्राप्त करें।'
        : 'Add project cost, stage, and support needs to unlock tailored scheme relevance.',
      priority: 'medium',
      badgeText: isHi ? 'व्यवसाय विवरण शेष' : 'Profile Incomplete',
      buttonLabel: isHi ? 'व्यवसाय विवरण जोड़ें' : 'Add Business Details',
      actionTarget: 'form',
    };
  }

  // 3c. If business defined but funding requirement is missing
  if (profile.totalProjectCost === undefined && profile.fundingGap === undefined) {
    return {
      actionType: 'ADD_FUNDING_REQUIREMENT',
      title: isHi ? 'वित्तीय आवश्यकता दर्ज करें' : 'Add Your Funding Requirement',
      description: isHi
        ? 'परियोजना लागत और निवेश जोड़ें ताकि वित्तीय अंतर (Funding Gap) का सटीक मिलान हो सके।'
        : 'Provide project cost and existing investment to compute accurate funding gap alignment.',
      priority: 'medium',
      badgeText: isHi ? 'फंडिंग विवरण शेष' : 'Funding Needed',
      buttonLabel: isHi ? 'फंडिंग जोड़ें' : 'Add Funding Cost',
      actionTarget: 'form',
    };
  }

  // 3d. Weak business relevance despite statutory eligibility
  if (isEligible && businessRelevance && businessRelevance.relevanceLevel === 'LOW') {
    return {
      actionType: 'EXPLORE_PRIMARY_NEED',
      title: isHi ? 'प्राथमिक आवश्यकता के अनुकूल योजनाएं देखें' : 'Explore Schemes For Your Need',
      description: isHi
        ? 'आप इस योजना के लिए पात्र हैं, परंतु यह आपकी मुख्य सहायता आवश्यकता को पूरा नहीं करती।'
        : 'You qualify statutorily, but this scheme does not directly fulfill your primary business need.',
      priority: 'medium',
      badgeText: isHi ? 'कम प्रासंगिकता' : 'Low Need Alignment',
      buttonLabel: isHi ? 'अन्य योजनाएं खोजें' : 'Explore Other Schemes',
      actionTarget: 'alternatives',
    };
  }

  // 4. Scheme trust profile indicates outdated information -> Verify Guidelines
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

  // 5. Strong Eligible Match + High Business Need Fit -> Prepare Documents & Apply
  if (isEligible && matchPercentage >= 80) {
    if (businessRelevance && businessRelevance.relevanceLevel === 'HIGH') {
      return {
        actionType: 'PREPARE_DOCUMENTS',
        title: isHi ? 'दस्तावेज तैयार करें एवं आवेदन करें' : 'Review Documents & Prepare to Apply',
        description: isHi
          ? 'यह योजना आपकी प्रोफ़ाइल और व्यावसायिक आवश्यकता दोनों के पूर्णतः अनुकूल है। दस्तावेज तैयार करें।'
          : 'High statutory match and high business-need alignment. Review document checklist and prepare application.',
        priority: 'high',
        badgeText: isHi ? 'उच्च व्यावसायिक उपयुक्तता' : 'High Priority Fit',
        buttonLabel: isHi ? 'दस्तावेज चेकलिस्ट' : 'Review Documents',
        actionTarget: 'checklist',
      };
    }

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

  // 6. Near Match -> Review specific gap and prepare
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
