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
import {
  SupportNeedType,
  BusinessStageKey,
  BusinessEntityType,
  RegistrationStatus,
  OperationalStatus,
  SUPPORT_NEEDS_TAXONOMY,
  BUSINESS_ENTITY_LABELS,
  BUSINESS_STAGE_TAXONOMY,
} from '../types/business';
import {
  deriveBusinessNeedProfile,
  deriveBusinessProfile,
  mapLegacyStageToKey,
  mapKeyToLegacyStage,
  calculateFundingGap,
} from '../lib/business';
import { INDIAN_STATES } from '../data/schemes';
import { getAllSchemes } from '../lib/data';
import { validateUserProfile } from '../lib/validation';
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
import {
  useTranslation,
  FORM_I18N,
  SUPPORT_NEEDS_LOCALIZED,
  LIFECYCLE_PHASES_LOCALIZED,
  OPERATIONAL_STATUS_LOCALIZED,
  REGISTRATION_STATUS_LOCALIZED,
  BUSINESS_ENTITY_LOCALIZED,
} from '../i18n';
import { AnimatedCounter } from '../animations/AnimatedCounter';
import { questionVariants, errorShakeVariants, validationTick } from '../animations/variants';
import { ArrowFillButton } from './ui';

const DRAFT_KEY = 'yojana_setu_adaptive_form_draft_v2';

interface EligibilityFormScreenProps {
  initialProfile?: UserProfile | null;
  onSubmit: (profile: UserProfile) => void;
}

