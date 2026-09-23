import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  Check,
  ArrowRight,
  ArrowDown,
  Sparkles,
  User,
  MapPin,
  Scale,
  Wallet,
  Cpu,
  Eye,
  Database,
  FileCheck2,
  ClipboardList,
  PenLine,
  Compass,
  Search,
  Rocket,
  Users,
  Briefcase,
  Cake,
  BadgeCheck,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  ListChecks,
  Landmark,
} from 'lucide-react';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '../i18n';
import { fadeUp, staggerContainer, staggerItem } from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
import { RevealOnScroll } from '../animations/RevealOnScroll';
import { ArrowFillButton, AnimatedScore } from './ui';

interface WelcomeScreenProps {
  onFindSchemes: () => void;
  onSignIn: () => void;
}

/* ------------------------------------------------------------------ */
/* Animated flow connector: a short line with a travelling pulse dot.  */
/* Static when the user prefers reduced motion.                        */
/* ------------------------------------------------------------------ */
const FlowConnector = ({ className = '' }: { className?: string }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto w-px h-7 bg-gradient-to-b from-[#1E6A50]/10 via-[#1E6A50]/50 to-[#1E6A50]/10 dark:from-[#4ADE80]/10 dark:via-[#4ADE80]/50 dark:to-[#4ADE80]/10 ${className}`}
    >
      {!shouldReduceMotion && (
        <motion.span
          className="absolute left-1/2 top-0 -ml-[3px] w-1.5 h-1.5 rounded-full bg-[#1E6A50] dark:bg-[#4ADE80]"
          animate={{ y: [0, 22] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Hero product visualization: profile -> engine -> scheme scores.     */
/* Purely illustrative; all copy via i18n.                             */
/* ------------------------------------------------------------------ */
const ProductVisualization = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const profileNodes = [
    { icon: Briefcase, label: t('welcome.vizProfileBusiness') },
    { icon: MapPin, label: t('welcome.vizProfileState') },
    { icon: Scale, label: t('welcome.vizProfileEligibility') },
    { icon: Wallet, label: t('welcome.vizProfileNeed') },
  ];
  const schemeScores = [92, 84, 76];

  return (
    <div
      aria-hidden="true"
      className="relative rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-white/80 dark:bg-[#111714]/80 backdrop-blur-sm shadow-[0_24px_60px_-24px_rgba(20,69,61,0.25)] p-5 sm:p-6 overflow-hidden"
    >
      {/* soft top accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#14453D] via-[#1E6A50] to-[#4ADE80]" />

      {/* Profile nodes */}
      <motion.div
        variants={shouldReduceMotion ? undefined : staggerContainer}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
      >
        <motion.p
          variants={shouldReduceMotion ? undefined : fadeUp}
          className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197] mb-3 flex items-center gap-2"
        >
          <User className="w-3.5 h-3.5" />
          {t('welcome.vizProfileTitle')}
        </motion.p>
        <div className="grid grid-cols-2 gap-2">
          {profileNodes.map((node, i) => (
            <motion.div
              key={i}
              variants={shouldReduceMotion ? undefined : staggerItem}
              className="flex items-center gap-2 rounded-lg border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#151C19] px-2.5 py-2"
            >
              <span className="w-6 h-6 rounded-md bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0">
                <node.icon className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
              </span>
              <span className="text-[11px] font-semibold text-[#1A1C1B] dark:text-[#E2E8E4] truncate">
                {node.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <FlowConnector className="my-1" />

      {/* Matching engine core */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: 0.35 }}
        className="relative rounded-xl bg-[#14453D] dark:bg-[#1C5045] px-4 py-3.5 flex items-center gap-3 overflow-hidden"
      >
        {!shouldReduceMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl border-2 border-[#4ADE80]/60"
            animate={{ opacity: [0.7, 0], scale: [1, 1.12] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className="relative w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <Cpu className="w-5 h-5 text-[#4ADE80]" />
        </span>
        <span className="relative block text-[13px] font-extrabold text-white leading-tight">
          {t('welcome.vizEngineTitle')}
        </span>
      </motion.div>

      <FlowConnector className="my-1" />

      {/* Scheme score cards */}
      <motion.div
        variants={shouldReduceMotion ? undefined : staggerContainer}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        className="grid grid-cols-3 gap-2"
      >
        {schemeScores.map((score, i) => (
          <motion.div
            key={i}
            variants={shouldReduceMotion ? undefined : staggerItem}
            transition={shouldReduceMotion ? reducedMotionTransition : { delay: 0.55 + i * 0.12 }}
            className="rounded-lg border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#151C19] px-2.5 py-2.5 text-center"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#516A5F] dark:text-[#8FA197] mb-1">
              {t('welcome.vizSchemeLabel')}
            </span>
            <AnimatedScore
              value={score}
              duration={0.9}
              className="text-xl font-extrabold text-[#14453D] dark:text-[#4ADE80]"
            />
            <span
              aria-hidden="true"
              className="block h-1 rounded-full bg-[#E4E8E4] dark:bg-[#24342D] mt-1.5 overflow-hidden"
            >
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-[#1E6A50] to-[#4ADE80]"
                initial={shouldReduceMotion ? undefined : { width: 0 }}
                animate={{ width: `${score}%` }}
                transition={
                  shouldReduceMotion
                    ? reducedMotionTransition
                    : { ...transitions.smooth, delay: 0.7 + i * 0.12, duration: 0.9 }
                }
              />
            </span>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-[#8FA197] dark:text-[#6E7F76]">
        {t('welcome.vizIllustrative')}
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Section heading block                                               */
/* ------------------------------------------------------------------ */
const SectionHeading = ({
  title,
  subtitle,
}) => (
  <RevealOnScroll className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
    <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] leading-snug mb-3">
      {title}
    </h2>
    {subtitle && (
      <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
        {subtitle}
      </p>
    )}
  </RevealOnScroll>
);

export const WelcomeScreen = ({
  onFindSchemes,
  onSignIn,
}) => {
  const { t, lang, setLang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('welcome-hero');
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

  /* Scroll-spy for header active state */
  useEffect(() => {
    const ids = ['welcome-hero', 'welcome-how-it-works', 'welcome-values', 'welcome-privacy'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const currentLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const selectLanguage = (code: Language) => {
    setLang(code);
    setLangDropdownOpen(false);
  };

  const navItems = [
    { id: 'welcome-hero', label: t('welcome.navHome') },
    { id: 'welcome-how-it-works', label: t('welcome.navHowItWorks') },
    { id: 'welcome-values', label: t('welcome.navSchemes') },
    { id: 'welcome-privacy', label: t('welcome.navAbout') },
  ];

  const trustStripItems = [
    { icon: Eye, title: t('welcome.trustStrip1Title'), desc: t('welcome.trustStrip1Desc') },
    { icon: Database, title: t('welcome.trustStrip2Title'), desc: t('welcome.trustStrip2Desc') },
    { icon: Scale, title: t('welcome.trustStrip3Title'), desc: t('welcome.trustStrip3Desc') },
    { icon: FileCheck2, title: t('welcome.trustStrip4Title'), desc: t('welcome.trustStrip4Desc') },
  ];

  const journeySteps = [
    { icon: PenLine, title: t('welcome.step1Title'), desc: t('welcome.step1Desc') },
    { icon: Compass, title: t('welcome.step2Title'), desc: t('welcome.step2Desc') },
    { icon: Search, title: t('welcome.step3Title'), desc: t('welcome.step3Desc') },
    { icon: Rocket, title: t('welcome.step4Title'), desc: t('welcome.step4Desc') },
  ];

  /* Actual engine weights from src/lib/matching/matchingCore.ts — display only */
  const engineWeights = [
    { icon: Users, label: t('welcome.pathwayDimCategory'), weight: 30 },
    { icon: Briefcase, label: t('welcome.pathwayDimBusiness'), weight: 25 },
    { icon: Wallet, label: t('welcome.pathwayDimIncome'), weight: 20 },
    { icon: Cake, label: t('welcome.pathwayDimAge'), weight: 15 },
    { icon: MapPin, label: t('welcome.pathwayDimState'), weight: 10 },
  ];

  const pathwayResults = [
    { label: t('welcome.pathwayResultEligible'), tone: 'eligible' },
    { label: t('welcome.pathwayResultNear'), tone: 'near' },
    { label: t('welcome.pathwayResultLow'), tone: 'low' },
  ] as const;

  const pathwayNext = [
    { icon: ListChecks, title: t('welcome.pathwayNextDocs'), desc: t('welcome.pathwayNextDocsDesc') },
    { icon: ClipboardList, title: t('welcome.pathwayNextPrep'), desc: t('welcome.pathwayNextPrepDesc') },
    { icon: Landmark, title: t('welcome.pathwayNextApply'), desc: t('welcome.pathwayNextApplyDesc') },
  ];

  const valueCards = [
    { icon: Compass, title: t('welcome.valueDiscoveryTitle'), desc: t('welcome.valueDiscoveryDesc') },
    { icon: Scale, title: t('welcome.valueEligibilityTitle'), desc: t('welcome.valueEligibilityDesc') },
    { icon: Wallet, title: t('welcome.valueFundingTitle'), desc: t('welcome.valueFundingDesc') },
    { icon: FileCheck2, title: t('welcome.valuePrepTitle'), desc: t('welcome.valuePrepDesc') },
    { icon: ClipboardList, title: t('welcome.valueTrackingTitle'), desc: t('welcome.valueTrackingDesc') },
  ];

  const previewScores = [92, 84, 76];

  const privacyPanels = [
    { icon: ListChecks, title: t('welcome.privacyPanel1Title'), desc: t('welcome.privacyPanel1Desc') },
    { icon: Eye, title: t('welcome.privacyPanel2Title'), desc: t('welcome.privacyPanel2Desc') },
    { icon: Database, title: t('welcome.privacyPanel3Title'), desc: t('welcome.privacyPanel3Desc') },
    { icon: UserCheck, title: t('welcome.privacyPanel4Title'), desc: t('welcome.privacyPanel4Desc') },
  ];

  const resultToneClasses: Record<string, string> = {
    eligible:
      'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border-[#BFD9CE] dark:border-[#22503E]',
    near: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    low: 'bg-[#F3F4F3] dark:bg-[#1A211D] text-[#516A5F] dark:text-[#9EB0A7] border-[#E4E8E4] dark:border-[#2A3C34]',
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0E1311] text-[#1A1C1B] dark:text-[#F0F4F2] overflow-x-clip">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 bg-[#FAFAF9]/85 dark:bg-[#0E1311]/85 backdrop-blur-md border-b border-[#E4E8E4]/80 dark:border-[#24342D]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 h-16">
            <div className="flex items-center gap-7 min-w-0">
              <YojanaSetuLogo size="sm" horizontal showTaglines={false} showEnglishPill={false} />
              <nav className="hidden md:flex items-center gap-1" aria-label={t('welcome.navHome')}>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    aria-current={activeSection === item.id ? 'true' : undefined}
                    className={`relative px-3 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                      activeSection === item.id
                        ? 'text-[#14453D] dark:text-[#4ADE80]'
                        : 'text-[#3F4943] dark:text-[#A3B5AC] hover:text-[#14453D] dark:hover:text-[#4ADE80]'
                    }`}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <motion.span
                        layoutId="welcome-nav-underline"
                        className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-[#14453D] dark:bg-[#4ADE80]"
                        transition={transitions.fast}
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {/* Compact language selector */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#3F4943] dark:text-[#A3B5AC] hover:text-[#14453D] dark:hover:text-[#4ADE80] hover:border-[#14453D]/40 dark:hover:border-[#4ADE80]/40 px-2.5 py-2 rounded-lg border border-[#E4E8E4] dark:border-[#2A3C34] bg-white/60 dark:bg-[#151C19]/60 transition-all cursor-pointer"
                  aria-haspopup="listbox"
                  aria-expanded={langDropdownOpen}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline max-w-[92px] truncate">{currentLangOption.label}</span>
                  <span className="sm:hidden">{currentLangOption.code.toUpperCase()}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {langDropdownOpen && (
                  <motion.div
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                    animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={transitions.fast}
                    className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#151C19] border border-[#E4E8E4] dark:border-[#2A3C34] rounded-xl shadow-xl py-1 z-50 overflow-hidden"
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
                        {opt.code === lang && <Check className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <button
                onClick={onSignIn}
                className="hidden sm:inline-flex text-sm font-bold text-white bg-[#14453D] dark:bg-[#1E6A50] hover:bg-[#1E6A50] dark:hover:bg-[#25795f] px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
              >
                {t('welcome.navSignIn')}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#3F4943] dark:text-[#A3B5AC] hover:bg-[#F3F4F3] dark:hover:bg-[#1E2A25] transition-colors cursor-pointer"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? t('welcome.menuClose') : t('welcome.menuOpen')}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <motion.nav
            initial={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, height: 'auto' }}
            transition={transitions.fast}
            className="md:hidden border-t border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#0E1311] overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80]'
                      : 'text-[#3F4943] dark:text-[#A3B5AC] hover:bg-[#F3F4F3] dark:hover:bg-[#1E2A25]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="mt-2 text-center px-3 py-2.5 rounded-lg text-sm font-bold text-white bg-[#14453D] dark:bg-[#1E6A50] cursor-pointer"
              >
                {t('welcome.navSignIn')}
              </button>
            </div>
          </motion.nav>
        )}
      </header>

      {/* ================= HERO ================= */}
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-14 items-center">
            {/* LEFT — copy */}
            <motion.div
              variants={shouldReduceMotion ? undefined : staggerContainer}
              initial={shouldReduceMotion ? undefined : 'hidden'}
              animate={shouldReduceMotion ? undefined : 'visible'}
              className="max-w-xl"
            >
              <motion.div variants={shouldReduceMotion ? undefined : fadeUp} className="mb-5">
                <YojanaSetuLogo size="md" horizontal showTaglines={false} showEnglishPill={false} />
              </motion.div>
              <motion.p
                variants={shouldReduceMotion ? undefined : fadeUp}
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#1E6A50] dark:text-[#4ADE80] bg-[#D9E8DF]/70 dark:bg-[#1A382D]/70 border border-[#BFD9CE]/60 dark:border-[#22503E]/60 rounded-full px-3 py-1.5 mb-5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('welcome.heroEyebrow')}
              </motion.p>
              <motion.h1
                variants={shouldReduceMotion ? undefined : fadeUp}
                className="text-[2.35rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem] font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-5"
              >
                {t('welcome.heroTitle')}
              </motion.h1>
              <motion.p
                variants={shouldReduceMotion ? undefined : fadeUp}
                className="text-base sm:text-lg text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed mb-8"
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
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </ArrowFillButton>
                <button
                  onClick={() => scrollToSection('welcome-how-it-works')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#14453D] dark:text-[#4ADE80] border border-[#14453D]/25 dark:border-[#4ADE80]/25 hover:border-[#14453D]/60 dark:hover:border-[#4ADE80]/60 hover:bg-[#14453D]/5 dark:hover:bg-[#4ADE80]/5 transition-all cursor-pointer"
                >
                  {t('welcome.heroSecondaryCta')}
                  <ArrowDown className="w-4 h-4" />
                </button>
              </motion.div>
              <motion.p
                variants={shouldReduceMotion ? undefined : fadeUp}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E6A50] dark:text-[#4ADE80]"
              >
                <Check className="w-3.5 h-3.5" />
                {t('welcome.heroNoAccount')}
              </motion.p>
            </motion.div>

            {/* RIGHT — product visualization */}
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: 0.15 }}
              className="relative"
            >
              <ProductVisualization />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= TRUST STRIP ================= */}
      <section aria-label={t('welcome.trustStrip1Title')} className="border-y border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#111714]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
          <motion.dl
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5"
          >
            {trustStripItems.map((item, i) => (
              <motion.div
                key={i}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="flex items-start gap-3 group"
              >
                <span className="w-9 h-9 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <item.icon className="w-[18px] h-[18px] text-[#14453D] dark:text-[#4ADE80]" />
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

      {/* ================= HOW IT WORKS — journey timeline ================= */}
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
              {journeySteps.map((step, idx) => (
                <motion.li
                  key={idx}
                  variants={shouldReduceMotion ? undefined : staggerItem}
                  className="group relative flex lg:flex-col gap-4 lg:gap-0 lg:items-center lg:text-center"
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#111714] border-2 border-[#D9E8DF] dark:border-[#22503E] group-hover:border-[#1E6A50] dark:group-hover:border-[#4ADE80] flex items-center justify-center transition-colors duration-200 shadow-sm">
                      <step.icon className="w-6 h-6 text-[#14453D] dark:text-[#4ADE80]" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#14453D] dark:bg-[#4ADE80] text-white dark:text-[#0E1311] text-[10px] font-extrabold flex items-center justify-center">
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

      {/* ================= FROM PROFILE TO PATHWAY ================= */}
      <section id="welcome-pathway" className="bg-white dark:bg-[#111714] border-y border-[#E4E8E4] dark:border-[#24342D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <SectionHeading
            title={t('welcome.pathwayTitle')}
            subtitle={t('welcome.pathwaySubtitle')}
          />
          <RevealOnScroll>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.15fr_auto_0.9fr_auto_0.9fr] lg:gap-3 items-stretch">
              {/* Profile dimensions */}
              <div className="yj-card p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197] mb-4">
                  {t('welcome.pathwayProfileTitle')}
                </h3>
                <ul className="space-y-2.5">
                  {engineWeights.map((dim, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1A1C1B] dark:text-[#E2E8E4]">
                      <span className="w-7 h-7 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0">
                        <dim.icon className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                      </span>
                      {dim.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div aria-hidden="true" className="hidden lg:flex items-center">
                <ArrowRight className="w-5 h-5 text-[#1E6A50]/50 dark:text-[#4ADE80]/50" />
              </div>

              {/* Engine weights */}
              <div className="yj-card p-5 bg-[#14453D] dark:bg-[#1C5045] border-[#14453D] dark:border-[#1C5045]">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#BFD9CE] mb-4 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" />
                  {t('welcome.pathwayEngineTitle')}
                </h3>
                <ul className="space-y-3">
                  {engineWeights.map((dim, i) => (
                    <li key={i}>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-white mb-1">
                        <span>{dim.label}</span>
                        <AnimatedScore value={dim.weight} duration={0.7} className="tabular-nums" />
                      </div>
                      <div className="h-1.5 rounded-full bg-white/15 overflow-hidden" aria-hidden="true">
                        <motion.div
                          className="h-full rounded-full bg-[#4ADE80]"
                          initial={shouldReduceMotion ? undefined : { width: 0 }}
                          whileInView={{ width: `${dim.weight}%` }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={
                            shouldReduceMotion
                              ? reducedMotionTransition
                              : { ...transitions.smooth, delay: i * 0.08, duration: 0.7 }
                          }
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div aria-hidden="true" className="hidden lg:flex items-center">
                <ArrowRight className="w-5 h-5 text-[#1E6A50]/50 dark:text-[#4ADE80]/50" />
              </div>

              {/* Result */}
              <div className="yj-card p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197] mb-4">
                  {t('welcome.pathwayResultTitle')}
                </h3>
                <ul className="space-y-2.5">
                  {pathwayResults.map((r, i) => (
                    <li
                      key={i}
                      className={`text-[13px] font-bold border rounded-lg px-3 py-2.5 ${resultToneClasses[r.tone]}`}
                    >
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div aria-hidden="true" className="hidden lg:flex items-center">
                <ArrowRight className="w-5 h-5 text-[#1E6A50]/50 dark:text-[#4ADE80]/50" />
              </div>

              {/* Next step */}
              <div className="yj-card p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#516A5F] dark:text-[#8FA197] mb-4">
                  {t('welcome.pathwayNextTitle')}
                </h3>
                <ul className="space-y-3.5">
                  {pathwayNext.map((n, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center shrink-0">
                        <n.icon className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                      </span>
                      <span>
                        <span className="block text-[13px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                          {n.title}
                        </span>
                        <span className="block text-xs text-[#516A5F] dark:text-[#9EB0A7]">
                          {n.desc}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealOnScroll>
          <p className="mt-6 text-center text-xs text-[#8FA197] dark:text-[#6E7F76] max-w-2xl mx-auto leading-relaxed">
            {t('welcome.pathwayIllustrative')}
          </p>
        </div>
      </section>

      {/* ================= VALUE PROPS — editorial ================= */}
      <section id="welcome-values" className="scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <SectionHeading
            title={t('welcome.valueTitle')}
            subtitle={t('welcome.valueSubtitle')}
          />

          {/* Large feature */}
          <RevealOnScroll className="mb-5">
            <div className="yj-card overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-6 sm:p-10 flex flex-col justify-center">
                  <h3 className="text-xl sm:text-2xl lg:text-[1.7rem] font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] leading-snug mb-3">
                    {t('welcome.valueLargeTitle')}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed mb-6">
                    {t('welcome.valueLargeDesc')}
                  </p>
                  <button
                    onClick={onFindSchemes}
                    className="group inline-flex items-center gap-2 text-sm font-bold text-[#14453D] dark:text-[#4ADE80] cursor-pointer self-start"
                  >
                    <span className="underline underline-offset-4 decoration-[#14453D]/30 dark:decoration-[#4ADE80]/30 group-hover:decoration-[#14453D] dark:group-hover:decoration-[#4ADE80] transition-all">
                      {t('welcome.heroPrimaryCta')}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
                {/* mini matching visual */}
                <div className="relative bg-[#F3F4F3] dark:bg-[#151C19] border-t lg:border-t-0 lg:border-l border-[#E4E8E4] dark:border-[#24342D] p-6 sm:p-8 flex items-center" aria-hidden="true">
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-3">
                      {[Users, Briefcase, Wallet].map((Icon, i) => (
                        <motion.span
                          key={i}
                          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="w-9 h-9 rounded-xl bg-white dark:bg-[#111714] border border-[#E4E8E4] dark:border-[#24342D] flex items-center justify-center shadow-sm"
                        >
                          <Icon className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
                        </motion.span>
                      ))}
                      <ArrowRight className="w-4 h-4 text-[#1E6A50]/50 dark:text-[#4ADE80]/50 mx-1" />
                      <span className="w-9 h-9 rounded-xl bg-[#14453D] dark:bg-[#1C5045] flex items-center justify-center shadow-sm">
                        <Cpu className="w-4 h-4 text-[#4ADE80]" />
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#1E6A50]/50 dark:text-[#4ADE80]/50 mx-1" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[92, 84, 76].map((s, i) => (
                        <div key={i} className="rounded-lg bg-white dark:bg-[#111714] border border-[#E4E8E4] dark:border-[#24342D] px-2 py-2 text-center shadow-sm">
                          <AnimatedScore value={s} duration={0.8} className="text-base font-extrabold text-[#14453D] dark:text-[#4ADE80]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Supporting cards */}
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {valueCards.map((card, idx) => (
              <motion.div
                key={idx}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="yj-card p-5 sm:p-6 group hover:-translate-y-0.5 hover:shadow-md hover:border-[#1E6A50]/40 dark:hover:border-[#4ADE80]/40 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105">
                  <card.icon className="w-5 h-5 text-[#14453D] dark:text-[#4ADE80]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
                  {card.title}
                </h3>
                <p className="text-[13px] text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed">
                  {card.desc}
                </p>
              </motion.div>
            ))}
            {/* CTA tile fills the 6th slot */}
            <motion.button
              variants={shouldReduceMotion ? undefined : staggerItem}
              onClick={onFindSchemes}
              className="group rounded-xl p-5 sm:p-6 bg-[#14453D] dark:bg-[#1C5045] text-left flex flex-col justify-between min-h-[148px] hover:bg-[#1E6A50] dark:hover:bg-[#25795f] transition-colors duration-200 cursor-pointer"
            >
              <span className="text-[15px] font-bold text-white leading-snug">
                {t('welcome.valueLargeTitle')}
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#4ADE80]">
                {t('welcome.heroPrimaryCta')}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ================= SEE WHAT YOU GET — preview ================= */}
      <section id="welcome-preview" className="bg-white dark:bg-[#111714] border-y border-[#E4E8E4] dark:border-[#24342D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <SectionHeading
            title={t('welcome.previewTitle')}
            subtitle={t('welcome.previewSubtitle')}
          />
          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto"
            aria-label={t('welcome.previewTitle')}
          >
            {previewScores.map((score, i) => (
              <motion.div
                key={i}
                variants={shouldReduceMotion ? undefined : staggerItem}
                className="yj-card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#516A5F] dark:text-[#8FA197]">
                    {t('welcome.vizSchemeLabel')}
                  </span>
                  <span className="inline-flex items-baseline gap-1">
                    <span className="text-[10px] font-semibold text-[#8FA197] dark:text-[#6E7F76]">
                      {t('welcome.previewMatchLabel')}
                    </span>
                    <AnimatedScore value={score} duration={0.8} className="text-lg font-extrabold text-[#14453D] dark:text-[#4ADE80]" />
                  </span>
                </div>
                <ul className="space-y-2.5 text-[13px]">
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-[#516A5F] dark:text-[#9EB0A7] font-medium">
                      {t('welcome.previewEligibilityLabel')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#1E6A50] dark:text-[#4ADE80]">
                      <BadgeCheck className="w-4 h-4" />
                      {t('welcome.previewEligibilityValue')}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-[#516A5F] dark:text-[#9EB0A7] font-medium">
                      {t('welcome.previewFundingLabel')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      <TrendingUp className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80]" />
                      {t('welcome.previewFundingValue')}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E4E8E4] dark:border-[#24342D]">
                    <span className="text-[#516A5F] dark:text-[#9EB0A7] font-medium">
                      {t('welcome.previewNextLabel')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {t('welcome.previewNextValue')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </li>
                </ul>
              </motion.div>
            ))}
          </motion.div>
          <p className="mt-6 text-center text-xs text-[#8FA197] dark:text-[#6E7F76]">
            {t('welcome.previewIllustrative')}
          </p>
        </div>
      </section>

      {/* ================= ACCOUNT CONVERSION — subtle ================= */}
      <section id="welcome-account">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <RevealOnScroll>
            <div className="w-12 h-12 rounded-2xl bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-6 h-6 text-[#14453D] dark:text-[#4ADE80]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] leading-snug mb-3">
              {t('welcome.accountTitle')}
            </h2>
            <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed mb-8 max-w-xl mx-auto">
              {t('welcome.accountDesc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <ArrowFillButton onClick={onSignIn} variant="primary" size="lg" className="group min-w-[200px] justify-center">
                {t('welcome.authPromptPrimary')}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </ArrowFillButton>
              <button
                onClick={onFindSchemes}
                className="px-6 py-3 rounded-xl text-sm font-bold text-[#14453D] dark:text-[#4ADE80] hover:bg-[#14453D]/5 dark:hover:bg-[#4ADE80]/5 transition-colors cursor-pointer"
              >
                {t('welcome.accountSecondary')}
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ================= PRIVACY — compact panel ================= */}
      <section id="welcome-privacy" className="scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
          <RevealOnScroll>
            <div className="rounded-2xl border border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#111714] p-6 sm:p-10">
              <div className="max-w-2xl mb-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2">
                  {t('welcome.privacyTitle')}
                </h2>
                <p className="text-sm sm:text-base text-[#516A5F] dark:text-[#9EB0A7]">
                  {t('welcome.privacySubtitle')}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {privacyPanels.map((panel, i) => (
                  <div key={i} className="group">
                    <div className="w-10 h-10 rounded-xl bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105">
                      <panel.icon className="w-5 h-5 text-[#14453D] dark:text-[#4ADE80]" />
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

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#E4E8E4] dark:border-[#24342D] bg-white dark:bg-[#111714]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <YojanaSetuLogo size="sm" iconOnly />
              <span className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                {t('welcome.footerTagline')}
              </span>
            </div>
            <p className="text-[11px] text-[#516A5F] dark:text-[#8FA197] max-w-md leading-relaxed">
              {t('welcome.footerNote')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
