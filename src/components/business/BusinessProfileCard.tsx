import React from 'react';
import {
  Briefcase,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile, BusinessNeedProfile } from '../../types/business';
import { formatLakhCrore } from '../../lib/business/fundingCalculator';
import { useTranslation } from '../../i18n';
import { Language } from '../../i18n/types';

interface BusinessProfileCardProps {
  needProfile?: BusinessNeedProfile | null;
  businessProfile?: BusinessProfile;
  onEditProfile?: () => void;
  compact?: boolean;
}

const UI_COPY: Record<string, Record<Language, string>> = {
  profileTitle: {
    en: 'Entrepreneur Business Profile',
    hi: 'उद्यम व्यवसाय प्रोफ़ाइल',
    ta: 'தொழில்முனைவோர் வணிக சுயவிவரம்',
    te: 'వ్యవస్థాపక వ్యాపార ప్రొఫైల్',
    kn: 'ಉದ್ಯಮಿ ವ್ಯಾಪಾರ ಪ್ರೊಫೈಲ್',
    ml: 'സംരംഭക ബിസിനസ്സ് പ്രൊഫൈൽ',
    mr: 'उद्योजक व्यवसाय प्रोफाइल',
  },
  inferred: {
    en: 'Inferred',
    hi: 'अनुमानित',
    ta: 'ஊகிக்கப்பட்டது',
    te: 'అంచనా వేయబడింది',
    kn: 'ಅನುಮಾನಿಸಲಾಗಿದೆ',
    ml: 'ഊഹിച്ചത്',
    mr: 'अंदाजित',
  },
  industryDomain: {
    en: 'Industry Domain',
    hi: 'उद्योग क्षेत्र',
    ta: 'தொழில் துறை',
    te: 'పరిశ్రమ రంగం',
    kn: 'ಉದ್ಯಮ ಕ್ಷೇತ್ರ',
    ml: 'വ്യവസായ മേഖല',
    mr: 'उद्योग क्षेत्र',
  },
  entityStructure: {
    en: 'Entity Structure',
    hi: 'विधिक संरचना',
    ta: 'சட்ட அமைப்பு',
    te: 'చట్టపరమైన నిర్మాణం',
    kn: 'ಕಾನೂನು ರಚನೆ',
    ml: 'നിയമപരമായ ഘടന',
    mr: 'विधिक रचना',
  },
  registration: {
    en: 'Registration',
    hi: 'पंजीकरण स्थिति',
    ta: 'பதிவு நிலை',
    te: 'నమోదు స్థితి',
    kn: 'ನೋಂದಣಿ ಸ್ಥಿತಿ',
    ml: 'രജിസ്ട്രേഷൻ നില',
    mr: 'नोंदणी स्थिती',
  },
  businessLocation: {
    en: 'Business Location',
    hi: 'कार्यस्थल स्थान',
    ta: 'வணிக இடம்',
    te: 'వ్యాపార ప్రాంతం',
    kn: 'ವ್ಯವಹಾರದ ಸ್ಥಳ',
    ml: 'ബിസിനസ്സ് സ്ഥലം',
    mr: 'व्यवसायाचे ठिकाण',
  },
  interstateUnit: {
    en: 'Interstate Unit',
    hi: 'अंतरराज्यीय उद्यम',
    ta: 'மாநிலங்களுக்கு இடையேயான பிரிவு',
    te: 'అంతర్రాష్ట్ర విభాగం',
    kn: 'ಅಂತಾರಾಜ್ಯ ಘಟಕ',
    ml: 'അന്തർസംസ്ഥാന യൂണിറ്റ്',
    mr: 'आंतरराज्यीय उपक्रम',
  },
  totalProjectCost: {
    en: 'Total Project Cost',
    hi: 'कुल परियोजना लागत',
    ta: 'மொத்த திட்டச் செலவு',
    te: 'మొత్తం ప్రాజెక్ట్ ఖర్చు',
    kn: 'ಒಟ್ಟು ಯೋಜನಾ ವೆಚ್ಚ',
    ml: 'ആകെ പ്രോജക്ട് ചെലവ്',
    mr: 'एकूण प्रकल्प खर्च',
  },
  ownInvestment: {
    en: 'Own Investment',
    hi: 'मौजूदा निवेश (स्व-पूंजी)',
    ta: 'சொந்த முதலீடு',
    te: 'స్వంత పెట్టుబడి',
    kn: 'ಸ್ವಂತ ಹೂಡಿಕೆ',
    ml: 'സ്വന്തം നിക്ഷേപം',
    mr: 'स्वतःची गुंतवणूक (स्व-भांडवल)',
  },
  fundingGap: {
    en: 'Estimated Funding Gap',
    hi: 'वित्तीय आवश्यकता',
    ta: 'மதிப்பிடப்பட்ட நிதி இடைவெளி',
    te: 'అంచనా వేసిన నిధుల అంతరం',
    kn: 'ಅಂದಾಜು ಹಣಕಾಸಿನ ಅಂತರ',
    ml: 'കണക്കാക്കിയ ഫണ്ടിംഗ് വിടവ്',
    mr: 'अंदाजित निधी गरज',
  },
  selfFunded: {
    en: '₹0 (Self-funded)',
    hi: '₹0 (पूर्णतः स्व-वित्तपोषित)',
    ta: '₹0 (சுய நிதியளிப்பு)',
    te: '₹0 (స్వీయ-నిధులు)',
    kn: '₹0 (ಸ್ವಯಂ-ಹಣಕಾಸು)',
    ml: '₹0 (സ്വയം ഫണ്ട് ചെയ്തത്)',
    mr: '₹0 (पूर्णतः स्व-वित्तपुरवठा)',
  },
  primaryNeed: {
    en: 'Primary Need',
    hi: 'प्राथमिक आवश्यकता',
    ta: 'முதன்மை தேவை',
    te: 'ప్రాథమిక అవసరం',
    kn: 'ಪ್ರಾಥಮಿಕ ಅಗತ್ಯ',
    ml: 'പ്രാഥമിക ആവശ്യം',
    mr: 'प्राथमिक गरज',
  },
  notSpecified: {
    en: 'Not Specified',
    hi: 'अनिर्दिष्ट',
    ta: 'குறிப்பிடப்படவில்லை',
    te: 'పేర్కొనబడలేదు',
    kn: 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ',
    ml: 'വ്യക്തമാക്കിയിട്ടില്ല',
    mr: 'अनिर्दिष्ट',
  },
  national: {
    en: 'National',
    hi: 'राष्ट्रीय',
    ta: 'தேசிய',
    te: 'జాతీయ',
    kn: 'ರಾಷ್ಟ್ರೀಯ',
    ml: 'ദേശീയ',
    mr: 'राष्ट्रीय',
  },
  additionalNeeds: {
    en: 'Additional Needs:',
    hi: 'अन्य आवश्यकताएं:',
    ta: 'கூடுதல் தேவைகள்:',
    te: 'అదనపు అవసరాలు:',
    kn: 'ಹೆಚ್ಚುವರಿ ಅಗತ್ಯಗಳು:',
    ml: 'കൂടുതൽ ആവശ്യങ്ങൾ:',
    mr: 'अतिरिक्त गरजा:',
  },
  enterprise: {
    en: 'Enterprise',
    hi: 'उद्यम',
    ta: 'தொழில் நிறுவனம்',
    te: 'ఎంటర్‌ప్రైజ్',
    kn: 'ಉದ್ಯಮ',
    ml: 'സംരംഭം',
    mr: 'उपक्रम',
  },
};

