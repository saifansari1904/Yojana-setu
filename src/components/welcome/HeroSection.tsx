import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  Check,
  Sparkles,
  User,
  Briefcase,
  MapPin,
  Wallet,
  Cpu,
  Users,
  Cake,
  FileCheck2,
} from 'lucide-react';
import { YojanaSetuLogo } from '../YojanaSetuLogo';
import { useTranslation } from '../../i18n';
import { fadeUp, staggerContainer } from '../../animations/variants';
import { transitions, reducedMotionTransition } from '../../animations/transitions';
import { ArrowFillButton, AnimatedScore } from '../ui';
import { FlowConnector, VizEyebrow } from './shared';

/* ------------------------------------------------------------------ */
/* Sequenced product-flow visualization:                               */
/* profile -> matching engine (factors illuminate) -> result -> action. */
/* Purely illustrative; all copy via i18n.                             */
/* ------------------------------------------------------------------ */
const ENGINE_FACTORS = [
  { icon: Users, key: 'welcome.pathwayDimCategory', weight: 30 },
  { icon: Briefcase, key: 'welcome.pathwayDimBusiness', weight: 25 },
  { icon: Wallet, key: 'welcome.pathwayDimIncome', weight: 20 },
  { icon: Cake, key: 'welcome.pathwayDimAge', weight: 15 },
  { icon: MapPin, key: 'welcome.pathwayDimState', weight: 10 },
] as const;

