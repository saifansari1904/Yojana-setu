import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, AlertTriangle, Info, CheckCircle2, HelpCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';

type VerificationTier = 'verified' | 'partially-verified' | 'in-review' | 'gazetted' | 'candidate';
export type PortalDomainClass = 'VERIFIED_OFFICIAL' | 'KNOWN_NODAL' | 'UNVERIFIED_EXTERNAL' | 'INVALID' | 'CANDIDATE';

interface VerificationBadgeProps {
  tier?: VerificationTier;
  classification?: PortalDomainClass;
  label?: string;
  sourceText?: string;
  showText?: boolean;
  className?: string;
  id?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  tier: propTier,
  classification,
  label,
  sourceText,
  showText = true,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useTranslation();

  // Derive tier and default label from classification if supplied
  let derivedTier: VerificationTier = propTier || 'verified';
  let derivedLabel = label;

  if (classification) {
    switch (classification) {
      case 'VERIFIED_OFFICIAL':
        derivedTier = 'verified';
        derivedLabel = label || t('verificationBadge.verifiedOfficial');
        break;
      case 'KNOWN_NODAL':
        derivedTier = 'gazetted';
        derivedLabel = label || t('verificationBadge.nodalAgency');
        break;
      case 'UNVERIFIED_EXTERNAL':
        derivedTier = 'partially-verified';
        derivedLabel = label || t('verificationBadge.unverifiedSource');
        break;
      case 'INVALID':
        derivedTier = 'in-review';
        derivedLabel = label || t('verificationBadge.invalidDomain');
        break;
      case 'CANDIDATE':
        derivedTier = 'candidate';
        derivedLabel = label || t('verificationBadge.candidateScheme');
        break;
    }
  }

  const tier = derivedTier;

  const configs: Record<
    VerificationTier,
    { bg: string; text: string; border: string; icon: React.ElementType; defaultLabel: string }
  > = {
    gazetted: {
      bg: 'bg-[#D9E8DF] dark:bg-[#1A382D]',
      text: 'text-[#1E6A50] dark:text-[var(--accent-green)]',
      border: 'border-[#B2CDBF] dark:border-[#285743]',
      icon: ShieldCheck,
      defaultLabel: t('verificationBadge.gazetteVerified'),
    },
    verified: {
      bg: 'bg-[#D9E8DF] dark:bg-[#1A382D]',
      text: 'text-[#1E6A50] dark:text-[var(--accent-green)]',
      border: 'border-[#B2CDBF] dark:border-[#285743]',
      icon: CheckCircle2,
      defaultLabel: t('verificationBadge.officialGovScheme'),
    },
    'partially-verified': {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      icon: AlertTriangle,
      defaultLabel: t('verificationBadge.partiallyVerified'),
    },
    'in-review': {
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: Info,
      defaultLabel: t('verificationBadge.reviewInProgress'),
    },
    candidate: {
      bg: 'bg-amber-50/90 dark:bg-amber-950/50',
      text: 'text-amber-900 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-700/60',
      icon: HelpCircle,
      defaultLabel: t('verificationBadge.candidateScheme'),
    },
  };

  const current = configs[tier] || configs.verified;
  const IconComponent = current.icon;
  const displayLabel = label || current.defaultLabel;
  const resolvedSourceText =
    sourceText !== undefined
      ? sourceText
      : tier === 'candidate'
      ? t('verificationBadge.sourceVerificationPending')
      : undefined;

  // Provenance disclosure: where this status comes from, revealed on hover/focus.
  // Only shown when we actually have a source; never invented.
  const hasProvenance = Boolean(resolvedSourceText);

  return (
    <motion.span
      id={id}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      title={hasProvenance ? `${displayLabel} — ${resolvedSourceText}` : displayLabel}
      tabIndex={hasProvenance ? 0 : undefined}
      className={`group/provenance relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border select-none ${
        hasProvenance ? 'yj-focus-ring cursor-help' : ''
      } ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <IconComponent className="w-3 h-3 shrink-0" />
      {showText && <span>{displayLabel}</span>}
      {showText && resolvedSourceText && (
        <span className="opacity-70 font-normal border-l border-current/30 pl-1 ml-0.5">
          {resolvedSourceText}
        </span>
      )}

      {hasProvenance && (
        <span
          role="note"
          className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-max max-w-[240px] whitespace-normal rounded-[var(--yj-radius-md)] border border-[#E4E8E4] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] px-2.5 py-1.5 text-left text-[10px] font-normal leading-snug text-[#42544C] dark:text-[var(--text-secondary)] opacity-0 translate-y-0.5 shadow-[var(--yj-shadow-2)] transition-all duration-150 group-hover/provenance:opacity-100 group-hover/provenance:translate-y-0 group-focus-visible/provenance:opacity-100 group-focus-visible/provenance:translate-y-0"
        >
          {resolvedSourceText}
        </span>
      )}
    </motion.span>
  );
};
