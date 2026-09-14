import { MatchResult, UserProfile } from '../../types';
import {
  BusinessNeedProfile,
  BusinessStageKey,
  BUSINESS_STAGE_TAXONOMY,
  SupportNeedType,
  SUPPORT_NEEDS_TAXONOMY,
} from '../../types/business';
import {
  ApplicationReadiness,
  ApplicationReadinessState,
  PreparationChecklistResult,
  PreparationItem,
  ReadinessCheck,
  RecommendedSupportArea,
  SupportArea,
  SupportAreaSource,
  SupportPathway,
  SupportStackGroup,
  SupportStackScheme,
} from '../../types/supportPathway';
import { deriveBusinessNeedProfile } from './businessNeedProfile';
import { deriveJourneyPosition } from './businessJourney';
import { formatLakhCrore } from './fundingCalculator';
import { getSchemeSupportedNeeds } from './businessRelevanceEngine';
import { calculateBusinessProfileCompleteness } from './businessProfileCompleteness';
import { evaluateDocumentReadiness } from '../matching/documentReadiness';
import { evaluateFundingFit } from '../matching/fundingFit';
import { derivePathwayNextBestAction } from './nextBestAction';

// =============================================================================
// 1. BUSINESS STAGE -> SUPPORT PRIORITIES
// =============================================================================
/**
 * Deterministic stage -> support priority signals.
 *
 * These are PRIORITISATION SIGNALS ONLY. They never imply statutory eligibility
 * and they never enter the Phase 3.1 match score.
 *
 * Brief-to-canonical mapping (see types/supportPathway.ts for the full table):
 * VALIDATION/INCUBATION/PROJECT_PREPARATION -> MENTORSHIP,
 * REGISTRATION/COMPLIANCE -> BUSINESS_REGISTRATION, FUNDING -> CAPITAL,
 * EXPANSION_FINANCE/LARGER_FINANCE -> CREDIT, DIGITALIZATION -> TECHNOLOGY,
 * EXPORT -> MARKET_ACCESS, EMPLOYMENT -> SKILL_DEVELOPMENT.
 */
export const STAGE_SUPPORT_PRIORITIES: Record<BusinessStageKey, SupportArea[]> = {
  IDEA: ['MENTORSHIP', 'TRAINING', 'BUSINESS_REGISTRATION', 'CAPITAL'],
  PRE_LAUNCH: ['BUSINESS_REGISTRATION', 'MENTORSHIP', 'CAPITAL', 'EQUIPMENT'],
  NEW_BUSINESS: ['WORKING_CAPITAL', 'EQUIPMENT', 'TRAINING', 'MARKET_ACCESS'],
  EARLY_OPERATION: ['WORKING_CAPITAL', 'TECHNOLOGY', 'MARKET_ACCESS', 'SKILL_DEVELOPMENT'],
  GROWTH: ['CREDIT', 'TECHNOLOGY', 'MARKET_ACCESS', 'SKILL_DEVELOPMENT'],
  EXPANSION: ['CREDIT', 'INFRASTRUCTURE', 'TECHNOLOGY', 'MARKET_ACCESS'],
  DISTRESS_OR_RESTRUCTURING: ['WORKING_CAPITAL', 'CREDIT', 'MENTORSHIP', 'MARKET_ACCESS'],
};

// =============================================================================
// 2. NEED -> SUPPORT AREA EXPANSION
// =============================================================================
/**
 * A primary need expands into the closely-coupled instruments that deliver it.
 * Secondary needs are never expanded: they are taken exactly as selected, so we
 * do not manufacture needs the entrepreneur did not choose.
 */
