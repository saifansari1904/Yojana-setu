import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MatchResult } from '../types';
import { MatchGauge } from './MatchGauge';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Scale,
} from 'lucide-react';
import { useTranslation } from '../i18n';
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
  const { t, getLocalizedScheme, lang } = useTranslation();
  const isHindi = lang === 'hi';
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

  // Safe translation helper with human-readable default fallbacks
  const getText = (key: string, defaultText: string) => {
    const val = t ? t(key) : null;
    return val && val !== key ? val : defaultText;
  };

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
        className="w-full max-w-xl bg-white dark:bg-[#151C19] min-h-screen h-full shadow-2xl flex flex-col justify-between border-l border-[#E2E2E0] dark:border-[#24342D] transition-colors"
      >
        {/* Top Panel Header (Sticky) */}
        <div className="sticky top-0 z-10 p-6 border-b border-[#E2E2E0] dark:border-[#24342D] bg-[#FAFAF9]/95 dark:bg-[#151C19]/95 backdrop-blur-sm flex items-start justify-between">
          <div className="flex items-start gap-4">
            <MatchGauge percentage={matchPercentage} size={60} strokeWidth={5} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D4EFE1] dark:bg-[#1A382D] px-2 py-0.5 rounded uppercase tracking-wider">
                  {getText('modal.ruleAudit', isHindi ? 'नियम ऑडिट' : 'Rule Audit')}
                </span>
                {isEligible ? (
                  <span className="text-[10px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D4EFE1] dark:bg-[#1A382D] px-2 py-0.5 rounded">
                    {getText('results.statusEligible', isHindi ? 'पात्र' : 'Eligible')}
                  </span>
                ) : isNearMatch ? (
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                    {getText('results.statusNearMatch', isHindi ? 'निकटतम मेल' : 'Near Match')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#7C2C0F] dark:text-[#FCA5A5] bg-[#FFDAD6] dark:bg-[#3D1A14] px-2 py-0.5 rounded">
                    {getText('results.statusLowMatch', isHindi ? 'कम पात्रता' : 'Low Match')}
                  </span>
                )}
              </div>
              <h2
                id="modal-title"
                className="text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mt-1.5 leading-tight"
              >
                {getText('modal.whyTitle', isHindi ? 'यह योजना आपकी प्रोफ़ाइल से क्यों मेल खाती है' : 'Why this scheme matched your profile')}
              </h2>
              <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mt-0.5 font-medium">
                {locScheme.name}
              </p>
            </div>
          </div>
          <button
            id="close-why-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#6F7A73] dark:text-[#8E9F97] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924] transition-colors cursor-pointer"
            aria-label="Close why match panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scheme Authority Banner */}
        <div className="px-6 py-2.5 bg-[#F3F4F3] dark:bg-[#111714] border-b border-[#E2E2E0] dark:border-[#24342D] flex items-center justify-between text-xs">
          <span className="text-[#3F4943] dark:text-[#9EB0A7] truncate mr-2">
            {getText('modal.authorityLabel', isHindi ? 'प्राधिकरण' : 'Authority')}:{' '}
            <strong className="text-[#1A1C1B] dark:text-[#F0F4F2]">
              {locScheme.sponsoringMinistry}
            </strong>
          </span>
          <span className="text-[#14453D] dark:text-[#4ADE80] font-bold shrink-0">
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
                    {getText('modal.gapNoticeTitle', isHindi ? 'मुख्य अंतर' : 'Identified Gap')}: {primaryGap.factorLabel}
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
                      {getText('modal.viewGapActionBtn', isHindi ? 'वैकल्पिक योजनाएं देखें →' : 'Explore alternative schemes →')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Audit Subheader */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1C1B] dark:text-[#E2E8E4] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
              <span>
                {getText('modal.statutoryAuditTitle', isHindi ? 'वैधानिक 5-कारक पात्रता ऑडिट' : 'Statutory 5-Factor Eligibility Audit')}
              </span>
            </h3>
            <span className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] font-semibold">
              {matchResult.matchedCount} of {matchResult.totalFactorsCount}{' '}
              {getText('modal.factorsVerified', isHindi ? 'कारक सत्यापित' : 'Factors Evaluated')}
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
                className={`p-3.5 rounded border transition-colors ${
                  item.matched
                    ? 'bg-[#FAFAF9] dark:bg-[#111714] border-[#D4EFE1] dark:border-[#235845]'
                    : 'bg-[#FFDAD6]/20 dark:bg-[#3D1A14]/30 border-[#FFCCBD] dark:border-[#5A2B20]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                    <motion.span
                      variants={shouldReduceMotion ? undefined : popIn}
                      className="shrink-0 flex items-center"
                    >
                      {item.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[#C2603F] dark:text-[#F87171]" />
                      )}
                    </motion.span>
                    <span>{item.factorLabel}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.matched
                        ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80]'
                        : 'bg-[#FFDAD6] dark:bg-[#3D1A14] text-[#7C2C0F] dark:text-[#FCA5A5]'
                    }`}
                  >
                    {item.matched
                      ? getText('modal.criteriaMet', isHindi ? 'पात्रता पूर्ण' : 'Criteria Met')
                      : getText('modal.mismatch', isHindi ? 'अपात्र' : 'Mismatch')}
                  </span>
                </div>

                {/* Profile vs Scheme Requirement Table */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-[#18221E] p-2.5 rounded border border-[#E2E2E0] dark:border-[#293B33] mt-2">
                  <div>
                    <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase tracking-wider font-semibold">
                      {getText('modal.yourInputLabel', isHindi ? 'आपका विवरण:' : 'Your Input:')}
                    </span>
                    <strong className="text-[#1A1C1B] dark:text-[#F0F4F2] font-semibold">
                      {item.userValue}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6F7A73] dark:text-[#8E9F97] block uppercase tracking-wider font-semibold">
                      {getText('modal.statutoryReqLabel', isHindi ? 'सरकारी नियम:' : 'Official Gazette Rule:')}
                    </span>
                    <strong
                      className={`font-semibold ${
                        item.matched
                          ? 'text-[#14453D] dark:text-[#4ADE80]'
                          : 'text-[#7C2C0F] dark:text-[#FCA5A5]'
                      }`}
                    >
                      {item.statutoryRequirement}
                    </strong>
                  </div>
                </div>

                {/* Plain Language Explanation */}
                <p className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] mt-2 leading-relaxed">
                  {item.explanation}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Plain Language Overall Summary */}
          <div className="p-4 bg-[#FAFAF9] dark:bg-[#111714] border border-[#E2E2E0] dark:border-[#24342D] rounded">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1C1B] dark:text-[#E2E8E4] block mb-1">
              {getText('modal.summaryAssessment', isHindi ? 'सारांश मूल्यांकन:' : 'Summary Assessment:')}
            </span>
            <p className="text-xs text-[#1F2421] dark:text-[#D5DDD8] font-medium leading-relaxed">
              {plainLanguageExplanation}
            </p>
          </div>

          {/* Trust Footnote */}
          <div className="flex items-center gap-2 p-3 bg-[#F3F4F3] dark:bg-[#111714] border border-[#E2E2E0] dark:border-[#24342D] rounded text-[11px] text-[#3F4943] dark:text-[#9EB0A7]">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
            <span>
              {getText(
                'modal.disclaimer',
                isHindi
                  ? 'पात्रता आधिकारिक योजना मानदंडों के आधार पर निर्धारित की गई है।'
                  : 'Eligibility determined by published scheme criteria · explanation generated for clarity'
              )}
            </span>
          </div>
        </div>

        {/* Panel Sticky Footer */}
        <div className="sticky bottom-0 z-10 p-6 border-t border-[#E2E2E0] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#151C19] space-y-3">
          <motion.a
            id="modal-official-portal-link"
            href={locScheme.officialPortalUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={shouldReduceMotion ? undefined : { y: -1 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            className="w-full bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white py-2.5 px-4 rounded text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{getText('modal.applyOfficialPortal', isHindi ? 'आधिकारिक पोर्टल पर आवेदन करें' : 'Apply on Official Ministry Portal')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.a>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-[#516A5F] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2] font-medium py-1 cursor-pointer"
          >
            {getText('modal.backToList', isHindi ? 'वापस योजनाओं की सूची पर जाएं' : 'Back to matched schemes list')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

