import React from 'react';
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  MinusCircle,
  Info,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { transitions } from '../../animations';
import {
  PreparationChecklistResult as PreparationChecklistModel,
  PreparationItemState,
} from '../../types/supportPathway';
import { getLocalizedChecklistSummary } from '../../lib/business/supportPathway';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';

interface PreparationChecklistProps {
  checklist: PreparationChecklistModel;
  onToggleItem?: (id: string, prepared: boolean) => void;
  id?: string;
  className?: string;
}

const SECTION_TITLE: Record<Language, string> = {
  en: 'Application preparation',
  hi: 'आवेदन तैयारी',
  ta: 'விண்ணப்ப தயாரிப்பு',
  te: 'దరఖాస్తు సన్నద్ధత',
  kn: 'ಅರ್ಜಿ ಸಿದ್ಧತೆ',
  ml: 'അപേക്ഷാ തയ്യാറെടുപ്പ്',
};

const ITEM_META: Record<
  PreparationItemState,
  {
    icon: React.ElementType;
    labels: Record<Language, string>;
    tone: string;
  }
> = {
  PREPARED: {
    icon: CheckCircle2,
    labels: {
      en: 'Prepared',
      hi: 'तैयार',
      ta: 'தயார்',
      te: 'సిద్ధంగా ఉంది',
      kn: 'ಸಿದ್ಧವಾಗಿದೆ',
      ml: 'തയ്യാറാണ്',
    },
    tone: 'text-[#0F6B4C] dark:text-[#4ADE80]',
  },
  NOT_PREPARED: {
    icon: Circle,
    labels: {
      en: 'Not prepared',
      hi: 'तैयार नहीं',
      ta: 'தயாராக இல்லை',
      te: 'సిద్ధంగా లేదు',
      kn: 'ಸಿದ್ಧವಾಗಿಲ್ಲ',
      ml: 'തയ്യാറല്ല',
    },
    tone: 'text-[#3F4943] dark:text-[#9EB0A7]',
  },
  UNKNOWN: {
    icon: HelpCircle,
    labels: {
      en: 'Unknown',
      hi: 'अज्ञात',
      ta: 'தெரியவில்லை',
      te: 'తెలియదు',
      kn: 'ತಿಳಿದಿಲ್ಲ',
      ml: 'അറിയില്ല',
    },
    tone: 'text-[#92610A] dark:text-[#FCD34D]',
  },
  NOT_REQUIRED: {
    icon: MinusCircle,
    labels: {
      en: 'Not required',
      hi: 'आवश्यक नहीं',
      ta: 'தேவையில்லை',
      te: 'అవసరం లేదు',
      kn: 'ಅಗತ್ಯವಿಲ್ಲ',
      ml: 'ആവശ്യമില്ല',
    },
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
  const l: Language = (lang in SECTION_TITLE) ? lang : 'en';
  const shouldReduceMotion = useReducedMotion();

  const title = SECTION_TITLE[l];
  const summaryText = getLocalizedChecklistSummary(checklist, l);

  return (
    <section
      id={id}
      aria-label={title}
      className={`rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7]">
          {title}
        </h3>
        {!checklist.requirementsUnverified && checklist.totalCount > 0 && (
          <span className="text-xs font-medium text-[#14453D] dark:text-[#F0F4F2]">
            {summaryText}
          </span>
        )}
      </div>

      {checklist.requirementsUnverified ? (
        <p className="flex items-start gap-2 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-[#F0F4F2] dark:bg-[#1A2B24] p-3 text-sm text-[#3F4943] dark:text-[#9EB0A7]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{summaryText}</span>
        </p>
      ) : (
        <ul className="space-y-1.5">
          {checklist.items.map((item) => {
            const meta = ITEM_META[item.state];
            const ItemIcon = meta.icon;
            const stateLabel = meta.labels[l] || meta.labels.en;
            const itemLabel = l === 'hi' ? item.labelHi : item.labelEn;
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
                  {itemLabel}
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
                    aria-label={`${itemLabel} — ${stateLabel}`}
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
