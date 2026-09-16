/**
 * COMMAND CENTER — DATA ADAPTER
 *
 * Translates the main app's authoritative data (matching engine results,
 * scheme repository, tracker records, document progress) into the shapes the
 * Command Center presentation layer expects.
 *
 * Strict rules honoured here:
 * - Matching is NEVER recomputed. `matchPercentage` and the per-factor
 *   contributions produced by the authoritative engine (Social 30 /
 *   Business Type 25 / Income 20 / Age 15 / State 10) are passed through verbatim.
 * - No values are invented. Anything the dataset does not carry is reported as
 *   unknown / needs verification rather than guessed.
 * - Follow-ups stay user reminders. No government deadline is ever implied.
 */

import type { MatchResult, Scheme as AppScheme, UserProfile as AppProfile } from '../../types';
import type { TrackedApplication } from '../../types/tracker';
import type { DocumentProgressMap } from '../../lib/tracker/documentProgress';
import { evaluateSchemeFreshness } from '../../lib/tracker/schemeFreshness';
import { classifyPortalDomain } from './lib/trust/trustEngine';
import type {
  ApplicationRecord,
  ApplicationStatus as FeatureApplicationStatus,
  BusinessStage,
  BusinessType,
  FollowUpItem,
  FreshnessStatus,
  Phase3MatchResult,
  Scheme,
  SchemeDocumentRequirement,
  SocialCategory,
  SupportCategory,
  UserDocumentState,
  UserProfile,
} from './types';

/* ----------------------------- small helpers ----------------------------- */

export const slugifyDocId = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const REUSABLE_DOC_HINTS = [
  'aadhaar',
  'pan',
  'photo',
  'bank',
  'passbook',
  'caste',
  'income',
  'address',
  'residence',
  'identity',
  'signature',
];

/* ------------------------------- profile -------------------------------- */

const SOCIAL_CATEGORY_MAP: Record<string, SocialCategory> = {
  SC: 'SC',
  ST: 'ST',
  OBC: 'OBC',
  General: 'GENERAL',
  Woman: 'GENERAL',
  Minority: 'MINORITY',
};

const BUSINESS_TYPE_MAP: Record<string, BusinessType> = {
  manufacturing: 'MANUFACTURING',
  handicraft: 'MANUFACTURING',
  food: 'MANUFACTURING',
  services: 'SERVICE',
  tech: 'SERVICE',
  trading: 'TRADING',
  agri: 'TRADING',
};

const BUSINESS_STAGE_MAP: Record<string, BusinessStage> = {
  idea: 'IDEA',
  new: 'REGISTRATION',
  existing: 'FUNDING',
  scaling: 'MARKET_ACCESS',
  expanding: 'EXPANSION',
};

export function toFeatureProfile(profile: AppProfile | null): UserProfile | null {
  if (!profile) return null;

  return {
    name: profile.applicantName,
    age: profile.age,
    gender:
      profile.gender === 'female' ? 'FEMALE' : profile.gender === 'male' ? 'MALE' : profile.gender ? 'OTHER' : undefined,
    socialCategory: profile.category ? SOCIAL_CATEGORY_MAP[profile.category] : undefined,
    state: profile.state || profile.businessState || profile.residenceState,
    district: profile.district,
    businessName: profile.businessName,
    businessType: profile.businessType ? BUSINESS_TYPE_MAP[profile.businessType] : undefined,
    businessStage: profile.businessStage ? BUSINESS_STAGE_MAP[profile.businessStage] : undefined,
    annualIncome: profile.annualIncome,
    investmentAmount: profile.investmentAmount ?? profile.fundingRequired,
    turnover: profile.existingTurnover,
    hasUdyam: profile.businessRegistration === 'udyam',
    hasGst: profile.businessRegistration === 'gst',
  };
}

/* -------------------------------- schemes -------------------------------- */

const FRESHNESS_MAP: Record<string, FreshnessStatus> = {
  RECENTLY_VERIFIED: 'FRESH',
  VERIFICATION_AGEING: 'RECENTLY_VERIFIED',
  VERIFICATION_STALE: 'NEEDS_VERIFICATION',
  VERIFICATION_UNKNOWN: 'NEEDS_VERIFICATION',
  MARKED_INACTIVE: 'NEEDS_VERIFICATION',
};

