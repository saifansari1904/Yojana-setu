import { Language } from './types';
import { resolveLocalizedPair } from './resolveLocalized';
import { SupportNeedType, BusinessStageKey, BUSINESS_STAGE_TAXONOMY, SUPPORT_NEEDS_TAXONOMY } from '../types/business';
import { LIFECYCLE_PHASES_LOCALIZED, SUPPORT_NEEDS_LOCALIZED } from './formI18n';

interface SchemeDetailI18nStrings {
  prepWorkspace: string;
  nextBestAction: string;
  whyHelpBiz: string;
  businessStage: string;
  generalSetup: string;
  primaryNeed: string;
  capitalAssistance: string;
  fundingGap: string;
  notSpecified: string;
  verifiedBenefit: string;
  relevanceRationale: string;
  supportedNeeds: string;
  purposeCoreFocus: string;
  needed: string;
  fundingFitAnalysis: string;
  withinRange: string;
  exceedsCap: string;
  info: string;
  upToSubsidy: (pct: number) => string;
  months: string;
  match: string;
  prepare: string;
  relevanceLevels: Record<'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN', string>;
}

export const SCHEME_DETAIL_I18N: Record<Language, SchemeDetailI18nStrings> = {
  en: {
    prepWorkspace: 'Preparation Workspace',
    nextBestAction: 'Next Best Action',
    whyHelpBiz: 'Why This May Help Your Business',
    businessStage: 'Business Stage:',
    generalSetup: 'General Setup',
    primaryNeed: 'Primary Need:',
    capitalAssistance: 'Capital / Loan Assistance',
    fundingGap: 'Funding Gap:',
    notSpecified: 'Not specified',
    verifiedBenefit: 'Verified Scheme Benefit: ',
    relevanceRationale: 'Relevance Rationale: ',
    supportedNeeds: 'Supported Needs:',
    purposeCoreFocus: 'Purpose & Core Focus',
    needed: 'Needed',
    fundingFitAnalysis: 'Funding Fit Analysis',
    withinRange: 'Within Range',
    exceedsCap: 'Exceeds Cap',
    info: 'Info',
    upToSubsidy: (pct) => `Up to ${pct}% Subsidy`,
    months: 'Months',
    match: 'Match',
    prepare: 'Prepare',
    relevanceLevels: {
      HIGH: 'High Business Need Relevance',
      MEDIUM: 'Medium Business Relevance',
      LOW: 'Low Need Relevance',
      UNKNOWN: 'Relevance Broad / Unspecified',
    },
  },
  hi: {
    prepWorkspace: 'आवेदन तैयारी कार्यक्षेत्र',
    nextBestAction: 'सर्वोत्तम अगला कदम',
    whyHelpBiz: 'यह आपके व्यवसाय के लिए क्यों उपयोगी है',
    businessStage: 'व्यवसाय चरण:',
    generalSetup: 'सामान्य उद्यम',
    primaryNeed: 'प्राथमिक आवश्यकता:',
    capitalAssistance: 'पूंजी / ऋण सहायता',
    fundingGap: 'अनुमानित वित्तीय अंतर:',
    notSpecified: 'अनिर्दिष्ट',
    verifiedBenefit: 'सत्यापित योजना लाभ: ',
    relevanceRationale: 'प्रासंगिकता विश्लेषण: ',
    supportedNeeds: 'समर्थित व्यावसायिक जरूरतें:',
    purposeCoreFocus: 'उद्देश्य एवं कार्यक्षेत्र',
    needed: 'विवरण आवश्यक',
    fundingFitAnalysis: 'वित्तीय आवश्यकता अनुकूलता',
    withinRange: 'दायरे में',
    exceedsCap: 'अधिकतम सीमा से अधिक',
    info: 'विवरण',
    upToSubsidy: (pct) => `${pct}% तक सब्सिडी`,
    months: 'महीने',
    match: 'मिलान',
    prepare: 'तैयारी',
    relevanceLevels: {
      HIGH: 'उच्च व्यावसायिक प्रासंगिकता',
      MEDIUM: 'मध्यम व्यावसायिक प्रासंगिकता',
      LOW: 'कम आवश्यकता मेल',
      UNKNOWN: 'व्यापक प्रासंगिकता',
    },
  },
  ta: {
    prepWorkspace: 'விண்ணப்ப தயாரிப்பு பணியிடம்',
    nextBestAction: 'அடுத்த சிறந்த நடவடிக்கை',
    whyHelpBiz: 'இது உங்கள் வணிகத்திற்கு ஏன் பயனளிக்கும்',
    businessStage: 'வணிக நிலை:',
    generalSetup: 'பொது அமைப்பு',
    primaryNeed: 'முதன்மை தேவை:',
    capitalAssistance: 'மூலதனம் / கடன் உதவி',
    fundingGap: 'நிதி இடைவெளி:',
    notSpecified: 'குறிப்பிடப்படவில்லை',
    verifiedBenefit: 'சரிபார்க்கப்பட்ட திட்ட பலன்: ',
    relevanceRationale: 'பொருத்தத்தின் அடிப்படை: ',
    supportedNeeds: 'ஆதரிக்கப்படும் தேவைகள்:',
    purposeCoreFocus: 'நோக்கம் & முக்கிய கவனம்',
    needed: 'தேவை',
    fundingFitAnalysis: 'நிதி பொருத்தம் பகுப்பாய்வு',
    withinRange: 'வரம்பிற்குள்',
    exceedsCap: 'அதிகபட்ச வரம்பை தாண்டியது',
    info: 'தகவல்',
    upToSubsidy: (pct) => `${pct}% வரை மானியம்`,
    months: 'மாதங்கள்',
    match: 'பொருத்தம்',
    prepare: 'தயாரிப்பு',
    relevanceLevels: {
      HIGH: 'உயர் வணிகத் தேவை பொருத்தம்',
      MEDIUM: 'நடுத்தர வணிகப் பொருத்தம்',
      LOW: 'குறைந்த தேவை பொருத்தம்',
      UNKNOWN: 'பொருத்தம் பொதுவானது / குறிப்பிடப்படவில்லை',
    },
  },
  te: {
    prepWorkspace: 'దరఖాస్తు తయారీ వర్క్‌స్పేస్',
    nextBestAction: 'తదుపరి ఉత్తమ చర్య',
    whyHelpBiz: 'ఇది మీ వ్యాపారానికి ఎందుకు సహాయపడుతుంది',
    businessStage: 'వ్యాపార దశ:',
    generalSetup: 'సాధారణ సెటప్',
    primaryNeed: 'ప్రాథమిక అవసరం:',
    capitalAssistance: 'మూలధనం / రుణ సహాయం',
    fundingGap: 'నిధుల అంతరం:',
    notSpecified: 'పేర్కొనబడలేదు',
    verifiedBenefit: 'ధృవీకరించబడిన పథకం ప్రయోజనం: ',
    relevanceRationale: 'ఔచిత్య విశ్లేషణ: ',
    supportedNeeds: 'మద్దతు ఉన్న అవసరాలు:',
    purposeCoreFocus: 'లక్ష్యం & ప్రధాన దృష్టి',
    needed: 'అవసరం',
    fundingFitAnalysis: 'నిధుల సరిపోలిక విశ్లేషణ',
    withinRange: 'పరిధిలో ఉంది',
    exceedsCap: 'గరిష్ట పరిమితిని మించింది',
    info: 'సమాచారం',
    upToSubsidy: (pct) => `${pct}% వరకు సబ్సిడీ`,
    months: 'నెలలు',
    match: 'సరిపోలిక',
    prepare: 'తయారీ',
    relevanceLevels: {
      HIGH: 'అధిక వ్యాపార అవసర ఔచిత్యం',
      MEDIUM: 'మధ్యస్థ వ్యాపార ఔచిత్యం',
      LOW: 'తక్కువ అవసర ఔచిత్యం',
      UNKNOWN: 'ఔచిత్యం విస్తృతమైనది / పేర్కొనబడలేదు',
    },
  },
  kn: {
    prepWorkspace: 'ಅರ್ಜಿ ಸಿದ್ಧತಾ ಕಾರ್ಯಕ್ಷೇತ್ರ',
    nextBestAction: 'ಮುಂದಿನ ಅತ್ಯುತ್ತಮ ಕ್ರಮ',
    whyHelpBiz: 'ಇದು ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಏಕೆ ಸಹಾಯಕವಾಗಿದೆ',
    businessStage: 'ವ್ಯವಹಾರ ಹಂತ:',
    generalSetup: 'ಸಾಮಾನ್ಯ ಸೆಟಪ್',
    primaryNeed: 'ಪ್ರಾಥಮಿಕ ಅಗತ್ಯ:',
    capitalAssistance: 'ಬಂಡವಾಳ / ಸಾಲ ನೆರವು',
    fundingGap: 'ನಿಧಿ ಅಂತರ:',
    notSpecified: 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ',
    verifiedBenefit: 'ಪರಿಶೀಲಿಸಿದ ಯೋಜನೆ ಪ್ರಯೋಜನ: ',
    relevanceRationale: 'ಪ್ರಸ್ತುತತೆ ವಿಶ್ಲೇಷಣೆ: ',
    supportedNeeds: 'ಬೆಂಬಲಿತ ಅಗತ್ಯಗಳು:',
    purposeCoreFocus: 'ಉದ್ದೇಶ ಮತ್ತು ಪ್ರಮುಖ ಗಮನ',
    needed: 'ಅಗತ್ಯವಿದೆ',
    fundingFitAnalysis: 'ನಿಧಿ ಹೊಂದಾಣಿಕೆ ವಿಶ್ಲೇಷಣೆ',
    withinRange: 'ಶ್ರೇಣಿಯಲ್ಲಿದೆ',
    exceedsCap: 'ಗರಿಷ್ಠ ಮಿತಿಯನ್ನು ಮೀರಿದೆ',
    info: 'ಮಾಹಿತಿ',
    upToSubsidy: (pct) => `${pct}% ವರೆಗೆ ಸಬ್ಸಿಡಿ`,
    months: 'ತಿಂಗಳುಗಳು',
    match: 'ಹೊಂದಾಣಿಕೆ',
    prepare: 'ಸಿದ್ಧತೆ',
    relevanceLevels: {
      HIGH: 'ಹೆಚ್ಚಿನ ವ್ಯವಹಾರ ಅಗತ್ಯ ಪ್ರಸ್ತುತತೆ',
      MEDIUM: 'ಮಧ್ಯಮ ವ್ಯವಹಾರ ಪ್ರಸ್ತುತತೆ',
      LOW: 'ಕಡಿಮೆ ಅಗತ್ಯ ಪ್ರಸ್ತುತತೆ',
      UNKNOWN: 'ಪ್ರಸ್ತುತತೆ ವಿಶಾಲವಾಗಿದೆ / ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ',
    },
  },
  ml: {
    prepWorkspace: 'അപേക്ഷാ തയ്യാറെടുപ്പ് വർക്ക്സ്പേസ്',
    nextBestAction: 'അടുത്ത മികച്ച നടപടി',
    whyHelpBiz: 'ഇത് നിങ്ങളുടെ ബിസിനസ്സിന് എന്തുകൊണ്ട് പ്രയോജനകരമാണ്',
    businessStage: 'ബിസിനസ്സ് ഘട്ടം:',
    generalSetup: 'പൊതുവായ സജ്ജീകരണം',
    primaryNeed: 'പ്രാഥമിക ആവശ്യം:',
    capitalAssistance: 'മൂലധനം / വായ്പാ സഹായം',
    fundingGap: 'ഫണ്ടിംഗ് വിടവ്:',
    notSpecified: 'വ്യക്തമാക്കിയിട്ടില്ല',
    verifiedBenefit: 'പരിശോധിച്ച പദ്ധതി ആനുകൂല്യം: ',
    relevanceRationale: 'പ്രസക്തി വിശകലനം: ',
    supportedNeeds: 'പിന്തുണയ്ക്കുന്ന ആവശ്യങ്ങൾ:',
    purposeCoreFocus: 'ലക്ഷ്യവും പ്രധാന ശ്രദ്ധയും',
    needed: 'ആവശ്യമുണ്ട്',
    fundingFitAnalysis: 'ഫണ്ടിംഗ് ഫിറ്റ് വിശകലനം',
    withinRange: 'പരിധിക്കുള്ളിൽ',
    exceedsCap: 'പരമാവധി പരിധി കവിയുന്നു',
    info: 'വിവരം',
    upToSubsidy: (pct) => `${pct}% വരെ സബ്‌സിഡി`,
    months: 'മാസങ്ങൾ',
    match: 'പൊരുത്തം',
    prepare: 'തയ്യാറെടുപ്പ്',
    relevanceLevels: {
      HIGH: 'ഉയർന്ന ബിസിനസ്സ് ആവശ്യ പ്രസക്തി',
      MEDIUM: 'ഇടത്തരം ബിസിനസ്സ് പ്രസക്തി',
      LOW: 'കുറഞ്ഞ ആവശ്യ പ്രസക്തി',
      UNKNOWN: 'പ്രസക്തി വിശാലമാണ് / വ്യക്തമാക്കിയിട്ടില്ല',
    },
  },
};

export function getLocalizedStageLabel(stageKey: BusinessStageKey | undefined, lang: Language): string {
  if (!stageKey) return '';
  const localized = LIFECYCLE_PHASES_LOCALIZED[stageKey]?.[lang];
  if (localized) return localized;
  const meta = BUSINESS_STAGE_TAXONOMY[stageKey];
  return (resolveLocalizedPair(meta?.labelEn, meta?.labelHi, lang)) || stageKey;
}

export function getLocalizedNeedLabel(needKey: SupportNeedType | undefined, lang: Language): string {
  if (!needKey) return '';
  const localized = SUPPORT_NEEDS_LOCALIZED[needKey]?.[lang];
  if (localized) return localized;
  const meta = SUPPORT_NEEDS_TAXONOMY[needKey];
  return (resolveLocalizedPair(meta?.labelEn, meta?.labelHi, lang)) || needKey;
}