export const PRIMARY_NEED_EXPANSION: Partial<Record<SupportNeedType, SupportArea[]>> = {
  CAPITAL: ['CAPITAL', 'SUBSIDY', 'CREDIT'],
  CREDIT: ['CREDIT', 'SUBSIDY'],
  WORKING_CAPITAL: ['WORKING_CAPITAL', 'CREDIT'],
  SUBSIDY: ['SUBSIDY', 'CAPITAL'],
  EQUIPMENT: ['EQUIPMENT', 'SUBSIDY'],
  INFRASTRUCTURE: ['INFRASTRUCTURE', 'CREDIT'],
  TRAINING: ['TRAINING', 'SKILL_DEVELOPMENT'],
  SKILL_DEVELOPMENT: ['SKILL_DEVELOPMENT', 'TRAINING'],
  TECHNOLOGY: ['TECHNOLOGY', 'EQUIPMENT'],
  MARKET_ACCESS: ['MARKET_ACCESS'],
  RAW_MATERIAL: ['RAW_MATERIAL', 'WORKING_CAPITAL'],
  BUSINESS_REGISTRATION: ['BUSINESS_REGISTRATION'],
  MENTORSHIP: ['MENTORSHIP', 'TRAINING'],
  OTHER: ['OTHER'],
};

function areaLabels(area: SupportArea): { en: string; hi: string; icon: string } {
  const info = SUPPORT_NEEDS_TAXONOMY[area];
  return {
    en: info ? info.labelEn : area,
    hi: info ? info.labelHi : area,
    icon: info ? info.iconName : 'HelpCircle',
  };
}

/**
 * Derives the deduplicated, deterministically ranked support areas.
 *
 * Order of evidence strength:
 *   1. the primary need exactly as selected
 *   2. instruments derived from that primary need
 *   3. secondary needs as selected
 *   4. business-stage priority signals
 */
export function deriveRecommendedSupportAreas(
  needProfile: BusinessNeedProfile
): RecommendedSupportArea[] {
  const seen = new Set<SupportArea>();
  const out: RecommendedSupportArea[] = [];
  const stageLabelEn = BUSINESS_STAGE_TAXONOMY[needProfile.currentStage].labelEn;
  const stageLabelHi = BUSINESS_STAGE_TAXONOMY[needProfile.currentStage].labelHi;

  const push = (area: SupportArea, source: SupportAreaSource) => {
    if (seen.has(area)) return;
    seen.add(area);
    const l = areaLabels(area);
    const reason: Record<SupportAreaSource, { en: string; hi: string }> = {
      PRIMARY_NEED: {
        en: 'You selected this as your primary support priority.',
        hi: 'आपने इसे अपनी प्राथमिक सहायता आवश्यकता के रूप में चुना है।',
      },
      DERIVED_FROM_PRIMARY_NEED: {
        en: 'Commonly delivered alongside your primary support priority.',
        hi: 'यह आपकी प्राथमिक आवश्यकता के साथ सामान्यतः उपलब्ध सहायता है।',
      },
      SECONDARY_NEED: {
        en: 'You selected this as an additional support need.',
        hi: 'आपने इसे अतिरिक्त सहायता आवश्यकता के रूप में चुना है।',
      },
      BUSINESS_STAGE: {
        en: `Typical priority at the ${stageLabelEn} stage. This is a prioritisation signal only, not an eligibility claim.`,
        hi: `${stageLabelHi} चरण में सामान्य प्राथमिकता। यह केवल प्राथमिकता संकेत है, पात्रता का दावा नहीं।`,
      },
    };
    out.push({
      area,
      rank: out.length + 1,
      source,
      labelEn: l.en,
      labelHi: l.hi,
      reasonEn: reason[source].en,
      reasonHi: reason[source].hi,
    });
  };

  if (needProfile.primaryNeed) {
    push(needProfile.primaryNeed, 'PRIMARY_NEED');
    for (const derived of PRIMARY_NEED_EXPANSION[needProfile.primaryNeed] || []) {
      push(derived, 'DERIVED_FROM_PRIMARY_NEED');
    }
  }

  for (const secondary of needProfile.secondaryNeeds) {
    push(secondary, 'SECONDARY_NEED');
  }

  for (const stageArea of STAGE_SUPPORT_PRIORITIES[needProfile.currentStage] || []) {
    push(stageArea, 'BUSINESS_STAGE');
  }

  return out;
}

