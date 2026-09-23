import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PenLine, Compass, Search, Rocket } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { SectionHeading } from './shared';

export const HowItWorks: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    { icon: PenLine, title: t('welcome.step1Title'), desc: t('welcome.step1Desc') },
    { icon: Compass, title: t('welcome.step2Title'), desc: t('welcome.step2Desc') },
    { icon: Search, title: t('welcome.step3Title'), desc: t('welcome.step3Desc') },
    { icon: Rocket, title: t('welcome.step4Title'), desc: t('welcome.step4Desc') },
  ];

  return (
    <section id="welcome-how-it-works" className="scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <SectionHeading
          title={t('welcome.howItWorksTitle')}
          subtitle={t('welcome.howItWorksSubtitle')}
        />
        <div className="relative">
          {/* connecting line: vertical on mobile, horizontal on desktop */}
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-6 bottom-6 w-px bg-[#D9E8DF] dark:bg-[#22503E] lg:left-[12%] lg:right-[12%] lg:top-[27px] lg:bottom-auto lg:w-auto lg:h-px"
          />
          <motion.ol
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-80px' }}
            className="relative grid gap-8 lg:gap-6 lg:grid-cols-4"
          >
            {steps.map((step, idx) => (
              <motion.li
                key={idx}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="group relative flex lg:flex-col gap-4 lg:gap-0 lg:items-center lg:text-center"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#111714] border-2 border-[#D9E8DF] dark:border-[#22503E] group-hover:border-[#1E6A50] dark:group-hover:border-[#4ADE80] flex items-center justify-center transition-colors duration-200 shadow-sm">
                    <step.icon className="w-6 h-6 text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#14453D] dark:bg-[#4ADE80] text-white dark:text-[#0E1311] text-[10px] font-extrabold flex items-center justify-center"
                  >
                    {idx + 1}
                  </span>
                </div>
                <div className="pt-1 lg:pt-5">
                  <h3 className="text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-1.5 group-hover:text-[#14453D] dark:group-hover:text-[#4ADE80] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed lg:max-w-[240px] lg:mx-auto">
                    {step.desc}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
};
