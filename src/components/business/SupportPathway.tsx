import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ListOrdered, Coins, Info } from 'lucide-react';
import { SupportPathway as SupportPathwayModel } from '../../types/supportPathway';
import { SUPPORT_NEEDS_TAXONOMY, SupportNeedType } from '../../types/business';
import { useTranslation } from '../../i18n';
import { formatLakhCrore } from '../../lib/business/fundingCalculator';
import {
  getLocalizedCombinabilityNotice,
  getLocalizedFundingDisclaimer,
  getLocalizedReadiness,
  getLocalizedReadinessCheck,
  getLocalizedSupportAreaReason,
} from '../../lib/business/supportPathway';
import { getLocalizedNeedLabel } from '../../i18n/schemeDetailI18n';
import { JourneyProgress } from './JourneyProgress';
import { NextBestActionCard } from './NextBestActionCard';
import { SupportStack } from './SupportStack';
import { PreparationChecklist } from './PreparationChecklist';
import { staggerContainer, staggerItem } from '../../animations/variants';
import type { PathwayAction } from '../../types/supportPathway';
import type { Language } from '../../i18n/types';

interface SupportPathwayProps {
  pathway: SupportPathwayModel;
  onAction?: (action: PathwayAction) => void;
  onSelectScheme?: (schemeId: string) => void;
  showChecklist?: boolean;
  onToggleChecklistItem?: (itemId: string) => void;
  lang?: Language;
  id?: string;
  className?: string;
}

