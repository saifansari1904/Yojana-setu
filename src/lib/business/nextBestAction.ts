import { MatchResult, UserProfile } from '../../types';
import { BusinessNeedProfile } from '../../types/business';
import {
  ApplicationReadiness,
  PathwayAction,
  PathwayActionStatus,
  PathwayActionType,
  PathwayActionTarget,
  PreparationChecklistResult,
  SupportArea,
  SupportStackGroup,
} from '../../types/supportPathway';
import { calculateBusinessProfileCompleteness } from './businessProfileCompleteness';
import { formatLakhCrore } from './fundingCalculator';
import { getIncompleteRegistrationRecords } from '../registrations/registrationModel';

interface PathwayActionSet {
  /** Exactly one primary action. Never undefined. */
  primary: PathwayAction;
  secondary: PathwayAction[];
  blocked: PathwayAction[];
  completed: PathwayAction[];
}

interface DerivePathwayActionInput {
  profile: UserProfile;
  needProfile: BusinessNeedProfile;
  matchResults: MatchResult[];
  selectedMatch?: MatchResult | null;
  checklist: PreparationChecklistResult;
  readiness: ApplicationReadiness;
  supportStack: SupportStackGroup[];
}

interface ActionSeed {
  id: string;
  actionType: PathwayActionType;
  priority: number;
  status: PathwayActionStatus;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  reasonEn: string;
  reasonHi: string;
  ctaLabelEn: string;
  ctaLabelHi: string;
  actionTarget: PathwayActionTarget;
  actionUrl?: string;
  supportArea?: SupportArea;
  relatedSchemeIds?: string[];
  requiredBefore?: string[];
  officialAction?: boolean;
}

function toAction(seed: ActionSeed): PathwayAction {
  return {
    id: seed.id,
    actionType: seed.actionType,
    titleKey: `nextBestAction.${seed.id}.title`,
    descriptionKey: `nextBestAction.${seed.id}.description`,
    reasonKey: `nextBestAction.${seed.id}.reason`,
    ctaKey: `nextBestAction.${seed.id}.cta`,
    titleEn: seed.titleEn,
    titleHi: seed.titleHi,
    descriptionEn: seed.descriptionEn,
    descriptionHi: seed.descriptionHi,
    supportArea: seed.supportArea,
    status: seed.status,
    priority: seed.priority,
    reasonEn: seed.reasonEn,
    reasonHi: seed.reasonHi,
    relatedSchemeIds: seed.relatedSchemeIds || [],
    requiredBefore: seed.requiredBefore || [],
    officialAction: seed.officialAction === true,
    ctaLabelEn: seed.ctaLabelEn,
    ctaLabelHi: seed.ctaLabelHi,
    actionTarget: seed.actionTarget,
    actionUrl: seed.actionUrl,
  };
}

function requiresRegistration(match: MatchResult | null | undefined): boolean {
  if (!match) return false;
  const regReq = match.scheme.intelligence?.eligibility?.registrationRequirement;
  if (regReq !== undefined && regReq !== 'none') return true;
  return (match.scheme.requiredDocuments || []).some((d) => {
    const lower = d.toLowerCase();
    return lower.includes('udyam') || lower.includes('registration');
  });
}

function needsProjectReport(match: MatchResult | null | undefined): boolean {
  if (!match) return false;
  return (match.scheme.requiredDocuments || []).some((d) => {
    const lower = d.toLowerCase();
    return lower.includes('project report') || lower.includes('dpr') || lower.includes('quotation');
  });
}

/**
 * Phase 4.2 Next Best Action engine.
 *
 * Deterministic priority ladder (lower number = acted on first):
 *   1. Missing critical profile information
 *   2. Confirmed statutory blocker
 *   3. Unspecified statutory criteria (information needed, NOT a rejection)
 *   4. Missing required preparation / documents
 *   5. Registration prerequisite
 *   6. Project preparation
 *   7. Financial preparation
 *   8. Scheme comparison
 *   9. Official application
 *  10. Additional complementary support
 *
 * The same input always produces the same output: rules are evaluated in a
 * fixed order and no randomness, time, or ranking heuristics are involved.
 *
 * This engine complements — and does not replace — the Phase 3.1 per-scheme
 * decision layer in `lib/matching/decisionEngine.ts`. That one answers "what do
 * I do about THIS scheme"; this one answers "what do I do next overall".
 */