// =============================================================================
// 3. SUPPORT STACK
// =============================================================================
const NO_VERIFIED_SUPPORT_EN =
  'No verified scheme in the current dataset is mapped to this support area. Check official guidelines.';
const NO_VERIFIED_SUPPORT_HI =
  'वर्तमान सत्यापित डेटा में इस सहायता क्षेत्र हेतु कोई योजना उपलब्ध नहीं है। आधिकारिक दिशानिर्देश देखें।';

export const COMBINABILITY_NOTICE_EN =
  'These schemes address different support needs. Benefit compatibility is not verified in the scheme data — check the official guidelines before applying to more than one.';
export const COMBINABILITY_NOTICE_HI =
  'ये योजनाएं अलग-अलग आवश्यकताओं को पूरा करती हैं। लाभ संयोजन की पुष्टि योजना डेटा में नहीं है — एक से अधिक आवेदन से पूर्व आधिकारिक दिशानिर्देश अवश्य जांचें।';

export const FUNDING_GAP_DISCLAIMER_EN =
  'This is your own estimated requirement. It is not an assured or sanctioned government amount.';
export const FUNDING_GAP_DISCLAIMER_HI =
  'यह आपकी स्वयं की अनुमानित आवश्यकता है, किसी सरकारी सहायता की गारंटीशुदा राशि नहीं।';

function relationNote(
  matchResult: MatchResult,
  lang: 'en' | 'hi'
): { en: string; hi: string } {
  const relevance = matchResult.businessRelevance?.relevanceLevel;
  if (relevance === 'HIGH') {
    return {
      en: 'High relevance to this need, based on scheme purpose and your stated priorities.',
      hi: 'योजना के उद्देश्य एवं आपकी प्राथमिकताओं के आधार पर उच्च प्रासंगिकता।',
    };
  }
  if (relevance === 'LOW') {
    return {
      en: 'Listed because scheme data maps it to this area, though overall need alignment is limited.',
      hi: 'योजना डेटा इसे इस क्षेत्र से जोड़ता है, यद्यपि समग्र आवश्यकता मेल सीमित है।',
    };
  }
  return {
    en: 'Relevant support, based on available scheme information.',
    hi: 'उपलब्ध योजना जानकारी के आधार पर प्रासंगिक सहायता।',
  };
}

/**
 * Groups already-matched schemes by the support areas their verified scheme data
 * maps to. This performs NO eligibility evaluation of its own: statutory status
 * comes entirely from the Phase 3.1 MatchResult.
 */
export function buildSupportStack(
  recommendedAreas: RecommendedSupportArea[],
  matchResults: MatchResult[],
  lang: 'en' | 'hi' = 'en',
  maxSchemesPerArea = 3
): SupportStackGroup[] {
  // Only schemes the authoritative engine did not rule out are eligible for the stack.
  const candidates = matchResults.filter(
    (m) => m.matchStatus === 'eligible' || m.matchStatus === 'near-match'
  );

  return recommendedAreas.map((recommended) => {
    const l = areaLabels(recommended.area);

    const schemes: SupportStackScheme[] = candidates
      .filter((m) => getSchemeSupportedNeeds(m.scheme).includes(recommended.area))
      .sort((a, b) => {
        if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
        if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
        return a.scheme.id.localeCompare(b.scheme.id);
      })
      .slice(0, maxSchemesPerArea)
      .map((m) => {
        const note = relationNote(m, lang);
        return {
          schemeId: m.scheme.id,
          schemeName: m.scheme.name,
          shortCode: m.scheme.shortCode,
          matchPercentage: m.matchPercentage,
          matchStatus: m.matchStatus,
          isEligible: m.isEligible,
          relevanceLevel: m.businessRelevance?.relevanceLevel || 'UNKNOWN',
          relationNoteEn: note.en,
          relationNoteHi: note.hi,
          provenance: {
            source: m.scheme.sponsoringMinistry,
            sourceUrl: m.scheme.officialPortalUrl,
            lastVerified: m.scheme.lastVerifiedDate,
            verificationStatus: m.scheme.trustProfile?.verification?.status,
          },
        };
      });

    return {
      area: recommended.area,
      labelEn: l.en,
      labelHi: l.hi,
      iconName: l.icon,
      rank: recommended.rank,
      source: recommended.source,
      schemes,
      hasNoVerifiedSupport: schemes.length === 0,
      noticeEn: schemes.length === 0 ? NO_VERIFIED_SUPPORT_EN : undefined,
      noticeHi: schemes.length === 0 ? NO_VERIFIED_SUPPORT_HI : undefined,
    };
  });
}

