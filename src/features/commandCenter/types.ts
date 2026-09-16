/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SocialCategory = 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'MINORITY';
export type BusinessType = 'MANUFACTURING' | 'SERVICE' | 'TRADING';
export type BusinessStage = 'IDEA' | 'REGISTRATION' | 'FUNDING' | 'MARKET_ACCESS' | 'EXPANSION';
export type SupportCategory = 'Funding' | 'Registration' | 'Skill Development' | 'Infrastructure' | 'Market Access';

export type PortalDomainClass = 'VERIFIED_OFFICIAL' | 'KNOWN_NODAL' | 'UNVERIFIED_EXTERNAL' | 'INVALID';
export type FreshnessStatus = 'FRESH' | 'RECENTLY_VERIFIED' | 'NEEDS_VERIFICATION';

export type ActionPriority = 'ACTION_NOW' | 'HIGH_PRIORITY' | 'REVIEW' | 'INFORMATION_NEEDED' | 'LOW_PRIORITY';
export type OpportunityLifecycle = 'DISCOVERED' | 'SAVED' | 'REVIEWED' | 'PREPARING' | 'READY_TO_APPLY' | 'APPLIED' | 'TRACKING' | 'COMPLETED';

export type ApplicationStatus = 'interested' | 'preparing' | 'docs-ready' | 'applied' | 'approved';

export type DocumentType = 'REUSABLE' | 'SCHEME_SPECIFIC';
export type DocumentStatus = 'PREPARED' | 'NEED_PREPARATION' | 'UNKNOWN' | 'NOT_REQUIRED';

export type InstructionType = 'VERIFIED_SCHEME_INSTRUCTION' | 'GENERAL_GUIDANCE' | 'UNKNOWN';

export interface UserProfile {
  id?: string;
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  socialCategory?: SocialCategory;
  state?: string;
  district?: string;
  businessName?: string;
  businessType?: BusinessType;
  businessStage?: BusinessStage;
  annualIncome?: number; // in INR
  investmentAmount?: number; // in INR
  turnover?: number; // in INR
  hasUdyam?: boolean;
  hasGst?: boolean;
  isDifferentlyAbled?: boolean;
  isExServiceman?: boolean;
}

export interface SchemeDocumentRequirement {
  id: string;
  name: string;
  nameHi: string;
  type: DocumentType;
  description: string;
  descriptionHi: string;
  isMandatory: boolean;
  verificationSource?: string;
}

export interface SchemeInstruction {
  step: number;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  instructionType: InstructionType;
  officialReference?: string;
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  nameHi: string;
  department: string;
  departmentHi: string;
  ministry: string;
  level: 'central' | 'state';
  state?: string; // empty if central
  description: string;
  descriptionHi: string;
  objective: string;
  objectiveHi: string;
  targetAudience: string[];
  eligibleCategories: SocialCategory[];
  eligibleBusinessTypes: BusinessType[];
  minAge?: number;
  maxAge?: number;
  maxIncome?: number;
  maxInvestment?: number;
  subsidyPercentage?: number;
  loanLimit?: number; // in INR
  supportCategories: SupportCategory[];
  officialUrl: string;
  officialPortalUrl?: string;
  portalDomainClass: PortalDomainClass;
  lastAuditedDate: string; // ISO format YYYY-MM-DD
  freshnessStatus: FreshnessStatus;
  requiredDocuments: SchemeDocumentRequirement[];
  applicationInstructions: SchemeInstruction[];
  applicationChannel: 'ONLINE_PORTAL' | 'OFFICIAL_BANK_NODAL' | 'DISTRICT_INDUSTRY_CENTRE';
}

export interface EligibilityCriterion {
  criterion: string;
  criterionHi: string;
  status: 'MET' | 'UNMET' | 'UNKNOWN';
  explanation: string;
  explanationHi: string;
  weight: number;
}

