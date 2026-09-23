import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  User,
  Cpu,
  Scale,
  Gauge,
  Route,
  Users,
  Briefcase,
  Wallet,
  Cake,
  MapPin,
  Check,
  ListChecks,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { transitions, reducedMotionTransition } from '../../animations/transitions';
import { RevealOnScroll } from '../../animations/RevealOnScroll';
import { AnimatedScore } from '../ui';
import { SectionHeading } from './shared';

/* Actual engine weights from src/lib/matching/matchingCore.ts — display only */
const ENGINE_WEIGHTS = [
  { icon: Users, key: 'welcome.pathwayDimCategory', weight: 30 },
  { icon: Briefcase, key: 'welcome.pathwayDimBusiness', weight: 25 },
  { icon: Wallet, key: 'welcome.pathwayDimIncome', weight: 20 },
  { icon: Cake, key: 'welcome.pathwayDimAge', weight: 15 },
  { icon: MapPin, key: 'welcome.pathwayDimState', weight: 10 },
] as const;

export const MatchingEngine: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const stages = [
    {
      caption: t('welcome.pathwayProfileTitle'),
      icon: User,
      body: (
        <ul className="space-y-1.5">
          {ENGINE_WEIGHTS.map((d, i) => (
            <li key={i} className="text-[12px] font-semibold text-[#3F4943] dark:text-[#C5D5CC]">
              {t(d.key)}
            </li>
          ))}
        </ul>
      ),
    },
    {
      caption: t('welcome.matchingStepFactors'),
      icon: Cpu,
      body: (
        <ul className="space-y-1.5">
          {ENGINE_WEIGHTS.map((d, i) => (
            <li key={i} className="flex items-center justify-between text-[12px] font-bold">
              <span className="text-[#3F4943] dark:text-[#C5D5CC]">{t(d.key)}</span>
              <span className="text-[#1E6A50] dark:text-[#4ADE80] tabular-nums">{d.weight}%</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      caption: t('welcome.matchingStepEligibility'),
      icon: Scale,
      body: (
        <p className="flex items-start gap-2 text-[12px] font-semibold text-[#3F4943] dark:text-[#C5D5CC] leading-relaxed">
          <Check className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80] shrink-0 mt-0.5" aria-hidden="true" />
          {t('welcome.explainEligibilityDesc')}
        </p>
      ),
    },
    {
      caption: t('welcome.matchingStepConfidence'),
      icon: Gauge,
      body: (
        <div className="flex items-baseline gap-1">
          <AnimatedScore
            value={86}
            suffix="%"
            duration={1}
            className="text-3xl font-extrabold text-[#14453D] dark:text-[#4ADE80] tabular-nums"
          />
        </div>
      ),
    },
    {
      caption: t('welcome.matchingStepPathway'),
      icon: Route,
      body: (
        <ul className="space-y-1.5">
          {[t('welcome.pathwayResultEligible'), t('welcome.pathwayResultNear'), t('welcome.pathwayResultLow')].map(
            (r, i) => (
              <li key={i} className="flex items-center gap-2 text-[12px] font-bold text-[#3F4943] dark:text-[#C5D5CC]">
                <ListChecks className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80] shrink-0" aria-hidden="true" />
                {r}
              </li>
            )
          )}
        </ul>
      ),
    },
  ];

  return (
    <section id="welcome-matching" className="bg-white dark:bg-[#111714] border-y border-[#E4E8E4] dark:border-[#24342D] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <SectionHeading title={t('welcome.matchingTitle')} subtitle={t('welcome.matchingSubtitle')} />

        {/* 5-stage stepper */}
        <motion.ol
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView={shouldReduceMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-80px' }}
          className="relative grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:gap-2 items-stretch max-w-6xl mx-auto"
        >
          {stages.map((stage, idx) => (
            <React.Fragment key={idx}>
              <motion.li
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="yj-card p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md hover:border-[#1E6A50]/40 dark:hover:border-[#4ADE80]/40 transition-all duration-200"
              >
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E6A50] dark:text-[#4ADE80] mb-3">
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full bg-[#14453D] dark:bg-[#4ADE80] text-white dark:text-[#0E1311] text-[10px] font-extrabold flex items-center justify-center"
                  >
                    {idx + 1}
                  </span>
                  {stage.caption}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center">
                    <stage.icon className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
                  </span>
                </div>
                {stage.body}
              </motion.li>
              {idx < stages.length - 1 && (
                <motion.li
                  aria-hidden="true"
                  variants={shouldReduceMotion ? undefined : staggerItem}
                  className="hidden lg:flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5 text-[#1E6A50]/50 dark:text-[#4ADE80]/50" />
                </motion.li>
              )}
            </React.Fragment>
          ))}
        </motion.ol>

        {/* Detailed weight panel */}
        <RevealOnScroll className="max-w-3xl mx-auto mt-8">
          <div className="rounded-2xl bg-[#14453D] dark:bg-[#1C5045] p-5 sm:p-7">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#BFD9CE] mb-5 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4ADE80]" aria-hidden="true" />
              {t('welcome.pathwayEngineTitle')}
            </h3>
            <ul className="space-y-4">
              {ENGINE_WEIGHTS.map((dim, i) => (
                <li key={i}>
                  <div className="flex items-center justify-between text-[13px] font-semibold text-white mb-1.5">
                    <span className="flex items-center gap-2">
                      <dim.icon className="w-4 h-4 text-[#4ADE80]" aria-hidden="true" />
                      {t(dim.key)}
                    </span>
                    <AnimatedScore value={dim.weight} suffix="%" duration={0.7} className="tabular-nums" />
                  </div>
                  <div className="h-1.5 rounded-full bg-white/15 overflow-hidden" aria-hidden="true">
                    <motion.div
                      className="h-full rounded-full bg-[#4ADE80]"
                      initial={shouldReduceMotion ? undefined : { width: 0 }}
                      whileInView={{ width: `${dim.weight}%` }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={
                        shouldReduceMotion
                          ? reducedMotionTransition
                          : { ...transitions.smooth, delay: i * 0.08, duration: 0.7 }
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </RevealOnScroll>

        <p className="mt-6 text-center text-xs text-[#8FA197] dark:text-[#6E7F76] max-w-2xl mx-auto leading-relaxed">
          {t('welcome.pathwayIllustrative')}
        </p>
      </div>
    </section>
  );
};
