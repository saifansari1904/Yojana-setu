/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronDown,
  User,
  Building2,
  IndianRupee,
  FolderLock,
  FileCheck2,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  LogOut,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Star,
  Zap,
  MapPin,
  X,
  FileText,
  Camera,
} from 'lucide-react';
import { ActiveScreen, MatchResult, UserProfile } from '../../types';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { calculateBusinessProfileCompleteness } from '../../lib/business/businessProfileCompleteness';
import { loadDocumentProgress } from '../../lib/tracker/documentProgress';
import { AccountPrivacyModal } from './AccountPrivacyModal';
import { CitizenAvatarInsignia } from '../common/CitizenAvatarInsignia';
import { ProfilePhotoModal } from '../profile/ProfilePhotoModal';

interface EntrepreneurIdentityPodProps {
  userProfile: UserProfile | null;
  applicantName?: string;
  onNavigate: (screen: ActiveScreen, targetSectionId?: string) => void;
  onLogout: () => void;
  savedCount?: number;
  trackedCount?: number;
  matchResults?: MatchResult[];
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const EntrepreneurIdentityPod: React.FC<EntrepreneurIdentityPodProps> = ({
  userProfile,
  applicantName,
  onNavigate,
  onLogout,
  savedCount = 0,
  trackedCount = 0,
  matchResults = [],
  onUpdateProfile,
}) => {
  const { t, lang, setLang, getLocalizedState } = useTranslation();
  const { isDark, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isLangSelectorOpen, setIsLangSelectorOpen] = useState(false);
  const podRef = useRef<HTMLDivElement>(null);

  // Close pod on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (podRef.current && !podRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsLangSelectorOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close pod on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsLangSelectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Derive citizen identity
  const displayName =
    userProfile?.applicantName ||
    applicantName ||
    t('account.citizen');

  // Regional domicile (e.g. "Aligarh · Uttar Pradesh" or state)
  const stateLabel = userProfile?.state ? getLocalizedState(userProfile.state) : '';
  const districtLabel = userProfile?.district || '';
  const locationLabel =
    districtLabel && stateLabel
      ? `${districtLabel} · ${stateLabel}`
      : stateLabel || 'National · India';

  // Calculate authoritative profile completeness
  const completeness = useMemo(
    () => calculateBusinessProfileCompleteness(userProfile),
    [userProfile],
  );
  const readinessPercent = Math.min(100, Math.max(0, completeness.percentage));
  const missingCount = completeness.missingHighValueFields.length;

  // Derive readiness status label
  const readinessStatus =
    readinessPercent === 100
      ? t('account.statusReady')
      : readinessPercent >= 75
        ? `${t('account.statusAlmostReady')} (${t('account.sectionsNeedAttention', { count: missingCount })})`
        : `${t('account.statusNeedsAttention')} (${t('account.sectionsNeedAttention', { count: missingCount })})`;

  // Count real prepared documents in Document Vault & Tracked Applications
  const readyDocsCount = useMemo(() => {
    try {
      const progressMap = loadDocumentProgress();
      const uniqueDocs = new Set<string>();
      Object.values(progressMap).forEach((list) => {
        if (Array.isArray(list)) {
          list.forEach((docId) => uniqueDocs.add(docId));
        }
      });
      return uniqueDocs.size;
    } catch {
      return 0;
    }
  }, [isOpen]);

  // Derive Next Best Action directly from high-value missing fields or workflow state
  const nextAction = useMemo(() => {
    if (completeness.missingHighValueFields.length > 0) {
      const top = completeness.missingHighValueFields[0];
      const key = top.fieldKey;
      if (key === 'fundingRequired' || key === 'totalProjectCost' || key === 'existingInvestment') {
        return {
          title: t('account.nextActionFinancialTitle'),
          desc: t('account.nextActionFinancialDesc'),
          btnText: t('account.nextActionComplete'),
          targetScreen: 'profile' as ActiveScreen,
          targetSectionId: 'profile-financial-section',
        };
      }
      if (key === 'businessStage' || key === 'businessStageKey') {
        return {
          title: t('account.nextActionBusinessTitle'),
          desc: t('account.nextActionBusinessDesc'),
          btnText: t('account.nextActionComplete'),
          targetScreen: 'profile' as ActiveScreen,
          targetSectionId: 'profile-business-section',
        };
      }
      if (key === 'registrationStatus' || key === 'hasUdyam' || key === 'entityType') {
        return {
          title: t('account.nextActionRegTitle'),
          desc: t('account.nextActionRegDesc'),
          btnText: t('account.nextActionComplete'),
          targetScreen: 'profile' as ActiveScreen,
          targetSectionId: 'profile-registration-section',
        };
      }
      return {
        title: t('account.nextActionPersonalTitle'),
        desc: t('account.nextActionPersonalDesc'),
        btnText: t('account.nextActionComplete'),
        targetScreen: 'profile' as ActiveScreen,
        targetSectionId: 'profile-demographics-section',
      };
    }

    // If profile is fully complete, guide towards schemes or tracking
    if (savedCount > 0 && trackedCount === 0) {
      return {
        title: t('account.savedSchemes'),
        desc: t('account.nextActionExploreDesc'),
        btnText: t('account.nextActionReview'),
        targetScreen: 'results' as ActiveScreen,
      };
    }
    if (trackedCount > 0) {
      return {
        title: t('account.applications'),
        desc: t('account.statusReady'),
        btnText: t('account.nextActionReview'),
        targetScreen: 'tracker' as ActiveScreen,
      };
    }
    if (matchResults.length > 0) {
      return {
        title: t('account.nextActionExploreTitle'),
        desc: t('account.nextActionExploreDesc'),
        btnText: t('account.nextActionReview'),
        targetScreen: 'results' as ActiveScreen,
      };
    }
    return null;
  }, [completeness, savedCount, trackedCount, matchResults, t]);

  const handleAction = (screen: ActiveScreen, targetSectionId?: string) => {
    setIsOpen(false);
    setIsLangSelectorOpen(false);
    onNavigate(screen, targetSectionId);
  };

  return (
    <div className="relative inline-block text-left" ref={podRef}>
      {/* ================= HEADER TRIGGER CONTROL ================= */}
      <motion.button
        id="entrepreneur-identity-pod-trigger"
        type="button"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Entrepreneur Profile: ${displayName}, ${readinessPercent}% Profile Readiness`}
        className={`group relative flex items-center gap-2.5 pl-1.5 pr-3 sm:pr-3.5 py-1.5 rounded-full border transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-[#EBF5F0] dark:bg-[#152820] border-[#16A34A] dark:border-[#22C55E] shadow-sm'
            : 'bg-white dark:bg-[#121A16] border-[#DEE7E2] dark:border-[#24342D] hover:border-[#16A34A]/60 dark:hover:border-[#22C55E]/60 hover:bg-[#F7FAF8] dark:hover:bg-[#16231D] shadow-xs'
        }`}
      >
        {/* Clean Modern Avatar */}
        <CitizenAvatarInsignia
          size="sm"
          displayName={displayName}
          photoUrl={userProfile?.photoUrl}
          isVerified={readinessPercent >= 70}
        />

        {/* Identity Details in Header */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] truncate max-w-[110px] sm:max-w-[150px] leading-tight group-hover:text-[#14453D] dark:group-hover:text-[#4ADE80] transition-colors">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] leading-none text-[#5A6860] dark:text-[#9EB0A7] mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#4ADE80]" />
            <span className="font-medium text-[#16A34A] dark:text-[#4ADE80]">
              {t('account.entrepreneurRole')}
            </span>
            <span className="text-[#B5C5BD] dark:text-[#3B4D44]">•</span>
            <span className="font-semibold text-[#2D3934] dark:text-[#CAD5CF]">
              {readinessPercent}%
            </span>
          </div>
        </div>

        {/* Rotational Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#6C7B73] dark:text-[#889B91] shrink-0 ml-0.5"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* ================= FLOATING IDENTITY POD ================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="entrepreneur-identity-pod-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Entrepreneur Identity Pod"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: -6 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: -6 }
            }
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-[calc(100vw-1.25rem)] max-w-[390px] sm:w-[410px] bg-white dark:bg-[#121815] border border-[#DEE7E2] dark:border-[#223F30] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-[#EDF3EF] dark:divide-[#1C2C24]"
          >
            {/* Top Header Banner */}
            <div className="px-5 py-3.5 bg-[#F8FAF9] dark:bg-[#141C18] flex items-center justify-between border-b border-[#E1ECE5] dark:border-[#1E3328]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] uppercase tracking-wider">
                  {t('account.podTitle') && t('account.podTitle') !== 'account.podTitle'
                    ? t('account.podTitle')
                    : 'Entrepreneur Identity'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5F0] dark:bg-[#162D22] text-[#14453D] dark:text-[#4ADE80]">
                  <ShieldCheck className="w-3 h-3 text-[#16A34A] dark:text-[#4ADE80]" />
                  <span>Verified</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5A6860] hover:text-[#1A1C1B] dark:text-[#9EB0A7] dark:hover:text-[#F0F4F2] hover:bg-[#EAEFEA] dark:hover:bg-[#1C2E25] transition-colors cursor-pointer"
                aria-label={t('account.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Entrepreneur Identity Card */}
            <div className="p-5 sm:p-6 text-center flex flex-col items-center">
              {/* Clean Executive Avatar with Photo Edit Support */}
              <div className="flex flex-col items-center mb-3.5">
                <CitizenAvatarInsignia
                  size="xl"
                  displayName={displayName}
                  photoUrl={userProfile?.photoUrl}
                  isVerified={true}
                  editable={true}
                  onClick={() => setIsPhotoModalOpen(true)}
                  ariaLabel="Change profile photo"
                />
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#14453D] dark:text-[#5EEAD4] hover:text-[#0F352E] dark:hover:text-[#4ADE80] transition-colors py-0.5 px-2 rounded-md hover:bg-[#EAF5F0] dark:hover:bg-[#1A2E25] cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  <span>{userProfile?.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>

              {/* Citizen Details */}
              <h2 className="text-base sm:text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2] leading-snug">
                {displayName}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 justify-center">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#E8F5EE] dark:bg-[#152E22] text-[#14453D] dark:text-[#4ADE80] border border-[#B9E3CB] dark:border-[#1E4D37]">
                  <CheckCircle2 className="w-3 h-3 text-[#16A34A] dark:text-[#4ADE80]" />
                  <span>{t('account.entrepreneurRole')}</span>
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#5A6860] dark:text-[#9EB0A7] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>{locationLabel}</span>
              </p>

              {/* Profile Readiness Bar (Clickable -> /profile) */}
              <button
                type="button"
                onClick={() => handleAction('profile')}
                className="w-full mt-4 p-3 rounded-2xl bg-[#F6FAF8] dark:bg-[#16221D] border border-[#DEE9E3] dark:border-[#243A2F] text-left hover:border-[#16A34A]/60 dark:hover:border-[#22C55E]/60 transition-all cursor-pointer group"
                title={t('account.profileReadiness')}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] text-[#5A6860] dark:text-[#9EB0A7]">
                    {t('account.profileReadiness')}
                  </span>
                  <span className="font-black text-[#14453D] dark:text-[#4ADE80]">
                    {readinessPercent}%
                  </span>
                </div>
                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-[#E1ECE5] dark:bg-[#253930] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      readinessPercent >= 80
                        ? 'bg-gradient-to-r from-[#16A34A] to-[#22C55E]'
                        : readinessPercent >= 50
                          ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                          : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${readinessPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#5A6860] dark:text-[#9EB0A7]">
                  <span className="truncate">{readinessStatus}</span>
                  <span className="font-semibold text-[#16A34A] dark:text-[#4ADE80] shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </button>

              {/* ⚡ NEXT ACTION CARD */}
              {nextAction && (
                <div className="w-full mt-3 p-3 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 dark:from-[#211E14] dark:via-[#16221C] dark:to-[#122019] border border-amber-200/80 dark:border-amber-800/40 text-left shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{t('account.nextAction')}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] leading-tight">
                        {nextAction.title}
                      </p>
                      <p className="text-[11px] text-[#5A6860] dark:text-[#9EB0A7] mt-0.5 line-clamp-2 leading-relaxed">
                        {nextAction.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(nextAction.targetScreen, nextAction.targetSectionId)
                      }
                      className="shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      {nextAction.btnText}
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Stats (Saved, Applications, Documents Ready) */}
              <div className="w-full grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-[#EDF3EF] dark:border-[#1E3027]">
                <button
                  type="button"
                  onClick={() => handleAction('results')}
                  className="p-2 rounded-xl bg-[#F6FAF8] dark:bg-[#16221D] hover:bg-[#EAF3EE] dark:hover:bg-[#1B2D26] text-center transition-colors cursor-pointer group"
                >
                  <span className="block text-sm sm:text-base font-black text-[#14453D] dark:text-[#4ADE80]">
                    {savedCount}
                  </span>
                  <span className="block text-[10px] font-medium text-[#5A6860] dark:text-[#9EB0A7] truncate">
                    {t('account.statsSaved')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('tracker')}
                  className="p-2 rounded-xl bg-[#F6FAF8] dark:bg-[#16221D] hover:bg-[#EAF3EE] dark:hover:bg-[#1B2D26] text-center transition-colors cursor-pointer group"
                >
                  <span className="block text-sm sm:text-base font-black text-[#14453D] dark:text-[#4ADE80]">
                    {trackedCount}
                  </span>
                  <span className="block text-[10px] font-medium text-[#5A6860] dark:text-[#9EB0A7] truncate">
                    {t('account.statsApps')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('profile', 'profile-document-vault-section')}
                  className="p-2 rounded-xl bg-[#F6FAF8] dark:bg-[#16221D] hover:bg-[#EAF3EE] dark:hover:bg-[#1B2D26] text-center transition-colors cursor-pointer group"
                >
                  <span className="block text-sm sm:text-base font-black text-[#14453D] dark:text-[#4ADE80]">
                    {readyDocsCount}
                  </span>
                  <span className="block text-[10px] font-medium text-[#5A6860] dark:text-[#9EB0A7] truncate">
                    {t('account.statsDocs')}
                  </span>
                </button>
              </div>

              {/* PRIMARY ACTION: [ Manage Profile → ] */}
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => handleAction('profile')}
                className="w-full mt-4 bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-sm"
              >
                <span>{t('account.manageProfile')}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* ================= HIERARCHICAL NAV MENU ================= */}
            <div className="p-3 max-h-[340px] overflow-y-auto divide-y divide-[#EDF3EF] dark:divide-[#1C2C24]">
              {/* GROUP 1: PROFILE */}
              <div className="py-2 first:pt-1">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#7E8F86] dark:text-[#7C9086]">
                  {t('account.groupProfile')}
                </span>
                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleAction('profile', 'profile-demographics-section')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] hover:text-[#16A34A] dark:hover:text-[#4ADE80] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-[#5A6860] dark:text-[#889B91] group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors" />
                      <span>{t('account.personalDetails')}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#16A34A] dark:text-[#4ADE80]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('profile', 'profile-business-section')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] hover:text-[#16A34A] dark:hover:text-[#4ADE80] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#5A6860] dark:text-[#889B91] group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors" />
                      <span>{t('account.businessProfile')}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#16A34A] dark:text-[#4ADE80]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('profile', 'profile-financial-section')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] hover:text-[#16A34A] dark:hover:text-[#4ADE80] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <IndianRupee className="w-4 h-4 text-[#5A6860] dark:text-[#889B91] group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors" />
                      <span>{t('account.financialProfile')}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#16A34A] dark:text-[#4ADE80]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('profile', 'profile-document-vault-section')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] hover:text-[#16A34A] dark:hover:text-[#4ADE80] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderLock className="w-4 h-4 text-[#5A6860] dark:text-[#889B91] group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors" />
                      <span>{t('account.documents')}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#16A34A] dark:text-[#4ADE80]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('profile', 'profile-registration-section')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] hover:text-[#16A34A] dark:hover:text-[#4ADE80] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck2 className="w-4 h-4 text-[#5A6860] dark:text-[#889B91] group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors" />
                      <span>{t('account.registrations')}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#16A34A] dark:text-[#4ADE80]" />
                  </button>
                </div>
              </div>

              {/* GROUP 2: MY ACTIVITY */}
              <div className="py-2">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#7E8F86] dark:text-[#7C9086]">
                  {t('account.groupActivity')}
                </span>
                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleAction('results')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span>{t('account.savedSchemes')}</span>
                    </div>
                    {savedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                        {savedCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('tracker')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ClipboardList className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                      <span>{t('account.applications')}</span>
                    </div>
                    {trackedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80]">
                        {trackedCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* GROUP 3: ACCOUNT & PREFERENCES */}
              <div className="py-2">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#7E8F86] dark:text-[#7C9086]">
                  {t('account.groupAccount')}
                </span>
                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsPrivacyModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F2F7F4] dark:hover:bg-[#182620] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#5A6860] dark:text-[#889B91]" />
                      <span>{t('account.accountPrivacy')}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16A34A] dark:text-[#4ADE80] bg-[#E8F7EE] dark:bg-[#133020] px-1.5 py-0.5 rounded-md">
                      DPDP 2023
                    </span>
                  </button>

                  {/* Language Selector Dropdown */}
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-[#5A6860] dark:text-[#889B91]" />
                        <span>{t('account.language')}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-[#14453D] dark:text-[#4ADE80]">
                        {lang}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {SUPPORTED_LANGUAGES.map((item) => {
                        const isSelected = item.code === lang;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => setLang(item.code)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'bg-[#14453D] text-white shadow-xs'
                                : 'bg-[#F2F7F4] dark:bg-[#1A2822] text-[#3A4841] dark:text-[#B0C3B9] hover:bg-[#E5EFE9] dark:hover:bg-[#22352D]'
                            }`}
                          >
                            {item.nativeName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Appearance Switcher */}
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {isDark ? (
                        <Moon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{t('account.appearance')}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#F2F7F4] dark:bg-[#1A2822] p-0.5 rounded-lg border border-[#DEE7E2] dark:border-[#223F30]">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          !isDark
                            ? 'bg-white text-[#14453D] shadow-xs'
                            : 'text-[#6A7B72] dark:text-[#889B91]'
                        }`}
                      >
                        {t('account.themeLight')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#14453D] text-white shadow-xs'
                            : 'text-[#6A7B72] dark:text-[#889B91]'
                        }`}
                      >
                        {t('account.themeDark')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GROUP 4: SESSION */}
              <div className="py-2 last:pb-1">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#7E8F86] dark:text-[#7C9086]">
                  {t('account.groupSession')}
                </span>
                <div className="mt-1">
                  <button
                    id="account-logout-btn"
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut className="w-4 h-4 text-rose-500 group-hover:-translate-x-0.5 transition-transform" />
                      <span>{t('account.signOut')}</span>
                    </div>
                    <span className="text-[10px] text-rose-500/80 font-medium">
                      ESC
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sovereign Privacy Footnote */}
            <div className="px-4 py-2.5 bg-[#F7FAF8] dark:bg-[#0E1512] text-[10px] text-[#6A7B72] dark:text-[#82968B] text-center border-t border-[#EDF3EF] dark:border-[#1E3027] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>DPDP Act 2023 · 100% On-Device Storage Sovereignty</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account & Privacy Modal */}
      <AccountPrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Photo Upload Modal */}
      {userProfile && (
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          currentPhotoUrl={userProfile.photoUrl}
          displayName={displayName}
          onClose={() => setIsPhotoModalOpen(false)}
          onSavePhoto={(newPhotoUrl) => {
            if (onUpdateProfile && userProfile) {
              onUpdateProfile({
                ...userProfile,
                photoUrl: newPhotoUrl,
              });
            }
          }}
        />
      )}
    </div>
  );
};
