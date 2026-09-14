import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, Circle, HelpCircle, MinusCircle, Info } from 'lucide-react';
import {
  PreparationChecklistResult,
  PreparationItemState,
} from '../../types/supportPathway';
import { useTranslation } from '../../i18n';
import { transitions } from '../../animations/transitions';

interface PreparationChecklistProps {
  checklist: PreparationChecklistResult;
  onToggleItem?: (itemId: string, nextPrepared: boolean) => void;
  id?: string;
  className?: string;
}

const ITEM_META: Record<
  PreparationItemState,
  { icon: React.ElementType; labelEn: string; labelHi: string; tone: string }
> = {
  PREPARED: {
    icon: CheckCircle2,
    labelEn: 'Prepared',
    labelHi: 'तैयार',
    tone: 'text-[#0F6B4C] dark:text-[#4ADE80]',
  },
  NOT_PREPARED: {
    icon: Circle,
    labelEn: 'Not prepared',
    labelHi: 'तैयार नहीं',
    tone: 'text-[#3F4943] dark:text-[#9EB0A7]',
  },
  UNKNOWN: {
    icon: HelpCircle,
    labelEn: 'Unknown',
    labelHi: 'अज्ञात',
    tone: 'text-[#92610A] dark:text-[#FCD34D]',
  },
  NOT_REQUIRED: {
    icon: MinusCircle,
    labelEn: 'Not required',
    labelHi: 'आवश्यक नहीं',
    tone: 'text-[#3F4943] dark:text-[#9EB0A7]',
  },
};

/**
 * Phase 4.2 — Preparation checklist.
 * Tri-state by design: a document the entrepreneur has not answered for is
 * "Unknown", never "Missing". Items come only from verified scheme data.
 */
export const PreparationChecklist: React.FC<PreparationChecklistProps> = ({
  checklist,
  onToggleItem,
  id,
  className = '',
}) => {
  const { lang } = useTranslation();
  const isHi = lang === 'hi';
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id={id}
      aria-label={isHi ? 'आवेदन तैयारी' : 'Application preparation'}
      className={`rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7]">
          {isHi ? 'आवेदन तैयारी' : 'Application preparation'}
        </h3>
        {!checklist.requirementsUnverified && checklist.totalCount > 0 && (
          <span className="text-xs font-medium text-[#14453D] dark:text-[#F0F4F2]">
            {isHi ? checklist.summaryHi : checklist.summaryEn}
          </span>
        )}
      </div>

      {checklist.requirementsUnverified ? (
        <p className="flex items-start gap-2 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-[#F0F4F2] dark:bg-[#1A2B24] p-3 text-sm text-[#3F4943] dark:text-[#9EB0A7]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{isHi ? checklist.summaryHi : checklist.summaryEn}</span>
        </p>
      ) : (
        <ul className="space-y-1.5">
          {checklist.items.map((item) => {
            const meta = ITEM_META[item.state];
            const ItemIcon = meta.icon;
            const stateLabel = isHi ? meta.labelHi : meta.labelEn;
            const isInteractive = Boolean(onToggleItem) && item.state !== 'NOT_REQUIRED';

            const inner = (
              <>
                <motion.span
                  key={item.state}
                  initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={shouldReduceMotion ? { duration: 0.01 } : transitions.fast}
                  className={`shrink-0 ${meta.tone}`}
                >
                  <ItemIcon className="w-4 h-4" aria-hidden="true" />
                </motion.span>
                <span className="flex-1 text-sm text-[#3F4943] dark:text-[#C7D6CE]">
                  {isHi ? item.labelHi : item.labelEn}
                </span>
                {/* Status is always available as text, never colour alone. */}
                <span className={`text-[11px] font-medium ${meta.tone}`}>{stateLabel}</span>
              </>
            );

            return (
              <li key={item.id}>
                {isInteractive ? (
                  <button
                    type="button"
                    aria-pressed={item.state === 'PREPARED'}
                    aria-label={`${isHi ? item.labelHi : item.labelEn} — ${stateLabel}`}
                    onClick={() => onToggleItem?.(item.id, item.state !== 'PREPARED')}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[44px] text-left hover:bg-[#F0F4F2] dark:hover:bg-[#1A2B24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[44px]">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default PreparationChecklist;
