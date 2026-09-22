import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Tag,
} from 'lucide-react';
import {
  BusinessNeedProfile,
  SUPPORT_NEEDS_TAXONOMY,
} from '../../types/business';
import { formatLakhCrore } from '../../lib/business/fundingCalculator';
import { getLocalizedMissingFieldPrompt } from '../../lib/business/businessProfileCompleteness';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';

interface BusinessNeedSummaryProps {
  needProfile?: BusinessNeedProfile | null;
  onCompleteProfile?: () => void;
}

const COPY = {
  understoodNeedTitle: {
    en: 'Understood Business Need',
    hi: 'आपकी व्यावसायिक आवश्यकता की समझ',
    ta: 'புரிந்துகொள்ளப்பட்ட வணிகத் தேவை',
    te: 'అర్థం చేసుకున్న వ్యాపార అవసరం',
    kn: 'ಅರ್ಥಮಾಡಿಕೊಂಡ ವ್ಯಾಪಾರ ಅಗತ್ಯ',
    ml: 'മനസ്സിലാക്കിയ ബിസിനസ്സ് ആവശ്യം',
    mr: 'समजून घेतलेली व्यावसायिक गरज',
  },
  profileCompleteness: {
    en: (pct: number) => `Profile Completeness: ${pct}%`,
    hi: (pct: number) => `प्रोफ़ाइल पूर्णता: ${pct}%`,
    ta: (pct: number) => `சுயவிவர நிறைவு: ${pct}%`,
    te: (pct: number) => `ప్రొఫైల్ సంపూర్ణత: ${pct}%`,
    kn: (pct: number) => `ಪ್ರೊಫೈಲ್ ಪೂರ್ಣತೆ: ${pct}%`,
    ml: (pct: number) => `പ്രൊഫൈൽ പൂർണ്ണത: ${pct}%`,
    mr: (pct: number) => `प्रोफाइल पूर्णता: ${pct}%`,
  },
  refine: {
    en: 'Refine',
    hi: 'विवरण जोड़ें',
    ta: 'மேம்படுத்து',
    te: 'సరిదిద్దండి',
    kn: 'ವಿವರ ಸೇರಿಸಿ',
    ml: 'വിശദാംശങ്ങൾ ചേർക്കുക',
    mr: 'परिष्कृत करा',
  },
  labels: {
    business: {
      en: 'Business',
      hi: 'व्यवसाय',
      ta: 'வணிகம்',
      te: 'వ్యాపారం',
      kn: 'ವ್ಯವಹಾರ',
      ml: 'ബിസിനസ്സ്',
      mr: 'व्यवसाय',
    },
    stage: {
      en: 'Stage',
      hi: 'चरण',
      ta: 'நிலை',
      te: 'దశ',
      kn: 'ಹಂತ',
      ml: 'ഘട്ടം',
      mr: 'टप्पा',
    },
    sector: {
      en: 'Sector',
      hi: 'क्षेत्रक',
      ta: 'துறை',
      te: 'రంగం',
      kn: 'ಕ್ಷೇತ್ರ',
      ml: 'മേഖല',
      mr: 'क्षेत्र',
    },
    location: {
      en: 'Location',
      hi: 'स्थान',
      ta: 'இருப்பிடம்',
      te: 'స్థానం',
      kn: 'ಸ್ಥಳ',
      ml: 'സ്ഥലം',
      mr: 'स्थान',
    },
    origin: {
      en: 'Origin',
      hi: 'मूल निवास',
      ta: 'பூர்வீகம்',
      te: 'స్వస్థలం',
      kn: 'ಮೂಲ ನಿವಾಸ',
      ml: 'സ്വദേശം',
      mr: 'मूळ निवास',
    },
    projectCost: {
      en: 'Project Cost',
      hi: 'परियोजना लागत',
      ta: 'திட்டச் செலவு',
      te: 'ప్రాజెక్ట్ వ్యయం',
      kn: 'ಯೋಜನಾ ವೆಚ್ಚ',
      ml: 'പദ്ധതി ചെലവ്',
      mr: 'प्रकल्प खर्च',
    },
    fundingGap: {
      en: 'Funding Gap',
      hi: 'वित्तीय अंतर (Funding Gap)',
      ta: 'நிதி இடைவெளி',
      te: 'నిధుల వ్యత్యాసం',
      kn: 'ಹಣಕಾಸಿನ ಅಂತರ',
      ml: 'ഫണ്ടിംഗ് ഗ്യാപ്പ്',
      mr: 'निधी तफावत',
    },
    primaryNeed: {
      en: 'Primary Need',
      hi: 'मुख्य आवश्यकता',
      ta: 'முக்கிய தேவை',
      te: 'ప్రాథమిక అవసరం',
      kn: 'ಮುಖ್ಯ ಅಗತ್ಯ',
      ml: 'പ്രധാന ആവശ്യം',
      mr: 'मुख्य गरज',
    },
    additionalNeeds: {
      en: 'Additional Needs',
      hi: 'अतिरिक्त आवश्यकताएं',
      ta: 'கூடுதல் தேவைகள்',
      te: 'అదనపు అవసరాలు',
      kn: 'ಹೆಚ್ಚುವರಿ ಅಗತ್ಯಗಳು',
      ml: 'കൂടുതൽ ആവശ്യങ്ങൾ',
      mr: 'अतिरिक्त गरजा',
    },
  },
  stages: {
    IDEA: {
      en: 'planning a new venture',
      hi: 'नया विचार विकसित कर रहे हैं',
      ta: 'புதிய தொழில் யோசனையைத் திட்டமிடுகிறீர்கள்',
      te: 'కొత్త వ్యాపార ప్రణాళికను రచిస్తున్నారు',
      kn: 'ಹೊಸ ಉದ್ಯಮವನ್ನು ಯೋಜಿಸುತ್ತಿದ್ದೀರಿ',
      ml: 'പുതിയ സംരംഭം ആസൂത്രണം ചെയ്യുന്നു',
      mr: 'नवीन उपक्रमाचे नियोजन करत आहात',
    },
    PRE_LAUNCH: {
      en: 'setting up a new enterprise',
      hi: 'नया उद्यम शुरू करने की तैयारी में हैं',
      ta: 'புதிய நிறுவனத்தைத் தொடங்க தயாராகிறீர்கள்',
      te: 'కొత్త సంస్థను ప్రారంభించే సన్నాహాల్లో ఉన్నారు',
      kn: 'ಹೊಸ ಉದ್ಯಮ ಸ್ಥಾಪಿಸಲು ಸಿದ್ಧತೆ ನಡೆಸುತ್ತಿದ್ದೀರಿ',
      ml: 'പുതിയ സംരംഭം ആരംഭിക്കാൻ തയ്യാറെടുക്കുന്നു',
      mr: 'नवीन उपक्रम सुरू करण्याच्या तयारीत आहात',
    },
    NEW_BUSINESS: {
      en: 'operating a recently launched enterprise',
      hi: 'हाल ही में शुरू किया गया नया उद्यम संचालित कर रहे हैं',
      ta: 'சமீபத்தில் தொடங்கப்பட்ட நிறுவனத்தை நடத்துகிறீர்கள்',
      te: 'ఇటీవల ప్రారంభించిన కొత్త సంస్థను నిర్వహిస్తున్నారు',
      kn: 'ಇತ್ತೀಚೆಗೆ ಪ್ರಾರಂಭಿಸಿದ ಉದ್ಯಮವನ್ನು ನಡೆಸುತ್ತಿದ್ದೀರಿ',
      ml: 'സമീപകാലത്ത് ആരംഭിച്ച സംരംഭം നടത്തുന്നു',
      mr: 'अलीकडेच सुरू केलेला नवीन उपक्रम चालवत आहात',
    },
    EARLY_OPERATION: {
      en: 'operating an active business',
      hi: 'सक्रिय व्यवसाय का संचालन कर रहे हैं',
      ta: 'செயலில் உள்ள வணிகத்தை நடத்துகிறீர்கள்',
      te: 'చురుకైన వ్యాపారాన్ని నిర్వహిస్తున్నారు',
      kn: 'ಸಕ್ರಿಯ ವ್ಯವಹಾರವನ್ನು ನಡೆಸುತ್ತಿದ್ದೀರಿ',
      ml: 'സജീവ ബിസിനസ്സ് നടത്തുന്നു',
      mr: 'सक्रिय व्यवसाय चालवत आहात',
    },
    EXPANSION: {
      en: 'expanding an existing facility',
      hi: 'व्यवसाय का बृहद विस्तार कर रहे हैं',
      ta: 'தற்போதுள்ள நிறுவனத்தை விரிவுபடுத்துகிறீர்கள்',
      te: 'ప్రస్తుత వ్యాపారాన్ని విస్తరిస్తున్నారు',
      kn: 'ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಸೌಲಭ್ಯವನ್ನು ವಿಸ್ತರಿಸುತ್ತಿದ್ದೀರಿ',
      ml: 'നിലവിലുള്ള സൗകര്യം വിപുലീകരിക്കുന്നു',
      mr: 'अस्तित्वातील सुविधा विस्तारत आहात',
    },
    DEFAULT: {
      en: 'scaling your enterprise',
      hi: 'व्यवसाय वृद्धि हेतु प्रयासरत हैं',
      ta: 'உங்கள் நிறுவனத்தை வளர்க்கிறீர்கள்',
      te: 'వ్యాపార వృద్ధి కోసం కృషి చేస్తున్నారు',
      kn: 'ಉದ್ಯಮದ ಬೆಳವಣಿಗೆಗೆ ಶ್ರಮಿಸುತ್ತಿದ್ದೀರಿ',
      ml: 'സംരംഭം വളർത്താൻ ശ്രമിക്കുന്നു',
      mr: 'आपला उपक्रम वाढवण्याचा प्रयत्न करत आहात',
    },
  },
  fundingGap: {
    en: (gap: string) => `requiring approximately ${gap} in additional funding`,
    hi: (gap: string) => `जिसमें लगभग ${gap} की वित्तीय सहायता आवश्यक है`,
    ta: (gap: string) => `சுமார் ${gap} கூடுதல் நிதி தேவைப்படுகிறது`,
    te: (gap: string) => `సుమారు ${gap} అదనపు నిధుల అవసరం ఉంది`,
    kn: (gap: string) => `ಅಂದಾಜು ${gap} ಹೆಚ್ಚುವರಿ ಹಣಕಾಸು ಅಗತ್ಯವಿದೆ`,
    ml: (gap: string) => `ഏകദേശം ${gap} അധിക ഫണ്ടിംഗ് ആവശ്യമാണ്`,
    mr: (gap: string) => `सुमारे ${gap} अतिरिक्त निधीची आवश्यकता आहे`,
  },
  totalCost: {
    en: (cost: string) => `with an estimated project cost of ${cost}`,
    hi: (cost: string) => `जिसकी कुल परियोजना लागत लगभग ${cost} है`,
    ta: (cost: string) => `மதிப்பிடப்பட்ட திட்டச் செலவு ${cost}`,
    te: (cost: string) => `అంచనా వేసిన ప్రాజెక్ట్ వ్యయం ${cost}`,
    kn: (cost: string) => `ಅಂದಾಜು ಯೋಜನಾ ವೆಚ್ಚ ${cost}`,
    ml: (cost: string) => `കണക്കാക്കിയ പദ്ധതി ചെലവ് ${cost}`,
    mr: (cost: string) => `अंदाजे प्रकल्प खर्च ${cost}`,
  },
  fundingDefault: {
    en: 'seeking tailored government credit support',
    hi: 'जिसमें वित्तीय आवश्यकताओं का निर्धारण प्रक्रियाधीन है',
    ta: 'பொருத்தமான அரசு கடன் உதவியை நாடுகிறீர்கள்',
    te: 'తగిన ప్రభుత్వ రుణ మద్దతును కోరుతున్నారు',
    kn: 'ಸೂಕ್ತ ಸರ್ಕಾರಿ ಸಾಲ ಬೆಂಬಲವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ',
    ml: 'അനുയോജ്യമായ സർക്കാർ വായ്പാ സഹായം തേടുന്നു',
    mr: 'योग्य सरकारी कर्ज सहाय्य शोधत आहात',
  },
  primaryNeedSuffix: {
    en: (need: string) => `, prioritizing ${need} support.`,
    hi: (need: string) => `, तथा आपकी मुख्य प्राथमिकता "${need}" है।`,
    ta: (need: string) => `, "${need}" முக்கிய முன்னுரிமையாக உள்ளது.`,
    te: (need: string) => `, మరియు మీ ముఖ్య ప్రాధాన్యత "${need}".`,
    kn: (need: string) => `, ಮತ್ತು ನಿಮ್ಮ ಮುಖ್ಯ ಆದ್ಯತೆ "${need}".`,
    ml: (need: string) => `, പ്രധാന മുൻഗണന "${need}" ആണ്.`,
    mr: (need: string) => `, मुख्य प्राधान्य "${need}" आहे.`,
  },
  fullNarrative: {
    en: (domain: string, stage: string, funding: string, need: string) =>
      `You are ${stage} in the ${domain} domain, ${funding}${need}`,
    hi: (domain: string, stage: string, funding: string, need: string) =>
      `आप ${domain} क्षेत्र में ${stage}, ${funding}${need}`,
    ta: (domain: string, stage: string, funding: string, need: string) =>
      `நீங்கள் ${domain} துறையில் ${stage}, ${funding}${need}`,
    te: (domain: string, stage: string, funding: string, need: string) =>
      `మీరు ${domain} రంగంలో ${stage}, ${funding}${need}`,
    kn: (domain: string, stage: string, funding: string, need: string) =>
      `ನೀವು ${domain} ಕ್ಷೇತ್ರದಲ್ಲಿ ${stage}, ${funding}${need}`,
    ml: (domain: string, stage: string, funding: string, need: string) =>
      `നിങ്ങൾ ${domain} മേഖലയിൽ ${stage}, ${funding}${need}`,
    mr: (domain: string, stage: string, funding: string, need: string) =>
      `आपण ${domain} क्षेत्रात ${stage}, ${funding}${need}`,
  },
};

