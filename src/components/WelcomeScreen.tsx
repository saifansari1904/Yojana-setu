import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Compass,
  Scale,
  Wallet,
  FileCheck2,
  ClipboardList,
  ShieldCheck,
  ChevronDown,
  Check,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '../i18n';
import { fadeUp, staggerContainer, staggerItem } from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
import { ArrowFillButton } from './ui';

interface WelcomeScreenProps {
  onFindSchemes: () => void;
  onSignIn: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFindSchemes, onSignIn }) => {
  const { t, lang, setLang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langDropdownOpen]);

  const currentLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const steps = [
    { title: t('welcome.step1Title'), desc: t('welcome.step1Desc') },
    { title: t('welcome.step2Title'), desc: t('welcome.step2Desc') },
    { title: t('welcome.step3Title'), desc: t('welcome.step3Desc') },
    { title: t('welcome.step4Title'), desc: t('welcome.step4Desc') },
  ];

  const valueCards = [
    {
      icon: Compass,
      title: t('welcome.valueDiscoveryTitle'),
      desc: t('welcome.valueDiscoveryDesc'),
    },
    {
      icon: Scale,
      title: t('welcome.valueEligibilityTitle'),
      desc: t('welcome.valueEligibilityDesc'),
    },
    {
      icon: Wallet,
      title: t('welcome.valueFundingTitle'),
      desc: t('welcome.valueFundingDesc'),
    },
    {
      icon: FileCheck2,
      title: t('welcome.valuePrepTitle'),
      desc: t('welcome.valuePrepDesc'),
    },
    {
      icon: ClipboardList,
      title: t('welcome.valueTrackingTitle'),
      desc: t('welcome.valueTrackingDesc'),
    },
  ];

  const privacyPoints = [
    t('welcome.privacyPoint1'),
    t('welcome.privacyPoint2'),
    t('welcome.privacyPoint3'),
    t('welcome.privacyPoint4'),
    t('welcome.privacyPoint5'),
  ];

  const selectLanguage = (code: Language) => {
    setLang(code);
    setLangDropdownOpen(false);
  };

  return (
    <div className="min-h-screen">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 bg-[#FAFAF9]/95 dark:bg-[#151C19]/95 backdrop-blur-sm border-b border-[#E4E8E4] dark:border-[#24342D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <YojanaSetuLogo size="sm" horizontal showTaglines={false} showEnglishPill={false} />
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#3F4943] dark:text-[#A3B5AC]">
              <button
                onClick={() => scrollToSection('welcome-hero')}
                className="hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors cursor-pointer"
              >
                {t('welcome.navHome')}
              </button>
              <button
                onClick={() => scrollToSection('welcome-how-it-works')}
                className="hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors cursor-pointer"
              >
                {t('welcome.navHowItWorks')}
              </button>
              <button
                onClick={() => scrollToSection('welcome-values')}
                className="hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors cursor-pointer"
              >
                {t('welcome.navSchemes')}
              </button>
              <button
                onClick={() => scrollToSection('welcome-privacy')}
                className="hover:text-[#14453D] dark:hover:text-[#4ADE80] transition-colors cursor-pointer"
              >
                {t('welcome.navAbout')}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#3F4943] dark:text-[#A3B5AC] hover:text-[#14453D] dark:hover:text-[#4ADE80] px-2.5 py-1.5 rounded border border-[#E4E8E4] dark:border-[#2A3C34] transition-colors cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={langDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentLangOption.label}</span>
                <span className="sm:hidden">{currentLangOption.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#151C19] border border-[#E4E8E4] dark:border-[#2A3C34] rounded-lg shadow-lg py-1 z-50"
                  role="listbox"
                >
                  {SUPPORTED_LANGUAGES.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => selectLanguage(opt.code)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F3F4F3] dark:hover:bg-[#1E2A25] transition-colors cursor-pointer"
                      role="option"
                      aria-selected={opt.code === lang}
                    >
                      <span>{opt.label}</span>
                      {opt.code === lang && <Check className="w-3.5 h-3.5 text-[#1E6A50]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onSignIn}
              className="text-xs sm:text-sm font-semibold text-[#14453D] dark:text-[#4ADE80] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] px-3 sm:px-4 py-2 rounded border border-[#14453D]/30 dark:border-[#4ADE80]/30 hover:border-[#14453D] dark:hover:border-[#4ADE80] transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('welcome.navSignIn')}
            </button>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section id="welcome-hero" className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={shouldReduceMotion ? undefined : fadeUp}>
              <YojanaSetuLogo size="hero" className="mx-auto mb-6" />
            </motion.div>
            <motion.h1
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] leading-tight mb-4"
            >
              {t('welcome.heroTitle')}
            </motion.h1>
            <motion.p
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="text-base sm:text-lg text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed mb-8 max-w-2xl mx-auto"
            >
              {t('welcome.heroSubtitle')}
            </motion.p>
            <motion.div
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="flex flex-col items-center gap-3"
            >
              <ArrowFillButton
                onClick={onFindSchemes}
                variant="primary"
                size="lg"
                className="min-w-[240px]"
              >
                {t('welcome.heroPrimaryCta')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </ArrowFillButton>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E6A50] dark:text-[#4ADE80]">
                <Check className="w-3.5 h-3.5" />
                {t('welcome.heroNoAccount')}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="welcome-how-it-works" className="bg-white dark:bg-[#111714] border-y border-[#E4E8E4] dark:border-[#24342D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
              {t('welcome.howItWorksTitle')}
            </h2>
            <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7]">
              {t('welcome.howItWorksSubtitle')}
            </p>
          </div>
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="yj-card p-5 sm:p-6 relative"
              >
                <div className="text-3xl font-extrabold text-[#D9E8DF] dark:text-[#1E3A30] mb-3">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <h3 className="text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ VALUE SECTIONS ============ */}
      <section id="welcome-values" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
            {t('welcome.valueTitle')}
          </h2>
          <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7]">
            {t('welcome.valueSubtitle')}
          </p>
        </div>
        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainer}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView={shouldReduceMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {valueCards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={shouldReduceMotion ? undefined : staggerItem}
              className="yj-card p-5 sm:p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mb-4">
                <card.icon className="w-5 h-5 text-[#14453D] dark:text-[#4ADE80]" />
              </div>
              <h3 className="text-base font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
          {/* CTA card fills the 6th grid slot */}
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerItem}
            className="yj-card p-5 sm:p-6 bg-[#14453D] dark:bg-[#1C5045] border-[#14453D] flex flex-col justify-center"
          >
            <h3 className="text-base font-bold text-white mb-2">
              {t('welcome.heroTitle')}
            </h3>
            <button
              onClick={onFindSchemes}
              className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-white underline underline-offset-4 hover:text-[#D9E8DF] transition-colors cursor-pointer self-start"
            >
              {t('welcome.heroPrimaryCta')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ============ PRIVACY / TRUST ============ */}
      <section id="welcome-privacy" className="bg-white dark:bg-[#111714] border-y border-[#E4E8E4] dark:border-[#24342D]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-[#14453D] dark:text-[#4ADE80]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
              {t('welcome.privacyTitle')}
            </h2>
            <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7]">
              {t('welcome.privacySubtitle')}
            </p>
          </div>
          <ul className="space-y-3">
            {privacyPoints.map((point, idx) => (
              <motion.li
                key={idx}
                variants={shouldReduceMotion ? undefined : fadeUp}
                initial={shouldReduceMotion ? undefined : 'hidden'}
                whileInView={shouldReduceMotion ? undefined : 'visible'}
                viewport={{ once: true, margin: '-40px' }}
                transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: idx * 0.05 }}
                className="flex items-start gap-3 text-sm text-[#3F4943] dark:text-[#A3B5AC]"
              >
                <Check className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                <span>{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <YojanaSetuLogo size="sm" iconOnly />
            <span className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
              {t('welcome.footerTagline')}
            </span>
          </div>
          <p className="text-[11px] text-[#516A5F] dark:text-[#8FA197] max-w-md">
            {t('welcome.footerNote')}
          </p>
        </div>
      </footer>
    </div>
  );
};
