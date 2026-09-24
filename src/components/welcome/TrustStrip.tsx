import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Eye, Database, Scale, FileCheck2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { staggerContainer, staggerItem } from '../../animations/variants';

export const TrustStrip: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const items = [
    { icon: Eye, title: t('welcome.trustStrip1Title'), desc: t('welcome.trustStrip1Desc') },
    { icon: Database, title: t('welcome.trustStrip2Title'), desc: t('welcome.trustStrip2Desc') },
    { icon: Scale, title: t('welcome.trustStrip3Title'), desc: t('welcome.trustStrip3Desc') },
    { icon: FileCheck2, title: t('welcome.trustStrip4Title'), desc: t('welcome.trustStrip4Desc') },
  ];

  return (
    <section aria-label={t('welcome.trustStrip1Title')} className="border-y border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#141b17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
        <motion.dl
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView={shouldReduceMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={shouldReduceMotion ? undefined : staggerItem}
              className="flex items-start gap-3 group"
            >
              <span className="w-9 h-9 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <item.icon className="w-[18px] h-[18px] text-[#14453D] dark:text-[#4ADE80]" aria-hidden="true" />
              </span>
              <span>
                <dt className="text-[13px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2] leading-tight mb-0.5">
                  {item.title}
                </dt>
                <dd className="text-xs text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
                  {item.desc}
                </dd>
              </span>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
};
