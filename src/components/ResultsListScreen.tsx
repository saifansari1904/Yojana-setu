import React, { useState, useEffect, useMemo } from 'react';
import { resolveLocalizedPair } from '../i18n/resolveLocalized';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MatchResult, UserProfile } from '../types';
import { MatchGauge } from './MatchGauge';
import { TrustFooterStrip } from './TrustFooterStrip';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { EmptyState } from './common/EmptyState';
import { AnimatedCounter } from '../animations/AnimatedCounter';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ArrowUp,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Globe,
  MapPin,
  Scale,
  X,
  IndianRupee,
  Compass,
} from 'lucide-react';
import { useTranslation, Language, SUPPORT_NEEDS_LOCALIZED, LIFECYCLE_PHASES_LOCALIZED } from '../i18n';
import { getSchemeCategories } from '../lib/data/normalization';
import { deriveSchemeTrustProfile } from '../lib/data/trustEngine';
import { getNextBestAction } from '../i18n/decisionActionI18n';
import { SchemeComparisonModal } from './SchemeComparisonModal';
import {
  BusinessNeedSummary,
  SupportPathway,
  SupportPathwayModal,
} from './business';
import { deriveBusinessNeedProfile, buildSupportPathway } from '../lib/business';
import { getLocalizedBusinessRelevance } from '../lib/business/businessRelevanceEngine';
import { getLocalizedPathwayAction } from '../i18n/pathwayActionI18n';
import type { PathwayAction } from '../types/supportPathway';
import { PathwayReportModal } from './PathwayReportModal';
import type { TrackedApplication } from '../types/tracker';
import { INDIAN_STATES } from '../constants/geography';

const RESULTS_SCREEN_I18N: Record<
  Language,
  {
    foundCount: (count: number) => string;
    personalizedSub: string;
    analyzedSchemes: string;
    highEligibleNearMatches: (high: number, near: number) => string;
    statutoryVerified: string;
    rural: string;
    urban: string;
    newSetup: string;
    expansion: string;
    existingUnit: string;
    enterprisePathway: string;
    nextRecommendedStep: string;
    viewSupportPathway: string;
    reportPdf: string;
    jurisdiction: string;
    allRegions: string;
    central: string;
    noSchemesFor: (query: string) => string;
    checkTypo: string;
    resetSearch: string;
    schemesSelected: string;
    compareNow: string;
    selectAtLeast2: string;
    clearSelection: string;
    scrollToTopTitle: string;
    top: string;
    topRecommendation: string;
    whyItMatches: string;
    factorMatched: string;
    factorNeedsInfo: string;
    factorDoesNotMatch: string;
    factorNeeded: string;
    bizNeedRelevance: string;
    bizRelFit: (level: 'HIGH' | 'MEDIUM' | 'LOW') => string;
    prepareApplication: string;
    removeFromComparison: string;
    selectUpTo3: string;
    comparingCheck: string;
    compare: string;
    gapAnalysisAlternatives: string;
    profileRequiredTitle: string;
    profileRequiredDesc: string;
    completeProfileBtn: string;
    trustFilterLabel: string;
    allTrustTiers: string;
    authoritativeShort: string;
    candidateShort: string;
    candidateBadge: string;
    candidateSourcePending: string;
    candidateCardNotice: string;
    selectStatePrompt: string;
  }
