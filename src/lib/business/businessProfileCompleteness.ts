import { UserProfile } from '../../types/user';

export interface MissingFieldPrompt {
  fieldKey: string;
  labelEn: string;
  labelHi: string;
  priority: 'HIGH' | 'MEDIUM';
  helperEn: string;
  helperHi: string;
}

export interface ProfileCompletenessResult {
  score: number;
  maxScore: number;
  percentage: number;
  isSufficientForMatching: boolean;
  missingHighValueFields: MissingFieldPrompt[];
}

/**
 * Calculates completeness score for the entrepreneur's business profile.
 * Highlights high-value gaps that, if completed, unlock sharper scheme discovery.
 */
export function calculateBusinessProfileCompleteness(
  profile: Partial<UserProfile> | null | undefined
): ProfileCompletenessResult {
  if (!profile) {
    return {
      score: 0,
      maxScore: 10,
      percentage: 0,
      isSufficientForMatching: false,
      missingHighValueFields: [
        {
          fieldKey: 'businessStage',
          labelEn: 'Business Stage',
          labelHi: 'व्यवसाय चरण',
          priority: 'HIGH',
          helperEn: 'Specify whether your business is new, existing, or in planning.',
          helperHi: 'बताएं कि आपका व्यवसाय नया है, सक्रिय है या विचार स्तर पर है।',
        },
        {
          fieldKey: 'fundingRequired',
          labelEn: 'Funding Requirement',
          labelHi: 'वित्तीय आवश्यकता',
          priority: 'HIGH',
          helperEn: 'Add your project cost or estimated funding need.',
          helperHi: 'अपनी परियोजना लागत या अनुमानित वित्तीय आवश्यकता दर्ज करें।',
        },
      ],
    };
  }

  const missing: MissingFieldPrompt[] = [];
  let score = 0;
  const maxScore = 13;

  // 1. Business Stage (Weight: 2)
  if (profile.businessStageKey || profile.businessStage) {
    score += 2;
  } else {
    missing.push({
      fieldKey: 'businessStage',
      labelEn: 'Business Stage',
      labelHi: 'व्यवसाय की वर्तमान स्थिति',
      priority: 'HIGH',
      helperEn: 'Clarifies whether you need seed capital, working capital, or expansion loans.',
      helperHi: 'यह स्पष्ट करता है कि आपको बीज पूंजी, कार्यशील पूंजी या विस्तार ऋण चाहिए।',
    });
  }

  // 2. Business Type / Sector (Weight: 2)
  if (profile.businessType || profile.sector) {
    score += 2;
  } else {
    missing.push({
      fieldKey: 'businessType',
      labelEn: 'Sector / Business Type',
      labelHi: 'कार्यक्षेत्र अथवा क्षेत्रक',
      priority: 'HIGH',
      helperEn: 'Identifies ministry-specific quotas (e.g. food processing, manufacturing, artisans).',
      helperHi: 'मंत्रालय विशिष्ट योजनाओं (खाद्य, विनिर्माण, हस्तशिल्प आदि) की पहचान करता है।',
    });
  }

  // 3. Financial Need / Funding Gap (Weight: 2)
  const hasFunding =
    (profile.totalProjectCost && profile.totalProjectCost > 0) ||
    (profile.fundingRequired && profile.fundingRequired > 0) ||
    Boolean(profile.fundingRangeId);

  if (hasFunding) {
    score += 2;
  } else {
    missing.push({
      fieldKey: 'fundingRequired',
      labelEn: 'Total Project Cost / Funding Need',
      labelHi: 'परियोजना लागत अथवा ऋण आवश्यकता',
      priority: 'HIGH',
      helperEn: 'Enables checking loan caps and capital subsidy ceilings.',
      helperHi: 'योजना की अधिकतम ऋण सीमा एवं सब्सिडी दरों का मिलान करता है।',
    });
  }

  // 4. Registration Status (Weight: 1)
  const hasReg =
    profile.registrationStatus !== undefined &&
    profile.registrationStatus !== 'UNKNOWN' &&
    profile.registrationStatus !== null;

  if (hasReg || profile.businessRegistration !== undefined) {
    score += 1;
  } else {
    missing.push({
      fieldKey: 'registrationStatus',
      labelEn: 'Formal Registration Status',
      labelHi: 'पंजीकरण स्थिति (Udyam/GST)',
      priority: 'MEDIUM',
      helperEn: 'Confirms eligibility for formal MSME priority credit guarantees.',
      helperHi: 'औपचारिक एमएसएमई गारंटी एवं ब्याज छूट योजनाओं हेतु पात्रता सुनिश्चित करता है।',
    });
  }

  // 5. Operational Status (Weight: 1)
  const hasOperationalStatus =
    profile.operationalStatus !== undefined &&
    profile.operationalStatus !== 'UNKNOWN' &&
    profile.operationalStatus !== null;

  if (hasOperationalStatus || profile.hasExistingBusiness !== undefined) {
    score += 1;
  } else {
    missing.push({
      fieldKey: 'operationalStatus',
      labelEn: 'Operational Status',
      labelHi: 'परिचालन स्थिति',
      priority: 'MEDIUM',
      helperEn: 'Distinguishes between pre-launch, active operating units, and expansion.',
      helperHi: 'लॉन्च पूर्व, सक्रिय परिचालन एवं विस्तार इकाइयों में भेद करता है।',
    });
  }

  // 6. Business Legal Structure / Entity Type (Weight: 1)
  if (profile.businessEntityType) {
    score += 1;
  } else {
    missing.push({
      fieldKey: 'businessEntityType',
      labelEn: 'Legal Entity Structure',
      labelHi: 'विधिक संरचना (प्रोपराइटरशिप/एलएलपी/प्राइवेट लि.)',
      priority: 'MEDIUM',
      helperEn: 'Matches corporate, partnership, or solo artisan scheme criteria.',
      helperHi: 'कॉर्पोरेट, साझेदारी या व्यक्तिगत कारीगर पात्रता का मिलान करता है।',
    });
  }

  // 7. State & Location / Domicile (Weight: 1)
  if (profile.businessState || profile.residenceState || profile.state) {
    score += 1;
  } else {
    missing.push({
      fieldKey: 'state',
      labelEn: 'Business State / Territory',
      labelHi: 'व्यवसाय का राज्य',
      priority: 'HIGH',
      helperEn: 'Required to filter state government incentives and nodal agency portals.',
      helperHi: 'राज्य सरकार की योजनाओं एवं नोडल एजेंसियों के चयन हेतु आवश्यक है।',
    });
  }

  // 8. Primary Support Need (Weight: 1)
  if (profile.primarySupportNeed) {
    score += 1;
  } else {
    missing.push({
      fieldKey: 'primarySupportNeed',
      labelEn: 'Primary Support Priority',
      labelHi: 'प्राथमिक आवश्यकता (ऋण/मशीनरी/सब्सिडी)',
      priority: 'MEDIUM',
      helperEn: 'Tailors recommendations specifically for machinery, working capital, or training.',
      helperHi: 'मशीनरी, कार्यशील पूंजी अथवा प्रशिक्षण जैसी प्राथमिक आवश्यकता पर केंद्रित करता है।',
    });
  }

  // 9. Secondary Support Needs (Weight: 1)
  if (profile.secondarySupportNeeds && profile.secondarySupportNeeds.length > 0) {
    score += 1;
  } else {
    missing.push({
      fieldKey: 'secondarySupportNeeds',
      labelEn: 'Additional Support Needs',
      labelHi: 'अतिरिक्त व्यावसायिक आवश्यकताएं',
      priority: 'MEDIUM',
      helperEn: 'Adds secondary assistance criteria such as market access or certification.',
      helperHi: 'बाजार संपर्क अथवा प्रमाणन जैसी अतिरिक्त सहायता आवश्यकताओं को जोड़ता है।',
    });
  }

  // 10. Experience & Profile Context (Weight: 1)
  if (
    profile.entrepreneurExperienceYears !== undefined ||
    profile.businessIdea ||
    profile.businessName ||
    profile.subSector ||
    profile.applicantName
  ) {
    score += 1;
  }

  const percentage = Math.min(100, Math.round((score / maxScore) * 100));
  const isSufficientForMatching = score >= 5; // Has basic demographics + business type + stage/funding

  return {
    score,
    maxScore,
    percentage,
    isSufficientForMatching,
    missingHighValueFields: missing,
  };
}
