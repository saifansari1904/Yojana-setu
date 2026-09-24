import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { PriorityOpportunity } from '../../types/commandCenter';
import type { MatchResult } from '../../types/matching';
import { AnimatedCounter } from '../../animations/AnimatedCounter';
import { VerificationBadge } from '../ui/VerificationBadge';
import { ArrowFillButton } from '../ui/ArrowFillButton';

interface OpportunityPriorityCardProps {
  opportunity: PriorityOpportunity;
  onOpenWorkspace?: (schemeId: string) => void;
  onSelectScheme?: (match: MatchResult) => void;
  isHi?: boolean;
}

export const OpportunityPriorityCard: React.FC<OpportunityPriorityCardProps> = ({
  opportunity,
  onOpenWorkspace,
  onSelectScheme,
  isHi = false,
}) => {
  const { matchResult, priorityCategory, priorityScore, whyThisScheme, whyNow, nextAction } =
    opportunity;
  const scheme = matchResult.scheme;

  const priorityStyles: Record<
    string,
    { labelEn: string; labelHi: string; badge: string; dot: string }
  > = {
    ACTION_NOW: {
      labelEn: 'Action Now',
      labelHi: 'तत्काल कार्रवाई',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500 animate-pulse',
    },
    HIGH_PRIORITY: {
      labelEn: 'High Priority',
      labelHi: 'उच्च प्राथमिकता',
      badge: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    REVIEW: {
      labelEn: 'Review & Verify',
      labelHi: 'समीक्षा एवं पुष्टि',
      badge: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    INFORMATION_NEEDED: {
      labelEn: 'Info Needed',
      labelHi: 'जानकारी आवश्यक',
      badge: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    LOW_PRIORITY: {
      labelEn: 'Standard',
      labelHi: 'सामान्य',
      badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const badgeConfig = priorityStyles[priorityCategory] || priorityStyles.HIGH_PRIORITY;

  return (
    <article
      id={`priority-card-${scheme.id}`}
      className="bg-white dark:bg-[var(--bg-raised)] border border-[#E3ECE7] dark:border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
    >
      <div className="flex flex-col gap-4">
        {/* Top Header: Priority Badge & Score */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeConfig.badge}`}
            >
              <span className={`w-2 h-2 rounded-full ${badgeConfig.dot}`} />
              {isHi ? badgeConfig.labelHi : badgeConfig.labelEn}
            </span>
            <VerificationBadge tier="verified" />
          </div>

          <div className="flex items-center gap-2 bg-[#F4F8F5] dark:bg-[var(--bg-raised)] px-3 py-1 rounded-lg border border-[#D8E6DE] dark:border-[#1E342B]">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isHi ? 'मैच स्कोर' : 'Fit Score'}
            </span>
            <span className="text-sm font-bold text-[#0F6B4C] dark:text-[var(--accent-green)] flex items-center">
              <AnimatedCounter value={priorityScore} />%
            </span>
          </div>
        </div>

        {/* Scheme Title & Ministry */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {scheme.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {scheme.sponsoringMinistry} {scheme.department ? `• ${scheme.department}` : ''}
          </p>
        </div>

        {/* Financial / Assistance Quantum Snippet */}
        <div className="bg-[#FAFBF9] dark:bg-[var(--bg-raised)] rounded-lg p-3 border border-[#E9EFEA] dark:border-[#232F29]">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isHi ? 'प्रमुख सरकारी सहायता' : 'Core Sovereign Assistance'}
          </div>
          <div className="text-sm font-semibold text-[#0F6B4C] dark:text-[var(--accent-green)] mt-0.5">
            {isHi ? whyThisScheme.benefitSnippetHi : whyThisScheme.benefitSnippetEn}
          </div>
        </div>

        {/* "Why this scheme?" */}
        <div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {isHi ? 'यह योजना क्यों?' : 'Why this scheme?'}
          </div>
          <ul className="space-y-1.5">
            {(isHi ? whyThisScheme.reasonsHi : whyThisScheme.reasonsEn).map((reason, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6B4C] dark:text-[var(--accent-green)] mt-0.5 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* "Why now?" */}
        <div
          className={`rounded-lg p-3 text-xs border ${
            whyNow.urgencyLevel === 'high'
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{isHi ? 'अभी क्यों?' : 'Why now?'}</span>
          </div>
          <p className="leading-relaxed">{isHi ? whyNow.reasonHi : whyNow.reasonEn}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-[var(--border-subtle)] flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isHi ? nextAction.titleHi : nextAction.titleEn}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onSelectScheme && (
            <button
              id={`view-details-${scheme.id}`}
              onClick={() => onSelectScheme(matchResult)}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-h-[44px] flex items-center justify-center flex-1 sm:flex-initial"
            >
              {isHi ? 'विवरण' : 'Details'}
            </button>
          )}

          {onOpenWorkspace ? (
            <ArrowFillButton
              id={`open-workspace-${scheme.id}`}
              onClick={() => onOpenWorkspace(scheme.id)}
              size="sm"
              variant="primary"
              className="flex-1 sm:flex-initial"
            >
              {isHi ? nextAction.ctaLabelHi : nextAction.ctaLabelEn}
            </ArrowFillButton>
          ) : (
            onSelectScheme && (
              <button
                id={`cta-select-${scheme.id}`}
                onClick={() => onSelectScheme(matchResult)}
                className="px-4 py-2 bg-[#0F6B4C] hover:bg-[#0A4D36] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[44px] flex-1 sm:flex-initial"
              >
                <span>{isHi ? nextAction.ctaLabelHi : nextAction.ctaLabelEn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
};
