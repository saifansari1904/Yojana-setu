import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Scale, FileCheck2, Eye } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { RevealOnScroll } from '../../animations/RevealOnScroll';
import { AnimatedScore } from '../ui';
import { SectionHeading } from './shared';

export const ExplainableMatch: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const factorKeys = [
    'welcome.pathwayDimCategory',
    'welcome.pathwayDimBusiness',
    'welcome.pathwayDimIncome',
    'welcome.pathwayDimAge',
    'welcome.pathwayDimState',
  ] as const;

  const bullets = [
    t('welcome.explainBullet1'),
    t('welcome.explainBullet2'),
    t('welcome.explainBullet3'),
  ];

  return (
    <section id="welcome-explain" className="scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT — copy */}
          <div>
            <SectionHeading
              align="left"
              title={t('welcome.explainTitle')}
              subtitle={t('welcome.explainSubtitle')}
            />
            <motion.ul
              variants={shouldReduceMotion ? undefined : staggerContainer}
              initial={shouldReduceMotion ? undefined : 'hidden'}
              whileInView={shouldReduceMotion ? undefined : 'visible'}
              viewport={{ once: true, margin: '-80px' }}
              className="-mt-4 space-y-3"
            >
              {bullets.map((b, i) => (
                <motion.li
                  key={i}
                  variants={shouldReduceMotion ? undefined : staggerItem}
                  className="flex items-start gap-3 text-sm sm:text-[15px] text-[#3F4943] dark:text-[#C5D5CC] leading-relaxed"
                >
                  <span className="w-6 h-6 rounded-full bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" aria-hidden="true" />
                  </span>
                  {b}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* RIGHT — explanation card mock */}
          <RevealOnScroll>
            <div
              aria-hidden="true"
              className="relative rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#111714] shadow-[0_24px_60px_-24px_rgba(20,69,61,0.25)] p-5 sm:p-7 overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#14453D] via-[#1E6A50] to-[#4ADE80]" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80]" />
                  {t('welcome.explainCardTitle')}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8FA197] dark:text-[#6E7F76] bg-[#F3F4F3] dark:bg-[#1A211D] rounded-full px-2.5 py-1">
                  {t('welcome.flowDemoTag')}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#F0F7F3] dark:bg-[#122019] border border-[#1E6A50]/20 dark:border-[#4ADE80]/20 px-4 py-3.5 mb-4">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#9EB0A7]">
                  {t('welcome.explainConfidence')}
                </span>
                <AnimatedScore
                  value={86}
                  suffix="%"
                  duration={1}
                  className="text-2xl font-extrabold text-[#14453D] dark:text-[#4ADE80] tabular-nums"
                />
              </div>

              <ul className="divide-y divide-[#E4E8E4] dark:divide-[#24342D] rounded-xl border border-[#E4E8E4] dark:border-[#24342D] mb-4">
                {factorKeys.map((k, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[13px] font-semibold text-[#1A1C1B] dark:text-[#E2E8E4]">
                      {t(k)}
                    </span>
                    <Check className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80]" />
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-3 rounded-xl border border-[#E4E8E4] dark:border-[#24342D] px-4 py-3 mb-3">
                <Scale className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                    {t('welcome.explainEligibility')}
                  </p>
                  <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7]">
                    {t('welcome.explainEligibilityDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#14453D] dark:bg-[#1C5045] px-4 py-3">
                <FileCheck2 className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#BFD9CE]">
                    {t('welcome.flowNextTitle')}
                  </p>
                  <p className="text-[13px] font-bold text-white">
                    {t('welcome.explainNextDesc')}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-[#8FA197] dark:text-[#6E7F76]">
              {t('welcome.explainIllustrative')}
            </p>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};
