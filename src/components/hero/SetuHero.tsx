import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  UserRound,
  ClipboardList,
  BrainCircuit,
  Landmark,
  Rocket,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { ArrowFillButton } from '../ui';
import { YojanaSetuLogo } from '../YojanaSetuLogo';
import { useTranslation } from '../../i18n';
import { transitions, reducedMotionTransition } from '../../animations/transitions';

interface SetuHeroProps {
  /** Primary CTA — starts the business profile journey. */
  onFindSchemes: () => void;
  /** Secondary CTA — scrolls to the "how it works" explanation. */
  onExploreHowItWorks: () => void;
  /**
   * Compact mode: renders only the copy + CTAs (no Setu rail, no outer
   * spacing) so the hero can sit beside the sign-in card above the fold.
   */
  compact?: boolean;
}

/**
 * Landing hero — "Premium Government Intelligence".
 *
 * Presentation only: both CTAs call handlers owned by the parent screen, so no
 * routing or assessment behaviour changes here. The five-step rail renders the
 * Setu (bridge) metaphor as a connected journey rather than a decorative
 * illustration, and collapses to a horizontal strip on mobile.
 */
export const SetuHero: React.FC<SetuHeroProps> = ({
  onFindSchemes,
  onExploreHowItWorks,
  compact = false,
}) => {
  const { lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const isHindi = lang === 'hi';

  const steps = [
    {
      icon: UserRound,
      label: isHindi ? 'उद्यमी' : 'Entrepreneur',
      hint: isHindi ? 'आपका व्यवसाय' : 'You and your business',
    },
    {
      icon: ClipboardList,
      label: isHindi ? 'प्रोफाइल' : 'Profile',
      hint: isHindi ? 'संरभित जानकारी' : 'Structured details',
    },
    {
      icon: BrainCircuit,
      label: isHindi ? 'इंटेलिजेंस' : 'Intelligence',
      hint: isHindi ? 'निश्चित नियम गणना' : 'Deterministic rules',
    },
    {
      icon: Landmark,
      label: isHindi ? 'सरकारी योजनां' : 'Government schemes',
      hint: isHindi ? 'सत्यापित स्रोत' : 'Verified sources',
    },
    {
      icon: Rocket,
      label: isHindi ? 'अगला कदम' : 'Action',
      hint: isHindi ? 'तैयारी और आवेदन' : 'Prepare and apply',
    },
  ];

  /** Trust pillars shown beside the sign-in card in compact mode. */
  const pillars = [
    {
      icon: ShieldCheck,
      tile: 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0B5D4B] dark:text-[#4ADE80]',
      title: isHindi ? 'गजट-सत्यापित नियम इंजन' : 'Gazette-Verified Rules Engine',
      body: isHindi
        ? 'कोई AI अनुमान नहीं। मेल केवल आधिकारिक मंत्रालय मानदंडों से गणना होता है।'
        : 'Zero AI hallucinations. Matching is computed strictly from official ministry criteria.',
    },
    {
      icon: Lock,
      tile: 'bg-[#FEF3C7] dark:bg-[#3B2F14] text-[#92610A] dark:text-[#FCD34D]',
      title: isHindi ? 'गोपनीयता-प्रथम संरचना' : 'Privacy-First Architecture',
      body: isHindi
        ? 'आपकी जानकारी आपके ब्राउज़र सत्र में रहती है; कोई संवेदनशील पहचान संग्रहित नहीं होती।'
        : 'Your details stay in your browser session. No sensitive identifiers are stored.',
    },
  ];

  /**
   * Compact variant — brand emblem, headline, CTAs and trust pillars, sized to
   * sit beside the sign-in card without pushing it below the fold.
   */
  if (compact) {
    return (
      <section id="landing-hero" className="w-full" aria-labelledby="landing-hero-heading">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? reducedMotionTransition : transitions.smooth}
        >
          <div className="flex justify-center lg:justify-start">
            <YojanaSetuLogo size="lg" showTaglines={false} showEnglishPill={false} />
          </div>

          <h1
            id="landing-hero-heading"
            className={`yj-h1 mt-5 text-center lg:text-left text-[#0F1512] dark:text-[#F0F4F2] ${
              isHindi ? 'font-hindi' : ''
            }`}
          >
            {isHindi ? (
              <>
                उद्यमियों और{' '}
                <span className="text-[#0B5D4B] dark:text-[#4ADE80] border-b-2 border-[#D99A2B] dark:border-[#E3A83B]">
                  सरकारी योजनाओं
                </span>{' '}
                के बीच बुद्धिमान सेतु
              </>
            ) : (
              <>
                The Intelligent Bridge Between Entrepreneurs &amp;{' '}
                <span className="text-[#0B5D4B] dark:text-[#4ADE80] border-b-2 border-[#D99A2B] dark:border-[#E3A83B]">
                  Government Schemes
                </span>
              </>
            )}
          </h1>

          <p
            className={`yj-body yj-measure mt-4 mx-auto lg:mx-0 text-center lg:text-left text-[#42544C] dark:text-[#A9BDB3] ${
              isHindi ? 'font-hindi' : ''
            }`}
          >
            {isHindi
              ? 'सूक्ष्म, लघु और ग्रामीण उद्यमियों को निश्चित पात्रता सत्यापन, वास्तविक-समय वित्तीय गणना और मार्गदर्शित आवेदन सहायता के साथ सशक्त बनाना।'
              : 'Empowering micro, small, and rural entrepreneurs with deterministic eligibility verification, real-time funding calculations, and guided application assistance.'}
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <ArrowFillButton id="hero-find-schemes-btn" onClick={onFindSchemes} variant="primary" size="md">
              {isHindi ? 'मेरी योजनाएं खोजें' : 'Find My Schemes'}
            </ArrowFillButton>
            <ArrowFillButton
              id="hero-how-it-works-btn"
              onClick={onExploreHowItWorks}
              variant="secondary"
              size="md"
            >
              {isHindi ? 'यह कैसे काम करता है' : 'Explore How It Works'}
            </ArrowFillButton>
          </div>

          <ul className="mt-6 space-y-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li
                  key={pillar.title}
                  className="yj-card p-3.5 flex items-start gap-3 transition-colors duration-200"
                >
                  <span
                    aria-hidden="true"
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${pillar.tile}`}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span
                      className={`block yj-support font-bold text-[#0F1512] dark:text-[#F0F4F2] ${
                        isHindi ? 'font-hindi' : ''
                      }`}
                    >
                      {pillar.title}
                    </span>
                    <span
                      className={`block yj-caption text-[#6F7A73] dark:text-[#8E9F97] ${
                        isHindi ? 'font-hindi' : ''
                      }`}
                    >
                      {pillar.body}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </section>
    );
  }

  return (
    <section
      id="landing-hero"
      className="w-full max-w-5xl mx-auto mb-10 sm:mb-12"
      aria-labelledby="landing-hero-heading"
    >
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
        {/* Copy + CTAs */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? reducedMotionTransition : transitions.smooth}
        >
          <span className="yj-eyebrow inline-flex items-center gap-2 text-[#0B5D4B] dark:text-[#4ADE80]">
            <span className="w-6 h-px yj-gradient-highlight inline-block" aria-hidden="true" />
            {isHindi ? 'योजना सेतु इंटेलिजेंस' : 'Yojana Setu Intelligence'}
          </span>

          <h1
            id="landing-hero-heading"
            className={`yj-display mt-3 text-[#0F1512] dark:text-[#F0F4F2] ${isHindi ? 'font-hindi' : ''}`}
          >
            {isHindi ? (
              <>
                अपने व्यवसाय के लिए{' '}
                <span className="text-[#0B5D4B] dark:text-[#4ADE80]">सही सरकारी सहायता</span> खोजें।
              </>
            ) : (
              <>
                Discover the right{' '}
                <span className="text-[#0B5D4B] dark:text-[#4ADE80]">government support</span> for your business.
              </>
            )}
          </h1>

          <p className={`yj-body-lg yj-measure mt-4 text-[#42544C] dark:text-[#A9BDB3] ${isHindi ? 'font-hindi' : ''}`}>
            {isHindi
              ? 'अपनी प्रोफाइल भरें और देखें कि कौन सी योजनाएं आपसे मेल खाती हैं, क्यों मेल खाती हैं, और आगे क्या करना है — सब सत्यापित सरकारी स्रोतों से।'
              : 'Answer a short profile, then see which schemes match you, exactly why they match, and what to do next — every recommendation traced to a verified government source.'}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <ArrowFillButton
              id="hero-find-schemes-btn"
              onClick={onFindSchemes}
              variant="primary"
              size="lg"
            >
              {isHindi ? 'मेरी योजनाएं खोजें' : 'Find My Schemes'}
            </ArrowFillButton>
            <ArrowFillButton
              id="hero-how-it-works-btn"
              onClick={onExploreHowItWorks}
              variant="secondary"
              size="lg"
            >
              {isHindi ? 'यह कैसे काम करता है' : 'Explore How It Works'}
            </ArrowFillButton>
          </div>
        </motion.div>

        {/* Setu rail — the bridge metaphor as a connected journey */}
        <motion.ol
          aria-label={isHindi ? 'योजना सेतु यात्रा' : 'Yojana Setu journey'}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          variants={
            shouldReduceMotion
              ? undefined
              : { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } }
          }
          className="yj-card yj-card-lg p-5 sm:p-6 relative"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            return (
              <motion.li
                key={step.label}
                variants={
                  shouldReduceMotion
                    ? undefined
                    : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }
                }
                transition={shouldReduceMotion ? reducedMotionTransition : transitions.normal}
                className="relative flex items-start gap-3 pb-5 last:pb-0"
              >
                {/* Connector: the "setu" between two stages */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[17px] top-9 bottom-1 w-0.5 rounded-full yj-setu-connector"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-[#C1E2D0] dark:border-[#24342D] bg-[#F1F5F3] dark:bg-[#102E29] text-[#0B5D4B] dark:text-[#4ADE80]"
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </span>
                <span className="pt-1">
                  <span
                    className={`block yj-support font-semibold text-[#0F1512] dark:text-[#F0F4F2] ${
                      isHindi ? 'font-hindi' : ''
                    }`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`block yj-caption text-[#6F7A73] dark:text-[#8E9F97] ${isHindi ? 'font-hindi' : ''}`}
                  >
                    {step.hint}
                  </span>
                </span>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
};
