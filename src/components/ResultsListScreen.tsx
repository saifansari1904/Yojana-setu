import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MatchResult, UserProfile } from '../types';
import { MatchGauge } from './MatchGauge';
import { TrustFooterStrip } from './TrustFooterStrip';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { EmptyState } from './common/EmptyState';
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
  ChevronDown,
  Info,
  FileCheck2,
  ShieldCheck,
  Building2,
  Globe,
  MapPin,
  Scale,
  X,
  IndianRupee,
  Compass,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { getSchemeCategories } from '../lib/data/normalization';
import { deriveSchemeTrustProfile } from '../lib/data/trustEngine';
import { getNextBestAction } from '../lib/matching/decisionEngine';
import { SchemeComparisonModal } from './SchemeComparisonModal';
import {
  BusinessProfileCard,
  BusinessNeedSummary,
  SupportPathway,
  SupportPathwayModal,
} from './business';
import { deriveBusinessNeedProfile, buildSupportPathway } from '../lib/business';
import type { PathwayAction } from '../types/supportPathway';
import { PathwayReportModal } from './PathwayReportModal';
import type { TrackedApplication } from '../types/tracker';
import {
  loadDocumentProgress,
  migrateLegacyDocumentProgress,
  toggleDocumentPrepared,
  saveDocumentProgress,
  getPreparedDocIds,
} from '../lib/tracker/documentProgress';
import {
  staggerContainer,
  staggerItem,
  fadeSlideUp,
} from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
import { ArrowFillButton, BookmarkButton, VerificationBadge } from './ui';

interface ResultsListScreenProps {
  matchResults: MatchResult[];
  userProfile: UserProfile | null;
  onOpenWhyMatch: (match: MatchResult) => void;
  onOpenWhyNotEligible: (match: MatchResult) => void;
  onEditProfile: () => void;
  onSelectScheme?: (match: MatchResult) => void;
  savedSchemeIds?: Set<string>;
  onToggleSaveScheme?: (schemeId: string) => void;
  /** Phase 4.3 — start (or enrich) a tracked application from the pathway. */
  onStartPathwayApplication?: (match: MatchResult, pathway: unknown) => void;
  applications?: TrackedApplication[];
  onOpenTracker?: () => void;
  /** Phase 5 — open guided preparation workspace. */
  onOpenWorkspace?: (match: MatchResult) => void;
}