// =============================================================================
// 4. PREPARATION CHECKLIST
// =============================================================================
/**
 * Builds a preparation checklist for one scheme by reusing the Phase 3.1
 * document readiness engine.
 *
 * Tri-state discipline: a document the user has never interacted with is
 * UNKNOWN, not "missing". Only documents the user has actively engaged with
 * (present in `engagedDocIds`) may be reported as NOT_PREPARED.
 */
export function buildPreparationChecklist(
  matchResult: MatchResult | null | undefined,
  profile: UserProfile,
  preparedDocIds: string[] | Set<string> = new Set(),
  hasEngagedWithChecklist = false,
  lang: 'en' | 'hi' = 'en'
): PreparationChecklistResult {
  if (!matchResult) {
    return {
      items: [],
      preparedCount: 0,
      totalCount: 0,
      unknownCount: 0,
      requirementsUnverified: true,
      summaryEn: 'Select a scheme to see its preparation requirements.',
      summaryHi: 'तैयारी आवश्यकताएं देखने हेतु कोई योजना चुनें।',
    };
  }

  const readiness = evaluateDocumentReadiness(
    matchResult.scheme,
    profile,
    preparedDocIds,
    lang
  );

  if (readiness.totalRequired === 0) {
    return {
      schemeId: matchResult.scheme.id,
      items: [],
      preparedCount: 0,
      totalCount: 0,
      unknownCount: 0,
      requirementsUnverified: true,
      summaryEn: 'Document requirements are not fully verified for this scheme. Check the official scheme guidelines.',
      summaryHi: 'इस योजना हेतु दस्तावेज आवश्यकताएं पूर्णतः सत्यापित नहीं हैं। आधिकारिक दिशानिर्देश देखें।',
    };
  }

  const items: PreparationItem[] = readiness.items.map((item) => ({
    id: item.id,
    labelEn: item.name,
    labelHi: item.name,
    state:
      item.state === 'PROVIDED'
        ? 'PREPARED'
        : hasEngagedWithChecklist
          ? 'NOT_PREPARED'
          : 'UNKNOWN',
    fromSchemeData: true,
  }));

  const preparedCount = items.filter((i) => i.state === 'PREPARED').length;
  const unknownCount = items.filter((i) => i.state === 'UNKNOWN').length;

  return {
    schemeId: matchResult.scheme.id,
    items,
    preparedCount,
    totalCount: items.length,
    unknownCount,
    requirementsUnverified: false,
    summaryEn: `${preparedCount} of ${items.length} prepared`,
    summaryHi: `${items.length} में से ${preparedCount} तैयार`,
  };
}

// =============================================================================
// 5. READINESS
// =============================================================================
const READINESS_META: Record<
  ApplicationReadinessState,
  { labelEn: string; labelHi: string; summaryEn: string; summaryHi: string }
