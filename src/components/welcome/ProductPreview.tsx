import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  TrendingUp,
  Check,
  FileCheck2,
  Scale,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { RevealOnScroll } from '../../animations/RevealOnScroll';
import { AnimatedScore } from '../ui';
import { SectionHeading } from './shared';

interface ProductPreviewProps {
  onFindSchemes: () => void;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({ onFindSchemes }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const factorKeys = [
    'welcome.pathwayDimCategory',
    'welcome.pathwayDimBusiness',
    'welcome.pathwayDimIncome',
    'welcome.pathwayDimAge',
    'welcome.pathwayDimState',
  ] as const;

  return (
    <section id="welcome-preview" className="bg-white dark:bg-[#111714] border-y border-[#E4E8E4] dark:border-[#24342D] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <SectionHeading title={t('welcome.previewTitle')} subtitle={t('welcome.previewSubtitle')} />

        {/* App-window mock */}
        <RevealOnScroll className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#0E1311] shadow-[0_32px_72px_-32px_rgba(20,69,61,0.35)] overflow-hidden">
            {/* window chrome */}
            <div
              aria-hidden="true"
              className="flex items-center gap-1.5 px-4 py-3 border-b border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#111714]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4E8E4] dark:bg-[#2A3C34]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4E8E4] dark:bg-[#2A3C34]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9E8DF] dark:bg-[#1A382D]" />
            </div>

            <div className="p-4 sm:p-6" aria-hidden="true">
              <div className="rounded-xl border border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#111714] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197]">
                    {t('welcome.previewSchemeTitle')}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8FA197] dark:text-[#6E7F76] bg-[#F3F4F3] dark:bg-[#1A211D] rounded-full px-2.5 py-1">
                    {t('welcome.flowDemoTag')}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Match + eligibility */}
                  <div className="rounded-lg bg-[#F0F7F3] dark:bg-[#122019] border border-[#1E6A50]/20 dark:border-[#4ADE80]/20 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#9EB0A7] mb-1">
                      {t('welcome.previewMatchLabel')}
                    </p>
                    <AnimatedScore
                      value={86}
                      suffix="%"
                      duration={1}
                      className="text-3xl font-extrabold text-[#14453D] dark:text-[#4ADE80] tabular-nums"
                    />
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-[#1E6A50] dark:text-[#4ADE80]">
                      <BadgeCheck className="w-4 h-4" />
                      {t('welcome.previewEligibilityValue')}
                    </p>
                  </div>

                  {/* Matching factors */}
                  <div className="rounded-lg border border-[#E4E8E4] dark:border-[#24342D] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#9EB0A7] mb-2">
                      {t('welcome.previewMatchLabel')}
                    </p>
                    <ul className="space-y-1.5">
                      {factorKeys.map((k, i) => (
                        <li key={i} className="flex items-center justify-between text-[12px] font-semibold text-[#3F4943] dark:text-[#C5D5CC]">
                          {t(k)}
                          <Check className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Preparation */}
                <div className="mt-4 rounded-lg border border-[#E4E8E4] dark:border-[#24342D] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#9EB0A7]">
                      {t('welcome.previewPrepLabel')}
                    </p>
                    <p className="text-[12px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {t('welcome.previewPrepValue')}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-[#E4E8E4] dark:bg-[#24342D] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#1E6A50] to-[#4ADE80]"
                      initial={shouldReduceMotion ? undefined : { width: 0 }}
                      whileInView={{ width: '50%' }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Next best action */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-[#14453D] dark:bg-[#1C5045] p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-[18px] h-[18px] text-[#4ADE80]" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#BFD9CE]">
                        {t('welcome.flowNextTitle')}
                      </p>
                      <p className="text-[13px] font-bold text-white">
                        {t('welcome.previewNextValue')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onFindSchemes}
                    tabIndex={-1}
                    className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-white text-[#14453D] text-sm font-bold hover:bg-[#F0F7F3] transition-colors cursor-pointer"
                  >
                    {t('welcome.previewContinue')}
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-[#8FA197] dark:text-[#6E7F76]">
            {t('welcome.previewIllustrative')}
          </p>
        </RevealOnScroll>

        {/* supporting mini-cards */}
        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView={shouldReduceMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8"
        >
          {[
            { icon: Scale, title: t('welcome.previewCard1Title'), desc: t('welcome.previewCard1Desc') },
            { icon: TrendingUp, title: t('welcome.previewCard2Title'), desc: t('welcome.previewCard2Desc') },
            { icon: FileCheck2, title: t('welcome.previewCard3Title'), desc: t('welcome.previewCard3Desc') },
          ].map((c, i) => (
            <motion.div
              key={i}
              variants={shouldReduceMotion ? undefined : staggerItem}
              className="rounded-xl border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#151C19] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <span className="w-9 h-9 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mb-3">
                <c.icon className="w-[18px] h-[18px] text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-1.5">{c.title}</h3>
              <p className="text-[13px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
