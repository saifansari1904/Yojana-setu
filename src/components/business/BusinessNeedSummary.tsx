import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { BusinessNeedProfile, SUPPORT_NEEDS_TAXONOMY, BUSINESS_STAGE_TAXONOMY } from '../../types/business';
import { formatLakhCrore } from '../../lib/business/fundingCalculator';
import { useTranslation } from '../../i18n';

interface BusinessNeedSummaryProps {
  needProfile: BusinessNeedProfile;
  onCompleteProfile?: () => void;
}

export const BusinessNeedSummary: React.FC<BusinessNeedSummaryProps> = ({
  needProfile,
  onCompleteProfile,
}) => {
  const { lang, getLocalizedBusinessType } = useTranslation();
  const isHi = lang === 'hi';

  const stageInfo = BUSINESS_STAGE_TAXONOMY[needProfile.currentStage];
  const stageLabel = isHi ? stageInfo?.labelHi : stageInfo?.labelEn;

  const domainLabel = getLocalizedBusinessType(needProfile.businessType);

  const primaryNeedInfo = needProfile.primaryNeed
    ? SUPPORT_NEEDS_TAXONOMY[needProfile.primaryNeed]
    : undefined;
  const primaryNeedLabel = primaryNeedInfo
    ? isHi
      ? primaryNeedInfo.labelHi
      : primaryNeedInfo.labelEn
    : undefined;

  // Build the natural conversational synthesis
  const buildSummaryNarrative = () => {
    if (isHi) {
      const stageText =
        needProfile.currentStage === 'IDEA'
          ? 'नया विचार विकसित कर रहे हैं'
          : needProfile.currentStage === 'PRE_LAUNCH'
          ? 'नया उद्यम शुरू करने की तैयारी में हैं'
          : needProfile.currentStage === 'NEW_BUSINESS'
          ? 'हाल ही में शुरू किया गया नया उद्यम संचालित कर रहे हैं'
          : needProfile.currentStage === 'EARLY_OPERATION'
          ? 'सक्रिय व्यवसाय का संचालन कर रहे हैं'
          : needProfile.currentStage === 'EXPANSION'
          ? 'व्यवसाय का बृहद विस्तार कर रहे हैं'
          : 'व्यवसाय वृद्धि हेतु प्रयासरत हैं';

      const fundingText =
        needProfile.fundingGap > 0
          ? `जिसमें लगभग ${formatLakhCrore(needProfile.fundingGap, 'hi')} की वित्तीय सहायता आवश्यक है`
          : needProfile.totalProjectCost
          ? `जिसकी कुल परियोजना लागत लगभग ${formatLakhCrore(needProfile.totalProjectCost, 'hi')} है`
          : 'जिसमें वित्तीय आवश्यकताओं का निर्धारण प्रक्रियाधीन है';

      const needText = primaryNeedLabel
        ? `, तथा आपकी मुख्य प्राथमिकता "${primaryNeedLabel}" है।`
        : '।';

      return `आप ${domainLabel} क्षेत्र में ${stageText}, ${fundingText}${needText}`;
    }

    const stageVerb =
      needProfile.currentStage === 'IDEA'
        ? 'planning a new venture'
        : needProfile.currentStage === 'PRE_LAUNCH'
        ? 'setting up a new enterprise'
        : needProfile.currentStage === 'NEW_BUSINESS'
        ? 'operating a recently launched enterprise'
        : needProfile.currentStage === 'EARLY_OPERATION'
        ? 'operating an active business'
        : needProfile.currentStage === 'EXPANSION'
        ? 'expanding an existing facility'
        : 'scaling your enterprise';

    const fundingText =
      needProfile.fundingGap > 0
        ? `requiring approximately ${formatLakhCrore(needProfile.fundingGap, 'en')} in additional funding`
        : needProfile.totalProjectCost
        ? `with an estimated project cost of ${formatLakhCrore(needProfile.totalProjectCost, 'en')}`
        : 'seeking tailored government credit support';

    const needText = primaryNeedLabel
      ? `, prioritizing ${primaryNeedLabel.toLowerCase()} support.`
      : '.';

    return `You are ${stageVerb} in the ${domainLabel.toLowerCase()} domain, ${fundingText}${needText}`;
  };

  const hasMissingFields = needProfile.missingHighValueFields.length > 0;

  return (
    <div
      id="business-need-summary"
      className="p-4 rounded-md border border-[#C1E2D0] dark:border-[#22503E] bg-[#D4EFE1]/30 dark:bg-[#143327]/40 mb-6 transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-full bg-[#14453D] text-white dark:bg-[#34D399] dark:text-[#0B251F] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80] block">
              {isHi ? 'आपकी व्यावसायिक आवश्यकता की समझ' : 'Understood Business Need'}
            </span>
            <p className="text-xs sm:text-sm text-[#1A1C1B] dark:text-[#E0E8E3] font-medium mt-0.5 leading-relaxed">
              {buildSummaryNarrative()}
            </p>
          </div>
        </div>

        {/* Profile Completeness Pill / Action */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-[#101613] text-[#14453D] dark:text-[#4ADE80] border border-[#C1E2D0] dark:border-[#24342D] whitespace-nowrap">
            {isHi
              ? `प्रोफ़ाइल पूर्णता: ${needProfile.completenessScore}%`
              : `Profile Completeness: ${needProfile.completenessScore}%`}
          </span>

          {hasMissingFields && onCompleteProfile && (
            <button
              onClick={onCompleteProfile}
              className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{isHi ? 'विवरण जोड़ें' : 'Refine'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
