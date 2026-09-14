import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ListOrdered, Coins, Info } from 'lucide-react';
import { SupportPathway as SupportPathwayModel } from '../../types/supportPathway';
import { SUPPORT_NEEDS_TAXONOMY } from '../../types/business';
import { useTranslation } from '../../i18n';
import { formatLakhCrore } from '../../lib/business/fundingCalculator';
import { JourneyProgress } from './JourneyProgress';
import { NextBestActionCard } from './NextBestActionCard';
import { SupportStack } from './SupportStack';
import { PreparationChecklist } from './PreparationChecklist';
import { staggerContainer, staggerItem } from '../../animations/variants';
import type { PathwayAction } from '../../types/supportPathway';

interface SupportPathwayProps {
  pathway: SupportPathwayModel;
  onAction?: (action: PathwayAction) => void;
  onSelectScheme?: (schemeId: string) => void;
  showChecklist?: boolean;
  id?: string;
  className?: string;
}

/**
 * Phase 4.2 — Business Support Pathway.
 *
 * Section order (mobile-first: the next step and current stage come before any
 * secondary information):
 *   Next Best Action → Current Stage / Journey → Support Priorities →
 *   Support Stack → Preparation Checklist
 *
 * All content is derived by the deterministic engine in lib/business. This
 * component renders; it never calculates eligibility.
 */
export const SupportPathway: React.FC<SupportPathwayProps> = ({
  pathway,
  onAction,
  onSelectScheme,
  showChecklist = false,
  id = 'support-pathway',
  className = '',
}) => {
  const { lang } = useTranslation();
  const isHi = lang === 'hi';
  const shouldReduceMotion = useReducedMotion();

  const primaryNeedInfo = pathway.primaryNeed
    ? SUPPORT_NEEDS_TAXONOMY[pathway.primaryNeed]
    : undefined;

  const topPriorities = pathway.recommendedSupportAreas.slice(0, 3);

  return (
    <section
      id={id}
      aria-label={isHi ? 'आपका सहायता मार्ग' : 'Your support pathway'}
      className={`space-y-4 ${className}`}
    >
      <header>
        <h2 className="text-base sm:text-lg font-semibold text-[#14453D] dark:text-[#F0F4F2]">
          {isHi ? 'आपका सहायता मार्ग' : 'Your support pathway'}
        </h2>
        <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-0.5">
          {isHi
            ? 'उपलब्ध योजना जानकारी और आपकी प्रोफ़ाइल पर आधारित।'
            : 'Based on available scheme information and your profile.'}
        </p>
      </header>

      {/* 1. Next Best Action — first on every viewport */}
      <NextBestActionCard
        action={pathway.nextBestAction}
        secondaryActions={pathway.secondaryActions}
        onAction={onAction}
        id={`${id}-nba`}
      />

      {/* 2. Current stage + journey */}
      <JourneyProgress currentStage={pathway.journeyStage} id={`${id}-journey`} />

      {/* 3. Support priorities */}
      {topPriorities.length > 0 && (
        <section
          aria-label={isHi ? 'आपकी वर्तमान प्राथमिकताएं' : 'Your current priorities'}
          className="rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4 sm:p-5"
        >
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7] mb-3">
            <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
            {isHi ? 'आपकी वर्तमान प्राथमिकताएं' : 'Your current priorities'}
          </h3>

          <motion.ol
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            className="space-y-2"
          >
            {topPriorities.map((area) => (
              <motion.li
                key={area.area}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="flex items-start gap-3 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] px-3 py-2.5"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-lg bg-[#D4EFE1] dark:bg-[#1A382D] text-[11px] font-semibold text-[#0F6B4C] dark:text-[#4ADE80]">
                  {area.rank}
                </span>
                <span>
                  <span className="block text-sm font-medium text-[#14453D] dark:text-[#F0F4F2]">
                    {isHi ? area.labelHi : area.labelEn}
                  </span>
                  <span className="block text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-0.5">
                    {isHi ? area.reasonHi : area.reasonEn}
                  </span>
                </span>
              </motion.li>
            ))}
          </motion.ol>

          {/* Funding context — requirement, never an entitlement */}
          {pathway.funding.hasFundingDetails && pathway.funding.fundingGap > 0 && (
            <div className="mt-3 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-[#F0F4F2] dark:bg-[#1A2B24] p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-[#14453D] dark:text-[#F0F4F2]">
                <Coins className="w-4 h-4" aria-hidden="true" />
                {isHi ? 'अनुमानित वित्तीय आवश्यकता' : 'Estimated funding requirement'}
                : {formatLakhCrore(pathway.funding.fundingGap, lang)}
              </p>
              <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-1">
                {isHi ? pathway.funding.disclaimerHi : pathway.funding.disclaimerEn}
              </p>
            </div>
          )}

          {primaryNeedInfo && (
            <p className="sr-only">
              {isHi
                ? `प्राथमिक आवश्यकता: ${primaryNeedInfo.labelHi}`
                : `Primary need: ${primaryNeedInfo.labelEn}`}
            </p>
          )}
        </section>
      )}

      {/* 4. Support stack */}
      <SupportStack
        groups={pathway.supportStack}
        combinabilityNotice={
          isHi ? pathway.combinabilityNoticeHi : pathway.combinabilityNoticeEn
        }
        onSelectScheme={onSelectScheme}
        id={`${id}-stack`}
      />

      {/* 5. Readiness */}
      <section
        aria-label={isHi ? 'आवेदन तैयारी स्थिति' : 'Application readiness'}
        className="rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7]">
            {isHi ? 'आवेदन तैयारी' : 'Application readiness'}
          </h3>
          <span className="rounded-full border border-[#B2CDBF] dark:border-[#285743] bg-[#D4EFE1] dark:bg-[#1A382D] px-2.5 py-1 text-[11px] font-semibold text-[#0F6B4C] dark:text-[#4ADE80]">
            {isHi ? pathway.readiness.labelHi : pathway.readiness.labelEn}
          </span>
        </div>

        <p className="text-sm text-[#3F4943] dark:text-[#9EB0A7] mb-3">
          {isHi ? pathway.readiness.summaryHi : pathway.readiness.summaryEn}
        </p>

        <ul className="space-y-1.5">
          {pathway.readiness.checks.map((check) => (
            <li
              key={check.key}
              className="flex items-start justify-between gap-3 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] px-3 py-2"
            >
              <span className="text-sm text-[#14453D] dark:text-[#F0F4F2]">
                {isHi ? check.labelHi : check.labelEn}
              </span>
              <span className="text-xs text-right text-[#3F4943] dark:text-[#9EB0A7]">
                {isHi ? check.detailHi : check.detailEn}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Preparation checklist (scheme-scoped) */}
      {showChecklist && (
        <PreparationChecklist checklist={pathway.preparationChecklist} id={`${id}-checklist`} />
      )}

      <p className="flex items-start gap-2 text-xs text-[#3F4943] dark:text-[#9EB0A7]">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {isHi
            ? 'यह मार्गदर्शन सत्यापित योजना जानकारी से बना है। अंतिम पात्रता का निर्णय संबंधित विभाग करता है।'
            : 'This guidance is built from verified scheme information. Final eligibility is decided by the concerned department.'}
        </span>
      </p>
    </section>
  );
};

export default SupportPathway;
