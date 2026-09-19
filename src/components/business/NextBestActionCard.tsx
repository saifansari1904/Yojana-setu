import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Compass,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { transitions } from '../../animations';
import { ArrowFillButton } from '../ui/ArrowFillButton';
import {
  PathwayAction as BusinessAction,
  PathwayActionStatus as BusinessActionStatus,
} from '../../types/supportPathway';
import { getLocalizedPathwayAction } from '../../i18n/pathwayActionI18n';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';

interface NextBestActionCardProps {
  action: BusinessAction;
  secondaryActions?: BusinessAction[];
  onAction?: (action: BusinessAction) => void;
  id?: string;
  className?: string;
  compact?: boolean;
}

const COPY = {
  sectionTitle: {
    en: 'Next best action',
    hi: 'अगला सर्वोत्तम कदम',
    ta: 'அடுத்த சிறந்த நடவடிக்கை',
    te: 'తదుపరి ఉత్తమ చర్య',
    kn: 'ಮುಂದಿನ ಉತ್ತಮ ಹೆಜ್ಜೆ',
    ml: 'അടുത്ത മികച്ച നടപടി',
  },
  whyRecommended: {
    en: 'Why this is recommended',
    hi: 'यह क्यों अनुशंसित है',
    ta: 'இது ஏன் பரிந்துரைக்கப்படுகிறது',
    te: 'ఇది ఎందుకు సిఫార్సు చేయబడింది',
    kn: 'ಇದನ್ನು ಏಕೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ',
    ml: 'ഇത് എന്തുകൊണ്ട് ശുപാർശ ചെയ്യുന്നു',
  },
  afterThat: {
    en: 'After that',
    hi: 'इसके बाद',
    ta: 'அதற்குப் பிறகு',
    te: 'ఆ తరువాత',
    kn: 'ಅದರ ನಂತರ',
    ml: 'അതിനുശേഷം',
  },
};

const STATUS_META: Record<
  BusinessActionStatus,
  {
    icon: React.ElementType;
    labels: Record<Language, string>;
    chip: string;
  }
> = {
  COMPLETED: {
    icon: CheckCircle2,
    labels: {
      en: 'Completed',
      hi: 'पूर्ण',
      ta: 'முடிந்தது',
      te: 'పూర్తయింది',
      kn: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
      ml: 'പൂർത്തിയായി',
    },
    chip: 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]',
  },
  READY: {
    icon: CheckCircle2,
    labels: {
      en: 'Ready',
      hi: 'तैयार',
      ta: 'தயார்',
      te: 'సిద్ధంగా ఉంది',
      kn: 'ಸಿದ್ಧವಾಗಿದೆ',
      ml: 'തയ്യാറാണ്',
    },
    chip: 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#4ADE80] border-[#B2CDBF] dark:border-[#285743]',
  },
  RECOMMENDED: {
    icon: Compass,
    labels: {
      en: 'Recommended',
      hi: 'अनुशंसित',
      ta: 'பரிந்துரைக்கப்படுகிறது',
      te: 'సిఫార్సు చేయబడింది',
      kn: 'ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ',
      ml: 'ശുപാർശ ചെയ്യുന്നത്',
    },
    chip: 'bg-[#F0F4F2] dark:bg-[#1A2B24] text-[#3F4943] dark:text-[#9EB0A7] border-[#E2E2E0] dark:border-[#24342D]',
  },
  BLOCKED: {
    icon: AlertTriangle,
    labels: {
      en: 'Cannot proceed yet',
      hi: 'अभी आगे नहीं',
      ta: 'இன்னும் தொடர முடியாது',
      te: 'ఇంకా ముందుకు సాగలేరు',
      kn: 'ಇನ್ನೂ ಮುಂದುವರಿಯಲು ಸಾಧ್ಯವಿಲ್ಲ',
      ml: 'ഇതുവരെ തുടരാനാവില്ല',
    },
    chip: 'bg-[#FFDAD6] dark:bg-[#4A2119] text-[#8C3A22] dark:text-[#FFB4A4] border-[#F0B7AA] dark:border-[#6B3325]',
  },
  NEEDS_INFORMATION: {
    icon: HelpCircle,
    labels: {
      en: 'Information needed',
      hi: 'जानकारी आवश्यक',
      ta: 'தகவல் தேவை',
      te: 'సమాచారం అవసరం',
      kn: 'ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ',
      ml: 'വിവരങ്ങൾ ആവശ്യമാണ്',
    },
    chip: 'bg-[#FEF3C7] dark:bg-[#3B2F14] text-[#92610A] dark:text-[#FCD34D] border-[#FDE68A] dark:border-[#5A4718]',
  },
  NOT_RELEVANT: {
    icon: HelpCircle,
    labels: {
      en: 'Not relevant',
      hi: 'अप्रासंगिक',
      ta: 'பொருத்தமற்றது',
      te: 'అసంబద్ధం',
      kn: 'ಅಪ್ರಸ್ತುತ',
      ml: 'പ്രസക്തമല്ല',
    },
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
  const l: Language = (lang in COPY.sectionTitle) ? lang : 'en';
  const shouldReduceMotion = useReducedMotion();

  const meta = STATUS_META[action.status];
  const StatusIcon = meta.icon;
  const statusLabel = meta.labels[l] || meta.labels.en;

  const { title, description, reason, cta } = getLocalizedPathwayAction(action, l);

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
          {COPY.sectionTitle[l]}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.chip}`}
        >
          <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
          {statusLabel}
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
            {COPY.whyRecommended[l]}
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
            {COPY.afterThat[l]}
          </p>
          <ul className="space-y-2">
            {secondaryActions.map((secondary) => {
              const { title: secTitle, description: secDesc } = getLocalizedPathwayAction(secondary, l);
              return (
                <li key={secondary.id}>
                  <button
                    type="button"
                    onClick={() => onAction?.(secondary)}
                    className="w-full text-left rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#0F1F1A] px-3 py-2.5 min-h-[44px] text-sm text-[#3F4943] dark:text-[#C7D6CE] hover:border-[#B2CDBF] dark:hover:border-[#285743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                  >
                    <span className="font-medium text-[#14453D] dark:text-[#F0F4F2]">
                      {secTitle}
                    </span>
                    <span className="block text-xs mt-0.5">
                      {secDesc}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.section>
  );
};

export default NextBestActionCard;
