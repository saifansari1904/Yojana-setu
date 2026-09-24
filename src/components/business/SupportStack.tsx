import React from 'react';
import {
  Layers,
  Banknote,
  GraduationCap,
  Store,
  Compass,
  FileCheck,
  Building2,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, staggerItem } from '../../animations';
import { VerificationBadge } from '../ui/VerificationBadge';
import { SupportStackGroup } from '../../types/supportPathway';
import { getLocalizedRelationNote } from '../../lib/business/supportPathway';
import { getLocalizedNeedLabel } from '../../i18n/schemeDetailI18n';
import { SupportNeedType } from '../../types/business';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

interface SupportStackProps {
  groups: SupportStackGroup[];
  combinabilityNotice?: string;
  onSelectScheme?: (schemeId: string) => void;
  maxGroups?: number;
  id?: string;
  className?: string;
}

const COPY = {
  sectionTitle: {
    en: 'Your support stack',
    hi: 'आपका सहायता स्टैक',
    ta: 'உங்கள் உதவி அடுக்கு',
    te: 'మీ మద్దతు స్టాక్',
    kn: 'ನಿಮ್ಮ ಬೆಂಬಲ ಸ್ಟಾಕ್',
    ml: 'നിങ്ങളുടെ സഹായ സ്റ്റാക്ക്',
    mr: 'तुमचा सहाय्य संच',
  },
  lastVerified: {
    en: 'Last verified',
    hi: 'अंतिम सत्यापन',
    ta: 'கடைசியாக சரிபார்க்கப்பட்டது',
    te: 'చివరిగా ధృవీకరించబడింది',
    kn: 'ಕೊನೆಯದಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    ml: 'അവസാനം പരിശോധിച്ചത്',
    mr: 'शेवटची पडताळणी',
  },
};

const ICON_MAP: Record<string, React.ElementType> = {
  banknote: Banknote,
  'graduation-cap': GraduationCap,
  store: Store,
  compass: Compass,
  'file-check': FileCheck,
  'building-2': Building2,
};

function resolveIcon(name?: string): React.ElementType {
  if (!name) return Layers;
  return ICON_MAP[name] || Layers;
}

/**
 * Phase 4.2 — Multi-scheme support stack.
 * Groups by functional area (credit, skill, market, compliance).
 * Every scheme retains individual provenance metadata.
 */
export const SupportStack: React.FC<SupportStackProps> = ({
  groups,
  combinabilityNotice,
  onSelectScheme,
  maxGroups = 5,
  id,
  className = '',
}) => {
  const { lang } = useTranslation();
  const l: Language = (lang in COPY.sectionTitle) ? lang : 'en';
  const shouldReduceMotion = useReducedMotion();

  const title = COPY.sectionTitle[l];
  const lastVerifiedText = COPY.lastVerified[l];

  const visibleGroups = groups.filter((g) => g.schemes.length > 0).slice(0, maxGroups);

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      aria-label={title}
      className={className}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[var(--text-secondary)] mb-3">
        {title}
      </h3>

      <motion.div
        variants={shouldReduceMotion ? undefined : staggerContainer}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {visibleGroups.map((group) => {
          const AreaIcon = resolveIcon(group.iconName);
          const groupLabel = getLocalizedNeedLabel(group.area as SupportNeedType, l) || resolveLocalizedPair(group.labelEn, group.labelHi, l);
          return (
            <motion.article
              key={group.area}
              variants={shouldReduceMotion ? undefined : staggerItem}
              className="rounded-2xl border border-[#E4E8E4] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] p-4"
            >
              <header className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#D9E8DF] dark:bg-[#1A382D] text-[#1E6A50] dark:text-[var(--accent-green)]">
                  <AreaIcon className="w-4 h-4" aria-hidden="true" />
                </span>
                <h4 className="text-sm font-semibold text-[#14453D] dark:text-[var(--text-main)]">
                  {groupLabel}
                </h4>
              </header>

              <ul className="space-y-2">
                {group.schemes.map((scheme) => {
                  const relationNote = getLocalizedRelationNote(scheme, l);
                  return (
                    <li key={scheme.schemeId}>
                      <button
                        type="button"
                        onClick={() => onSelectScheme?.(scheme.schemeId)}
                        className="w-full text-left rounded-xl border border-[#E4E8E4] dark:border-[var(--border-subtle)] px-3 py-2.5 min-h-[44px] hover:border-[#B2CDBF] dark:hover:border-[#285743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6A50]"
                        aria-label={`${scheme.schemeName} — ${relationNote}`}
                      >
                        <span className="block text-sm font-medium text-[#14453D] dark:text-[var(--text-main)]">
                          {scheme.schemeName}
                        </span>
                        <span className="block text-xs text-[#3F4943] dark:text-[var(--text-secondary)] mt-0.5">
                          {relationNote}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-1.5">
                          <VerificationBadge
                            tier={
                              scheme.provenance.verificationStatus === 'verified'
                                ? 'verified'
                                : 'in-review'
                            }
                            label={scheme.provenance.source}
                            sourceText={
                              scheme.provenance.lastVerified
                                ? `${lastVerifiedText}: ${scheme.provenance.lastVerified}`
                                : undefined
                            }
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.article>
          );
        })}
      </motion.div>

      {combinabilityNotice && (
        <p className="mt-3 text-xs text-[#3F4943] dark:text-[var(--text-secondary)] bg-[#EFF5F1] dark:bg-[var(--bg-subtle)] rounded-xl p-3 border border-[#E4E8E4] dark:border-[var(--border-subtle)]">
          {combinabilityNotice}
        </p>
      )}
    </section>
  );
};

export default SupportStack;