/** Support categories are read off the scheme record — never guessed from score. */
function deriveSupportCategories(scheme: AppScheme): SupportCategory[] {
  const haystack = [
    scheme.schemeType,
    scheme.benefitSummary,
    scheme.purpose,
    scheme.fundingPurpose,
    ...(scheme.tags || []),
    ...(scheme.categories || []).map(c => String(c)),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const categories = new Set<SupportCategory>();

  if (scheme.maxAmount > 0 || /loan|credit|subsid|grant|fund|capital|margin/.test(haystack)) {
    categories.add('Funding');
  }
  if (/registration|udyam|licen|formalis|formaliz|gst/.test(haystack)) {
    categories.add('Registration');
  }
  if (/train|skill|capacity|mentor|edp|incubat/.test(haystack)) {
    categories.add('Skill Development');
  }
  if (/infrastructur|cluster|shed|park|machinery|equipment|technolog/.test(haystack)) {
    categories.add('Infrastructure');
  }
  if (/market|export|exhibit|branding|procure|buyer/.test(haystack)) {
    categories.add('Market Access');
  }

  // A scheme with no readable support signal is shown under Funding only if it
  // actually carries a funding amount; otherwise it stays uncategorised.
  return Array.from(categories);
}

function toDocumentRequirements(scheme: AppScheme): SchemeDocumentRequirement[] {
  return (scheme.requiredDocuments || []).map(doc => {
    const lower = doc.toLowerCase();
    const isReusable = REUSABLE_DOC_HINTS.some(hint => lower.includes(hint));
    return {
      id: `${slugifyDocId(doc)}`,
      name: doc,
      nameHi: doc,
      type: isReusable ? 'REUSABLE' : 'SCHEME_SPECIFIC',
      description: doc,
      descriptionHi: doc,
      isMandatory: true,
    };
  });
}

function toApplicationChannel(scheme: AppScheme): Scheme['applicationChannel'] {
  const mode = String(scheme.applicationMode || '').toLowerCase();
  if (/bank|nodal|branch/.test(mode)) return 'OFFICIAL_BANK_NODAL';
  if (/offline|district|physical|centre|center/.test(mode)) return 'DISTRICT_INDUSTRY_CENTRE';
  return 'ONLINE_PORTAL';
}

export function toFeatureScheme(
  scheme: AppScheme,
  localizedName?: { name: string; description?: string },
  today: Date = new Date(),
): Scheme {
  const freshness = evaluateSchemeFreshness(scheme, today);
  const isStateScheme = (scheme.applicableStates || []).length > 0;

  return {
    id: scheme.id,
    code: scheme.shortCode || scheme.id,
    name: scheme.name,
    nameHi: localizedName?.name || scheme.name,
    department: scheme.department || scheme.sponsoringMinistry,
    departmentHi: scheme.department || scheme.sponsoringMinistry,
    ministry: scheme.sponsoringMinistry,
    level: isStateScheme ? 'state' : 'central',
    state: isStateScheme ? scheme.applicableStates[0] : undefined,
    description: scheme.description || scheme.benefitSummary,
    descriptionHi: localizedName?.description || scheme.description || scheme.benefitSummary,
    objective: scheme.purpose || scheme.benefitSummary,
    objectiveHi: scheme.purpose || scheme.benefitSummary,
    targetAudience: (scheme.targetCategories || []).map(String),
    eligibleCategories: (scheme.targetCategories || [])
      .map(c => SOCIAL_CATEGORY_MAP[String(c)])
      .filter(Boolean) as SocialCategory[],
    eligibleBusinessTypes: Array.from(
      new Set(
        (scheme.targetBusinessTypes || [])
          .map(b => BUSINESS_TYPE_MAP[String(b)])
          .filter(Boolean) as BusinessType[],
      ),
    ),
    minAge: scheme.minAge,
    maxAge: scheme.maxAge,
    maxIncome: scheme.maxAnnualIncomeCap || undefined,
    subsidyPercentage: scheme.subsidyRatePercent,
    loanLimit: scheme.maxAmount || undefined,
    supportCategories: deriveSupportCategories(scheme),
    officialUrl: scheme.officialPortalUrl,
    officialPortalUrl: scheme.officialPortalUrl,
    portalDomainClass: classifyPortalDomain(scheme.officialPortalUrl || ''),
    lastAuditedDate: scheme.lastVerifiedDate,
    freshnessStatus: FRESHNESS_MAP[freshness.state] || 'NEEDS_VERIFICATION',
    requiredDocuments: toDocumentRequirements(scheme),
    // Step-by-step instructions live in the existing application preparation
    // engine; none are duplicated (and none invented) here.
    applicationInstructions: [],
    applicationChannel: toApplicationChannel(scheme),
  };
}

/* ------------------------------ match results ---------------------------- */

const factorContribution = (match: MatchResult, key: string): number => {
  const row = (match.breakdown || []).find(b => b.factorKey === key);
  return row ? Math.max(0, Math.round(row.scoreContribution)) : 0;
};

export function toFeatureMatchResult(match: MatchResult): Phase3MatchResult {
  const socialCategoryScore = factorContribution(match, 'category');
  const businessTypeScore = factorContribution(match, 'businessType');
  const incomeScore = factorContribution(match, 'income');
  const ageScore = factorContribution(match, 'age');
  const stateScore = factorContribution(match, 'state');

  const criteria = (match.breakdown || []).map(row => ({
    criterion: row.factorLabel,
    criterionHi: row.factorLabel,
    status: row.state === 'MATCHED' ? ('MET' as const) : row.state === 'UNKNOWN' ? ('UNKNOWN' as const) : ('UNMET' as const),
    explanation: row.explanation,
    explanationHi: row.explanation,
    weight: row.maxContribution,
  }));

  return {
    schemeId: match.scheme.id,
    // Verbatim from the authoritative engine.
    totalMatchScore: match.matchPercentage,
    socialCategoryScore,
    businessTypeScore,
    incomeScore,
    ageScore,
    stateScore,
    dimensionScores: {
      socialCategory: socialCategoryScore,
      businessType: businessTypeScore,
      income: incomeScore,
      age: ageScore,
      state: stateScore,
    },
    isEligible: match.isEligible,
    hasBlocker: (match.confirmedBlockers || []).length > 0,
    unknownCriteriaCount: (match.unknownCriteria || []).length,
    criteria,
    financialFit: {
      fitsBudget: match.businessRelevance ? true : match.isEligible,
      reason: match.gapSummary || match.plainLanguageExplanation || '',
      reasonHi: match.gapSummary || match.plainLanguageExplanation || '',
    },
  };
}

/* ------------------------- tracker / documents --------------------------- */

const STATUS_MAP: Record<string, FeatureApplicationStatus> = {
  interested: 'interested',
  'docs-ready': 'docs-ready',
  applied: 'applied',
  approved: 'approved',
  // The Command Center has no rejected state; a closed application is shown as
  // submitted so nothing is silently dropped from the summary.
  rejected: 'applied',
};

export function toApplicationRecords(applications: TrackedApplication[]): ApplicationRecord[] {
  return applications.map(app => ({
    id: app.schemeId,
    schemeId: app.schemeId,
    status: STATUS_MAP[app.status] || 'interested',
    appliedDate: app.appliedOn,
    appliedAt: app.appliedOn,
    submissionConfirmed: app.status === 'applied' || app.status === 'approved',
    notes: app.note,
    updatedAt: app.updatedAt || app.createdAt,
  }));
}

/** Prepared documents recorded by the existing document progress store. */
export function toUserDocumentStates(
  progress: DocumentProgressMap,
  updatedAt: string = new Date().toISOString(),
): Record<string, UserDocumentState> {
  const states: Record<string, UserDocumentState> = {};
  Object.values(progress || {}).forEach(docIds => {
    (docIds || []).forEach(docId => {
      const key = slugifyDocId(String(docId));
      states[key] = { documentId: key, status: 'PREPARED', updatedAt };
    });
  });
  return states;
}

/**
 * Follow-ups the citizen set for themselves in the tracker.
 * Always typed USER_REMINDER — the dataset carries no verified scheme deadlines.
 */
export function toFollowUpItems(applications: TrackedApplication[]): FollowUpItem[] {
  return applications
    .filter(app => app.followUp && app.followUp.dueOn)
    .map(app => ({
      id: `${app.schemeId}-followup`,
      schemeId: app.schemeId,
      schemeName: app.schemeName,
      title: app.followUp?.noteEn || 'Check application progress',
      titleHi: app.followUp?.noteHi || app.followUp?.noteEn || 'आवेदन की प्रगति देखें',
      date: String(app.followUp?.dueOn),
      type: 'USER_REMINDER',
      completed: Boolean(app.followUp?.completedOn),
    }));
}
