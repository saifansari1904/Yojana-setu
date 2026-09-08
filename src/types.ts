export type SocialCategory = 'SC' | 'ST' | 'OBC' | 'General' | 'Woman' | 'Minority';

export type BusinessType =
  | 'trading'
  | 'manufacturing'
  | 'services'
  | 'agri'
  | 'handicraft'
  | 'food'
  | 'tech';

export type BusinessStage = 'new' | 'existing' | 'expanding';
export type RuralUrban = 'rural' | 'urban';
export type FundingRangeId = 'under_1l' | '1l_5l' | '5l_10l' | '10l_25l' | 'above_25l';
export type BusinessRegistrationType = 'udyam' | 'gst' | 'local_trade' | 'unregistered';
export type TurnoverRangeId = 'under_5l' | '5l_25l' | '25l_1cr' | 'above_1cr';

export interface UserProfile {
  category: SocialCategory;
  age: number;
  annualIncome: number;
  businessType: BusinessType;
  state: string;
  applicantName?: string;
  isRegistered?: boolean;

  // Entrepreneur-Centric Adaptive Fields
  businessStage?: BusinessStage;
  fundingRequired?: number;
  fundingRangeId?: FundingRangeId;
  ruralUrban?: RuralUrban;
  enterpriseType?: 'micro' | 'small' | 'medium';
  existingTurnover?: number;
  turnoverRangeId?: TurnoverRangeId;
  businessRegistration?: BusinessRegistrationType;
}

export type MatchStatus = 'eligible' | 'near-match' | 'low-match';

export type SchemeFactorKey = 'category' | 'businessType' | 'income' | 'age' | 'state';

export interface SchemeRuleBreakdown {
  factorKey: SchemeFactorKey;
  factorLabel: string;
  userValue: string;
  statutoryRequirement: string;
  matched: boolean;
  explanation: string;
  severity?: 'critical' | 'moderate' | 'info';
}

export interface Scheme {
  id: string;
  name: string;
  shortCode: string;
  sponsoringMinistry: string;
  department?: string;
  schemeType: 'Loan + Subsidy' | 'Grant' | 'Concessional Loan' | 'Credit Guarantee' | 'Venture Capital';
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
  applicationMode: 'Online via Portal' | 'Nodal Bank Branch' | 'District Industry Center (DIC)';
  isWomenSpecific?: boolean;
  isMinoritySpecific?: boolean;
  isScStSpecific?: boolean;
  purpose?: string;
  tags?: string[];
  fundingPurpose?: string;
  mandatoryCriteria?: SchemeFactorKey[];
}

export interface PrimaryGap {
  factorKey: SchemeFactorKey;
  factorLabel: string;
  userValue: string;
  statutoryRequirement: string;
  explanation: string;
  gapDistance?: string;
  isActionable?: boolean;
}

export interface AlternativeRecommendation {
  scheme: Scheme;
  matchPercentage: number;
  matchStatus: MatchStatus;
  reason: string;
}

export interface MatchResult {
  scheme: Scheme;
  matchPercentage: number;
  breakdown: SchemeRuleBreakdown[];
  plainLanguageExplanation: string;
  isEligible: boolean;
  matchStatus: MatchStatus;
  mandatoryCriteriaSatisfied: boolean;
  gapSummary?: string;
  matchedCount: number;
  totalFactorsCount: number;
  unmetCriteria: SchemeRuleBreakdown[];
  matchedCriteria: SchemeRuleBreakdown[];
  primaryGap?: PrimaryGap;
  recommendedAlternatives?: AlternativeRecommendation[];
}

export type ActiveScreen =
  | 'login'
  | 'form'
  | 'results'
  | 'alternatives';

export interface RepaymentCalculation {
  principalAmount: number;
  interestRate: number;
  tenureYears: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  principalPercentage: number;
  interestPercentage: number;
  subsidyAmount: number;
  effectivePrincipal: number;
  subsidizedEmi: number;
  monthlySavings: number;
}
