import {
  BusinessType,
  BusinessStage,
  FundingRangeId,
  RuralUrban,
  SocialCategory,
  UserProfile,
  BusinessRegistrationType,
  TurnoverRangeId,
} from '../types';


interface QuestionnaireStageConfig {
  id: 'about_you' | 'business_stage' | 'business_type' | 'funding' | 'existing_biz' | 'review';
  stepNumber: number;
  stageTitleKey: string;
  stageShortKey: string;
  stageDescKey: string;
  showWhen?: (profile: Partial<UserProfile>) => boolean;
}

export const QUESTIONNAIRE_STAGES: QuestionnaireStageConfig[] = [
  {
    id: 'about_you',
    stepNumber: 1,
    stageTitleKey: 'questionnaire.stageAboutTitle',
    stageShortKey: 'questionnaire.stageAboutShort',
    stageDescKey: 'questionnaire.stageAboutDesc',
  },
  {
    id: 'business_stage',
    stepNumber: 2,
    stageTitleKey: 'questionnaire.stageBizStageTitle',
    stageShortKey: 'questionnaire.stageBizStageShort',
    stageDescKey: 'questionnaire.stageBizStageDesc',
  },
  {
    id: 'business_type',
    stepNumber: 3,
    stageTitleKey: 'questionnaire.stageBizTypeTitle',
    stageShortKey: 'questionnaire.stageBizTypeShort',
    stageDescKey: 'questionnaire.stageBizTypeDesc',
  },
  {
    id: 'funding',
    stepNumber: 4,
    stageTitleKey: 'questionnaire.stageFundingTitle',
    stageShortKey: 'questionnaire.stageFundingShort',
    stageDescKey: 'questionnaire.stageFundingDesc',
  },
  {
    id: 'existing_biz',
    stepNumber: 5,
    stageTitleKey: 'questionnaire.stageExistingTitle',
    stageShortKey: 'questionnaire.stageExistingShort',
    stageDescKey: 'questionnaire.stageExistingDesc',
    // Adaptive condition: Only show if running or expanding an existing business
    showWhen: (profile: Partial<UserProfile>) =>
      profile.businessStage === 'existing' || profile.businessStage === 'expanding',
  },
  {
    id: 'review',
    stepNumber: 6,
    stageTitleKey: 'questionnaire.stageReviewTitle',
    stageShortKey: 'questionnaire.stageReviewShort',
    stageDescKey: 'questionnaire.stageReviewDesc',
  },
];

export const BUSINESS_STAGE_OPTIONS: {
  id: BusinessStage;
  labelKey: string;
  descKey: string;
}[] = [
  {
    id: 'new',
    labelKey: 'questionnaire.stageNewBizLabel',
    descKey: 'questionnaire.stageNewBizDesc',
  },
  {
    id: 'existing',
    labelKey: 'questionnaire.stageExistingBizLabel',
    descKey: 'questionnaire.stageExistingBizDesc',
  },
  {
    id: 'expanding',
    labelKey: 'questionnaire.stageExpandingBizLabel',
    descKey: 'questionnaire.stageExpandingBizDesc',
  },
];

export const FUNDING_RANGE_OPTIONS: {
  id: FundingRangeId;
  labelKey: string;
  descKey: string;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
}[] = [
  {
    id: 'under_1l',
    labelKey: 'questionnaire.fundingUnder1L',
    descKey: 'questionnaire.fundingUnder1LDesc',
    minAmount: 10000,
    maxAmount: 100000,
    defaultAmount: 50000,
  },
  {
    id: '1l_5l',
    labelKey: 'questionnaire.funding1Lto5L',
    descKey: 'questionnaire.funding1Lto5LDesc',
    minAmount: 100000,
    maxAmount: 500000,
    defaultAmount: 300000,
  },
  {
    id: '5l_10l',
    labelKey: 'questionnaire.funding5Lto10L',
    descKey: 'questionnaire.funding5Lto10LDesc',
    minAmount: 500000,
    maxAmount: 1000000,
    defaultAmount: 800000,
  },
  {
    id: '10l_25l',
    labelKey: 'questionnaire.funding10Lto25L',
    descKey: 'questionnaire.funding10Lto25LDesc',
    minAmount: 1000000,
    maxAmount: 2500000,
    defaultAmount: 1500000,
  },
  {
    id: 'above_25l',
    labelKey: 'questionnaire.fundingAbove25L',
    descKey: 'questionnaire.fundingAbove25LDesc',
    minAmount: 2500000,
    maxAmount: 10000000,
    defaultAmount: 5000000,
  },
];

export const BUSINESS_REGISTRATION_OPTIONS: {
  id: BusinessRegistrationType;
  labelKey: string;
  descKey: string;
}[] = [
  {
    id: 'udyam',
    labelKey: 'questionnaire.regUdyamLabel',
    descKey: 'questionnaire.regUdyamDesc',
  },
  {
    id: 'gst',
    labelKey: 'questionnaire.regGstLabel',
    descKey: 'questionnaire.regGstDesc',
  },
  {
    id: 'local_trade',
    labelKey: 'questionnaire.regLocalLabel',
    descKey: 'questionnaire.regLocalDesc',
  },
  {
    id: 'unregistered',
    labelKey: 'questionnaire.regUnregisteredLabel',
    descKey: 'questionnaire.regUnregisteredDesc',
  },
];

export const TURNOVER_RANGE_OPTIONS: {
  id: TurnoverRangeId;
  labelKey: string;
  descKey: string;
  approxValue: number;
}[] = [
  {
    id: 'under_5l',
    labelKey: 'questionnaire.turnoverUnder5L',
    descKey: 'questionnaire.turnoverUnder5LDesc',
    approxValue: 300000,
  },
  {
    id: '5l_25l',
    labelKey: 'questionnaire.turnover5Lto25L',
    descKey: 'questionnaire.turnover5Lto25LDesc',
    approxValue: 1200000,
  },
  {
    id: '25l_1cr',
    labelKey: 'questionnaire.turnover25Lto1Cr',
    descKey: 'questionnaire.turnover25Lto1CrDesc',
    approxValue: 5000000,
  },
  {
    id: 'above_1cr',
    labelKey: 'questionnaire.turnoverAbove1Cr',
    descKey: 'questionnaire.turnoverAbove1CrDesc',
    approxValue: 15000000,
  },
];

export const RURAL_URBAN_OPTIONS: {
  id: RuralUrban;
  labelKey: string;
  descKey: string;
}[] = [
  {
    id: 'rural',
    labelKey: 'questionnaire.ruralLabel',
    descKey: 'questionnaire.ruralDesc',
  },
  {
    id: 'urban',
    labelKey: 'questionnaire.urbanLabel',
    descKey: 'questionnaire.urbanDesc',
  },
];