> = {
  NOT_READY: {
    labelEn: 'Not ready yet',
    labelHi: 'अभी तैयार नहीं',
    summaryEn: 'Core information is still needed before eligibility can be assessed properly.',
    summaryHi: 'पात्रता के सही आकलन हेतु अभी मूलभूत जानकारी आवश्यक है।',
  },
  PARTIALLY_READY: {
    labelEn: 'Partially ready',
    labelHi: 'आंशिक रूप से तैयार',
    summaryEn: 'Some preparation remains before you apply.',
    summaryHi: 'आवेदन से पूर्व कुछ तैयारी शेष है।',
  },
  READY_TO_REVIEW: {
    labelEn: 'Ready to review',
    labelHi: 'समीक्षा हेतु तैयार',
    summaryEn: 'No known blockers remain. Review the scheme requirements before applying.',
    summaryHi: 'कोई ज्ञात बाधा शेष नहीं। आवेदन से पूर्व योजना की शर्तें देखें।',
  },
  READY_TO_APPLY: {
    labelEn: 'Ready to apply',
    labelHi: 'आवेदन हेतु तैयार',
    summaryEn: 'Profile, eligibility review, documents and financial fit show no outstanding items.',
    summaryHi: 'प्रोफ��ाइल, पात्रता, दस्तावेज एवं वित्तीय अनुकूलता में कोई शेष कार्य नहीं।',
  },
};

/**
 * Deterministic readiness state. Based only on verified information.
 *
 * UNKNOWN never counts as a failure: it downgrades readiness at most to
 * READY_TO_REVIEW / PARTIALLY_READY, and never produces NOT_READY on its own.
 */