> = {
  en: {
    foundCount: (count) => `We found ${count} schemes based on your profile.`,
    personalizedSub: 'Personalized statutory evaluation of central and state credit and subsidy schemes tailored to your entrepreneurial profile',
    analyzedSchemes: 'Analyzed Schemes: ',
    highEligibleNearMatches: (high, near) => `High Eligibility: ${high} | Near Matches: ${near}`,
    statutoryVerified: '100% Statutory Criteria Verified',
    rural: 'Rural',
    urban: 'Urban',
    newSetup: 'New Setup',
    expansion: 'Expansion',
    existingUnit: 'Existing Unit',
    enterprisePathway: 'Enterprise Support Pathway',
    nextRecommendedStep: 'Next recommended step: ',
    viewSupportPathway: 'View Support Pathway',
    reportPdf: 'Report (PDF)',
    jurisdiction: 'Jurisdiction:',
    allRegions: 'All Regions',
    central: 'Central / Pan-India',
    noSchemesFor: (q) => `No schemes found for "${q}"`,
    checkTypo: 'Try checking for typos or searching by ministry or broad trade domain.',
    resetSearch: 'Reset Search & Filters',
    schemesSelected: 'Schemes Selected',
    compareNow: 'Compare Now',
    selectAtLeast2: '(Select at least 2)',
    clearSelection: 'Clear selection',
    scrollToTopTitle: 'Scroll to top of matched schemes',
    top: 'Top',
    topRecommendation: 'Top Recommendation (Highest Match)',
    whyItMatches: 'Why it matches',
    factorMatched: 'Matched',
    factorNeedsInfo: 'Needs information',
    factorDoesNotMatch: 'Does not match',
    factorNeeded: 'Needed',
    bizNeedRelevance: 'Business-Need Relevance:',
    bizRelFit: (level) => `${level} FIT`,
    prepareApplication: 'Prepare Application',
    removeFromComparison: 'Remove from comparison',
    selectUpTo3: 'Select up to 3 schemes to compare',
    comparingCheck: 'Comparing ✓',
    compare: 'Compare',
    gapAnalysisAlternatives: 'Gap Analysis & Alternatives',
    profileRequiredTitle: 'Eligibility Profile Required',
    profileRequiredDesc: 'Please enter your profile details to evaluate exact statutory criteria, compute match scores, and discover tailored schemes.',
    completeProfileBtn: 'Complete Eligibility Form',
    trustFilterLabel: 'Data Trust Layer:',
    allTrustTiers: 'All Schemes',
    authoritativeShort: 'Gazette Verified',
    candidateShort: 'Candidate Discovery',
    candidateBadge: 'Candidate Scheme',
    candidateSourcePending: 'Source verification pending',
    candidateCardNotice: 'Candidate scheme from discovery extraction · Source verification pending with nodal department',
    selectStatePrompt: 'All 36 States & UTs…',
  },
  hi: {
    foundCount: (count) => `आपकी प्रोफ़ाइल के आधार पर ${count} योजनाएं मिलीं।`,
    personalizedSub: 'आपकी व्यक्तिगत प्रोफ़ाइल एवं आवश्यकता के आधार पर सत्यापित सरकारी ऋण व सब्सिडी योजनाएं',
    analyzedSchemes: 'सफलतापूर्वक विश्लेषित योजनाएं: ',
    highEligibleNearMatches: (high, near) => `उच्च पात्रता: ${high} | आंशिक पात्रता: ${near}`,
    statutoryVerified: '100% वैधानिक नियम सत्यापित',
    rural: 'ग्रामीण',
    urban: 'शहरी',
    newSetup: 'नया उद्यम',
    expansion: 'विस्तार',
    existingUnit: 'सक्रिय उद्यम',
    enterprisePathway: 'उद्यम सहायता मार्ग',
    nextRecommendedStep: 'अनुशंसित अगला कदम: ',
    viewSupportPathway: 'मार्गदर्शन योजना देखें',
    reportPdf: 'रिपोर्ट (PDF)',
    jurisdiction: 'क्षेत्रीय फिल्टर:',
    allRegions: 'सभी क्षेत्र',
    central: 'केंद्रीय योजनाएं',
    noSchemesFor: (q) => `"${q}" के लिए कोई योजना नहीं मिली`,
    checkTypo: 'कृपया अन्य कीवर्ड खोजें या फ़िल्टर रीसेट करें।',
    resetSearch: 'फ़िल्टर रीसेट करें',
    schemesSelected: 'योजनाएं चयनित',
    compareNow: 'तुलना करें',
    selectAtLeast2: '(कम से कम 2 चुनें)',
    clearSelection: 'चयन हटाएं',
    scrollToTopTitle: 'पोर्टल के शीर्ष पर जाएं',
    top: 'ऊपर जाएं',
    topRecommendation: 'सर्वश्रेष्ठ अनुशंसा (शीर्ष मिलान)',
    whyItMatches: 'यह क्यों मेल खाता है',
    factorMatched: 'मेल खाता है',
    factorNeedsInfo: 'जानकारी आवश्यक',
    factorDoesNotMatch: 'मेल नहीं खाता',
    factorNeeded: 'विवरण आवश्यक',
    bizNeedRelevance: 'व्यावसायिक आवश्यकता प्रासंगिकता:',
    bizRelFit: (level) => level === 'HIGH' ? 'उच्च प्रासंगिकता' : level === 'MEDIUM' ? 'मध्यम' : 'कम प्रासंगिकता',
    prepareApplication: 'आवेदन तैयारी',
    removeFromComparison: 'तुलना सूची से हटाएं',
    selectUpTo3: 'तुलना हेतु 3 तक योजनाएं चुनें',
    comparingCheck: 'तुलना में शामिल ✓',
    compare: 'तुलना करें',
    gapAnalysisAlternatives: 'शर्त विश्लेषण एवं विकल्प',
    profileRequiredTitle: 'पात्रता प्रोफ़ाइल आवश्यक है',
    profileRequiredDesc: 'सटीक सरकारी योजनाओं की पात्रता, स्कोर और शर्त विश्लेषण प्राप्त करने के लिए कृपया अपनी प्रोफ़ाइल विवरण भरें।',
    completeProfileBtn: 'पात्रता फॉर्म भरें',
    trustFilterLabel: 'डेटा विश्वास स्तर:',
    allTrustTiers: 'सभी योजनाएं',
    authoritativeShort: 'राजपत्र सत्यापित',
    candidateShort: 'उम्मीदवार खोज',
    candidateBadge: 'उम्मीदवार योजना',
    candidateSourcePending: 'स्रोत सत्यापन लंबित',
    candidateCardNotice: 'खोज निष्कर्षण से उम्मीदवार योजना · नोडल विभाग द्वारा स्रोत सत्यापन लंबित',
    selectStatePrompt: 'सभी 36 राज्य और संघ राज्य क्षेत्र…',
  },
  ta: {
    foundCount: (count) => `உங்கள் விவரங்களின் அடிப்படையில் ${count} திட்டங்கள் கண்டறியப்பட்டன.`,
    personalizedSub: 'உங்கள் தொழில்முனைவு சுயவிவரத்திற்கு ஏற்ப மத்திய மற்றும் மாநில கடன் மற்றும் மானியத் திட்டங்களின் சட்டப்பூர்வ மதிப்பீடு',
    analyzedSchemes: 'பகுப்பாய்வு செய்யப்பட்ட திட்டங்கள்: ',
    highEligibleNearMatches: (high, near) => `அதிக தகுதி: ${high} | நெருங்கிய பொருத்தம்: ${near}`,
    statutoryVerified: '100% சட்டப்பூர்வ விதிகள் சரிபார்க்கப்பட்டது',
    rural: 'கிராமப்புறம்',
    urban: 'நகர்ப்புறம்',
    newSetup: 'புதிய தொடக்கம்',
    expansion: 'விரிவாக்கம்',
    existingUnit: 'செயல்பாட்டில் உள்ள பிரிவு',
    enterprisePathway: 'தொழில் ஆதரவு பாதை',
    nextRecommendedStep: 'பரிந்துரைக்கப்படும் அடுத்த படி: ',
    viewSupportPathway: 'ஆதரவுப் பாதையைப் பார்க்க',
    reportPdf: 'அறிக்கை (PDF)',
    jurisdiction: 'அதிகார வரம்பு:',
    allRegions: 'அனைத்து பகுதிகள்',
    central: 'மத்திய / அகில இந்தியா',
    noSchemesFor: (q) => `"${q}" என்பதற்கான திட்டங்கள் எதுவும் கிடைக்கவில்லை`,
    checkTypo: 'எழுத்துப் பிழைகளைச் சரிபார்க்கவும் அல்லது துறை வாரியாகத் தேடவும்.',
    resetSearch: 'வடிப்பான்களை மீட்டமைக்க',
    schemesSelected: 'திட்டங்கள் தேர்ந்தெடுக்கப்பட்டன',
    compareNow: 'இப்போது ஒப்பிடவும்',
    selectAtLeast2: '(குறைந்தது 2 ஐ தேர்ந்தெடுக்கவும்)',
    clearSelection: 'தேர்வை நீக்குக',
    scrollToTopTitle: 'பொருந்திய திட்டங்களின் உச்சிக்குச் செல்லவும்',
    top: 'மேலே',
    topRecommendation: 'சிறந்த பரிந்துரை (அதிக பொருத்தம்)',
    whyItMatches: 'இது ஏன் பொருந்துகிறது',
    factorMatched: 'பொருந்தியது',
    factorNeedsInfo: 'தகவல் தேவை',
    factorDoesNotMatch: 'பொருந்தவில்லை',
    factorNeeded: 'தேவை',
    bizNeedRelevance: 'வணிகத் தேவை பொருத்தம்:',
    bizRelFit: (level) => level === 'HIGH' ? 'அதிக பொருத்தம்' : level === 'MEDIUM' ? 'நடுத்தர' : 'குறைந்த பொருத்தம்',
    prepareApplication: 'விண்ணப்பத் தயாரிப்பு',
    removeFromComparison: 'ஒப்பீட்டிலிருந்து நீக்குக',
    selectUpTo3: 'ஒப்பிட 3 திட்டங்கள் வரை தேர்ந்தெடுக்கவும்',
    comparingCheck: 'ஒப்பிடப்படுகிறது ✓',
    compare: 'ஒப்பிடுக',
    gapAnalysisAlternatives: 'இடைவெளி பகுப்பாய்வு & மாற்று வழிகள்',
    profileRequiredTitle: 'தகுதி சுயவிவரம் தேவை',
    profileRequiredDesc: 'சரியான அரசு திட்டங்களின் தகுதி மற்றும் மதிப்பெண் பெற உங்கள் விவரங்களை உள்ளிடவும்.',
    completeProfileBtn: 'தகுதி படிவத்தை நிரப்பவும்',
    trustFilterLabel: 'தரவு நம்பகத்தன்மை நிலை:',
    allTrustTiers: 'அனைத்து திட்டங்கள்',
    authoritativeShort: 'அரசிதழ் சரிபார்க்கப்பட்டது',
    candidateShort: 'வேட்பாளர் கண்டுபிடிப்பு',
    candidateBadge: 'வேட்பாளர் திட்டம்',
    candidateSourcePending: 'மூல சரிபார்ப்பு நிலுவையில் உள்ளது',
    candidateCardNotice: 'கண்டுபிடிப்பிலிருந்து பெறப்பட்ட வேட்பாளர் திட்டம் · நோடல் துறையின் மூல சரிபார்ப்பு நிலுவையில் உள்ளது',
    selectStatePrompt: 'அனைத்து 36 மாநிலங்கள் & யூனியன் பிரதேசங்கள்…',
  },
  te: {
    foundCount: (count) => `మీ ప్రొఫైల్ ఆధారంగా ${count} పథకాలు కనుగొనబడ్డాయి.`,
    personalizedSub: 'మీ వ్యాపార ప్రొఫైల్‌కు అనుగుణంగా కేంద్ర మరియు రాష్ట్ర రుణాలు మరియు సబ్సిడీ పథకాల వ్యక్తిగతీకరించిన చట్టబద్ధమైన మూల్యాంకనం',
    analyzedSchemes: 'విశ్లేషించబడిన పథకాలు: ',
    highEligibleNearMatches: (high, near) => `అధిక అర్హత: ${high} | సమీప సరిపోలిక: ${near}`,
    statutoryVerified: '100% చట్టబద్ధమైన నిబంధనలు ధృవీకరించబడ్డాయి',
    rural: 'గ్రామీణ',
    urban: 'పట్టణ',
    newSetup: 'కొత్త ఏర్పాటు',
    expansion: 'విస్తరణ',
    existingUnit: 'ఇప్పటికే ఉన్న యూనిట్',
    enterprisePathway: 'వ్యాపార మద్దతు మార్గం',
    nextRecommendedStep: 'సిఫార్సు చేయబడిన తదుపరి చర్య: ',
    viewSupportPathway: 'మద్దతు మార్గాన్ని చూడండి',
    reportPdf: 'నివేదిక (PDF)',
    jurisdiction: 'పరిధి:',
    allRegions: 'అన్ని ప్రాంతాలు',
    central: 'కేంద్ర / అఖిల భారత',
    noSchemesFor: (q) => `"${q}" కోసం ఎటువంటి పథకాలు కనుగొనబడలేదు`,
    checkTypo: 'దయచేసి అక్షరదోషాలను తనిఖీ చేయండి లేదా ఇతర కీలకపదాలను శోధించండి.',
    resetSearch: 'శోధన & ఫిల్టర్లను రీసెట్ చేయండి',
    schemesSelected: 'పథకాలు ఎంపికయ్యాయి',
    compareNow: 'ఇప్పుడు పోల్చండి',
    selectAtLeast2: '(కనీసం 2 ఎంచుకోండి)',
    clearSelection: 'ఎంపికను క్లియర్ చేయండి',
    scrollToTopTitle: 'సరిపోలిన పథకాల పైభాగానికి వెళ్లండి',
    top: 'పైకి',
    topRecommendation: 'ఉత్తమ సిఫార్సు (అత్యధిక సరిపోలిక)',
    whyItMatches: 'ఇది ఎందుకు సరిపోలుతుంది',
    factorMatched: 'సరిపోయింది',
    factorNeedsInfo: 'సమాచారం అవసరం',
    factorDoesNotMatch: 'సరిపోలడం లేదు',
    factorNeeded: 'అవసరం',
    bizNeedRelevance: 'వ్యాపార అవసర ప్రాముఖ్యత:',
    bizRelFit: (level) => level === 'HIGH' ? 'అధిక అనుకూలత' : level === 'MEDIUM' ? 'మధ్యస్థం' : 'తక్కువ అనుకూలత',
    prepareApplication: 'దరఖాస్తు తయారీ',
    removeFromComparison: 'పోలిక నుండి తొలగించండి',
    selectUpTo3: 'పోల్చడానికి 3 పథకాల వరకు ఎంచుకోండి',
    comparingCheck: 'పోల్చబడుతోంది ✓',
    compare: 'పోల్చండి',
    gapAnalysisAlternatives: 'లోపాల విశ్లేషణ & ప్రత్యామ్నాయాలు',
    profileRequiredTitle: 'అర్హత ప్రొఫైల్ అవసరం',
    profileRequiredDesc: 'ఖచ్చితమైన ప్రభుత్వ పథకాల అర్హత మరియు స్కోరు పొందడానికి దయచేసి మీ వివరాలను నమోదు చేయండి.',
    completeProfileBtn: 'అర్హత ఫారమ్‌ను పూర్తి చేయండి',
    trustFilterLabel: 'డేటా విశ్వసనీయత స్థాయి:',
    allTrustTiers: 'అన్ని పథకాలు',
    authoritativeShort: 'గెజిట్ ధృవీకరించబడింది',
    candidateShort: 'అభ్యర్థి ఆవిష్కరణ',
    candidateBadge: 'అభ్యర్థి పథకం',
    candidateSourcePending: 'మూల ధృవీకరణ పెండింగ్‌లో ఉంది',
    candidateCardNotice: 'ఆవిష్కరణ వెలికితీత నుండి అభ్యర్థి పథకం · నోడల్ విభాగం ద్వారా మూల ధృవీకరణ పెండింగ్‌లో ఉంది',
    selectStatePrompt: 'అన్ని 36 రాష్ట్రాలు & కేంద్రపాలిత ప్రాంతాలు…',
  },
  kn: {
    foundCount: (count) => `ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಧಾರದ ಮೇಲೆ ${count} ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿವೆ.`,
    personalizedSub: 'ನಿಮ್ಮ ಉದ್ಯಮಶೀಲತೆಯ ಪ್ರೊಫೈಲ್‌ಗೆ ಅನುಗುಣವಾಗಿ ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಸಾಲ ಹಾಗೂ ಸಬ್ಸಿಡಿ ಯೋಜನೆಗಳ ವೈಯಕ್ತಿಕ ಶಾಸನಬದ್ಧ ಮೌಲ್ಯಮಾಪನ',
    analyzedSchemes: 'ವಿಶ್ಲೇಷಿಸಲಾದ ಯೋಜನೆಗಳು: ',
    highEligibleNearMatches: (high, near) => `ಹೆಚ್ಚಿನ ಅರ್ಹತೆ: ${high} | ಹತ್ತಿರದ ಹೊಂದಾಣಿಕೆ: ${near}`,
    statutoryVerified: '100% ಶಾಸನಬದ್ಧ ಮಾನದಂಡಗಳು ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿವೆ',
    rural: 'ಗ್ರಾಮೀಣ',
    urban: 'ನಗರ',
    newSetup: 'ಹೊಸ ಉದ್ಯಮ',
    expansion: 'ವಿಸ್ತರಣೆ',
    existingUnit: 'ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಘಟಕ',
    enterprisePathway: 'ಉದ್ಯಮ ಬೆಂಬಲ ಮಾರ್ಗ',
    nextRecommendedStep: 'ಮುಂದಿನ ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ: ',
    viewSupportPathway: 'ಬೆಂಬಲ ಮಾರ್ಗವನ್ನು ವೀಕ್ಷಿಸಿ',
    reportPdf: 'ವರದಿ (PDF)',
    jurisdiction: 'ವ್ಯಾಪ್ತಿ:',
    allRegions: 'ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು',
    central: 'ಕೇಂದ್ರ / ಅಖಿಲ ಭಾರತ',
    noSchemesFor: (q) => `"${q}" ಗಾಗಿ ಯಾವುದೇ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ`,
    checkTypo: 'ದಯವಿಟ್ಟು ಕಾಗುಣಿತ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಇತರ ಕೀವರ್ಡ್ ಹುಡುಕಿ.',
    resetSearch: 'ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ',
    schemesSelected: 'ಯೋಜನೆಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ',
    compareNow: 'ಈಗ ಹೋಲಿಕೆ ಮಾಡಿ',
    selectAtLeast2: '(ಕನಿಷ್ಠ 2 ಆಯ್ಕೆಮಾಡಿ)',
    clearSelection: 'ಆಯ್ಕೆಯನ್ನು ತೆರವುಗೊಳಿಸಿ',
    scrollToTopTitle: 'ಹೊಂದಾಣಿಕೆಯಾದ ಯೋಜನೆಗಳ ಮೇಲಕ್ಕೆ ಹೋಗಿ',
    top: 'ಮೇಲಕ್ಕೆ',
    topRecommendation: 'ಉತ್ತಮ ಶಿಫಾರಸು (ಅತಿ ಹೆಚ್ಚು ಹೊಂದಾಣಿಕೆ)',
    whyItMatches: 'ಇದು ಏಕೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ',
    factorMatched: 'ಹೊಂದಿಕೆಯಾಗಿದೆ',
    factorNeedsInfo: 'ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ',
    factorDoesNotMatch: 'ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ',
    factorNeeded: 'ಅಗತ್ಯವಿದೆ',
    bizNeedRelevance: 'ವ್ಯಾಪಾರ ಅಗತ್ಯ ಹೊಂದಾಣಿಕೆ:',
    bizRelFit: (level) => level === 'HIGH' ? 'ಹೆಚ್ಚಿನ ಹೊಂದಾಣಿಕೆ' : level === 'MEDIUM' ? 'ಮಧ್ಯಮ' : 'ಕಡಿಮೆ ಹೊಂದಾಣಿಕೆ',
    prepareApplication: 'ಅರ್ಜಿ ತಯಾರಿ',
    removeFromComparison: 'ಹೋಲಿಕೆಯಿಂದ ತೆಗೆದುಹಾಕಿ',
    selectUpTo3: 'ಹೋಲಿಕೆ ಮಾಡಲು 3 ಯೋಜನೆಗಳವರೆಗೆ ಆಯ್ಕೆಮಾಡಿ',
    comparingCheck: 'ಹೋಲಿಕೆ ಮಾಡಲಾಗುತ್ತಿದೆ ✓',
    compare: 'ಹೋಲಿಕೆ ಮಾಡಿ',
    gapAnalysisAlternatives: 'ಅಂತರ ವಿಶ್ಲೇಷಣೆ & ಪರ್ಯಾಯಗಳು',
    profileRequiredTitle: 'ಅರ್ಹತಾ ಪ್ರೊಫೈಲ್ ಅಗತ್ಯವಿದೆ',
    profileRequiredDesc: 'ನಿಖರವಾದ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಅರ್ಹತೆ ಮತ್ತು ಸ್ಕೋರ್ ಪಡೆಯಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.',
    completeProfileBtn: 'ಅರ್ಹತಾ ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ',
    trustFilterLabel: 'ಡೇಟಾ ವಿಶ್ವಾಸಾರ್ಹತೆ ಹಂತ:',
    allTrustTiers: 'ಎಲ್ಲಾ ಯೋಜನೆಗಳು',
    authoritativeShort: 'ಗೆಜೆಟ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    candidateShort: 'ಅಭ್ಯರ್ಥಿ ಶೋಧನೆ',
    candidateBadge: 'ಅಭ್ಯರ್ಥಿ ಯೋಜನೆ',
    candidateSourcePending: 'ಮೂಲ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ',
    candidateCardNotice: 'ಶೋಧನೆಯಿಂದ ಪಡೆದ ಅಭ್ಯರ್ಥಿ ಯೋಜನೆ · ನೋಡಲ್ ಇಲಾಖೆಯಿಂದ ಮೂಲ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ',
    selectStatePrompt: 'ಎಲ್ಲಾ 36 ರಾಜ್ಯಗಳು & ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶಗಳು…',
  },
  ml: {
    foundCount: (count) => `നിങ്ങളുടെ പ്രൊഫൈലിനെ അടിസ്ഥാനമാക്കി ${count} പദ്ധതികൾ കണ്ടെത്തി.`,
    personalizedSub: 'നിങ്ങളുടെ സംരംഭക പ്രൊഫൈലിന് അനുയോജ്യമായ കേന്ദ്ര-സംസ്ഥാന വായ്പാ-സബ്‌സിഡി പദ്ധതികളുടെ നിയമാനുസൃത വിലയിരുത്തൽ',
    analyzedSchemes: 'വിശകലനം ചെയ്ത പദ്ധതികൾ: ',
    highEligibleNearMatches: (high, near) => `ഉയർന്ന യോഗ്യത: ${high} | സാമീപ്യമുള്ളവ: ${near}`,
    statutoryVerified: '100% നിയമാനുസൃത വ്യവസ്ഥകൾ പരിശോധിച്ചു',
    rural: 'ഗ്രാമീണ',
    urban: 'നഗരം',
    newSetup: 'പുതിയ സംരംഭം',
    expansion: 'വിപുലീകരണം',
    existingUnit: 'നിലവിലുള്ള യൂണിറ്റ്',
    enterprisePathway: 'സംരംഭക പിന്തുണാ വഴി',
    nextRecommendedStep: 'അടുത്ത നിർദ്ദിഷ്ട നടപടി: ',
    viewSupportPathway: 'പിന്തുണാ വഴി കാണുക',
    reportPdf: 'റിപ്പോർട്ട് (PDF)',
    jurisdiction: 'അധികാരപരിധി:',
    allRegions: 'എല്ലാ പ്രദേശങ്ങളും',
    central: 'കേന്ദ്ര / അഖിലേന്ത്യാ',
    noSchemesFor: (q) => `"${q}" എന്നതിന് അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്തിയില്ല`,
    checkTypo: 'അക്ഷരത്തെറ്റുകൾ പരിശോധിക്കുകയോ മറ്റ് വാക്കുകൾ ഉപയോഗിച്ച് തിരയുകയോ ചെയ്യുക.',
    resetSearch: 'ഫിൽട്ടറുകൾ പുനഃക്രമീകരിക്കുക',
    schemesSelected: 'പദ്ധതികൾ തിരഞ്ഞെടുത്തു',
    compareNow: 'താരതമ്യം ചെയ്യുക',
    selectAtLeast2: '(കുറഞ്ഞത് 2 എണ്ണം തിരഞ്ഞെടുക്കുക)',
    clearSelection: 'തിരഞ്ഞെടുക്കൽ ഒഴിവാക്കുക',
    scrollToTopTitle: 'മുകളിലേക്ക് സ്ക്രോൾ ചെയ്യുക',
    top: 'മുകളിലേക്ക്',
    topRecommendation: 'മികച്ച ശുപാർശ (ഏറ്റവും ഉയർന്ന അനുയോജ്യത)',
    whyItMatches: 'ഇത് എന്തുകൊണ്ട് പൊരുത്തപ്പെടുന്നു',
    factorMatched: 'പൊരുത്തപ്പെട്ടു',
    factorNeedsInfo: 'വിവരം ആവശ്യമാണ്',
    factorDoesNotMatch: 'പൊരുത്തപ്പെടുന്നില്ല',
    factorNeeded: 'ആവശ്യമാണ്',
    bizNeedRelevance: 'സംരംഭക ആവശ്യ പ്രസക്തി:',
    bizRelFit: (level) => level === 'HIGH' ? 'ഉയർന്ന അനുയോജ്യത' : level === 'MEDIUM' ? 'ഇടത്തരം' : 'കുറഞ്ഞ അനുയോജ്യത',
    prepareApplication: 'അപേക്ഷാ തയ്യാറെടുപ്പ്',
    removeFromComparison: 'താരതമ്യത്തിൽ നിന്ന് നീക്കുക',
    selectUpTo3: 'താരതമ്യം ചെയ്യാൻ 3 പദ്ധതികൾ വരെ തിരഞ്ഞെടുക്കുക',
    comparingCheck: 'താരതമ്യം ചെയ്യുന്നു ✓',
    compare: 'താരതമ്യം',
    gapAnalysisAlternatives: 'വിടവ് വിശകലനം & ഇതര മാർഗ്ഗങ്ങൾ',
    profileRequiredTitle: 'യോഗ്യതാ പ്രൊഫൈൽ ആവശ്യമാണ്',
    profileRequiredDesc: 'കൃത്യമായ സർക്കാർ പദ്ധതി യോഗ്യതയും സ്കോറും കണ്ടെത്താൻ നിങ്ങളുടെ പ്രൊഫൈൽ വിവരങ്ങൾ നൽകുക.',
    completeProfileBtn: 'യോഗ്യതാ ഫോം പൂരിപ്പിക്കുക',
    trustFilterLabel: 'ഡാറ്റ വിശ്വാസ്യത തലം:',
    allTrustTiers: 'എല്ലാ പദ്ധതികളും',
    authoritativeShort: 'ഗസറ്റ് പരിശോധിച്ചു',
    candidateShort: 'സ്ഥാനാർത്ഥി കണ്ടെത്തൽ',
    candidateBadge: 'സ്ഥാനാർത്ഥി പദ്ധതി',
    candidateSourcePending: 'ഉറവിട പരിശോധന ബാക്കി',
    candidateCardNotice: 'കണ്ടെത്തലിൽ നിന്നുള്ള സ്ഥാനാർത്ഥി പദ്ധതി · നോഡൽ വകുപ്പിൽ നിന്നുള്ള ഉറവിട പരിശോധന ബാക്കി',
    selectStatePrompt: 'എല്ലാ 36 സംസ്ഥാനങ്ങളും കേന്ദ്രഭരണ പ്രദേശങ്ങളും…',
  },
};
import {
  loadDocumentProgress,
  migrateLegacyDocumentProgress,
  toggleDocumentPrepared,
  saveDocumentProgress,
  getPreparedDocIds,
} from '../lib/tracker/documentProgress';
import {
  staggerContainer,
  staggerItem,
  fadeSlideUp,
} from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
import { ArrowFillButton, BookmarkButton, VerificationBadge } from './ui';

