import type { Scheme } from '../../types';
import type { UserProfile } from '../../types/user';
import type { FundingFitAnalysis, FundingFitStatus } from '../../types/matching';
import type { Language } from '../../i18n/types';
import { formatCurrency } from '../eligibility/eligibilityEngine';

export type { FundingFitAnalysis, FundingFitStatus };

const STATED_RANGE_FALLBACK: Record<Language, string> = {
  en: 'As per scheme guidelines',
  hi: 'विवरण में निर्दिष्ट',
  ta: 'திட்ட வழிகாட்டுதல்களின்படி',
  te: 'పథకం మార్గదర్శకాల ప్రకారం',
  kn: 'ಯೋಜನೆಯ ಮಾರ್ಗಸೂಚಿಗಳ ಪ್ರಕಾರ',
  ml: 'പദ്ധതി മാർഗ്ഗനിർദ്ദേശങ്ങൾ അനുಸരിച്ച്',
};

const FIT_EXPLANATIONS = {
  UNSPECIFIED_IN_SCHEME: {
    en: (range: string) => `Scheme funding quantum varies by project type (${range}).`,
    hi: (range: string) => `योजना में कोई निश्चित सीमा निर्धारित नहीं है (${range})।`,
    ta: (range: string) => `திட்ட நிதி அளவு திட்ட வகையைப் பொறுத்து மாறுபடும் (${range}).`,
    te: (range: string) => `పథకం నిధుల మొత్తం ప్రాజెక్ట్ రకాన్ని బట్టి మారుతుంది (${range}).`,
    kn: (range: string) => `ಯೋಜನೆಯ ಹಣಕಾಸಿನ ಪ್ರಮಾಣವು ಯೋಜನೆಯ ಪ್ರಕಾರವನ್ನು ಅವಲಂಬಿಸಿ ಬದಲಾಗುತ್ತದೆ (${range}).`,
    ml: (range: string) => `പദ്ധതി ഫണ്ടിംഗ് തുക പ്രോജക്റ്റ് തരത്തിനനുസരിച്ച് വ്യത്യാസപ്പെടുന്നു (${range}).`,
  },
  NOT_SPECIFIED_BY_USER: {
    en: (range: string) => `Funding requirement not specified in profile. Scheme offers ${range}.`,
    hi: (range: string) => `आपकी प्रोफ़ाइल में वित्तीय आवश्यकता अनिर्दिष्ट है। योजना सीमा: ${range}।`,
    ta: (range: string) => `சுயவிவரத்தில் நிதி தேவை குறிப்பிடப்படவில்லை. திட்டம் வழங்குவது: ${range}.`,
    te: (range: string) => `ప్రొఫైల్‌లో నిధుల అవసరం పేర్కొనబడలేదు. పథకం పరిమితి: ${range}.`,
    kn: (range: string) => `ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಹಣಕಾಸಿನ ಅಗತ್ಯವನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ. ಯೋಜನೆಯ ಮಿತಿ: ${range}.`,
    ml: (range: string) => `പ്രൊഫൈലിൽ ഫണ്ടിംഗ് ആവശ്യകത വ്യക്തമാക്കിയിട്ടില്ല. പദ്ധതി പരിധി: ${range}.`,
  },
  ABOVE_RANGE: {
    en: (userVal: string, maxVal: string, diffVal: string) =>
      `Requirement (${userVal}) exceeds scheme ceiling (${maxVal}) by ${diffVal}. Maximum eligible sanction under this scheme is ${maxVal}.`,
    hi: (userVal: string, maxVal: string, diffVal: string) =>
      `आपकी आवश्यकता (${userVal}) योजना की अधिकतम सीमा (${maxVal}) से ${diffVal} अधिक है। आप अधिकतम ${maxVal} तक आवेदन कर सकते हैं।`,
    ta: (userVal: string, maxVal: string, diffVal: string) =>
      `உங்கள் தேவை (${userVal}) திட்ட உச்சவரம்பை விட (${maxVal}) ${diffVal} அதிகமாக உள்ளது. அனுமதிக்கப்பட்ட அதிகபட்சம்: ${maxVal}.`,
    te: (userVal: string, maxVal: string, diffVal: string) =>
      `మీ అవసరం (${userVal}) పథకం గరిష్ట పరిమితి (${maxVal}) కంటే ${diffVal} ఎక్కువగా ఉంది. అనుమతించబడే గరిష్టం: ${maxVal}.`,
    kn: (userVal: string, maxVal: string, diffVal: string) =>
      `ನಿಮ್ಮ ಅಗತ್ಯವು (${userVal}) ಯೋಜನೆಯ ಗರಿಷ್ಠ ಮಿತಿಗಿಂತ (${maxVal}) ${diffVal} ಹೆಚ್ಚಾಗಿದೆ. ಗರಿಷ್ಠ ಮಿತಿ: ${maxVal}.`,
    ml: (userVal: string, maxVal: string, diffVal: string) =>
      `നിങ്ങളുടെ ആവശ്യകത (${userVal}) പദ്ധതി പരിധിയേക്കാൾ (${maxVal}) ${diffVal} കൂടുതലാണ്. പരമാവധി തുക: ${maxVal}.`,
  },
  BELOW_RANGE: {
    en: (userVal: string, minVal: string, diffVal: string) =>
      `Requirement (${userVal}) is below the minimum threshold (${minVal}) by ${diffVal}.`,
    hi: (userVal: string, minVal: string, diffVal: string) =>
      `आपकी आवश्यकता (${userVal}) योजना के न्यूनतम मानदंड (${minVal}) से ${diffVal} कम है।`,
    ta: (userVal: string, minVal: string, diffVal: string) =>
      `உங்கள் தேவை (${userVal}) திட்ட குறைந்தபட்ச வரம்பை விட (${minVal}) ${diffVal} குறைவாக உள்ளது.`,
    te: (userVal: string, minVal: string, diffVal: string) =>
      `మీ అవసరం (${userVal}) పథకం కనీస పరిమితి (${minVal}) కంటే ${diffVal} తక్కువగా ఉంది.`,
    kn: (userVal: string, minVal: string, diffVal: string) =>
      `ನಿಮ್ಮ ಅಗತ್ಯವು (${userVal}) ಯೋಜನೆಯ ಕನಿಷ್ಠ ಮಿತಿಗಿಂತ (${minVal}) ${diffVal} ಕಡಿಮೆಯಾಗಿದೆ.`,
    ml: (userVal: string, minVal: string, diffVal: string) =>
      `നിങ്ങളുടെ ആവശ്യകത (${userVal}) പദ്ധതിയുടെ ഏറ്റവും കുറഞ്ഞ പരിധിയേക്കാൾ (${minVal}) ${diffVal} കുറവാണ്.`,
  },
  WITHIN_RANGE: {
    en: (userVal: string, range: string) =>
      `Your requirement (${userVal}) is fully within the statutory scheme range (${range}).`,
    hi: (userVal: string, range: string) =>
      `आपकी आवश्यकता (${userVal}) योजना के स्वीकार्य दायरे (${range}) के पूर्णतः अनुकूल है।`,
    ta: (userVal: string, range: string) =>
      `உங்கள் தேவை (${userVal}) திட்டத்தின் வரம்பிற்குள் (${range}) முழுமையாக பொருந்துகிறது.`,
    te: (userVal: string, range: string) =>
      `మీ అవసరం (${userVal}) పథకం పరిధికి (${range}) పూర్తిగా అనుకూలంగా ఉంది.`,
    kn: (userVal: string, range: string) =>
      `ನಿಮ್ಮ ಅಗತ್ಯವು (${userVal}) ಯೋಜನೆಯ ವ್ಯಾಪ್ತಿಯೊಳಗೆ (${range}) ಸಂಪೂರ್ಣವಾಗಿ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ.`,
    ml: (userVal: string, range: string) =>
      `നിങ്ങളുടെ ആവശ്യകത (${userVal}) പദ്ധതി പരിധിക്കുള്ളിൽ (${range}) പൂർണ്ണമായും പൊരുത്തപ്പെടുന്നു.`,
  },
  SUBSIDY: {
    en: (rate: number, amount: string) =>
      `Indicative statutory capital subsidy (${rate}%): Approx. ${amount} (subject to agency sanction)`,
    hi: (rate: number, amount: string) =>
      `अनुमानित सांकेतिक पूंजीगत अनुदान (${rate}%): लगभग ${amount} (बैंक/एजेंसी अनुमोदन के अधीन)`,
    ta: (rate: number, amount: string) =>
      `மதிப்பிடப்பட்ட மூலதன மானியம் (${rate}%): தோராயமாக ${amount} (வங்கி/நிறுவன ஒப்புதலுக்கு உட்பட்டது)`,
    te: (rate: number, amount: string) =>
      `అంచనా వేసిన మూలధన సబ్సిడీ (${rate}%): సుమారు ${amount} (బ్యాంకు/ఏజెన్సీ ఆమోదానికి లోబడి)`,
    kn: (rate: number, amount: string) =>
      `ಅಂದಾಜು ಬಂಡವಾಳ ಸಬ್ಸಿಡಿ (${rate}%): ಸುಮಾರು ${amount} (ಬ್ಯಾಂಕ್/ಏಜೆನ್ಸಿ ಅನುಮೋದನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ)`,
    ml: (rate: number, amount: string) =>
      `കണക്കാക്കിയ മൂലധന സബ്‌സിഡി (${rate}%): ഏകദേശം ${amount} (ബാങ്ക്/ഏജൻസി അനുമതിക്ക് വിധേയമായി)`,
  },
};