export interface Phase3MatchResult {
  schemeId: string;
  totalMatchScore: number; // 0 to 100
  socialCategoryScore: number; // weight: 30
  businessTypeScore: number; // weight: 25
  incomeScore: number; // weight: 20
  ageScore: number; // weight: 15
  stateScore: number; // weight: 10
  dimensionScores: {
    socialCategory: number;
    businessType: number;
    income: number;
    age: number;
    state: number;
  };
  isEligible: boolean;
  hasBlocker: boolean;
  unknownCriteriaCount: number;
  criteria: EligibilityCriterion[];
  financialFit: {
    fitsBudget: boolean;
    reason: string;
    reasonHi: string;
  };
}

export interface OpportunityItem {
  scheme: Scheme;
  matchResult: Phase3MatchResult;
  actionPriority: ActionPriority;
  lifecycleStage: OpportunityLifecycle;
  applicationStatus?: ApplicationStatus;
  isSaved: boolean;
  documentReadiness: {
    total: number;
    prepared: number;
    needsPreparation: number;
    unknown: number;
    isReady: boolean;
  };
  nextBestAction: {
    actionText: string;
    actionTextHi: string;
    reasonText: string;
    reasonTextHi: string;
    targetWorkspace: 'WORKSPACE' | 'TRACKER' | 'PROFILE' | 'OFFICIAL_PORTAL';
  };
  whyThisScheme: {
    points: { text: string; textHi: string; type: 'positive' | 'neutral' | 'attention' }[];
  };
}

export interface ApplicationRecord {
  id: string;
  schemeId: string;
  status: ApplicationStatus;
  appliedDate?: string | null;
  appliedAt?: string | null;
  portalOpenedAt?: string;
  portalVisited?: boolean;
  submissionConfirmed?: boolean;
  acknowledgementNumber?: string;
  notes?: string;
  updatedAt: string;
}

export interface UserDocumentState {
  documentId?: string;
  status: DocumentStatus;
  updatedAt: string;
}

export interface FollowUpItem {
  id: string;
  schemeId: string;
  schemeName: string;
  schemeNameHi?: string;
  title: string;
  titleHi: string;
  date: string;
  type: 'USER_REMINDER' | 'OFFICIAL_DEADLINE';
  completed: boolean;
}

export interface DashboardInsights {
  currentBusinessStage: BusinessStage;
  businessStageName: string;
  businessStageNameHi: string;
  profileCompleteness: {
    percentage: number;
    missingFields: string[];
    missingFieldsHi: string[];
    isComplete: boolean;
  };
  topOpportunity: OpportunityItem | null;
  priorityOpportunities: OpportunityItem[];
  allOpportunities: OpportunityItem[];
  nextBestAction: {
    title: string;
    titleHi: string;
    description: string;
    descriptionHi: string;
    actionLabel: string;
    actionLabelHi: string;
    schemeId?: string;
    targetWorkspace: 'WORKSPACE' | 'TRACKER' | 'PROFILE' | 'OFFICIAL_PORTAL';
  } | null;
  applicationSummary: {
    total: number;
    readyToApply: number;
    preparing: number;
    applied: number;
    approved: number;
    records: { scheme: Scheme; record: ApplicationRecord }[];
  };
  documentSummary: {
    prepared: number;
    needPreparation: number;
    unknown: number;
    reusable: { id: string; name: string; nameHi: string; status: DocumentStatus }[];
    applicationSpecific: { id: string; name: string; nameHi: string; schemeCode?: string; status: DocumentStatus }[];
  };
  supportSummary: {
    categoryCounts: Record<SupportCategory, number>;
    currentStagePathways: {
      stage: BusinessStage;
      schemesCount: number;
      pathwaysCount: number;
      applicationsUnderwayCount: number;
    };
  };
  followUpSummary: {
    upcoming: FollowUpItem[];
    totalCount: number;
  };
  trustSummary: {
    visibleSchemesCount: number;
    recentlyVerifiedCount: number;
    recentlyVerifiedPercentage: number;
    officialSourcesCount: number;
    needsVerificationCount: number;
    nodalSourcesCount: number;
  };
  hasProfile: boolean;
  hasMatches: boolean;
}
