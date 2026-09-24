import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import {
  Compass,
  Scale,
  Eye,
  FileCheck2,
  Send,
  ClipboardList,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { SectionHeading } from './shared';

export const JourneySection: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  /* Progress line follows scroll through the journey track */
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.75', 'end 0.45'],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  const steps = [
    { icon: Compass, title: t('welcome.journey1Title'), desc: t('welcome.journey1Desc') },
    { icon: Scale, title: t('welcome.journey2Title'), desc: t('welcome.journey2Desc') },
    { icon: Eye, title: t('welcome.journey3Title'), desc: t('welcome.journey3Desc') },
    { icon: FileCheck2, title: t('welcome.journey4Title'), desc: t('welcome.journey4Desc') },
    { icon: Send, title: t('welcome.journey5Title'), desc: t('welcome.journey5Desc') },
    { icon: ClipboardList, title: t('welcome.journey6Title'), desc: t('welcome.journey6Desc') },
  ];

  return (
    <section id="welcome-journey" className="scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <SectionHeading title={t('welcome.journeyTitle')} subtitle={t('welcome.journeySubtitle')} />

        <div ref={trackRef} className="relative">
          {/* base track */}
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-8 bottom-8 w-px bg-[#D9E8DF] dark:bg-[#22503E] lg:left-[8%] lg:right-[8%] lg:top-[31px] lg:bottom-auto lg:w-auto lg:h-px"
          />
          {/* scroll progress */}
          {!shouldReduceMotion && (
            <motion.div
              aria-hidden="true"
              style={{ scaleY: progress }}
              className="absolute left-[27px] top-8 bottom-8 w-px bg-[#1E6A50] dark:bg-[#4ADE80] origin-top lg:hidden"
            />
          )}
          {!shouldReduceMotion && (
            <motion.div
              aria-hidden="true"
              style={{ scaleX: progress }}
              className="absolute hidden lg:block left-[8%] right-[8%] top-[31px] h-px bg-[#1E6A50] dark:bg-[#4ADE80] origin-left"
            />
          )}

          <motion.ol
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-80px' }}
            className="relative grid gap-8 lg:gap-4 lg:grid-cols-6"
          >
            {steps.map((step, idx) => (
              <motion.li
                key={idx}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="group relative flex lg:flex-col gap-4 lg:gap-0 lg:items-center lg:text-center"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-[#141b17] border-2 border-[#D9E8DF] dark:border-[#22503E] group-hover:border-[#1E6A50] dark:group-hover:border-[#4ADE80] group-hover:shadow-md flex items-center justify-center transition-all duration-200">
                    <step.icon className="w-6 h-6 text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#14453D] dark:bg-[#4ADE80] text-white dark:text-[#0E1311] text-[10px] font-extrabold flex items-center justify-center"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="pt-1.5 lg:pt-5">
                  <h3 className="text-[15px] font-extrabold uppercase tracking-wide text-[#1A1C1B] dark:text-[#F0F4F2] mb-1.5 group-hover:text-[#14453D] dark:group-hover:text-[#4ADE80] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed lg:max-w-[180px] lg:mx-auto">
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
