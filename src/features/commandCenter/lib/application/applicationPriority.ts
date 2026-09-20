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
function determineOpportunityLifecycle(
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
function calculateActionPriority(
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

import type { Language } from '../../../../i18n/types';

const ACTION_TEMPLATES: Record<
  string,
  { action: Record<Language, string>; reason: Record<Language, string> }
> = {
  EXPLORE_DETAILS: {
    action: {
      en: 'Explore Scheme Details',
      hi: 'योजना विवरण देखें',
      ta: 'திட்ட விவரங்களை ஆராயுங்கள்',
      te: 'పథకం వివరాలను అన్వేషించండి',
      kn: 'ಯೋಜನೆಯ ವಿವರಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
      ml: 'പദ്ധതിയുടെ വിശദാംശങ്ങൾ പരിശോധിക്കുക',
    },
    reason: {
      en: 'Review scheme guidelines and official eligibility terms.',
      hi: 'योजना के दिशानिर्देश और पात्रता शर्तों की समीक्षा करें।',
      ta: 'திட்ட வழிகாட்டுதல்கள் மற்றும் அதிகாரப்பூர்வ தகுதி விதிமுறைகளை மதிப்பாய்வு செய்யவும்.',
      te: 'పథకం మార్గదర్శకాలు మరియు అధికారిక అర్హత నిబంధనలను సమీక్షించండి.',
      kn: 'ಯೋಜನೆಯ ಮಾರ್ಗಸೂಚಿಗಳು ಮತ್ತು ಅಧಿಕೃತ ಅರ್ಹತಾ ನಿಯಮಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
      ml: 'പദ്ധതി മാർഗ്ഗനിർദ്ദേശങ്ങളും ഔദ്യോഗിക യോഗ്യതാ നിബന്ധനകളും അവലോകനം ചെയ്യുക.',
    },
  },
  INELIGIBLE_ALTERNATIVES: {
    action: {
      en: 'Ineligible — View Alternatives',
      hi: 'अपात्र — वैकल्पिक योजनाएं देखें',
      ta: 'தகுதியற்றது — மாற்று வழிகளைப் பார்க்கவும்',
      te: 'అనర్హమైనది — ప్రత్యామ్నాయాలను చూడండి',
      kn: 'ಅನರ್ಹ — ಪರ್ಯಾಯಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      ml: 'യോഗ്യതയില്ല — ഇതര പദ്ധതികൾ കാണുക',
    },
    reason: {
      en: 'Your profile does not satisfy one or more statutory eligibility criteria.',
      hi: 'आपकी प्रोफ़ाइल वैधानिक पात्रता मानदंडों को पूरा नहीं करती है।',
      ta: 'உங்கள் சுயவிவரம் சட்டப்பூர்வ தகுதி வரம்புகளை பூர்த்தி செய்யவில்லை.',
      te: 'మీ ప్రొఫైల్ చట్టబద్ధమైన అర్హత ప్రమాణాలను సంతృప్తి పరచడం లేదు.',
      kn: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಶಾಸನಬದ್ಧ ಅರ್ಹತಾ ಮಾನದಂಡಗಳನ್ನು ಪೂರೈಸುತ್ತಿಲ್ಲ.',
      ml: 'നിങ്ങളുടെ പ്രൊഫൈൽ നിയമാനുസൃതമായ യോഗ്യതാ മാനദണ്ഡങ്ങൾ പാലിക്കുന്നില്ല.',
    },
  },
  COMPLETE_PROFILE: {
    action: {
      en: 'Complete Profile Details',
      hi: 'प्रोफ़ाइल विवरण पूरा करें',
      ta: 'சுயவிவர விவரங்களை முடிக்கவும்',
      te: 'ప్రొఫైల్ వివరాలను పూర్తి చేయండి',
      kn: 'ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ',
      ml: 'പ്രൊഫൈൽ വിവരങ്ങൾ പൂർത്തിയാക്കുക',
    },
    reason: {
      en: 'Provide missing information to confirm higher subsidy and exact eligibility.',
      hi: 'सटीक पात्रता और सब्सिडी की पुष्टि के लिए छूटी हुई जानकारी दें।',
      ta: 'துல்லியமான தகுதி மற்றும் மானியத்தை உறுதிப்படுத்த விடுபட்ட தகவலை வழங்கவும்.',
      te: 'ఖచ్చితమైన అర్హత మరియు సబ్సిడీని ధృవీకరించడానికి మిగిలిన సమాచారాన్ని అందించండి.',
      kn: 'ನಿಖರವಾದ ಅರ್ಹತೆ ಮತ್ತು ಸಬ್ಸಿಡಿಯನ್ನು ದೃಢೀಕರಿಸಲು ಕಾಣೆಯಾದ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಿ.',
      ml: 'കൃത്യമായ യോഗ്യതയും സബ്‌സിഡിയും ഉറപ്പാക്കാൻ വിട്ടുപോയ വിവരങ്ങൾ നൽകുക.',
    },
  },
  TRACK_PROGRESS: {
    action: {
      en: 'Track Application Progress',
      hi: 'आवेदन की प्रगति ट्रैक करें',
      ta: 'விண்ணப்ப முன்னேற்றத்தைக் கண்காணிக்கவும்',
      te: 'దరఖాస్తు పురోగతిని ట్రాక్ చేయండి',
      kn: 'ಅರ್ಜಿ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      ml: 'അപേക്ഷയുടെ പുരോഗതി നിരീക്ഷിക്കുക',
    },
    reason: {
      en: 'Check official portal updates and follow-up timeline.',
      hi: 'आधिकारिक पोर्टल अपडेट और समयसीमा देखें।',
      ta: 'அதிகாரப்பூர்வ போர்டல் புதுப்பிப்புகள் மற்றும் பின்தொடர்தல் காலவரிசையை சரிபார்க்கவும்.',
      te: 'అధికారిక పోర్టల్ అప్‌డేట్‌లు మరియు ఫాలో-అప్ సమయాన్ని తనిఖీ చేయండి.',
      kn: 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ನವೀಕರಣಗಳು ಮತ್ತು ಫಾಲೋ-ಅಪ್ ಸಮಯವನ್ನು ಪರಿಶೀಲಿಸಿ.',
      ml: 'ഔദ്യോഗിക പോർട്ടൽ വിവരങ്ങളും ഫോളോ-അപ്പ് സമയക്രമവും പരിശോധിക്കുക.',
    },
  },
  PROCEED_OFFICIAL_PORTAL: {
    action: {
      en: 'Proceed to Official Portal',
      hi: 'आधिकारिक पोर्टल पर आगे बढ़ें',
      ta: 'அதிகாரப்பூர்வ போர்ட்டலுக்கு செல்லவும்',
      te: 'అధికారిక పోర్టల్‌కు వెళ్లండి',
      kn: 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
      ml: 'ഔദ്യോഗിക പോർട്ടലിലേക്ക് പോകുക',
    },
    reason: {
      en: 'All required documents are prepared. Ready for official filing.',
      hi: 'सभी आवश्यक दस्तावेज तैयार हैं। आधिकारिक आवेदन के लिए तैयार।',
      ta: 'தேவையான அனைத்து ஆவணங்களும் தயாராக உள்ளன. அதிகாரப்பூர்வ பதிவுக்கு தயார்.',
      te: 'అవసరమైన అన్ని పత్రాలు సిద్ధంగా ఉన్నాయి. అధికారిక సమర్పణకు సిద్ధం.',
      kn: 'ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ದಾಖಲೆಗಳು ಸಿದ್ಧವಾಗಿವೆ. ಅಧಿಕೃತ ಸಲ್ಲಿಕೆಗೆ ಸಿದ್ಧವಾಗಿದೆ.',
      ml: 'ആവശ്യമായ എല്ലാ രേഖകളും തയ്യാറാണ്. ഔദ്യോഗിക ഫയലിംഗിന് തയ്യാറാണ്.',
    },
  },
  CONTINUE_PREPARATION: {
    action: {
      en: 'Continue Application Preparation',
      hi: 'आवेदन की तैयारी जारी रखें',
      ta: 'விண்ணப்பத் தயாரிப்பைத் தொடரவும்',
      te: 'దరఖాస్తు తయారీని కొనసాగించండి',
      kn: 'ಅರ್ಜಿ ಸಿದ್ಧತೆಯನ್ನು ಮುಂದುವರಿಸಿ',
      ml: 'അപേക്ഷാ തയ്യാറെടുപ്പ് തുടരുക',
    },
    reason: {
      en: 'Advance preparation for this scheme.',
      hi: 'इस योजना के लिए तैयारी आगे बढ़ाएं।',
      ta: 'இந்த திட்டத்திற்கான தயாரிப்பை முன்னேற்றுங்கள்.',
      te: 'ఈ పథకం కోసం తయారీని ముమ్మరం చేయండి.',
      kn: 'ಈ ಯೋಜನೆಗಾಗಿ ಸಿದ್ಧತೆಯನ್ನು ಮುಂದುವರಿಸಿ.',
      ml: 'ഈ പദ്ധതിക്കായുള്ള തയ്യാറെടുപ്പ് മുന്നോട്ട് കൊണ്ടുപോകുക.',
    },
  },
};

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

  let actionKey = 'EXPLORE_DETAILS';
  let targetWorkspace: 'WORKSPACE' | 'TRACKER' | 'PROFILE' | 'OFFICIAL_PORTAL' = 'WORKSPACE';
  let customActionLocalized: Record<Language, string> | undefined;
  let customReasonLocalized: Record<Language, string> | undefined;

  if (matchResult.hasBlocker) {
    actionKey = 'INELIGIBLE_ALTERNATIVES';
    targetWorkspace = 'WORKSPACE';
  } else if (actionPriority === 'INFORMATION_NEEDED') {
    actionKey = 'COMPLETE_PROFILE';
    targetWorkspace = 'PROFILE';
  } else if (applicationRecord?.status === 'applied') {
    actionKey = 'TRACK_PROGRESS';
    targetWorkspace = 'TRACKER';
  } else if (docReadiness.isAllPrepared || applicationRecord?.status === 'docs-ready') {
    actionKey = 'PROCEED_OFFICIAL_PORTAL';
    targetWorkspace = 'OFFICIAL_PORTAL';
  } else {
    // Find first unprepared mandatory document
    const unpreparedDoc = scheme.requiredDocuments.find(d => {
      const key = d.type === 'REUSABLE' ? d.id : `${scheme.id}_${d.id}`;
      const state = userDocs[key] || userDocs[d.id];
      return !state || state.status !== 'PREPARED';
    });

    if (unpreparedDoc) {
      targetWorkspace = 'WORKSPACE';
      customActionLocalized = {
        en: `Prepare ${unpreparedDoc.name}`,
        hi: `${unpreparedDoc.nameHi || unpreparedDoc.name} तैयार करें`,
        ta: `${unpreparedDoc.name} தயார் செய்யவும்`,
        te: `${unpreparedDoc.name} సిద్ధం చేయండి`,
        kn: `${unpreparedDoc.name} ಸಿದ್ಧಪಡಿಸಿ`,
        ml: `${unpreparedDoc.name} തയ്യാറാക്കുക`,
      };
      customReasonLocalized = {
        en: `This will move your ${scheme.code} application closer to Ready to Apply.`,
        hi: `यह आपके ${scheme.code} आवेदन को आवेदन के लिए तैयार स्थिति के करीब ले जाएगा।`,
        ta: `இது உங்கள் ${scheme.code} விண்ணப்பத்தை விண்ணப்பிக்க தயார் நிலைக்கு கொண்டு செல்லும்.`,
        te: `ఇది మీ ${scheme.code} దరఖాస్తును దరఖాస్తుకు సిద్ధం స్థితికి చేరుస్తుంది.`,
        kn: `ಇದು ನಿಮ್ಮ ${scheme.code} ಅರ್ಜಿಯನ್ನು ಅರ್ಜಿಗೆ ಸಿದ್ಧ ಸ್ಥಿತಿಯ ಹತ್ತಿರಕ್ಕೆ ಕೊಂಡೊಯ್ಯುತ್ತದೆ.`,
        ml: `ഇത് നിങ്ങളുടെ ${scheme.code} അപേക്ഷയെ തയ്യാറായ അവസ്ഥയിലേക്ക് അടുപ്പിക്കും.`,
      };
    } else {
      actionKey = 'CONTINUE_PREPARATION';
      targetWorkspace = 'WORKSPACE';
      customReasonLocalized = {
        en: `Advance preparation for ${scheme.code}.`,
        hi: `${scheme.code} के लिए तैयारी आगे बढ़ाएं।`,
        ta: `${scheme.code} க்கான தயாரிப்பை முன்னேற்றுங்கள்.`,
        te: `${scheme.code} కోసం తయారీని ముమ్మరం చేయండి.`,
        kn: `${scheme.code} ಗಾಗಿ ಸಿದ್ಧತೆಯನ್ನು ಮುಂದುವರಿಸಿ.`,
        ml: `${scheme.code} നായുള്ള തയ്യാറെടുപ്പ് മുന്നോട്ട് കൊണ്ടുപോകുക.`,
      };
    }
  }

  const template = ACTION_TEMPLATES[actionKey] || ACTION_TEMPLATES.EXPLORE_DETAILS;
  const actionLocalized = customActionLocalized || template.action;
  const reasonLocalized = customReasonLocalized || template.reason;

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
      actionText: actionLocalized.en,
      actionTextHi: actionLocalized.hi,
      reasonText: reasonLocalized.en,
      reasonTextHi: reasonLocalized.hi,
      actionLocalized,
      reasonLocalized,
      targetWorkspace,
    },
    whyThisScheme: {
      points,
    },
  };
}

