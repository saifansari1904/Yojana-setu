import { Scheme } from '../../types/scheme';
import {
  BusinessNeedProfile,
  SchemeBusinessRelevance,
  SupportNeedType,
  SUPPORT_NEEDS_TAXONOMY,
} from '../../types/business';
import { mapKeyToLegacyStage } from './businessJourney';
import { formatLakhCrore } from './fundingCalculator';

/**
 * Maps a Scheme's structural parameters to the support needs it natively satisfies.
 */
export function getSchemeSupportedNeeds(scheme: Scheme): SupportNeedType[] {
  const supported = new Set<SupportNeedType>();

  // Subsidy schemes
  const subsidyPercent = scheme.subsidyRatePercent ?? scheme.intelligence?.financial?.subsidyPercentage;
  if (subsidyPercent && subsidyPercent > 0) {
    supported.add('SUBSIDY');
  }

  // Credit / Bank loan schemes
  const maxLoan = scheme.maxAmount ?? scheme.intelligence?.financial?.maxFunding ?? 0;
  if (maxLoan > 0) {
    supported.add('CREDIT');
  }

  // Purpose-based mapping
  if (scheme.fundingPurpose) {
    const purpose = scheme.fundingPurpose.toLowerCase();
    if (purpose.includes('seed') || purpose.includes('startup')) {
      supported.add('CAPITAL');
    }
    if (purpose.includes('working') || purpose.includes('operational')) {
      supported.add('WORKING_CAPITAL');
    }
    if (purpose.includes('equipment') || purpose.includes('machinery') || purpose.includes('plant')) {
      supported.add('EQUIPMENT');
    }
    if (purpose.includes('infra')) {
      supported.add('INFRASTRUCTURE');
    }
    if (purpose.includes('tech')) {
      supported.add('TECHNOLOGY');
    }
    if (purpose.includes('skill') || purpose.includes('training')) {
      supported.add('TRAINING');
      supported.add('SKILL_DEVELOPMENT');
    }
    if (purpose.includes('market') || purpose.includes('export')) {
      supported.add('MARKET_ACCESS');
    }
  }

  // Fallback heuristic based on scheme type and tags
  const tags = (scheme.tags || []).map((t) => t.toLowerCase());
  const name = scheme.name.toLowerCase();

  if (tags.includes('equipment') || tags.includes('machinery') || name.includes('equipment')) {
    supported.add('EQUIPMENT');
  }
  if (tags.includes('subsidy') || tags.includes('grant')) {
    supported.add('SUBSIDY');
  }
  if (tags.includes('credit') || tags.includes('loan') || tags.includes('mudra')) {
    supported.add('CREDIT');
  }
  if (tags.includes('training') || tags.includes('edp') || name.includes('training')) {
    supported.add('TRAINING');
  }
  if (tags.includes('artisan') || tags.includes('pm vishwakarma')) {
    supported.add('SKILL_DEVELOPMENT');
    supported.add('EQUIPMENT');
  }
  if (tags.includes('marketing') || tags.includes('vendor')) {
    supported.add('MARKET_ACCESS');
  }

  // If nothing matched, default to general capital
  if (supported.size === 0) {
    supported.add('CAPITAL');
  }

  return Array.from(supported);
}

/**
 * Evaluates business need relevance of a scheme for an entrepreneur.
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * This function DOES NOT modify, influence, or recalculate the 100% statutory Profile Match score.
 * It produces an independent business-fit advisory signal.
 */
