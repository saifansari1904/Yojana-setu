import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Cpu, RotateCcw, User, FileCheck2, FlaskConical } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { transitions } from '../../animations/transitions';
import { RevealOnScroll } from '../../animations/RevealOnScroll';
import { AnimatedScore } from '../ui';
import { SectionHeading, FlowConnector, VizEyebrow } from './shared';

interface DemoState {
  biz: number;
  loc: number;
  inc: number;
  cat: number;
}

/* Deterministic illustrative score from the chosen options — frontend only,
   clearly labelled as a demonstration. Not the real matching engine. */
const demoScore = (s: DemoState) => 78 + ((s.biz * 3 + s.loc * 5 + s.inc * 7 + s.cat * 11) % 15);

const FACTOR_KEYS = [
  'welcome.pathwayDimCategory',
  'welcome.pathwayDimBusiness',
  'welcome.pathwayDimIncome',
  'welcome.pathwayDimAge',
  'welcome.pathwayDimState',
] as const;

export const MiniDemo: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [sel, setSel] = useState<DemoState>({ biz: 0, loc: 0, inc: 0, cat: 0 });
  const [animKey, setAnimKey] = useState(0);

  const groups: { label: string; key: keyof DemoState; options: string[] }[] = [
    {
      label: t('welcome.demoBizLabel'),
      key: 'biz',
      options: [t('welcome.demoBiz1'), t('welcome.demoBiz2'), t('welcome.demoBiz3')],
    },
    {
      label: t('welcome.demoLocLabel'),
      key: 'loc',
      options: [t('welcome.demoLoc1'), t('welcome.demoLoc2'), t('welcome.demoLoc3')],
    },
    {
      label: t('welcome.demoIncLabel'),
      key: 'inc',
      options: [t('welcome.demoInc1'), t('welcome.demoInc2'), t('welcome.demoInc3')],
    },
    {
      label: t('welcome.demoCatLabel'),
      key: 'cat',
      options: [t('welcome.demoCat1'), t('welcome.demoCat2'), t('welcome.demoCat3')],
    },
  ];

  const choose = (key: keyof DemoState, idx: number) => {
    setSel((prev) => ({ ...prev, [key]: idx }));
    setAnimKey((k) => k + 1);
  };

  const chosenValues = [
    groups[0].options[sel.biz],
    groups[1].options[sel.loc],
    groups[2].options[sel.inc],
    groups[3].options[sel.cat],
  ];
  const score = demoScore(sel);

  const stage = (delay: number) =>
    shouldReduceMotion ? undefined : { ...transitions.smooth, delay };

  return (
    <section id="welcome-demo" className="bg-white dark:bg-[#141b17] border-y border-[#E4E8E4] dark:border-[#24342D] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <SectionHeading title={t('welcome.demoTitle')} subtitle={t('welcome.demoSubtitle')} />

        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
          {/* LEFT — example selectors */}
          <RevealOnScroll className="yj-card p-5 sm:p-6 min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197] mb-5">
              <FlaskConical className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80]" aria-hidden="true" />
              {t('welcome.demoControlsTitle')}
            </p>
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.key}>
                  <p id={`demo-${g.key}-label`} className="text-[13px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
                    {g.label}
                  </p>
                  <div role="radiogroup" aria-labelledby={`demo-${g.key}-label`} className="flex flex-wrap gap-2">
                    {g.options.map((opt, i) => {
                      const active = sel[g.key] === i;
                      return (
                        <button
                          key={i}
                          role="radio"
                          aria-checked={active}
                          onClick={() => choose(g.key, i)}
                          className={`px-4 py-2.5 min-h-[44px] rounded-lg text-[13px] font-bold border transition-all duration-150 cursor-pointer ${
                            active
                              ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#1C5045] shadow-sm'
                              : 'bg-white dark:bg-[#141b17] text-[#3F4943] dark:text-[#C5D5CC] border-[#E4E8E4] dark:border-[#2A3C34] hover:border-[#1E6A50]/60 dark:hover:border-[#4ADE80]/60'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAnimKey((k) => k + 1)}
              className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold text-[#1E6A50] dark:text-[#4ADE80] hover:underline underline-offset-4 cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              {t('welcome.demoReplay')}
            </button>
          </RevealOnScroll>

          {/* RIGHT — deterministic visual demonstration */}
          <div
            key={animKey}
            aria-hidden="true"
            className="rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#0E1311] p-5 sm:p-6"
          >
            <VizEyebrow icon={User}>{t('welcome.flowProfileTitle')}</VizEyebrow>
            <motion.ul
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={stage(0.1)}
              className="flex flex-wrap gap-2 mb-1"
            >
              {chosenValues.map((v, i) => (
                <li
                  key={i}
                  className="text-[12px] font-bold text-[#14453D] dark:text-[#4ADE80] bg-[#D9E8DF] dark:bg-[#1A382D] rounded-full px-3 py-1.5"
                >
                  {v}
                </li>
              ))}
            </motion.ul>

            <FlowConnector className="my-1" />

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={stage(0.35)}
              className="rounded-xl bg-[#14453D] dark:bg-[#1C5045] px-4 py-3.5"
            >
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#BFD9CE] mb-2.5">
                <Cpu className="w-4 h-4 text-[#4ADE80]" />
                {t('welcome.flowEngineTitle')}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {FACTOR_KEYS.map((k, i) => (
                  <motion.li
                    key={k}
                    initial={shouldReduceMotion ? undefined : { opacity: 0.3 }}
                    animate={shouldReduceMotion ? undefined : { opacity: 1 }}
                    transition={stage(0.55 + i * 0.14)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/10 rounded-full px-2.5 py-1.5"
                  >
                    <Check className="w-3 h-3 text-[#4ADE80]" />
                    {t(k)}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <FlowConnector className="my-1" />

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={stage(1.1)}
              className="rounded-xl border-2 border-[#1E6A50]/30 dark:border-[#4ADE80]/30 bg-[#F0F7F3] dark:bg-[#122019] px-4 py-3.5 flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197]">
                  {t('welcome.demoResultTitle')}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8FA197] dark:text-[#6E7F76] mt-0.5">
                  {t('welcome.flowDemoTag')}
                </p>
              </div>
              <AnimatedScore
                value={score}
                suffix="%"
                duration={0.9}
                className="text-3xl font-extrabold text-[#14453D] dark:text-[#4ADE80] tabular-nums"
              />
            </motion.div>

            <FlowConnector className="my-1" />

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={stage(1.35)}
              className="rounded-xl border border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#141b17] px-4 py-3 flex items-center gap-3"
            >
              <span className="w-8 h-8 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
              </span>
              <span className="text-[13px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                {t('welcome.flowNextDesc')}
              </span>
            </motion.div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#8FA197] dark:text-[#6E7F76] max-w-2xl mx-auto leading-relaxed">
          {t('welcome.demoIllustrative')}
        </p>
      </div>
    </section>
  );
};