/**
 * Evaluates whether a user's stated funding requirement fits within the scheme's limits.
 * Implements strict boundaries: minAmount and maxAmount from Scheme.
 */
export function evaluateFundingFit(
  scheme: Scheme,
  profile: UserProfile,
  lang: Language = 'en'
): FundingFitAnalysis {
  const l: Language = (lang in STATED_RANGE_FALLBACK) ? lang : 'en';
  const min = scheme.minAmount || 0;
  const max = scheme.maxAmount || 0;
  const userFunding = profile.fundingRequired ?? profile.investmentAmount;

  const hasSchemeLimits = min > 0 || max > 0;
  const statedRange = scheme.fundingRangeText || (hasSchemeLimits ? `${formatCurrency(min)} - ${formatCurrency(max)}` : STATED_RANGE_FALLBACK[l]);

  // 1. If scheme has no statutory limits specified
  if (!hasSchemeLimits) {
    return {
      fitStatus: 'UNSPECIFIED_IN_SCHEME',
      statedRange,
      schemeMinAmount: min,
      schemeMaxAmount: max,
      explanation: FIT_EXPLANATIONS.UNSPECIFIED_IN_SCHEME[l](statedRange),
    };
  }

  // 2. If user hasn't specified funding requirement in profile
  if (userFunding === undefined || userFunding === null || isNaN(userFunding) || userFunding <= 0) {
    return {
      fitStatus: 'NOT_SPECIFIED_BY_USER',
      statedRange,
      schemeMinAmount: min,
      schemeMaxAmount: max,
      explanation: FIT_EXPLANATIONS.NOT_SPECIFIED_BY_USER[l](statedRange),
    };
  }

  // 3. User specified funding - evaluate against bounds
  let fitStatus: FundingFitStatus = 'WITHIN_RANGE';
  let difference: number | undefined;
  let explanation = '';

  if (max > 0 && userFunding > max) {
    fitStatus = 'ABOVE_RANGE';
    difference = userFunding - max;
    explanation = FIT_EXPLANATIONS.ABOVE_RANGE[l](
      formatCurrency(userFunding),
      formatCurrency(max),
      formatCurrency(difference)
    );
  } else if (min > 0 && userFunding < min) {
    fitStatus = 'BELOW_RANGE';
    difference = min - userFunding;
    explanation = FIT_EXPLANATIONS.BELOW_RANGE[l](
      formatCurrency(userFunding),
      formatCurrency(min),
      formatCurrency(difference)
    );
  } else {
    fitStatus = 'WITHIN_RANGE';
    explanation = FIT_EXPLANATIONS.WITHIN_RANGE[l](
      formatCurrency(userFunding),
      statedRange
    );
  }

  // Calculate estimated subsidy if applicable
  let estimatedSubsidy: number | undefined;
  let subsidyExplanation: string | undefined;

  if (scheme.subsidyRatePercent && scheme.subsidyRatePercent > 0) {
    const applicableBase = max > 0 ? Math.min(userFunding, max) : userFunding;
    const computedSubsidy = applicableBase * (scheme.subsidyRatePercent / 100);
    estimatedSubsidy = scheme.subsidyCap && scheme.subsidyCap > 0
      ? Math.min(computedSubsidy, scheme.subsidyCap)
      : computedSubsidy;

    subsidyExplanation = FIT_EXPLANATIONS.SUBSIDY[l](
      scheme.subsidyRatePercent,
      formatCurrency(estimatedSubsidy)
    );
  }

  return {
    fitStatus,
    statedRange,
    userRequirement: userFunding,
    schemeMinAmount: min,
    schemeMaxAmount: max,
    difference,
    explanation,
    estimatedSubsidy,
    subsidyExplanation,
    subsidyRatePercent: scheme.subsidyRatePercent,
  };
}
