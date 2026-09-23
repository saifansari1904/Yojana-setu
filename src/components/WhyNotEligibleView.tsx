import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MatchResult, UserProfile } from '../types';
import { MatchGauge } from './MatchGauge';
import { TrustFooterStrip } from './TrustFooterStrip';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ShieldX,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import {
  getProfileCompatibilityReason,
  getWhyNotEligibleText,
} from '../i18n/whyNotEligibleI18n';
import { getNextBestAction } from '../i18n/decisionActionI18n';
import { buildMatchExplanation } from '../lib/matching/explanationBuilder';
import { findAlternativeSchemes } from '../lib/matching/matchingEngine';
import {
  fadeSlideUp,
  staggerContainer,
  staggerItem,
  popIn,
} from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
import { GapDiffBar } from '../animations/GapDiffBar';

interface WhyNotEligibleViewProps {
  targetMatch: MatchResult | null;
  allMatches: MatchResult[];
  userProfile: UserProfile | null;
  onBackToResults: () => void;
  onSelectAlternative: (match: MatchResult) => void;
}

export const WhyNotEligibleView: React.FC<WhyNotEligibleViewProps> = ({
  targetMatch,
  allMatches,
  userProfile,
  onBackToResults,
  onSelectAlternative,
}) => {
  const { t, getLocalizedScheme, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  if (!targetMatch) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="yj-card p-8 shadow-xs">
          <button
            onClick={onBackToResults}
            className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline mb-4 inline-flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('whyNotEligible.backBtn')}</span>
          </button>
          <p className="text-sm text-[#516A5F] dark:text-[#9EB0A7]">
            {t('whyNotEligible.noSchemeSelected')}
          </p>
        </div>
      </div>
    );
  }

  const { scheme, matchPercentage, breakdown, primaryGap } = targetMatch;

  // Compute alternatives on-demand for this single scheme (~50ms) instead of
  // precomputing for all 253 non-eligible schemes upfront (~3.7s).
  const recommendedAlternatives = useMemo(() => {
    if (targetMatch.recommendedAlternatives) return targetMatch.recommendedAlternatives;
    if (!userProfile || allMatches.length === 0) return undefined;
    const allSchemes = allMatches.map((m) => m.scheme);
    return findAlternativeSchemes(scheme, allSchemes, userProfile, lang);
  }, [targetMatch, scheme, allMatches, userProfile, lang]);
  const locScheme = getLocalizedScheme(scheme);

  const unmetCriteria = breakdown.filter((b) => !b.matched);
  const metCriteria = breakdown.filter((b) => b.matched);

  // Build list of display alternatives from recommendedAlternatives or top matches
  const displayAlternatives: {
    match: MatchResult;
    reason?: string;
  }[] = [];

  if (recommendedAlternatives && recommendedAlternatives.length > 0) {
    recommendedAlternatives.forEach((alt) => {
      const foundMatch = allMatches.find((m) => m.scheme.id === alt.scheme.id);
      if (foundMatch) {
        displayAlternatives.push({
          match: foundMatch,
          reason: alt.reason,
        });
      }
    });
  }

  // If fewer than 3, backfill from other high-scoring schemes
  if (displayAlternatives.length < 3) {
    const existingIds = new Set(displayAlternatives.map((d) => d.match.scheme.id));
    existingIds.add(scheme.id);

    const backfills = allMatches
      .filter((m) => !existingIds.has(m.scheme.id) && m.matchPercentage >= 50)
      .slice(0, 3 - displayAlternatives.length);

    backfills.forEach((bf) => {
      displayAlternatives.push({
        match: bf,
        reason: getProfileCompatibilityReason(bf.matchPercentage, lang),
      });
    });
  }

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : fadeSlideUp}
      initial={shouldReduceMotion ? undefined : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
      transition={shouldReduceMotion ? reducedMotionTransition : transitions.smooth}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Back button */}
      <motion.button
        id="back-to-results-btn"
        onClick={onBackToResults}
        whileHover={shouldReduceMotion ? undefined : { x: -3 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14453D] dark:text-[#4ADE80] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] mb-6 cursor-pointer transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('whyNotEligible.backBtn')}</span>
      </motion.button>

      {/* Primary Gap Analysis Card */}
      <motion.div
        variants={shouldReduceMotion ? undefined : fadeSlideUp}
        className="yj-card shadow-xs overflow-hidden mb-8 transition-colors duration-200"
      >
        <div className="border-t-4 border-[#C2603F] dark:border-[#E05338] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C2603F] dark:text-[#F87171] bg-[#FFDAD6] dark:bg-[#3D1A14] px-2.5 py-0.5 rounded">
                  {t('whyNotEligible.badge')}
                </span>
                {targetMatch.eligibilityClassification === 'BLOCKED' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                    <ShieldX className="w-3.5 h-3.5" />
                    <span>{getWhyNotEligibleText('statutoryBlocker', lang)}</span>
                  </span>
                ) : targetMatch.eligibilityClassification === 'NEEDS_INFORMATION' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{getWhyNotEligibleText('profileInfoNeeded', lang)}</span>
                  </span>
                ) : null}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mt-2">
                {locScheme.shortCode} {t('whyNotEligible.title')}
              </h1>
              <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">{locScheme.sponsoringMinistry}</p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <MatchGauge percentage={matchPercentage} size={68} strokeWidth={6} />
              <div className="text-left">
                <span className="text-xs font-bold text-[#C2603F] dark:text-[#F87171] block">
                  {unmetCriteria.length} {t('whyNotEligible.conditionsUnmet')}
                </span>
                <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97]">{t('whyNotEligible.transparentAudit')}</span>
              </div>
            </div>
          </div>

          {/* Actionable Next Step Card */}
          {userProfile && (() => {
            const nextAction = getNextBestAction(targetMatch, userProfile, lang);
            return (
              <div
                id="gap-next-action-card"
                className="mb-6 p-4 rounded-md bg-[#F4F8F6] dark:bg-[#16241D] border border-[#D9E8DF] dark:border-[#223F30] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#14453D] text-white dark:bg-[#4ADE80] dark:text-[#0B251F] px-1.5 py-0.5 rounded">
                      {getWhyNotEligibleText('actionableNextStep', lang)}
                    </span>
                    <span className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {nextAction.badgeText}
                    </span>
                  </div>
                  <strong className="text-sm text-[#1A1C1B] dark:text-[#F0F4F2] block">
                    {nextAction.title}
                  </strong>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5">
                    {nextAction.description}
                  </p>
                </div>
                {nextAction.actionUrl && (
                  <a
                    href={nextAction.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#14453D] hover:bg-[#0E352E] dark:bg-[#4ADE80] dark:hover:bg-[#28B781] text-white dark:text-[#0B251F] font-bold px-4 py-2 rounded transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                  >
                    <span>{nextAction.buttonLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })()}

          {/* Primary Gap Highlight Spotlight */}
          {primaryGap && (
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-md mb-6"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      {t('results.primaryGapLabel')} {primaryGap.factorLabel}
                    </span>
                    <span className="text-[11px] font-bold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                      {primaryGap.gapDistance || t('common.statutoryLimitation')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-2.5 bg-white dark:bg-[#151C19] border border-amber-200 dark:border-amber-900/60 rounded text-xs">
                    <div>
                      <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                        {t('whyNotEligible.yourProfileValue')}
                      </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">{primaryGap.userValue}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase font-semibold">
                        {t('modal.statutoryReqLabel')}
                      </span>
                      <strong className="text-amber-800 dark:text-amber-300">{primaryGap.statutoryRequirement}</strong>
                    </div>
                  </div>

                  {/* Animated distance-to-requirement bar */}
                  <GapDiffBar
                    id="primary-gap-diff-bar"
                    yourLabel={t('whyNotEligible.yourProfileValue')}
                    requiredLabel={t('modal.statutoryReqLabel')}
                    yourValue={String(primaryGap.userValue)}
                    requiredValue={String(primaryGap.statutoryRequirement)}
                    closeness={Math.min(0.9, Math.max(0.1, matchPercentage / 100))}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Supportive Guidance Note */}
          <div className="p-4 bg-[#FFDAD6]/25 dark:bg-[#3D1A14]/40 border border-[#FFCCBD] dark:border-[#5A2B20] rounded mb-6 text-xs text-[#1F2421] dark:text-[#E2E8E4] leading-relaxed">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C2603F] dark:text-[#F87171] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-[#7C2C0F] dark:text-[#FCA5A5] block mb-0.5">
                  {t('whyNotEligible.guidanceTitle')}
                </strong>
                {t('whyNotEligible.guidanceDesc')}
              </div>
            </div>
          </div>

          {/* Specific Unmatched Criteria Breakdown with Stagger */}
          <div className="space-y-3 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1C1B] dark:text-[#E2E8E4]">
              {t('whyNotEligible.gapsTitle')}
            </h2>
            <motion.div
              variants={shouldReduceMotion ? undefined : staggerContainer}
              initial={shouldReduceMotion ? undefined : 'hidden'}
              animate={shouldReduceMotion ? undefined : 'visible'}
              className="space-y-3"
            >
              {unmetCriteria.map((item) => (
                <motion.div
                  key={item.factorKey}
                  variants={shouldReduceMotion ? undefined : staggerItem}
                  className="p-3.5 bg-[#FAFAF9] dark:bg-[#111714] border border-[#FFCCBD] dark:border-[#5A2B20] rounded text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-[#7C2C0F] dark:text-[#FCA5A5] mb-1.5">
                    <span>{item.factorLabel} {t('whyNotEligible.mismatchRuleSuffix')}</span>
                    <span className="text-[10px] bg-[#FFDAD6] dark:bg-[#3D1A14] text-[#7C2C0F] dark:text-[#FCA5A5] px-2 py-0.5 rounded uppercase">
                      {t('common.statutoryLimitation')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#3F4943] dark:text-[#9EB0A7] bg-white dark:bg-[#18221E] p-2.5 rounded border border-[#E4E8E4] dark:border-[#293B33]">
                    <div>
                      <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase tracking-wider">
                        {t('whyNotEligible.yourProfileValue')}
                      </span>
                      <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">{item.userValue}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] block uppercase tracking-wider">
                        {t('whyNotEligible.statutoryLimit')}
                      </span>
                      <strong className="text-[#7C2C0F] dark:text-[#FCA5A5]">{item.statutoryRequirement}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] mt-2 leading-relaxed">
                    {item.explanation}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Matched Criteria (Positive acknowledgement) */}
          {metCriteria.length > 0 && (
            <div className="pt-4 border-t border-[#E4E8E4] dark:border-[#24342D]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80] block mb-2">
                {t('whyNotEligible.matchedCriteriaTitle')} ({metCriteria.length}):
              </span>
              <motion.div
                variants={shouldReduceMotion ? undefined : staggerContainer}
                initial={shouldReduceMotion ? undefined : 'hidden'}
                animate={shouldReduceMotion ? undefined : 'visible'}
                className="flex flex-wrap gap-2"
              >
                {metCriteria.map((item) => (
                  <motion.span
                    key={item.factorKey}
                    variants={shouldReduceMotion ? undefined : staggerItem}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] text-xs font-semibold"
                  >
                    <motion.span variants={shouldReduceMotion ? undefined : popIn}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" />
                    </motion.span>
                    <span>
                      {item.factorLabel}: {item.userValue}
                    </span>
                  </motion.span>
                ))}
              </motion.div>
            </div>
          )}
        </div>

        <TrustFooterStrip
          sourceMinistry={locScheme.sponsoringMinistry}
          verifiedDate={locScheme.lastVerifiedDate}
        />
      </motion.div>

      {/* "Recommended Better Alternatives" Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1E6A50] dark:text-[#4ADE80]" />
            <h2 className="text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
              {t('whyNotEligible.alternativesTitle')}
            </h2>
          </div>
          <span className="text-xs text-[#516A5F] dark:text-[#9EB0A7]">{t('whyNotEligible.alternativesSubtitle')}</span>
        </div>

        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {displayAlternatives.map(({ match: alt, reason }) => {
            const locAlt = getLocalizedScheme(alt.scheme);
            return (
              <motion.div
                key={alt.scheme.id}
                variants={shouldReduceMotion ? undefined : staggerItem}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                transition={transitions.fast}
                className="yj-card p-5 shadow-xs flex flex-col justify-between hover:border-[#14453D] dark:hover:border-[#4ADE80] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D9E8DF] dark:bg-[#1A382D] px-2 py-0.5 rounded">
                      {locAlt.schemeType}
                    </span>
                    <MatchGauge percentage={alt.matchPercentage} size={48} strokeWidth={5} />
                  </div>
                  <h3 className="font-bold text-sm text-[#1A1C1B] dark:text-[#F0F4F2] leading-tight mb-1">
                    {locAlt.name}
                  </h3>
                  <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] line-clamp-2 mb-2">
                    {locAlt.benefitSummary}
                  </p>

                  {/* Why this alternative is recommended */}
                  {reason && (
                    <div className="p-2 mb-2.5 bg-[#D9E8DF]/50 dark:bg-[#1A382D]/50 border border-[#D9E8DF] dark:border-[#285743] rounded text-[11px] text-[#14453D] dark:text-[#4ADE80] font-medium leading-tight">
                      ✓ {reason}
                    </div>
                  )}

                  <div className="bg-[#FAFAF9] dark:bg-[#101613] p-2 rounded border border-[#E4E8E4] dark:border-[#24342D] text-[11px] mb-3">
                    <span className="text-[#516A5F] dark:text-[#8E9F97] block text-[10px]">{t('whyNotEligible.fundingRange')}</span>
                    <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-bold">{locAlt.fundingRangeText}</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E4E8E4] dark:border-[#24342D]">
                  <motion.button
                    id={`select-alt-${alt.scheme.id}`}
                    onClick={() => onSelectAlternative(alt)}
                    whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    className="w-full bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{t('whyNotEligible.viewBreakdownBtn')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </motion.button>
                  <a
                    href={locAlt.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#FAFAF9] dark:bg-[#101613] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924] text-[#1A1C1B] dark:text-[#F0F4F2] border border-[#E4E8E4] dark:border-[#2A3C34] py-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>{t('whyNotEligible.officialPortalBtn')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