export const BusinessNeedSummary: React.FC<BusinessNeedSummaryProps> = ({
  needProfile,
  onCompleteProfile,
}) => {
  const {
    lang,
    getLocalizedBusinessType,
    getLocalizedState,
    getLocalizedSupportNeed,
    getLocalizedBusinessStage,
  } = useTranslation();

  const l: Language = (lang in COPY.understoodNeedTitle) ? lang : 'en';

  if (!needProfile || !needProfile.currentStage) {
    return null;
  }

  const stageLabel = getLocalizedBusinessStage(needProfile.currentStage);
  const domainLabel = getLocalizedBusinessType(needProfile.businessType);
  const primaryNeedLabel = needProfile.primaryNeed
    ? getLocalizedSupportNeed(needProfile.primaryNeed)
    : undefined;

  // Build the natural conversational synthesis
  const buildSummaryNarrative = () => {
    const stageKey = (needProfile.currentStage in COPY.stages)
      ? (needProfile.currentStage as keyof typeof COPY.stages)
      : 'DEFAULT';
    const stageVerb = COPY.stages[stageKey]?.[l] || COPY.stages.DEFAULT[l];

    const fundingText =
      needProfile.fundingGap > 0
        ? COPY.fundingGap[l](formatLakhCrore(needProfile.fundingGap, l))
        : needProfile.totalProjectCost
        ? COPY.totalCost[l](formatLakhCrore(needProfile.totalProjectCost, l))
        : COPY.fundingDefault[l];

    const needText = primaryNeedLabel
      ? COPY.primaryNeedSuffix[l](primaryNeedLabel)
      : '.';

    return COPY.fullNarrative[l](domainLabel, stageVerb, fundingText, needText);
  };

  const hasMissingFields = (needProfile.missingHighValueFields?.length || 0) > 0;

  // Location display
  const bizState = needProfile.location?.businessState
    ? getLocalizedState(needProfile.location.businessState)
    : undefined;
  const resState = needProfile.location?.residenceState
    ? getLocalizedState(needProfile.location.residenceState)
    : undefined;

  const originLabel = COPY.labels.origin[l];
  const locationText = bizState
    ? needProfile.location?.isInterstate && resState && resState !== bizState
      ? `${bizState} (${originLabel}: ${resState})`
      : bizState
    : undefined;

  // Business Name or Idea
  const businessIdentifier =
    needProfile.businessName || needProfile.businessIdeaText || undefined;

  // Sector and subSector
  const sectorDisplay = needProfile.subSector
    ? `${domainLabel} • ${needProfile.subSector}`
    : domainLabel;

  // Additional / Secondary needs
  const validSecondaryNeeds = (needProfile.secondaryNeeds || []).filter(
    (need) => need !== needProfile.primaryNeed && SUPPORT_NEEDS_TAXONOMY[need]
  );

  return (
    <div
      id="business-need-summary"
      className="p-4 rounded-md border border-[#C1E2D0] dark:border-[#22503E] bg-[#D9E8DF]/30 dark:bg-[#143327]/40 mb-6 transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-full bg-[#14453D] text-white dark:bg-[#4ADE80] dark:text-[#0B251F] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80] block">
              {COPY.understoodNeedTitle[l]}
            </span>
            <p className="text-xs sm:text-sm text-[#1A1C1B] dark:text-[#E0E8E3] font-medium mt-0.5 leading-relaxed">
              {buildSummaryNarrative()}
            </p>
          </div>
        </div>

        {/* Profile Completeness Pill / Action */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-[#101613] text-[#14453D] dark:text-[#4ADE80] border border-[#C1E2D0] dark:border-[#24342D] whitespace-nowrap">
            {COPY.profileCompleteness[l](needProfile.completenessScore)}
          </span>

          {hasMissingFields && onCompleteProfile && (
            <button
              onClick={onCompleteProfile}
              title={needProfile.missingHighValueFields?.map((f) => getLocalizedMissingFieldPrompt(f, l).label).join(', ')}
              className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{COPY.refine[l]}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Structured Profile Parameters (Where Available) */}
      <div className="mt-3 pt-3 border-t border-[#C1E2D0]/60 dark:border-[#22503E]/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Business Name / Idea */}
        {businessIdentifier && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {COPY.labels.business[l]}
            </span>
            <span className="font-medium text-[#111827] dark:text-[#F3F4F6] truncate" title={businessIdentifier}>
              {businessIdentifier}
            </span>
          </div>
        )}

        {/* Stage */}
        {stageLabel && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {COPY.labels.stage[l]}
            </span>
            <span className="font-medium text-[#111827] dark:text-[#F3F4F6] truncate">
              {stageLabel}
            </span>
          </div>
        )}

        {/* Sector */}
        {sectorDisplay && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {COPY.labels.sector[l]}
            </span>
            <span className="font-medium text-[#111827] dark:text-[#F3F4F6] truncate" title={sectorDisplay}>
              {sectorDisplay}
            </span>
          </div>
        )}

        {/* Location */}
        {locationText && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {COPY.labels.location[l]}
            </span>
            <span className="font-medium text-[#111827] dark:text-[#F3F4F6] truncate" title={locationText}>
              {locationText}
            </span>
          </div>
        )}

        {/* Project Cost */}
        {needProfile.totalProjectCost !== undefined && needProfile.totalProjectCost > 0 && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {COPY.labels.projectCost[l]}
            </span>
            <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">
              {formatLakhCrore(needProfile.totalProjectCost, l)}
            </span>
          </div>
        )}

        {/* Funding Gap */}
        {needProfile.fundingGap !== undefined && needProfile.fundingGap > 0 && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {COPY.labels.fundingGap[l]}
            </span>
            <span className="font-semibold text-[#14453D] dark:text-[#4ADE80]">
              {formatLakhCrore(needProfile.fundingGap, l)}
            </span>
          </div>
        )}

        {/* Primary Need */}
        {primaryNeedLabel && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
              {COPY.labels.primaryNeed[l]}
            </span>
            <span className="font-medium text-[#111827] dark:text-[#F3F4F6] truncate">
              {primaryNeedLabel}
            </span>
          </div>
        )}

        {/* Additional Needs */}
        {validSecondaryNeeds.length > 0 && (
          <div className="flex flex-col col-span-2 sm:col-span-4 mt-1">
            <span className="text-[10px] uppercase font-semibold text-[#4B5563] dark:text-[#9CA3AF] mb-1">
              {COPY.labels.additionalNeeds[l]}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {validSecondaryNeeds.map((needKey) => {
                const label = getLocalizedSupportNeed(needKey);
                return (
                  <span
                    key={needKey}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/80 dark:bg-[#101613] text-[#1E3A8A] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#1E3A8A]/50"
                  >
                    <Tag className="w-3 h-3 shrink-0" />
                    {label || needKey}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
