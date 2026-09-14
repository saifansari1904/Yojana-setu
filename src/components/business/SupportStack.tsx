import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { HelpCircle, Info } from 'lucide-react';
import { SupportStackGroup } from '../../types/supportPathway';
import { useTranslation } from '../../i18n';
import { VerificationBadge } from '../ui';
import { staggerContainer, staggerItem } from '../../animations/variants';

interface SupportStackProps {
  groups: SupportStackGroup[];
  combinabilityNotice?: string;
  onSelectScheme?: (schemeId: string) => void;
  maxGroups?: number;
  id?: string;
  className?: string;
}

function resolveIcon(name: string): React.ElementType {
  const icons = LucideIcons as unknown as Record<string, React.ElementType>;
  return icons[name] || HelpCircle;
}

/**
 * Phase 4.2 — Support Stack.
 * Groups already-matched, verified schemes by support area instead of listing
 * every scheme independently. Provenance travels with every scheme.
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
  const isHi = lang === 'hi';
  const shouldReduceMotion = useReducedMotion();

  const visibleGroups = groups.filter((g) => g.schemes.length > 0).slice(0, maxGroups);

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      aria-label={isHi ? 'आपका सहायता स्टैक' : 'Your support stack'}
      className={className}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7] mb-3">
        {isHi ? 'आपका सहायता स्टैक' : 'Your support stack'}
      </h3>

      <motion.div
        variants={shouldReduceMotion ? undefined : staggerContainer}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {visibleGroups.map((group) => {
          const AreaIcon = resolveIcon(group.iconName);
          return (
            <motion.article
              key={group.area}
              variants={shouldReduceMotion ? undefined : staggerItem}
              className="rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4"
            >
              <header className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#4ADE80]">
                  <AreaIcon className="w-4 h-4" aria-hidden="true" />
                </span>
                <h4 className="text-sm font-semibold text-[#14453D] dark:text-[#F0F4F2]">
                  {isHi ? group.labelHi : group.labelEn}
                </h4>
              </header>

              <ul className="space-y-2">
                {group.schemes.map((scheme) => (
                  <li key={scheme.schemeId}>
                    <button
                      type="button"
                      onClick={() => onSelectScheme?.(scheme.schemeId)}
                      className="w-full text-left rounded-xl border border-[#E2E2E0] dark:border-[#24342D] px-3 py-2.5 min-h-[44px] hover:border-[#B2CDBF] dark:hover:border-[#285743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      aria-label={`${scheme.schemeName} — ${isHi ? scheme.relationNoteHi : scheme.relationNoteEn}`}
                    >
                      <span className="block text-sm font-medium text-[#14453D] dark:text-[#F0F4F2]">
                        {scheme.schemeName}
                      </span>
                      <span className="block text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-0.5">
                        {isHi ? scheme.relationNoteHi : scheme.relationNoteEn}
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
                              ? `${isHi ? 'अंतिम सत्यापन' : 'Last verified'}: ${scheme.provenance.lastVerified}`
                              : undefined
                          }
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.article>
          );
        })}
      </motion.div>

      {combinabilityNotice && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-[#F0F4F2] dark:bg-[#1A2B24] p-3 text-xs text-[#3F4943] dark:text-[#9EB0A7]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{combinabilityNotice}</span>
        </p>
      )}
    </section>
  );
};

export default SupportStack;
