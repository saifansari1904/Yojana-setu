/**
 * YOJANA SETU — GOVERNMENT DATA TRUST & VERIFICATION TYPES (PHASE 2.5)
 * 
 * Strict data trust model distinguishing:
 * 1. Source (Origin provenance & hierarchy level 1–6)
 * 2. Official Source (Authoritative government entity)
 * 3. Verification Status (VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, OUTDATED)
 * 4. Freshness (CURRENT, DUE_FOR_REVIEW, OUTDATED, UNKNOWN as of September 2026)
 * 5. Data Confidence (HIGH, MEDIUM, LOW, UNKNOWN)
 * 6. Entrepreneur Relevance (CORE_ENTREPRENEUR, ENTREPRENEUR_ADJACENT, GENERAL_WELFARE, OUT_OF_SCOPE)
 */

/**
 * 6-Level Official Source Hierarchy:
 * Level 1: Central Government Portal (e.g. india.gov.in, msme.gov.in, myScheme)
 * Level 2: State Government Portal (e.g. karnataka.gov.in, tn.gov.in)
 * Level 3: Central / State Ministry or Department (e.g. MSME, KVIC, Industries Dept)
 * Level 4: Statutory Implementing Agency (e.g. SIDBI, CGTMSE, TIIC, KSFC)
 * Level 5: Government-backed Corporation / Organization (e.g. NMDFC, NSFDC, KSUM)
 * Level 6: Secondary Aggregator (e.g. Yojana Sahay, third-party portals)
 */
export type SourceHierarchyLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TrustVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'OUTDATED';

export type FreshnessStatus =
  | 'CURRENT'
  | 'DUE_FOR_REVIEW'
  | 'OUTDATED'
  | 'UNKNOWN';

export type ConfidenceLevel =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'UNKNOWN';

export type EntrepreneurRelevance =
  | 'CORE_ENTREPRENEUR'
  | 'ENTREPRENEUR_ADJACENT'
  | 'GENERAL_WELFARE'
  | 'OUT_OF_SCOPE';

export type UrlSafetyClassification =
  | 'OFFICIAL_GOVERNMENT'
  | 'IMPLEMENTING_AGENCY'
  | 'GOVERNMENT_BACKED'
  | 'SECONDARY_AGGREGATOR'
  | 'SUSPICIOUS_OR_INVALID';

export interface FieldVerificationDetail {
  fieldName: string;
  isVerified: boolean;
  verifiedAt?: string;
  sourceAuthority?: string;
  notes?: string;
}

export interface SchemeTrustProfile {
  // 1. Source Origin
  source: {
    sourceName: string;
    sourceType: string;
    sourceUrl: string;
    hierarchyLevel: SourceHierarchyLevel;
    isOfficialGovernmentSource: boolean;
  };

  // 2. Official Authority
  officialSource: {
    ministryOrDepartment: string;
    implementingAgency?: string;
    officialPortalUrl: string;
    isGovernmentDomain: boolean;
    gazetteOrNotificationRef?: string;
  };

  // 3. Verification State
  verification: {
    status: TrustVerificationStatus;
    verifiedAt: string | null;
    verifiedBy: string;
    verifiedFields: string[];
    unverifiedFields: string[];
    notes?: string;
  };

  // 4. Freshness (computed relative to reference date, e.g. September 2026)
  freshness: {
    status: FreshnessStatus;
    lastVerifiedAt: string | null;
    nextReviewAt: string | null;
    daysSinceVerification: number | null;
    freshnessLabel: string;
  };

  // 5. Overall Confidence & Relevance
  confidence: ConfidenceLevel;
  entrepreneurRelevance: EntrepreneurRelevance;
  urlSafety: UrlSafetyClassification;
}

export interface ReviewQueueItem {
  id: string;
  schemeId: string;
  schemeName: string;
  issueType:
    | 'MISSING_OFFICIAL_SOURCE'
    | 'FUNDING_VERIFICATION_REQUIRED'
    | 'ELIGIBILITY_CRITERIA_UNCONFIRMED'
    | 'OUTDATED_VERIFICATION'
    | 'URL_SAFETY_UNCONFIRMED'
    | 'DOCUMENT_CHECKLIST_INCOMPLETE'
    | 'APPLICATION_PORTAL_UNVERIFIED'
    | 'SECONDARY_SOURCE_ONLY';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  field: string;
  currentValue: any;
  source: string;
  notes: string;
  suggestedAction: string;
}

export interface DataQualityAuditReport {
  timestamp: string;
  referenceDate: string;
  totalSchemes: number;
  nationalSchemes: number;
  stateSpecificSchemes: number;
  regionalBreakdown: {
    centralNational: number;
    karnataka: number;
    kerala: number;
    tamilNadu: number;
    telangana: number;
    andhraPradesh: number;
    otherStates: number;
  };
  trustBreakdown: {
    verified: number;
    partiallyVerified: number;
    unverified: number;
    outdated: number;
  };
  freshnessBreakdown: {
    current: number;
    dueForReview: number;
    outdated: number;
    unknown: number;
  };
  confidenceBreakdown: {
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
  urlSafetyBreakdown: {
    officialGovernment: number;
    implementingAgency: number;
    governmentBacked: number;
    secondaryAggregator: number;
    suspiciousOrInvalid: number;
  };
  dataQualityIssues: {
    missingOfficialUrl: number;
    missingEligibility: number;
    missingFinancialInfo: number;
    missingApplicationInfo: number;
    missingDocuments: number;
    missingSourceInfo: number;
    potentialDuplicates: number;
    malformedFinancialValues: number;
    malformedUrls: number;
  };
  overallHealthScore: number; // 0 - 100
}
