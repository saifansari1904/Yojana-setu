import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MatchResult, UserProfile, Scheme } from '../types';
import { MatchGauge } from './MatchGauge';
import { SchemeDocumentChecklist } from './SchemeDocumentChecklist';
import { TrustFooterStrip } from './TrustFooterStrip';
import {
  ChevronLeft,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Coins,
  Calendar,
  Clock,
  ShieldCheck,
  Percent,
  Landmark,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  Layers,
  MapPin,
  Users,
  Briefcase,
  AlertCircle,
  FileCheck2,
  Globe,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { getSchemeCategories, getSchemeProvenance } from '../lib/data/normalization';
import { deriveSchemeTrustProfile } from '../lib/data/trustEngine';
import { getNextBestAction } from '../lib/matching/decisionEngine';
import { evaluateFundingFit } from '../lib/matching/fundingFit';
import {
  deriveBusinessNeedProfile,
  BUSINESS_STAGE_TAXONOMY,
  SUPPORT_NEEDS_TAXONOMY,
} from '../lib/business';
import {
  fadeIn,
  fadeSlideUp,
  staggerContainer,
  staggerItem,
  scaleIn,
} from '../animations/variants';
import {
  getPreparedDocIds,
  loadDocumentProgress,
  migrateLegacyDocumentProgress,
  saveDocumentProgress,
  setDocumentsPrepared,
} from '../lib/tracker/documentProgress';
import { transitions } from '../animations/transitions';
import { toastVariants } from '../animations/variants';
import { ArrowFillButton, BookmarkButton, VerificationBadge, AnimatedScore } from './ui';

interface SchemeDetailScreenProps {
  matchResult: MatchResult;
  allMatches: MatchResult[];
  userProfile: UserProfile | null;
  onBackToResults: () => void;
  onSelectScheme: (match: MatchResult) => void;
  onOpenWhyMatch?: (match: MatchResult) => void;
  onOpenWhyNotEligible?: (match: MatchResult) => void;
  savedSchemeIds: Set<string>;
  onToggleSaveScheme: (schemeId: string) => void;
  /** Phase 4.3 — lets the app record preparation progress on the journey. */
  onDocumentProgress?: (schemeId: string, preparedDocIds: string[]) => void;
  /** Phase 5 — open preparation workspace. */
  onOpenWorkspace?: (match: MatchResult) => void;
}

export const SchemeDetailScreen: React.FC<SchemeDetailScreenProps> = ({
  matchResult,
  allMatches,
  userProfile,
  onBackToResults,
  onSelectScheme,
  onOpenWhyMatch,
  onOpenWhyNotEligible,
  savedSchemeIds,
  onToggleSaveScheme,
  onDocumentProgress,
  onOpenWorkspace,
}) => {
  const {
    t,
    lang,
    getLocalizedScheme,
    getLocalizedCategory,
    getLocalizedBusinessType,
    getLocalizedState,
    formatCurrency,
  } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const locScheme = getLocalizedScheme(matchResult.scheme);
  const isEligible = matchResult.matchStatus === 'eligible';
  const isNearMatch = matchResult.matchStatus === 'near-match';
  const isSaved = savedSchemeIds.has(locScheme.id);

  const effectiveNeedProfile = useMemo(() => {
    if (!userProfile) return null;
    return userProfile.businessNeedProfile || deriveBusinessNeedProfile(userProfile);
  }, [userProfile]);

  /**
   * PHASE 4.3: document readiness now lives in the shared localStorage store
   * (`documentProgress.ts`), so the tracker, the pathway checklist and this
   * screen all read the same truth and progress survives a new tab.
   * Legacy sessionStorage keys are migrated on first read.
   */
  const [readyDocs, setReadyDocs] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    return getPreparedDocIds(migrateLegacyDocumentProgress(), locScheme.id);
  });

  const handleToggleDoc = (docName: string) => {
    setReadyDocs((prev) => {
      const next = prev.includes(docName)
        ? prev.filter((d) => d !== docName)
        : [...prev, docName];
      saveDocumentProgress(
        setDocumentsPrepared(loadDocumentProgress(), locScheme.id, next),
      );
      if (onDocumentProgress) onDocumentProgress(locScheme.id, next);
      return next;
    });
  };

  // PHASE 4.2 — deterministic, memoized support pathway for the selected scheme
  // Toast feedback for copy/share
  const [shareFeedback, setShareFeedback] = useState<boolean>(false);

  const handleShare = async () => {
    const shareData = {
      title: `${locScheme.shortCode} - ${locScheme.name} | Yojana Setu`,
      text: locScheme.benefitSummary,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${locScheme.name}\n${locScheme.benefitSummary}\n${locScheme.officialPortalUrl || window.location.href}`
        );
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 3000);
      } catch {
        // Clipboard write failed
      }
    }
  };

  // Extract domain for official source display
  const portalDomain = useMemo(() => {
    if (!locScheme.officialPortalUrl) return null;
    try {
      const url = new URL(locScheme.officialPortalUrl);
      return url.hostname;
    } catch {
      return locScheme.officialPortalUrl;
    }
  }, [locScheme.officialPortalUrl]);

  // Alternative recommendations: use engine's recommendations or fallback to compatible matches
  const alternativeItems = useMemo(() => {
    if (
      matchResult.recommendedAlternatives &&
      matchResult.recommendedAlternatives.length > 0
    ) {
      return matchResult.recommendedAlternatives;
    }

    // Fallback: pick up to 3 compatible schemes from allMatches
    return allMatches
      .filter((m) => m.scheme.id !== locScheme.id && m.matchPercentage >= 50)
      .slice(0, 3)
      .map((m) => {
        const altLoc = getLocalizedScheme(m.scheme);
        return {
          scheme: m.scheme,
          matchPercentage: m.matchPercentage,
          matchStatus: m.matchStatus,
          reason:
            lang === 'hi'
              ? `${m.matchPercentage}% मिलान स्कोर के साथ अनुशंसित विकल्प।`
              : `Recommended alternative with ${m.matchPercentage}% enterprise match score.`,
        };
      });
  }, [matchResult, allMatches, locScheme.id, lang, getLocalizedScheme]);

  // Scroll to top on scheme change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [locScheme.id]);

  return (
    <div id={`scheme-detail-${locScheme.id}`} className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* 1. Back navigation bar & breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <motion.button
          id="detail-back-btn"
          onClick={onBackToResults}
          initial="initial"
          whileHover={shouldReduceMotion ? undefined : 'hover'}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          variants={{
            initial: { x: 0 },
            hover: { x: -2 },
          }}
          className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:text-[#0B302B] dark:hover:text-[#6EE7B7] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#D4EFE1]/40 dark:hover:bg-[#16382B]/60 transition-colors cursor-pointer"
        >
          <motion.span
            variants={{
              initial: { x: 0 },
              hover: { x: -3 },
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="inline-flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.span>
          <span>{t('schemeDetail.backToResults')}</span>
        </motion.button>

        <div className="flex items-center gap-2 text-[11px] text-[#6F7A73] dark:text-[#8E9F97]">
          <span>{t('results.title')}</span>
          <span>/</span>
          <span className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
            {locScheme.shortCode}
          </span>
        </div>
      </div>

      {/* Share Toast Notification — springs in, settles out */}
      <AnimatePresence>
        {shareFeedback && (
          <motion.div
            role="status"
            aria-live="polite"
            variants={shouldReduceMotion ? undefined : toastVariants}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            exit={shouldReduceMotion ? undefined : 'exit'}
            className="mb-4 p-3 bg-[#D4EFE1] dark:bg-[#1A382D] border border-[#16A34A] text-[#14453D] dark:text-[#4ADE80] rounded text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <motion.span
              initial={shouldReduceMotion ? undefined : { scale: 0.4, opacity: 0 }}
              animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, type: 'spring', stiffness: 420, damping: 24 }}
              className="flex items-center"
            >
              <Check className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
            </motion.span>
            <span>{t('schemeDetail.shareSuccess')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TOP SECTION — SCHEME HERO */}
      <motion.section
        id="scheme-hero-section"
        variants={shouldReduceMotion ? undefined : fadeSlideUp}
        initial="hidden"
        animate="visible"
        className="yj-card yj-card-lg p-5 sm:p-7 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Main Title & Authority */}
          <div className="flex-1 min-w-0">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-[#14453D] dark:bg-[#1C5045] text-white text-xs font-bold px-2.5 py-0.5 rounded">
                {locScheme.shortCode}
              </span>
              <span className="bg-[#EEEEED] dark:bg-[#1E2924] text-[#3F4943] dark:text-[#C5D5CC] text-xs font-medium px-2.5 py-0.5 rounded">
                {locScheme.schemeType}
              </span>

              {locScheme.applicableStates.length === 0 ? (
                <span className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Central / Pan-India Scheme</span>
                </span>
              ) : (
                <span className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{locScheme.applicableStates.join(', ')} State Scheme</span>
                </span>
              )}

              <span className="bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                <span>{t('schemeDetail.verifiedSource')}</span>
              </span>
            </div>

            {/* Normalized Category Tags */}
            {(() => {
              const categories = getSchemeCategories(matchResult.scheme);
              if (!categories || categories.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs font-medium bg-[#F3F4F3] dark:bg-[#1E2924] text-[#3F4943] dark:text-[#C5D5CC] border border-[#E2E2E0] dark:border-[#2A3C34] px-2 py-0.5 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* Scheme Full Name */}
            <motion.h1
              layoutId={`scheme-title-${locScheme.id}`}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] tracking-tight leading-snug mb-2"
            >
              {locScheme.name}
            </motion.h1>

            {/* Sponsoring Ministry */}
            <p className="text-xs sm:text-sm text-[#516A5F] dark:text-[#9EB0A7] flex items-center gap-1.5 flex-wrap">
              <Building2 className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0" />
              <span className="font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
                {locScheme.sponsoringMinistry}
              </span>
              {locScheme.department && (
                <>
                  <span className="text-gray-400">·</span>
                  <span>{locScheme.department}</span>
                </>
              )}
            </p>

            {/* Quick Status Pill */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold ${
                  isEligible
                    ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border border-[#16A34A]/30'
                    : isNearMatch
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-[#FFDAD6] dark:bg-[#3D1A14] text-[#7C2C0F] dark:text-[#FCA5A5] border border-[#FFCCBD] dark:border-[#5A2B20]'
                }`}
              >
                {isEligible ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <span>
                  {isEligible
                    ? t('results.statusEligible')
                    : isNearMatch
                    ? t('results.statusNearMatch')
                    : t('results.statusLowMatch')}
                </span>
                <span>•</span>
                <span>
                  {t('schemeDetail.criteriaSatisfied', {
                    matched: matchResult.matchedCount,
                    total: matchResult.totalFactorsCount,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Gauge & Top Action Buttons */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E2E0] dark:border-[#24342D]">
            {/* Match Gauge */}
            <div className="flex items-center gap-3">
              <MatchGauge
                percentage={matchResult.matchPercentage}
                size={80}
                strokeWidth={7}
                id={`detail-gauge-${locScheme.id}`}
                layoutId={`scheme-gauge-${locScheme.id}`}
              />
              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F7A73] dark:text-[#8E9F97] block">
                  {t('schemeDetail.matchScoreLabel')}
                </span>
                <span className="text-2xl font-extrabold text-[#14453D] dark:text-[#4ADE80] leading-none">
                  {Math.round(matchResult.matchPercentage)}%
                </span>
              </div>
            </div>

            {/* Actions: Save & Share */}
            <div className="flex items-center gap-2">
              {/* Save Scheme Button */}
              <BookmarkButton
                id={`save-scheme-btn-${locScheme.id}`}
                isSaved={isSaved}
                onToggle={() => onToggleSaveScheme(locScheme.id)}
                schemeName={locScheme.name}
              />

              {/* Share Button */}
              <motion.button
                id={`share-scheme-btn-${locScheme.id}`}
                type="button"
                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                onClick={handleShare}
                aria-label={t('schemeDetail.share')}
                className="p-2 rounded text-xs font-bold bg-white dark:bg-[#1E2924] hover:bg-[#F3F4F3] dark:hover:bg-[#26352E] text-[#3F4943] dark:text-[#C5D5CC] border border-[#E2E2E0] dark:border-[#2E4137] transition-colors cursor-pointer"
                title={t('schemeDetail.share')}
              >
                <Share2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Official Portal CTA Button (Desktop) */}
            <div className="hidden md:flex flex-col gap-2 items-end">
              {onOpenWorkspace && (
                <button
                  type="button"
                  id={`hero-prepare-btn-${locScheme.id}`}
                  onClick={() => onOpenWorkspace(matchResult)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-[#0F6B4C] dark:border-[#4ADE80] text-[#0F6B4C] dark:text-[#4ADE80] bg-[#0F6B4C]/5 hover:bg-[#0F6B4C]/10 transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'आवेदन तैयारी कार्यक्षेत्र' : 'Preparation Workspace'}</span>
                </button>
              )}

              {locScheme.officialPortalUrl ? (
                <ArrowFillButton
                  id={`hero-apply-btn-${locScheme.id}`}
                  onClick={() => window.open(locScheme.officialPortalUrl, '_blank', 'noopener,noreferrer')}
                  variant="primary"
                  size="md"
                  icon={ExternalLink}
                >
                  {t('schemeDetail.applyOfficial')}
                </ArrowFillButton>
              ) : (
                <span className="text-xs text-[#6F7A73] dark:text-[#8E9F97] italic">
                  {t('schemeDetail.officialUnavailable')}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* AUTHORITATIVE DECISION LAYER: NEXT BEST ACTION BANNER */}
      {userProfile && (() => {
        const nextAction = getNextBestAction(matchResult, userProfile, lang);
        return (
          <motion.div
            id="scheme-detail-next-action-banner"
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="mb-6 bg-[#F4F8F6] dark:bg-[#16231C] border border-[#CDE3D7] dark:border-[#223F30] rounded-lg p-4 sm:p-5 shadow-xs transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#14453D] dark:bg-[#34D399] text-white dark:text-[#0B251F] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#14453D] dark:bg-[#34D399] text-white dark:text-[#0B251F] px-2 py-0.5 rounded">
                      {lang === 'hi' ? 'सर्वोत्तम अगला कदम' : 'Next Best Action'}
                    </span>
                    <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {nextAction.badgeText}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {nextAction.title}
                  </h3>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
                    {nextAction.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {nextAction.actionUrl && (
                  <a
                    href={nextAction.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#14453D] hover:bg-[#0E352E] dark:bg-[#34D399] dark:hover:bg-[#28B781] text-white dark:text-[#0B251F] font-bold text-xs py-2 px-4 rounded transition-colors flex items-center gap-1.5"
                  >
                    <span>{nextAction.buttonLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {nextAction.actionTarget === 'alternatives' && onOpenWhyNotEligible && (
                  <button
                    onClick={() => onOpenWhyNotEligible(matchResult)}
                    className="bg-[#14453D] hover:bg-[#0E352E] dark:bg-[#34D399] dark:hover:bg-[#28B781] text-white dark:text-[#0B251F] font-bold text-xs py-2 px-4 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{nextAction.buttonLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* 3. NEAR-MATCH CALLOUT BANNER (if applicable) */}
      {isNearMatch && (
        <motion.div
          id="near-match-alert-banner"
          variants={shouldReduceMotion ? undefined : fadeSlideUp}
          initial="hidden"
          animate="visible"
          className="mb-6 bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-lg p-5 shadow-xs transition-colors"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wide bg-amber-200 dark:bg-amber-800/80 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                  {t('schemeDetail.closeToQualifying')}
                </span>
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  {t('schemeDetail.criteriaSatisfied', {
                    matched: matchResult.matchedCount,
                    total: matchResult.totalFactorsCount,
                  })}
                </span>
              </div>

              <h2 className="text-base font-bold text-amber-950 dark:text-amber-100 mb-1">
                {t('schemeDetail.statusNearMatchDesc')}
              </h2>

              {/* Main Gap highlight */}
              {matchResult.primaryGap && (
                <div className="mt-3 p-3 bg-white/80 dark:bg-[#161F1B]/90 rounded border border-amber-200 dark:border-amber-800/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                    <span>{t('schemeDetail.mainGapLabel')}:</span>
                    <span className="text-amber-700 dark:text-amber-400">
                      {matchResult.primaryGap.factorLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#3F4943] dark:text-[#D5DDD8] leading-relaxed">
                    {matchResult.primaryGap.explanation}
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-amber-100 dark:border-amber-900/40">
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">
                        {t('schemeDetail.yourProfileCol')}:{' '}
                      </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {matchResult.primaryGap.userValue}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">
                        {t('schemeDetail.schemeReqCol')}:{' '}
                      </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {matchResult.primaryGap.statutoryRequirement}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Grid: Left Column (Core Details) & Right Sidebar (Benefits & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT TWO COLUMNS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase 4.1: "WHY THIS MAY HELP YOUR BUSINESS" (Business Need Intelligence) */}
          {userProfile && (
            <motion.section
              id="why-helps-business-section"
              variants={shouldReduceMotion ? undefined : fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              className="yj-card yj-card-lg p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                    {lang === 'hi' ? 'यह आपके व्यवसाय के लिए क्य��ं उपयोगी है' : 'Why This May Help Your Business'}
                  </h2>
                </div>
                {matchResult.businessRelevance && (
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider ${
                      matchResult.businessRelevance.relevanceLevel === 'HIGH'
                        ? 'bg-[#16A34A] text-white'
                        : matchResult.businessRelevance.relevanceLevel === 'MEDIUM'
                        ? 'bg-blue-600 text-white'
                        : 'bg-stone-500 text-white'
                    }`}
                  >
                    {lang === 'hi'
                      ? matchResult.businessRelevance.badgeLabelHi
                      : matchResult.businessRelevance.badgeLabelEn}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3.5 rounded bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#24342D]">
                <div>
                  <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block font-medium">
                    {lang === 'hi' ? 'व्यवसाय चरण:' : 'Business Stage:'}
                  </span>
                  <strong className="text-xs text-[#1A1C1B] dark:text-[#F0F4F2] font-bold">
                    {effectiveNeedProfile?.currentStage
                      ? lang === 'hi'
                        ? BUSINESS_STAGE_TAXONOMY[effectiveNeedProfile.currentStage]?.labelHi ||
                          effectiveNeedProfile.currentStage
                        : BUSINESS_STAGE_TAXONOMY[effectiveNeedProfile.currentStage]?.labelEn ||
                          effectiveNeedProfile.currentStage
                      : userProfile.businessStage || (lang === 'hi' ? 'सामान्य उद्यम' : 'General Setup')}
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block font-medium">
                    {lang === 'hi' ? 'प्राथमिक आवश्यकता:' : 'Primary Need:'}
                  </span>
                  <strong className="text-xs text-[#1A1C1B] dark:text-[#F0F4F2] font-bold">
                    {effectiveNeedProfile?.primaryNeed
                      ? lang === 'hi'
                        ? SUPPORT_NEEDS_TAXONOMY[effectiveNeedProfile.primaryNeed]?.labelHi ||
                          effectiveNeedProfile.primaryNeed
                        : SUPPORT_NEEDS_TAXONOMY[effectiveNeedProfile.primaryNeed]?.labelEn ||
                          effectiveNeedProfile.primaryNeed
                      : lang === 'hi'
                      ? 'पूंजी / ऋण सहायता'
                      : 'Capital / Loan Assistance'}
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block font-medium">
                    {lang === 'hi' ? 'अनुमानित वित्तीय अंतर:' : 'Funding Gap:'}
                  </span>
                  <strong className="text-xs text-[#14453D] dark:text-[#4ADE80] font-bold">
                    {effectiveNeedProfile?.fundingGap !== undefined &&
                    effectiveNeedProfile.fundingGap > 0
                      ? formatCurrency(effectiveNeedProfile.fundingGap)
                      : userProfile.fundingGap !== undefined && userProfile.fundingGap > 0
                      ? formatCurrency(userProfile.fundingGap)
                      : userProfile.fundingRequired
                      ? formatCurrency(userProfile.fundingRequired)
                      : lang === 'hi'
                      ? 'अनिर्दिष्ट'
                      : 'Not specified'}
                  </strong>
                </div>
              </div>

              {/* Verified Scheme Support Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                  <p className="text-[#3F4943] dark:text-[#C5D5CC]">
                    <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {lang === 'hi' ? 'सत्यापित योजना लाभ: ' : 'Verified Scheme Benefit: '}
                    </strong>
                    {locScheme.benefitSummary}
                  </p>
                </div>
                {matchResult.businessRelevance && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
                    <p className="text-[#3F4943] dark:text-[#C5D5CC]">
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {lang === 'hi' ? 'प्रासंगिकता विश्लेषण: ' : 'Relevance Rationale: '}
                      </strong>
                      {lang === 'hi'
                        ? matchResult.businessRelevance.explanationHi
                        : matchResult.businessRelevance.explanationEn}
                    </p>
                  </div>
                )}
                {matchResult.businessRelevance?.matchedNeeds && matchResult.businessRelevance.matchedNeeds.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-[#E2E2E0] dark:border-[#24342D] flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#6F7A73] dark:text-[#8E9F97]">
                      {lang === 'hi' ? 'समर्थ���त व्यावसायिक जरूरतें:' : 'Supported Needs:'}
                    </span>
                    {matchResult.businessRelevance.matchedNeeds.map((n) => (
                      <span
                        key={n.needType}
                        className="text-[10px] font-bold bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] px-2 py-0.5 rounded"
                      >
                        ✓ {lang === 'hi' ? n.labelHi : n.labelEn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* 4. "WHY THIS SCHEME MATCHES YOU" (5-Factor Detailed Rule Breakdown) */}
          <motion.section
            id="why-matches-section"
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="yj-card yj-card-lg p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                {t('schemeDetail.whyMatchesTitle')}
              </h2>
            </div>
            <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mb-4 leading-relaxed">
              {matchResult.plainLanguageExplanation}
            </p>

            {/* 5 Factors Detailed List */}
            <div className="space-y-3">
              {matchResult.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  id={`factor-rule-${item.factorKey}`}
                  className={`p-3.5 rounded border transition-colors ${
                    item.matched
                      ? 'bg-[#D4EFE1]/30 dark:bg-[#1A382D]/20 border-[#A3D9C9] dark:border-[#265343]'
                      : 'bg-[#FFDAD6]/30 dark:bg-[#3D1A14]/30 border-[#FFCCBD] dark:border-[#5A2B20]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {item.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[#C2603F] dark:text-[#F87171] shrink-0" />
                      )}
                      <h3 className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {item.factorLabel}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        item.matched
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-[#C2603F] dark:bg-[#B91C1C] text-white'
                      }`}
                    >
                      {item.matched ? t('common.matched') : t('common.gap')}
                    </span>
                  </div>

                  <p className="text-xs text-[#3F4943] dark:text-[#D5DDD8] leading-relaxed mb-2">
                    {item.explanation}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#E2E2E0]/60 dark:border-[#24342D]">
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">
                        {t('schemeDetail.yourProfileCol')}:{' '}
                      </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {item.userValue}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">
                        {t('schemeDetail.schemeReqCol')}:{' '}
                      </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {item.statutoryRequirement}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommends summary note */}
            <div className="mt-4 pt-4 border-t border-[#E2E2E0] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#9EB0A7]">
              <Sparkles className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] block mb-0.5">
                  {isEligible
                    ? t('schemeDetail.whySetuRecommends')
                    : t('schemeDetail.whySetuRecommendsNear')}
                </strong>
                <p>
                  {isEligible
                    ? t('schemeDetail.statusEligibleDesc')
                    : t('schemeDetail.statusNearMatchDesc')}
                </p>
              </div>
            </div>
          </motion.section>

          {/* 5. SCHEME OVERVIEW & BENEFICIARIES */}
          <motion.section
            id="scheme-overview-section"
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="yj-card yj-card-lg p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
                <Info className="w-3.5 h-3.5" />
              </div>
              <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                {t('schemeDetail.aboutTitle')}
              </h2>
            </div>

            <p className="text-sm text-[#3F4943] dark:text-[#D5DDD8] leading-relaxed mb-5">
              {locScheme.benefitSummary}
            </p>

            {locScheme.purpose && (
              <div className="mb-5 p-3.5 bg-[#F3F4F3] dark:bg-[#1B2420] rounded border border-[#E2E2E0] dark:border-[#26382F]">
                <span className="text-[11px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block mb-1">
                  {lang === 'hi' ? 'उद्देश्य एवं कार्यक्षेत्र' : 'Purpose & Core Focus'}
                </span>
                <p className="text-xs text-[#1A1C1B] dark:text-[#F0F4F2] leading-relaxed font-medium">
                  {locScheme.purpose}
                </p>
              </div>
            )}

            {/* Who is this scheme for */}
            <div className="pt-4 border-t border-[#E2E2E0] dark:border-[#24342D]">
              <h3 className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
                <span>{t('schemeDetail.whoIsItForTitle')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Categories */}
                <div className="p-3 rounded bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#24342D]">
                  <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block mb-1.5">
                    {t('schemeDetail.targetBeneficiaries')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {locScheme.targetCategories.map((cat, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] font-semibold bg-[#EEEEED] dark:bg-[#1E2924] text-[#1A1C1B] dark:text-[#D5DDD8] px-2 py-0.5 rounded"
                      >
                        {getLocalizedCategory(cat)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target Business Types */}
                <div className="p-3 rounded bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#24342D]">
                  <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block mb-1.5">
                    {t('schemeDetail.targetActivities')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {locScheme.targetBusinessTypes.map((biz, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[11px] font-semibold bg-[#EEEEED] dark:bg-[#1E2924] text-[#1A1C1B] dark:text-[#D5DDD8] px-2 py-0.5 rounded"
                      >
                        {getLocalizedBusinessType(biz)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Geographic Coverage */}
                <div className="p-3 rounded bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#24342D]">
                  <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block mb-1">
                    {t('schemeDetail.coverageArea')}
                  </span>
                  <p className="text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                    <span>
                      {locScheme.applicableStates.length === 0
                        ? t('common.allStatesAndUTs')
                        : locScheme.applicableStates.map((st) => getLocalizedState(st)).join(', ')}
                    </span>
                  </p>
                </div>

                {/* Age Eligibility Window */}
                <div className="p-3 rounded bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#24342D]">
                  <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block mb-1">
                    {t('schemeDetail.ageLimit')}
                  </span>
                  <p className="text-xs font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                    <span>
                      {locScheme.minAge} – {locScheme.maxAge} {t('common.years')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 6. ELIGIBILITY REQUIREMENTS TABLE / COMPARISON */}
          <motion.section
            id="eligibility-table-section"
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="yj-card yj-card-lg p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
                <FileCheck2 className="w-3.5 h-3.5" />
              </div>
              <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                {t('schemeDetail.eligibilityTitle')}
              </h2>
            </div>

            {/* Structured Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E2E0] dark:border-[#24342D] text-[#6F7A73] dark:text-[#8E9F97]">
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider">
                      {t('schemeDetail.requirementCol')}
                    </th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider">
                      {t('schemeDetail.yourProfileCol')}
                    </th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider">
                      {t('schemeDetail.schemeReqCol')}
                    </th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right">
                      {t('schemeDetail.statusCol')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E2E0]/60 dark:divide-[#24342D]/60">
                  {matchResult.breakdown.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`hover:bg-[#FAFAF9] dark:hover:bg-[#1A231F]/50 transition-colors ${
                        !row.matched ? 'bg-[#FFDAD6]/10 dark:bg-[#3D1A14]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {row.factorLabel}
                      </td>
                      <td className="py-3 px-3 text-[#3F4943] dark:text-[#D5DDD8]">
                        <span className="font-medium bg-[#EEEEED] dark:bg-[#1E2924] px-2 py-0.5 rounded">
                          {row.userValue}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#516A5F] dark:text-[#9EB0A7]">
                        {row.statutoryRequirement}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {row.state === 'MATCHED' || row.matched ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] dark:text-[#4ADE80]">
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('common.matched')}</span>
                          </span>
                        ) : row.state === 'UNKNOWN' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'विवरण आवश्यक' : 'Needed'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C2603F] dark:text-[#F87171]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{t('common.gap')}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* 7. SCHEME-SPECIFIC DOCUMENT CHECKLIST */}
          <motion.section
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            <SchemeDocumentChecklist
              documents={locScheme.requiredDocuments}
              schemeId={locScheme.id}
              readyDocs={readyDocs}
              onToggleDoc={handleToggleDoc}
            />
          </motion.section>

          {/* 8. HOW TO APPLY (STEP-BY-STEP) */}
          <motion.section
            id="how-to-apply-section"
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="yj-card yj-card-lg p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                  {t('schemeDetail.howToApplyTitle')}
                </h2>
              </div>

              <span className="text-xs font-semibold bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] px-2.5 py-0.5 rounded">
                {locScheme.applicationMode}
              </span>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2E2E0] dark:before:bg-[#24342D]">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#14453D] dark:bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {t('schemeDetail.step1Title')}
                  </h3>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5 leading-relaxed">
                    {t('schemeDetail.step1Desc')}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#14453D] dark:bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {t('schemeDetail.step2Title')}
                  </h3>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5 leading-relaxed">
                    {t('schemeDetail.step2Desc')}
                  </p>
                  {locScheme.officialPortalUrl && (
                    <a
                      href={locScheme.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline inline-flex items-center gap-1 mt-1.5"
                    >
                      <span>{portalDomain || locScheme.officialPortalUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#14453D] dark:bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {t('schemeDetail.step3Title')}
                  </h3>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5 leading-relaxed">
                    {t('schemeDetail.step3Desc')}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#14453D] dark:bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  4
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {t('schemeDetail.step4Title')}
                  </h3>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5 leading-relaxed">
                    {t('schemeDetail.step4Desc')}
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#14453D] dark:bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  5
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {t('schemeDetail.step5Title')}
                  </h3>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5 leading-relaxed">
                    {t('schemeDetail.step5Desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 2.5 Government Data Trust, Freshness & Provenance */}
            {(() => {
              const prov = getSchemeProvenance(matchResult.scheme);
              const trust = matchResult.scheme.trustProfile || deriveSchemeTrustProfile(matchResult.scheme);
              const hierarchyLabels: Record<number, string> = {
                1: 'Level 1 · Central Government Portal',
                2: 'Level 2 · State Government Portal',
                3: 'Level 3 · Sponsoring Ministry / Department',
                4: 'Level 4 · Statutory Implementing Agency',
                5: 'Level 5 · Govt-backed Enterprise / Corporation',
                6: 'Level 6 · Secondary Aggregator',
              };

              return (
                <div className="mt-6 pt-4 border-t border-[#E2E2E0] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#101613] p-4 rounded text-xs">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5 text-sm">
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                      Government Data Trust & Provenance
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Status: {trust.verification.status}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {trust.confidence} Confidence
                      </span>
                    </div>
                  </div>

                  {/* Responsible Statutory Disclaimer */}
                  <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] mb-3 leading-relaxed">
                    Yojana Setu provides verified government scheme intelligence to help entrepreneurs identify potential funding. Final eligibility, sanction amounts, and current guidelines are determined solely by the sponsoring government authority upon submission of statutory application.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-2 border-t border-[#E2E2E0] dark:border-[#24342D]">
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">Official Sponsoring Body: </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] block sm:inline">
                        {prov.sourceName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">Data Freshness: </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {trust.freshness.freshnessLabel}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">Source Hierarchy: </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {hierarchyLabels[trust.source.hierarchyLevel] || prov.sourceType}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6F7A73] dark:text-[#8E9F97]">Direct Government Portal: </span>
                      <a
                        href={prov.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#14453D] dark:text-[#4ADE80] font-semibold underline truncate block"
                      >
                        {prov.officialSourceUrl}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.section>
        </div>

        {/* RIGHT SIDEBAR (Financial Assistance & Alternatives) */}
        <div className="space-y-6">
          {/* 9. BENEFITS / FINANCIAL ASSISTANCE */}
          <motion.section
            id="benefits-financial-section"
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="yj-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                {t('schemeDetail.benefitsTitle')}
              </h2>
            </div>

            {/* Assistance Cards List */}
            <div className="space-y-3">
              {/* Profile Funding Fit Analysis */}
              {userProfile && (() => {
                const fundingFit = evaluateFundingFit(matchResult.scheme, userProfile, lang);
                const isWithin = fundingFit.fitStatus === 'WITHIN_RANGE';
                const isAbove = fundingFit.fitStatus === 'ABOVE_RANGE';

                return (
                  <div
                    id={`funding-fit-${locScheme.id}`}
                    className={`p-3 rounded border text-xs ${
                      isWithin
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : isAbove
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                        : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'वित्तीय आवश्यकता अनुकूलता' : 'Funding Fit Analysis'}
                      </span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white/70 dark:bg-black/40">
                        {isWithin
                          ? (lang === 'hi' ? 'दायरे में' : 'Within Range')
                          : isAbove
                          ? (lang === 'hi' ? 'अधिकतम सीमा से अधिक' : 'Exceeds Cap')
                          : (lang === 'hi' ? 'विवरण' : 'Info')}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-1.5 font-medium">
                      {fundingFit.explanation}
                    </p>
                    {fundingFit.subsidyExplanation && (
                      <div className="pt-1.5 border-t border-black/10 dark:border-white/10 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
                        {fundingFit.subsidyExplanation}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Max Funding */}
              {locScheme.maxAmount > 0 && (
                <div className="p-3 bg-[#D4EFE1]/40 dark:bg-[#1A382D]/40 rounded border border-[#A3D9C9] dark:border-[#265343]">
                  <span className="text-[10px] uppercase font-bold text-[#516A5F] dark:text-[#A7F3D0] block">
                    {t('schemeDetail.maxAssistance')}
                  </span>
                  <span className="text-xl font-extrabold text-[#14453D] dark:text-[#4ADE80]">
                    {formatCurrency(locScheme.maxAmount)}
                  </span>
                  {locScheme.minAmount > 0 && (
                    <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block mt-0.5">
                      {t('schemeDetail.minAssistance')}: {formatCurrency(locScheme.minAmount)}
                    </span>
                  )}
                </div>
              )}

              {/* Funding Range Text */}
              {locScheme.fundingRangeText && (
                <div className="p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D]">
                  <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block">
                    {t('schemeDetail.fundingRange')}
                  </span>
                  <span className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mt-0.5 block">
                    {locScheme.fundingRangeText}
                  </span>
                </div>
              )}

              {/* Subsidy Rate */}
              {locScheme.subsidyRatePercent && locScheme.subsidyRatePercent > 0 && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800/60">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                    {t('schemeDetail.subsidyRate')}
                  </span>
                  <span className="text-lg font-bold text-amber-900 dark:text-amber-200">
                    {lang === 'hi'
                      ? `${locScheme.subsidyRatePercent}% तक सब्सिडी`
                      : `Up to ${locScheme.subsidyRatePercent}% Subsidy`}
                  </span>
                  {locScheme.subsidyCap && locScheme.subsidyCap > 0 && (
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
                      {t('schemeDetail.subsidyCap')}: {formatCurrency(locScheme.subsidyCap)}
                    </span>
                  )}
                </div>
              )}

              {/* Interest Rate */}
              {locScheme.baseInterestRate > 0 && (
                <div className="p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D]">
                  <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block">
                    {t('schemeDetail.interestRate')}
                  </span>
                  <span className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {locScheme.baseInterestRate}% {t('common.paisaPerAnnum')}
                  </span>
                </div>
              )}

              {/* Tenure & Moratorium */}
              {locScheme.standardTenureYears > 0 && (
                <div className="p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D]">
                  <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block">
                    {t('schemeDetail.tenure')}
                  </span>
                  <span className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {locScheme.standardTenureYears} {t('common.years')}
                  </span>
                  {locScheme.moratoriumPeriodMonths > 0 && (
                    <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block mt-0.5">
                      {t('schemeDetail.moratorium')}: {locScheme.moratoriumPeriodMonths}{' '}
                      {lang === 'hi' ? 'महीने' : 'Months'}
                    </span>
                  )}
                </div>
              )}

              {/* Assistance / Scheme Type */}
              <div className="p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D]">
                <span className="text-[10px] uppercase font-bold text-[#6F7A73] dark:text-[#8E9F97] block">
                  {t('schemeDetail.schemeTypeLabel')}
                </span>
                <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                  {locScheme.schemeType}
                </span>
              </div>
            </div>

            {/* Apply CTA Button in Sidebar */}
            <div className="mt-5 pt-4 border-t border-[#E2E2E0] dark:border-[#24342D]">
              {locScheme.officialPortalUrl ? (
                <a
                  id={`sidebar-apply-btn-${locScheme.id}`}
                  href={locScheme.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white py-3 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>{t('schemeDetail.applyOfficial')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="text-center p-3 bg-[#F3F4F3] dark:bg-[#1E2924] rounded text-xs text-[#6F7A73] dark:text-[#8E9F97]">
                  {t('schemeDetail.officialUnavailable')}
                </div>
              )}
            </div>
          </motion.section>

          {/* 10. RELATED / ALTERNATIVE SCHEMES */}
          <motion.section
            id="alternatives-sidebar-section"
            variants={shouldReduceMotion ? undefined : fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="yj-card p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                {t('schemeDetail.alternativesTitle')}
              </h2>
            </div>
            <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] mb-3">
              {t('schemeDetail.alternativesSubtitle')}
            </p>

            {alternativeItems.length === 0 ? (
              <p className="text-xs text-[#6F7A73] dark:text-[#8E9F97] italic">
                {t('schemeDetail.noAlternatives')}
              </p>
            ) : (
              <div className="space-y-3">
                {alternativeItems.map((alt, idx) => {
                  const altLoc = getLocalizedScheme(alt.scheme);
                  const matchedResult =
                    allMatches.find((m) => m.scheme.id === alt.scheme.id) ||
                    matchResult;

                  return (
                    <div
                      key={idx}
                      id={`alt-card-${alt.scheme.id}`}
                      className="p-3 rounded border border-[#E2E2E0] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D] dark:hover:border-[#4ADE80] transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] truncate">
                          {altLoc.shortCode}
                        </span>
                        <span className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D4EFE1] dark:bg-[#1A382D] px-2 py-0.2 rounded">
                          {Math.round(alt.matchPercentage)}% {lang === 'hi' ? 'मिलान' : 'Match'}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] line-clamp-2 mb-2">
                        {altLoc.name}
                      </p>

                      {alt.reason && (
                        <p className="text-[10px] text-[#14453D] dark:text-[#A7F3D0] mb-2 bg-[#D4EFE1]/40 dark:bg-[#1A382D]/40 p-1.5 rounded">
                          {alt.reason}
                        </p>
                      )}

                      <button
                        id={`view-alt-btn-${alt.scheme.id}`}
                        onClick={() => onSelectScheme(matchedResult)}
                        className="w-full text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:text-[#0B302B] dark:hover:text-[#6EE7B7] hover:underline flex items-center justify-center gap-1 pt-1 cursor-pointer"
                      >
                        <span>{t('schemeDetail.viewAlternativeBtn')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* Trust Footer Strip */}
      <div className="mt-8">
        <TrustFooterStrip
          sourceMinistry={locScheme.sponsoringMinistry}
          verifiedDate={locScheme.lastVerifiedDate}
        />
      </div>

      {/* 11. STICKY MOBILE CTA BAR */}
      <div
        id="sticky-mobile-cta"
        className="yj-sticky-actions block md:hidden yj-glass border-t border-[#E2E2E0] dark:border-[#24342D] px-4 py-3"
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Quick Score */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D4EFE1] dark:bg-[#1A382D] px-2 py-1 rounded">
              <AnimatedScore value={matchResult.matchPercentage} />
            </span>
          </div>

          {/* Save Button */}
          <BookmarkButton
            id="mobile-save-btn"
            isSaved={isSaved}
            onToggle={() => onToggleSaveScheme(locScheme.id)}
            compact={true}
            schemeName={locScheme.name}
          />

          {/* Apply on Official Portal */}
          {onOpenWorkspace && (
            <button
              type="button"
              id="mobile-prepare-btn"
              onClick={() => onOpenWorkspace(matchResult)}
              className="yj-tap px-3 py-2 rounded-[var(--yj-radius-md)] text-xs font-bold border border-[#0F6B4C] dark:border-[#4ADE80] text-[#0F6B4C] dark:text-[#4ADE80] bg-[#0F6B4C]/5 hover:bg-[#0F6B4C]/10 transition-colors yj-focus-ring"
            >
              {lang === 'hi' ? 'तैयारी' : 'Prepare'}
            </button>
          )}

          {locScheme.officialPortalUrl ? (
            <ArrowFillButton
              id="mobile-apply-btn"
              onClick={() => window.open(locScheme.officialPortalUrl, '_blank', 'noopener,noreferrer')}
              variant="primary"
              size="sm"
              icon={ExternalLink}
              className="flex-1"
            >
              {t('schemeDetail.applyOfficial')}
            </ArrowFillButton>
          ) : (
            <div className="flex-1 text-center py-2 px-3 bg-[#F3F4F3] dark:bg-[#1E2924] rounded text-[11px] text-[#6F7A73] dark:text-[#8E9F97]">
              {t('schemeDetail.officialUnavailable')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
