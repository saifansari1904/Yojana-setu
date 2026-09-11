import React, { useState, useMemo, useEffect } from 'react';
import {
  BusinessType,
  SocialCategory,
  UserProfile,
  BusinessStage,
  RuralUrban,
  FundingRangeId,
  BusinessRegistrationType,
  TurnoverRangeId,
} from '../types';
import { INDIAN_STATES, SCHEMES_DATABASE } from '../data/schemes';
import { rankSchemesForProfile } from '../utils/matchingEngine';
import {
  QUESTIONNAIRE_STAGES,
  BUSINESS_STAGE_OPTIONS,
  FUNDING_RANGE_OPTIONS,
  BUSINESS_REGISTRATION_OPTIONS,
  TURNOVER_RANGE_OPTIONS,
  RURAL_URBAN_OPTIONS,
} from '../data/questionnaireConfig';
import {
  Users,
  Briefcase,
  IndianRupee,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  Check,
  Building2,
  Hammer,
  Truck,
  Sprout,
  UtensilsCrossed,
  Cpu,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Edit3,
  Rocket,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { useTranslation } from '../i18n';
import { AnimatedCounter } from '../animations/AnimatedCounter';
import { questionVariants, errorShakeVariants } from '../animations/variants';

const DRAFT_KEY = 'yojana_setu_adaptive_form_draft_v2';

interface EligibilityFormScreenProps {
  initialProfile?: UserProfile | null;
  onSubmit: (profile: UserProfile) => void;
}

export const EligibilityFormScreen: React.FC<EligibilityFormScreenProps> = ({
  onSubmit,
}) => {
  const {
    t,
    formatCurrency,
    getLocalizedCategory,
    getLocalizedCategoryDesc,
    getLocalizedBusinessType,
    getLocalizedState,
    lang,
  } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Form State - Always initialized empty/unselected so user enters details manually every time
  const [category, setCategory] = useState<SocialCategory | null>(null);
  const [age, setAge] = useState<number | ''>('');
  const [annualIncome, setAnnualIncome] = useState<number | ''>('');
  const [state, setState] = useState<string>('');
  const [ruralUrban, setRuralUrban] = useState<RuralUrban | null>(null);
  const [businessStage, setBusinessStage] = useState<BusinessStage | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [fundingRangeId, setFundingRangeId] = useState<FundingRangeId | null>(null);
  const [fundingRequired, setFundingRequired] = useState<number | ''>('');
  const [businessRegistration, setBusinessRegistration] =
    useState<BusinessRegistrationType | null>(null);
  const [turnoverRangeId, setTurnoverRangeId] = useState<TurnoverRangeId | null>(null);

  // Active stage navigation
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter stages based on conditional showWhen
  const activeStages = useMemo(() => {
    return QUESTIONNAIRE_STAGES.filter((stage) => {
      if (!stage.showWhen) return true;
      return stage.showWhen({ businessStage: businessStage || undefined });
    });
  }, [businessStage]);

  // Ensure currentStageIdx is within bounds if activeStages shrinks
  useEffect(() => {
    if (currentStageIdx >= activeStages.length) {
      setCurrentStageIdx(activeStages.length - 1);
    }
  }, [activeStages, currentStageIdx]);

  // Clear any legacy cached drafts from localStorage to ensure clean state every session
  useEffect(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem('yojana_setu_adaptive_form_draft');
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Handler to clear and reset the form to blank slate anytime
  const handleResetForm = () => {
    setCategory(null);
    setAge('');
    setAnnualIncome('');
    setState('');
    setRuralUrban(null);
    setBusinessStage(null);
    setBusinessType(null);
    setFundingRangeId(null);
    setFundingRequired('');
    setBusinessRegistration(null);
    setTurnoverRangeId(null);
    setCurrentStageIdx(0);
    setValidationError(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem('yojana_setu_adaptive_form_draft');
    } catch {
      // Ignore storage errors
    }
  };

  // Reactive Live Indicative Match Count Calculation
  const liveIndicativeMatches = useMemo(() => {
    const probeProfile: UserProfile = {
      category: category || 'General',
      age: typeof age === 'number' ? age : 30,
      annualIncome: typeof annualIncome === 'number' ? annualIncome : 300000,
      businessType: businessType || 'manufacturing',
      state: state || 'All States & UTs',
      businessStage: businessStage || 'new',
      fundingRequired: typeof fundingRequired === 'number' ? fundingRequired : 300000,
      ruralUrban: ruralUrban || 'rural',
      businessRegistration: businessRegistration || 'unregistered',
    };

    const evaluated = rankSchemesForProfile(SCHEMES_DATABASE, probeProfile, lang);
    return evaluated.filter((m) => m.isEligible || m.matchStatus === 'near-match').length;
  }, [
    category,
    age,
    annualIncome,
    businessType,
    state,
    businessStage,
    fundingRequired,
    fundingRangeId,
    ruralUrban,
    businessRegistration,
    turnoverRangeId,
    lang,
  ]);

  const currentStage = activeStages[currentStageIdx] || activeStages[0];

  // Icons for business types
  const businessTypeIcons: Record<BusinessType, React.FC<{ className?: string }>> = {
    manufacturing: Hammer,
    trading: ShoppingBag,
    services: Truck,
    agri: Sprout,
    handicraft: Building2,
    food: UtensilsCrossed,
    tech: Cpu,
  };

  // Validation function per stage
  const validateCurrentStage = (): boolean => {
    setValidationError(null);
    if (currentStage.id === 'about_you') {
      if (!category) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया आगे बढ़ने के लिए अपना सामाजिक वर्ग चुनें।'
            : 'Please select your Social Category to proceed.'
        );
        return false;
      }
      if (age === '' || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया एक मान्य आयु दर्ज करें (न्यूनतम 18 वर्ष)।'
            : 'Please enter a valid age (minimum 18 years).'
        );
        return false;
      }
      if (!state) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया अपना व्यवसाय राज्य अथवा केंद्र शासित प्रदेश चुनें।'
            : 'Please select your Business State or Union Territory.'
        );
        return false;
      }
      if (!ruralUrban) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया अपना उद्यम क्षेत्र (ग्रामीण अथवा शहरी) चुनें।'
            : 'Please select your Enterprise Location (Rural or Urban).'
        );
        return false;
      }
      if (annualIncome === '' || isNaN(Number(annualIncome)) || Number(annualIncome) < 0) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया परिवार की अनुमानित वार्षिक आय दर्ज करें।'
            : 'Please enter your approximate Annual Household Income.'
        );
        return false;
      }
    } else if (currentStage.id === 'business_stage') {
      if (!businessStage) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया अपने व्यवसाय का वर्तमान चरण चुनें।'
            : 'Please select your Business Planning Stage.'
        );
        return false;
      }
    } else if (currentStage.id === 'business_type') {
      if (!businessType) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया अपने व्यवसाय का क्षेत्र (उद्योग/व्यापार) चुनें।'
            : 'Please select your primary Business Sector.'
        );
        return false;
      }
    } else if (currentStage.id === 'funding') {
      if (!fundingRangeId && (fundingRequired === '' || Number(fundingRequired) <= 0)) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया अपेक्षित ऋण राशि अथवा सीमा चुनें।'
            : 'Please select your funding or credit requirement range.'
        );
        return false;
      }
    } else if (currentStage.id === 'existing_biz') {
      if (!businessRegistration) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया अपने व्यवसाय का पंजीकरण प्रकार चुनें।'
            : 'Please select your Business Registration status.'
        );
        return false;
      }
      if (!turnoverRangeId) {
        setValidationError(
          lang === 'hi'
            ? 'कृपया अपने व्यवसाय का वार्षिक टर्नओवर सीमा चुनें।'
            : 'Please select your Annual Business Turnover range.'
        );
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStage()) return;
    if (currentStageIdx < activeStages.length - 1) {
      setSlideDirection(1);
      setCurrentStageIdx(currentStageIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setValidationError(null);
    if (currentStageIdx > 0) {
      setSlideDirection(-1);
      setCurrentStageIdx(currentStageIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToStage = (stageId: string) => {
    const idx = activeStages.findIndex((s) => s.id === stageId);
    if (idx !== -1) {
      setValidationError(null);
      setSlideDirection(idx > currentStageIdx ? 1 : -1);
      setCurrentStageIdx(idx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!category || !businessType || !state || !ruralUrban || !businessStage) {
      setValidationError(
        lang === 'hi'
          ? 'कृपया सभी आवश्यक प्रश्न पूर्ण करें।'
          : 'Please complete all required questions.'
      );
      return;
    }

    const finalProfile: UserProfile = {
      category,
      age: typeof age === 'number' ? age : 30,
      annualIncome: typeof annualIncome === 'number' ? annualIncome : 0,
      businessType,
      state: state || 'All States & UTs',
      businessStage: businessStage || 'new',
      fundingRequired: typeof fundingRequired === 'number' ? fundingRequired : 300000,
      fundingRangeId: fundingRangeId || undefined,
      ruralUrban: ruralUrban || 'rural',
      businessRegistration: businessRegistration || 'unregistered',
      turnoverRangeId: turnoverRangeId || undefined,
    };

    onSubmit(finalProfile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Brand & Portal Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <YojanaSetuLogo size={28} iconOnly={true} />
          <span className="font-bold text-xs uppercase tracking-widest text-[#14453D] dark:text-[#34D399]">
            {t('common.appName')} · {t('form.badge')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] tracking-tight">
          {t('form.title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#516A5F] dark:text-[#8E9F97] max-w-xl mx-auto mt-1">
          {t('form.subtitle')}
        </p>
      </div>

      {/* Live Indicative Match Banner */}
      <div
        id="indicative-scheme-counter"
        className="mb-6 p-4 rounded-md border border-[#C1E2D0] dark:border-[#22503E] bg-[#D4EFE1]/40 dark:bg-[#143327]/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] animate-ping opacity-75 absolute inline-flex"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] relative inline-flex"></span>
          </div>
          <p className="text-xs sm:text-sm text-[#14453D] dark:text-[#D4EFE1]">
            <span>{t('questionnaire.indicativeCountPrefix')} </span>
            <strong className="text-base font-extrabold underline decoration-[#16A34A] dark:decoration-[#4ADE80] inline-flex items-center gap-1">
              <AnimatedCounter value={liveIndicativeMatches} />
              <span>{t('results.tabAll').toLowerCase()}</span>
            </strong>{' '}
            <span>{t('questionnaire.indicativeCountSuffix')}</span>
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[#8E9F97] bg-white/70 dark:bg-[#101613]/70 px-2.5 py-1 rounded border border-[#C1E2D0] dark:border-[#24342D] whitespace-nowrap">
          {t('questionnaire.indicativeEstimateNote')}
        </span>
      </div>

      {/* Dynamic Stepper Header */}
      <div className="bg-white dark:bg-[#151C19] border border-[#E2E2E0] dark:border-[#24342D] rounded-md p-4 mb-6 shadow-2xs">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-[#14453D] dark:text-[#34D399]">
            {lang === 'hi'
              ? `चरण ${currentStageIdx + 1} / ${activeStages.length}: ${t(currentStage.stageShortKey as any)}`
              : `Step ${currentStageIdx + 1} of ${activeStages.length}: ${t(currentStage.stageShortKey as any)}`}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="reset-form-btn"
              onClick={handleResetForm}
              className="text-[#6F7A73] dark:text-[#8E9F97] hover:text-[#C2603F] dark:hover:text-[#F87171] text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title={lang === 'hi' ? 'सभी फ़ील्ड साफ़ करें' : 'Clear all fields'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{lang === 'hi' ? 'रीसेट करें' : 'Reset Form'}</span>
            </button>
            <span className="text-[#6F7A73] dark:text-[#8E9F97] font-medium">
              {Math.round(((currentStageIdx + 1) / activeStages.length) * 100)}% Completed
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-[#EEEEED] dark:bg-[#202B26] h-2 rounded-full overflow-hidden mb-4">
          <motion.div
            className="bg-[#14453D] dark:bg-[#34D399] h-full rounded-full"
            initial={false}
            animate={{ width: `${((currentStageIdx + 1) / activeStages.length) * 100}%` }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Stepper Tabs Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1 border-t border-[#E2E2E0]/60 dark:border-[#24342D]/60">
          {activeStages.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <motion.button
                key={stage.id}
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                onClick={() => {
                  if (idx <= currentStageIdx || validateCurrentStage()) {
                    handleJumpToStage(stage.id);
                  }
                }}
                className={`px-2 py-1.5 rounded text-left transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] ${
                  isCurrent
                    ? 'bg-[#14453D] text-white font-bold shadow-2xs'
                    : isCompleted
                    ? 'bg-[#D4EFE1]/50 dark:bg-[#1A382D]/50 text-[#14453D] dark:text-[#4ADE80] hover:bg-[#D4EFE1] dark:hover:bg-[#1A382D]'
                    : 'text-[#6F7A73] dark:text-[#8E9F97] hover:bg-[#F3F4F3] dark:hover:bg-[#1A2420]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                    isCurrent
                      ? 'bg-white text-[#14453D]'
                      : isCompleted
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#E2E2E0] dark:bg-[#293B33] text-[#516A5F] dark:text-[#8E9F97]'
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                </div>
                <span className="truncate">{t(stage.stageShortKey as any)}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Validation Error Alert Banner */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            key={validationError}
            id="form-validation-alert"
            variants={shouldReduceMotion ? undefined : errorShakeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="p-3 mb-6 bg-[#FFDAD6]/40 dark:bg-[#3D1A14]/60 border border-[#FFCCBD] dark:border-[#5A2B20] rounded text-xs text-[#7C2C0F] dark:text-[#FCA5A5] flex items-center gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-[#C2603F] shrink-0" />
            <span className="font-semibold">{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE CONTAINER */}
      <div className="bg-white dark:bg-[#151C19] border border-[#E2E2E0] dark:border-[#24342D] rounded-md p-5 sm:p-7 shadow-xs mb-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentStage.id}
            custom={slideDirection}
            variants={shouldReduceMotion ? undefined : questionVariants}
            initial={shouldReduceMotion ? undefined : 'enter'}
            animate={shouldReduceMotion ? undefined : 'center'}
            exit={shouldReduceMotion ? undefined : 'exit'}
          >
            {/* Stage Header */}
            <div className="mb-6 pb-4 border-b border-[#E2E2E0] dark:border-[#24342D]">
              <h2 className="text-lg sm:text-xl font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                {t(currentStage.stageTitleKey as any)}
              </h2>
              <p className="text-xs sm:text-sm text-[#516A5F] dark:text-[#8E9F97] mt-1">
                {t(currentStage.stageDescKey as any)}
              </p>
            </div>

        {/* ------------------------------------------------------------- */}
        {/* STAGE 1: ABOUT YOU & LOCATION */}
        {/* ------------------------------------------------------------- */}
        {currentStage.id === 'about_you' && (
          <div className="space-y-6">
            {/* Social Category Question */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#14453D] dark:text-[#34D399]" />
                  <span>{t('form.categoryTitle')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                  {t('form.categoryHint')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {(['SC', 'ST', 'Woman', 'OBC', 'Minority', 'General'] as SocialCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      id={`category-btn-${cat}`}
                      onClick={() => {
                        setCategory(cat);
                        setValidationError(null);
                      }}
                      className={`p-3 rounded border text-left cursor-pointer transition-all flex items-start justify-between ${
                        category === cat
                          ? 'border-[#14453D] dark:border-[#34D399] bg-[#D4EFE1]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#34D399]'
                          : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#34D399]/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#1A1C1B] dark:text-[#F0F4F2]">
                          {getLocalizedCategory(cat)}
                        </div>
                        <div className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] mt-0.5">
                          {getLocalizedCategoryDesc(cat)}
                        </div>
                      </div>
                      {category === cat && (
                        <Check className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 ml-2" />
                      )}
                    </button>
                  )
                )}
              </div>

              {/* Helper tip: Why we ask this */}
              <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span>{t('questionnaire.whyAskCategory')}</span>
              </div>
            </div>

            {/* Age Question */}
            <div className="pt-5 border-t border-[#E2E2E0] dark:border-[#24342D]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#14453D] dark:text-[#34D399]" />
                  <span>{t('form.ageTitle')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-[#14453D] dark:text-[#34D399]">
                  {age !== '' ? `${age} ${t('common.years')}` : (lang === 'hi' ? 'आयु चुनें (18–70)' : 'Not set (18–70)')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="age-input"
                  type="number"
                  min="18"
                  max="70"
                  placeholder={lang === 'hi' ? 'उदा. 28' : 'e.g. 28'}
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setAge(val);
                    setValidationError(null);
                  }}
                  className="w-28 p-2.5 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#34D399]"
                />
                <input
                  type="range"
                  min="18"
                  max="70"
                  value={age === '' ? 18 : age}
                  onChange={(e) => {
                    setAge(parseInt(e.target.value, 10));
                    setValidationError(null);
                  }}
                  className="w-full accent-[#14453D] dark:accent-[#34D399] cursor-pointer"
                />
              </div>

              {/* Age preset buttons */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[21, 25, 30, 35, 45, 60].map((presetAge) => (
                  <button
                    key={presetAge}
                    type="button"
                    onClick={() => {
                      setAge(presetAge);
                      setValidationError(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${
                      age === presetAge
                        ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#34D399]'
                        : 'bg-[#FAFAF9] dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
                    }`}
                  >
                    {presetAge} {t('common.years')}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span>{t('questionnaire.whyAskAge')}</span>
              </div>
            </div>

            {/* State & Location Question */}
            <div className="pt-5 border-t border-[#E2E2E0] dark:border-[#24342D]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#14453D] dark:text-[#34D399]" />
                  <span>{t('form.stateTitle')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                  {t('form.stateHint')}
                </span>
              </div>

              <select
                id="state-select"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setValidationError(null);
                }}
                className="w-full p-2.5 text-xs font-semibold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#34D399]"
              >
                <option value="" disabled>
                  {lang === 'hi'
                    ? '-- अपना राज्य या केंद्र शासित प्रदेश चुनें --'
                    : '-- Select your State or Union Territory --'}
                </option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {getLocalizedState(st)}
                  </option>
                ))}
              </select>

              {/* Popular state pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'All States & UTs',
                  'Maharashtra',
                  'Tamil Nadu',
                  'Uttar Pradesh',
                  'Bihar',
                  'Karnataka',
                  'Telangana',
                  'West Bengal',
                ].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setState(st);
                      setValidationError(null);
                    }}
                    className={`px-2 py-0.5 text-[11px] rounded border cursor-pointer ${
                      state === st
                        ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#34D399]'
                        : 'bg-[#FAFAF9] dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
                    }`}
                  >
                    {getLocalizedState(st)}
                  </button>
                ))}
              </div>

              {/* Location: Rural vs Urban */}
              <div className="mt-4 pt-3 border-t border-[#E2E2E0]/60 dark:border-[#24342D]/60">
                <label className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-1.5">
                  {t('questionnaire.locationTitle')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RURAL_URBAN_OPTIONS.map((loc) => {
                    const isSelected = ruralUrban === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setRuralUrban(loc.id);
                          setValidationError(null);
                        }}
                        className={`p-2.5 rounded border text-left cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#14453D] dark:border-[#34D399] bg-[#D4EFE1]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#34D399]'
                            : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#34D399]/50'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-[#1A1C1B] dark:text-[#F0F4F2]">
                            {t(loc.labelKey as any)}
                          </div>
                          <div className="text-[10px] text-[#516A5F] dark:text-[#8E9F97] mt-0.5">
                            {t(loc.descKey as any)}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#14453D] dark:text-[#34D399]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span>{t('questionnaire.whyAskLocation')}</span>
              </div>
            </div>

            {/* Annual Household Income Question */}
            <div className="pt-5 border-t border-[#E2E2E0] dark:border-[#24342D]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-[#14453D] dark:text-[#34D399]" />
                  <span>{t('form.incomeTitle')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-[#14453D] dark:text-[#34D399]">
                  {t('form.incomeFormatted')}{' '}
                  {annualIncome !== '' ? formatCurrency(Number(annualIncome)) : (lang === 'hi' ? 'दर्ज नहीं किया गया' : 'Not entered')}
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#516A5F] dark:text-[#8E9F97] font-bold text-sm">
                  ₹
                </div>
                <input
                  id="income-input"
                  type="number"
                  step="50000"
                  min="0"
                  placeholder={lang === 'hi' ? 'उदा. 250000' : 'e.g. 250000'}
                  value={annualIncome}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setAnnualIncome(val);
                    setValidationError(null);
                  }}
                  className="w-full pl-8 pr-3 py-2.5 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#34D399]"
                />
              </div>

              {/* Income presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '₹1.5 Lakh', value: 150000 },
                  { label: '₹3.0 Lakh', value: 300000 },
                  { label: '₹5.0 Lakh', value: 500000 },
                  { label: '₹8.0 Lakh', value: 800000 },
                  { label: '₹15 Lakh', value: 1500000 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setAnnualIncome(preset.value);
                      setValidationError(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${
                      annualIncome === preset.value
                        ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#34D399]'
                        : 'bg-[#FAFAF9] dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#E2E2E0] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span>{t('questionnaire.whyAskIncome')}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 2: BUSINESS PLANNING STAGE */}
        {/* ------------------------------------------------------------- */}
        {currentStage.id === 'business_stage' && (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] mb-3">
              {lang === 'hi'
                ? 'आप अपने उद्यम के लिए वर्तमान में क्या योजना बना रहे हैं?'
                : 'What are you currently planning for your business enterprise?'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BUSINESS_STAGE_OPTIONS.map((opt) => {
                const isSelected = businessStage === opt.id;
                const IconComponent =
                  opt.id === 'new' ? Rocket : opt.id === 'existing' ? Briefcase : TrendingUp;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setBusinessStage(opt.id);
                      setValidationError(null);
                    }}
                    className={`p-4 rounded border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#14453D] dark:border-[#34D399] bg-[#D4EFE1]/40 dark:bg-[#1A382D] ring-2 ring-[#14453D] dark:ring-[#34D399]'
                        : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#34D399]/50'
                    }`}
                  >
                    <div>
                      <div className="w-9 h-9 rounded-md bg-[#14453D]/10 dark:bg-[#34D399]/10 text-[#14453D] dark:text-[#34D399] flex items-center justify-center mb-3">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-[#1A1C1B] dark:text-[#F0F4F2] mb-1">
                        {t(opt.labelKey as any)}
                      </h3>
                      <p className="text-xs text-[#516A5F] dark:text-[#8E9F97] leading-relaxed">
                        {t(opt.descKey as any)}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E2E0]/60 dark:border-[#24342D]/60 flex items-center justify-between text-xs">
                      <span className="font-medium text-[#14453D] dark:text-[#34D399]">
                        {isSelected ? (
                          <span className="flex items-center gap-1 font-bold">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          'Select option'
                        )}
                      </span>
                      {opt.id === 'new' && (
                        <span className="text-[10px] font-bold bg-[#14453D] text-white px-1.5 py-0.5 rounded">
                          Seed Credit
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Why we ask this */}
            <div className="mt-4 p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97]">
              <HelpCircle className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
              <span>{t('questionnaire.whyAskBizStage')}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 3: BUSINESS SECTOR & DOMAIN */}
        {/* ------------------------------------------------------------- */}
        {currentStage.id === 'business_type' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
                {t('form.businessTitle')}
              </span>
              <span className="text-xs text-[#516A5F] dark:text-[#8E9F97]">
                {t('form.businessHint')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(
                [
                  'manufacturing',
                  'trading',
                  'services',
                  'agri',
                  'handicraft',
                  'food',
                  'tech',
                ] as BusinessType[]
              ).map((type) => {
                const IconComponent = businessTypeIcons[type];
                const isSelected = businessType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    id={`biz-type-${type}`}
                    onClick={() => {
                      setBusinessType(type);
                      setValidationError(null);
                    }}
                    className={`p-3.5 rounded border text-left cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#14453D] dark:border-[#34D399] bg-[#D4EFE1]/40 dark:bg-[#1A382D] ring-2 ring-[#14453D] dark:ring-[#34D399]'
                        : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#34D399]/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded shrink-0 ${
                        isSelected
                          ? 'bg-[#14453D] text-white'
                          : 'bg-[#E2E2E0]/60 dark:bg-[#202B26] text-[#14453D] dark:text-[#34D399]'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="grow">
                      <div className="font-bold text-xs sm:text-sm text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {getLocalizedBusinessType(type)}
                      </div>
                      <div className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] mt-0.5 leading-snug">
                        {type === 'manufacturing' && 'Industrial fabrication & assembly'}
                        {type === 'trading' && 'Retail, shopkeeper, wholesale merchant'}
                        {type === 'services' && 'Logistics, repair, technical operations'}
                        {type === 'agri' && 'Dairy, horticulture, poultry & food units'}
                        {type === 'handicraft' && 'Traditional artisan & handloom works'}
                        {type === 'food' && 'Catering, bakery & packaged food units'}
                        {type === 'tech' && 'Digital platforms, IT services & software'}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Why we ask this */}
            <div className="mt-4 p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97]">
              <HelpCircle className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
              <span>{t('questionnaire.whyAskBizType')}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 4: FUNDING NEED */}
        {/* ------------------------------------------------------------- */}
        {currentStage.id === 'funding' && (
          <div className="space-y-5">
            <p className="text-xs sm:text-sm font-semibold text-[#1A1C1B] dark:text-[#F0F4F2] mb-1">
              {lang === 'hi'
                ? 'आपके व्यवसाय को शुरू करने अथवा संचालित करने के लिए कितनी पूंजी या ऋण चाहिए?'
                : 'How much funding or loan assistance does your enterprise require?'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FUNDING_RANGE_OPTIONS.map((opt) => {
                const isSelected = fundingRangeId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setFundingRangeId(opt.id);
                      setFundingRequired(opt.defaultAmount);
                      setValidationError(null);
                    }}
                    className={`p-4 rounded border text-left cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-[#14453D] dark:border-[#34D399] bg-[#D4EFE1]/40 dark:bg-[#1A382D] ring-2 ring-[#14453D] dark:ring-[#34D399]'
                        : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#34D399]/50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {t(opt.labelKey as any)}
                      </div>
                      <div className="text-xs text-[#516A5F] dark:text-[#8E9F97] mt-1 leading-relaxed">
                        {t(opt.descKey as any)}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Exact Amount Input */}
            <div className="pt-4 border-t border-[#E2E2E0] dark:border-[#24342D]">
              <label className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-1.5">
                {lang === 'hi'
                  ? 'अथवा सटीक राशि दर्ज करें (वैकल्पिक):'
                  : 'Or specify an exact loan / funding requirement:'}
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-full max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#516A5F] dark:text-[#8E9F97] font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="50000"
                    min="10000"
                    placeholder={lang === 'hi' ? 'उदा. 300000' : 'e.g. 300000'}
                    value={fundingRequired}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setFundingRequired(val);
                      setValidationError(null);
                    }}
                    className="w-full pl-8 pr-3 py-2.5 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#34D399]"
                  />
                </div>
                <span className="text-xs font-bold text-[#14453D] dark:text-[#34D399]">
                  {fundingRequired !== '' ? formatCurrency(Number(fundingRequired)) : ''}
                </span>
              </div>
            </div>

            {/* Why we ask this */}
            <div className="mt-3 p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97]">
              <HelpCircle className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
              <span>{t('questionnaire.whyAskFunding')}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 5: EXISTING BUSINESS DETAILS (ADAPTIVE) */}
        {/* ------------------------------------------------------------- */}
        {currentStage.id === 'existing_biz' && (
          <div className="space-y-6">
            {/* Registration Question */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-2">
                {t('questionnaire.registrationLabel')}
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BUSINESS_REGISTRATION_OPTIONS.map((reg) => {
                  const isSelected = businessRegistration === reg.id;
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => {
                        setBusinessRegistration(reg.id);
                        setValidationError(null);
                      }}
                      className={`p-3 rounded border text-left cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-[#14453D] dark:border-[#34D399] bg-[#D4EFE1]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#34D399]'
                          : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#34D399]/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#1A1C1B] dark:text-[#F0F4F2]">
                          {t(reg.labelKey as any)}
                        </div>
                        <div className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] mt-0.5">
                          {t(reg.descKey as any)}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Turnover Question */}
            <div className="pt-5 border-t border-[#E2E2E0] dark:border-[#24342D]">
              <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-2">
                {t('questionnaire.turnoverLabel')}
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TURNOVER_RANGE_OPTIONS.map((to) => {
                  const isSelected = turnoverRangeId === to.id;
                  return (
                    <button
                      key={to.id}
                      type="button"
                      onClick={() => {
                        setTurnoverRangeId(to.id);
                        setValidationError(null);
                      }}
                      className={`p-3 rounded border text-left cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-[#14453D] dark:border-[#34D399] bg-[#D4EFE1]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#34D399]'
                          : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#34D399]/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#1A1C1B] dark:text-[#F0F4F2]">
                          {t(to.labelKey as any)}
                        </div>
                        <div className="text-[11px] text-[#516A5F] dark:text-[#8E9F97] mt-0.5">
                          {t(to.descKey as any)}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Why we ask this */}
            <div className="mt-3 p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E2E2E0] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97]">
              <HelpCircle className="w-4 h-4 text-[#14453D] dark:text-[#34D399] shrink-0 mt-0.5" />
              <span>{t('questionnaire.whyAskExistingBiz')}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 6: REVIEW & SUMMARY */}
        {/* ------------------------------------------------------------- */}
        {currentStage.id === 'review' && (
          <div className="space-y-5">
            <div className="p-3 bg-[#D4EFE1]/40 dark:bg-[#1A382D]/40 border border-[#B2CDBF] dark:border-[#285743] rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] dark:text-[#4ADE80]" />
                <span className="text-xs sm:text-sm font-bold text-[#14453D] dark:text-[#D4EFE1]">
                  {t('questionnaire.reviewTitle')}
                </span>
              </div>
              <span className="text-xs font-extrabold text-[#14453D] dark:text-[#4ADE80]">
                ~{liveIndicativeMatches} {t('results.tabAll')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Personal & Demographic */}
              <div className="p-4 rounded border border-[#E2E2E0] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#101613]">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E0] dark:border-[#24342D] mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#34D399] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('questionnaire.stageAboutShort')}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleJumpToStage('about_you')}
                    className="text-[11px] font-bold text-[#14453D] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{t('questionnaire.editBtn')}</span>
                  </button>
                </div>

                <dl className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">{t('factors.category')}:</dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {category ? getLocalizedCategory(category) : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">{t('factors.age')}:</dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {age !== '' ? `${age} ${t('common.years')}` : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">{t('factors.state')}:</dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {state ? getLocalizedState(state) : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">{t('factors.income')}:</dt>
                    <dd className="font-bold text-[#14453D] dark:text-[#34D399]">
                      {annualIncome !== '' ? formatCurrency(Number(annualIncome)) : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">
                      {t('questionnaire.locationLabel')}:
                    </dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {ruralUrban
                        ? ruralUrban === 'rural'
                          ? t('questionnaire.ruralLabel')
                          : t('questionnaire.urbanLabel')
                        : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Card 2: Business & Enterprise */}
              <div className="p-4 rounded border border-[#E2E2E0] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#101613]">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E0] dark:border-[#24342D] mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#34D399] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>
                      {t('questionnaire.stageBizStageShort')} & {t('questionnaire.stageFundingShort')}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleJumpToStage('business_stage')}
                    className="text-[11px] font-bold text-[#14453D] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{t('questionnaire.editBtn')}</span>
                  </button>
                </div>

                <dl className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">
                      {t('questionnaire.bizStageLabel')}:
                    </dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {businessStage === 'new' && t('questionnaire.stageNewBizLabel')}
                      {businessStage === 'existing' && t('questionnaire.stageExistingBizLabel')}
                      {businessStage === 'expanding' && t('questionnaire.stageExpandingBizLabel')}
                      {!businessStage && t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">
                      {t('factors.businessType')}:
                    </dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {businessType
                        ? getLocalizedBusinessType(businessType)
                        : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6F7A73] dark:text-[#8E9F97]">
                      {t('questionnaire.fundingLabel')}:
                    </dt>
                    <dd className="font-bold text-[#14453D] dark:text-[#34D399]">
                      {fundingRequired !== ''
                        ? formatCurrency(Number(fundingRequired))
                        : t('questionnaire.notSpecified')}
                    </dd>
                  </div>

                  {businessStage !== 'new' && (
                    <>
                      <div className="flex justify-between pt-1 border-t border-[#E2E2E0]/60 dark:border-[#24342D]/60">
                        <dt className="text-[#6F7A73] dark:text-[#8E9F97]">
                          {t('questionnaire.registrationLabel')}:
                        </dt>
                        <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                          {businessRegistration ? businessRegistration.toUpperCase() : t('questionnaire.notSpecified')}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#6F7A73] dark:text-[#8E9F97]">
                          {t('questionnaire.turnoverLabel')}:
                        </dt>
                        <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                          {turnoverRangeId === 'under_5l' && '< ₹5 Lakh'}
                          {turnoverRangeId === '5l_25l' && '₹5 Lakh – ₹25 Lakh'}
                          {turnoverRangeId === '25l_1cr' && '₹25 Lakh – ₹1 Crore'}
                          {turnoverRangeId === 'above_1cr' && '> ₹1 Crore'}
                          {!turnoverRangeId && t('questionnaire.notSpecified')}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}
        </motion.div>
        </AnimatePresence>

        {/* ------------------------------------------------------------- */}
        {/* STEP CONTROLS (PREVIOUS / NEXT / SUBMIT) */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-8 pt-5 border-t border-[#E2E2E0] dark:border-[#24342D] flex flex-col sm:flex-row items-center justify-between gap-3">
          {currentStageIdx > 0 ? (
            <motion.button
              type="button"
              onClick={handlePrev}
              initial="initial"
              whileHover={shouldReduceMotion ? undefined : 'hover'}
              whileTap={shouldReduceMotion ? undefined : 'tap'}
              variants={{
                initial: { y: 0 },
                hover: { y: -1 },
                tap: { scale: 0.98 },
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <motion.span
                variants={{
                  initial: { x: 0 },
                  hover: { x: -3.5 },
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="inline-flex"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.span>
              <span>{t('questionnaire.prevBtn')}</span>
            </motion.button>
          ) : (
            <div />
          )}

          {currentStageIdx < activeStages.length - 1 ? (
            <motion.button
              type="button"
              id="stage-next-btn"
              onClick={handleNext}
              initial="initial"
              whileHover={shouldReduceMotion ? undefined : 'hover'}
              whileTap={shouldReduceMotion ? undefined : 'tap'}
              variants={{
                initial: { y: 0 },
                hover: { y: -1 },
                tap: { scale: 0.98 },
              }}
              className="w-full sm:w-auto px-7 py-3 rounded text-xs font-bold bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('questionnaire.nextBtn')}</span>
              <motion.span
                variants={{
                  initial: { x: 0 },
                  hover: { x: 3.5 },
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="inline-flex"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              id="form-submit-btn"
              onClick={handleFinalSubmit}
              whileHover={shouldReduceMotion ? undefined : { y: -1.5, scale: 1.015 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-3.5 rounded text-xs sm:text-sm font-extrabold bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('questionnaire.submitReviewBtn')}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Trust & Transparency Footnote */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97] text-center">
        <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
        <span>{t('form.trustNote')}</span>
      </div>
    </div>
  );
};