export function deriveApplicationReadiness(
  profile: UserProfile,
  needProfile: BusinessNeedProfile,
  selectedMatch: MatchResult | null | undefined,
  checklist: PreparationChecklistResult,
  lang: 'en' | 'hi' = 'en'
): ApplicationReadiness {
  const completeness = calculateBusinessProfileCompleteness(profile);
  const missingHigh = completeness.missingHighValueFields.filter((f) => f.priority === 'HIGH');

  const profileCheck: ReadinessCheck = {
    key: 'PROFILE',
    state: missingHigh.length === 0 ? 'SATISFIED' : 'PENDING',
    labelEn: 'Profile',
    labelHi: 'प्रोफ़ाइल',
    detailEn:
      missingHigh.length === 0
        ? 'Complete'
        : `${missingHigh.length} key detail(s) missing: ${missingHigh.map((f) => f.labelEn).join(', ')}`,
    detailHi:
      missingHigh.length === 0
        ? 'पूर्ण'
        : `${missingHigh.length} महत्वपूर्ण विवरण शेष: ${missingHigh.map((f) => f.labelHi).join(', ')}`,
  };

  let eligibilityCheck: ReadinessCheck;
  if (!selectedMatch) {
    eligibilityCheck = {
      key: 'ELIGIBILITY',
      state: 'NOT_APPLICABLE',
      labelEn: 'Eligibility review',
      labelHi: 'पात्रता समीक्षा',
      detailEn: 'No scheme selected yet',
      detailHi: 'अभी कोई योजना चयनित नहीं',
    };
  } else {
    const blockers = selectedMatch.confirmedBlockers?.length || 0;
    const unknowns = selectedMatch.unknownCriteria?.length || 0;
    eligibilityCheck = {
      key: 'ELIGIBILITY',
      state: blockers > 0 ? 'PENDING' : unknowns > 0 ? 'UNKNOWN' : 'SATISFIED',
      labelEn: 'Eligibility review',
      labelHi: 'पात्रता समीक्षा',
      detailEn:
        blockers > 0
          ? `${blockers} statutory requirement(s) not satisfied`
          : unknowns > 0
            ? `${unknowns} criterion/criteria still unspecified`
            : 'No confirmed blocker',
      detailHi:
        blockers > 0
          ? `${blockers} वैधानिक शर्त पूरी नहीं`
          : unknowns > 0
            ? `${unknowns} शर्तें अभी अनिर्दिष्ट`
            : 'कोई पुष्ट बाधा नहीं',
    };
  }

  let documentsCheck: ReadinessCheck;
  if (checklist.requirementsUnverified) {
    documentsCheck = {
      key: 'DOCUMENTS',
      state: 'UNKNOWN',
      labelEn: 'Documents',
      labelHi: 'दस्तावेज',
      detailEn: 'Document requirements not fully verified. Check official scheme guidelines.',
      detailHi: 'दस्तावेज आवश्यकताएं पूर्णतः सत्यापित नहीं। आधिकारिक दिशानिर्देश देखें।',
    };
  } else if (checklist.preparedCount === checklist.totalCount && checklist.totalCount > 0) {
    documentsCheck = {
      key: 'DOCUMENTS',
      state: 'SATISFIED',
      labelEn: 'Documents',
      labelHi: 'दस्तावेज',
      detailEn: `All ${checklist.totalCount} marked prepared`,
      detailHi: `सभी ${checklist.totalCount} दस्तावेज तैयार चिह्नित`,
    };
  } else if (checklist.preparedCount === 0 && checklist.unknownCount === checklist.totalCount) {
    documentsCheck = {
      key: 'DOCUMENTS',
      state: 'UNKNOWN',
      labelEn: 'Documents',
      labelHi: 'दस्तावेज',
      detailEn: `${checklist.totalCount} required; preparation status not recorded yet`,
      detailHi: `${checklist.totalCount} आवश्यक; तैयारी स्थिति अभी दर्ज नहीं`,
    };
  } else {
    documentsCheck = {
      key: 'DOCUMENTS',
      state: 'PENDING',
      labelEn: 'Documents',
      labelHi: 'दस्तावेज',
      detailEn: `${checklist.preparedCount} of ${checklist.totalCount} prepared`,
      detailHi: `${checklist.totalCount} में से ${checklist.preparedCount} तैयार`,
    };
  }

  let financialCheck: ReadinessCheck;
  if (!selectedMatch) {
    financialCheck = {
      key: 'FINANCIAL_FIT',
      state: needProfile.hasFundingDetails ? 'SATISFIED' : 'UNKNOWN',
      labelEn: 'Financial fit',
      labelHi: 'वित्तीय अनुकूलता',
      detailEn: needProfile.hasFundingDetails
        ? `Estimated requirement ${formatLakhCrore(needProfile.fundingGap, 'en')}`
        : 'Funding requirement not specified',
      detailHi: needProfile.hasFundingDetails
        ? `अनुमानित आवश्यकता ${formatLakhCrore(needProfile.fundingGap, 'hi')}`
        : 'वित्तीय आवश्यकता अनिर्दिष्ट',
    };
  } else {
    const fit = evaluateFundingFit(selectedMatch.scheme, profile, lang);
    const state =
      fit.fitStatus === 'WITHIN_RANGE'
        ? 'SATISFIED'
        : fit.fitStatus === 'ABOVE_RANGE' || fit.fitStatus === 'BELOW_RANGE'
          ? 'PENDING'
          : 'UNKNOWN';
    financialCheck = {
      key: 'FINANCIAL_FIT',
      state,
      labelEn: 'Financial fit',
      labelHi: 'वित्तीय अनुकूलता',
      detailEn: fit.explanation,
      detailHi: fit.explanation,
    };
  }

  const checks = [profileCheck, eligibilityCheck, documentsCheck, financialCheck];

  // Deterministic state resolution.
  let state: ApplicationReadinessState;
  if (profileCheck.state === 'PENDING' || eligibilityCheck.state === 'PENDING') {
    state = 'NOT_READY';
  } else if (documentsCheck.state === 'PENDING' || financialCheck.state === 'PENDING') {
    state = 'PARTIALLY_READY';
  } else if (checks.some((c) => c.state === 'UNKNOWN')) {
    state = 'READY_TO_REVIEW';
  } else if (eligibilityCheck.state === 'NOT_APPLICABLE') {
    state = 'READY_TO_REVIEW';
  } else {
    state = 'READY_TO_APPLY';
  }

  const meta = READINESS_META[state];
  return {
    state,
    labelEn: meta.labelEn,
    labelHi: meta.labelHi,
    summaryEn: meta.summaryEn,
    summaryHi: meta.summaryHi,
    checks,
  };
}

