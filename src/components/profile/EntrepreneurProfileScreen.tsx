/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  IndianRupee,
  FileText,
  FolderLock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { UserProfile } from '../../types/user';
import { MatchResult, Scheme } from '../../types';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { ProfileCompletenessCard } from './ProfileCompletenessCard';
import { DemographicsSection } from './DemographicsSection';
import { BusinessSection } from './BusinessSection';
import { FinancialSection } from './FinancialSection';
import { RegistrationSection } from './RegistrationSection';
import { DocumentVaultSection } from './DocumentVaultSection';
import { SchemeImpactSection } from './SchemeImpactSection';
import { ProfileEditModal, ProfileEditTab } from './ProfileEditModal';
import { ProfilePrintView } from './ProfilePrintView';
import { ProfilePhotoModal } from './ProfilePhotoModal';

interface EntrepreneurProfileScreenProps {
  userProfile: UserProfile | null;
  matchResults: MatchResult[];
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onRetakeAssessment: () => void;
  onViewMatches: () => void;
  onViewDashboard: () => void;
  onViewTracker: () => void;
  onSelectScheme: (scheme: Scheme) => void;
  targetSectionId?: string | null;
}

export const EntrepreneurProfileScreen: React.FC<EntrepreneurProfileScreenProps> = ({
  userProfile,
  matchResults,
  onUpdateProfile,
  onRetakeAssessment,
  onViewMatches,
  onViewDashboard,
  onViewTracker,
  onSelectScheme,
  targetSectionId,
}) => {
  const { lang } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editModalInitialTab, setEditModalInitialTab] = useState<ProfileEditTab>('personal');
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Auto-scroll to target profile section if provided
  useEffect(() => {
    if (!targetSectionId || !userProfile) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(targetSectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-2', 'ring-[#16A34A]', 'transition-all');
        const unhighlight = setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#16A34A]');
        }, 2200);
        return () => clearTimeout(unhighlight);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [targetSectionId, userProfile]);

  // If no user profile exists yet
  if (!userProfile) {
    return (
      <main id="profile-empty-screen" className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-[#151C19] border border-[#DEE7E2] dark:border-[#223F30] rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF5F0] dark:bg-[#162B22] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1F2421] dark:text-[#F0F4F2] tracking-tight">
            {strings.pageTitle}
          </h2>
          <p className="text-sm text-[#516A5F] dark:text-[#9EB0A7] max-w-lg mx-auto mt-2 leading-relaxed">
            {strings.noProfilePrompt}
          </p>
          <div className="mt-6">
            <button
              type="button"
              id="profile-start-assessment-btn"
              onClick={onRetakeAssessment}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#16A34A] dark:hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>{strings.startAssessmentBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleOpenEdit = (tab: ProfileEditTab = 'personal') => {
    setEditModalInitialTab(tab);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (updated: UserProfile) => {
    onUpdateProfile(updated);
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 4000);
  };

  const handleCompleteField = (fieldKey: string) => {
    if (['totalProjectCost', 'existingInvestment', 'primarySupportNeed', 'existingTurnover'].includes(fieldKey)) {
      handleOpenEdit('financial');
    } else if (['businessName', 'businessIdea', 'subSector', 'businessStageKey', 'businessEntityType', 'entrepreneurExperienceYears'].includes(fieldKey)) {
      handleOpenEdit('business');
    } else if (['registrationStatus', 'hasUdyam', 'hasGst', 'hasTradeLicense'].includes(fieldKey)) {
      handleOpenEdit('registration');
    } else {
      handleOpenEdit('personal');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main id="entrepreneur-profile-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Save Success Toast */}
      {showSaveToast && (
        <div
          id="profile-save-toast"
          className="fixed bottom-6 right-6 z-50 bg-[#14453D] text-white px-5 py-3 rounded-xl shadow-xl border border-[#4ADE80]/30 flex items-center gap-2 text-xs sm:text-sm font-bold transition-all"
        >
          <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0" />
          <span>{strings.saveSuccess}</span>
        </div>
      )}

      {/* Persistent Source of Truth Notice Banner */}
      <div
        id="profile-truth-banner"
        className="bg-[#EAF5F0] dark:bg-[#12241C] border border-[#CDE3D7] dark:border-[#1E3E2E] rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#14453D] dark:text-[#4ADE80]"
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#16A34A] dark:text-[#4ADE80]" />
          <span className="font-medium">
            <strong>Persistent Source of Truth: </strong>
            {strings.sourceOfTruthNotice}
          </span>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <ProfileHeaderCard
        profile={userProfile}
        onEdit={() => handleOpenEdit('personal')}
        onPrint={() => setIsPrintViewOpen(true)}
        onRetake={onRetakeAssessment}
        onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
      />

      {/* Profile Completeness Card */}
      <ProfileCompletenessCard
        profile={userProfile}
        onCompleteField={handleCompleteField}
      />

      {/* Sub-navigation Quick Scroll Links */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-[#0E1311]/90 backdrop-blur-md py-2 border-y border-[#E8EFEA] dark:border-[#223F30] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-xs font-bold text-[#516A5F] dark:text-[#9EB0A7]">
          <button
            type="button"
            onClick={() => scrollToSection('profile-demographics-section')}
            className="px-3 py-1.5 rounded-lg hover:bg-[#EAF5F0] dark:hover:bg-[#162B22] hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors shrink-0 cursor-pointer"
          >
            Personal & Demographics
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('profile-business-section')}
            className="px-3 py-1.5 rounded-lg hover:bg-[#EAF5F0] dark:hover:bg-[#162B22] hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors shrink-0 cursor-pointer"
          >
            Business & Enterprise
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('profile-financial-section')}
            className="px-3 py-1.5 rounded-lg hover:bg-[#EAF5F0] dark:hover:bg-[#162B22] hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors shrink-0 cursor-pointer"
          >
            Financial & Capital
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('profile-registration-section')}
            className="px-3 py-1.5 rounded-lg hover:bg-[#EAF5F0] dark:hover:bg-[#162B22] hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors shrink-0 cursor-pointer"
          >
            Registrations & MSME
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('profile-document-vault-section')}
            className="px-3 py-1.5 rounded-lg hover:bg-[#EAF5F0] dark:hover:bg-[#162B22] hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors shrink-0 cursor-pointer"
          >
            Document Vault
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('profile-scheme-impact-section')}
            className="px-3 py-1.5 rounded-lg hover:bg-[#EAF5F0] dark:hover:bg-[#162B22] hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors shrink-0 cursor-pointer"
          >
            Scheme Impact
          </button>
        </div>
      </div>

      {/* Sub-sections */}
      <div className="space-y-6">
        <DemographicsSection
          profile={userProfile}
          onEditSection={() => handleOpenEdit('personal')}
        />

        <BusinessSection
          profile={userProfile}
          onEditSection={() => handleOpenEdit('business')}
        />

        <FinancialSection
          profile={userProfile}
          onEditSection={() => handleOpenEdit('financial')}
        />

        <RegistrationSection
          profile={userProfile}
          onEditSection={() => handleOpenEdit('registration')}
        />

        <DocumentVaultSection
          profile={userProfile}
        />

        <SchemeImpactSection
          matchResults={matchResults}
          onViewMatches={onViewMatches}
          onViewDashboard={onViewDashboard}
          onViewTracker={onViewTracker}
          onSelectScheme={onSelectScheme}
        />
      </div>

      {/* Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        initialTab={editModalInitialTab}
        profile={userProfile}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* Print / PDF Summary Record View */}
      {isPrintViewOpen && (
        <ProfilePrintView
          profile={userProfile}
          matchResults={matchResults}
          onClose={() => setIsPrintViewOpen(false)}
        />
      )}

      {/* Photo Upload & Avatar Modal */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        currentPhotoUrl={userProfile.photoUrl}
        displayName={userProfile.applicantName}
        onClose={() => setIsPhotoModalOpen(false)}
        onSavePhoto={(newPhotoUrl) => {
          handleSaveProfile({
            ...userProfile,
            photoUrl: newPhotoUrl,
          });
        }}
      />
    </main>
  );
};