export function derivePathwayNextBestAction(
  input: DerivePathwayActionInput
): PathwayActionSet {
  const {
    profile,
    needProfile,
    matchResults,
    selectedMatch = null,
    checklist,
    supportStack,
  } = input;

  const candidates: PathwayAction[] = [];
  const blocked: PathwayAction[] = [];
  const completed: PathwayAction[] = [];

  const completeness = calculateBusinessProfileCompleteness(profile);
  const missingHigh = completeness.missingHighValueFields.filter((f) => f.priority === 'HIGH');
  const missingMedium = completeness.missingHighValueFields.filter((f) => f.priority === 'MEDIUM');
  const eligibleMatches = matchResults.filter((m) => m.isEligible);
  const selectedSchemeIds = selectedMatch ? [selectedMatch.scheme.id] : [];

  // ---------------------------------------------------------------------------
  // 1. Missing critical profile information
  // ---------------------------------------------------------------------------
  if (missingHigh.length > 0) {
    candidates.push(
      toAction({
        id: 'action-complete-profile',
        actionType: 'COMPLETE_PROFILE',
        priority: 1,
        status: 'NEEDS_INFORMATION',
        titleEn: 'Complete your business profile',
        titleHi: 'अपनी व्यावसायिक प्रोफ़ाइल पूर्ण करें',
        descriptionEn: `${missingHigh.length} key detail(s) are still missing.`,
        descriptionHi: `${missingHigh.length} महत्वपूर्ण विवरण अभी शेष हैं।`,
        reasonEn: `${missingHigh.map((f) => f.labelEn).join(', ')} not provided. This information is needed to evaluate support accurately.`,
        reasonHi: `${missingHigh.map((f) => f.labelHi).join(', ')} दर्ज नहीं। सहायता के सटीक आकलन हेतु यह जानकारी आवश्यक है।`,
        ctaLabelEn: 'Complete Profile',
        ctaLabelHi: 'प्रोफ़ाइल पूर्ण करें',
        actionTarget: 'form',
      })
    );
  } else {
    completed.push(
      toAction({
        id: 'action-complete-profile',
        actionType: 'COMPLETE_PROFILE',
        priority: 1,
        status: 'COMPLETED',
        titleEn: 'Business profile complete',
        titleHi: 'व्यावसायिक प्रोफ़ाइल पूर्ण',
        descriptionEn: 'All high-priority profile details are recorded.',
        descriptionHi: 'सभी महत्वपूर्ण प्रोफ़ाइल विवरण दर्ज हैं।',
        reasonEn: 'No high-priority profile fields are missing.',
        reasonHi: 'कोई महत्वपूर्ण प्रोफ़ाइल विवरण शेष नहीं।',
        ctaLabelEn: 'Review Profile',
        ctaLabelHi: 'प्रोफ़ाइल देखें',
        actionTarget: 'form',
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Confirmed statutory blocker on the scheme in focus
  // ---------------------------------------------------------------------------
  const confirmedBlockers = selectedMatch?.confirmedBlockers || [];
  if (selectedMatch && confirmedBlockers.length > 0) {
    const blockerAction = toAction({
      id: 'action-review-eligibility',
      actionType: 'REVIEW_SCHEME_ELIGIBILITY',
      priority: 2,
      status: 'BLOCKED',
      titleEn: 'Understand why you cannot proceed yet',
      titleHi: 'जानें कि अभी आगे क्यों नहीं बढ़ सकते',
      descriptionEn: `${confirmedBlockers.length} statutory requirement(s) are not satisfied for this scheme.`,
      descriptionHi: `इस योजना हेतु ${confirmedBlockers.length} वैधानिक शर्तें पूरी नहीं होतीं।`,
      reasonEn: confirmedBlockers
        .map((b) => `${b.factorLabel}: requirement is ${b.statutoryRequirement}; your profile states ${b.userValue}.`)
        .join(' '),
      reasonHi: confirmedBlockers
        .map((b) => `${b.factorLabel}: आवश्यकता ${b.statutoryRequirement}; आपकी प्रोफ़ाइल में ${b.userValue}।`)
        .join(' '),
      ctaLabelEn: 'Understand Requirement',
      ctaLabelHi: 'शर्त समझें',
      actionTarget: 'details',
      relatedSchemeIds: selectedSchemeIds,
    });
    blocked.push(blockerAction);
    candidates.push(blockerAction);
  }

  // ---------------------------------------------------------------------------
  // 3. Unspecified statutory criteria. Unknown is never treated as rejection.
  // ---------------------------------------------------------------------------
  const unknownCriteria = selectedMatch?.unknownCriteria || [];
  if (selectedMatch && confirmedBlockers.length === 0 && unknownCriteria.length > 0) {
    candidates.push(
      toAction({
        id: 'action-provide-missing-information',
        actionType: 'PROVIDE_MISSING_INFORMATION',
        priority: 3,
        status: 'NEEDS_INFORMATION',
        titleEn: 'Information needed',
        titleHi: 'जानकारी आवश्यक',
        descriptionEn: `${unknownCriteria.length} criterion/criteria cannot be assessed from your current profile.`,
        descriptionHi: `आपकी वर्तमान प्रोफ़ाइल से ${unknownCriteria.length} शर्तों का आकलन संभव नहीं।`,
        reasonEn: `${unknownCriteria.map((c) => c.factorLabel).join(', ')} not specified. This is unverified information, not a rejection.`,
        reasonHi: `${unknownCriteria.map((c) => c.factorLabel).join(', ')} अनिर्दिष्ट। यह अस्वीकृति नहीं, केवल असत्यापित जानकारी है।`,
        ctaLabelEn: 'Update Profile',
        ctaLabelHi: 'प्रोफ़ाइल अपडेट करें',
        actionTarget: 'form',
        relatedSchemeIds: selectedSchemeIds,
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Preparation / documents
  // ---------------------------------------------------------------------------
  const pendingDocs = checklist.totalCount - checklist.preparedCount;
  if (selectedMatch && checklist.totalCount > 0 && pendingDocs > 0) {
    candidates.push(
      toAction({
        id: 'action-prepare-documents',
        actionType: 'PREPARE_DOCUMENTS',
        priority: 4,
        status: confirmedBlockers.length > 0 ? 'BLOCKED' : 'READY',
        titleEn: 'Prepare your application documents',
        titleHi: 'आवेदन दस्तावेज तैयार करें',
        descriptionEn: `${pendingDocs} preparation item(s) remain before you can proceed.`,
        descriptionHi: `आगे बढ़ने से पूर्व ${pendingDocs} तैयारी मदें शेष हैं।`,
        reasonEn: `${checklist.preparedCount} of ${checklist.totalCount} documents listed in the scheme data are marked prepared.`,
        reasonHi: `योजना डेटा में सूचीबद्ध ${checklist.totalCount} में से ${checklist.preparedCount} दस्तावेज तैयार चिह्नित हैं।`,
        ctaLabelEn: 'View Checklist',
        ctaLabelHi: 'चेकलिस्ट देखें',
        actionTarget: 'checklist',
        relatedSchemeIds: selectedSchemeIds,
        requiredBefore: ['action-open-official-portal'],
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Registration prerequisite
  // ---------------------------------------------------------------------------
  const regStatus = needProfile.registrationStatus;
  // Incomplete per-record details (e.g. GST marked registered but the number
  // is missing) also surface through the existing COMPLETE_REGISTRATION
  // action — same action id, priority, and i18n keys; only the trigger widens.
  const hasIncompleteRegistrationDetails =
    getIncompleteRegistrationRecords(profile.businessRegistrations).length > 0;
  if (
    (regStatus === 'NOT_REGISTERED' ||
      regStatus === 'IN_PROCESS' ||
      hasIncompleteRegistrationDetails) &&
    (requiresRegistration(selectedMatch) ||
      supportStack.some((g) => g.area === 'BUSINESS_REGISTRATION'))
  ) {
    candidates.push(
      toAction({
        id: 'action-complete-registration',
        actionType: 'COMPLETE_REGISTRATION',
        priority: 5,
        status: 'RECOMMENDED',
        supportArea: 'BUSINESS_REGISTRATION',
        titleEn: 'Complete your business registration',
        titleHi: 'अपना व्यवसाय पंजीकरण पूर्ण करें',
        descriptionEn: 'Formal registration is a prerequisite for the support you are pursuing.',
        descriptionHi: 'आपकी लक्षित सहायता हेतु औपचारिक पंजीकरण पूर्व-शर्त है।',
        reasonEn:
          regStatus === 'IN_PROCESS'
            ? 'Your registration is recorded as in process. Scheme data for your pathway lists a registration requirement.'
            : 'Your profile records the business as not registered, and scheme data for your pathway lists a registration requirement.',
        reasonHi:
          regStatus === 'IN_PROCESS'
            ? 'आपका पंजीकरण प्रक्रियाधीन दर्ज है। आपके पथ की योजनाओं में पंजीकरण आवश्यक है।'
            : 'आपकी प्रोफ़ाइल में व्यवसाय गैर-पंजीकृत है, जबकि योजना डेटा में पंजीकरण आवश्यक है।',
        ctaLabelEn: 'Update Registration',
        ctaLabelHi: 'पंजीकरण अपडेट करें',
        actionTarget: 'form',
        relatedSchemeIds: selectedSchemeIds,
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Project preparation
  // ---------------------------------------------------------------------------
  if (needProfile.fundingGap > 0 && needsProjectReport(selectedMatch)) {
    candidates.push(
      toAction({
        id: 'action-prepare-project-report',
        actionType: 'PREPARE_PROJECT_REPORT',
        priority: 6,
        status: 'RECOMMENDED',
        supportArea: needProfile.primaryNeed,
        titleEn: 'Prepare your project report',
        titleHi: 'अपनी परियोजना रिपोर्ट तैयार करें',
        descriptionEn: 'Your funding pathway requires supporting project information.',
        descriptionHi: 'आपके वित्तीय मार्ग हेतु परियोजना संबंधी जानकारी आवश्यक है।',
        reasonEn: `Your estimated funding requirement is ${formatLakhCrore(needProfile.fundingGap, 'en')} and the scheme data lists project documentation among required documents. This requirement is your own, not an assured sanction.`,
        reasonHi: `आपकी अनुमानित वित्तीय आवश्यकता ${formatLakhCrore(needProfile.fundingGap, 'hi')} है एवं योजना डेटा में परियोजना दस्तावेज आवश्यक हैं। यह आपकी आवश्यकता है, स्वीकृत राशि नहीं।`,
        ctaLabelEn: 'View Checklist',
        ctaLabelHi: 'चेकलिस्ट देखें',
        actionTarget: 'checklist',
        relatedSchemeIds: selectedSchemeIds,
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Financial preparation
  // ---------------------------------------------------------------------------
  if (!needProfile.hasFundingDetails) {
    candidates.push(
      toAction({
        id: 'action-check-financial-fit',
        actionType: 'CHECK_FINANCIAL_FIT',
        priority: 7,
        status: 'NEEDS_INFORMATION',
        titleEn: 'Add your project cost',
        titleHi: 'अपनी परियोजना लागत जोड़ें',
        descriptionEn: 'Financial fit cannot be checked without a project cost or funding requirement.',
        descriptionHi: 'परियोजना लागत के बिना वित्तीय अनुकूलता की जांच संभव नहीं।',
        reasonEn: 'No total project cost or funding requirement is recorded in your profile.',
        reasonHi: 'आपकी प्रोफ़ाइल में कोई परियोजना लागत या वित्तीय आवश्यकता दर्ज नहीं है।',
        ctaLabelEn: 'Add Funding Details',
        ctaLabelHi: 'वित्तीय विवरण जोड़ें',
        actionTarget: 'form',
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Scheme comparison
  // ---------------------------------------------------------------------------
  if (!selectedMatch && eligibleMatches.length >= 2) {
    candidates.push(
      toAction({
        id: 'action-compare-schemes',
        actionType: 'COMPARE_SCHEMES',
        priority: 8,
        status: 'READY',
        titleEn: 'Compare your matched schemes',
        titleHi: 'अपनी मिलान योजनाओं की तुलना करें',
        descriptionEn: `${eligibleMatches.length} schemes match your profile. Compare them before choosing one.`,
        descriptionHi: `${eligibleMatches.length} योजनाएं आपकी प्रोफ़ाइल से मेल खाती हैं। चयन से पूर्व तुलना करें।`,
        reasonEn:
          'More than one scheme satisfies the statutory criteria evaluated for your profile. Benefit compatibility between schemes is not verified in the scheme data.',
        reasonHi:
          'एक से अधिक योजनाएं आपकी प्रोफ़ाइल की वैधानिक शर्तों पर खरी उतरती हैं। लाभ संयोजन की पुष्टि योजना डेटा में नहीं है।',
        ctaLabelEn: 'Compare Schemes',
        ctaLabelHi: 'योजनाएं तुलना करें',
        actionTarget: 'compare',
        relatedSchemeIds: eligibleMatches.slice(0, 3).map((m) => m.scheme.id),
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Official application
  // ---------------------------------------------------------------------------
  if (selectedMatch && selectedMatch.isEligible && confirmedBlockers.length === 0) {
    candidates.push(
      toAction({
        id: 'action-open-official-portal',
        actionType: 'OPEN_OFFICIAL_PORTAL',
        priority: 9,
        status: pendingDocs > 0 ? 'RECOMMENDED' : 'READY',
        titleEn: 'Apply through the official portal',
        titleHi: 'आधिकारिक पोर्टल पर आवेदन करें',
        descriptionEn: 'No known preparation blockers remain for this scheme.',
        descriptionHi: 'इस योजना हेतु कोई ज्ञात बाधा शेष नहीं है।',
        reasonEn: `Your profile satisfies the statutory criteria evaluated for ${selectedMatch.scheme.name}. Applications are submitted only on the official government portal.`,
        reasonHi: `आपकी प्रोफ़ाइल ${selectedMatch.scheme.name} की मूल्यांकित वैधानिक शर्तों को पूरा करती है। आवेदन केवल आधिकारिक सरकारी पोर्टल पर होता है।`,
        ctaLabelEn: 'Open Official Portal',
        ctaLabelHi: 'आधिकारिक पोर्टल खोलें',
        actionTarget: 'portal',
        actionUrl: selectedMatch.scheme.officialPortalUrl,
        relatedSchemeIds: selectedSchemeIds,
        officialAction: true,
        requiredBefore: [],
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 10. Additional complementary support (always available as a fallback)
  // ---------------------------------------------------------------------------
  const topStackScheme = supportStack.find((g) => g.schemes.length > 0)?.schemes[0];
  candidates.push(
    topStackScheme
      ? toAction({
          id: 'action-review-support-stack',
          actionType: 'REVIEW_SCHEME_ELIGIBILITY',
          priority: 10,
          status: 'RECOMMENDED',
          titleEn: 'Review your application requirements',
          titleHi: 'अपनी आवेदन आवश्यकताएं देखें',
          descriptionEn: 'Open a recommended scheme to review its requirements in detail.',
          descriptionHi: 'विस्तृत शर्तें देखने हेतु अनुशंसित योजना खोलें।',
          reasonEn: `${topStackScheme.schemeName} is mapped to your highest-priority support area based on available scheme information.`,
          reasonHi: `उपलब्ध योजना जानकारी के आधार पर ${topStackScheme.schemeName} आपके सर्वोच्च प्राथमिकता क्षेत्र से जुड़ी है।`,
          ctaLabelEn: 'View Scheme Requirements',
          ctaLabelHi: 'योजना शर्तें देखें',
          actionTarget: 'details',
          relatedSchemeIds: [topStackScheme.schemeId],
        })
      : toAction({
          id: 'action-refine-profile',
          actionType: 'PROVIDE_MISSING_INFORMATION',
          priority: 10,
          status: 'RECOMMENDED',
          titleEn: 'Refine your support priorities',
          titleHi: 'अपनी सहायता प्राथमिकताएं स्पष्ट करें',
          descriptionEn: 'No verified scheme in the current dataset is mapped to your selected support areas.',
          descriptionHi: 'वर्तमान सत्यापित डेटा में आपके चयनित क्षेत्रों हेतु कोई योजना नहीं मिली।',
          reasonEn:
            'Adjusting your stated support needs may surface verified schemes. Check official guidelines for areas not covered here.',
          reasonHi:
            'सहायता आवश्यकताएं संशोधित करने पर सत्यापित योजनाएं दिख सकती हैं। अन्य क्षेत्रों हेतु आधिकारिक दिशानिर्देश देखें।',
          ctaLabelEn: 'Update Priorities',
          ctaLabelHi: 'प्राथमिकताएं अपडेट करें',
          actionTarget: 'form',
        })
  );

  // Stable deterministic ordering: priority first, then id as tie-breaker.
  const ordered = [...candidates].sort((a, b) =>
    a.priority === b.priority ? a.id.localeCompare(b.id) : a.priority - b.priority
  );

  const primary = ordered[0];
  const secondary = ordered.slice(1, 4);

  // Medium-priority profile gaps are surfaced as an optional refinement only.
  if (missingHigh.length === 0 && missingMedium.length > 0 && secondary.length < 3) {
    secondary.push(
      toAction({
        id: 'action-refine-optional-profile',
        actionType: 'PROVIDE_MISSING_INFORMATION',
        priority: 11,
        status: 'RECOMMENDED',
        titleEn: 'Add optional profile details',
        titleHi: 'वैकल्पिक प्रोफ़ाइल विवरण जोड़ें',
        descriptionEn: `${missingMedium.length} optional detail(s) could sharpen your recommendations.`,
        descriptionHi: `${missingMedium.length} वैकल्पिक विवरण आपकी अनुशंसाएं और सटीक बना सकते हैं।`,
        reasonEn: `${missingMedium.map((f) => f.labelEn).join(', ')} not provided.`,
        reasonHi: `${missingMedium.map((f) => f.labelHi).join(', ')} दर्ज नहीं।`,
        ctaLabelEn: 'Update Profile',
        ctaLabelHi: 'प्रोफ़ाइल अपडेट करें',
        actionTarget: 'form',
      })
    );
  }

  return { primary, secondary, blocked, completed };
}

export { getLocalizedPathwayAction, PATHWAY_ACTION_LOCALIZED } from '../../i18n/pathwayActionI18n';
