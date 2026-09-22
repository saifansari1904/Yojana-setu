import React, { useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2,
  FileText,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { MatchResult, UserProfile } from '../types';
import { useTranslation, Language } from '../i18n';
import { compareSchemes, SchemeComparisonResult } from '../lib/matching/comparisonEngine';
import { MatchGauge } from './MatchGauge';
import { VerificationBadge } from './ui';
import { columnStaggerContainer, columnStaggerItem, winnerFlash } from '../animations/variants';

interface SchemeComparisonModalProps {
  isOpen: boolean;
  selectedMatches: MatchResult[];
  profile: UserProfile;
  onClose: () => void;
  onSelectScheme?: (match: MatchResult) => void;
  onRemoveScheme?: (schemeId: string) => void;
}

const COMPARISON_MODAL_I18N: Record<
  Language,
  {
    title: string;
    schemes: string;
    closeAria: string;
    topMatch: string;
    remove: string;
    matchScore: string;
    potentiallyEligible: string;
    nearMatch: string;
    blockedLowMatch: string;
    fundingQuantum: string;
    capitalSubsidy: string;
    interestTenure: string;
    geographicScope: string;
    targetCategories: string;
    eligibleDomains: string;
    requiredDocs: string;
    statutoryDocs: string;
    applicationMode: string;
    nextBestAction: string;
    viewFullDetails: string;
    engineCertified: string;
    closeBtn: string;
  }
> = {
  en: {
    title: 'Statutory Scheme Comparison',
    schemes: 'Schemes',
    closeAria: 'Close comparison',
    topMatch: 'Top Match',
    remove: 'Remove',
    matchScore: 'Engine Match Score',
    potentiallyEligible: 'Potentially Eligible',
    nearMatch: 'Near Match',
    blockedLowMatch: 'Blocked / Low Match',
    fundingQuantum: 'Funding Quantum',
    capitalSubsidy: 'Capital Subsidy',
    interestTenure: 'Interest Rate & Tenure',
    geographicScope: 'Geographic Scope',
    targetCategories: 'Target Categories',
    eligibleDomains: 'Eligible Domains',
    requiredDocs: 'Required Documents',
    statutoryDocs: 'statutory documents',
    applicationMode: 'Application Mode',
    nextBestAction: 'Next Best Action:',
    viewFullDetails: 'View Full Details',
    engineCertified: 'All scores and statutory criteria are evaluated by the Yojana Setu matching engine.',
    closeBtn: 'Close Comparison',
  },
  hi: {
    title: 'योजनाओं की आधिकारिक तुलना',
    schemes: 'योजनाएं',
    closeAria: 'तुलना बंद करें',
    topMatch: 'शीर्ष मिलान',
    remove: 'हटाएं',
    matchScore: 'आधिकारिक स्कोर',
    potentiallyEligible: 'संभावित रूप से पात्र',
    nearMatch: 'समीप मिलान',
    blockedLowMatch: 'प्रतिबंधित / कम मिलान',
    fundingQuantum: 'ऋण / सहायता राशि',
    capitalSubsidy: 'पूंजीगत सब्सिडी',
    interestTenure: 'ब्याज एवं अवधि',
    geographicScope: 'भौगोलिक दायरा',
    targetCategories: 'लक्षित सामाजिक वर्ग',
    eligibleDomains: 'स्वीकार्य कार्यक्षेत्र',
    requiredDocs: 'आवश्यक दस्तावेज',
    statutoryDocs: 'वैधानिक दस्तावेज',
    applicationMode: 'आवेदन प्रक्रिया',
    nextBestAction: 'सर्वोत्तम अगला कदम:',
    viewFullDetails: 'विवरण देखें',
    engineCertified: 'सभी मानदंड एवं स्कोर योजना सेतु के केंद्रीय मिलान इंजन द्वारा मूल्यांकित हैं।',
    closeBtn: 'बंद करें',
  },
  ta: {
    title: 'திட்டங்களின் அதிகாரப்பூர்வ ஒப்பீடு',
    schemes: 'திட்டங்கள்',
    closeAria: 'ஒப்பீட்டை மூடுக',
    topMatch: 'முதன்மைப் பொருத்தம்',
    remove: 'நீக்கு',
    matchScore: 'இயந்திரப் பொருத்த மதிப்பெண்',
    potentiallyEligible: 'தகுதியுடைய வாய்ப்பு',
    nearMatch: 'நெருங்கிய பொருத்தம்',
    blockedLowMatch: 'தடைபட்டது / குறைந்த பொருத்தம்',
    fundingQuantum: 'நிதி அளவு',
    capitalSubsidy: 'மூலதன மானியம்',
    interestTenure: 'வட்டி மற்றும் காலம்',
    geographicScope: 'புவியியல் வரம்பு',
    targetCategories: 'இலக்கு சமூகப் பிரிவுகள்',
    eligibleDomains: 'தகுதியான துறைகள்',
    requiredDocs: 'தேவையான ஆவணங்கள்',
    statutoryDocs: 'சட்டப்பூர்வ ஆவணங்கள்',
    applicationMode: 'விண்ணப்ப முறை',
    nextBestAction: 'அடுத்த சிறந்த நடவடிக்கை:',
    viewFullDetails: 'முழு விவரங்களைப் பார்க்க',
    engineCertified: 'அனைத்து மதிப்பெண்களும் விதிகளும் யோஜனா சேது இயந்திரத்தால் மதிப்பீடு செய்யப்படுகின்றன.',
    closeBtn: 'ஒப்பீட்டை மூடுக',
  },
  te: {
    title: 'పథకాల అధికారిక పోలిక',
    schemes: 'పథకాలు',
    closeAria: 'పోలికను మూసివేయి',
    topMatch: 'టాప్ మ్యాచ్',
    remove: 'తొలగించు',
    matchScore: 'ఇంజిన్ మ్యాచ్ స్కోర్',
    potentiallyEligible: 'అర్హత కలిగిన అవకాశం',
    nearMatch: 'సమీప మ్యాచ్',
    blockedLowMatch: 'నిరోధించబడింది / తక్కువ మ్యాచ్',
    fundingQuantum: 'నిధుల పరిమాణం',
    capitalSubsidy: 'మూలధన సబ్సిడీ',
    interestTenure: 'వడ్డీ & కాలపరిమితి',
    geographicScope: 'భౌగోళిక పరిధి',
    targetCategories: 'లక్ష్య వర్గాలు',
    eligibleDomains: 'అర్హతగల రంగాలు',
    requiredDocs: 'అవసరమైన పత్రాలు',
    statutoryDocs: 'చట్టబద్ధమైన పత్రాలు',
    applicationMode: 'దరఖాస్తు విధానం',
    nextBestAction: 'తదుపరి ఉత్తమ చర్య:',
    viewFullDetails: 'పూర్తి వివరాలు చూడండి',
    engineCertified: 'అన్ని స్కోర్‌లు మరియు ప్రమాణాలు యోజన సేతు ఇంజిన్ ద్వారా మూల్యాంకనం చేయబడ్డాయి.',
    closeBtn: 'పోలికను మూసివేయి',
  },
  kn: {
    title: 'ಯೋಜನೆಗಳ ಅಧಿಕೃತ ಹೋಲಿಕೆ',
    schemes: 'ಯೋಜನೆಗಳು',
    closeAria: 'ಹೋಲಿಕೆಯನ್ನು ಮುಚ್ಚಿ',
    topMatch: 'ಉನ್ನತ ಹೊಂದಾಣಿಕೆ',
    remove: 'ತೆಗೆದುಹಾಕಿ',
    matchScore: 'ಇಂಜಿನ್ ಹೊಂದಾಣಿಕೆ ಸ್ಕೋರ್',
    potentiallyEligible: 'ಅರ್ಹತೆಯ ಸಾಧ್ಯತೆ',
    nearMatch: 'ಹತ್ತಿರದ ಹೊಂದಾಣಿಕೆ',
    blockedLowMatch: 'ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ / ಕಡಿಮೆ ಹೊಂದಾಣಿಕೆ',
    fundingQuantum: 'ಹಣಕಾಸು ಪ್ರಮಾಣ',
    capitalSubsidy: 'ಬಂಡವಾಳ ಸಬ್ಸಿಡಿ',
    interestTenure: 'ಬಡ್ಡಿ ಮತ್ತು ಅವಧಿ',
    geographicScope: 'ಭೌಗೋಳಿಕ ವ್ಯಾಪ್ತಿ',
    targetCategories: 'ಗುರಿ ವರ್ಗಗಳು',
    eligibleDomains: 'ಅರ್ಹ ಕ್ಷೇತ್ರಗಳು',
    requiredDocs: 'ಅಗತ್ಯ ದಾಖಲೆಗಳು',
    statutoryDocs: 'ಶಾಸನಬದ್ಧ ದಾಖಲೆಗಳು',
    applicationMode: 'ಅರ್ಜಿ ವಿಧಾನ',
    nextBestAction: 'ಮುಂದಿನ ಉತ್ತಮ ಕ್ರಮ:',
    viewFullDetails: 'ಪೂರ್ಣ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    engineCertified: 'ಎಲ್ಲಾ ಸ್ಕೋರ್‌ಗಳು ಮತ್ತು ಮಾನದಂಡಗಳನ್ನು ಯೋಜನಾ ಸೇತು ಇಂಜಿನ್ ಮೌಲ್ಯಮಾಪನ ಮಾಡಿದೆ.',
    closeBtn: 'ಹೋಲಿಕೆಯನ್ನು ಮುಚ್ಚಿ',
  },
  ml: {
    title: 'പദ്ധതികളുടെ ഔദ്യോഗിക താരതമ്യം',
    schemes: 'പദ്ധതികൾ',
    closeAria: 'താരതമ്യം അവസാനിപ്പിക്കുക',
    topMatch: 'ടോപ്പ് മാച്ച്',
    remove: 'ഒഴിവാക്കുക',
    matchScore: 'മാച്ച് സ്കോർ',
    potentiallyEligible: 'സാധ്യമായ യോഗ്യത',
    nearMatch: 'ഏറെക്കുറെ യോജിച്ചത്',
    blockedLowMatch: 'തടസ്സപ്പെട്ടു / കുറഞ്ഞ പൊരുത്തം',
    fundingQuantum: 'ഫണ്ടിംഗ് തുക',
    capitalSubsidy: 'മൂലധന സബ്‌സിഡി',
    interestTenure: 'പലിശയും കാലാവധിയും',
    geographicScope: 'ഭൂമിശാസ്ത്രപരമായ പരിധി',
    targetCategories: 'ലക്ഷ്യ വിഭാഗങ്ങൾ',
    eligibleDomains: 'അനുയോജ്യമായ മേഖലകൾ',
    requiredDocs: 'ആവശ്യമായ രേഖകൾ',
    statutoryDocs: 'നിയമാനുസൃത രേഖകൾ',
    applicationMode: 'അപേക്ഷാ രീതി',
    nextBestAction: 'അടുത്ത മികച്ച നടപടി:',
    viewFullDetails: 'മുഴുവൻ വിവരങ്ങളും കാണുക',
    engineCertified: 'എല്ലാ സ്കോറുകളും മാനണ്ഡങ്ങളും യോജന സേതു എഞ്ചിൻ വിലയിരുത്തിയതാണ്.',
    closeBtn: 'താരതമ്യം അവസാനിപ്പിക്കുക',
  },
  mr: {
    title: 'योजनांची अधिकृत तुलना',
    schemes: 'योजना',
    closeAria: 'तुलना बंद करा',
    topMatch: 'सर्वोत्तम जुळणी',
    remove: 'काढा',
    matchScore: 'इंजिन जुळणी गुण',
    potentiallyEligible: 'संभाव्य पात्र',
    nearMatch: 'समीप जुळणी',
    blockedLowMatch: 'अवरोधित / कमी जुळणी',
    fundingQuantum: 'कर्ज / सहाय्य रक्कम',
    capitalSubsidy: 'भांडवली अनुदान',
    interestTenure: 'व्याज व मुदत',
    geographicScope: 'भौगोलिक व्याप्ती',
    targetCategories: 'लक्ष्य सामाजिक गट',
    eligibleDomains: 'पात्र कार्यक्षेत्रे',
    requiredDocs: 'आवश्यक कागदपत्रे',
    statutoryDocs: 'वैधानिक कागदपत्रे',
    applicationMode: 'अर्ज प्रक्रिया',
    nextBestAction: 'सर्वोत्तम पुढील पाऊल:',
    viewFullDetails: 'संपूर्ण तपशील पहा',
    engineCertified: 'सर्व निकष व गुण योजना सेतुच्या केंद्रीय जुळणी इंजिनद्वारे मूल्यांकित आहेत.',
    closeBtn: 'तुलना बंद करा',
  },
};

export const SchemeComparisonModal: React.FC<SchemeComparisonModalProps> = ({
  isOpen,
  selectedMatches,
  profile,
  onClose,
  onSelectScheme,
  onRemoveScheme,
}) => {
  const { lang, t } = useTranslation();
  const modalId = useId();
  const shouldReduceMotion = useReducedMotion();
  const ui = COMPARISON_MODAL_I18N[lang] || COMPARISON_MODAL_I18N.en;

  if (!isOpen || selectedMatches.length < 2) return null;

  let comparison: SchemeComparisonResult;
  try {
    comparison = compareSchemes(selectedMatches, profile, lang);
  } catch (err) {
    console.error('Error computing scheme comparison:', err);
    return null;
  }

  const { columns, bestMatchSchemeId, highestSubsidySchemeId, summaryNote } = comparison;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          id={`scheme-comparison-dialog-${modalId}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="comparison-modal-title"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-[#121815] border border-[#D5DDD8] dark:border-[#24342D] rounded-lg shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1A1C1B] dark:text-[#F0F4F2]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E4E8E4] dark:border-[#24342D] flex items-center justify-between bg-[#F8FAF9] dark:bg-[#16201B]">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#14453D] dark:bg-[#4ADE80]" />
                <h2
                  id="comparison-modal-title"
                  className="text-base sm:text-lg font-bold text-[#14453D] dark:text-[#4ADE80]"
                >
                  {ui.title}
                </h2>
                <span className="text-xs bg-[#E2EAE6] dark:bg-[#1E2E26] text-[#14453D] dark:text-[#4ADE80] px-2 py-0.5 rounded font-semibold">
                  {columns.length} / 3 {ui.schemes}
                </span>
              </div>
              <p className="text-xs text-[#516A5F] dark:text-[#8E9F97] mt-0.5">
                {summaryNote}
              </p>
            </div>

            <button
              id="close-comparison-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#516A5F] hover:text-[#1A1C1B] dark:text-[#8E9F97] dark:hover:text-[#F0F4F2] hover:bg-[#EAECEB] dark:hover:bg-[#202D26] transition-colors cursor-pointer"
              aria-label={ui.closeAria}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparison Content Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
            <motion.div
              variants={columnStaggerContainer}
              initial="hidden"
              animate="visible"
              className={`grid grid-cols-1 md:grid-cols-${columns.length} gap-4 min-w-[640px]`}
            >
              {columns.map((col) => {
                const isBestMatch = col.schemeId === bestMatchSchemeId;
                const matchResult = selectedMatches.find((m) => m.scheme.id === col.schemeId);

                return (
                  <motion.div
                    key={col.schemeId}
                    id={`compare-column-${col.schemeId}`}
                    variants={columnStaggerItem}
                    className={`rounded-lg border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                      isBestMatch
                        ? 'border-[#14453D] dark:border-[#4ADE80] bg-[#FAFDFB] dark:bg-[#15221C] shadow-sm'
                        : 'border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#141C18]'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Best Match Badge and Remove button */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isBestMatch && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#14453D] text-white dark:bg-[#4ADE80] dark:text-[#0B251F] px-2 py-0.5 rounded">
                              <Award className="w-3 h-3" />
                              {ui.topMatch}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold bg-[#EAECEB] dark:bg-[#223129] px-2 py-0.5 rounded text-[#516A5F] dark:text-[#A0B0A7]">
                            {col.schemeType}
                          </span>
                        </div>

                        {onRemoveScheme && columns.length > 2 && (
                          <button
                            onClick={() => onRemoveScheme(col.schemeId)}
                            className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 rounded transition-colors cursor-pointer"
                            title={ui.remove}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Scheme Title */}
                      <h3 className="text-base font-bold leading-snug line-clamp-2 text-[#1A1C1B] dark:text-[#F0F4F2] mb-1">
                        {col.schemeName}
                      </h3>
                      <p className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] line-clamp-1 mb-4">
                        {col.sponsoringMinistry}
                      </p>

                      {/* Match Score & Status Header — winner flashes once after columns settle */}
                      <motion.div
                        variants={isBestMatch && !shouldReduceMotion ? winnerFlash : undefined}
                        initial={isBestMatch && !shouldReduceMotion ? 'hidden' : undefined}
                        animate={isBestMatch && !shouldReduceMotion ? 'visible' : undefined}
                        className="flex items-center gap-3 p-3 rounded-md bg-[#F4F6F5] dark:bg-[#1B2720] border border-[#E4E8E4] dark:border-[#25362C] mb-4"
                      >
                        <MatchGauge percentage={col.matchPercentage} size={54} strokeWidth={5} />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#516A5F] dark:text-[#8E9F97] block">
                            {ui.matchScore}
                          </span>
                          <span className="text-lg font-bold text-[#14453D] dark:text-[#4ADE80]">
                            {Math.round(col.matchPercentage)}%
                          </span>
                          <div className="mt-0.5">
                            {col.isEligible ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.2 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                {ui.potentiallyEligible}
                              </span>
                            ) : col.matchStatus === 'near-match' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-1.5 py-0.2 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                {ui.nearMatch}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 px-1.5 py-0.2 rounded">
                                <Info className="w-3 h-3" />
                                {ui.blockedLowMatch}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>

                      {/* Highlights */}
                      {col.standoutHighlights.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {col.standoutHighlights.map((h, hIdx) => (
                            <span
                              key={hIdx}
                              className="text-[10px] font-bold bg-[#D9E8DF] dark:bg-[#1E382C] text-[#14453D] dark:text-[#4ADE80] px-2 py-0.5 rounded"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Detailed Metric Rows */}
                      <div className="space-y-2.5 text-xs">
                        {/* Funding Quantum */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.fundingQuantum}
                          </span>
                          <span className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.fundingRangeText}
                          </span>
                        </div>

                        {/* Capital Subsidy */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.capitalSubsidy}
                          </span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {col.subsidyText}
                          </span>
                        </div>

                        {/* Interest & Tenure */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.interestTenure}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2] block">
                            {col.interestRateText} · {col.tenureText}
                          </span>
                        </div>

                        {/* Geographic Scope */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.geographicScope}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.applicableStatesText}
                          </span>
                        </div>

                        {/* Target Categories */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.targetCategories}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.targetCategoriesText}
                          </span>
                        </div>

                        {/* Target Sectors */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.eligibleDomains}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.targetBusinessTypesText}
                          </span>
                        </div>

                        {/* Required Documents */}
                        <div className="pb-2 border-b border-[#EAECEB] dark:border-[#223129]">
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.requiredDocs}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {col.documentsCount} {ui.statutoryDocs}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {col.keyDocuments.map((doc, dIdx) => (
                              <span
                                key={dIdx}
                                className="text-[9px] bg-[#EAECEB] dark:bg-[#1E2E26] px-1.5 py-0.5 rounded text-[#334038] dark:text-[#A0B0A7]"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Application Mode */}
                        <div>
                          <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                            {ui.applicationMode}
                          </span>
                          <span className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2] capitalize">
                            {col.applicationMode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="mt-5 pt-3 border-t border-[#EAECEB] dark:border-[#223129]">
                      <div className="mb-2.5">
                        <span className="text-[10px] font-bold text-[#14453D] dark:text-[#4ADE80] uppercase tracking-wider block">
                          {ui.nextBestAction}
                        </span>
                        <p className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] font-medium mt-0.5">
                          {col.nextBestAction.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {matchResult && onSelectScheme && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectScheme(matchResult);
                            }}
                            className="flex-1 bg-[#14453D] hover:bg-[#0E352E] dark:bg-[#4ADE80] dark:hover:bg-[#28B781] text-white dark:text-[#0B251F] text-xs font-bold py-2 px-3 rounded text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>{ui.viewFullDetails}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {col.nextBestAction.actionUrl && (
                          <a
                            href={col.nextBestAction.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-[#D5DDD8] dark:border-[#2E4137] rounded hover:bg-[#F3F5F4] dark:hover:bg-[#1E2E26] text-[#14453D] dark:text-[#4ADE80] transition-colors cursor-pointer"
                            title={col.nextBestAction.buttonLabel}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Footer Note */}
          <div className="px-5 py-3 border-t border-[#E4E8E4] dark:border-[#24342D] bg-[#F8FAF9] dark:bg-[#16201B] flex flex-wrap items-center justify-between gap-3 text-xs text-[#516A5F] dark:text-[#8E9F97]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {ui.engineCertified}
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-xs font-bold text-[#14453D] dark:text-[#4ADE80] bg-white dark:bg-[#1B2720] border border-[#D5DDD8] dark:border-[#2B3E33] hover:bg-[#EAECEB] dark:hover:bg-[#23332A] transition-colors cursor-pointer"
            >
              {ui.closeBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
