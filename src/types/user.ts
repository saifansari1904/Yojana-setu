import type {
  EnterpriseType,
  Sector,
  EntrepreneurType,
} from '../data/schemeTaxonomy';
import type {
  BusinessStageKey,
  BusinessEntityType,
  RegistrationStatus,
  OperationalStatus,
  SupportNeedType,
  BusinessProfile,
  BusinessNeedProfile,
} from './business';
import type {
  BusinessRegistrationRecord,
  BusinessFormalizationStatus,
} from './registration';

export type SocialCategory = 'SC' | 'ST' | 'OBC' | 'General' | 'Woman' | 'Minority';

export type BusinessType =
  | 'trading'
  | 'manufacturing'
  | 'services'
  | 'agri'
  | 'handicraft'
  | 'food'
  | 'tech';

export type BusinessStage = 'new' | 'existing' | 'expanding' | 'idea' | 'scaling';

export type RuralUrban = 'rural' | 'urban';

export type FundingRangeId = 'under_1l' | '1l_5l' | '5l_10l' | '10l_25l' | 'above_25l';

export type BusinessRegistrationType = 'udyam' | 'gst' | 'local_trade' | 'unregistered';

export type TurnoverRangeId = 'under_5l' | '5l_25l' | '25l_1cr' | 'above_1cr';

export interface UserProfile {
  // Core Demographics
  category: SocialCategory;
  age: number;
  annualIncome: number;
  businessType: BusinessType;
  state: string;
  district?: string;
  gender?: 'male' | 'female' | 'other';
  applicantName?: string;
  photoUrl?: string;
  isRegistered?: boolean;
  hasExistingBusiness?: boolean;

  // Entrepreneur-Centric Adaptive Fields
  businessStage?: BusinessStage;
  sector?: Sector;
  entrepreneurType?: EntrepreneurType;
  fundingRequired?: number;
  investmentAmount?: number;
  fundingRangeId?: FundingRangeId;
  ruralUrban?: RuralUrban;
  enterpriseType?: EnterpriseType;
  existingTurnover?: number;
  turnoverRangeId?: TurnoverRangeId;
  businessRegistration?: BusinessRegistrationType;

  // Business Registrations & Compliance control center (per-record model).
  // Legacy fields above are DERIVED from these (see registrationModel.ts).
  businessFormalization?: BusinessFormalizationStatus;
  businessRegistrations?: BusinessRegistrationRecord[];

  // Phase 4.1 — Business Profile & Business Need Intelligence Fields
  businessIdea?: string;
  businessName?: string;
  businessStageKey?: BusinessStageKey;
  businessEntityType?: BusinessEntityType;
  residenceState?: string;
  businessState?: string;
  isInterstate?: boolean;
  operationalStatus?: OperationalStatus;
  registrationStatus?: RegistrationStatus;
  entrepreneurExperienceYears?: number;
  totalProjectCost?: number;
  existingInvestment?: number;
  fundingGap?: number;
  primarySupportNeed?: SupportNeedType;
  secondarySupportNeeds?: SupportNeedType[];
  subSector?: string;

  // Complete Structured Business Profiles (Cached / Attached)
  businessProfile?: BusinessProfile;
  businessNeedProfile?: BusinessNeedProfile;
}