const COPY = {
  pathwayTitle: {
    en: 'Your support pathway',
    hi: 'आपका सहायता मार्ग',
    ta: 'உங்கள் உதவிப் பாதை',
    te: 'మీ మద్దతు మార్గం',
    kn: 'ನಿಮ್ಮ ಬೆಂಬಲ ಮಾರ್ಗ',
    ml: 'നിങ്ങളുടെ സഹായ മാർഗ്ഗം',
  },
  pathwaySubtitle: {
    en: 'Based on available scheme information and your profile.',
    hi: 'उपलब्ध योजना जानकारी और आपकी प्रोफ़ाइल पर आधारित।',
    ta: 'கிடைக்கக்கூடிய திட்டத் தகவல் மற்றும் உங்கள் சுயவிவரத்தின் அடிப்படையில்.',
    te: 'అందుబాటులో ఉన్న పథకం సమాచారం మరియు మీ ప్రొఫైల్ ఆధారంగా.',
    kn: 'ಲಭ್ಯವಿರುವ ಯೋಜನೆಯ ಮಾಹಿತಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಧರಿಸಿ.',
    ml: 'ലഭ്യമായ പദ്ധതി വിവരങ്ങളുടെയും നിങ്ങളുടെ പ്രൊഫൈലിന്റെയും അടിസ്ഥാനത്തിൽ.',
  },
  currentPriorities: {
    en: 'Your current priorities',
    hi: 'आपकी वर्तमान प्राथमिकताएं',
    ta: 'உங்கள் தற்போதைய முன்னுரிமைகள்',
    te: 'మీ ప్రస్తుత ప్రాధాన్యతలు',
    kn: 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಆದ್ಯತೆಗಳು',
    ml: 'നിങ്ങളുടെ നിലവിലെ മുൻഗണനകൾ',
  },
  estFundingReq: {
    en: 'Estimated funding requirement',
    hi: 'अनुमानित वित्तीय आवश्यकता',
    ta: 'மதிப்பிடப்பட்ட நிதித் தேவை',
    te: 'అంచనా వేసిన నిధుల అవసరం',
    kn: 'ಅಂದಾಜು ಹಣಕಾಸಿನ ಅಗತ್ಯತೆ',
    ml: 'കണക്കാക്കിയ ഫണ്ടിംഗ് ആവശ്യം',
  },
  appReadiness: {
    en: 'Application readiness',
    hi: 'आवेदन तैयारी',
    ta: 'விண்ணப்பத் தயார்நிலை',
    te: 'దరఖాస్తు సన్నద్ధత',
    kn: 'ಅರ್ಜಿ ಸಿದ್ಧತೆ',
    ml: 'അപേക്ഷാ സന്നദ്ധത',
  },
  disclaimerNote: {
    en: 'This guidance is built from verified scheme information. Final eligibility is decided by the concerned department.',
    hi: 'यह मार्गदर्शन सत्यापित योजना जानकारी से बना है। अंतिम पात्रता का निर्णय संबंधित विभाग करता है।',
    ta: 'இந்த வழிகாட்டுதல் சரிபார்க்கப்பட்ட திட்டத் தகவலிலிருந்து உருவாக்கப்பட்டது. இறுதித் தகுதியை சம்பந்தப்பட்ட துறை தீர்மானிக்கிறது.',
    te: 'ఈ మార్గదర్శకత్వం ధృవీకరించబడిన పథకం సమాచారం నుండి రూపొందించబడింది. తుది అర్హతను సంబంధిత విభాగం నిర్ణయిస్తుంది.',
    kn: 'ಈ ಮಾರ್ಗದರ್ಶನವನ್ನು ಪರಿಶೀಲಿಸಿದ ಯೋಜನೆಯ ಮಾಹಿತಿಯಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ. ಅಂತಿಮ ಅರ್ಹತೆಯನ್ನು ಸಂಬಂಧಪಟ್ಟ ಇಲಾಖೆ ನಿರ್ಧರಿಸುತ್ತದೆ.',
    ml: 'ഈ മാർഗ്ഗനിർദ്ദേശം പരിശോധിച്ചുറപ്പിച്ച പദ്ധതി വിവരങ്ങളിൽ നിന്നാണ് നിർമ്മിച്ചിരിക്കുന്നത്. അന്തിമ യോഗ്യത ബന്ധപ്പെട്ട വകുപ്പാണ് തീരുമാനിക്കുന്നത്.',
  },
};

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
  onToggleChecklistItem,
  lang: propLang,
  id = 'support-pathway',
  className = '',
}) => {
  const { lang: hookLang } = useTranslation();
  const rawLang = propLang || hookLang;
  const l: Language = (rawLang in COPY.pathwayTitle) ? rawLang : 'en';
  const shouldReduceMotion = useReducedMotion();

  const primaryNeedInfo = pathway.primaryNeed
    ? SUPPORT_NEEDS_TAXONOMY[pathway.primaryNeed]
    : undefined;

  const topPriorities = pathway.recommendedSupportAreas.slice(0, 3);

  return (
    <section
      id={id}
      aria-label={COPY.pathwayTitle[l]}
      className={`space-y-4 ${className}`}
    >
      <header>
        <h2 className="text-base sm:text-lg font-semibold text-[#14453D] dark:text-[#F0F4F2]">
          {COPY.pathwayTitle[l]}
        </h2>
        <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-0.5">
          {COPY.pathwaySubtitle[l]}
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
          aria-label={COPY.currentPriorities[l]}
          className="rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4 sm:p-5"
        >
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7] mb-3">
            <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
            {COPY.currentPriorities[l]}
          </h3>

          <motion.ol
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            className="space-y-2"
          >
            {topPriorities.map((area, stepIdx) => {
              const areaLabel = getLocalizedNeedLabel(area.area as SupportNeedType, l) || (l === 'hi' ? area.labelHi : area.labelEn);
              const areaReason = getLocalizedSupportAreaReason(area, l);
              return (
                <motion.li
                  key={area.area}
                  variants={shouldReduceMotion ? undefined : staggerItem}
                  className="relative flex items-start gap-3 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] px-3 py-2.5 yj-hoverable"
                >
                  {/* Setu connector: draws downward as each step enters the viewport */}
                  {stepIdx < topPriorities.length - 1 && (
                    <motion.span
                      aria-hidden="true"
                      className="yj-setu-connector absolute left-[23px] top-[46px] w-0.5 origin-top"
                      style={{ height: 'calc(100% - 30px)' }}
                      initial={shouldReduceMotion ? undefined : { scaleY: 0, opacity: 0 }}
                      whileInView={shouldReduceMotion ? undefined : { scaleY: 1, opacity: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-lg bg-[#D4EFE1] dark:bg-[#1A382D] text-[11px] font-semibold text-[#0F6B4C] dark:text-[#4ADE80]">
                    {area.rank}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-[#14453D] dark:text-[#F0F4F2]">
                      {areaLabel}
                    </span>
                    <span className="block text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-0.5">
                      {areaReason}
                    </span>
                  </span>
                </motion.li>
              );
            })}
          </motion.ol>

          {/* Funding context — requirement, never an entitlement */}
          {pathway.funding.hasFundingDetails && pathway.funding.fundingGap > 0 && (
            <div className="mt-3 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] bg-[#F0F4F2] dark:bg-[#1A2B24] p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-[#14453D] dark:text-[#F0F4F2]">
                <Coins className="w-4 h-4" aria-hidden="true" />
                {COPY.estFundingReq[l]}: {formatLakhCrore(pathway.funding.fundingGap, l)}
              </p>
              <p className="text-xs text-[#3F4943] dark:text-[#9EB0A7] mt-1">
                {getLocalizedFundingDisclaimer(l)}
              </p>
            </div>
          )}

          {primaryNeedInfo && (
            <p className="sr-only">
              {getLocalizedNeedLabel(pathway.primaryNeed, l) || primaryNeedInfo.labelEn}
            </p>
          )}
        </section>
      )}

      {/* 4. Support stack */}
      <SupportStack
        groups={pathway.supportStack}
        combinabilityNotice={getLocalizedCombinabilityNotice(pathway, l)}
        onSelectScheme={onSelectScheme}
        id={`${id}-stack`}
      />

      {/* 5. Readiness */}
      <section
        aria-label={COPY.appReadiness[l]}
        className="rounded-2xl border border-[#E2E2E0] dark:border-[#24342D] bg-white dark:bg-[#132720] p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F4943] dark:text-[#9EB0A7]">
            {COPY.appReadiness[l]}
          </h3>
          <span className="rounded-full border border-[#B2CDBF] dark:border-[#285743] bg-[#D4EFE1] dark:bg-[#1A382D] px-2.5 py-1 text-[11px] font-semibold text-[#0F6B4C] dark:text-[#4ADE80]">
            {getLocalizedReadiness(pathway.readiness, l).label}
          </span>
        </div>

        <p className="text-sm text-[#3F4943] dark:text-[#9EB0A7] mb-3">
          {getLocalizedReadiness(pathway.readiness, l).summary}
        </p>

        <ul className="space-y-1.5">
          {pathway.readiness.checks.map((check) => {
            const { label: checkLabel, detail: checkDetail } = getLocalizedReadinessCheck(check, l);
            return (
              <li
                key={check.key}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#E2E2E0] dark:border-[#24342D] px-3 py-2"
              >
                <span className="text-sm text-[#14453D] dark:text-[#F0F4F2]">
                  {checkLabel}
                </span>
                <span className="text-xs text-right text-[#3F4943] dark:text-[#9EB0A7]">
                  {checkDetail}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 6. Preparation checklist (scheme-scoped) */}
      {showChecklist && (
        <PreparationChecklist
          checklist={pathway.preparationChecklist}
          id={`${id}-checklist`}
          onToggleItem={onToggleChecklistItem ? (itemId) => onToggleChecklistItem(itemId) : undefined}
        />
      )}

      <p className="flex items-start gap-2 text-xs text-[#3F4943] dark:text-[#9EB0A7]">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {COPY.disclaimerNote[l]}
        </span>
      </p>
    </section>
  );
};

export default SupportPathway;