export function evaluateBusinessRelevance(
  scheme: Scheme,
  needProfile: BusinessNeedProfile | null | undefined,
  lang: 'en' | 'hi' = 'en'
): SchemeBusinessRelevance {
  const isHi = lang === 'hi';

  if (!needProfile) {
    return {
      relevanceLevel: 'UNKNOWN',
      badgeLabelEn: 'Relevance Not Evaluated',
      badgeLabelHi: 'प्रासंगिकता अनिर्धारित',
      matchedNeeds: [],
      stageFit: 'UNKNOWN',
      explanationEn: 'Provide business stage and support priorities to evaluate tailored business relevance.',
      explanationHi: 'व्यावसायिक प्रासंगिकता का आकलन करने हेतु अपने व्यवसाय का चरण एवं प्राथमिक आवश्यकताएं दर्ज करें।',
      provenance: 'UNKNOWN',
    };
  }

  const schemeNeeds = getSchemeSupportedNeeds(scheme);
  const matchedNeedTypes: SupportNeedType[] = [];

  // Check primary need match
  let primaryMatched = false;
  if (needProfile.primaryNeed && schemeNeeds.includes(needProfile.primaryNeed)) {
    primaryMatched = true;
    matchedNeedTypes.push(needProfile.primaryNeed);
  }

  // Check secondary needs match
  for (const sNeed of needProfile.secondaryNeeds) {
    if (schemeNeeds.includes(sNeed) && !matchedNeedTypes.includes(sNeed)) {
      matchedNeedTypes.push(sNeed);
    }
  }

  // Check business stage compatibility
  const legacyStage = mapKeyToLegacyStage(needProfile.currentStage);
  const targetStages = scheme.intelligence?.eligibility?.targetBusinessStages || [];

  let stageFit: 'ALIGNED' | 'BROAD' | 'MISALIGNED' | 'UNKNOWN' = 'BROAD';
  if (targetStages.length > 0) {
    if (targetStages.includes(legacyStage)) {
      stageFit = 'ALIGNED';
    } else {
      // Check if target stages has 'existing' and current is scaling/expanding
      if (
        targetStages.includes('existing') &&
        ['EARLY_OPERATION', 'GROWTH', 'EXPANSION', 'DISTRESS_OR_RESTRUCTURING'].includes(
          needProfile.currentStage
        )
      ) {
        stageFit = 'ALIGNED';
      } else if (
        targetStages.includes('new') &&
        ['IDEA', 'PRE_LAUNCH', 'NEW_BUSINESS'].includes(needProfile.currentStage)
      ) {
        stageFit = 'ALIGNED';
      } else {
        stageFit = 'MISALIGNED';
      }
    }
  }

  // Check funding gap fit
  let fundingFitNoteEn: string | undefined;
  let fundingFitNoteHi: string | undefined;

  if (needProfile.fundingGap > 0) {
    const loanMax = scheme.maxAmount ?? scheme.intelligence?.financial?.maxFunding ?? 0;
    const loanMin = scheme.minAmount ?? scheme.intelligence?.financial?.minFunding ?? 0;

    if (loanMax > 0) {
      if (needProfile.fundingGap <= loanMax && needProfile.fundingGap >= loanMin) {
        fundingFitNoteEn = `Covers your estimated funding gap of ${formatLakhCrore(needProfile.fundingGap, 'en')} within statutory credit limits.`;
        fundingFitNoteHi = `आपकी अनुमानित ₹${formatLakhCrore(needProfile.fundingGap, 'hi')} की वित्तीय आवश्यकता को वैधानिक ऋण सीमा के भीतर पूरा करता है।`;
      } else if (needProfile.fundingGap > loanMax) {
        fundingFitNoteEn = `Scheme max limit of ${formatLakhCrore(loanMax, 'en')} provides partial coverage of your ${formatLakhCrore(needProfile.fundingGap, 'en')} funding gap.`;
        fundingFitNoteHi = `योजना की अधिकतम सीमा ₹${formatLakhCrore(loanMax, 'hi')} आपकी ₹${formatLakhCrore(needProfile.fundingGap, 'hi')} की आवश्यकता को आंशिक रूप से पूरा करती है।`;
      }
    }
  }

  // Determine relevance level
  let relevanceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' = 'MEDIUM';

  if (primaryMatched && stageFit === 'ALIGNED') {
    relevanceLevel = 'HIGH';
  } else if (primaryMatched || (matchedNeedTypes.length >= 2 && stageFit !== 'MISALIGNED')) {
    relevanceLevel = 'HIGH';
  } else if (stageFit === 'MISALIGNED') {
    relevanceLevel = 'LOW';
  } else if (matchedNeedTypes.length === 0 && !needProfile.primaryNeed) {
    relevanceLevel = 'UNKNOWN';
  } else if (matchedNeedTypes.length === 0) {
    relevanceLevel = 'LOW';
  }

  // Matched needs formatting
  const formattedMatchedNeeds = matchedNeedTypes.map((type) => {
    const info = SUPPORT_NEEDS_TAXONOMY[type];
    return {
      needType: type,
      labelEn: info ? info.labelEn : type,
      labelHi: info ? info.labelHi : type,
    };
  });

  // Construct bilingual explanations
  let badgeLabelEn = 'Medium Business Relevance';
  let badgeLabelHi = 'मध्यम व्यावसायिक प्रासंगिकता';
  let explanationEn = 'This scheme provides general enterprise credit matching your industry profile.';
  let explanationHi = 'यह योजना आपके उद्योग के अनुकूल सामान्य उद्यम वित्तीय सहायता प्रदान करती है।';

  if (relevanceLevel === 'HIGH') {
    badgeLabelEn = 'High Business Need Relevance';
    badgeLabelHi = 'उच्च व्यावसायिक प्रासंगिकता';
    const topNeedLabelEn = formattedMatchedNeeds[0]?.labelEn || 'your target priorities';
    const topNeedLabelHi = formattedMatchedNeeds[0]?.labelHi || 'आपकी प्राथमिकताओं';
    explanationEn = `Directly addresses your primary requirement for ${topNeedLabelEn} and aligns with your ${needProfile.currentStage.replace(/_/g, ' ').toLowerCase()} stage.`;
    explanationHi = `यह योजना सीधे तौर पर ${topNeedLabelHi} की आपकी आवश्यकता को पूरा करती है एवं आपके व्यावसायिक चरण के अनुकूल है।`;
  } else if (relevanceLevel === 'LOW') {
    badgeLabelEn = 'Low Need Relevance';
    badgeLabelHi = 'कम आवश्यकता मेल';
    explanationEn = 'Scheme focus does not directly target your primary operational support need or stage.';
    explanationHi = 'योजना का मुख्य उद्देश्य आपकी प्राथमिक व्यावसायिक आवश्यकता या परिचालन चरण से भिन्न है।';
  } else if (relevanceLevel === 'UNKNOWN') {
    badgeLabelEn = 'Relevance Broad / Unspecified';
    badgeLabelHi = 'व्यापक प्रासंगिकता';
    explanationEn = 'General funding available; specify priority business needs to refine relevance.';
    explanationHi = 'सामान्य वित्तीय सहायता उपलब्ध; सटीक प्रासंगिकता हेतु अपनी प्राथमिकताएं निर्दिष्ट करें।';
  }

  return {
    relevanceLevel,
    badgeLabelEn,
    badgeLabelHi,
    matchedNeeds: formattedMatchedNeeds,
    stageFit,
    explanationEn,
    explanationHi,
    fundingFitNoteEn,
    fundingFitNoteHi,
    provenance: 'DERIVED',
  };
}