export const EligibilityFormScreen: React.FC<EligibilityFormScreenProps> = ({
  initialProfile,
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
  const eui = FORM_I18N[lang] || FORM_I18N.en;
  const shouldReduceMotion = useReducedMotion();
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Form State - Initialized with initialProfile if provided, otherwise empty
  const [category, setCategory] = useState<SocialCategory | null>(initialProfile?.category || null);
  const [age, setAge] = useState<number | ''>(initialProfile?.age || '');
  const [annualIncome, setAnnualIncome] = useState<number | ''>(initialProfile?.annualIncome || '');
  const [state, setState] = useState<string>(initialProfile?.state || '');
  const [ruralUrban, setRuralUrban] = useState<RuralUrban | null>(initialProfile?.ruralUrban || null);
  const [businessStage, setBusinessStage] = useState<BusinessStage | null>(
    initialProfile?.businessStage || null
  );
  const [businessType, setBusinessType] = useState<BusinessType | null>(
    initialProfile?.businessType || null
  );
  const [fundingRangeId, setFundingRangeId] = useState<FundingRangeId | null>(
    initialProfile?.fundingRangeId || null
  );
  const [fundingRequired, setFundingRequired] = useState<number | ''>(
    initialProfile?.fundingRequired || ''
  );
  const [businessRegistration, setBusinessRegistration] =
    useState<BusinessRegistrationType | null>(initialProfile?.businessRegistration || null);
  const [turnoverRangeId, setTurnoverRangeId] = useState<TurnoverRangeId | null>(
    initialProfile?.turnoverRangeId || null
  );

  // Phase 4.1 Business Profile & Need Intelligence Fields
  const [totalProjectCost, setTotalProjectCost] = useState<number | ''>(
    initialProfile?.totalProjectCost || ''
  );
  const [existingInvestment, setExistingInvestment] = useState<number | ''>(
    initialProfile?.existingInvestment ?? ''
  );
  const [businessName, setBusinessName] = useState<string>(
    initialProfile?.businessName || ''
  );
  const [primarySupportNeed, setPrimarySupportNeed] = useState<SupportNeedType | null>(
    initialProfile?.primarySupportNeed || null
  );

  // Extended Geographic Location
  const [residenceState, setResidenceState] = useState<string>(
    initialProfile?.residenceState || initialProfile?.state || ''
  );
  const [businessState, setBusinessState] = useState<string>(
    initialProfile?.businessState || initialProfile?.state || ''
  );
  const [isDifferentState, setIsDifferentState] = useState<boolean>(
    Boolean(
      initialProfile?.residenceState &&
        initialProfile?.businessState &&
        initialProfile.residenceState.trim() !== initialProfile.businessState.trim()
    )
  );
  const [district, setDistrict] = useState<string>(initialProfile?.district || '');

  // Detailed Stage & Operational Status
  const [businessStageKey, setBusinessStageKey] = useState<BusinessStageKey | null>(
    initialProfile?.businessStageKey || null
  );
  const [operationalStatus, setOperationalStatus] = useState<OperationalStatus | null>(
    initialProfile?.operationalStatus || null
  );

  // Legal Structure, Trade Subsector & Experience
  const [businessEntityType, setBusinessEntityType] = useState<BusinessEntityType | null>(
    initialProfile?.businessEntityType || null
  );
  const [subSector, setSubSector] = useState<string>(initialProfile?.subSector || '');
  const [entrepreneurExperienceYears, setEntrepreneurExperienceYears] = useState<number | ''>(
    initialProfile?.entrepreneurExperienceYears ?? ''
  );

  // Registration Status
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(
    initialProfile?.registrationStatus || null
  );

  const calculatedFundingGap = useMemo(() => {
    return calculateFundingGap(
      typeof totalProjectCost === 'number' ? totalProjectCost : undefined,
      typeof existingInvestment === 'number' ? existingInvestment : undefined,
      typeof fundingRequired === 'number' ? fundingRequired : undefined
    );
  }, [totalProjectCost, existingInvestment, fundingRequired]);

  const handleSelectPrimaryNeed = (need: SupportNeedType | null) => {
    setPrimarySupportNeed(need);
  };

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
    setTotalProjectCost('');
    setExistingInvestment('');
    setBusinessName('');
    setPrimarySupportNeed(null);
    setResidenceState('');
    setBusinessState('');
    setIsDifferentState(false);
    setDistrict('');
    setBusinessStageKey(null);
    setOperationalStatus(null);
    setBusinessEntityType(null);
    setSubSector('');
    setEntrepreneurExperienceYears('');
    setRegistrationStatus(null);
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

    const evaluated = rankSchemesForProfile(getAllSchemes(), probeProfile, lang);
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
        setValidationError(eui.valCategory);
        return false;
      }
      if (age === '' || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
        setValidationError(eui.valAge);
        return false;
      }
      if (!state) {
        setValidationError(eui.valState);
        return false;
      }
      if (!ruralUrban) {
        setValidationError(eui.valLocation);
        return false;
      }
      if (annualIncome === '' || isNaN(Number(annualIncome)) || Number(annualIncome) < 0) {
        setValidationError(eui.valIncome);
        return false;
      }
    } else if (currentStage.id === 'business_stage') {
      if (!businessStage) {
        setValidationError(eui.valBizStage);
        return false;
      }
    } else if (currentStage.id === 'business_type') {
      if (!businessType) {
        setValidationError(eui.valBizSector);
        return false;
      }
    } else if (currentStage.id === 'funding') {
      if (!fundingRangeId && (fundingRequired === '' || Number(fundingRequired) <= 0)) {
        setValidationError(eui.valFunding);
        return false;
      }
    } else if (currentStage.id === 'existing_biz') {
      if (!businessRegistration) {
        setValidationError(eui.valRegistration);
        return false;
      }
      if (!turnoverRangeId) {
        setValidationError(eui.valTurnover);
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
      setValidationError(eui.valCompleteAll);
      return;
    }

    const finalResidenceState = residenceState || state || 'All States & UTs';
    const finalBusinessState = businessState || state || 'All States & UTs';
    const finalIsInterstate = Boolean(
      isDifferentState &&
        finalResidenceState &&
        finalBusinessState &&
        finalResidenceState.trim() !== finalBusinessState.trim()
    );

    const finalProfile: UserProfile = {
      category,
      age: typeof age === 'number' ? age : 30,
      annualIncome: typeof annualIncome === 'number' ? annualIncome : 0,
      businessType,
      state: state || 'All States & UTs',
      district: district.trim() || undefined,
      residenceState: finalResidenceState,
      businessState: finalBusinessState,
      isInterstate: finalIsInterstate,
      businessStage: businessStage || 'new',
      businessStageKey:
        businessStageKey ||
        (businessStage ? mapLegacyStageToKey(businessStage) : 'NEW_BUSINESS'),
      operationalStatus: operationalStatus || undefined,
      businessEntityType: businessEntityType || undefined,
      subSector: subSector.trim() || undefined,
      entrepreneurExperienceYears:
        typeof entrepreneurExperienceYears === 'number' ? entrepreneurExperienceYears : undefined,
      registrationStatus: registrationStatus || undefined,
      fundingRequired: typeof fundingRequired === 'number' ? fundingRequired : 300000,
      fundingRangeId: fundingRangeId || undefined,
      ruralUrban: ruralUrban || 'rural',
      businessRegistration: businessRegistration || 'unregistered',
      turnoverRangeId: turnoverRangeId || undefined,
      businessName: businessName.trim() || undefined,
      totalProjectCost:
        typeof totalProjectCost === 'number'
          ? totalProjectCost
          : typeof fundingRequired === 'number'
          ? fundingRequired
          : undefined,
      existingInvestment: typeof existingInvestment === 'number' ? existingInvestment : 0,
      fundingGap: calculatedFundingGap,
      primarySupportNeed: primarySupportNeed || undefined,
    };

    finalProfile.businessNeedProfile = deriveBusinessNeedProfile(finalProfile);
    finalProfile.businessProfile = deriveBusinessProfile(finalProfile);

    const validation = validateUserProfile(finalProfile, lang);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setValidationError(firstError);
      return;
    }

    const outputProfile = validation.formattedProfile || finalProfile;
    if (!outputProfile.businessNeedProfile) {
      outputProfile.businessNeedProfile = finalProfile.businessNeedProfile;
    }
    if (!outputProfile.businessProfile) {
      outputProfile.businessProfile = finalProfile.businessProfile;
    }

    onSubmit(outputProfile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Brand & Portal Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <YojanaSetuLogo size={28} iconOnly={true} />
          <span className="font-bold text-xs uppercase tracking-widest text-[#14453D] dark:text-[#4ADE80]">
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
        className="mb-6 p-4 rounded-md border border-[#C1E2D0] dark:border-[#22503E] bg-[#D9E8DF]/40 dark:bg-[#143327]/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-[#175741] dark:bg-[#4ADE80] animate-ping opacity-75 absolute inline-flex"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#175741] dark:bg-[#4ADE80] relative inline-flex"></span>
          </div>
          <p className="text-xs sm:text-sm text-[#14453D] dark:text-[#D9E8DF]">
            <span>{t('questionnaire.indicativeCountPrefix')} </span>
            <strong className="text-base font-extrabold underline decoration-[#1E6A50] dark:decoration-[#4ADE80] inline-flex items-center gap-1">
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
      <div className="yj-card p-4 sm:p-5 mb-6">
        {/* Journey framing: the assessment reads as a guided profile journey. */}
        <p className="yj-eyebrow text-[#516A5F] dark:text-[#8E9F97] mb-2">
          {eui.journeyEyebrow}
        </p>
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-[#0B5D4B] dark:text-[#4ADE80]">
            {eui.stepIndicator(currentStageIdx + 1, activeStages.length, t(currentStage.stageShortKey as any))}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="reset-form-btn"
              onClick={handleResetForm}
              className="text-[#516A5F] dark:text-[#8E9F97] hover:text-[#C2603F] dark:hover:text-[#F87171] text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title={eui.clearAllFields}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{eui.resetForm}</span>
            </button>
            <span className="text-[#516A5F] dark:text-[#8E9F97] font-medium flex items-center gap-1">
              <AnimatedCounter
                value={Math.round(((currentStageIdx + 1) / activeStages.length) * 100)}
              />
              <span>% {eui.completedPercent}</span>
            </span>
          </div>
        </div>

        {/* Segmented + shimmering Linear Progress Bar */}
        <div className="relative w-full bg-[#EEEEED] dark:bg-[#202B26] h-2 rounded-full overflow-hidden mb-4">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-r from-[#14453D] via-[#1E6A50] to-[#1E6A50] overflow-hidden"
            initial={false}
            animate={{ width: `${((currentStageIdx + 1) / activeStages.length) * 100}%` }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {!shouldReduceMotion && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 w-1/3 bg-white/35"
                initial={{ x: '-120%' }}
                animate={{ x: '320%' }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
              />
            )}
          </motion.div>

          {/* Stage tick marks so progress reads as discrete steps */}
          <div className="pointer-events-none absolute inset-0 flex">
            {activeStages.map((stage, idx) => (
              <div
                key={`tick-${stage.id}`}
                className={`flex-1 ${
                  idx === activeStages.length - 1
                    ? ''
                    : 'border-r border-white/70 dark:border-[#0E1311]/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stepper Tabs Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1 border-t border-[#E4E8E4]/60 dark:border-[#24342D]/60">
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
                    ? 'bg-[#D9E8DF]/50 dark:bg-[#1A382D]/50 text-[#14453D] dark:text-[#4ADE80] hover:bg-[#D9E8DF] dark:hover:bg-[#1A382D]'
                    : 'text-[#516A5F] dark:text-[#8E9F97] hover:bg-[#F3F4F3] dark:hover:bg-[#1A2420]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                    isCurrent
                      ? 'bg-white text-[#14453D]'
                      : isCompleted
                      ? 'bg-[#175741] text-white'
                      : 'bg-[#E4E8E4] dark:bg-[#293B33] text-[#516A5F] dark:text-[#8E9F97]'
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isCompleted ? (
                      <motion.span
                        key="tick"
                        variants={shouldReduceMotion ? undefined : validationTick}
                        initial={shouldReduceMotion ? undefined : 'hidden'}
                        animate={shouldReduceMotion ? undefined : 'visible'}
                        exit={shouldReduceMotion ? undefined : 'exit'}
                        className="flex items-center justify-center"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="index"
                        variants={shouldReduceMotion ? undefined : validationTick}
                        initial={shouldReduceMotion ? undefined : 'hidden'}
                        animate={shouldReduceMotion ? undefined : 'visible'}
                        exit={shouldReduceMotion ? undefined : 'exit'}
                      >
                        {idx + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
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
      <div className="bg-white dark:bg-[#151C19] border border-[#E4E8E4] dark:border-[#24342D] rounded-md p-5 sm:p-7 shadow-xs mb-6 overflow-hidden">
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
            <div className="mb-6 pb-4 border-b border-[#E4E8E4] dark:border-[#24342D]">
              <h2 className="yj-h3 text-[#0F1512] dark:text-[#F0F4F2]">
                {t(currentStage.stageTitleKey as any)}
              </h2>
              <p className="yj-support text-[#42544C] dark:text-[#9EB0A7] mt-1 yj-measure">
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
                  <Users className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
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
                          ? 'border-[#14453D] dark:border-[#4ADE80] bg-[#D9E8DF]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#4ADE80]'
                          : 'border-[#E4E8E4] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#4ADE80]/50'
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
                        <Check className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 ml-2" />
                      )}
                    </button>
                  )
                )}
              </div>

              {/* Helper tip: Why we ask this */}
              <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                <span>{t('questionnaire.whyAskCategory')}</span>
              </div>
            </div>

            {/* Age Question */}
            <div className="pt-5 border-t border-[#E4E8E4] dark:border-[#24342D]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
                  <span>{t('form.ageTitle')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                  {age !== '' ? `${age} ${t('common.years')}` : eui.notSetAge}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="age-input"
                  type="number"
                  min="18"
                  max="70"
                  placeholder={eui.agePlaceholder}
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setAge(val);
                    setValidationError(null);
                  }}
                  className="w-28 p-2.5 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
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
                  className="w-full accent-[#14453D] dark:accent-[#4ADE80] cursor-pointer"
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
                        ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                        : 'bg-[#FAFAF9] dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
                    }`}
                  >
                    {presetAge} {t('common.years')}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                <span>{t('questionnaire.whyAskAge')}</span>
              </div>
            </div>

            {/* State & Location Question */}
            <div className="pt-5 border-t border-[#E4E8E4] dark:border-[#24342D]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
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
                  const val = e.target.value;
                  setState(val);
                  if (!isDifferentState) {
                    setBusinessState(val);
                    setResidenceState(val);
                  } else {
                    setBusinessState(val);
                  }
                  setValidationError(null);
                }}
                className="w-full p-2.5 text-xs font-semibold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
              >
                <option value="" disabled>
                  {eui.selectStatePlaceholder}
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
                      if (!isDifferentState) {
                        setBusinessState(st);
                        setResidenceState(st);
                      } else {
                        setBusinessState(st);
                      }
                      setValidationError(null);
                    }}
                    className={`px-2 py-0.5 text-[11px] rounded border cursor-pointer ${
                      state === st
                        ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                        : 'bg-[#FAFAF9] dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
                    }`}
                  >
                    {getLocalizedState(st)}
                  </button>
                ))}
              </div>

              {/* Optional District & Interstate Residence Toggle */}
              <div className="mt-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-full sm:w-1/2">
                    <label className="text-[11px] font-semibold text-[#516A5F] dark:text-[#8E9F97] block mb-1">
                      {eui.districtLabel}
                    </label>
                    <input
                      type="text"
                      placeholder={eui.districtPlaceholder}
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full p-2 text-xs border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
                    />
                  </div>

                  <div className="w-full sm:w-1/2 flex items-center pt-2 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1A1C1B] dark:text-[#F0F4F2]">
                      <input
                        type="checkbox"
                        checked={isDifferentState}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsDifferentState(checked);
                          if (!checked) {
                            setResidenceState(state || 'All States & UTs');
                            setBusinessState(state || 'All States & UTs');
                          }
                        }}
                        className="rounded border-[#C2C8C3] text-[#14453D] focus:ring-[#14453D] accent-[#14453D] dark:accent-[#4ADE80]"
                      />
                      <span>
                        {eui.diffStateCheckbox}
                      </span>
                    </label>
                  </div>
                </div>

                {isDifferentState && (
                  <div className="p-3 bg-[#F4F8F6] dark:bg-[#15231B] border border-[#D9E8DF] dark:border-[#203D2E] rounded text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#14453D] dark:text-[#4ADE80]">
                        {eui.domicileStateLabel}
                      </span>
                      <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97]">
                        {eui.domicileQuotaHint}
                      </span>
                    </div>
                    <select
                      value={residenceState}
                      onChange={(e) => setResidenceState(e.target.value)}
                      className="w-full p-2 text-xs font-semibold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
                    >
                      <option value="" disabled>
                        {eui.selectHomeStatePlaceholder}
                      </option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {getLocalizedState(st)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Location: Rural vs Urban */}
              <div className="mt-4 pt-3 border-t border-[#E4E8E4]/60 dark:border-[#24342D]/60">
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
                            ? 'border-[#14453D] dark:border-[#4ADE80] bg-[#D9E8DF]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#4ADE80]'
                            : 'border-[#E4E8E4] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#4ADE80]/50'
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
                          <Check className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                <span>{t('questionnaire.whyAskLocation')}</span>
              </div>
            </div>

            {/* Annual Household Income Question */}
            <div className="pt-5 border-t border-[#E4E8E4] dark:border-[#24342D]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
                  <span>{t('form.incomeTitle')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                  {t('form.incomeFormatted')}{' '}
                  {annualIncome !== '' ? formatCurrency(Number(annualIncome)) : eui.notEnteredIncome}
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
                  placeholder={eui.incomePlaceholder}
                  value={annualIncome}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setAnnualIncome(val);
                    setValidationError(null);
                  }}
                  className="w-full pl-8 pr-3 py-2.5 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
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
                        ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                        : 'bg-[#FAFAF9] dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#E4E8E4] dark:border-[#2A3C34] hover:bg-[#EEEEED] dark:hover:bg-[#1E2924]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#516A5F] dark:text-[#8E9F97]">
                <HelpCircle className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
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
              {eui.planningPrompt}
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
                      setBusinessStageKey(mapLegacyStageToKey(opt.id));
                      if (opt.id === 'new') {
                        setOperationalStatus('NOT_STARTED');
                      } else if (opt.id === 'existing') {
                        setOperationalStatus('OPERATING');
                      } else if (opt.id === 'expanding') {
                        setOperationalStatus('EXPANDING');
                      }
                      setValidationError(null);
                    }}
                    className={`yj-focus-ring group p-4 rounded-[var(--yj-radius-md)] border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#0B5D4B] dark:border-[#4ADE80] bg-[#D9E8DF]/40 dark:bg-[#1A382D] ring-2 ring-[#0B5D4B] dark:ring-[#4ADE80] shadow-[var(--yj-shadow-2)] -translate-y-0.5'
                        : 'border-[#E4E8E4] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:-translate-y-0.5 hover:shadow-[var(--yj-shadow-2)] hover:border-[#0B5D4B]/50 dark:hover:border-[#4ADE80]/50'
                    }`}
                  >
                    <div>
                      <div className="w-9 h-9 rounded-md bg-[#14453D]/10 dark:bg-[#4ADE80]/10 text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center mb-3 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-[#1A1C1B] dark:text-[#F0F4F2] mb-1">
                        {t(opt.labelKey as any)}
                      </h3>
                      <p className="text-xs text-[#516A5F] dark:text-[#8E9F97] leading-relaxed">
                        {t(opt.descKey as any)}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E4E8E4]/60 dark:border-[#24342D]/60 flex items-center justify-between text-xs">
                      <span className="font-medium text-[#14453D] dark:text-[#4ADE80]">
                        {isSelected ? (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-1 font-bold"
                          >
                            <Check className="w-3.5 h-3.5" /> Selected
                          </motion.span>
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

            {/* Optional Lifecycle Sub-stage & Operational Status */}
            {businessStage && (
              <div className="mt-4 p-3.5 bg-[#F4F8F6] dark:bg-[#15231B] border border-[#D9E8DF] dark:border-[#203D2E] rounded space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {eui.lifecyclePhaseLabel}
                    </label>
                    <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97]">
                      {eui.lifecyclePhaseHint}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'IDEA', labelEn: 'Idea / Concept', labelHi: 'विचार / अवधारणा' },
                        { id: 'PRE_LAUNCH', labelEn: 'Pre-launch Setup', labelHi: 'लॉन्च पूर्व तैयारी' },
                        { id: 'NEW_BUSINESS', labelEn: 'Early Setup (< 1 yr)', labelHi: 'नई इकाई (< 1 वर्ष)' },
                        { id: 'EARLY_OPERATION', labelEn: 'Established (1–3 yrs)', labelHi: 'प्रारंभिक संचालन (1–3 वर्ष)' },
                        { id: 'GROWTH', labelEn: 'Scaling / Growth', labelHi: 'विकास / वृद्धि' },
                        { id: 'EXPANSION', labelEn: 'Plant Expansion', labelHi: 'इकाई विस्तार' },
                        { id: 'DISTRESS_OR_RESTRUCTURING', labelEn: 'Revival / Turnaround', labelHi: 'पुनरुद्धार' },
                      ] as { id: BusinessStageKey; labelEn: string; labelHi: string }[]
                    ).map((stage) => {
                      const isSelected = businessStageKey === stage.id;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setBusinessStageKey(isSelected ? null : stage.id);
                            if (!isSelected) {
                              setBusinessStage(mapKeyToLegacyStage(stage.id));
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                              : 'bg-white dark:bg-[#101613] text-[#3F4943] dark:text-[#A0B2A8] border-[#D1D5D2] dark:border-[#2A3C34] hover:border-[#14453D]'
                          }`}
                        >
                          {LIFECYCLE_PHASES_LOCALIZED[stage.id]?.[lang] || stage.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D9E8DF]/60 dark:border-[#203D2E]/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {eui.operationalStatusLabel}
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'OPERATING', labelEn: 'Operating / Active', labelHi: 'सक्रिय रूप से चालू' },
                        { id: 'NOT_STARTED', labelEn: 'Not Yet Started', labelHi: 'अभी शुरू नहीं हुआ' },
                        { id: 'EXPANDING', labelEn: 'Actively Expanding', labelHi: 'विस्तार प्रगति पर' },
                        { id: 'TEMPORARILY_INACTIVE', labelEn: 'Temporarily Inactive', labelHi: 'अस्थायी रूप से निष्क्रिय' },
                      ] as { id: OperationalStatus; labelEn: string; labelHi: string }[]
                    ).map((status) => {
                      const isSelected = operationalStatus === status.id;
                      return (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() => setOperationalStatus(isSelected ? null : status.id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                              : 'bg-white dark:bg-[#101613] text-[#3F4943] dark:text-[#A0B2A8] border-[#D1D5D2] dark:border-[#2A3C34] hover:border-[#14453D]'
                          }`}
                        >
                          {OPERATIONAL_STATUS_LOCALIZED[status.id]?.[lang] || status.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Why we ask this */}
            <div className="mt-4 p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E4E8E4] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97]">
              <HelpCircle className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
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
                        ? 'border-[#14453D] dark:border-[#4ADE80] bg-[#D9E8DF]/40 dark:bg-[#1A382D] ring-2 ring-[#14453D] dark:ring-[#4ADE80]'
                        : 'border-[#E4E8E4] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#4ADE80]/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded shrink-0 ${
                        isSelected
                          ? 'bg-[#14453D] text-white'
                          : 'bg-[#E4E8E4]/60 dark:bg-[#202B26] text-[#14453D] dark:text-[#4ADE80]'
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
                      <Check className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Optional Legal Entity Structure, Sub-Sector & Experience */}
            <div className="mt-5 p-3.5 bg-[#F4F8F6] dark:bg-[#15231B] border border-[#D9E8DF] dark:border-[#203D2E] rounded space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                    {eui.legalEntityLabel}
                  </label>
                  <span className="text-[10px] text-[#516A5F] dark:text-[#8E9F97]">
                    {eui.legalEntityHint}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      'SOLE_PROPRIETORSHIP',
                      'PARTNERSHIP',
                      'LLP',
                      'PRIVATE_LIMITED',
                      'SELF_HELP_GROUP',
                      'COOPERATIVE',
                      'INDIVIDUAL',
                      'INFORMAL_BUSINESS',
                      'NOT_REGISTERED',
                    ] as BusinessEntityType[]
                  ).map((typeKey) => {
                    const isSelected = businessEntityType === typeKey;
                    const entityInfo = BUSINESS_ENTITY_LABELS[typeKey];
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setBusinessEntityType(isSelected ? null : typeKey)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                            : 'bg-white dark:bg-[#101613] text-[#3F4943] dark:text-[#A0B2A8] border-[#D1D5D2] dark:border-[#2A3C34] hover:border-[#14453D]'
                        }`}
                      >
                        {BUSINESS_ENTITY_LOCALIZED[typeKey]?.[lang] || entityInfo.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-[#D9E8DF]/60 dark:border-[#203D2E]/60">
                <div>
                  <label className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] block mb-1">
                    {eui.subSectorLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={eui.subSectorPlaceholder}
                    value={subSector}
                    onChange={(e) => setSubSector(e.target.value)}
                    className="w-full p-2 text-xs border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80] block mb-1">
                    {eui.experienceLabel}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      placeholder="0"
                      value={entrepreneurExperienceYears}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setEntrepreneurExperienceYears(val);
                      }}
                      className="w-20 p-2 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[0, 1, 2, 3, 5, 10].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setEntrepreneurExperienceYears(yr)}
                          className={`px-2 py-1 text-[11px] rounded border cursor-pointer ${
                            entrepreneurExperienceYears === yr
                              ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                              : 'bg-white dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#D1D5D2] dark:border-[#2A3C34]'
                          }`}
                        >
                          {yr}y
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why we ask this */}
            <div className="mt-4 p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E4E8E4] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97]">
              <HelpCircle className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
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
              {eui.fundingPrompt}
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
                        ? 'border-[#14453D] dark:border-[#4ADE80] bg-[#D9E8DF]/40 dark:bg-[#1A382D] ring-2 ring-[#14453D] dark:ring-[#4ADE80]'
                        : 'border-[#E4E8E4] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#4ADE80]/50'
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
                      <Check className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Exact Amount Input */}
            <div className="pt-4 border-t border-[#E4E8E4] dark:border-[#24342D]">
              <label className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-1.5">
                {eui.exactFundingLabel}
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
                    placeholder={eui.exactFundingPlaceholder}
                    value={fundingRequired}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setFundingRequired(val);
                      setValidationError(null);
                    }}
                    className="w-full pl-8 pr-3 py-2.5 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
                  />
                </div>
                <span className="text-xs font-bold text-[#14453D] dark:text-[#4ADE80]">
                  {fundingRequired !== '' ? formatCurrency(Number(fundingRequired)) : ''}
                </span>
              </div>
            </div>

            {/* Phase 4.1 Business Intelligence: Project Cost, Funding Gap & Support Need */}
            <div className="pt-4 border-t border-[#E4E8E4] dark:border-[#24342D] space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                  {eui.costAndGapTitle}
                </h3>
              </div>

              {/* Project Cost & Existing Investment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-1">
                    {eui.totalCostLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#516A5F] dark:text-[#8E9F97] font-bold text-xs">
                      ₹
                    </div>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      placeholder={fundingRequired ? String(fundingRequired) : eui.totalCostPlaceholder}
                      value={totalProjectCost}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setTotalProjectCost(val);
                      }}
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-1">
                    {eui.ownInvestmentLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#516A5F] dark:text-[#8E9F97] font-bold text-xs">
                      ₹
                    </div>
                    <input
                      type="number"
                      step="25000"
                      min="0"
                      placeholder={eui.ownInvestmentPlaceholder}
                      value={existingInvestment}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setExistingInvestment(val);
                      }}
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-[#C2C8C3] dark:border-[#2A3C34] rounded bg-white dark:bg-[#101613] text-[#1A1C1B] dark:text-[#F0F4F2] focus:outline-none focus:border-[#14453D] dark:focus:border-[#4ADE80]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Funding Gap Callout */}
              <div className="p-3 rounded-lg bg-[#F4F8F6] dark:bg-[#16231C] border border-[#D9E8DF] dark:border-[#223F30] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] block">
                    {eui.fundingGapLabel}
                  </span>
                  <span className="text-sm font-extrabold text-[#14453D] dark:text-[#4ADE80]">
                    {formatCurrency(calculatedFundingGap)}
                  </span>
                </div>
                <span className="text-[10px] text-[#516A5F] dark:text-[#9EB0A7] text-right font-medium">
                  {eui.gapFormulaHint}
                </span>
              </div>

              {/* Primary Support Need Selection */}
              <div>
                <label className="text-xs font-bold text-[#1A1C1B] dark:text-[#F0F4F2] block mb-1.5">
                  {eui.primaryNeedLabel}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'CAPITAL', labelEn: 'Seed Capital', labelHi: 'प्रारंभिक पूंजी' },
                      { id: 'WORKING_CAPITAL', labelEn: 'Working Capital', labelHi: 'कार्यशील पूंजी' },
                      { id: 'EQUIPMENT', labelEn: 'Machinery / Tools', labelHi: 'मशीनरी व उपकरण' },
                      { id: 'SUBSIDY', labelEn: 'Govt Subsidy', labelHi: 'सरकारी सब्सिडी' },
                      { id: 'INFRASTRUCTURE', labelEn: 'Work Shed / Infra', labelHi: 'कार्यशाला' },
                      { id: 'SKILL_DEVELOPMENT', labelEn: 'Skill Training', labelHi: 'कौशल प्रशिक्षण' },
                      { id: 'MARKET_ACCESS', labelEn: 'Market Access', labelHi: 'बाजार संपर्क' },
                      { id: 'COMPLIANCE_AND_REGISTRATION', labelEn: 'Compliance / Licenses', labelHi: 'अनुपालन व लाइसेंस' },
                      { id: 'EXPORT_ASSISTANCE', labelEn: 'Export Assistance', labelHi: 'निर्यात सहायता' },
                    ] as { id: SupportNeedType; labelEn: string; labelHi: string }[]
                  ).map((need) => {
                    const isSelected = primarySupportNeed === need.id;
                    return (
                      <button
                        key={need.id}
                        type="button"
                        onClick={() =>
                          handleSelectPrimaryNeed(isSelected ? null : need.id)
                        }
                        className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80] shadow-xs'
                            : 'bg-white dark:bg-[#101613] text-[#3F4943] dark:text-[#A0B2A8] border-[#D1D5D2] dark:border-[#2A3C34] hover:border-[#14453D]'
                        }`}
                      >
                        {SUPPORT_NEEDS_LOCALIZED[need.id]?.[lang] || need.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>
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
                        if (reg.id === 'unregistered') {
                          setRegistrationStatus('NOT_REGISTERED');
                        } else {
                          setRegistrationStatus('REGISTERED');
                        }
                        setValidationError(null);
                      }}
                      className={`p-3 rounded border text-left cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-[#14453D] dark:border-[#4ADE80] bg-[#D9E8DF]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#4ADE80]'
                          : 'border-[#E4E8E4] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#4ADE80]/50'
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
                        <Check className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Optional Registration Status override (e.g., In Process) */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#516A5F] dark:text-[#8E9F97]">
                  {eui.regStatusLabel}
                </span>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 'REGISTERED', labelEn: 'Registered', labelHi: 'पंजीकृत' },
                      { id: 'IN_PROCESS', labelEn: 'In Process / Applied', labelHi: 'प्रक्रियाधीन' },
                      { id: 'NOT_REGISTERED', labelEn: 'Unregistered', labelHi: 'अपंजीकृत' },
                    ] as { id: RegistrationStatus; labelEn: string; labelHi: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setRegistrationStatus(st.id)}
                      className={`px-2 py-0.5 text-[11px] rounded border cursor-pointer ${
                        registrationStatus === st.id
                          ? 'bg-[#14453D] dark:bg-[#1C5045] text-white border-[#14453D] dark:border-[#4ADE80]'
                          : 'bg-white dark:bg-[#101613] text-[#516A5F] dark:text-[#8E9F97] border-[#D1D5D2] dark:border-[#2A3C34]'
                      }`}
                    >
                      {REGISTRATION_STATUS_LOCALIZED[st.id]?.[lang] || st.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Turnover Question */}
            <div className="pt-5 border-t border-[#E4E8E4] dark:border-[#24342D]">
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
                          ? 'border-[#14453D] dark:border-[#4ADE80] bg-[#D9E8DF]/40 dark:bg-[#1A382D] ring-1 ring-[#14453D] dark:ring-[#4ADE80]'
                          : 'border-[#E4E8E4] dark:border-[#2A3C34] bg-[#FAFAF9] dark:bg-[#101613] hover:border-[#14453D]/50 dark:hover:border-[#4ADE80]/50'
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
                        <Check className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Why we ask this */}
            <div className="mt-3 p-3 bg-[#FAFAF9] dark:bg-[#101613] rounded border border-[#E4E8E4] dark:border-[#24342D] flex items-start gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97]">
              <HelpCircle className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
              <span>{t('questionnaire.whyAskExistingBiz')}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STAGE 6: REVIEW & SUMMARY */}
        {/* ------------------------------------------------------------- */}
        {currentStage.id === 'review' && (
          <div className="space-y-5">
            <div className="p-3 bg-[#D9E8DF]/40 dark:bg-[#1A382D]/40 border border-[#B2CDBF] dark:border-[#285743] rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#1E6A50] dark:text-[#4ADE80]" />
                <span className="text-xs sm:text-sm font-bold text-[#14453D] dark:text-[#D9E8DF]">
                  {t('questionnaire.reviewTitle')}
                </span>
              </div>
              <span className="text-xs font-extrabold text-[#14453D] dark:text-[#4ADE80]">
                ~{liveIndicativeMatches} {t('results.tabAll')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Personal & Demographic */}
              <div className="p-4 rounded border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#101613]">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4E8E4] dark:border-[#24342D] mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('questionnaire.stageAboutShort')}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleJumpToStage('about_you')}
                    className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{t('questionnaire.editBtn')}</span>
                  </button>
                </div>

                <dl className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">{t('factors.category')}:</dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {category ? getLocalizedCategory(category) : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">{t('factors.age')}:</dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {age !== '' ? `${age} ${t('common.years')}` : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">{t('factors.state')}:</dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {state ? getLocalizedState(state) : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">{t('factors.income')}:</dt>
                    <dd className="font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {annualIncome !== '' ? formatCurrency(Number(annualIncome)) : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">
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
              <div className="p-4 rounded border border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#101613]">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4E8E4] dark:border-[#24342D] mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[#4ADE80] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>
                      {t('questionnaire.stageBizStageShort')} & {t('questionnaire.stageFundingShort')}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleJumpToStage('business_stage')}
                    className="text-[11px] font-bold text-[#14453D] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{t('questionnaire.editBtn')}</span>
                  </button>
                </div>

                <dl className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">
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
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">
                      {t('factors.businessType')}:
                    </dt>
                    <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                      {businessType
                        ? getLocalizedBusinessType(businessType)
                        : t('questionnaire.notSpecified')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#516A5F] dark:text-[#8E9F97]">
                      {t('questionnaire.fundingLabel')}:
                    </dt>
                    <dd className="font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {fundingRequired !== ''
                        ? formatCurrency(Number(fundingRequired))
                        : t('questionnaire.notSpecified')}
                    </dd>
                  </div>

                  {totalProjectCost !== '' && (
                    <div className="flex justify-between">
                      <dt className="text-[#516A5F] dark:text-[#8E9F97]">
                        {eui.reviewProjectCostGap}
                      </dt>
                      <dd className="font-bold text-[#14453D] dark:text-[#4ADE80]">
                        {formatCurrency(Number(totalProjectCost))} (Gap: {formatCurrency(calculatedFundingGap)})
                      </dd>
                    </div>
                  )}

                  {primarySupportNeed && (
                    <div className="flex justify-between">
                      <dt className="text-[#516A5F] dark:text-[#8E9F97]">
                        {eui.reviewPrimaryNeed}
                      </dt>
                      <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {SUPPORT_NEEDS_LOCALIZED[primarySupportNeed]?.[lang] || primarySupportNeed.replace(/_/g, " ")}
                      </dd>
                    </div>
                  )}

                  {businessEntityType && (
                    <div className="flex justify-between">
                      <dt className="text-[#516A5F] dark:text-[#8E9F97]">
                        {eui.reviewEntityStructure}
                      </dt>
                      <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {BUSINESS_ENTITY_LOCALIZED[businessEntityType]?.[lang] || BUSINESS_ENTITY_LABELS[businessEntityType]?.en || businessEntityType}
                      </dd>
                    </div>
                  )}

                  {subSector && (
                    <div className="flex justify-between">
                      <dt className="text-[#516A5F] dark:text-[#8E9F97]">
                        {eui.reviewSubSector}
                      </dt>
                      <dd className="font-medium text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {subSector}
                      </dd>
                    </div>
                  )}

                  {businessStage !== 'new' && (
                    <>
                      <div className="flex justify-between pt-1 border-t border-[#E4E8E4]/60 dark:border-[#24342D]/60">
                        <dt className="text-[#516A5F] dark:text-[#8E9F97]">
                          {t('questionnaire.registrationLabel')}:
                        </dt>
                        <dd className="font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
                          {businessRegistration ? businessRegistration.toUpperCase() : t('questionnaire.notSpecified')}
                          {registrationStatus ? ` (${registrationStatus})` : ''}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#516A5F] dark:text-[#8E9F97]">
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
        <div className="mt-8 pt-5 border-t border-[#E4E8E4] dark:border-[#24342D] flex flex-col sm:flex-row items-center justify-between gap-3">
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
            <ArrowFillButton
              id="stage-next-btn"
              onClick={handleNext}
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
            >
              {t('questionnaire.nextBtn')}
            </ArrowFillButton>
          ) : (
            <ArrowFillButton
              id="form-submit-btn"
              onClick={handleFinalSubmit}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              {t('questionnaire.submitReviewBtn')}
            </ArrowFillButton>
          )}
        </div>
      </div>

      {/* Trust & Transparency Footnote */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#516A5F] dark:text-[#8E9F97] text-center">
        <ShieldCheck className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80]" />
        <span>{t('form.trustNote')}</span>
      </div>
    </div>
  );
};
