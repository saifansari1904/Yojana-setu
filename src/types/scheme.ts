import type {
  SocialCategory,
  BusinessType,
  BusinessStage,
} from './user';

import type {
  EnterpriseType,
  GenderTargeting,
  RuralUrbanApplicability,
  Sector,
  FundingPurpose,
  RegistrationRequirement,
  VerificationStatus,
  SourceType,
  ApplicationMode,
  EntrepreneurType,
  SchemeType,
  SchemeScope,
  NormalizedSchemeCategory,
  SchemeVerificationStatus,
} from '../data/schemeTaxonomy';

import type {
  SchemeTrustProfile,
  TrustVerificationStatus,
  FreshnessStatus,
  ConfidenceLevel,
  EntrepreneurRelevance,
  UrlSafetyClassification,
  ReviewQueueItem,
  DataQualityAuditReport,
} from './trust';

export type {
  SchemeScope,
  NormalizedSchemeCategory,
  SchemeVerificationStatus,
  SchemeTrustProfile,
  TrustVerificationStatus,
  FreshnessStatus,
  ConfidenceLevel,
  EntrepreneurRelevance,
  UrlSafetyClassification,
  ReviewQueueItem,
  DataQualityAuditReport,
};

export type SchemeFactorKey = 'category' | 'businessType' | 'income' | 'age' | 'state';

export interface SchemeSourceProvenance {
  sourceName: string;
  sourceType: SourceType;
  officialSourceUrl: string;
  isOfficialGovernmentSource: boolean;
  priorityLevel: 1 | 2 | 3 | 4 | 5; // 1: Central Govt, 2: State Govt, 3: Dept/Agency, 4: Implementing Agency, 5: Aggregator/Secondary
  verificationStatus: SchemeVerificationStatus;
  lastVerifiedDate: string;
  sourceNotes?: string;
}

interface SchemeIdentity {
  id: string;
  schemeName: string;
  shortCode: string;
  officialSchemeIdentifier?: string;
  sponsoringMinistry: string;
  department?: string;
  schemeType: SchemeType;
  description: string;
  benefitSummary: string;
}

interface SchemeTargeting {
  socialCategory: SocialCategory[];
  genderTargeting: GenderTargeting;
  businessType: BusinessType[];
  businessStage: BusinessStage[];
  enterpriseType: EnterpriseType[];
  ruralUrbanApplicability: RuralUrbanApplicability;
  stateApplicability: string[]; // empty means 'All States & UTs'
  districtApplicability?: string[];
  sector: Sector[];
  entrepreneurType: EntrepreneurType[];
}

interface SchemeFinancialInfo {
  minFunding: number;
  maxFunding: number;
  fundingRangeText: string;
  subsidyPercentage?: number;
  subsidyCap?: number;
  interestRate: number;
  tenureYears: number;
  moratoriumMonths: number;
  marginContribution?: string;
  creditGuarantee?: {
    covered: boolean;
    percentage?: number;
    provider?: string;
  };
  grantAmount?: number;
  otherFinancialBenefits?: string[];
}

interface SchemeStructuredEligibility {
  minAge: number;
  maxAge: number;
  maxAnnualIncomeCap: number; // 0 for no ceiling
  targetCategories: SocialCategory[];
  targetBusinessTypes: BusinessType[];
  targetBusinessStages?: BusinessStage[];
  applicableStates: string[];
  genderTargeting?: GenderTargeting;
  registrationRequirement: RegistrationRequirement;
  enterpriseSize?: EnterpriseType[];
  turnoverLimit?: {
    maxTurnover?: number;
    minTurnover?: number;
  };
  investmentLimit?: {
    maxPlantMachinery?: number;
  };
  employmentRequirement?: string;
  mandatoryCriteria: SchemeFactorKey[];
  nonMandatoryCriteria?: SchemeFactorKey[];
  otherMandatoryCriteria?: string[];
}

interface SchemeApplicationInfo {
  requiredDocuments: string[];
  applicationMode: ApplicationMode;
  officialApplicationUrl: string;
  applicationProcess?: string[];
  nodalAgency?: string;
  bankChannelInformation?: string;
  helplineInformation?: string;
}

interface SchemeDataGovernance {
  officialSourceUrl: string;
  sourceName: string;
  sourceType: SourceType;
  lastVerifiedDate: string;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  dataVersion: string;
  lastUpdatedDate: string;
  sourceNotes?: string;
}

interface SchemeIntelligence {
  identity: SchemeIdentity;
  targeting: SchemeTargeting;
  financial: SchemeFinancialInfo;
  eligibility: SchemeStructuredEligibility;
  application: SchemeApplicationInfo;
  governance: SchemeDataGovernance;
}

export interface Scheme {
  id: string;
  name: string;
  shortCode: string;
  sponsoringMinistry: string;
  department?: string;
  schemeType: SchemeType;
  benefitSummary: string;
  fundingRangeText: string;
  minAmount: number;
  maxAmount: number;
  subsidyRatePercent?: number;
  subsidyCap?: number;
  baseInterestRate: number;
  standardTenureYears: number;
  moratoriumPeriodMonths: number;
  targetCategories: SocialCategory[];
  minAge: number;
  maxAge: number;
  maxAnnualIncomeCap: number; // 0 for no limit
  targetBusinessTypes: BusinessType[];
  applicableStates: string[]; // empty means 'All States & UTs'
  requiredDocuments: string[];
  officialPortalUrl: string;
  lastVerifiedDate: string;
  applicationMode: ApplicationMode;
  isWomenSpecific?: boolean;
  isMinoritySpecific?: boolean;
  isScStSpecific?: boolean;
  purpose?: string;
  tags?: string[];
  fundingPurpose?: string;
  mandatoryCriteria?: SchemeFactorKey[];

  // Phase 2 — Scope, Normalized Categories & Source Provenance
  scope?: SchemeScope;
  categories?: NormalizedSchemeCategory[];
  sourceProvenance?: SchemeSourceProvenance;

  // Scheme Intelligence Model (Extended Foundation)
  officialSchemeIdentifier?: string;
  description?: string;
  intelligence?: SchemeIntelligence;

  // Phase 2.5 — Government Data Trust Model
  trustProfile?: SchemeTrustProfile;

  // Candidate Scheme Discovery & Provenance Metadata
  relevanceTier?: string;
  isCandidateScheme?: boolean;
  candidateSourceFile?: string;
  rawCandidateId?: string;
}
