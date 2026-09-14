import React from 'react';
import {
  Briefcase,
  MapPin,
  TrendingUp,
  FileCheck2,
  Building2,
  Coins,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Clock,
  Hammer,
} from 'lucide-react';
import { BusinessProfile, BusinessNeedProfile, SUPPORT_NEEDS_TAXONOMY, BUSINESS_ENTITY_LABELS, BUSINESS_STAGE_TAXONOMY } from '../../types/business';
import { formatLakhCrore } from '../../lib/business/fundingCalculator';
import { useTranslation } from '../../i18n';

interface BusinessProfileCardProps {
  needProfile?: BusinessNeedProfile | null;
  businessProfile?: BusinessProfile;
  onEditProfile?: () => void;
  compact?: boolean;
}

export const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
  needProfile,
  businessProfile,
  onEditProfile,
  compact = false,
}) => {
  const { lang, t, getLocalizedBusinessType, getLocalizedState } = useTranslation();
  const isHi = lang === 'hi';

  if (!needProfile || !needProfile.currentStage) {
    return null;
  }

  const stageInfo = BUSINESS_STAGE_TAXONOMY[needProfile.currentStage];
  const stageLabel = isHi ? stageInfo?.labelHi : stageInfo?.labelEn;

  const entityInfo = BUSINESS_ENTITY_LABELS[needProfile.businessEntityType];
  const entityLabel = isHi ? entityInfo?.hi : entityInfo?.en;

  const primaryNeedInfo = needProfile.primaryNeed
    ? SUPPORT_NEEDS_TAXONOMY[needProfile.primaryNeed]
    : undefined;

  const primaryNeedLabel = primaryNeedInfo
    ? isHi
      ? primaryNeedInfo.labelHi
      : primaryNeedInfo.labelEn
    : undefined;

  const businessLocationText = needProfile.location?.businessState
    ? getLocalizedState(needProfile.location.businessState)
    : undefined;

  const residenceLocationText = needProfile.location?.residenceState
    ? getLocalizedState(needProfile.location.residenceState)
    : undefined;

  return (
    <div
      id="business-profile-card"
      className="bg-white dark:bg-[#151C19] border border-[#CDE3D7] dark:border-[#223F30] rounded-md shadow-2xs overflow-hidden transition-all duration-200"
    >
      {/* Header bar with stage badge & edit button */}
      <div className="bg-[#F4F8F6] dark:bg-[#1A2620] px-4 py-3 border-b border-[#CDE3D7] dark:border-[#223F30] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#14453D] dark:text-[#34D399]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#34D399]">
            {isHi ? 'उद्यम व्यवसाय प्रोफ़ाइल' : 'Entrepreneur Business Profile'}
          </span>
          {needProfile.stageSource === 'INFERRED' && (
            <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] bg-white dark:bg-[#101613] px-1.5 py-0.5 rounded border border-[#E2E2E0] dark:border-[#24342D]">
              {isHi ? 'अनुमानित' : 'Inferred'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-[#D4EFE1] dark:bg-[#16382B] text-[#14453D] dark:text-[#4ADE80] border border-[#B2CDBF] dark:border-[#285743]">
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
                  : `${getLocalizedBusinessType(needProfile.businessType)} ${
                      isHi ? 'उद्यम' : 'Enterprise'
                    }`)}
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
          <div className="bg-[#FAFAF9] dark:bg-[#101613] p-2.5 rounded border border-[#E2E2E0] dark:border-[#24342D]">
            <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block mb-0.5">
              {isHi ? 'उद्योग क्षेत्र' : 'Industry Domain'}
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

          <div className="bg-[#FAFAF9] dark:bg-[#101613] p-2.5 rounded border border-[#E2E2E0] dark:border-[#24342D]">
            <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block mb-0.5">
              {isHi ? 'विधिक संरचना' : 'Entity Structure'}
            </span>
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold block truncate">
              {entityLabel}
            </strong>
          </div>

          <div className="bg-[#FAFAF9] dark:bg-[#101613] p-2.5 rounded border border-[#E2E2E0] dark:border-[#24342D]">
            <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block mb-0.5">
              {isHi ? 'पंजीकरण स्थिति' : 'Registration'}
            </span>
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold block truncate">
              {needProfile.registrationStatus === 'REGISTERED'
                ? isHi ? 'पंजीकृत (MSME/Udyam)' : 'Registered'
                : needProfile.registrationStatus === 'IN_PROCESS'
                ? isHi ? 'प्रक्रियाधीन' : 'In Process'
                : needProfile.registrationStatus === 'NOT_REGISTERED'
                ? isHi ? 'गैर-पंजीकृत' : 'Not Registered'
                : isHi ? 'अनिर्दिष्ट (Unknown)' : 'Unspecified'}
            </strong>
          </div>

          <div className="bg-[#FAFAF9] dark:bg-[#101613] p-2.5 rounded border border-[#E2E2E0] dark:border-[#24342D]">
            <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block mb-0.5">
              {isHi ? 'कार्यस्थल स्थान' : 'Business Location'}
            </span>
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold block truncate">
              {businessLocationText || residenceLocationText || (isHi ? 'राष्ट्रीय' : 'National')}
            </strong>
            {needProfile.location?.isInterstate && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400 block truncate">
                {isHi ? 'अंतरराज्यीय उद्यम' : 'Interstate Unit'}
              </span>
            )}
          </div>
        </div>

        {/* Financial Requirements & Funding Gap Analysis */}
        <div className="p-3 bg-[#F4F8F6] dark:bg-[#16231C] border border-[#CDE3D7] dark:border-[#223F30] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block">
                {isHi ? 'कुल परियोजना लागत' : 'Total Project Cost'}
              </span>
              <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                {needProfile.totalProjectCost
                  ? formatLakhCrore(needProfile.totalProjectCost, lang)
                  : isHi ? 'अनिर्दिष्ट' : 'Not Specified'}
              </strong>
            </div>

            {needProfile.existingInvestment !== undefined && needProfile.existingInvestment > 0 && (
              <div className="border-l border-[#CDE3D7] dark:border-[#223F30] pl-4">
                <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] block">
                  {isHi ? 'मौजूदा निवेश (स्व-पूंजी)' : 'Own Investment'}
                </span>
                <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                  {formatLakhCrore(needProfile.existingInvestment, lang)}
                </strong>
              </div>
            )}

            <div className="border-l border-[#CDE3D7] dark:border-[#223F30] pl-4">
              <span className="text-[11px] text-[#14453D] dark:text-[#34D399] font-semibold block">
                {isHi ? 'वित्तीय आवश्यकता (Funding Gap)' : 'Estimated Funding Gap'}
              </span>
              <strong className="text-[#14453D] dark:text-[#4ADE80] font-extrabold text-base">
                {needProfile.fundingGap > 0
                  ? formatLakhCrore(needProfile.fundingGap, lang)
                  : isHi ? '₹0 (पूर्णतः स्व-वित्तपोषित)' : '₹0 (Self-funded)'}
              </strong>
            </div>
          </div>

          {/* Primary Need Pill */}
          {primaryNeedLabel && (
            <div className="shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white dark:bg-[#101613] text-[#14453D] dark:text-[#4ADE80] font-bold text-xs border border-[#CDE3D7] dark:border-[#223F30] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                <span>{isHi ? `प्राथमिक आवश्यकता: ${primaryNeedLabel}` : `Primary: ${primaryNeedLabel}`}</span>
              </span>
            </div>
          )}
        </div>

        {/* Secondary Needs tags if provided */}
        {needProfile.secondaryNeeds && needProfile.secondaryNeeds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97]">
              {isHi ? 'अन्य आवश्यकताएं:' : 'Additional Needs:'}
            </span>
            {needProfile.secondaryNeeds.map((needKey) => {
              const info = SUPPORT_NEEDS_TAXONOMY[needKey];
              return (
                <span
                  key={needKey}
                  className="bg-[#FAFAF9] dark:bg-[#101613] text-[#3F4943] dark:text-[#C1C9C4] px-2 py-0.5 rounded text-[11px] border border-[#E2E2E0] dark:border-[#24342D]"
                >
                  {info ? (isHi ? info.labelHi : info.labelEn) : needKey}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