export const ResultsListScreen: React.FC<ResultsListScreenProps> = ({
  matchResults,
  userProfile,
  onOpenWhyMatch,
  onOpenWhyNotEligible,
  onEditProfile,
  onSelectScheme,
  savedSchemeIds,
  onToggleSaveScheme,
  onStartPathwayApplication,
  applications,
  onOpenTracker,
  onOpenWorkspace,
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
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scheme Comparison State (up to 3 schemes)
  const [selectedForCompareIds, setSelectedForCompareIds] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const toggleCompareScheme = (schemeId: string) => {
    setSelectedForCompareIds((prev) => {
      if (prev.includes(schemeId)) {
        return prev.filter((id) => id !== schemeId);
      }
      if (prev.length >= 3) {
        // Replace oldest or cap at 3
        return [...prev.slice(1), schemeId];
      }
      return [...prev, schemeId];
    });
  };

  const removeCompareScheme = (schemeId: string) => {
    setSelectedForCompareIds((prev) => prev.filter((id) => id !== schemeId));
  };

  const clearComparison = () => {
    setSelectedForCompareIds([]);
    setIsComparisonOpen(false);
  };

  /* ============ PHASE 4.2 / 4.3 — SUPPORT PATHWAY & REPORT ============ */

  const [isPathwayModalOpen, setIsPathwayModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [docProgress, setDocProgress] = useState(() =>
    typeof window === 'undefined' ? {} : migrateLegacyDocumentProgress(),
  );

  const topMatch = matchResults.length > 0 ? matchResults[0] : null;
  const preparedDocIds = topMatch ? getPreparedDocIds(docProgress, topMatch.scheme.id) : [];

  /** Deterministic Phase 4.2 engine output — memoized, never recomputed per render. */
  const supportPathway = useMemo(() => {
    if (!userProfile || matchResults.length === 0) return null;
    return buildSupportPathway({
      profile: userProfile,
      matchResults,
      preparedDocIds,
      hasEngagedWithChecklist: preparedDocIds.length > 0,
      lang,
    });
  }, [userProfile, matchResults, preparedDocIds, lang]);

  const handlePathwayAction = (action: PathwayAction) => {
    switch (action.actionTarget) {
      case 'form':
        onEditProfile();
        return;
      case 'compare':
        setIsComparisonOpen(true);
        document.getElementById('scheme-results-tabs')?.scrollIntoView({ behavior: 'smooth' });
        return;
      case 'portal':
        if (action.actionUrl) window.open(action.actionUrl, '_blank', 'noopener,noreferrer');
        return;
      case 'checklist':
      case 'details':
        if (topMatch && onSelectScheme) {
          onSelectScheme(topMatch);
          return;
        }
        document
          .getElementById('support-pathway-preparation-checklist')
          ?.scrollIntoView({ behavior: 'smooth' });
        return;
      default:
        document.getElementById('support-pathway-stack')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePathwaySchemeSelect = (schemeId: string) => {
    const match = matchResults.find((m) => m.scheme.id === schemeId);
    if (match && onSelectScheme) onSelectScheme(match);
  };

  /** Phase 4.3 — checklist ticks write to the shared localStorage store. */
  const handlePathwayChecklistToggle = (itemId: string) => {
    if (!topMatch) return;
    setDocProgress((prev) => {
      const next = toggleDocumentPrepared(prev, topMatch.scheme.id, itemId);
      saveDocumentProgress(next);
      return next;
    });
  };

  /** Phase 4.3 — turn the pathway into a tracked application journey. */
  const handleStartApplication = () => {
    if (!topMatch || !supportPathway || !onStartPathwayApplication) return;
    onStartPathwayApplication(topMatch, supportPathway);
    if (onOpenTracker) onOpenTracker();
  };

  const isTopMatchTracked = Boolean(
    topMatch && (applications || []).some((a) => a.schemeId === topMatch.scheme.id),
  );

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
      const categories = getSchemeCategories(result.scheme);

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          locScheme.name.toLowerCase().includes(query) ||
          locScheme.sponsoringMinistry.toLowerCase().includes(query) ||
          locScheme.benefitSummary.toLowerCase().includes(query) ||
          categories.some((c) => c.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      if (selectedRegion === 'central') {
        if (result.scheme.applicableStates.length > 0) return false;
      } else if (selectedRegion !== 'all') {
        if (!result.scheme.applicableStates.includes(selectedRegion)) return false;
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

  const renderSchemeCard = (result: MatchResult, isTopPick: boolean = false) => {
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
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`yj-card yj-card-lg overflow-hidden hover:yj-elev-2 hover:border-[#0B5D4B] dark:hover:border-[#34D399] ${
          isNearMatch
            ? 'border-amber-300 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/20 to-transparent dark:from-amber-950/10'
            : isEligible
            ? 'border-[#C1E2D0] dark:border-[#22503E]'
            : 'border-[#E2E2E0] dark:border-[#24342D]'
        }`}
      >
        {isTopPick && (
          <div className="bg-[#14453D] dark:bg-[#1C5045] text-white px-4 py-1 text-[11px] font-bold flex items-center gap-1.5 border-b border-[#0B302B]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
            <span>{lang === 'hi' ? 'सर्वश्रेष्ठ अनुशंसा (शीर्ष मिलान)' : 'Top Recommendation (Highest Match)'}</span>
          </div>
        )}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Left Column: Match Gauge & Dual Status Pill */}
            <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:w-32 text-center">
              <MatchGauge
                percentage={result.matchPercentage}
                size={66}
                strokeWidth={6}
                layoutId={`scheme-gauge-${result.scheme.id}`}
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
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D4EFE1] dark:bg-[#1A382D] px-2 py-0.5 rounded uppercase tracking-wider">
                  {locScheme.schemeType}
                </span>

                {locScheme.applicableStates.length === 0 ? (
                  <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Central Scheme
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {locScheme.applicableStates.join(', ')} Scheme
                  </span>
                )}

                {/* Phase 2.5 Dynamic Data Trust Badge */}
                {(() => {
                  const trust = result.scheme.trustProfile || deriveSchemeTrustProfile(result.scheme);
                  const tier =
                    trust.verification.status === 'VERIFIED'
                      ? 'verified'
                      : trust.verification.status === 'PARTIALLY_VERIFIED'
                      ? 'partially-verified'
                      : 'in-review';
                  return <VerificationBadge tier={tier} />;
                })()}

                <span className="text-xs text-[#516A5F] dark:text-[#9EB0A7] font-medium">
                  {locScheme.sponsoringMinistry}
                </span>
              </div>

              <motion.h2
                layoutId={`scheme-title-${result.scheme.id}`}
                onClick={() => onSelectScheme?.(result)}
                className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2] hover:text-[#0B5D4B] dark:hover:text-[#4ADE80] transition-colors cursor-pointer"
              >
                {locScheme.name}
              </motion.h2>

              {/* Normalized Category Tags */}
              {(() => {
                const cats = getSchemeCategories(result.scheme);
                if (!cats || cats.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                    {cats.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-medium bg-[#F3F4F3] dark:bg-[#1E2924] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E2E2E0] dark:border-[#2A3C34] px-1.5 py-0.5 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                );
              })()}

              {/* Benefit Summary */}
              <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-1.5 leading-relaxed font-medium">
                {locScheme.benefitSummary}
              </p>

              {/* Progressive disclosure: collapsed match reasoning, expanded on demand.
                  Uses only factors already computed by the matching engine. */}
              {Array.isArray(result.breakdown) && result.breakdown.length > 0 && (
                <details className="group/why mt-3 rounded-[var(--yj-radius-md)] border border-[#E2E2E0] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#111714]">
                  <summary className="yj-focus-ring flex items-center justify-between gap-2 cursor-pointer list-none px-3 py-2 text-[11px] font-bold text-[#0B5D4B] dark:text-[#4ADE80] rounded-[var(--yj-radius-md)]">
                    <span>
                      {lang === 'hi' ? 'यह क्यों मेल खाता है' : 'Why it matches'}
                    </span>
                    <span className="flex items-center gap-2 font-semibold text-[#516A5F] dark:text-[#9EB0A7]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#16A34A] dark:text-[#4ADE80]" aria-hidden="true" />
                        {result.breakdown.filter((f) => f.matched || f.state === 'MATCHED').length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        {result.breakdown.filter((f) => f.state === 'UNKNOWN').length}
                      </span>
                      <ChevronDown
                        className="w-3.5 h-3.5 transition-transform duration-200 group-open/why:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>
                  <ul className="px-3 pb-2.5 pt-0.5 space-y-1">
                    {result.breakdown.slice(0, 5).map((factor) => (
                      <li
                        key={factor.factorKey}
                        className="flex items-start gap-1.5 text-[11px] text-[#3F4943] dark:text-[#9EB0A7]"
                      >
                        {factor.matched || factor.state === 'MATCHED' ? (
                          <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-[#16A34A] dark:text-[#4ADE80]" aria-hidden="true" />
                        ) : factor.state === 'UNKNOWN' ? (
                          <Info className="w-3 h-3 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-[#C2603F] dark:text-[#F87171]" aria-hidden="true" />
                        )}
                        <span>
                          <strong className="font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {factor.factorLabel}:
                          </strong>{' '}
                          {factor.matched || factor.state === 'MATCHED'
                            ? lang === 'hi'
                              ? 'मेल खाता है'
                              : 'Matched'
                            : factor.state === 'UNKNOWN'
                            ? lang === 'hi'
                              ? 'जानकारी आवश्यक'
                              : 'Needs information'
                            : lang === 'hi'
                            ? 'मेल नहीं खाता'
                            : 'Does not match'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

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

              {/* 5-Factor Compliance Pills with 3-State Indicators */}
              <div className="mt-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F7A73] dark:text-[#8E9F97] block mb-1.5">
                  {t('results.factorComplianceTitle')}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.breakdown.map((b) => {
                    const isMatched = b.state === 'MATCHED' || b.matched;
                    const isUnknown = b.state === 'UNKNOWN';

                    return (
                      <span
                        key={b.factorKey}
                        id={`factor-${locScheme.id}-${b.factorKey}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border ${
                          isMatched
                            ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]'
                            : isUnknown
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-[#FFDAD6] dark:bg-[#3D1A14] text-[#7C2C0F] dark:text-[#FCA5A5] border-[#FFCCBD] dark:border-[#5A2B20]'
                        }`}
                      >
                        {isMatched ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                        ) : isUnknown ? (
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#C2603F] dark:text-[#F87171] shrink-0" />
                        )}
                        <span>
                          {b.factorLabel}:{' '}
                          {isMatched
                            ? t('common.matched')
                            : isUnknown
                            ? (lang === 'hi' ? 'विवरण आवश्यक' : 'Needed')
                            : t('common.gap')}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Phase 4.1 Business-Need Relevance Layer (Independent Advisory Metric) */}
              {result.businessRelevance && result.businessRelevance.relevanceLevel !== 'UNKNOWN' && (
                <div
                  id={`business-relevance-${locScheme.id}`}
                  className={`mt-3.5 p-3 rounded-md border text-xs ${
                    result.businessRelevance.relevanceLevel === 'HIGH'
                      ? 'bg-[#EBF7F0] dark:bg-[#142C21] border-[#B2E4C9] dark:border-[#214D38]'
                      : result.businessRelevance.relevanceLevel === 'MEDIUM'
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                      : 'bg-[#F9F9F8] dark:bg-[#18201C] border-[#E2E2E0] dark:border-[#2A3C34]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#14453D] dark:text-[#34D399]" />
                      <span className="font-bold text-[#14453D] dark:text-[#E0E8E3]">
                        {lang === 'hi' ? 'व्यावसायिक आवश्यकता प्रासंगिकता:' : 'Business-Need Relevance:'}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                          result.businessRelevance.relevanceLevel === 'HIGH'
                            ? 'bg-[#16A34A] text-white'
                            : result.businessRelevance.relevanceLevel === 'MEDIUM'
                            ? 'bg-blue-600 text-white'
                            : 'bg-stone-500 text-white'
                        }`}
                      >
                        {lang === 'hi'
                          ? result.businessRelevance.relevanceLevel === 'HIGH'
                            ? 'उच्च प्रासंगिकता'
                            : result.businessRelevance.relevanceLevel === 'MEDIUM'
                            ? 'मध्यम'
                            : 'कम प्रासंगिकता'
                          : `${result.businessRelevance.relevanceLevel} FIT`}
                      </span>
                    </div>
                    {result.businessRelevance.matchedNeeds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.businessRelevance.matchedNeeds.map((n) => (
                          <span
                            key={n.needType}
                            className="text-[10px] font-semibold bg-white/90 dark:bg-[#1A2620] text-[#14453D] dark:text-[#4ADE80] border border-[#CDE3D7] dark:border-[#244335] px-1.5 py-0.5 rounded"
                          >
                            ✓ {lang === 'hi' ? n.labelHi : n.labelEn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#3F4943] dark:text-[#C5D5CC] leading-relaxed">
                    {lang === 'hi' ? result.businessRelevance.explanationHi : result.businessRelevance.explanationEn}
                  </p>
                  {(result.businessRelevance.fundingFitNoteEn || result.businessRelevance.fundingFitNoteHi) && (
                    <div className="mt-1.5 text-[10px] font-medium text-[#14453D] dark:text-[#4ADE80] flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 shrink-0" />
                      <span>
                        {lang === 'hi'
                          ? result.businessRelevance.fundingFitNoteHi
                          : result.businessRelevance.fundingFitNoteEn}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Authoritative Decision Layer: Next Best Action Callout */}
              {userProfile && (() => {
                const nextAction = getNextBestAction(result, userProfile, lang);
                return (
                  <div
                    id={`next-action-${locScheme.id}`}
                    className="mt-3.5 p-2.5 rounded-md bg-[#F4F8F6] dark:bg-[#16231C] border border-[#CDE3D7] dark:border-[#223F30] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#14453D] text-white dark:bg-[#34D399] dark:text-[#0B251F] px-1.5 py-0.5 rounded shrink-0">
                        {nextAction.badgeText}
                      </span>
                      <span className="text-[#1A1C1B] dark:text-[#E0E8E3] font-medium leading-tight">
                        <strong className="font-bold">{nextAction.title}:</strong>{' '}
                        <span className="text-[#516A5F] dark:text-[#9EB0A7]">
                          {nextAction.description}
                        </span>
                      </span>
                    </div>
                    {nextAction.actionUrl && (
                      <a
                        href={nextAction.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start sm:self-center font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline flex items-center gap-1 text-[11px] shrink-0"
                      >
                        <span>{nextAction.buttonLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })()}

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
                  <ArrowFillButton
                    id={`view-scheme-btn-${locScheme.id}`}
                    onClick={() => onSelectScheme?.(result)}
                    variant="primary"
                    size="sm"
                  >
                    {t('results.viewSchemeBtn')}
                  </ArrowFillButton>

                  {onOpenWorkspace && (
                    <motion.button
                      id={`prepare-workspace-btn-${locScheme.id}`}
                      type="button"
                      onClick={() => onOpenWorkspace(result)}
                      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                      className="bg-[#0F6B4C]/10 hover:bg-[#0F6B4C]/20 dark:bg-[#4ADE80]/15 dark:hover:bg-[#4ADE80]/25 text-[#0F6B4C] dark:text-[#4ADE80] border border-[#0F6B4C]/30 dark:border-[#4ADE80]/30 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'आवेदन तैयारी' : 'Prepare Application'}</span>
                    </motion.button>
                  )}

                  <motion.button
                    id={`why-match-btn-${locScheme.id}`}
                    type="button"
                    onClick={() => onOpenWhyMatch(result)}
                    whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                    className="bg-white dark:bg-[#1E2924] hover:bg-[#F3F4F3] dark:hover:bg-[#26352E] text-[#14453D] dark:text-[#4ADE80] border border-[#E2E2E0] dark:border-[#2E4137] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t('results.whyMatchBtn')}</span>
                  </motion.button>

                  {/* Side-by-side comparison selector */}
                  {(() => {
                    const isSelectedForCompare = selectedForCompareIds.includes(result.scheme.id);
                    return (
                      <motion.button
                        id={`compare-toggle-btn-${locScheme.id}`}
                        type="button"
                        onClick={() => toggleCompareScheme(result.scheme.id)}
                        whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          isSelectedForCompare
                            ? 'bg-[#14453D] text-white border-[#14453D] dark:bg-[#34D399] dark:text-[#0B251F]'
                            : 'bg-white dark:bg-[#1E2924] text-[#516A5F] dark:text-[#9EB0A7] border-[#E2E2E0] dark:border-[#2E4137] hover:bg-[#F3F4F3] dark:hover:bg-[#25362C]'
                        }`}
                        title={
                          isSelectedForCompare
                            ? (lang === 'hi' ? 'तुलना सूची से हटाएं' : 'Remove from comparison')
                            : (lang === 'hi' ? 'तुलना हेतु 3 तक योजनाएं चुनें' : 'Select up to 3 schemes to compare')
                        }
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>
                          {isSelectedForCompare
                            ? (lang === 'hi' ? 'तुलना में शामिल ✓' : 'Comparing ✓')
                            : (lang === 'hi' ? 'तुलना करें' : 'Compare')}
                        </span>
                      </motion.button>
                    );
                  })()}

                  {onToggleSaveScheme && (
                    <BookmarkButton
                      id={`bookmark-btn-${locScheme.id}`}
                      isSaved={savedSchemeIds?.has(locScheme.id) ?? false}
                      onToggle={() => onToggleSaveScheme(locScheme.id)}
                      schemeName={locScheme.name}
                      compact={false}
                    />
                  )}

                  {!isEligible && (
                    <motion.button
                      id={`gap-analysis-btn-${locScheme.id}`}
                      type="button"
                      onClick={() => onOpenWhyNotEligible(result)}
                      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                      className="bg-[#FAFAF9] dark:bg-[#101613] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1A14]/70 text-[#7C2C0F] dark:text-[#FCA5A5] border border-[#FFCCBD] dark:border-[#5A2B20] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C2603F] dark:text-[#F87171]" />
                      <span>{lang === 'hi' ? 'शर्त विश्लेषण एवं विकल्प' : 'Gap Analysis & Alternatives'}</span>
                    </motion.button>
                  )}
                </div>

                <a
                  id={`official-link-${locScheme.id}`}
                  href={locScheme.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
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
        <div className="yj-card p-8 sm:p-10 shadow-xs">
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
        <h1 className="yj-h1 text-[#0F1512] dark:text-[#F0F4F2]">
          {t('results.title')}
        </h1>
        {/* Plain-language count summary sits directly under the headline */}
        <p className="yj-body mt-2 text-[#42544C] dark:text-[#A9BDB3]">
          {lang === 'hi'
            ? `आपकी प्रोफ़ाइल के आधार पर ${matchResults.length} योजनाएं मिलीं।`
            : `We found ${matchResults.length} schemes based on your profile.`}
        </p>
        <p className="yj-support text-[#6F7A73] dark:text-[#8E9F97] max-w-xl mx-auto mt-1">
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
        className="yj-card p-5 sm:p-6 mb-6"
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
            <h2 className="yj-h2 text-[#0F1512] dark:text-[#F0F4F2]">
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

      {/* Phase 4.1 Entrepreneur Business Profile & Need Intelligence */}
      {(() => {
        if (!userProfile) return null;
        const effectiveNeedProfile =
          userProfile.businessNeedProfile || deriveBusinessNeedProfile(userProfile);
        if (!effectiveNeedProfile) return null;

        return (
          <div className="mb-6 space-y-4">
            <BusinessNeedSummary
              needProfile={effectiveNeedProfile}
              onCompleteProfile={onEditProfile}
            />
            <BusinessProfileCard
              needProfile={effectiveNeedProfile}
              businessProfile={userProfile.businessProfile}
              onEditProfile={onEditProfile}
            />
          </div>
        );
      })()}

      {/* Phase 4.2 / 4.3 Support Pathway Quick Action Bar — Clean & Uncluttered */}
      {supportPathway && (
        <div
          id="results-support-pathway-bar"
          className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-[#D4EFE1] dark:border-[#1E3E32] bg-[#F4F8F6] dark:bg-[#12221B] shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#14453D] dark:bg-[#1C5045] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-5 h-5 text-[#4ADE80]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#14453D] dark:text-[#E2EBE6]">
                  {lang === 'hi' ? 'उद्यम सहायता मार्ग' : 'Enterprise Support Pathway'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D4EFE1] dark:bg-[#1C5045] text-[#0F6B4C] dark:text-[#6EE7B7]">
                  {lang === 'hi'
                    ? supportPathway.currentStageLabelHi
                    : supportPathway.currentStageLabelEn}
                </span>
              </div>
              <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] truncate">
                {lang === 'hi'
                  ? `अनुशंसित अगला कदम: ${supportPathway.nextBestAction.titleHi}`
                  : `Next recommended step: ${supportPathway.nextBestAction.titleEn}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
            <button
              id="open-support-pathway-modal-btn"
              type="button"
              onClick={() => setIsPathwayModalOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#14453D] dark:bg-[#1C5045] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0F3730] dark:hover:bg-[#163E36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-[#4ADE80]" aria-hidden="true" />
              <span>{lang === 'hi' ? 'मार्गदर्शन योजना देखें' : 'View Support Pathway'}</span>
            </button>

            <button
              id="open-pathway-report-btn"
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#B2CDBF] dark:border-[#285743] bg-white dark:bg-[#162922] px-3 py-1.5 text-xs font-bold text-[#14453D] dark:text-[#C7D6CE] hover:bg-[#EAEFEA] dark:hover:bg-[#1F332B] transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{lang === 'hi' ? 'रिपोर्ट (PDF)' : 'Report (PDF)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Support Pathway Modal (Non-cluttering overlay) */}
      {isPathwayModalOpen && supportPathway && (
        <SupportPathwayModal
          isOpen={isPathwayModalOpen}
          onClose={() => setIsPathwayModalOpen(false)}
          pathway={supportPathway}
          onAction={handlePathwayAction}
          onSelectScheme={handlePathwaySchemeSelect}
          onToggleChecklistItem={handlePathwayChecklistToggle}
          onStartPathwayApplication={
            onStartPathwayApplication && topMatch ? handleStartApplication : undefined
          }
          isTopMatchTracked={isTopMatchTracked}
          onOpenReport={() => {
            setIsPathwayModalOpen(false);
            setIsReportOpen(true);
          }}
        />
      )}

      {isReportOpen && supportPathway && (
        <PathwayReportModal
          pathway={supportPathway}
          matchResults={matchResults}
          userProfile={userProfile}
          applications={applications}
          onClose={() => setIsReportOpen(false)}
        />
      )}

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

      {/* South India Regional Jurisdiction Filter */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 py-2 px-3 bg-[#F3F4F3] dark:bg-[#1A2520] rounded border border-[#E2E2E0] dark:border-[#24342D] text-xs">
        <span className="text-[#516A5F] dark:text-[#9EB0A7] font-semibold flex items-center gap-1 mr-1">
          <MapPin className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
          <span>{lang === 'hi' ? 'क्षेत्रीय फिल्टर:' : 'Jurisdiction:'}</span>
        </span>
        {[
          { id: 'all', label: lang === 'hi' ? 'सभी क्षेत्र' : 'All Regions' },
          { id: 'central', label: lang === 'hi' ? 'केंद्रीय योजनाएं' : 'Central / Pan-India' },
          { id: 'Karnataka', label: 'Karnataka' },
          { id: 'Kerala', label: 'Kerala' },
          { id: 'Tamil Nadu', label: 'Tamil Nadu' },
          { id: 'Telangana', label: 'Telangana' },
          { id: 'Andhra Pradesh', label: 'Andhra Pradesh' },
        ].map((reg) => (
          <button
            key={reg.id}
            onClick={() => setSelectedRegion(reg.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              selectedRegion === reg.id
                ? 'bg-[#14453D] dark:bg-[#1C5045] text-white shadow-xs'
                : 'bg-white dark:bg-[#151C19] text-[#3F4943] dark:text-[#9EB0A7] border border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#202D27]'
            }`}
          >
            {reg.label}
          </button>
        ))}
      </div>

      {totalFilteredCount === 0 && (
        <EmptyState
          title={
            searchQuery
              ? lang === 'hi'
                ? `"${searchQuery}" के लिए कोई योजना नहीं मिली`
                : `No schemes found for "${searchQuery}"`
              : t('results.noSchemesFound')
          }
          description={
            searchQuery
              ? lang === 'hi'
                ? 'कृपया अन्य कीवर्ड खोजें या फ़िल्टर रीसेट करें।'
                : 'Try checking for typos or searching by ministry or broad trade domain.'
              : undefined
          }
          type={searchQuery ? 'search' : 'filter'}
          actionLabel={lang === 'hi' ? 'फ़िल्टर रीसेट करें' : 'Reset Search & Filters'}
          onAction={() => {
            setSearchQuery('');
            setActiveTab('all');
          }}
        />
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
                whileInView={shouldReduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 'some' }}
                className="space-y-4"
              >
                {filteredEligible.map((result, idx) => renderSchemeCard(result, idx === 0 && result.matchPercentage >= 80))}
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
                whileInView={shouldReduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 'some' }}
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
                whileInView={shouldReduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 'some' }}
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
          {filteredEligible.map((result, idx) => renderSchemeCard(result, idx === 0 && result.matchPercentage >= 80))}
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

      {/* Floating Scheme Comparison Action Bar */}
      <AnimatePresence>
        {selectedForCompareIds.length > 0 && (
          <motion.div
            id="floating-compare-bar"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#14453D] text-white px-4 sm:px-6 py-3 rounded-full shadow-2xl border border-[#34D399]/50 flex items-center gap-3 sm:gap-5 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-[#34D399]" />
              <div className="text-xs sm:text-sm font-bold whitespace-nowrap">
                <span>{selectedForCompareIds.length} / 3 </span>
                <span className="text-[#34D399]">
                  {lang === 'hi' ? 'योजनाएं चयनित' : 'Schemes Selected'}
                </span>
              </div>
            </div>

            {selectedForCompareIds.length >= 2 ? (
              <button
                id="open-comparison-dialog-btn"
                type="button"
                onClick={() => setIsComparisonOpen(true)}
                className="bg-[#34D399] hover:bg-[#28B781] text-[#0B251F] text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>{lang === 'hi' ? 'तुलना करें' : 'Compare Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-[#A0B0A7] hidden sm:inline">
                {lang === 'hi' ? '(कम से कम 2 चुनें)' : '(Select at least 2)'}
              </span>
            )}

            <button
              id="clear-comparison-selection-btn"
              type="button"
              onClick={clearComparison}
              className="p-1 text-[#A0B0A7] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title={lang === 'hi' ? 'चयन हटाएं' : 'Clear selection'}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-side Scheme Comparison Modal */}
      {userProfile && (
        <SchemeComparisonModal
          isOpen={isComparisonOpen}
          selectedMatches={matchResults.filter((m) =>
            selectedForCompareIds.includes(m.scheme.id)
          )}
          profile={userProfile}
          onClose={() => setIsComparisonOpen(false)}
          onSelectScheme={onSelectScheme}
          onRemoveScheme={removeCompareScheme}
        />
      )}

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

