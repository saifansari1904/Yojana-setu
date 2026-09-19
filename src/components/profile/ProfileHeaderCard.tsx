/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  User,
  Building2,
  MapPin,
  ShieldCheck,
  Edit3,
  Printer,
  RotateCcw,
  Award,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { UserProfile } from '../../types/user';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { CitizenAvatarInsignia } from '../common/CitizenAvatarInsignia';

interface ProfileHeaderCardProps {
  profile: UserProfile;
  onEdit: () => void;
  onPrint: () => void;
  onRetake: () => void;
  onOpenPhotoModal?: () => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  onEdit,
  onPrint,
  onRetake,
  onOpenPhotoModal,
}) => {
  const { lang, getLocalizedCategory, getLocalizedBusinessType, getLocalizedState } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const displayName = profile.applicantName?.trim() || '';

  const categoryLabel = getLocalizedCategory(profile.category);
  const businessTypeLabel = getLocalizedBusinessType(profile.businessType);
  const stateLabel = getLocalizedState(profile.state);

  return (
    <div
      id="profile-header-card"
      className="bg-white dark:bg-[#151C19] border border-[#DEE7E2] dark:border-[#223F30] rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden transition-all"
    >
      {/* Decorative subtle ambient backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#D4EFE1]/40 to-transparent dark:from-[#1A382D]/30 pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Avatar & Identity details */}
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <CitizenAvatarInsignia
              size="lg"
              displayName={displayName}
              photoUrl={profile.photoUrl}
              isVerified={true}
              editable={Boolean(onOpenPhotoModal)}
              onClick={onOpenPhotoModal}
              ariaLabel={strings.editPhotoAria}
            />
            {onOpenPhotoModal && (
              <button
                type="button"
                onClick={onOpenPhotoModal}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14453D] dark:text-[#5EEAD4] hover:text-[#0F352E] dark:hover:text-[#4ADE80] transition-colors py-0.5 px-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#1E2D25]"
                title={strings.editPhotoAria}
              >
                <Camera className="w-3 h-3" />
                <span>{profile.photoUrl ? strings.changePhotoPrompt : strings.choosePhotoBtn}</span>
              </button>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#EAF5F0] dark:bg-[#162B22] text-[#14453D] dark:text-[#4ADE80] border border-[#CDE3D7] dark:border-[#1E3E2E]">
                {strings.pageBadge}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] dark:text-[#4ADE80]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {strings.gazetteVerified}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2421] dark:text-[#F0F4F2] tracking-tight truncate">
              {displayName || 'Citizen Entrepreneur'}
            </h1>

            {profile.businessName && (
              <p className="text-sm font-semibold text-[#14453D] dark:text-[#4ADE80] flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{profile.businessName}</span>
              </p>
            )}

            {/* Micro tags row */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-[#516A5F] dark:text-[#9EB0A7]">
              <span className="inline-flex items-center gap-1 bg-[#F4F7F5] dark:bg-[#18231E] px-2.5 py-1 rounded-md border border-[#E0E9E4] dark:border-[#223F30] font-medium text-[#1F2421] dark:text-[#E0E9E4]">
                <User className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                {categoryLabel}
              </span>

              <span className="inline-flex items-center gap-1 bg-[#F4F7F5] dark:bg-[#18231E] px-2.5 py-1 rounded-md border border-[#E0E9E4] dark:border-[#223F30] font-medium text-[#1F2421] dark:text-[#E0E9E4]">
                <Building2 className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                {businessTypeLabel}
              </span>

              <span className="inline-flex items-center gap-1 bg-[#F4F7F5] dark:bg-[#18231E] px-2.5 py-1 rounded-md border border-[#E0E9E4] dark:border-[#223F30] font-medium text-[#1F2421] dark:text-[#E0E9E4]">
                <MapPin className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                {profile.district ? `${profile.district}, ${stateLabel}` : stateLabel}
              </span>

              {profile.ruralUrban && (
                <span className="inline-flex items-center gap-1 bg-[#EAF5F0] dark:bg-[#162B22] px-2.5 py-1 rounded-md border border-[#CDE3D7] dark:border-[#1E3E2E] font-semibold text-[#14453D] dark:text-[#4ADE80]">
                  <Award className="w-3.5 h-3.5" />
                  {profile.ruralUrban === 'rural' ? strings.rural : strings.urban}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Primary Action buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            id="profile-edit-btn"
            onClick={onEdit}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#16A34A] dark:hover:bg-[#15803D] text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{strings.editProfileBtn}</span>
          </button>

          <button
            type="button"
            id="profile-print-btn"
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1C2621] hover:bg-[#F4F7F5] dark:hover:bg-[#22332A] text-[#1F2421] dark:text-[#E0E9E4] border border-[#CDE3D7] dark:border-[#223F30] font-semibold text-sm transition-all cursor-pointer"
            title={strings.printSummaryBtn}
          >
            <Printer className="w-4 h-4 text-[#516A5F] dark:text-[#9EB0A7]" />
            <span className="hidden lg:inline">{strings.printSummaryBtn}</span>
          </button>

          <button
            type="button"
            id="profile-retake-btn"
            onClick={onRetake}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1C2621] hover:bg-[#F4F7F5] dark:hover:bg-[#22332A] text-[#516A5F] dark:text-[#9EB0A7] border border-[#DEE7E2] dark:border-[#223F30] font-semibold text-sm transition-all cursor-pointer"
            title={strings.retakeAssessmentBtn}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden xl:inline">{strings.retakeAssessmentBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