export const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
  needProfile,
  businessProfile,
  onEditProfile,
  compact = false,
}) => {
  const {
    lang,
    t,
    getLocalizedBusinessType,
    getLocalizedState,
    getLocalizedBusinessStage,
    getLocalizedEntity,
    getLocalizedSupportNeed,
    getLocalizedRegistrationStatus,
  } = useTranslation();

  if (!needProfile || !needProfile.currentStage) {
    return null;
  }

  const cp = (key: string) => UI_COPY[key]?.[lang] || UI_COPY[key]?.en || '';

  const stageLabel = getLocalizedBusinessStage(needProfile.currentStage);
  const entityLabel = getLocalizedEntity(needProfile.businessEntityType);
  const primaryNeedLabel = needProfile.primaryNeed
    ? getLocalizedSupportNeed(needProfile.primaryNeed)
    : undefined;

  const registrationLabel = getLocalizedRegistrationStatus(needProfile.registrationStatus);

  const businessLocationText = needProfile.location?.businessState
    ? getLocalizedState(needProfile.location.businessState)
    : undefined;

  const residenceLocationText = needProfile.location?.residenceState
    ? getLocalizedState(needProfile.location.residenceState)
    : undefined;

  return (
    <div
      id="business-profile-card"
      className="bg-white dark:bg-[#141b17] border border-[#D9E8DF] dark:border-[#223F30] rounded-md shadow-2xs overflow-hidden transition-all duration-200"
    >
      {/* Header bar with stage badge & edit button */}
      <div className="bg-[#F4F8F6] dark:bg-[#1d2822] px-4 py-3 border-b border-[#D9E8DF] dark:border-[#223F30] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80]">
            {cp('profileTitle')}
          </span>
          {needProfile.stageSource === 'INFERRED' && (
            <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] bg-white dark:bg-[#141b17] px-1.5 py-0.5 rounded border border-[#E4E8E4] dark:border-[#24342D]">
              {cp('inferred')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-[#D9E8DF] dark:bg-[#16382B] text-[#14453D] dark:text-[#4ADE80] border border-[#B2CDBF] dark:border-[#285743]">
            <TrendingUp className="w-3 h-3" />
            <span>{stageLabel}</span>
          </span>

          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline cursor-pointer"
            >
              {t('common.edit')}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Business Title / Idea Overview */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-2">
            <span>
              {needProfile.businessName ||
                (needProfile.businessIdeaText
                  ? `"${needProfile.businessIdeaText}"`
                  : `${getLocalizedBusinessType(needProfile.businessType)} ${cp('enterprise')}`)}
            </span>
          </h3>
          {needProfile.businessIdeaText && needProfile.businessName && (
            <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5 italic">
              "{needProfile.businessIdeaText}"
            </p>
          )}
        </div>

        {/* 4-Item Grid of Core Business Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
          <div className="bg-[#FAFAF9] dark:bg-[#141b17] p-2.5 rounded border border-[#E4E8E4] dark:border-[#24342D]">
            <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block mb-0.5">
              {cp('industryDomain')}
            </span>
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold block truncate">
              {getLocalizedBusinessType(needProfile.businessType)}
            </strong>
            {needProfile.subSector && (
              <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block truncate">
                {needProfile.subSector}
              </span>
            )}
          </div>

          <div className="bg-[#FAFAF9] dark:bg-[#141b17] p-2.5 rounded border border-[#E4E8E4] dark:border-[#24342D]">
            <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block mb-0.5">
              {cp('entityStructure')}
            </span>
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold block truncate">
              {entityLabel}
            </strong>
          </div>

          <div className="bg-[#FAFAF9] dark:bg-[#141b17] p-2.5 rounded border border-[#E4E8E4] dark:border-[#24342D]">
            <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block mb-0.5">
              {cp('registration')}
            </span>
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold block truncate">
              {registrationLabel}
            </strong>
          </div>

          <div className="bg-[#FAFAF9] dark:bg-[#141b17] p-2.5 rounded border border-[#E4E8E4] dark:border-[#24342D]">
            <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block mb-0.5">
              {cp('businessLocation')}
            </span>
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold block truncate">
              {businessLocationText || residenceLocationText || cp('national')}
            </strong>
            {needProfile.location?.isInterstate && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400 block truncate">
                {cp('interstateUnit')}
              </span>
            )}
          </div>
        </div>

        {/* Financial Requirements & Funding Gap Analysis */}
        <div className="p-3 bg-[#F4F8F6] dark:bg-[#1d2822] border border-[#D9E8DF] dark:border-[#223F30] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block">
                {cp('totalProjectCost')}
              </span>
              <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                {needProfile.totalProjectCost
                  ? formatLakhCrore(needProfile.totalProjectCost, lang)
                  : cp('notSpecified')}
              </strong>
            </div>

            {needProfile.existingInvestment !== undefined && needProfile.existingInvestment > 0 && (
              <div className="border-l border-[#D9E8DF] dark:border-[#223F30] pl-4">
                <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block">
                  {cp('ownInvestment')}
                </span>
                <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                  {formatLakhCrore(needProfile.existingInvestment, lang)}
                </strong>
              </div>
            )}

            <div className="border-l border-[#D9E8DF] dark:border-[#223F30] pl-4">
              <span className="text-[11px] text-[#14453D] dark:text-[#4ADE80] font-semibold block">
                {cp('fundingGap')}
              </span>
              <strong className="text-[#14453D] dark:text-[#4ADE80] font-extrabold text-base">
                {needProfile.fundingGap > 0
                  ? formatLakhCrore(needProfile.fundingGap, lang)
                  : cp('selfFunded')}
              </strong>
            </div>
          </div>

          {/* Primary Need Pill */}
          {primaryNeedLabel && (
            <div className="shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white dark:bg-[#141b17] text-[#14453D] dark:text-[#4ADE80] font-bold text-xs border border-[#D9E8DF] dark:border-[#223F30] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" />
                <span>{`${cp('primaryNeed')}: ${primaryNeedLabel}`}</span>
              </span>
            </div>
          )}
        </div>

        {/* Secondary Needs tags if provided */}
        {needProfile.secondaryNeeds && needProfile.secondaryNeeds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
              {cp('additionalNeeds')}
            </span>
            {needProfile.secondaryNeeds.map((needKey) => {
              const label = getLocalizedSupportNeed(needKey);
              return (
                <span
                  key={needKey}
                  className="bg-[#FAFAF9] dark:bg-[#141b17] text-[#3F4943] dark:text-[#C1C9C4] px-2 py-0.5 rounded text-[11px] border border-[#E4E8E4] dark:border-[#24342D]"
                >
                  {label || needKey}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
