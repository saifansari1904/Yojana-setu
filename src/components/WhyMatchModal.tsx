import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MatchResult } from '../types';
import { MatchGauge } from './MatchGauge';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  Scale,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { getWhyMatchText } from '../i18n/whyMatchI18n';
import {
  modalOverlayVariants,
  slideOverVariants,
  popIn,
  staggerContainer,
  staggerItem,
} from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';

interface WhyMatchModalProps {
  matchResult: MatchResult | null;
  onClose: () => void;
  onOpenWhyNotEligible?: (match: MatchResult) => void;
}

export const WhyMatchModal: React.FC<WhyMatchModalProps> = ({
  matchResult,
  onClose,
  onOpenWhyNotEligible,
}) => {
  const { getLocalizedScheme, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Handle ESC key and prevent background body scroll when open
  useEffect(() => {
    if (!matchResult) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [matchResult, onClose]);

  if (!matchResult) return null;

  const locScheme = getLocalizedScheme ? getLocalizedScheme(matchResult.scheme) : matchResult.scheme;
  const { matchPercentage, breakdown, plainLanguageExplanation, matchStatus, primaryGap } = matchResult;
  const isEligible = matchStatus === 'eligible' || matchPercentage >= 75;
  const isNearMatch = matchStatus === 'near-match' || (matchPercentage >= 50 && matchPercentage < 75);

  const text = (key: string) => getWhyMatchText(key, lang);

  return (
    <motion.div
      id="why-match-modal-container"
      onClick={onClose}
      variants={shouldReduceMotion ? undefined : modalOverlayVariants}
      initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
      animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
      exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
      transition={shouldReduceMotion ? reducedMotionTransition : undefined}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0E1311]/70 backdrop-blur-sm flex justify-end transition-colors"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Slide-over Panel */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        variants={shouldReduceMotion ? undefined : slideOverVariants}
        initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
        animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
        exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
        transition={shouldReduceMotion ? reducedMotionTransition : transitions.smooth}
        className="w-full max-w-xl bg-white dark:bg-[var(--bg-card)] min-h-screen h-full shadow-2xl flex flex-col justify-between border-l border-[#E4E8E4] dark:border-[var(--border-subtle)] transition-colors"
      >
        {/* Top Panel Header (Sticky) */}
        <div className="sticky top-0 z-10 p-6 border-b border-[#E4E8E4] dark:border-[var(--border-subtle)] bg-[#FAFAF9]/95 dark:bg-[#141b17]/95 backdrop-blur-sm flex items-start justify-between">
          <div className="flex items-start gap-4">
            <MatchGauge percentage={matchPercentage} size={60} strokeWidth={5} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#14453D] dark:text-[var(--accent-green)] bg-[#D9E8DF] dark:bg-[#1A382D] px-2 py-0.5 rounded uppercase tracking-wider">
                  {text('ruleAudit')}
                </span>
                {isEligible ? (
                  <span className="text-[10px] font-bold text-[#14453D] dark:text-[var(--accent-green)] bg-[#D9E8DF] dark:bg-[#1A382D] px-2 py-0.5 rounded">
                    {text('statusEligible')}
                  </span>
                ) : isNearMatch ? (
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                    {text('statusNearMatch')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#7C2C0F] dark:text-[#FCA5A5] bg-[#FFDAD6] dark:bg-[var(--status-danger-bg)] px-2 py-0.5 rounded">
                    {text('statusLowMatch')}
                  </span>
                )}
              </div>
              <h2
                id="modal-title"
                className="text-lg font-bold text-[#1A1C1B] dark:text-[var(--text-main)] mt-1.5 leading-tight"
              >
                {text('whyTitle')}
              </h2>
              <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5 font-medium">
                {locScheme.name}
              </p>
            </div>
          </div>
          <button
            id="close-why-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#516A5F] dark:text-[var(--text-tertiary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)] hover:bg-[#EEEEED] dark:hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
            aria-label="Close why match panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scheme Authority Banner */}
        <div className="px-6 py-2.5 bg-[#F3F4F3] dark:bg-[var(--bg-card)] border-b border-[#E4E8E4] dark:border-[var(--border-subtle)] flex items-center justify-between text-xs">
          <span className="text-[#3F4943] dark:text-[var(--text-secondary)] truncate mr-2">
            {text('authorityLabel')}:{' '}
            <strong className="text-[#1A1C1B] dark:text-[var(--text-main)]">
              {locScheme.sponsoringMinistry}
            </strong>
          </span>
          <span className="text-[#14453D] dark:text-[var(--accent-green)] font-bold shrink-0">
            {locScheme.fundingRangeText}
          </span>
        </div>

        {/* Scrollable Core Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Near Match Gap Notice */}
          {primaryGap && (
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {text('gapNoticeTitle')}: {primaryGap.factorLabel}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                    {primaryGap.gapDistance || primaryGap.statutoryRequirement}
                  </p>
                  {onOpenWhyNotEligible && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWhyNotEligible(matchResult);
                      }}
                      className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-200 underline cursor-pointer"
                    >
                      {text('viewGapActionBtn')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Audit Subheader */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1C1B] dark:text-[var(--text-main)] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#14453D] dark:text-[var(--accent-green)]" />
              <span>
                {text('statutoryAuditTitle')}
              </span>
            </h3>
            <span className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] font-semibold">
              {matchResult.matchedCount} of {matchResult.totalFactorsCount}{' '}
              {text('factorsVerified')}
            </span>
          </div>

          {/* 5-Factor Breakdown Cards */}
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            className="space-y-3"
          >
            {breakdown.map((item) => (
              <motion.div
                key={item.factorKey}
                id={`breakdown-row-${item.factorKey}`}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className={`relative overflow-hidden p-3.5 pl-4 rounded-[var(--yj-radius-md)] border transition-colors ${
                  item.state === 'MATCHED' || item.matched
                    ? 'bg-[#FAFAF9] dark:bg-[var(--bg-card)] border-[#D9E8DF] dark:border-[#235845]'
                    : item.state === 'UNKNOWN'
                    ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-[#FFDAD6]/20 dark:bg-[#3D1A14]/30 border-[#FFCCBD] dark:border-[#5A2B20]'
                }`}
              >
                {/* Decorative state rail: draws in to reinforce matched / needed / mismatch */}
                <motion.span
                  aria-hidden="true"
                  initial={shouldReduceMotion ? false : { scaleY: 0 }}
                  animate={shouldReduceMotion ? undefined : { scaleY: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`pointer-events-none absolute left-0 top-0 bottom-0 w-1 origin-top ${
                    item.state === 'MATCHED' || item.matched
                      ? 'bg-[#175741] dark:bg-[var(--accent-green)]'
                      : item.state === 'UNKNOWN'
                      ? 'bg-amber-400 dark:bg-amber-500'
                      : 'bg-[#C2603F] dark:bg-[#F87171]'
                  }`}
                />

                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#1A1C1B] dark:text-[var(--text-main)] flex items-center gap-1.5">
                    <motion.span
                      variants={shouldReduceMotion ? undefined : popIn}
                      className="shrink-0 flex items-center"
                    >
                      {item.state === 'MATCHED' || item.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)]" />
                      ) : item.state === 'UNKNOWN' ? (
                        <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[#C2603F] dark:text-[#F87171]" />
                      )}
                    </motion.span>
                    <span>{item.factorLabel}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.state === 'MATCHED' || item.matched
                        ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]'
                        : item.state === 'UNKNOWN'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        : 'bg-[#FFDAD6] dark:bg-[var(--status-danger-bg)] text-[#7C2C0F] dark:text-[#FCA5A5]'
                    }`}
                  >
                    {item.state === 'MATCHED' || item.matched
                      ? text('criteriaMet')
                      : item.state === 'UNKNOWN'
                      ? text('needed')
                      : text('mismatch')}
                  </span>
                </div>

                {/* Profile vs Scheme Requirement Table */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-[var(--bg-raised)] p-2.5 rounded border border-[#E4E8E4] dark:border-[var(--border-subtle)] mt-2">
                  <div>
                    <span className="text-[10px] text-[#516A5F] dark:text-[var(--text-tertiary)] block uppercase tracking-wider font-semibold">
                      {text('yourInputLabel')}
                    </span>
                    <strong className="text-[#1A1C1B] dark:text-[var(--text-main)] font-semibold">
                      {item.userValue}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#516A5F] dark:text-[var(--text-tertiary)] block uppercase tracking-wider font-semibold">
                      {text('statutoryReqLabel')}
                    </span>
                    <strong
                      className={`font-semibold ${
                        item.matched
                          ? 'text-[#14453D] dark:text-[var(--accent-green)]'
                          : 'text-[#7C2C0F] dark:text-[#FCA5A5]'
                      }`}
                    >
                      {item.statutoryRequirement}
                    </strong>
                  </div>
                </div>

                {/* Plain Language Explanation */}
                <p className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] mt-2 leading-relaxed">
                  {item.explanation}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Plain Language Overall Summary */}
          <div className="p-4 bg-[#FAFAF9] dark:bg-[var(--bg-card)] border border-[#E4E8E4] dark:border-[var(--border-subtle)] rounded">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1C1B] dark:text-[var(--text-main)] block mb-1">
              {text('summaryAssessment')}
            </span>
            <p className="text-xs text-[#1F2421] dark:text-[var(--text-main)] font-medium leading-relaxed">
              {plainLanguageExplanation}
            </p>
          </div>

          {/* Trust Footnote */}
          <div className="flex items-center gap-2 p-3 bg-[#F3F4F3] dark:bg-[var(--bg-card)] border border-[#E4E8E4] dark:border-[var(--border-subtle)] rounded text-[11px] text-[#3F4943] dark:text-[var(--text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)] shrink-0" />
            <span>
              {text('disclaimer')}
            </span>
          </div>
        </div>

        {/* Panel Sticky Footer */}
        <div className="sticky bottom-0 z-10 p-6 border-t border-[#E4E8E4] dark:border-[var(--border-subtle)] bg-[#FAFAF9] dark:bg-[var(--bg-card)] space-y-3">
          <motion.a
            id="modal-official-portal-link"
            href={locScheme.officialPortalUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={shouldReduceMotion ? undefined : { y: -1 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            className="w-full bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[var(--brand-deep)] text-white py-2.5 px-4 rounded text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{text('applyOfficialPortal')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.a>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-[#516A5F] dark:text-[var(--text-secondary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)] font-medium py-1 cursor-pointer"
          >
            {text('backToList')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

