import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Compass,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { PathwayAction, PathwayActionStatus } from '../../types/supportPathway';
import { useTranslation } from '../../i18n';
import { ArrowFillButton } from '../ui';
import { transitions } from '../../animations/transitions';

interface NextBestActionCardProps {
  action: PathwayAction;
  secondaryActions?: PathwayAction[];
  onAction?: (action: PathwayAction) => void;
  id?: string;
  className?: string;
  compact?: boolean;
}

const STATUS_META: Record<
  PathwayActionStatus,
  { icon: React.ElementType; labelEn: string; labelHi: string; chip: string }
> = {
  COMPLETED: {
    icon: CheckCircle2,
    labelEn: 'Completed',
    labelHi: 'पूर्ण',
    chip: 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]',
  },
  READY: {
    icon: CheckCircle2,
    labelEn: 'Ready',
    labelHi: 'तैयार',
    chip: 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]',
  },
  RECOMMENDED: {
    icon: Compass,
    labelEn: 'Recommended',
    labelHi: 'अनुशंसित',
    chip: 'bg-[#F0F4F2] dark:bg-[#1A2B24] text-[#3F4943] dark:text-[#9EB0A7] border-[#E2E2E0] dark:border-[#24342D]',
  },
  BLOCKED: {
    icon: AlertTriangle,
    labelEn: 'Cannot proceed yet',
    labelHi: 'अभी आगे नहीं',
    chip: 'bg-[#FFDAD6] dark:bg-[#4A2119] text-[#8C3A22] dark:text-[#FFB4A4] border-[#F0B7AA] dark:border-[#6B3325]',
  },
  NEEDS_INFORMATION: {
    icon: HelpCircle,
    labelEn: 'Information needed',
    labelHi: 'जानकारी आवश्यक',
    chip: 'bg-[#FEF3C7] dark:bg-[#3B2F14] text-[#92610A] dark:text-[#FCD34D] border-[#FDE68A] dark:border-[#5A4718]',
  },
  NOT_RELEVANT: {
    icon: HelpCircle,
    labelEn: 'Not relevant',
    labelHi: 'अप्रासंगिक',
    chip: 'bg-[#F0F4F2] dark:bg-[#1A2B24] text-[#3F4943] dark:text-[#9EB0A7] border-[#E2E2E0] dark:border-[#24342D]',
  },
};

/**
 * Phase 4.2 — the single most sensible next step, with its data-derived reason.
 * Never predicts approval; only reflects verified profile and scheme data.
 */
export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  action,
  secondaryActions = [],
  onAction,
  id,
  className = '',
  compact = false,
}) => {
  const { lang } = useTranslation();
  const isHi = lang === 'hi';
  const shouldReduceMotion = useReducedMotion();

  const meta = STATUS_META[action.status];
  const StatusIcon = meta.icon;
  const title = isHi ? action.titleHi : action.titleEn;
  const description = isHi ? action.descriptionHi : action.descriptionEn;
  const reason = isHi ? action.reasonHi : action.reasonEn;
  const cta = isHi ? action.ctaLabelHi : action.ctaLabelEn;

  return (
    <motion.section
      id={id}
      aria-labelledby={`${id || 'nba'}-title`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0.01 } : transitions.smooth}
      className={`rounded-2xl border border-[#B2CDBF] dark:border-[#285743] bg-[#F7FBF9] dark:bg-[#132720] p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80]">
          {isHi ? 'अगला सर्वोत्तम कदम' : 'Next best action'}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.chip}`}
        >
          <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
          {isHi ? meta.labelHi : meta.labelEn}
        </span>
      </div>

      <h4
        id={`${id || 'nba'}-title`}
        className="text-base sm:text-lg font-semibold text-[#14453D] dark:text-[#F0F4F2] mb-1.5"
      >
        {title}
      </h4>
      <p className="text-sm text-[#3F4943] dark:text-[#9EB0A7] mb-3">{description}</p>

      {!compact && (
        <div className="rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#0F1F1A] p-3 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7] mb-1">
            {isHi ? 'यह क्यों अनुशंसित है' : 'Why this is recommended'}
          </p>
          <p className="text-sm text-[#3F4943] dark:text-[#C7D6CE] leading-relaxed">{reason}</p>
        </div>
      )}

      <ArrowFillButton
        onClick={() => onAction?.(action)}
        variant="primary"
        size="md"
        fullWidth
        icon={action.actionTarget === 'portal' ? ExternalLink : ClipboardList}
        ariaLabel={cta}
      >
        {cta}
      </ArrowFillButton>

      {secondaryActions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E2E2E0] dark:border-[#24342D]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7] mb-2">
            {isHi ? 'इसके बाद' : 'After that'}
          </p>
          <ul className="space-y-2">
            {secondaryActions.map((secondary) => (
              <li key={secondary.id}>
                <button
                  type="button"
                  onClick={() => onAction?.(secondary)}
                  className="w-full text-left rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#0F1F1A] px-3 py-2.5 min-h-[44px] text-sm text-[#3F4943] dark:text-[#C7D6CE] hover:border-[#B2CDBF] dark:hover:border-[#285743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <span className="font-medium text-[#14453D] dark:text-[#F0F4F2]">
                    {isHi ? secondary.titleHi : secondary.titleEn}
                  </span>
                  <span className="block text-xs mt-0.5">
                    {isHi ? secondary.descriptionHi : secondary.descriptionEn}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
};

export default NextBestActionCard;
