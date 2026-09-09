import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MatchResult, UserProfile } from '../types';
import { MatchGauge } from './MatchGauge';
import { TrustFooterStrip } from './TrustFooterStrip';
import { YojanaSetuLogo } from './YojanaSetuLogo';
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
  Info,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import {
  staggerContainer,
  staggerItem,
  fadeSlideUp,
} from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';

interface ResultsListScreenProps {
  matchResults: MatchResult[];
  userProfile: UserProfile | null;
  onOpenWhyMatch: (match: MatchResult) => void;
  onOpenWhyNotEligible: (match: MatchResult) => void;
  onEditProfile: () => void;
  onSelectScheme?: (match: MatchResult) => void;
}

export const ResultsListScreen: React.FC<ResultsListScreenProps> = ({
  matchResults,
  userProfile,
  onOpenWhyMatch,
  onOpenWhyNotEligible,
  onEditProfile,
  onSelectScheme,
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
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<'all' | 'eligible' | 'near' | 'subsidized'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

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
      if (
        searchQuery &&
        !locScheme.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !locScheme.sponsoringMinistry.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !locScheme.benefitSummary.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
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

  const renderSchemeCard = (result: MatchResult) => {
    const locScheme = getLocalizedScheme(result.scheme);
    const isEligible = result.matchStatus === 'eligible';
    const isNearMatch = result.matchStatus === 'near-match';

    return (
      <motion.article
        key={result.scheme.id}
        id={`scheme-card-${result.scheme.id}`}
        variants={shouldReduceMotion ? undefined : staggerItem}
        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
        transition={transitions.fast}
        className={`bg-white dark:bg-[#151C19] rounded-md border shadow-xs overflow-hidden transition-colors hover:border-[#14453D] dark:hover:border-[#34D399] ${
          isNearMatch
            ? 'border-amber-300 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/20 to-transparent dark:from-amber-950/10'
            : isEligible
            ? 'border-[#C1E2D0] dark:border-[#22503E]'
            : 'border-[#E2E2E0] dark:border-[#24342D]'
        }`}
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Left Column: Match Gauge & Dual Status Pill */}
            <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:w-32 text-center">
              <MatchGauge
                percentage={result.matchPercentage}
                size={66}
                strokeWidth={6}
              />
              <div className="text-left sm:text-center">
                <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] block">
                  {t('results.matchScoreLabel')}
                </span>

                {/* Status Pill: Distinctive and High Contrast */}
                <div className="mt-1">
                  {isEligible ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border border-[#B2CDBF] dark:border-[#285743]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
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
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D4EFE1] dark:bg-[#1A382D] px-2 py-0.5 rounded uppercase tracking-wider">
                  {locScheme.schemeType}
                </span>
                <span className="text-xs text-[#516A5F] dark:text-[#9EB0A7] font-medium">
                  {locScheme.sponsoringMinistry}
                </span>
              </div>

              <h2
                onClick={() => onSelectScheme?.(result)}
                className="text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2] tracking-tight hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors cursor-pointer"
              >
                {locScheme.name}
              </h2>

              {/* Benefit Summary */}
              <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-1.5 leading-relaxed font-medium">
                {locScheme.benefitSummary}
              </p>

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
              <div className="mt-3.5 flex flex-wrap items-center gap-4 bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#24342D] p-2.5 rounded text-xs">
                <div>
                  <span className="text-[#6F7A73] dark:text-[#8E9F97] text-[11px] block">
                    {t('results.fundingQuantumLabel')}
                  </span>
                  <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                    {locScheme.fundingRangeText}
                  </strong>
                </div>
                {locScheme.subsidyRatePercent && locScheme.subsidyRatePercent > 0 ? (
                  <div className="border-l border-[#E2E2E0] dark:border-[#24342D] pl-4">
                    <span className="text-[#6F7A73] dark:text-[#8E9F97] text-[11px] block">
                      {t('results.capitalSubsidyLabel')}
                    </span>
                    <strong className="text-[#16A34A] dark:text-[#4ADE80] font-bold text-sm">
                      {locScheme.subsidyRatePercent}% {t('results.govtGrant')}
                    </strong>
                  </div>
                ) : null}
                <div className="border-l border-[#E2E2E0] dark:border-[#24342D] pl-4">
                  <span className="text-[#6F7A73] dark:text-[#8E9F97] text-[11px] block">
                    {t('results.baseInterestLabel')}
                  </span>
                  <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold text-sm">
                    {locScheme.baseInterestRate}{t('common.paisaPerAnnum')}
                  </strong>
                </div>
              </div>

              {/* 5-Factor Compliance Pills */}
              <div className="mt-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F7A73] dark:text-[#8E9F97] block mb-1.5">
                  {t('results.factorComplianceTitle')}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.breakdown.map((b) => (
                    <span
                      key={b.factorKey}
                      id={`factor-${locScheme.id}-${b.factorKey}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border ${
                        b.matched
                          ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]'
                          : 'bg-[#FFDAD6] dark:bg-[#3D1A14] text-[#7C2C0F] dark:text-[#FCA5A5] border-[#FFCCBD] dark:border-[#5A2B20]'
                      }`}
                    >
                      {b.matched ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#C2603F] dark:text-[#F87171] shrink-0" />
                      )}
                      <span>
                        {b.factorLabel}: {b.matched ? t('common.matched') : t('common.gap')}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Documents Section */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] flex items-center gap-1">
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
              <div className="mt-5 pt-4 border-t border-[#E2E2E0] dark:border-[#24342D] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id={`view-scheme-btn-${locScheme.id}`}
                    onClick={() => onSelectScheme?.(result)}
                    className="bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-3.5 py-2 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{t('results.viewSchemeBtn')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`why-match-btn-${locScheme.id}`}
                    onClick={() => onOpenWhyMatch(result)}
                    className="bg-white dark:bg-[#1E2924] hover:bg-[#F3F4F3] dark:hover:bg-[#26352E] text-[#14453D] dark:text-[#4ADE80] border border-[#E2E2E0] dark:border-[#2E4137] px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t('results.whyMatchBtn')}</span>
                  </button>

                  {!isEligible && (
                    <button
                      id={`gap-analysis-btn-${locScheme.id}`}
                      onClick={() => onOpenWhyNotEligible(result)}
                      className="bg-[#FAFAF9] dark:bg-[#101613] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1A14]/70 text-[#7C2C0F] dark:text-[#FCA5A5] border border-[#FFCCBD] dark:border-[#5A2B20] px-3 py-2 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C2603F] dark:text-[#F87171]" />
                      <span>{lang === 'hi' ? 'शर्त विश्लेषण एवं विकल्प' : 'Gap Analysis & Alternatives'}</span>
                    </button>
                  )}
                </div>

                <a
                  id={`official-link-${locScheme.id}`}
                  href={locScheme.officialPortalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:text-[#16A34A] dark:hover:text-[#6EE7B7] hover:underline flex items-center gap-1"
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
        <div className="bg-white dark:bg-[#151C19] rounded-md border border-[#E2E2E0] dark:border-[#24342D] p-8 sm:p-10 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center mx-auto mb-4">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
            {lang === 'hi' ? 'पात्रता प्रोफ़ाइल आवश्यक है' : 'Eligibility Profile Required'}
          </h2>
          <p className="text-sm text-[#516A5F] dark:text-[#9EB0A7] mb-6 max-w-md mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'सटीक सरकारी योजनाओं की पात्रता, स्कोर और शर्त विश्लेषण प्राप्त करने के लिए कृपया अपनी प्रोफ़ाइल विवरण भरें।'
              : 'Please enter your profile details to evaluate exact statutory criteria, compute match scores, and discover tailored schemes.'}
          </p>
          <button
            id="start-eligibility-btn"
            onClick={onEditProfile}
            className="bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-6 py-2.5 rounded text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>{lang === 'hi' ? 'पात्रता फॉर्म भरें' : 'Complete Eligibility Form'}</span>
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
          <span className="font-bold text-xs uppercase tracking-widest text-[#14453D] dark:text-[#34D399]">
            {t('common.appName')} · {t('results.badge')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] tracking-tight">
          {t('results.title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#516A5F] dark:text-[#8E9F97] max-w-xl mx-auto mt-1">
          {lang === 'hi'
            ? 'आपकी व्यक्तिगत प्रोफ़ाइल एवं आवश्यकता के आधार पर सत्यापित सरकारी ऋण व सब्सिडी योजनाएं'
            : 'Personalized statutory evaluation of central and state credit and subsidy schemes tailored to your entrepreneurial profile'}
        </p>
      </motion.div>

      {/* Live Verified Schemes Match Banner */}
      <motion.div
        id="results-verified-banner"
        variants={shouldReduceMotion ? undefined : fadeSlideUp}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="mb-6 p-4 rounded-md border border-[#C1E2D0] dark:border-[#22503E] bg-[#D4EFE1]/40 dark:bg-[#143327]/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] animate-ping opacity-75 absolute inline-flex"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] relative inline-flex"></span>
          </div>
          <p className="text-xs sm:text-sm text-[#14453D] dark:text-[#D4EFE1]">
            <span>{lang === 'hi' ? 'सफलतापूर्वक विश्लेषित योजनाएं: ' : 'Analyzed Schemes: '}</span>
            <strong className="text-base font-extrabold underline decoration-[#16A34A] dark:decoration-[#4ADE80] inline-flex items-center gap-1">
              <AnimatedCounter value={matchResults.length} />
              <span>{t('results.tabAll').toLowerCase()}</span>
            </strong>{' '}
            <span className="text-xs text-[#516A5F] dark:text-[#8E9F97]">
              ({lang === 'hi'
                ? `उच्च पात्रता: ${eligibleMatches.length} | आंशिक पात्रता: ${nearMatches.length}`
                : `High Eligibility: ${eligibleMatches.length} | Near Matches: ${nearMatches.length}`})
            </span>
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#14453D] dark:text-[#4ADE80] bg-white/80 dark:bg-[#101613]/80 px-2.5 py-1 rounded border border-[#C1E2D0] dark:border-[#24342D] whitespace-nowrap flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
          <span>{lang === 'hi' ? '100% वैधानिक नियम सत्यापित' : '100% Statutory Criteria Verified'}</span>
        </span>
      </motion.div>

      {/* Top Banner: Profile snapshot + Match summary */}
      <motion.div
        variants={shouldReduceMotion ? undefined : fadeSlideUp}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="bg-white dark:bg-[#151C19] rounded-md border border-[#E2E2E0] dark:border-[#24342D] p-5 sm:p-6 mb-6 shadow-xs transition-colors duration-200"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80] bg-[#D4EFE1] dark:bg-[#1A382D] px-2.5 py-0.5 rounded">
                {t('results.badge')}
              </span>
              <span className="text-xs text-[#516A5F] dark:text-[#9EB0A7]">
                {matchResults.length} {t('results.schemesAnalyzed')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] tracking-tight">
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
                  ? ` · ${
                      userProfile.ruralUrban === 'rural'
                        ? lang === 'hi'
                          ? 'ग्रामीण'
                          : 'Rural'
                        : lang === 'hi'
                        ? 'शहरी'
                        : 'Urban'
                    }`
                  : ''}
                {userProfile.businessStage
                  ? ` · ${
                      userProfile.businessStage === 'new'
                        ? lang === 'hi'
                          ? 'नया उद्यम'
                          : 'New Setup'
                        : userProfile.businessStage === 'expanding'
                        ? lang === 'hi'
                          ? 'विस्तार'
                          : 'Expansion'
                        : lang === 'hi'
                        ? 'सक्रिय उद्यम'
                        : 'Existing Unit'
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
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E2E2E0] dark:border-[#24342D] text-center">
          <button
            type="button"
            onClick={() => handleTabChange('eligible')}
            className={`rounded p-2.5 cursor-pointer transition-all text-center ${
              activeTab === 'eligible'
                ? 'bg-[#D4EFE1] dark:bg-[#1A382D] border-2 border-[#14453D] dark:border-[#34D399] shadow-xs'
                : 'bg-[#D4EFE1]/50 dark:bg-[#16382B]/60 border border-[#D4EFE1] dark:border-[#235845] hover:border-[#14453D]'
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
                : 'bg-[#F3F4F3] dark:bg-[#1B2420] border border-[#E2E2E0] dark:border-[#293B33] hover:border-[#516A5F]'
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

      {/* Tabs & Search Bar */}
      <div id="scheme-results-tabs" className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            id="tab-all"
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#14453D] dark:bg-[#1C5045] text-white'
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
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
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
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
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
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
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
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
            className="w-full px-3 py-1.5 bg-white dark:bg-[#151C19] border border-[#E2E2E0] dark:border-[#2A3C34] rounded text-xs text-[#1A1C1B] dark:text-[#F0F4F2] placeholder-[#6F7A73] dark:placeholder-[#6C7E76] focus:outline-none focus:border-[#14453D] dark:focus:border-[#34D399]"
          />
        </div>
      </div>

      {totalFilteredCount === 0 && (
        <div className="bg-white dark:bg-[#151C19] rounded-md border border-[#E2E2E0] dark:border-[#24342D] p-8 text-center text-sm text-[#516A5F] dark:text-[#9EB0A7]">
          {t('results.noSchemesFound')}
        </div>
      )}

      {/* RENDER GROUPED SECTIONS (When Tab is 'all') */}
      {activeTab === 'all' && (
        <div className="space-y-8">
          {/* 1. Best Matches Section */}
          {filteredEligible.length > 0 && (
            <section id="section-best-matches">
              <div className="mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] dark:bg-[#4ADE80]" />
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
                animate={shouldReduceMotion ? undefined : 'visible'}
                className="space-y-4"
              >
                {filteredEligible.map((result) => renderSchemeCard(result))}
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
                animate={shouldReduceMotion ? undefined : 'visible'}
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
                animate={shouldReduceMotion ? undefined : 'visible'}
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
          {filteredEligible.map((result) => renderSchemeCard(result))}
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
      <div className="mt-8 p-5 bg-[#F3F4F3] dark:bg-[#151C19] border border-[#E2E2E0] dark:border-[#24342D] rounded-md flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200">
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
          className="bg-white dark:bg-[#1C2521] hover:bg-[#EEEEED] dark:hover:bg-[#25322C] text-[#1A1C1B] dark:text-[#F0F4F2] border border-[#E2E2E0] dark:border-[#2A3C34] px-4 py-2 rounded text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <span>{t('results.altSectionBtn')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

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
            className="fixed bottom-6 right-6 z-40 bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-3.5 py-2.5 rounded-full shadow-lg border border-[#34D399]/40 flex items-center gap-2 cursor-pointer group"
            title={lang === 'hi' ? 'पोर्टल के शीर्ष पर जाएं' : 'Scroll to top of matched schemes'}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-[#34D399]" />
            <span className="text-xs font-bold pr-1">
              {lang === 'hi' ? 'ऊपर जाएं' : 'Top'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

