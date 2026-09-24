import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Eye,
  Scale,
  Database,
  Route,
  UserCheck,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { RevealOnScroll } from '../../animations/RevealOnScroll';
import { SectionHeading } from './shared';

export const TrustSection: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const pillars = [
    { icon: Eye, title: t('welcome.trustP1Title'), desc: t('welcome.trustP1Desc') },
    { icon: Scale, title: t('welcome.trustP2Title'), desc: t('welcome.trustP2Desc') },
    { icon: Database, title: t('welcome.trustP3Title'), desc: t('welcome.trustP3Desc') },
    { icon: Route, title: t('welcome.trustP4Title'), desc: t('welcome.trustP4Desc') },
    { icon: UserCheck, title: t('welcome.trustP5Title'), desc: t('welcome.trustP5Desc') },
    { icon: ListChecks, title: t('welcome.trustP6Title'), desc: t('welcome.trustP6Desc') },
  ];

  const privacyPanels = [
    { icon: ListChecks, title: t('welcome.privacyPanel1Title'), desc: t('welcome.privacyPanel1Desc') },
    { icon: Eye, title: t('welcome.privacyPanel2Title'), desc: t('welcome.privacyPanel2Desc') },
    { icon: Database, title: t('welcome.privacyPanel3Title'), desc: t('welcome.privacyPanel3Desc') },
    { icon: UserCheck, title: t('welcome.privacyPanel4Title'), desc: t('welcome.privacyPanel4Desc') },
  ];

  return (
    <section id="welcome-trust" className="scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <SectionHeading title={t('welcome.trustTitle')} subtitle={t('welcome.trustSubtitle')} />

        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView={shouldReduceMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6"
        >
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              variants={shouldReduceMotion ? undefined : staggerItem}
              className="group rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#141b17] p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-md hover:border-[#1E6A50]/40 dark:hover:border-[#4ADE80]/40 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-[#14453D] dark:bg-[#1C5045] flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105">
                <p.icon className="w-5 h-5 text-[#4ADE80]" aria-hidden="true" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
                {p.title}
              </h3>
              <p className="text-[13px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
                {p.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy panel */}
        <RevealOnScroll>
          <div className="rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#141b17] p-6 sm:p-10">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
              </div>
              <div className="max-w-2xl">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-1.5">
                  {t('welcome.privacyTitle')}
                </h2>
                <p className="text-sm sm:text-[15px] text-[#516A5F] dark:text-[#9EB0A7]">
                  {t('welcome.privacySubtitle')}
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {privacyPanels.map((panel, i) => (
                <div key={i} className="group">
                  <div className="w-10 h-10 rounded-xl bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105">
                    <panel.icon className="w-5 h-5 text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-1.5 uppercase tracking-wide">
                    {panel.title}
                  </h3>
                  <p className="text-[13px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
                    {panel.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};