// =============================================================================
// 6. PATHWAY ORCHESTRATION
// =============================================================================
export interface BuildSupportPathwayInput {
  profile: UserProfile;
  matchResults: MatchResult[];
  /** The scheme currently in focus, when the user has opened one. */
  selectedMatch?: MatchResult | null;
  preparedDocIds?: string[] | Set<string>;
  hasEngagedWithChecklist?: boolean;
  needProfile?: BusinessNeedProfile;
  lang?: 'en' | 'hi';
}

/**
 * Builds the complete, deterministic Business Support Pathway.
 *
 * Pure function: identical inputs always produce an identical pathway. It never
 * recomputes statutory eligibility or the Phase 3.1 match score; both are
 * consumed as given from the authoritative MatchResult set.
 */
export function buildSupportPathway(input: BuildSupportPathwayInput): SupportPathway {
  const {
    profile,
    matchResults,
    selectedMatch = null,
    preparedDocIds = new Set<string>(),
    hasEngagedWithChecklist = false,
    lang = 'en',
  } = input;

  const needProfile =
    input.needProfile || profile.businessNeedProfile || deriveBusinessNeedProfile(profile);

  const recommendedSupportAreas = deriveRecommendedSupportAreas(needProfile);
  const supportStack = buildSupportStack(recommendedSupportAreas, matchResults, lang);

  const checklist = buildPreparationChecklist(
    selectedMatch,
    profile,
    preparedDocIds,
    hasEngagedWithChecklist,
    lang
  );

  const readiness = deriveApplicationReadiness(
    profile,
    needProfile,
    selectedMatch,
    checklist,
    lang
  );

  const journeyStage = deriveJourneyPosition(
    needProfile.currentStage,
    needProfile.registrationStatus,
    needProfile.fundingGap > 0
  );

  const actions = derivePathwayNextBestAction({
    profile,
    needProfile,
    matchResults,
    selectedMatch,
    checklist,
    readiness,
    supportStack,
    lang,
  });

  const recommendedSchemeIds: string[] = [];
  for (const group of supportStack) {
    for (const s of group.schemes) {
      if (!recommendedSchemeIds.includes(s.schemeId)) recommendedSchemeIds.push(s.schemeId);
    }
  }

  const populatedAreas = supportStack.filter((g) => g.schemes.length > 0).length;

  return {
    currentStage: needProfile.currentStage,
    currentStageLabelEn: BUSINESS_STAGE_TAXONOMY[needProfile.currentStage].labelEn,
    currentStageLabelHi: BUSINESS_STAGE_TAXONOMY[needProfile.currentStage].labelHi,
    journeyStage,
    stageSource: needProfile.stageSource,
    primaryNeed: needProfile.primaryNeed,
    secondaryNeeds: needProfile.secondaryNeeds,
    recommendedSupportAreas,
    supportStack,
    recommendedSchemeIds,
    nextBestAction: actions.primary,
    secondaryActions: actions.secondary,
    blockedActions: actions.blocked,
    completedActions: actions.completed,
    readiness,
    preparationChecklist: checklist,
    funding: {
      totalProjectCost: needProfile.totalProjectCost || 0,
      existingInvestment: needProfile.existingInvestment || 0,
      fundingGap: needProfile.fundingGap,
      hasFundingDetails: needProfile.hasFundingDetails,
      disclaimerEn: FUNDING_GAP_DISCLAIMER_EN,
      disclaimerHi: FUNDING_GAP_DISCLAIMER_HI,
    },
    combinabilityNoticeEn: populatedAreas > 1 ? COMBINABILITY_NOTICE_EN : '',
    combinabilityNoticeHi: populatedAreas > 1 ? COMBINABILITY_NOTICE_HI : '',
  };
}