const ProductFlowVisual = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const profileChips = [
    { icon: Briefcase, value: t('welcome.flowBizValue') },
    { icon: MapPin, value: t('welcome.flowLocValue') },
    { icon: Wallet, value: t('welcome.flowIncValue') },
  ];

  const resultChecks = [
    t('welcome.flowCheck1'),
    t('welcome.flowCheck2'),
    t('welcome.flowCheck3'),
  ];

  const stage = (delay: number) =>
    shouldReduceMotion
      ? undefined
      : { ...transitions.smooth, delay };

  return (
    <div
      aria-hidden="true"
      className="relative rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-white/80 dark:bg-[#141b17]/80 backdrop-blur-sm shadow-[0_24px_60px_-24px_rgba(20,69,61,0.25)] p-3 sm:p-4 overflow-hidden min-w-0"
    >
      {/* soft top accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#14453D] via-[#1E6A50] to-[#4ADE80]" />

      {/* Stage 1 — profile as inline chips */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={stage(0.15)}
      >
        <VizEyebrow icon={User}>{t('welcome.flowProfileTitle')}</VizEyebrow>
        <div className="flex flex-wrap gap-1.5">
          {profileChips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#141b17] px-2.5 py-1 text-[11px] font-bold text-[#1A1C1B] dark:text-[#E2E8E4]"
            >
              <chip.icon className="w-3 h-3 text-[#14453D] dark:text-[#4ADE80]" />
              {chip.value}
            </span>
          ))}
        </div>
      </motion.div>

      <FlowConnector className="my-1" />

      {/* Stage 2 — matching engine, slim weighted bars illuminate sequentially */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={stage(0.45)}
        className="relative rounded-xl bg-[#14453D] dark:bg-[#1C5045] px-3.5 py-3 overflow-hidden"
      >
        {!shouldReduceMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl border-2 border-[#4ADE80]/60"
            animate={{ opacity: [0.7, 0], scale: [1, 1.1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <p className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#BFD9CE] mb-2">
          <Cpu className="w-3.5 h-3.5 text-[#4ADE80]" />
          {t('welcome.flowEngineTitle')}
        </p>
        <ul className="relative space-y-1">
          {ENGINE_FACTORS.map((f, i) => (
            <motion.li
              key={f.key}
              initial={shouldReduceMotion ? undefined : { opacity: 0.35, x: -8 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={stage(0.75 + i * 0.18)}
              className="flex items-center gap-2"
            >
              <f.icon className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
              <span className="flex-1 min-w-0 truncate text-[11px] font-semibold text-white">
                {t(f.key)}
              </span>
              <span className="w-14 sm:w-20 h-1 rounded-full bg-white/15 overflow-hidden shrink-0">
                <motion.span
                  className="block h-full rounded-full bg-[#4ADE80]"
                  initial={shouldReduceMotion ? undefined : { width: 0 }}
                  animate={{ width: `${f.weight}%` }}
                  transition={stage(0.9 + i * 0.18)}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-[11px] font-extrabold text-[#4ADE80] tabular-nums">
                {f.weight}%
              </span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <FlowConnector className="my-1" />

      {/* Stage 3 — match result, horizontal */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={stage(1.5)}
        className="rounded-xl border-2 border-[#1E6A50]/30 dark:border-[#4ADE80]/30 bg-[#F0F7F3] dark:bg-[#122019] px-3.5 py-2.5 flex items-center gap-3"
      >
        <AnimatedScore
          value={86}
          suffix="%"
          duration={1.1}
          className="text-[1.7rem] leading-none font-extrabold text-[#14453D] dark:text-[#4ADE80] tabular-nums shrink-0"
        />
        <ul className="min-w-0">
          {resultChecks.map((c, i) => (
            <motion.li
              key={i}
              initial={shouldReduceMotion ? undefined : { opacity: 0, x: -6 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={stage(1.7 + i * 0.12)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1A1C1B] dark:text-[#E2E8E4] truncate"
            >
              <Check className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80] shrink-0" />
              <span className="truncate">{c}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <FlowConnector className="my-1" />

      {/* Stage 4 — next best action */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={stage(1.95)}
        className="rounded-xl border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#141b17] px-3.5 py-2.5 flex items-center gap-2.5"
      >
        <span className="w-8 h-8 rounded-lg bg-[#14453D] dark:bg-[#1C5045] flex items-center justify-center shrink-0">
          <FileCheck2 className="w-4 h-4 text-[#4ADE80]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197]">
            {t('welcome.flowNextTitle')}
          </span>
          <span className="block text-[12px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2] truncate">
            {t('welcome.flowNextDesc')}
          </span>
        </span>
      </motion.div>

      <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-[#8FA197] dark:text-[#6E7F76]">
        {t('welcome.flowIllustrative')}
      </p>
    </div>
  );
};

interface HeroSectionProps {
  onFindSchemes: () => void;
  onNavigate: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onFindSchemes, onNavigate }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="welcome-hero" className="relative overflow-hidden scroll-mt-20">
      {/* restrained backdrop: soft radial wash, no heavy gradients */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(720px 380px at 82% 8%, rgba(30,106,80,0.10), transparent 65%), radial-gradient(560px 320px at 8% 90%, rgba(20,69,61,0.07), transparent 60%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pt-12 sm:pb-14 lg:py-12 lg:min-h-[calc(100svh-4rem)] lg:flex lg:items-center">
        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] gap-8 lg:gap-14 items-center w-full">
          {/* LEFT — copy */}
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            className="max-w-xl min-w-0"
          >
            <motion.div variants={shouldReduceMotion ? undefined : fadeUp} className="mb-4">
              <YojanaSetuLogo size="md" horizontal showTaglines={false} showEnglishPill={false} />
            </motion.div>
            <motion.p
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="inline-flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#1E6A50] dark:text-[#4ADE80] bg-[#D9E8DF]/70 dark:bg-[#1A382D]/70 border border-[#BFD9CE]/60 dark:border-[#22503E]/60 rounded-full px-3 py-1.5 mb-4 sm:mb-5 max-w-full text-center"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              {t('welcome.heroEyebrow')}
            </motion.p>
            <motion.h1
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="text-[clamp(1.9rem,7.5vw,2.35rem)] leading-[1.08] sm:text-5xl lg:text-[3.4rem] font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-4 sm:mb-5 text-balance break-words"
            >
              {t('welcome.heroTitle')}
            </motion.h1>
            <motion.p
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="text-[15px] sm:text-lg text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed mb-6 sm:mb-8 break-words"
            >
              {t('welcome.heroSubtitle')}
            </motion.p>
            <motion.div
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <ArrowFillButton
                onClick={onFindSchemes}
                variant="primary"
                size="lg"
                className="group min-w-[220px] justify-center"
              >
                {t('welcome.heroPrimaryCta')}
              </ArrowFillButton>
              <button
                onClick={() => onNavigate('welcome-how-it-works')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl text-sm font-bold text-[#14453D] dark:text-[#4ADE80] border border-[#14453D]/25 dark:border-[#4ADE80]/25 hover:border-[#14453D]/60 dark:hover:border-[#4ADE80]/60 hover:bg-[#14453D]/5 dark:hover:bg-[#4ADE80]/5 transition-all cursor-pointer"
              >
                {t('welcome.heroSecondaryCta')}
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </motion.div>
            <motion.p
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E6A50] dark:text-[#4ADE80]"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              {t('welcome.heroNoAccount')}
            </motion.p>
          </motion.div>

          {/* RIGHT — product visualization */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: 0.15 }}
            className="relative min-w-0"
          >
            <ProductFlowVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
