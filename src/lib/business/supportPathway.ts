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
import { Language } from '../../i18n/types';
import { resolveLocalized, resolveLocalizedPair } from '../../i18n/resolveLocalized';

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
const PRIMARY_NEED_EXPANSION: Partial<Record<SupportNeedType, SupportArea[]>> = {
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
      labelKey: `supportPathway.area.${area}.label`,
      reasonKey: `supportPathway.reason.${source}`,
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

const COMBINABILITY_NOTICE_EN =
  'These schemes address different support needs. Benefit compatibility is not verified in the scheme data — check the official guidelines before applying to more than one.';
const COMBINABILITY_NOTICE_HI =
  'ये योजनाएं अलग-अलग आवश्यकताओं को पूरा करती हैं। लाभ संयोजन की पुष्टि योजना डेटा में नहीं है — एक से अधिक आवेदन से पूर्व आधिकारिक दिशानिर्देश अवश्य जांचें।';

const COMBINABILITY_NOTICES: Record<Language, string> = {
  en: COMBINABILITY_NOTICE_EN,
  hi: COMBINABILITY_NOTICE_HI,
  ta: 'இந்தத் திட்டங்கள் வெவ்வேறு ஆதரவுத் தேவைகளைப் பூர்த்தி செய்கின்றன. பல திட்டங்களுக்கு விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ வழிகாட்டுதல்களைச் சரிபார்க்கவும்.',
  te: 'ఈ పథకాలు వేర్వేరు మద్దతు అవసరాలను తీరుస్తాయి. ఒకటికి మించి దరఖాస్తు చేసుకునే ముందు అధికారిక మార్గదర్శకాలను తనిఖీ చేయండి.',
  kn: 'ಈ ಯೋಜನೆಗಳು ವಿಭಿನ್ನ ಬೆಂಬಲ ಅಗತ್ಯಗಳನ್ನು ಪೂರೈಸುತ್ತವೆ. ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಯೋಜನೆಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಅಧಿಕೃತ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
  ml: 'ഈ പദ്ധതികൾ വ്യത്യസ്ത ആവശ്യങ്ങൾ നിറവേറ്റുന്നു. ഒന്നിൽ കൂടുതൽ അപേക്ഷിക്കുന്നതിന് മുമ്പ് ഔദ്യോഗിക മാർഗ്ഗനിർദ്ദേശങ്ങൾ പരിശോധിക്കുക.',
  mr: 'या योजना वेगवेगळ्या सहाय्य गरजा पूर्ण करतात. योजना माहितीत लाभ सुसंगतता सत्यापित केलेली नाही — एकापेक्षा जास्त अर्ज करण्यापूर्वी अधिकृत मार्गदर्शक तत्त्वे तपासा.',
};

const FUNDING_GAP_DISCLAIMER_EN =
  'This is your own estimated requirement. It is not an assured or sanctioned government amount.';
const FUNDING_GAP_DISCLAIMER_HI =
  'यह आपकी स्वयं की अनुमानित आवश्यकता है, किसी सरकारी सहायता की गारंटीशुदा राशि नहीं।';

const FUNDING_GAP_DISCLAIMERS: Record<Language, string> = {
  en: FUNDING_GAP_DISCLAIMER_EN,
  hi: FUNDING_GAP_DISCLAIMER_HI,
  ta: 'இது உங்கள் சொந்த மதிப்பீட்டுத் தேவை மட்டுமே. இது அரசால் உத்தரவாதமளிக்கப்பட்ட தொகை அல்ல.',
  te: 'ఇది మీ స్వంత అంచనా అవసరం మాత్రమే. ఇది ప్రభుత్వం హా��ీ ఇచ్చిన లేదా మంజూరు చేసిన మొత్తం కాదు.',
  kn: 'ಇದು ನಿಮ್ಮದೇ ಅಂದಾಜು ಅಗತ್ಯವಾಗಿದೆ. ಇದು ಖಚಿತವಾದ ಅಥವಾ ಮಂಜೂರಾದ ಸರ್ಕಾರದ ಮೊತ್ತವಲ್ಲ.',
  ml: 'ഇത് നിങ്ങളുടെ സ്വന്തം ആവശ്യത്തിന്റെ കണക്കുകൂട്ടൽ മാത്രമാണ്. ഇത് സർക്കാരിന്റെ ഉറപ്പുള്ളതോ അനുവദിച്ചതോ ആയ തുകയല്ല.',
  mr: 'ही तुमची स्वतःची अंदाजित गरज आहे, शासनाची हमी दिलेली किंवा मंजूर केलेली रक्कम नाही.',
};

export const getLocalizedCombinabilityNotice = (
  pathway: SupportPathway,
  lang: Language = 'en',
): string => {
  if (!pathway.combinabilityNoticeEn && !pathway.combinabilityNoticeHi) return '';
  return COMBINABILITY_NOTICES[lang] || COMBINABILITY_NOTICES.en;
};

export const getLocalizedFundingDisclaimer = (
  lang: Language = 'en',
): string => {
  return FUNDING_GAP_DISCLAIMERS[lang] || FUNDING_GAP_DISCLAIMERS.en;
};

function relationNote(
  matchResult: MatchResult,
  lang: Language
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

const RELATION_NOTE_LOCALIZED: Record<string, Record<Language, string>> = {
  HIGH: {
    en: 'High relevance to this need, based on scheme purpose and your stated priorities.',
    hi: 'योजना के उद्देश्य एवं आपकी प्राथमिकताओं के आधार पर उच्च प्रासंगिकता।',
    ta: 'திட்டத்தின் நோக்கம் மற்றும் உங்கள் முன்னுரிமைகளின் அடிப்படையில் அதிக பொருத்தம்.',
    te: 'పథకం ఉద్దేశం మరియు మీ ప్రాధాన్యతల ఆధారంగా అధిక ఔచిత్యం.',
    kn: 'ಯೋಜನೆಯ ಉದ್ದೇಶ ಮತ್ತು ನಿಮ್ಮ ಆದ್ಯತೆಗಳ ಆಧಾರದ ಮೇಲೆ ಹೆಚ್ಚಿನ ಪ್ರಸ್ತುತತೆ.',
    ml: 'പദ്ധതിയുടെ ലക്ഷ്യത്തെയും നിങ്ങളുടെ മുൻഗണനകളെയും അടിസ്ഥാനമാക്കി ഉയർന്ന പ്രസക്തി.',
    mr: 'योजनेच्या उद्दिष्टावर आणि तुमच्या नमूद केलेल्या प्राधान्यांवर आधारित या गरजेशी उच्च प्रासंगिकता.',
  },
  LOW: {
    en: 'Listed because scheme data maps it to this area, though overall need alignment is limited.',
    hi: 'योजना डेटा इसे इस क्षेत्र से जोड़ता है, यद्यपि समग्र आवश्यकता मेल सीमित है।',
    ta: 'திட்டத் தரவு இதை இந்தப் பகுதியுடன் இணைக்கிறது, இருப்பினும் ஒட்டுமொத்த தேவை பொருத்தம் குறைவாக உள்ளது.',
    te: 'పథకం డేటా దీన్ని ఈ ప్రాంతానికి మ్యాప్ చేస్తుంది, అయితే మొత్తం అవసర సమలేఖనం పరిమితం.',
    kn: 'ಯೋಜನೆಯ ಡೇಟಾ ಇದನ್ನು ಈ ಪ್ರದೇಶಕ್ಕೆ ನಕ್ಷೆ ಮಾಡುತ್ತದೆ, ಆದರೆ ಒಟ್ಟಾರೆ ಅಗತ್ಯ ಹೊಂದಾಣಿಕೆ ಸೀಮಿತವಾಗಿದೆ.',
    ml: 'പദ്ധതി ഡാറ്റ ഇതിനെ ഈ മേഖലയുമായി ബന്ധിപ്പിക്കുന്നു, എന്നിരുന്നാലും മൊത്തത്തിലുള്ള അനുയോജ്യത പരിമിതമാണ്.',
    mr: 'योजना माहिती याला या क्षेत्राशी जोडते, तथापि एकूण गरज जुळणी मर्यादित आहे.',
  },
  DEFAULT: {
    en: 'Relevant support, based on available scheme information.',
    hi: 'उपलब्ध योजना जानकारी के आधार पर प्रासंगिक सहायता।',
    ta: 'கிடைக்கக்கூடிய திட்டத் தகவலின் அடிப்படையில் பொருத்தமான ஆதரவு.',
    te: 'అందుబాటులో ఉన్న పథకం సమాచారం ఆధారంగా సంబంధిత మద్దతు.',
    kn: 'ಲಭ್ಯವಿರುವ ಯೋಜನೆಯ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಸೂಕ್ತವಾದ ಬೆಂಬಲ.',
    ml: 'ലഭ്യമായ പദ്ധതി വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പ്രസക്തമായ സഹായം.',
    mr: 'उपलब्ध योजना माहितीवर आधारित प्रासंगिक सहाय्य.',
  },
};

export function getLocalizedRelationNote(
  scheme: SupportStackScheme,
  lang: Language = 'en'
): string {
  const level = scheme.relevanceLevel || 'DEFAULT';
  const dict = RELATION_NOTE_LOCALIZED[level] || RELATION_NOTE_LOCALIZED.DEFAULT;
  if (dict && dict[lang]) {
    return dict[lang];
  }
  return resolveLocalizedPair(scheme.relationNoteEn, scheme.relationNoteHi, lang);
}

/**
 * Groups already-matched schemes by the support areas their verified scheme data
 * maps to. This performs NO eligibility evaluation of its own: statutory status
 * comes entirely from the Phase 3.1 MatchResult.
 */
export function buildSupportStack(
  recommendedAreas: RecommendedSupportArea[],
  matchResults: MatchResult[],
  lang: Language = 'en',
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
  lang: Language = 'en'
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
    isMandatory: item.isMandatory,
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

const READINESS_META_LOCALIZED: Record<
  ApplicationReadinessState,
  Record<Language, { label: string; summary: string }>
> = {
  NOT_READY: {
    en: {
      label: 'Not ready yet',
      summary: 'Core information is still needed before eligibility can be assessed properly.',
    },
    hi: {
      label: 'अभी तैयार नहीं',
      summary: 'पात्रता के सही आकलन हेतु अभी मूलभूत जानकारी आवश्यक है।',
    },
    ta: {
      label: 'இன்னும் தயாராகவில்லை',
      summary: 'தகுதியை முறையாக மதிப்பிடுவதற்கு முன் முதன்மை தகவல்கள் தேவைப்படுகின்றன.',
    },
    te: {
      label: 'ఇంకా సిద్ధంగా లేదు',
      summary: 'అర్హతను సరిగ్గా అంచనా వేయడానికి ముందు ప్రాథమిక సమాచారం అవసరం.',
    },
    kn: {
      label: 'ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲ',
      summary: 'ಅರ್ಹತೆಯನ್ನು ಸರಿಯಾಗಿ ನಿರ್ಣಯಿಸುವ ಮೊದಲು ಮೂಲಭೂತ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ.',
    },
    ml: {
      label: 'ഇതുവരെ തയ്യാറായിട്ടില്ല',
      summary: 'യോഗ്യത കൃത്യമായി വിലയിരുത്തുന്നതിന് മുമ്പ് പ്രാഥമിക വിവരങ്ങൾ ആവശ്യമാണ്.',
    },
    mr: {
      label: 'अजून तयार नाही',
      summary: 'पात्रतेचे योग्य मूल्यमापन करण्यापूर्वी मूलभूत माहिती अजून आवश्यक आहे.',
    },
  },
  PARTIALLY_READY: {
    en: {
      label: 'Partially ready',
      summary: 'Some preparation remains before you apply.',
    },
    hi: {
      label: 'आंशिक रूप से तैयार',
      summary: 'आवेदन से पूर्व कुछ तैयारी शेष है।',
    },
    ta: {
      label: 'பகுதி அளவு தயார்',
      summary: 'விண்ணப்பிக்கும் முன் சில தயாரிப்புகள் மீதமுள்ளன.',
    },
    te: {
      label: 'పాక్షికంగా సిద్ధం',
      summary: 'మీరు దరఖాస్తు చేసుకునే ముందు కొంత తయారీ మిగిలి ఉంది.',
    },
    kn: {
      label: 'ಭಾಗಶಃ ಸಿದ್ಧ',
      summary: 'ನೀವು ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಕೆಲವು ಸಿದ್ಧತೆಗಳು ಬಾಕಿ ಉಳಿದಿವೆ.',
    },
    ml: {
      label: 'ഭാഗികമായി തയ്യാറാണ്',
      summary: 'അപേക്ഷിക്കുന്നതിന് മുമ്പ് ചില തയ്യാറെടുപ്പുകൾ ബാക്കിയുണ്ട്.',
    },
    mr: {
      label: 'अंशतः तयार',
      summary: 'अर्ज करण्यापूर्वी काही तयारी शिल्लक आहे.',
    },
  },
  READY_TO_REVIEW: {
    en: {
      label: 'Ready to review',
      summary: 'No known blockers remain. Review the scheme requirements before applying.',
    },
    hi: {
      label: 'समीक्षा हेतु तैयार',
      summary: 'कोई ज्ञात बाधा शेष नहीं। आवेदन से पूर्व योजना की शर्तें देखें।',
    },
    ta: {
      label: 'மதிப்பாய்வுக்கு தயார்',
      summary: 'அறியப்பட்ட தடைகள் எதுவும் இல்லை. விண்ணப்பிக்கும் முன் திட்டத் தேவைகளை மதிப்பாய்வு செய்யவும்.',
    },
    te: {
      label: 'సమీక్షకు సిద్ధం',
      summary: 'ఎలాంటి అడ్డంకులు లేవు. దరఖాస్తు చేయడానికి ముందు పథకం అవసరాలను సమీక్షించండి.',
    },
    kn: {
      label: 'ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧ',
      summary: 'ಯಾವುದೇ ಅಡೆತಡೆಗಳಿಲ್ಲ. ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಯೋಜನೆಯ ಅವಶ್ಯಕತೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    },
    ml: {
      label: 'പരിശോധിക്കാൻ തയ്യാറാണ്',
      summary: 'തടസ്സങ്ങളൊന്നുമില്ല. അപേക്ഷിക്കുന്നതിന് മുമ്പ് പദ്ധതി നിബന്ധനകൾ പരിശോധിക്കുക.',
    },
    mr: {
      label: 'समीक्षेसाठी तयार',
      summary: 'कोणतीही ज्ञात अडचण शिल्लक नाही. अर्ज करण्यापूर्वी योजनेच्या अटींचा आढावा घ्या.',
    },
  },
  READY_TO_APPLY: {
    en: {
      label: 'Ready to apply',
      summary: 'Profile, eligibility review, documents and financial fit show no outstanding items.',
    },
    hi: {
      label: 'आवेदन हेतु तैयार',
      summary: 'प्रोफाइल, पात्रता, दस्तावेज एवं वित्तीय अनुकूलता में कोई शेष कार्य नहीं।',
    },
    ta: {
      label: 'விண்ணப்பிக்க தயார்',
      summary: 'சுயவிவரம், தகுதி மதிப்பாய்வு, ஆவணங்கள் மற்றும் நிதிப் பொருத்தம் ஆகியவற்றில் நிலுவைகள் ஏதுமில்லை.',
    },
    te: {
      label: 'దరఖాస్తుకు సిద్ధం',
      summary: 'ప్రొఫైల్, అర్హత సమీక్ష, పత్రాలు మరియు ఆర్థిక సరిపోలికలో పెండింగ్‌లో ఏమీ లేవు.',
    },
    kn: {
      label: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಿದ್ಧ',
      summary: 'ಪ್ರೊಫೈಲ್, ಅರ್ಹತಾ ಪರಿಶೀಲನೆ, ದಾಖಲೆಗಳು ಮತ್ತು ಹಣಕಾಸಿನ ಹೊಂದಾಣಿಕೆಯಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿಗಳಿಲ್ಲ.',
    },
    ml: {
      label: 'അപേക്ഷിക്കാൻ തയ്യാറാണ്',
      summary: 'പ്രൊഫൈൽ, യോഗ്യതാ പരിശോധന, രേഖകൾ, സാമ്പത്തിക അനുയോജ്യത എന്നിവ പൂർണ്ണമാണ്.',
    },
    mr: {
      label: 'अर्जासाठी तयार',
      summary: 'प्रोफाइल, पात्रता आढावा, कागदपत्रे आणि आर्थिक जुळणी यांमध्ये कोणतीही प्रलंबित बाब नाही.',
    },
  },
};

const READINESS_CHECK_LABELS: Record<string, Record<Language, string>> = {
  PROFILE: {
    en: 'Profile completeness',
    hi: 'प्रोफाइल पूर्णता',
    ta: 'சுயவிவர முழுமை',
    te: 'ప్రొఫైల్ సంపూర్ణత',
    kn: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣತೆ',
    ml: 'പ്രൊഫൈൽ പൂർണ്ണത',
    mr: 'प्रोफाइल पूर्णता',
  },
  ELIGIBILITY: {
    en: 'Eligibility review',
    hi: 'पात्रता समीक्षा',
    ta: 'தகுதி மதிப்பாய்வு',
    te: 'అర్హత సమీక్ష',
    kn: 'ಅರ್ಹತಾ ಪರಿಶೀಲನೆ',
    ml: 'യോഗ്യതാ പരിശോധന',
    mr: 'पात्रता आढावा',
  },
  DOCUMENTS: {
    en: 'Documents',
    hi: 'दस्तावेज',
    ta: 'ஆவணங்கள்',
    te: 'పత్రాలు',
    kn: 'ದಾಖಲೆಗಳು',
    ml: 'രേഖകൾ',
    mr: 'कागदपत्रे',
  },
  FINANCIAL_FIT: {
    en: 'Financial fit',
    hi: 'वित्तीय अनुकूलता',
    ta: 'நிதிப் பொருத்தம்',
    te: 'ఆర్థిక సరిపోలిక',
    kn: 'ಹಣಕಾಸಿನ ಹೊಂದಾಣಿಕೆ',
    ml: 'സാമ്പത്തിക അനുയോજ്യത',
    mr: 'आर्थिक जुळणी',
  },
};

const SUPPORT_AREA_REASONS_LOCALIZED: Record<SupportAreaSource, Record<Language, string>> = {
  PRIMARY_NEED: {
    en: 'You selected this as your primary support priority.',
    hi: 'आपने इसे अपनी प्राथमिक सहायता आवश्यकता के रूप में चुना है।',
    ta: 'இதை உங்கள் முதன்மையான ஆதரவு முன்னுரிமையாக தேர்ந்தெடுத்துள்ளீர்கள்.',
    te: 'మీరు దీన్ని మీ ప్రాథమిక మద్దతు ప్రాధాన్యతగా ఎంచుకున్నారు.',
    kn: '���ೀವು ಇದನ್ನು ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಬೆಂಬಲ ಆದ್ಯತೆಯಾಗಿ ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ.',
    ml: 'നിങ്ങൾ ഇത് നിങ്ങളുടെ പ്രധാന സഹായ മുൻഗണനയായി തിരഞ്ഞെടുത്തു.',
    mr: 'तुम्ही याला तुमचे प्राथमिक सहाय्य प्राधान्य म्हणून निवडले आहे.',
  },
  DERIVED_FROM_PRIMARY_NEED: {
    en: 'Commonly delivered alongside your primary support priority.',
    hi: 'यह आपकी प्राथमिक आवश्यकता के साथ सामान्यतः उपलब्ध सहायता है।',
    ta: 'உங்கள் முதன்மை ஆதரவு முன்னுரிமையுடன் பொதுவாக வழங்கப்படுகிறது.',
    te: 'సాధారణంగా మీ ప్రాథమిక మద్దతు ప్రాధాన్యతతో పాటు అందించబడుతుంది.',
    kn: 'ಸಾಮಾನ್ಯವಾಗಿ ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಬೆಂಬಲ ಆದ್ಯತೆಯೊಂದಿಗೆ ಒದಗಿಸಲಾಗುತ್ತದೆ.',
    ml: 'നിങ്ങളുടെ പ്രധാന സഹായ മുൻഗണനയ്ക്കൊപ്പം സാധാരണയായി നൽകപ്പെടുന്നു.',
    mr: 'तुमच्या प्राथमिक सहाय्य प्राधान्यासोबत सामान्यतः दिली जाणारी सहाय्यता.',
  },
  SECONDARY_NEED: {
    en: 'You selected this as an additional support need.',
    hi: 'आपने इसे अतिरिक्त सहायता आवश्यकता के रूप में चुना है।',
    ta: 'இதை கூடுதல் ஆதரவுத் தேவையாக தேர்ந்தெடுத்துள்ளீர்கள்.',
    te: 'మీరు దీన్ని అదనపు మద్దతు అవసరంగా ఎంచుకున్నారు.',
    kn: 'ನೀವು ಇದನ್ನು ಹೆಚ್ಚುವರಿ ಬೆಂಬಲ ಅಗತ್ಯವಾಗಿ ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ.',
    ml: 'നിങ്ങൾ ഇത് അധിക സഹായ ആവശ്യമായി തിരഞ്ഞെടുത്തു.',
    mr: 'तुम्ही याला अतिरिक्त सहाय्य गरज म्हणून निवडले आहे.',
  },
  BUSINESS_STAGE: {
    en: 'Typical priority at this business stage. Prioritisation signal only, not an eligibility claim.',
    hi: 'इस व्यवसाय चरण में सामान्य प्राथमिकता। यह केवल प्राथमिकता संकेत है, पात्रता का दावा नहीं।',
    ta: 'இந்த வணிக நிலையில் பொதுவான முன்னுரிமை. இது முன்னுரிமை அறிகுறி மட்டுமே, தகுதி கோரிக்கை அல்ல.',
    te: 'ఈ వ్యాపార దశలో సాధారణ ప్రాధాన్యత. ఇది ప్రాధాన్యతా సంకేతం మాత్రమే, అర్హత దావా కాదు.',
    kn: 'ಈ ವ್ಯವಹಾರದ ಹಂತದಲ್ಲಿ ಸಾಮಾನ್ಯ ಆದ್ಯತೆ. ಇದು ಆದ್ಯತೆಯ ಸಂಕೇತ ಮಾತ್ರ, ಅರ್ಹತೆಯ ಹಕ್ಕಲ್ಲ.',
    ml: 'ഈ ബിസിനസ്സ് ഘട്ടത്തിലെ സാധാരണ മുൻഗണന. ഇത് മുൻഗണനാ സൂചന മാത്രമാണ്, യോഗ്യതാ അവകാശവാദമല്ല.',
    mr: 'या व्यवसायाच्या अवस्थेत सामान्य प्राधान्य. हे फक्त प्राधान्य संकेत आहे, पात्रतेचा दावा नाही.',
  },
};

export function getLocalizedSupportAreaReason(
  area: RecommendedSupportArea,
  lang: Language = 'en'
): string {
  const dict = SUPPORT_AREA_REASONS_LOCALIZED[area.source];
  if (dict && dict[lang]) {
    return dict[lang];
  }
  return resolveLocalizedPair(area.reasonEn, area.reasonHi, lang);
}

export function getLocalizedReadiness(
  readiness: ApplicationReadiness,
  lang: Language = 'en'
): { label: string; summary: string } {
  const meta = READINESS_META_LOCALIZED[readiness.state];
  if (meta && meta[lang]) {
    return meta[lang];
  }
  return {
    label: resolveLocalizedPair(readiness.labelEn, readiness.labelHi, lang),
    summary: resolveLocalizedPair(readiness.summaryEn, readiness.summaryHi, lang),
  };
}

export function getLocalizedReadinessCheck(
  check: ReadinessCheck,
  lang: Language = 'en'
): { label: string; detail: string } {
  const labels = READINESS_CHECK_LABELS[check.key];
  const label = labels ? resolveLocalized(labels, lang) : resolveLocalizedPair(check.labelEn, check.labelHi, lang);
  const detail = resolveLocalizedPair(check.detailEn, check.detailHi, lang);
  return { label, detail };
}

const CHECKLIST_UNVERIFIED_LOCALIZED: Record<Language, string> = {
  en: 'Document requirements are not fully verified for this scheme. Check the official scheme guidelines.',
  hi: 'इस योजना हेतु दस्तावेज आवश्यकताएं पूर्णतः सत्यापित नहीं हैं। आधिकारिक दिशानिर्देश देखें।',
  ta: 'இந்தத் திட்டத்திற்கான ஆவணத் தேவைகள் முழுமையாகச் சரிபார்க்கப்படவில்லை. அதிகாரப்பூர்வ திட்ட வழிகாட்டுதல்களைப் பார்க்கவும்.',
  te: 'ఈ పథకానికి పత్ర అవసరాలు పూర్తిగా ధృవీకరించబడలేదు. అధికారిక పథకం మార్గదర్శకాలను తనిఖీ చేయండి.',
  kn: 'ಈ ಯೋಜನೆಗೆ ದಾಖಲಾತಿ ಅವಶ್ಯಕತೆಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ. ಅಧಿಕೃತ ಯೋಜನೆಯ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
  ml: 'ഈ പദ്ധതിക്കായി രേഖകളുടെ ആവശ്യകതകൾ പൂർണ്ണമായി പരിശോധിച്ചിട്ടില്ല. ഔദ്യോഗിക പദ്ധതി മാർഗ്ഗനിർദ്ദേശങ്ങൾ പരിശോധിക്കുക.',
  mr: 'या योजनेसाठी कागदपत्रांच्या आवश्यकतांची पूर्णपणे सत्यापिती झालेली नाही. अधिकृत योजना मार्गदर्शक तत्त्वे तपासा.',
};

const CHECKLIST_SELECT_SCHEME_LOCALIZED: Record<Language, string> = {
  en: 'Select a scheme to see its preparation requirements.',
  hi: 'तैयारी आवश्यकताएं देखने हेतु कोई योजना चुनें।',
  ta: 'தயாரிப்புத் தேவைகளைப் பார்க்க ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்.',
  te: 'దాని తయారీ అవసరాలను చూడటానికి ఒక పథకాన్ని ఎంచుకోండి.',
  kn: 'ಅದರ ಸಿದ್ಧತೆಯ ಅವಶ್ಯಕತೆಗಳನ್ನು ನೋಡಲು ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  ml: 'തയ്യാറെടുപ്പ് ആവശ്യകതകൾ കാണുന്നതിന് ഒരു പദ്ധതി തിരഞ്ഞെടുക്കുക.',
  mr: 'तयारीच्या आवश्यकता पाहण्यासाठी एक योजना निवडा.',
};

export function getLocalizedChecklistSummary(
  checklist: PreparationChecklistResult,
  lang: Language = 'en'
): string {
  if (checklist.requirementsUnverified) {
    if (!checklist.schemeId) {
      return CHECKLIST_SELECT_SCHEME_LOCALIZED[lang] || checklist.summaryEn;
    }
    return CHECKLIST_UNVERIFIED_LOCALIZED[lang] || checklist.summaryEn;
  }
  const prepared = checklist.preparedCount;
  const total = checklist.totalCount;
  switch (lang) {
    case 'hi':
      return `${total} में से ${prepared} तैयार`;
    case 'ta':
      return `${total}-இல் ${prepared} தயாராக உள்ளது`;
    case 'te':
      return `${total} లో ${prepared} సిద్ధంగా ఉంది`;
    case 'kn':
      return `${total} ರಲ್ಲಿ ${prepared} ಸಿದ್ಧವಾಗಿದೆ`;
    case 'ml':
      return `${total}-ൽ ${prepared} തയ്യാറാണ്`;
    case 'mr':
      return `${total} पैकी ${prepared} तयार`;
    default:
      return `${prepared} of ${total} prepared`;
  }
}

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
  lang: Language = 'en'
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
interface BuildSupportPathwayInput {
  profile: UserProfile;
  matchResults: MatchResult[];
  /** The scheme currently in focus, when the user has opened one. */
  selectedMatch?: MatchResult | null;
  preparedDocIds?: string[] | Set<string>;
  hasEngagedWithChecklist?: boolean;
  needProfile?: BusinessNeedProfile;
  lang?: Language;
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
    input.needProfile || (profile ? profile.businessNeedProfile || deriveBusinessNeedProfile(profile) : null);

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