interface ResultsListScreenProps {
  matchResults: MatchResult[];
  userProfile: UserProfile | null;
  onOpenWhyMatch?: (match: MatchResult) => void;
  onOpenWhyNotEligible: (match: MatchResult) => void;
  onEditProfile: () => void;
  onSelectScheme?: (match: MatchResult) => void;
  savedSchemeIds?: Set<string>;
  onToggleSaveScheme?: (schemeId: string) => void;
  /** Phase 4.3 — start (or enrich) a tracked application from the pathway. */
  onStartPathwayApplication?: (match: MatchResult, pathway: unknown) => void;
  applications?: TrackedApplication[];
  onOpenTracker?: () => void;
  /** Phase 5 — open guided preparation workspace. */
  onOpenWorkspace?: (match: MatchResult) => void;
}

export const ResultsListScreen: React.FC<ResultsListScreenProps> = ({
  matchResults,
  userProfile,
  onOpenWhyMatch,
  onOpenWhyNotEligible,
  onEditProfile,
  onSelectScheme,
  savedSchemeIds,
  onToggleSaveScheme,
  onStartPathwayApplication,
  applications,
  onOpenTracker,
  onOpenWorkspace,
}) => {
  const {
    t,
    formatCurrency,
    getLocalizedScheme,
    getLocalizedCategory,
    getLocalizedBusinessType,
    getLocalizedState,
    lang,
  } = useTranslation();
  const rui = RESULTS_SCREEN_I18N[lang] || RESULTS_SCREEN_I18N.en;
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<'all' | 'eligible' | 'near' | 'subsidized'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [trustFilter, setTrustFilter] = useState<'all' | 'authoritative' | 'candidate'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scheme Comparison State (up to 3 schemes)
  const [selectedForCompareIds, setSelectedForCompareIds] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const toggleCompareScheme = (schemeId: string) => {
    setSelectedForCompareIds((prev) => {
      if (prev.includes(schemeId)) {
        return prev.filter((id) => id !== schemeId);
      }
      if (prev.length >= 3) {
        // Replace oldest or cap at 3
        return [...prev.slice(1), schemeId];
      }
      return [...prev, schemeId];
    });
  };

  const removeCompareScheme = (schemeId: string) => {
    setSelectedForCompareIds((prev) => prev.filter((id) => id !== schemeId));
  };

  const clearComparison = () => {
    setSelectedForCompareIds([]);
    setIsComparisonOpen(false);
  };

  /* ============ PHASE 4.2 / 4.3 — SUPPORT PATHWAY & REPORT ============ */

  const [isPathwayModalOpen, setIsPathwayModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [docProgress, setDocProgress] = useState(() =>
    typeof window === 'undefined' ? {} : migrateLegacyDocumentProgress(),
  );

  // Ensure top recommendation prioritizes an authoritative scheme so official support pathway remains grounded
  const topMatch = useMemo(() => {
    return (
      matchResults.find((m) => !m.scheme.isCandidateScheme && m.matchStatus === 'eligible') ||
      matchResults.find((m) => !m.scheme.isCandidateScheme) ||
      matchResults[0] ||
      null
    );
  }, [matchResults]);

  const preparedDocIds = topMatch ? getPreparedDocIds(docProgress, topMatch.scheme.id) : [];

  const authoritativeCount = useMemo(
    () => matchResults.filter((m) => !m.scheme.isCandidateScheme).length,
    [matchResults]
  );
  const candidateCount = useMemo(
    () => matchResults.filter((m) => m.scheme.isCandidateScheme).length,
    [matchResults]
  );

  /** Deterministic Phase 4.2 engine output — memoized, never recomputed per render. */
  const supportPathway = useMemo(() => {
    if (!userProfile || matchResults.length === 0) return null;
    return buildSupportPathway({
      profile: userProfile,
      matchResults,
      preparedDocIds,
      hasEngagedWithChecklist: preparedDocIds.length > 0,
      lang,
    });
  }, [userProfile, matchResults, preparedDocIds, lang]);

  const handlePathwayAction = (action: PathwayAction) => {
    switch (action.actionTarget) {
      case 'form':
        onEditProfile();
        return;
      case 'compare':
        setIsComparisonOpen(true);
        document.getElementById('scheme-results-tabs')?.scrollIntoView({ behavior: 'smooth' });
        return;
      case 'portal':
        if (action.actionUrl) window.open(action.actionUrl, '_blank', 'noopener,noreferrer');
        return;
      case 'checklist':
      case 'details':
        if (topMatch && onSelectScheme) {
          onSelectScheme(topMatch);
          return;
        }
        document
          .getElementById('support-pathway-preparation-checklist')
          ?.scrollIntoView({ behavior: 'smooth' });
        return;
      default:
        document.getElementById('support-pathway-stack')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePathwaySchemeSelect = (schemeId: string) => {
    const match = matchResults.find((m) => m.scheme.id === schemeId);
    if (match && onSelectScheme) onSelectScheme(match);
  };

  /** Phase 4.3 — checklist ticks write to the shared localStorage store. */
  const handlePathwayChecklistToggle = (itemId: string) => {
    if (!topMatch) return;
    setDocProgress((prev) => {
      const next = toggleDocumentPrepared(prev, topMatch.scheme.id, itemId);
      saveDocumentProgress(next);
      return next;
    });
  };

  /** Phase 4.3 — turn the pathway into a tracked application journey. */
  const handleStartApplication = () => {
    if (!topMatch || !supportPathway || !onStartPathwayApplication) return;
    onStartPathwayApplication(topMatch, supportPathway);
    if (onOpenTracker) onOpenTracker();
  };

  const isTopMatchTracked = Boolean(
    topMatch && (applications || []).some((a) => a.schemeId === topMatch.scheme.id),
  );

  // Smooth scroll to top when entering matched schemes portal
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Monitor scroll position to reveal quick 'Back to Top' action
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: 'all' | 'eligible' | 'near' | 'subsidized') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Counts based on MatchStatus
  const eligibleMatches = matchResults.filter((m) => m.matchStatus === 'eligible');
  const nearMatches = matchResults.filter((m) => m.matchStatus === 'near-match');
  const otherMatches = matchResults.filter((m) => m.matchStatus === 'low-match');

  const filterMatches = (list: MatchResult[]) => {
    return list.filter((result) => {
      const locScheme = getLocalizedScheme(result.scheme);
      const categories = getSchemeCategories(result.scheme);

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          locScheme.name.toLowerCase().includes(query) ||
          locScheme.sponsoringMinistry.toLowerCase().includes(query) ||
          locScheme.benefitSummary.toLowerCase().includes(query) ||
          categories.some((c) => c.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      if (selectedRegion === 'central') {
        if (result.scheme.applicableStates.length > 0) return false;
      } else if (selectedRegion !== 'all') {
        if (!result.scheme.applicableStates.includes(selectedRegion)) return false;
      }

      if (trustFilter === 'authoritative' && result.scheme.isCandidateScheme) {
        return false;
      }
      if (trustFilter === 'candidate' && !result.scheme.isCandidateScheme) {
        return false;
      }

      if (activeTab === 'subsidized') {
        return (locScheme.subsidyRatePercent && locScheme.subsidyRatePercent > 0) || false;
      }
      return true;
    });
  };

  const filteredEligible = filterMatches(eligibleMatches);
  const filteredNear = filterMatches(nearMatches);
  const filteredOther = filterMatches(otherMatches);

  const totalFilteredCount =
    activeTab === 'eligible'
      ? filteredEligible.length
      : activeTab === 'near'
      ? filteredNear.length
      : filteredEligible.length + filteredNear.length + filteredOther.length;

  const renderSchemeCard = (result: MatchResult, isTopPick: boolean = false) => {
    const locScheme = getLocalizedScheme(result.scheme);
    const isEligible = result.matchStatus === 'eligible';
    const isNearMatch = result.matchStatus === 'near-match';
    const isCandidate = Boolean(result.scheme.isCandidateScheme);

    return (
      <motion.article
        key={result.scheme.id}
        id={`scheme-card-${result.scheme.id}`}
        variants={shouldReduceMotion ? undefined : staggerItem}
        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`yj-card yj-card-lg overflow-hidden hover:yj-elev-2 hover:border-[#0B5D4B] dark:hover:border-[#4ADE80] ${
          isCandidate
            ? 'border-amber-300/80 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/20 to-transparent dark:from-amber-950/15'
            : isNearMatch
            ? 'border-amber-300 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/20 to-transparent dark:from-amber-950/10'
            : isEligible
            ? 'border-[#C1E2D0] dark:border-[#22503E]'
            : 'border-[#E4E8E4] dark:border-[#24342D]'
        }`}
      >
        {isTopPick && !isCandidate && (
          <div className="bg-[#14453D] dark:bg-[#1C5045] text-white px-4 py-1 text-[11px] font-bold flex items-center gap-1.5 border-b border-[#0B302B]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span>{rui.topRecommendation}</span>
          </div>
        )}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Left Column: Match Gauge & Dual Status Pill */}
            <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:w-32 text-center">
              <MatchGauge
                percentage={result.matchPercentage}
                size={66}
                strokeWidth={6}
                layoutId={`scheme-gauge-${result.scheme.id}`}
              />
              <div className="text-left sm:text-center">
                <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block">
                  {t('results.matchScoreLabel')}
                </span>

                {/* Status Pill: Distinctive and High Contrast */}
                <div className="mt-1">
                  {isEligible ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border border-[#B2CDBF] dark:border-[#285743]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" />
                      <span>{t('results.statusEligible')}</span>
                    </span>
                  ) : isNearMatch ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{t('results.statusNearMatch')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-[#F3F4F3] dark:bg-[#1E2924] text-[#7C2C0F] dark:text-[#FCA5A5] border border-[#FFDAD6] dark:border-[#5A2B20]">
                      <Info className="w-3.5 h-3.5 text-[#C2603F] dark:text-[#F87171]" />
                      <span>{t('results.statusLowMatch')}</span>
                    </span>
                  )}
                </div>

                {/* Criteria satisfied count */}
                <span className="text-[10px] text-[#516A5F] dark:text-[#9EB0A7] block mt-1">
                  {result.matchedCount}/{result.totalFactorsCount} {t('results.criteriaMetCount')}
                </span>
              </div>
            </div>

            {/* Scheme Information & Details */}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {isCandidate ? (
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/80 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {rui.candidateBadge}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D9E8DF] dark:bg-[#1A382D] px-2 py-0.5 rounded uppercase tracking-wider">
                    {locScheme.schemeType}
                  </span>
                )}

                {locScheme.applicableStates.length === 0 ? (
                  <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Central Scheme
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {locScheme.applicableStates.join(', ')} Scheme
                  </span>
                )}

                {/* Phase 2.5 Dynamic Data Trust Badge */}
                {isCandidate ? (
                  <VerificationBadge
                    tier="candidate"
                    label={rui.candidateBadge}
                    sourceText={rui.candidateSourcePending}
                  />
                ) : (() => {
                  const trust = result.scheme.trustProfile || deriveSchemeTrustProfile(result.scheme);
                  const tier =
                    trust.verification.status === 'VERIFIED'
                      ? 'verified'
                      : trust.verification.status === 'PARTIALLY_VERIFIED'
                      ? 'partially-verified'
                      : 'in-review';
                  return <VerificationBadge tier={tier} />;
                })()}

                <span className="text-xs text-[#516A5F] dark:text-[#9EB0A7] font-medium">
                  {locScheme.sponsoringMinistry}
                </span>
              </div>

              <motion.h2
                layoutId={`scheme-title-${result.scheme.id}`}
                onClick={() => onSelectScheme?.(result)}
                className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2] hover:text-[#0B5D4B] dark:hover:text-[#4ADE80] transition-colors cursor-pointer"
              >
                {locScheme.name}
              </motion.h2>

              {/* Normalized Category Tags */}
              {(() => {
                const cats = getSchemeCategories(result.scheme);
                if (!cats || cats.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                    {cats.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-medium bg-[#F3F4F3] dark:bg-[#1E2924] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E4E8E4] dark:border-[#2A3C34] px-1.5 py-0.5 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                );
              })()}

              {/* Benefit Summary */}
              <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-1.5 leading-relaxed font-medium">
                {locScheme.benefitSummary}
              </p>

              {/* Candidate Scheme Advisory Box */}
              {isCandidate && (
                <div className="mt-2.5 px-3 py-1.5 rounded bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 flex items-center justify-between gap-2 text-[11px] text-amber-900 dark:text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{rui.candidateCardNotice}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
                    Unverified
                  </span>
                </div>
              )}

              {/* Progressive disclosure: collapsed match reasoning, expanded on demand.
                  Uses only factors already computed by the matching engine. */}
              {Array.isArray(result.breakdown) && result.breakdown.length > 0 && (
                <details className="group/why mt-3 rounded-[var(--yj-radius-md)] border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#111714]">
                  <summary className="yj-focus-ring flex items-center justify-between gap-2 cursor-pointer list-none px-3 py-2 text-[11px] font-bold text-[#0B5D4B] dark:text-[#4ADE80] rounded-[var(--yj-radius-md)]">
                    <span>
                      {rui.whyItMatches}
                    </span>
                    <span className="flex items-center gap-2 font-semibold text-[#516A5F] dark:text-[#9EB0A7]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1E6A50] dark:text-[#4ADE80]" aria-hidden="true" />
                        {result.breakdown.filter((f) => f.matched || f.state === 'MATCHED').length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        {result.breakdown.filter((f) => f.state === 'UNKNOWN').length}
                      </span>
                      <ChevronDown
                        className="w-3.5 h-3.5 transition-transform duration-200 group-open/why:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>
                  <ul className="px-3 pb-2.5 pt-0.5 space-y-1">
                    {result.breakdown.slice(0, 5).map((factor) => (
                      <li
                        key={factor.factorKey}
                        className="flex items-start gap-1.5 text-[11px] text-[#3F4943] dark:text-[#9EB0A7]"
                      >
                        {factor.matched || factor.state === 'MATCHED' ? (
                          <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-[#1E6A50] dark:text-[#4ADE80]" aria-hidden="true" />
                        ) : factor.state === 'UNKNOWN' ? (
                          <Info className="w-3 h-3 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-[#C2603F] dark:text-[#F87171]" aria-hidden="true" />
                        )}
                        <span>
                          <strong className="font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {factor.factorLabel}:
                          </strong>{' '}
                          {factor.matched || factor.state === 'MATCHED'
                            ? rui.factorMatched
                            : factor.state === 'UNKNOWN'
                            ? rui.factorNeedsInfo
                            : rui.factorDoesNotMatch}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Near-Match Dedicated Callout Box: Primary Gap with numerical distance */}
              {isNearMatch && result.primaryGap && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        {t('results.primaryGapLabel')}{' '}
                        <span className="underline decoration-amber-400">{result.primaryGap.factorLabel}</span>
                      </span>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                        {result.primaryGap.gapDistance || result.primaryGap.statutoryRequirement}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenWhyNotEligible(result)}
                    className="self-start sm:self-center text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-200/70 hover:bg-amber-300/80 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{t('results.viewAlternativesBtn')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Funding / Loan Range Banner */}
              <div className="mt-3.5 flex flex-wrap items-center gap-4 bg-[#FAFAF9] dark:bg-[#101613] border border-[#E4E8E4] dark:border-[#24342D] p-2.5 rounded text-xs">
                <div>
                  <span className="text-[#516A5F] dark:text-[#8E9F97] text-[11px] block">
                    {t('results.fundingQuantumLabel')}
                  </span>
                  <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                    {locScheme.fundingRangeText}
                  </strong>
                </div>
                {locScheme.subsidyRatePercent && locScheme.subsidyRatePercent > 0 ? (
                  <div className="border-l border-[#E4E8E4] dark:border-[#24342D] pl-4">
                    <span className="text-[#516A5F] dark:text-[#8E9F97] text-[11px] block">
                      {t('results.capitalSubsidyLabel')}
                    </span>
                    <strong className="text-[#1E6A50] dark:text-[#4ADE80] font-bold text-sm">
                      {locScheme.subsidyRatePercent}% {t('results.govtGrant')}
                    </strong>
                  </div>
                ) : null}
                <div className="border-l border-[#E4E8E4] dark:border-[#24342D] pl-4">
                  <span className="text-[#516A5F] dark:text-[#8E9F97] text-[11px] block">
                    {t('results.baseInterestLabel')}
                  </span>
                  <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                    {locScheme.baseInterestRate}{t('common.paisaPerAnnum')}
                  </strong>
                </div>
              </div>

              {/* 5-Factor Compliance Pills with 3-State Indicators */}
              <div className="mt-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#8E9F97] block mb-1.5">
                  {t('results.factorComplianceTitle')}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.breakdown.map((b) => {
                    const isMatched = b.state === 'MATCHED' || b.matched;
                    const isUnknown = b.state === 'UNKNOWN';

                    return (
                      <span
                        key={b.factorKey}
                        id={`factor-${locScheme.id}-${b.factorKey}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border ${
                          isMatched
                            ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]'
                            : isUnknown
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-[#FFDAD6] dark:bg-[#3D1A14] text-[#7C2C0F] dark:text-[#FCA5A5] border-[#FFCCBD] dark:border-[#5A2B20]'
                        }`}
                      >
                        {isMatched ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80] shrink-0" />
                        ) : isUnknown ? (
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#C2603F] dark:text-[#F87171] shrink-0" />
                        )}
                        <span>
                          {b.factorLabel}:{' '}
                          {isMatched
                            ? t('common.matched')
                            : isUnknown
                            ? rui.factorNeeded
                            : t('common.gap')}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Phase 4.1 Business-Need Relevance Layer (Independent Advisory Metric) */}
              {result.businessRelevance && result.businessRelevance.relevanceLevel !== 'UNKNOWN' && (
                <div
                  id={`business-relevance-${locScheme.id}`}
                  className={`mt-3.5 p-3 rounded-md border text-xs ${
                    result.businessRelevance.relevanceLevel === 'HIGH'
                      ? 'bg-[#EBF7F0] dark:bg-[#142C21] border-[#B2E4C9] dark:border-[#214D38]'
                      : result.businessRelevance.relevanceLevel === 'MEDIUM'
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                      : 'bg-[#F9F9F8] dark:bg-[#18201C] border-[#E4E8E4] dark:border-[#2A3C34]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                      <span className="font-bold text-[#14453D] dark:text-[#E0E8E3]">
                        {rui.bizNeedRelevance}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                          result.businessRelevance.relevanceLevel === 'HIGH'
                            ? 'bg-[#175741] text-white'
                            : result.businessRelevance.relevanceLevel === 'MEDIUM'
                            ? 'bg-blue-600 text-white'
                            : 'bg-stone-500 text-white'
                        }`}
                      >
                        {rui.bizRelFit(result.businessRelevance.relevanceLevel as 'HIGH' | 'MEDIUM' | 'LOW')}
                      </span>
                    </div>
                    {result.businessRelevance.matchedNeeds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.businessRelevance.matchedNeeds.map((n) => (
                          <span
                            key={n.needType}
                            className="text-[10px] font-semibold bg-white/90 dark:bg-[#1A2620] text-[#14453D] dark:text-[#4ADE80] border border-[#D9E8DF] dark:border-[#244335] px-1.5 py-0.5 rounded"
                          >
                            ✓ {SUPPORT_NEEDS_LOCALIZED[n.needType]?.[lang] || resolveLocalizedPair(n.labelEn, n.labelHi, lang)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#3F4943] dark:text-[#C5D5CC] leading-relaxed">
                    {getLocalizedBusinessRelevance(result.businessRelevance, lang).explanation}
                  </p>
                  {(result.businessRelevance.fundingFitNoteEn || result.businessRelevance.fundingFitNoteHi) && (
                    <div className="mt-1.5 text-[10px] font-medium text-[#14453D] dark:text-[#4ADE80] flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 shrink-0" />
                      <span>
                        {resolveLocalizedPair(
                          result.businessRelevance.fundingFitNoteEn,
                          result.businessRelevance.fundingFitNoteHi,
                          lang,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Authoritative Decision Layer: Next Best Action Callout */}
              {userProfile && (() => {
                const nextAction = getNextBestAction(result, userProfile, lang);
                return (
                  <div
                    id={`next-action-${locScheme.id}`}
                    className="mt-3.5 p-2.5 rounded-md bg-[#F4F8F6] dark:bg-[#16231C] border border-[#D9E8DF] dark:border-[#223F30] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#14453D] text-white dark:bg-[#4ADE80] dark:text-[#0B251F] px-1.5 py-0.5 rounded shrink-0">
                        {nextAction.badgeText}
                      </span>
                      <span className="text-[#1A1C1B] dark:text-[#E0E8E3] font-medium leading-tight">
                        <strong className="font-bold">{nextAction.title}:</strong>{' '}
                        <span className="text-[#516A5F] dark:text-[#9EB0A7]">
                          {nextAction.description}
                        </span>
                      </span>
                    </div>
                    {nextAction.actionUrl && (
                      <a
                        href={nextAction.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start sm:self-center font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline flex items-center gap-1 text-[11px] shrink-0"
                      >
                        <span>{nextAction.buttonLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* Required Documents Section */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('results.documentsLabel')}</span>
                </span>
                {locScheme.requiredDocuments.slice(0, 3).map((doc, dIdx) => (
                  <span
                    key={dIdx}
                    className="bg-[#EEEEED] dark:bg-[#1E2924] text-[#1A1C1B] dark:text-[#D5DDD8] text-[11px] px-2 py-0.5 rounded"
                  >
                    {doc}
                  </span>
                ))}
                {locScheme.requiredDocuments.length > 3 && (
                  <span className="text-[11px] text-[#516A5F] dark:text-[#4ADE80] font-semibold">
                    +{locScheme.requiredDocuments.length - 3} {t('results.moreDocuments')}
                  </span>
                )}
              </div>

              {/* Interactive Action Row */}
              <div className="mt-5 pt-4 border-t border-[#E4E8E4] dark:border-[#24342D] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ArrowFillButton
                    id={`view-scheme-btn-${locScheme.id}`}
                    onClick={() => onSelectScheme?.(result)}
                    variant="primary"
                    size="sm"
                  >
                    {t('results.viewSchemeBtn')}
                  </ArrowFillButton>

                  {onOpenWorkspace && (
                    <motion.button
                      id={`prepare-workspace-btn-${locScheme.id}`}
                      type="button"
                      onClick={() => onOpenWorkspace(result)}
                      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                      className="bg-[#1E6A50]/10 hover:bg-[#1E6A50]/20 dark:bg-[#4ADE80]/15 dark:hover:bg-[#4ADE80]/25 text-[#1E6A50] dark:text-[#4ADE80] border border-[#1E6A50]/30 dark:border-[#4ADE80]/30 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>{rui.prepareApplication}</span>
                    </motion.button>
                  )}

                  {/* Side-by-side comparison selector */}
                  {(() => {
                    const isSelectedForCompare = selectedForCompareIds.includes(result.scheme.id);
                    return (
                      <motion.button
                        id={`compare-toggle-btn-${locScheme.id}`}
                        type="button"
                        onClick={() => toggleCompareScheme(result.scheme.id)}
                        whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          isSelectedForCompare
                            ? 'bg-[#14453D] text-white border-[#14453D] dark:bg-[#4ADE80] dark:text-[#0B251F]'
                            : 'bg-white dark:bg-[#1E2924] text-[#516A5F] dark:text-[#9EB0A7] border-[#E4E8E4] dark:border-[#2E4137] hover:bg-[#F3F4F3] dark:hover:bg-[#25362C]'
                        }`}
                        title={
                          isSelectedForCompare
                            ? rui.removeFromComparison
                            : rui.selectUpTo3
                        }
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>
                          {isSelectedForCompare
                            ? rui.comparingCheck
                            : rui.compare}
                        </span>
                      </motion.button>
                    );
                  })()}

                  {onToggleSaveScheme && (
                    <BookmarkButton
                      id={`bookmark-btn-${locScheme.id}`}
                      isSaved={savedSchemeIds?.has(locScheme.id) ?? false}
                      onToggle={() => onToggleSaveScheme(locScheme.id)}
                      schemeName={locScheme.name}
                      compact={false}
                    />
                  )}

                  {!isEligible && (
                    <motion.button
                      id={`gap-analysis-btn-${locScheme.id}`}
                      type="button"
                      onClick={() => onOpenWhyNotEligible(result)}
                      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                      className="bg-[#FAFAF9] dark:bg-[#101613] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1A14]/70 text-[#7C2C0F] dark:text-[#FCA5A5] border border-[#FFCCBD] dark:border-[#5A2B20] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C2603F] dark:text-[#F87171]" />
                      <span>{rui.gapAnalysisAlternatives}</span>
                    </motion.button>
                  )}
                </div>

                <a
                  id={`official-link-${locScheme.id}`}
                  href={locScheme.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] hover:underline flex items-center gap-1"
                >
                  <span>{t('common.officialMinistryPortal')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <TrustFooterStrip
          sourceMinistry={locScheme.sponsoringMinistry}
          verifiedDate={locScheme.lastVerifiedDate}
        />
      </motion.article>
    );
  };

  if (!userProfile || matchResults.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="yj-card p-8 sm:p-10 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center mx-auto mb-4">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
            {rui.profileRequiredTitle}
          </h2>
          <p className="text-sm text-[#516A5F] dark:text-[#9EB0A7] mb-6 max-w-md mx-auto leading-relaxed">
            {rui.profileRequiredDesc}
          </p>
          <button
            id="start-eligibility-btn"
            onClick={onEditProfile}
            className="bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-6 py-2.5 rounded text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>{rui.completeProfileBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Brand & Portal Header */}
      <motion.div
        id="matched-schemes-portal-header"
        variants={shouldReduceMotion ? undefined : fadeSlideUp}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="mb-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <YojanaSetuLogo size={28} iconOnly={true} />
          <span className="font-bold text-xs uppercase tracking-widest text-[#14453D] dark:text-[#4ADE80]">
            {t('common.appName')} · {t('results.badge')}
          </span>
        </div>
        <h1 className="yj-h1 text-[#0F1512] dark:text-[#F0F4F2]">
          {t('results.title')}
        </h1>
        {/* Plain-language count summary sits directly under the headline */}
        <p className="yj-body mt-2 text-[#42544C] dark:text-[#A9BDB3]">
          {rui.foundCount(matchResults.length)}
        </p>
        <p className="yj-support text-[#516A5F] dark:text-[#8E9F97] max-w-xl mx-auto mt-1">
          {rui.personalizedSub}
        </p>
      </motion.div>

      {/* Live Verified Schemes Match Banner */}
      <motion.div
        id="results-verified-banner"
        variants={shouldReduceMotion ? undefined : fadeSlideUp}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="mb-6 p-4 rounded-md border border-[#C1E2D0] dark:border-[#22503E] bg-[#D9E8DF]/40 dark:bg-[#143327]/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-[#175741] dark:bg-[#4ADE80] animate-ping opacity-75 absolute inline-flex"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#175741] dark:bg-[#4ADE80] relative inline-flex"></span>
          </div>
          <p className="text-xs sm:text-sm text-[#14453D] dark:text-[#D9E8DF]">
            <span>{rui.analyzedSchemes}</span>
            <strong className="text-base font-extrabold underline decoration-[#1E6A50] dark:decoration-[#4ADE80] inline-flex items-center gap-1">
              <AnimatedCounter value={matchResults.length} />
              <span>{t('results.tabAll').toLowerCase()}</span>
            </strong>{' '}
            <span className="text-xs text-[#516A5F] dark:text-[#8E9F97]">
              ({rui.highEligibleNearMatches(eligibleMatches.length, nearMatches.length)}) · {authoritativeCount} {rui.authoritativeShort} + {candidateCount} {rui.candidateShort}
            </span>
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#14453D] dark:text-[#4ADE80] bg-white/80 dark:bg-[#101613]/80 px-2.5 py-1 rounded border border-[#C1E2D0] dark:border-[#24342D] whitespace-nowrap flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" />
          <span>{rui.statutoryVerified}</span>
        </span>
      </motion.div>

      {/* Top Banner: Profile snapshot + Match summary */}
      <motion.div
        variants={shouldReduceMotion ? undefined : fadeSlideUp}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="yj-card p-5 sm:p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80] bg-[#D9E8DF] dark:bg-[#1A382D] px-2.5 py-0.5 rounded">
                {t('results.badge')}
              </span>
              <span className="text-xs text-[#516A5F] dark:text-[#9EB0A7]">
                {matchResults.length} {t('results.schemesAnalyzed')}
              </span>
            </div>
            <h2 className="yj-h2 text-[#0F1512] dark:text-[#F0F4F2]">
              {t('results.title')}
            </h2>
            {userProfile && (
              <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-1">
                {t('results.profileSummaryPrefix')}{' '}
                <strong className="text-[#14453D] dark:text-[#4ADE80]">
                  {getLocalizedCategory(userProfile.category)}
                </strong>{' '}
                · {getLocalizedBusinessType(userProfile.businessType)} ·{' '}
                {userProfile.age} {t('common.years')} · {getLocalizedState(userProfile.state)}
                {userProfile.fundingRequired
                  ? ` · ${formatCurrency(userProfile.fundingRequired)}`
                  : ''}
                {userProfile.ruralUrban
                  ? ` · ${userProfile.ruralUrban === 'rural' ? rui.rural : rui.urban}`
                  : ''}
                {userProfile.businessStage
                  ? ` · ${
                      userProfile.businessStage === 'new'
                        ? rui.newSetup
                        : userProfile.businessStage === 'expanding'
                        ? rui.expansion
                        : rui.existingUnit
                    }`
                  : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              id="modify-profile-btn"
              onClick={onEditProfile}
              className="text-xs font-bold bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-3.5 py-2 rounded transition-colors shadow-xs cursor-pointer"
            >
              {t('results.modifyProfileBtn')}
            </button>
          </div>
        </div>

        {/* 3-Tier Summary Metrics with Animated Counters */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E4E8E4] dark:border-[#24342D] text-center">
          <button
            type="button"
            onClick={() => handleTabChange('eligible')}
            className={`rounded p-2.5 cursor-pointer transition-all text-center ${
              activeTab === 'eligible'
                ? 'bg-[#D9E8DF] dark:bg-[#1A382D] border-2 border-[#14453D] dark:border-[#4ADE80] shadow-xs'
                : 'bg-[#D9E8DF]/50 dark:bg-[#16382B]/60 border border-[#D9E8DF] dark:border-[#235845] hover:border-[#14453D]'
            }`}
          >
            <span className="text-xl font-extrabold text-[#14453D] dark:text-[#4ADE80] leading-none block">
              <AnimatedCounter value={eligibleMatches.length} />
            </span>
            <span className="text-[11px] font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
              {t('results.metricHigh')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('near')}
            className={`rounded p-2.5 cursor-pointer transition-all text-center ${
              activeTab === 'near'
                ? 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-500 shadow-xs'
                : 'bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400'
            }`}
          >
            <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400 leading-none block">
              <AnimatedCounter value={nearMatches.length} />
            </span>
            <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">
              {t('results.metricPartial')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`rounded p-2.5 cursor-pointer transition-all text-center ${
              activeTab === 'all'
                ? 'bg-[#E5E7E5] dark:bg-[#25322B] border-2 border-[#516A5F] dark:border-[#8E9F97] shadow-xs'
                : 'bg-[#F3F4F3] dark:bg-[#1B2420] border border-[#E4E8E4] dark:border-[#293B33] hover:border-[#516A5F]'
            }`}
          >
            <span className="text-xl font-extrabold text-[#3F4943] dark:text-[#C5D5CC] leading-none block">
              <AnimatedCounter value={otherMatches.length} />
            </span>
            <span className="text-[11px] font-semibold text-[#3F4943] dark:text-[#9EB0A7]">
              {t('results.metricGap')}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Phase 4.1 Entrepreneur Business Need Intelligence */}
      {(() => {
        if (!userProfile) return null;
        const effectiveNeedProfile =
          userProfile.businessNeedProfile || deriveBusinessNeedProfile(userProfile);
        if (!effectiveNeedProfile) return null;

        return (
          <div className="mb-6">
            <BusinessNeedSummary
              needProfile={effectiveNeedProfile}
              onCompleteProfile={onEditProfile}
            />
          </div>
        );
      })()}

      {/* Phase 4.2 / 4.3 Support Pathway Quick Action Bar — Clean & Uncluttered */}
      {supportPathway && (
        <div
          id="results-support-pathway-bar"
          className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-[#D9E8DF] dark:border-[#1E3E32] bg-[#F4F8F6] dark:bg-[#12221B] shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#14453D] dark:bg-[#1C5045] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-5 h-5 text-[#4ADE80]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#14453D] dark:text-[#E2EBE6]">
                  {rui.enterprisePathway}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D9E8DF] dark:bg-[#1C5045] text-[#1E6A50] dark:text-[#6EE7B7]">
                  {(supportPathway.currentStage && LIFECYCLE_PHASES_LOCALIZED[supportPathway.currentStage]?.[lang]) ||
                    resolveLocalizedPair(
                      supportPathway.currentStageLabelEn,
                      supportPathway.currentStageLabelHi,
                      lang,
                    )}
                </span>
              </div>
              <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] truncate">
                {rui.nextRecommendedStep}
                {getLocalizedPathwayAction(supportPathway.nextBestAction, lang).title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
            <button
              id="open-support-pathway-modal-btn"
              type="button"
              onClick={() => setIsPathwayModalOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#14453D] dark:bg-[#1C5045] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0F3730] dark:hover:bg-[#163E36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6A50] cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-[#4ADE80]" aria-hidden="true" />
              <span>{rui.viewSupportPathway}</span>
            </button>

            <button
              id="open-pathway-report-btn"
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#B2CDBF] dark:border-[#285743] bg-white dark:bg-[#162922] px-3 py-1.5 text-xs font-bold text-[#14453D] dark:text-[#C7D6CE] hover:bg-[#EAEFEA] dark:hover:bg-[#1F332B] transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{rui.reportPdf}</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Support Pathway Modal (Non-cluttering overlay) */}
      {isPathwayModalOpen && supportPathway && (
        <SupportPathwayModal
          isOpen={isPathwayModalOpen}
          onClose={() => setIsPathwayModalOpen(false)}
          pathway={supportPathway}
          onAction={handlePathwayAction}
          onSelectScheme={handlePathwaySchemeSelect}
          onToggleChecklistItem={handlePathwayChecklistToggle}
          onStartPathwayApplication={
            onStartPathwayApplication && topMatch ? handleStartApplication : undefined
          }
          isTopMatchTracked={isTopMatchTracked}
          onOpenReport={() => {
            setIsPathwayModalOpen(false);
            setIsReportOpen(true);
          }}
        />
      )}

      {isReportOpen && supportPathway && (
        <PathwayReportModal
          pathway={supportPathway}
          matchResults={matchResults}
          userProfile={userProfile}
          applications={applications}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Tabs & Search Bar */}
      <div id="scheme-results-tabs" className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            id="tab-all"
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#14453D] dark:bg-[#1C5045] text-white'
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
            }`}
          >
            {t('results.tabAll')} ({matchResults.length})
          </button>
          <button
            id="tab-best"
            onClick={() => handleTabChange('eligible')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'eligible'
                ? 'bg-[#14453D] dark:bg-[#1C5045] text-white'
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
            }`}
          >
            {t('results.tabBest')} ({eligibleMatches.length})
          </button>
          <button
            id="tab-near"
            onClick={() => handleTabChange('near')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'near'
                ? 'bg-[#14453D] dark:bg-[#1C5045] text-white'
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
            }`}
          >
            {t('results.tabNear')} ({nearMatches.length})
          </button>
          <button
            id="tab-subsidized"
            onClick={() => handleTabChange('subsidized')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'subsidized'
                ? 'bg-[#14453D] dark:bg-[#1C5045] text-white'
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
            }`}
          >
            {t('results.tabSubsidized')}
          </button>
        </div>

        {/* Search input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder={t('results.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-white dark:bg-[#151C19] border border-[#E4E8E4] dark:border-[#2A3C34] rounded text-xs text-[#1A1C1B] dark:text-[#F0F4F2] placeholder-[#516A5F] dark:placeholder-[#6C7E76] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
          />
        </div>
      </div>

      {/* Regional Jurisdiction Filter + Pan-India State/UT Dropdown */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 py-2 px-3 bg-[#F3F4F3] dark:bg-[#1A2520] rounded border border-[#E4E8E4] dark:border-[#24342D] text-xs">
        <span className="text-[#516A5F] dark:text-[#9EB0A7] font-semibold flex items-center gap-1 mr-1">
          <MapPin className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
          <span>{rui.jurisdiction}</span>
        </span>
        {[
          { id: 'all', label: rui.allRegions },
          { id: 'central', label: rui.central },
          { id: 'Karnataka', label: getLocalizedState('Karnataka') },
          { id: 'Kerala', label: getLocalizedState('Kerala') },
          { id: 'Tamil Nadu', label: getLocalizedState('Tamil Nadu') },
          { id: 'Telangana', label: getLocalizedState('Telangana') },
          { id: 'Andhra Pradesh', label: getLocalizedState('Andhra Pradesh') },
          { id: 'Maharashtra', label: getLocalizedState('Maharashtra') },
          { id: 'Gujarat', label: getLocalizedState('Gujarat') },
        ].map((reg) => (
          <button
            key={reg.id}
            onClick={() => setSelectedRegion(reg.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              selectedRegion === reg.id
                ? 'bg-[#14453D] dark:bg-[#1C5045] text-white shadow-xs'
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#202D27]'
            }`}
          >
            {reg.label}
          </button>
        ))}

        {/* Pan-India 36 States/UTs Selector */}
        <select
          id="jurisdiction-state-dropdown"
          value={INDIAN_STATES.includes(selectedRegion) ? selectedRegion : ''}
          onChange={(e) => {
            if (e.target.value) setSelectedRegion(e.target.value);
          }}
          className="ml-auto px-2.5 py-1 text-[11px] font-semibold rounded bg-white dark:bg-[#151C19] border border-[#E4E8E4] dark:border-[#2A3C34] text-[#14453D] dark:text-[#4ADE80] focus:outline-none cursor-pointer"
        >
          <option value="">{rui.selectStatePrompt}</option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {getLocalizedState(state)}
            </option>
          ))}
        </select>
      </div>

      {/* Trust Classification Filter Bar: Gazette Verified vs Candidate Discovery */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 py-2 px-3 bg-white dark:bg-[#121B16] rounded border border-[#E4E8E4] dark:border-[#24342D] text-xs">
        <div className="flex items-center gap-1.5 text-[#516A5F] dark:text-[#9EB0A7] font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
          <span>{rui.trustFilterLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            id="trust-filter-all"
            onClick={() => setTrustFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              trustFilter === 'all'
                ? 'bg-[#14453D] text-white dark:bg-[#4ADE80] dark:text-[#0B251F]'
                : 'bg-[#F3F4F3] dark:bg-[#1A2520] text-[#516A5F] dark:text-[#9EB0A7] border border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EAEAEA]'
            }`}
          >
            {rui.allTrustTiers} ({matchResults.length})
          </button>

          <button
            type="button"
            id="trust-filter-authoritative"
            onClick={() => setTrustFilter('authoritative')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              trustFilter === 'authoritative'
                ? 'bg-[#175741] text-white dark:bg-[#4ADE80] dark:text-[#0B251F]'
                : 'bg-[#EBF5EF] dark:bg-[#143327]/60 text-[#175741] dark:text-[#4ADE80] border border-[#C1E2D0] dark:border-[#285743] hover:bg-[#E1EFE7]'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-[#1E6A50] dark:text-[#4ADE80]" />
            <span>{rui.authoritativeShort}</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] bg-white/70 dark:bg-black/40 font-mono">
              {authoritativeCount}
            </span>
          </button>

          <button
            type="button"
            id="trust-filter-candidate"
            onClick={() => setTrustFilter('candidate')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              trustFilter === 'candidate'
                ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-black'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{rui.candidateShort}</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-900/60 font-mono">
              {candidateCount}
            </span>
          </button>
        </div>
      </div>

      {totalFilteredCount === 0 && (
        <EmptyState
          title={
            searchQuery
              ? rui.noSchemesFor(searchQuery)
              : t('results.noSchemesFound')
          }
          description={
            searchQuery
              ? rui.checkTypo
              : undefined
          }
          type={searchQuery ? 'search' : 'filter'}
          actionLabel={rui.resetSearch}
          onAction={() => {
            setSearchQuery('');
            setSelectedRegion('all');
            setTrustFilter('all');
            setActiveTab('all');
          }}
        />
      )}

      {/* RENDER GROUPED SECTIONS (When Tab is 'all') */}
      {activeTab === 'all' && (
        <div className="space-y-8">
          {/* 1. Best Matches Section */}
          {filteredEligible.length > 0 && (
            <section id="section-best-matches">
              <div className="mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#175741] dark:bg-[#4ADE80]" />
                  <h2 className="text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {t('results.bestMatchesTitle')} ({filteredEligible.length})
                  </h2>
                </div>
                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
                  {t('results.bestMatchesDesc')}
                </p>
              </div>
              <motion.div
                variants={shouldReduceMotion ? undefined : staggerContainer}
                initial={shouldReduceMotion ? undefined : 'hidden'}
                whileInView={shouldReduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 'some' }}
                className="space-y-4"
              >
                {filteredEligible.map((result, idx) => renderSchemeCard(result, idx === 0 && result.matchPercentage >= 80))}
              </motion.div>
            </section>
          )}

          {/* 2. Near Matches Section */}
          {filteredNear.length > 0 && (
            <section id="section-near-matches">
              <div className="mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                  <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
                    {t('results.nearMatchesTitle')} ({filteredNear.length})
                  </h2>
                </div>
                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
                  {t('results.nearMatchesDesc')}
                </p>
              </div>
              <motion.div
                variants={shouldReduceMotion ? undefined : staggerContainer}
                initial={shouldReduceMotion ? undefined : 'hidden'}
                whileInView={shouldReduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 'some' }}
                className="space-y-4"
              >
                {filteredNear.map((result) => renderSchemeCard(result))}
              </motion.div>
            </section>
          )}

          {/* 3. Other Schemes Evaluated Section */}
          {filteredOther.length > 0 && (
            <section id="section-other-schemes">
              <div className="mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400 dark:bg-stone-500" />
                  <h2 className="text-base font-bold text-[#3F4943] dark:text-[#C5D5CC]">
                    {t('results.otherOptionsTitle')} ({filteredOther.length})
                  </h2>
                </div>
                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
                  {t('results.otherOptionsDesc')}
                </p>
              </div>
              <motion.div
                variants={shouldReduceMotion ? undefined : staggerContainer}
                initial={shouldReduceMotion ? undefined : 'hidden'}
                whileInView={shouldReduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 'some' }}
                className="space-y-4"
              >
                {filteredOther.map((result) => renderSchemeCard(result))}
              </motion.div>
            </section>
          )}
        </div>
      )}

      {/* RENDER SINGLE TAB VIEW (When specific tab is selected) */}
      {activeTab === 'eligible' && (
        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="space-y-4"
        >
          {filteredEligible.map((result, idx) => renderSchemeCard(result, idx === 0 && result.matchPercentage >= 80))}
        </motion.div>
      )}

      {activeTab === 'near' && (
        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="space-y-4"
        >
          {filteredNear.map((result) => renderSchemeCard(result))}
        </motion.div>
      )}

      {activeTab === 'subsidized' && (
        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="space-y-4"
        >
          {[...filteredEligible, ...filteredNear, ...filteredOther].map((result) =>
            renderSchemeCard(result)
          )}
        </motion.div>
      )}

      {/* Alternative Options Section Prompt */}
      <div className="mt-8 p-5 bg-[#F3F4F3] dark:bg-[#151C19] border border-[#E4E8E4] dark:border-[#24342D] rounded-md flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200">
        <div>
          <h3 className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
            {t('results.altSectionTitle')}
          </h3>
          <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-0.5">
            {t('results.altSectionDesc')}
          </p>
        </div>
        <button
          id="explore-alt-schemes-btn"
          onClick={() => {
            const nearOrLow =
              nearMatches[0] || otherMatches[0] || matchResults[0];
            onOpenWhyNotEligible(nearOrLow);
          }}
          className="bg-white dark:bg-[#1C2521] hover:bg-[#EEEEED] dark:hover:bg-[#25322C] text-[#1A1C1B] dark:text-[#F0F4F2] border border-[#E4E8E4] dark:border-[#2A3C34] px-4 py-2 rounded text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <span>{t('results.altSectionBtn')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Scheme Comparison Action Bar */}
      <AnimatePresence>
        {selectedForCompareIds.length > 0 && (
          <motion.div
            id="floating-compare-bar"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#14453D] text-white px-4 sm:px-6 py-3 rounded-full shadow-2xl border border-[#1E6A50]/50 flex items-center gap-3 sm:gap-5 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-[#4ADE80]" />
              <div className="text-xs sm:text-sm font-bold whitespace-nowrap">
                <span>{selectedForCompareIds.length} / 3 </span>
                <span className="text-[#4ADE80]">
                  {rui.schemesSelected}
                </span>
              </div>
            </div>

            {selectedForCompareIds.length >= 2 ? (
              <button
                id="open-comparison-dialog-btn"
                type="button"
                onClick={() => setIsComparisonOpen(true)}
                className="bg-[#4ADE80] hover:bg-[#28B781] text-[#0B251F] text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>{rui.compareNow}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-[#A0B0A7] hidden sm:inline">
                {rui.selectAtLeast2}
              </span>
            )}

            <button
              id="clear-comparison-selection-btn"
              type="button"
              onClick={clearComparison}
              className="p-1 text-[#A0B0A7] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title={rui.clearSelection}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-side Scheme Comparison Modal */}
      {userProfile && (
        <SchemeComparisonModal
          isOpen={isComparisonOpen}
          selectedMatches={matchResults.filter((m) =>
            selectedForCompareIds.includes(m.scheme.id)
          )}
          profile={userProfile}
          onClose={() => setIsComparisonOpen(false)}
          onSelectScheme={onSelectScheme}
          onRemoveScheme={removeCompareScheme}
        />
      )}

      {/* Floating Scroll-to-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="matched-schemes-scroll-top-btn"
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-40 bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-3.5 py-2.5 rounded-full shadow-lg border border-[#1E6A50]/40 flex items-center gap-2 cursor-pointer group"
            title={rui.scrollToTopTitle}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-[#4ADE80]" />
            <span className="text-xs font-bold pr-1">
              {rui.top}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

