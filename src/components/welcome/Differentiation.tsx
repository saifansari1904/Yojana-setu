import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, Landmark, Compass } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { RevealOnScroll } from '../../animations/RevealOnScroll';
import { SectionHeading } from './shared';

export const Differentiation: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const tradSteps = [
    t('welcome.diffTrad1'),
    t('welcome.diffTrad2'),
    t('welcome.diffTrad3'),
    t('welcome.diffTrad4'),
    t('welcome.diffTrad5'),
  ];
  const ysSteps = [
    t('welcome.diffYs1'),
    t('welcome.diffYs2'),
    t('welcome.diffYs3'),
    t('welcome.diffYs4'),
    t('welcome.diffYs5'),
    t('welcome.diffYs6'),
  ];

  return (
    <section id="welcome-diff" className="scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <SectionHeading title={t('welcome.diffTitle')} subtitle={t('welcome.diffSubtitle')} />

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Traditional */}
          <RevealOnScroll>
            <div className="h-full rounded-2xl border border-[#E4E8E4] dark:border-[#2A3C34] bg-[#F3F4F3] dark:bg-[#151C19] p-5 sm:p-7">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#516A5F] dark:text-[#8FA197] mb-5">
                {t('welcome.diffTradTitle')}
              </h3>
              <ol className="space-y-1">
                {tradSteps.map((s, i) => (
                  <li key={i}>
                    <p className="text-[14px] font-semibold text-[#3F4943] dark:text-[#A3B5AC] py-2">{s}</p>
                    {i < tradSteps.length - 1 && (
                      <ArrowDown className="w-4 h-4 text-[#8FA197] dark:text-[#5E6F66] ml-1" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </RevealOnScroll>

          {/* Yojana Setu */}
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-60px' }}
            className="h-full rounded-2xl border-2 border-[#1E6A50]/40 dark:border-[#4ADE80]/40 bg-white dark:bg-[#111714] p-5 sm:p-7 shadow-[0_20px_48px_-24px_rgba(20,69,61,0.3)]"
          >
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-[#14453D] dark:text-[#4ADE80] mb-5">
              <Compass className="w-4 h-4" aria-hidden="true" />
              {t('welcome.diffYsTitle')}
            </h3>
            <ol className="space-y-1">
              {ysSteps.map((s, i) => (
                <motion.li key={i} variants={shouldReduceMotion ? undefined : staggerItem}>
                  <p className="flex items-center gap-3 text-[14px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2] py-2">
                    <span
                      aria-hidden="true"
                      className="w-6 h-6 rounded-full bg-[#14453D] dark:bg-[#4ADE80] text-white dark:text-[#0E1311] text-[10px] font-extrabold flex items-center justify-center shrink-0"
                    >
                      {i + 1}
                    </span>
                    {s}
                  </p>
                  {i < ysSteps.length - 1 && (
                    <ArrowDown className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80] ml-[5px]" aria-hidden="true" />
                  )}
                </motion.li>
              ))}
            </ol>
          </motion.div>
        </div>

        <RevealOnScroll className="mt-6">
          <p className="flex items-start justify-center gap-2 text-center text-[13px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed max-w-2xl mx-auto">
            <Landmark className="w-4 h-4 shrink-0 mt-0.5 text-[#1E6A50] dark:text-[#4ADE80]" aria-hidden="true" />
            {t('welcome.diffNote')}
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
};
