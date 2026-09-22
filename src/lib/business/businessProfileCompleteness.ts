import { UserProfile } from '../../types/user';
import type { Language } from '../../i18n/types';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

export interface MissingFieldPrompt {
  fieldKey: string;
  labelKey?: string;
  helperKey?: string;
  /** @deprecated Compatibility display snapshots. */
  labelEn: string;
  labelHi: string;
  priority: 'HIGH' | 'MEDIUM';
  helperEn?: string;
  helperHi?: string;
}

function withSemanticFieldKeys(prompt: MissingFieldPrompt): MissingFieldPrompt {
  return { ...prompt, labelKey: prompt.labelKey || `business.fields.${prompt.fieldKey}`, helperKey: prompt.helperKey || `business.fields.${prompt.fieldKey}Helper` };
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
      missingHighValueFields: ([
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
      ] as MissingFieldPrompt[]).map(withSemanticFieldKeys),
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
    missingHighValueFields: missing.map(withSemanticFieldKeys),
  };
}

const MISSING_FIELD_LOCALIZED: Record<string, Record<Language, { label: string; helper: string }>> = {
  businessStage: {
    en: {
      label: 'Business Stage',
      helper: 'Clarifies whether you need seed capital, working capital, or expansion loans.',
    },
    hi: {
      label: 'व्यवसाय की वर्तमान स्थिति',
      helper: 'यह स्पष्ट करता है कि आपको बीज पूंजी, कार्यशील पूंजी या विस्तार ऋण चाहिए।',
    },
    ta: {
      label: 'வணிக நிலை',
      helper: 'உங்களுக்கு ஆரம்ப மூலதனம், செயல்பாட்டு மூலதனம் அல்லது விரிவாக்கக் கடன் தேவையா என்பதை விளக்குகிறது.',
    },
    te: {
      label: 'వ్యాపార దశ',
      helper: 'మీకు సీడ్ క్యాపిటల్, వర్కింగ్ క్యాపిటల్ లేదా విస్తరణ రుణాలు అవసరమా అని స్పష్టం చేస్తుంది.',
    },
    kn: {
      label: 'ವ್ಯವಹಾರದ ಹಂತ',
      helper: 'ನಿಮಗೆ ಆರಂಭಿಕ ಬಂಡವಾಳ, ದುಡಿಯುವ ಬಂಡವಾಳ ಅಥವಾ ವಿಸ್ತರಣಾ ಸಾಲದ ಅಗತ್ಯವಿದೆಯೇ ಎಂದು ಸ್ಪಷ್ಟಪಡಿಸುತ್ತದೆ.',
    },
    ml: {
      label: 'ബിസിനസ്സ് ഘട്ടം',
      helper: 'നിങ്ങൾക്ക് പ്രാരംഭ മൂലധനമോ പ്രവർത്തന മൂലധനമോ വിപുലീകരണ വായ്പയോ ആവശ്യമുണ്ടോ എന്ന് വ്യക്തമാക്കുന്നു.',
    },
    mr: {
      label: 'व्यवसायाची सद्यःस्थिती',
      helper: 'तुम्हाला बीज भांडवल, खेळते भांडवल की विस्तार कर्ज आवश्यक आहे हे स्पष्ट करते.',
    },
  },
  businessType: {
    en: {
      label: 'Sector / Business Type',
      helper: 'Identifies ministry-specific quotas (e.g. food processing, manufacturing, artisans).',
    },
    hi: {
      label: 'कार्यक्षेत्र अथवा क्षेत्रक',
      helper: 'मंत्रालय विशिष्ट योजनाओं (खाद्य, विनिर्माण, हस्तशिल्प आदि) की पहचान करता है।',
    },
    ta: {
      label: 'துறை / வணிக வகை',
      helper: 'அமைச்சகக் குறிப்பிட்ட ஒதுக்கீடுகளை அடையாளம் காட்டுகிறது (உணவு பதப்படுத்துதல், உற்பத்தி, கைவினைஞர்கள்).',
    },
    te: {
      label: 'రంగం / వ్యాపార రకం',
      helper: 'మంత్రి��్వ శాఖ-నిర్దిష్ట కోటాలను గుర్తిస్తుంది (ఆహార ప్రాసెస��ంగ్, తయారీ, కళాకారులు).',
    },
    kn: {
      label: 'ಕ್ಷೇತ್ರ / ವ್ಯಾಪಾರದ ಪ್ರಕಾರ',
      helper: 'ಸಚಿವಾಲಯ-ನಿರ್ದಿಷ್ಟ ಕೋಟಾಗಳನ್ನು ಗುರುತಿಸುತ್ತದೆ (ಆಹಾರ ಸಂಸ್ಕರಣೆ, ಉತ್ಪಾದನೆ, ಕುಶಲಕರ್ಮಿಗಳು).',
    },
    ml: {
      label: 'മേഖല / ബിസിനസ്സ് തരം',
      helper: 'മന്ത്രാലയ നിർദ്ദിഷ്ട ക്വാട്ടകൾ തിരിച്ചറിയുന്നു (ഭക്ഷ്യ സംസ്കരണം, നിർമ്മാണം, കരകൗശല വിദഗ്ധർ).',
    },
    mr: {
      label: 'क्षेत्र / व्यवसायाचा प्रकार',
      helper: 'मंत्रालय-विशिष्ट कोटा (उदा. अन्न प्रक्रिया, उत्पादन, कारागीर) ओळखते.',
    },
  },
  fundingRequired: {
    en: {
      label: 'Total Project Cost / Funding Need',
      helper: 'Enables checking loan caps and capital subsidy ceilings.',
    },
    hi: {
      label: 'परियोजना लागत अथवा ऋण आवश्यकता',
      helper: 'योजना की अधिकतम ऋण सीमा एवं सब्सिडी दरों का मिलान करता है।',
    },
    ta: {
      label: 'மொத்த திட்டச் செலவு / நிதித் தேவை',
      helper: 'கடன் உச்சவரம்புகள் மற்றும் மூலதன மானிய வரம்புகளைச் சரிபார்க்க உதவுகிறது.',
    },
    te: {
      label: 'మొత్తం ప్రాజెక్ట్ ఖర్చు / నిధుల అవసరం',
      helper: 'రుణ పరిమితులు మరియు మూలధన సబ్సిడీ పరిమితులను తనిఖీ చేయడానికి అనుమతిస్తుంది.',
    },
    kn: {
      label: 'ಒಟ್ಟು ಯೋಜನಾ ವೆಚ್ಚ / ಹಣಕಾಸಿನ ಅಗತ್ಯ',
      helper: 'ಸಾಲದ ಮಿತಿಗಳು ಮತ್ತು ಬಂಡವಾಳ ಸಬ್ಸಿಡಿ ಸೀಲಿಂಗ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಅನುವು ಮಾಡಿಕೊಡುತ್ತದೆ.',
    },
    ml: {
      label: 'ആകെ പ്രോജക്റ്റ് ചെലവ് / ഫണ്ടിംഗ് ആവശ്യം',
      helper: 'വായ്പാ പരിധികളും സബ്‌സിഡി പരിധികളും പരിശോധിക്കാൻ സഹായിക്കുന്നു.',
    },
    mr: {
      label: 'एकूण प्रकल्प खर्च / निधीची गरज',
      helper: 'कर्ज मर्यादा आणि भांडवली अनुदानाच्या कमाल मर्यादा तपासण्यास सक्षम करते.',
    },
  },
  registrationStatus: {
    en: {
      label: 'Formal Registration Status',
      helper: 'Confirms eligibility for formal MSME priority credit guarantees.',
    },
    hi: {
      label: 'पंजीकरण स्थिति (Udyam/GST)',
      helper: 'औपचारिक एमएसएमई गारंटी एवं ब्याज छूट योजनाओं हेतु पात्रता सुनिश्चित करता है।',
    },
    ta: {
      label: 'முறையான பதிவு நிலை',
      helper: 'முறையான குறு, சிறு, நடுத்தர நிறுவன முன்னுரிமைக் கடன் உத்தரவாதங்களுக்கான தகுதியை உறுதி செய்கிறது.',
    },
    te: {
      label: 'అధికారిక నమోదు స్థితి',
      helper: 'అధికారిక MSME ప్రాధాన్యత క్ర��డిట్ హామీ�� కోసం అర్హతను నిర్ధారిస్తుంది.',
    },
    kn: {
      label: 'ಔಪಚಾರಿಕ ನೋಂದಣಿ ಸ್ಥಿತಿ',
      helper: 'ಔಪಚಾರಿಕ MSME ಆದ್ಯತೆಯ ಕ್ರೆಡಿಟ್ ಗ್ಯಾರಂಟಿಗಳಿಗೆ ಅರ್ಹತೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ.',
    },
    ml: {
      label: 'ഔദ്യോഗിക രജിസ്ട്രേഷൻ അവസ്ഥ',
      helper: 'ഔദ്യോഗിക എംഎസ്എംഇ വായ്പാ ഗ്യാരണ്ടികൾക്കുള്ള യോഗ്യത ഉറപ്പാക്കുന്നു.',
    },
    mr: {
      label: 'औपचारिक नोंदणी स्थिती',
      helper: 'औपचारिक MSME प्राधान्य कर्ज हमीसाठी पात्रता सुनिश्चित करते.',
    },
  },
  operationalStatus: {
    en: {
      label: 'Operational Status',
      helper: 'Distinguishes between pre-launch, active operating units, and expansion.',
    },
    hi: {
      label: 'परिचालन स्थिति',
      helper: 'लॉन्च पूर्व, सक्रिय परिचालन एवं विस्तार इकाइयों में भेद करता है।',
    },
    ta: {
      label: 'செயல்பாட்டு நிலை',
      helper: 'தொடங்குவதற்கு முந்தைய, செயல்படும் அலகுகள் மற்றும் விரிவாக்கத்திற்கு இடையே வேறுபடுத்துகிறது.',
    },
    te: {
      label: 'కార్యాచరణ స్థితి',
      helper: 'ప్రారంభానికి ముందు, క్రియాశీల నిర్వహణ యూనిట్లు మరియు విస్తరణ మధ్య వ్యత్యాసాన్ని చూపుతుంది.',
    },
    kn: {
      label: 'ಕಾರ್ಯಾಚರಣೆಯ ಸ್ಥಿತಿ',
      helper: 'ಪ್ರಾರಂಭದ ಮೊದಲು, ಸಕ್ರಿಯ ಘಟಕಗಳು ಮತ್ತು ವಿಸ್ತರಣೆಯ ನಡುವೆ ವ್ಯತ್ಯಾಸವನ್ನು ತೋರಿಸುತ್ತದೆ.',
    },
    ml: {
      label: 'പ്രവർത്തന അവസ്ഥ',
      helper: 'തുടങ്ങുന്നതിന് മുമ്പുള്ളവ, നിലവിൽ പ്രവർത്തിക്കുന്നവ, വിപുലീകരണം എന്നിവ തിരിച്ചറിയുന്നു.',
    },
    mr: {
      label: 'कार्यात्मक स्थिती',
      helper: 'प्रारंभापूर्वी, सक्रिय कार्यरत घटक आणि विस्तार यांमध्ये भेद करते.',
    },
  },
  businessEntityType: {
    en: {
      label: 'Legal Entity Structure',
      helper: 'Matches corporate, partnership, or solo artisan scheme criteria.',
    },
    hi: {
      label: 'विधिक संरचना (प्रोपराइटरशिप/एलएलपी/प्राइवेट लि.)',
      helper: 'कॉर्पोरेट, साझेदारी या व्यक्तिगत कारीगर पात्रता का मिलान करता है।',
    },
    ta: {
      label: 'சட்ட அமைப்பு வடிவம்',
      helper: 'நிறுவனங்கள், கூட்டாண்மை அல்லது தனி கைவினைஞர் திட்ட அளவுகோல்களுடன் பொருத்துகிறது.',
    },
    te: {
      label: 'చట్టపరమైన నిర్మాణ రూపం',
      helper: 'కార్పొరేట్, భాగస్వామ్య లేదా ఏకైక కళాకారుల పథక ప్రమాణాలతో సరిపోల్చుతుంది.',
    },
    kn: {
      label: 'ಕಾನೂನು ರಚನೆ',
      helper: 'ಕಾರ್ಪೊರೇಟ್, ಪಾಲುದಾರಿಕೆ ಅಥವಾ ಕುಶಲಕರ್ಮಿ ಯೋಜನೆಯ ಮಾನದಂಡಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.',
    },
    ml: {
      label: 'നിയമപരമായ ഘടന',
      helper: 'സ്ഥാപനത്തിന്റെ നിയമപരമായ ഘടനയ്ക്ക് അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്തുന്നു.',
    },
    mr: {
      label: 'कायदेशीर संरचना',
      helper: 'कॉर्पोरेट, भागीदारी किंवा एकल कारागीर योजना निकषांशी जुळवते.',
    },
  },
  state: {
    en: {
      label: 'Business State / Territory',
      helper: 'Required to filter state government incentives and nodal agency portals.',
    },
    hi: {
      label: 'व्यवसाय का राज्य',
      helper: 'राज्य सरकार की योजनाओं एवं नोडल एजेंसियों के चयन हेतु आवश्यक है।',
    },
    ta: {
      label: 'வணிக மாநிலம் / பிரதேசம்',
      helper: 'மாநில அரசு சலுகைகள் மற்றும் நோடல் ஏஜென்சி போர்ட்டல்களை வடிகட்ட தேவைப்படுகிறது.',
    },
    te: {
      label: 'వ్యాపార రాష్ట్రం / ప్రాంతం',
      helper: 'రాష్ట్ర ప్రభుత్వ ప్రోత్సాహకాలు మరియు పోర్టల్‌లను ఫిల్టర్ చేయడానికి అవసరం.',
    },
    kn: {
      label: 'ವ್ಯವಹಾರದ ರಾಜ್ಯ / ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶ',
      helper: 'ರಾಜ್ಯ ಸರ್ಕಾರದ ಪ್ರೋತ್ಸಾಹಕಗಳು ಮತ್ತು ಪೋರ್ಟಲ್‌ಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಲು ಅಗತ್ಯವಿದೆ.',
    },
    ml: {
      label: 'ബിസിനസ്സ് സംസ്ഥാനം',
      helper: 'സംസ്ഥാന സർക്കാർ ആനുകൂല്യങ്ങളും പോർട്ടലുകളും ഫിൽട്ടർ ചെയ്യാൻ ആവശ്യമാണ്.',
    },
    mr: {
      label: 'व्यवसायाचे राज्य / केंद्रशासित प्रदेश',
      helper: 'राज्य सरकारच्या प्रोत्साहन योजना आणि नोडल एजन्सी पोर्टल फिल्टर करण्यासाठी आवश्यक आहे.',
    },
  },
  primarySupportNeed: {
    en: {
      label: 'Primary Support Priority',
      helper: 'Tailors recommendations specifically for machinery, working capital, or training.',
    },
    hi: {
      label: 'प्राथमिक आवश्यकता (ऋण/मशीनरी/सब्सिडी)',
      helper: 'मशीनरी, कार्यशील पूंजी अथवा प्रशिक्षण जैसी प्राथमिक आवश्यकता पर केंद्रित करता है।',
    },
    ta: {
      label: 'முதன்மையான ஆதரவு முன்னுரிமை',
      helper: 'இயந்திரங்கள், செயல்பாட்டு மூலதனம் அல்லது பயிற்சிக்கான பரிந்துரைகளைத் தனிப்பயனாக்குகிறது.',
    },
    te: {
      label: 'ప్రాథమిక మద్దతు ప్రాధాన్యత',
      helper: 'యంత్రాలు, వర్కింగ్ క్యాపిటల్ లేదా శిక్షణ కోసం సిఫార్సులను ప్రత్యేకంగా రూపొందిస్తుంది.',
    },
    kn: {
      label: 'ಪ್ರಾಥಮಿಕ ಬೆಂಬಲ ಆದ್ಯತೆ',
      helper: 'ಯಂತ್ರೋಪಕರಣಗಳು, ದುಡಿಯುವ ಬಂಡವಾಳ ಅಥವಾ ತರಬೇತಿಗಾಗಿ ಶಿಫಾರಸುಗಳನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.',
    },
    ml: {
      label: 'പ്രധാന സഹായ മുൻഗണന',
      helper: 'മെഷിനറി, പ്രവർത്തന മൂലധനം, അല്ലെങ്കിൽ പരിശീലനം എന്നിവയ്ക്കുള്ള ശുപാർശകൾ നൽകുന്നു.',
    },
    mr: {
      label: 'प्राथमिक सहाय्य प्राधान्य',
      helper: 'यंत्रसामग्री, खेळते भांडवल किंवा प्रशिक्षण यासाठी विशेष शिफारशी तयार करते.',
    },
  },
  secondarySupportNeeds: {
    en: {
      label: 'Additional Support Needs',
      helper: 'Adds secondary assistance criteria such as market access or certification.',
    },
    hi: {
      label: 'अतिरिक्त व्यावसायिक आवश्यकताएं',
      helper: 'बाजार संपर्क अथवा प्रमाणन जैसी अतिरिक्त सहायता आवश्यकताओं को जोड़ता है।',
    },
    ta: {
      label: 'கூடுதல் ஆதரவுத் தேவைகள்',
      helper: 'சந்தை அணுகல் அல்லது சான்றிதழ் போன்ற கூடுதல் உதவி அளவுகோல்களைச் சேர்க்கிறது.',
    },
    te: {
      label: 'అదనపు మద్దతు అవసరాలు',
      helper: 'మార్కెట్ యాక్సెస్ లేదా సర్టిఫికేషన్ వంటి ద్వితీయ సహాయ ప్రమాణాలను జోడిస్తుంది.',
    },
    kn: {
      label: 'ಹೆಚ್ಚುವರಿ ಬೆಂಬಲ ಅಗತ್ಯಗಳು',
      helper: 'ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ ಅಥವಾ ಪ್ರಮಾಣೀಕರಣದಂತಹ ಹೆಚ್ಚುವರಿ ನೆರವಿನ ಮಾನದಂಡಗಳನ್ನು ಸೇರಿಸುತ್ತದೆ.',
    },
    ml: {
      label: 'കൂടുതൽ സഹായ ആവശ്യങ്ങൾ',
      helper: 'വിപണി പ്രവേശനം, സർട്ടിഫിക്കേഷൻ തുടങ്ങിയ അധിക സഹായ മാനദണ്ഡങ്ങൾ ചേർക്കുന്നു.',
    },
    mr: {
      label: 'अतिरिक्त सहाय्य गरजा',
      helper: 'बाजारपेठ प्रवेश किंवा प्रमाणीकरण यांसारखे दुय्यम सहाय्य निकष जोडते.',
    },
  },
};

export function getLocalizedMissingFieldPrompt(
  prompt: MissingFieldPrompt,
  lang: Language = 'en'
): { label: string; helper: string } {
  const dict = MISSING_FIELD_LOCALIZED[prompt.fieldKey];
  if (dict && dict[lang]) {
    return dict[lang];
  }
  return {
    label: resolveLocalizedPair(prompt.labelEn, prompt.labelHi, lang),
    helper: resolveLocalizedPair(prompt.helperEn, prompt.helperHi, lang),
  };
}
