/**
 * YOJANA SETU — GOVERNMENT DATA TRUST & FRESHNESS ENGINE (PHASE 2.5)
 *
 * Implements the rigorous multi-tier trust model:
 * - Source Origin & 6-level hierarchy
 * - Authoritative Official Government verification
 * - Dynamic Freshness calculation relative to September 2026
 * - Confidence scoring & URL safety classification
 * - Automated Data Review Queue generation
 * - Comprehensive Data Quality Audit calculations
 */

import { Scheme } from '../../types';
import {
  SchemeTrustProfile,
  SourceHierarchyLevel,
  TrustVerificationStatus,
  FreshnessStatus,
  ConfidenceLevel,
  EntrepreneurRelevance,
  UrlSafetyClassification,
  ReviewQueueItem,
  DataQualityAuditReport,
} from '../../types/trust';
import { INDIAN_STATES } from '../../constants';
import { findAuthorityByDomain } from '../../data/governmentAuthorities';

export const SYSTEM_REFERENCE_DATE = '2026-09-13'; // Default baseline reference date for deterministic testing

/**
 * Normalizes human-readable and ISO date strings into standard Date objects.
 * Handles '15 August 2024', '2024-07-25', '2026-03-01', etc.
 */
export function parseGovernmentDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return null;
  }

  const clean = dateStr.trim();
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle common Indian gazette formats: DD Month YYYY or DD-MM-YYYY
  const parts = clean.split(/[\s-]+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthIdx = monthNames.indexOf(parts[1].toLowerCase());
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
      return new Date(year, monthIdx, day);
    }
  }

  return null;
}

/**
 * Resolves the effective reference date for freshness evaluation.
 * Production: Uses the current date if referenceDate is omitted.
 * Tests: Injects deterministic string or Date.
 */
function resolveReferenceDate(referenceDate?: string | Date | null): Date {
  if (referenceDate instanceof Date && !isNaN(referenceDate.getTime())) {
    return referenceDate;
  }
  if (typeof referenceDate === 'string' && referenceDate.trim() !== '') {
    const parsed = parseGovernmentDate(referenceDate);
    if (parsed) return parsed;
  }
  return new Date();
}

/**
 * Evaluates the freshness status of a scheme record against an optional reference date.
 * Production defaults to the current system date; tests can inject a deterministic reference date.
 */

/**
 * Calculates freshness status relative to a reference date.
 * - CURRENT: Verified within past 180 days
 * - DUE_FOR_REVIEW: Verified 181 - 365 days ago
 * - OUTDATED: Verified > 365 days ago (e.g. > 1 year old)
 * - UNKNOWN: No valid verification date
 */
export function calculateFreshness(
  lastVerifiedDate?: string | null,
  referenceDate?: string | Date | null
): {
  status: FreshnessStatus;
  lastVerifiedAt: string | null;
  nextReviewAt: string | null;
  daysSinceVerification: number | null;
  freshnessLabel: string;
} {
  const verifiedDate = parseGovernmentDate(lastVerifiedDate);
  const refDate = resolveReferenceDate(referenceDate);

  if (!verifiedDate) {
    return {
      status: 'UNKNOWN',
      lastVerifiedAt: null,
      nextReviewAt: null,
      daysSinceVerification: null,
      freshnessLabel: 'Verification date unrecorded',
    };
  }

  const diffTime = refDate.getTime() - verifiedDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const isoVerified = verifiedDate.toISOString().split('T')[0];

  // Calculate next recommended review date (180 days after verification)
  const nextReviewDateObj = new Date(verifiedDate.getTime() + 180 * 24 * 60 * 60 * 1000);
  const isoNextReview = nextReviewDateObj.toISOString().split('T')[0];

  if (diffDays <= 180) {
    return {
      status: 'CURRENT',
      lastVerifiedAt: isoVerified,
      nextReviewAt: isoNextReview,
      daysSinceVerification: diffDays,
      freshnessLabel: `Current (Verified ${diffDays === 0 ? 'today' : `${diffDays} days ago`})`,
    };
  }

  if (diffDays <= 365) {
    return {
      status: 'DUE_FOR_REVIEW',
      lastVerifiedAt: isoVerified,
      nextReviewAt: isoNextReview,
      daysSinceVerification: diffDays,
      freshnessLabel: `Due for Review (${Math.round(diffDays / 30)} months old)`,
    };
  }

  return {
    status: 'OUTDATED',
    lastVerifiedAt: isoVerified,
    nextReviewAt: isoNextReview,
    daysSinceVerification: diffDays,
    freshnessLabel: `Historical (${verifiedDate.getFullYear()}) — Annual Review Required`,
  };
}

/**
 * Classifies URL safety & authenticity against official government domain registries.
 * Generic domain extensions (.com, .org, .co.in, .org.in) are never classified as
 * GOVERNMENT_BACKED solely by suffix; only explicitly known statutory or government-backed
 * authorities are recognized. Unknown external domains remain SECONDARY_AGGREGATOR.
 */
export function classifyUrlSafety(url?: string | null): UrlSafetyClassification {
  if (!url || typeof url !== 'string' || !/^https?:\/\/.+/i.test(url.trim())) {
    return 'SUSPICIOUS_OR_INVALID';
  }

  let hostname = '';
  try {
    const parsed = new URL(url.trim());
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return 'SUSPICIOUS_OR_INVALID';
  }

  if (!hostname) {
    return 'SUSPICIOUS_OR_INVALID';
  }

  // Consult Government Authority Registry first
  const registeredAuthority = findAuthorityByDomain(hostname);
  if (registeredAuthority) {
    if (registeredAuthority.authorityType === 'AGGREGATOR') {
      return 'SECONDARY_AGGREGATOR';
    }
    if (registeredAuthority.authorityType === 'ACADEMIC_INSTITUTION') {
      // General academic domains (.ac.in) are not government authorities.
      // Only designated state knowledge partners (e.g., TNAU Agritech portal) are recognized.
      if (registeredAuthority.isOfficialGovernment) {
        return 'OFFICIAL_GOVERNMENT';
      }
      return 'SECONDARY_AGGREGATOR';
    }
  }

  // Tier 1: Official Indian government domain extensions (.gov.in, .nic.in)
  // Note: .ac.in is NOT automatically classified as official government
  if (
    hostname === 'gov.in' ||
    hostname.endsWith('.gov.in') ||
    hostname === 'nic.in' ||
    hostname.endsWith('.nic.in')
  ) {
    return 'OFFICIAL_GOVERNMENT';
  }

  // Tier 2: Recognized statutory bodies & public financing corporations (explicit known authorities)
  const statutoryAgencyDomains = [
    'cgtmse.in',
    'mudra.org.in',
    'scsthub.in',
    'vcfsc.in',
    'nmdfc.org',
    'nsfdc.nic.in',
    'sidbi.in',
    'kviconline.gov.in',
    'standupmitra.in',
    'startupindia.gov.in',
    'startupmission.kerala.gov.in',
    'ncdc.in',
    'tiic.org',
    'tiic.co.in',
    'ksfc.in',
  ];

  if (statutoryAgencyDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
    return 'IMPLEMENTING_AGENCY';
  }

  // Tier 3: Explicitly known state boards & government-backed corporations from the scheme database
  const knownGovernmentBackedDomains = [
    'tnsfac.org',
    'kswdc.org',
    'kudumbashree.org',
    'norkaroots.org',
    'keralakhadi.org',
  ];

  if (knownGovernmentBackedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
    return 'GOVERNMENT_BACKED';
  }

  // Generic or unknown domains (.com, .org, .co.in, .org.in, third-party aggregators)
  // are never automatically classified as government-backed. They remain secondary aggregators.
  return 'SECONDARY_AGGREGATOR';
}

/**
 * Determines the source hierarchy level (1 - 6).
 */
export function classifySourceHierarchy(scheme?: Scheme | null): SourceHierarchyLevel {
  if (!scheme) return 6;
  const url = (scheme.officialPortalUrl || '').toLowerCase();
  const ministry = (scheme.sponsoringMinistry || '').toLowerCase();
  const applicableStates = scheme.applicableStates || [];

  if (
    url.includes('india.gov.in') ||
    url.includes('myscheme.gov.in') ||
    url.includes('msme.gov.in') ||
    url.includes('standupmitra.in') ||
    (applicableStates.length === 0 && url.includes('.gov.in'))
  ) {
    return 1; // Central Govt Portal
  }

  if (
    applicableStates.length > 0 &&
    (url.includes('.gov.in') || url.includes('.nic.in'))
  ) {
    return 2; // State Govt Portal
  }

  if (
    url.includes('sidbi.in') ||
    url.includes('cgtmse.in') ||
    url.includes('mudra.org.in') ||
    url.includes('tiic') ||
    url.includes('ksfc')
  ) {
    return 4; // Statutory Implementing Agency
  }

  if (
    url.includes('ksum') ||
    url.includes('nmdfc') ||
    url.includes('vcfsc') ||
    url.includes('scsthub')
  ) {
    return 5; // Govt-backed Corporation
  }

  if (
    ministry.includes('ministry') ||
    ministry.includes('department') ||
    ministry.includes('directorate')
  ) {
    return 3; // Ministry or Department
  }

  return 6; // Secondary Aggregator
}

/**
 * Derives overall confidence level based on verification, freshness, and URL authority.
 */
export function calculateConfidenceLevel(
  verificationStatus: TrustVerificationStatus,
  freshnessStatus: FreshnessStatus,
  urlSafety: UrlSafetyClassification
): ConfidenceLevel {
  if (
    verificationStatus === 'VERIFIED' &&
    freshnessStatus === 'CURRENT' &&
    (urlSafety === 'OFFICIAL_GOVERNMENT' || urlSafety === 'IMPLEMENTING_AGENCY')
  ) {
    return 'HIGH';
  }

  if (
    (verificationStatus === 'VERIFIED' || verificationStatus === 'PARTIALLY_VERIFIED') &&
    (freshnessStatus === 'CURRENT' || freshnessStatus === 'DUE_FOR_REVIEW') &&
    urlSafety !== 'SUSPICIOUS_OR_INVALID'
  ) {
    return 'MEDIUM';
  }

  if (
    verificationStatus === 'OUTDATED' ||
    freshnessStatus === 'OUTDATED' ||
    urlSafety === 'SECONDARY_AGGREGATOR' ||
    verificationStatus === 'UNVERIFIED'
  ) {
    return 'LOW';
  }

  return 'UNKNOWN';
}

/**
 * Builds the comprehensive SchemeTrustProfile for a given scheme record.
 */
export function deriveSchemeTrustProfile(
  scheme: Scheme,
  refDate?: string | Date | null
): SchemeTrustProfile {
  const url = scheme.officialPortalUrl || '';
  const urlSafety = classifyUrlSafety(url);
  const hierarchyLevel = classifySourceHierarchy(scheme);
  const isGovDomain = urlSafety === 'OFFICIAL_GOVERNMENT' || urlSafety === 'IMPLEMENTING_AGENCY';

  // Verification status logic — never assume verified when no verification evidence/status exists
  const explicitStatus =
    scheme.sourceProvenance?.verificationStatus ||
    scheme.intelligence?.governance?.verificationStatus;

  let verificationStatus: TrustVerificationStatus = 'UNVERIFIED';

  if (explicitStatus && typeof explicitStatus === 'string') {
    const rawStatus = explicitStatus.trim().toUpperCase();
    if (rawStatus === 'VERIFIED') {
      verificationStatus = 'VERIFIED';
    } else if (rawStatus === 'PARTIALLY_VERIFIED' || rawStatus === 'NEEDS_REVIEW') {
      verificationStatus = 'PARTIALLY_VERIFIED';
    } else if (rawStatus === 'OUTDATED') {
      verificationStatus = 'OUTDATED';
    } else {
      verificationStatus = 'UNVERIFIED';
    }
  }

  const freshness = calculateFreshness(scheme.lastVerifiedDate, refDate);

  // If freshness is OUTDATED (> 365 days), verification status reflects that it needs review
  if (freshness.status === 'OUTDATED' && verificationStatus === 'VERIFIED') {
    // Keep verification status as VERIFIED but acknowledge it is historical in freshness
  }

  const confidence = calculateConfidenceLevel(verificationStatus, freshness.status, urlSafety);

  // Verified fields check
  const verifiedFields: string[] = [
    'name',
    'sponsoringMinistry',
    'applicableStates',
    'minAmount',
    'maxAmount',
    'targetCategories',
    'targetBusinessTypes',
  ];

  const unverifiedFields: string[] = [];
  if (!scheme.intelligence?.application?.nodalAgency) {
    unverifiedFields.push('nodalAgencyHelpline');
  }
  if (!scheme.intelligence?.financial?.marginContribution) {
    unverifiedFields.push('promoterMarginExactPercentage');
  }

  return {
    source: {
      sourceName: scheme.sourceProvenance?.sourceName || scheme.sponsoringMinistry,
      sourceType: scheme.sourceProvenance?.sourceType || 'statutory_guideline',
      sourceUrl: url,
      hierarchyLevel,
      isOfficialGovernmentSource: isGovDomain,
    },
    officialSource: {
      ministryOrDepartment: scheme.sponsoringMinistry,
      implementingAgency: scheme.department || scheme.intelligence?.application?.nodalAgency,
      officialPortalUrl: url,
      isGovernmentDomain: isGovDomain,
      gazetteOrNotificationRef: scheme.intelligence?.identity?.officialSchemeIdentifier,
    },
    verification: {
      status: verificationStatus,
      verifiedAt: verificationStatus === 'UNVERIFIED' ? null : freshness.lastVerifiedAt,
      verifiedBy: verificationStatus === 'UNVERIFIED'
        ? 'Unverified'
        : (scheme.intelligence?.identity?.officialSchemeIdentifier
            ? 'Official Gazette Notification'
            : (isGovDomain ? 'Official Ministry / Department Portal' : 'Official Portal Guidelines & Documentation')),
      verifiedFields: verificationStatus === 'UNVERIFIED' ? [] : verifiedFields,
      unverifiedFields: verificationStatus === 'UNVERIFIED' ? verifiedFields.concat(unverifiedFields) : unverifiedFields,
      notes: scheme.intelligence?.governance?.sourceNotes ||
        (verificationStatus === 'UNVERIFIED'
          ? 'Unverified record — pending official verification against published government guidelines'
          : (scheme.intelligence?.identity?.officialSchemeIdentifier
              ? 'Derived from official gazette notification and published guidelines'
              : 'Derived from official scheme guidelines and published portal documentation')),
    },
    freshness,
    confidence,
    entrepreneurRelevance: 'CORE_ENTREPRENEUR',
    urlSafety,
  };
}

/**
 * Scans the database and generates a machine-readable data review queue for data maintainers.
 */
export function generateReviewQueue(
  schemes: Scheme[],
  refDate?: string | Date | null
): ReviewQueueItem[] {
  const queue: ReviewQueueItem[] = [];

  schemes.forEach((scheme, idx) => {
    const trust = deriveSchemeTrustProfile(scheme, refDate);

    // 1. Check for OUTDATED verification (> 365 days / historical)
    if (trust.freshness.status === 'OUTDATED') {
      queue.push({
        id: `rq-outdated-${scheme.id}`,
        schemeId: scheme.id,
        schemeName: scheme.name,
        issueType: 'OUTDATED_VERIFICATION',
        priority: 'HIGH',
        field: 'lastVerifiedDate',
        currentValue: scheme.lastVerifiedDate,
        source: scheme.officialPortalUrl,
        notes: `Verification is ${trust.freshness.daysSinceVerification} days old (> 365 days). Annual budgetary allocation, active interest subsidies, and guidelines must be re-checked.`,
        suggestedAction: 'Review current 2026 portal guidelines and update lastVerifiedDate with latest verification audit.',
      });
    }

    // 2. Check for DUE_FOR_REVIEW verification (181 - 365 days)
    if (trust.freshness.status === 'DUE_FOR_REVIEW') {
      queue.push({
        id: `rq-review-due-${scheme.id}`,
        schemeId: scheme.id,
        schemeName: scheme.name,
        issueType: 'OUTDATED_VERIFICATION',
        priority: 'MEDIUM',
        field: 'lastVerifiedDate',
        currentValue: scheme.lastVerifiedDate,
        source: scheme.officialPortalUrl,
        notes: `Verification is ${trust.freshness.daysSinceVerification} days old (approaching annual review).`,
        suggestedAction: 'Schedule periodic sanity check on portal uptime and application forms.',
      });
    }

    // 3. Check for secondary or non-gov URL safety
    if (trust.urlSafety === 'SECONDARY_AGGREGATOR' || trust.urlSafety === 'SUSPICIOUS_OR_INVALID') {
      queue.push({
        id: `rq-url-${scheme.id}`,
        schemeId: scheme.id,
        schemeName: scheme.name,
        issueType: 'URL_SAFETY_UNCONFIRMED',
        priority: 'HIGH',
        field: 'officialPortalUrl',
        currentValue: scheme.officialPortalUrl,
        source: scheme.sponsoringMinistry,
        notes: `Official portal link does not resolve to an official .gov.in or recognized statutory domain.`,
        suggestedAction: 'Replace with direct departmental portal or National Portal of India link.',
      });
    }

    // 4. Check for incomplete document checklists
    if (!scheme.requiredDocuments || scheme.requiredDocuments.length < 3) {
      queue.push({
        id: `rq-docs-${scheme.id}`,
        schemeId: scheme.id,
        schemeName: scheme.name,
        issueType: 'DOCUMENT_CHECKLIST_INCOMPLETE',
        priority: 'LOW',
        field: 'requiredDocuments',
        currentValue: scheme.requiredDocuments,
        source: scheme.officialPortalUrl,
        notes: 'Document checklist has fewer than 3 standard items.',
        suggestedAction: 'Expand statutory checklist with standard KYC, DPR, and registration requirements.',
      });
    }
  });

  return queue;
}

/**
 * Computes the complete Data Quality & Trust Audit Report across all schemes.
 */
export function generateDataQualityAuditReport(
  schemes: Scheme[],
  refDate?: string | Date | null
): DataQualityAuditReport {
  const effectiveRefDate = resolveReferenceDate(refDate);
  const formattedRefDate = typeof refDate === 'string' && refDate.trim() !== ''
    ? refDate
    : (effectiveRefDate instanceof Date && !isNaN(effectiveRefDate.getTime())
        ? effectiveRefDate.toISOString().split('T')[0]
        : SYSTEM_REFERENCE_DATE);

  let nationalSchemes = 0;
  let stateSpecificSchemes = 0;

  let centralNational = 0;
  let karnataka = 0;
  let kerala = 0;
  let tamilNadu = 0;
  let telangana = 0;
  let andhraPradesh = 0;
  let otherStates = 0;

  let verified = 0;
  let partiallyVerified = 0;
  let unverified = 0;
  let outdated = 0;

  let currentFreshness = 0;
  let dueForReviewFreshness = 0;
  let outdatedFreshness = 0;
  let unknownFreshness = 0;

  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;
  let unknownConfidence = 0;

  let officialGovernmentUrl = 0;
  let implementingAgencyUrl = 0;
  let governmentBackedUrl = 0;
  let secondaryAggregatorUrl = 0;
  let suspiciousOrInvalidUrl = 0;

  let missingOfficialUrl = 0;
  let missingEligibility = 0;
  let missingFinancialInfo = 0;
  let missingApplicationInfo = 0;
  let missingDocuments = 0;
  let missingSourceInfo = 0;
  let potentialDuplicates = 0;
  let malformedFinancialValues = 0;
  let malformedUrls = 0;

  const seenIds = new Set<string>();

  for (const scheme of schemes) {
    if (seenIds.has(scheme.id)) {
      potentialDuplicates++;
    } else {
      seenIds.add(scheme.id);
    }

    const isNational = scheme.applicableStates.length === 0;
    if (isNational) {
      nationalSchemes++;
      centralNational++;
    } else {
      stateSpecificSchemes++;
      if (scheme.applicableStates.includes('Karnataka')) karnataka++;
      if (scheme.applicableStates.includes('Kerala')) kerala++;
      if (scheme.applicableStates.includes('Tamil Nadu')) tamilNadu++;
      if (scheme.applicableStates.includes('Telangana')) telangana++;
      if (scheme.applicableStates.includes('Andhra Pradesh')) andhraPradesh++;
      if (
        !scheme.applicableStates.includes('Karnataka') &&
        !scheme.applicableStates.includes('Kerala') &&
        !scheme.applicableStates.includes('Tamil Nadu') &&
        !scheme.applicableStates.includes('Telangana') &&
        !scheme.applicableStates.includes('Andhra Pradesh')
      ) {
        otherStates++;
      }
    }

    // Trust evaluation
    const trust = deriveSchemeTrustProfile(scheme, effectiveRefDate);

    // Verification breakdown
    if (trust.verification.status === 'VERIFIED') verified++;
    else if (trust.verification.status === 'PARTIALLY_VERIFIED') partiallyVerified++;
    else if (trust.verification.status === 'OUTDATED') outdated++;
    else unverified++;

    // Freshness breakdown
    if (trust.freshness.status === 'CURRENT') currentFreshness++;
    else if (trust.freshness.status === 'DUE_FOR_REVIEW') dueForReviewFreshness++;
    else if (trust.freshness.status === 'OUTDATED') outdatedFreshness++;
    else unknownFreshness++;

    // Confidence breakdown
    if (trust.confidence === 'HIGH') highConfidence++;
    else if (trust.confidence === 'MEDIUM') mediumConfidence++;
    else if (trust.confidence === 'LOW') lowConfidence++;
    else unknownConfidence++;

    // URL safety
    if (trust.urlSafety === 'OFFICIAL_GOVERNMENT') officialGovernmentUrl++;
    else if (trust.urlSafety === 'IMPLEMENTING_AGENCY') implementingAgencyUrl++;
    else if (trust.urlSafety === 'GOVERNMENT_BACKED') governmentBackedUrl++;
    else if (trust.urlSafety === 'SECONDARY_AGGREGATOR') secondaryAggregatorUrl++;
    else suspiciousOrInvalidUrl++;

    // Data Quality checks
    if (!scheme.officialPortalUrl || scheme.officialPortalUrl.trim() === '') {
      missingOfficialUrl++;
    } else if (!/^https?:\/\/.+/i.test(scheme.officialPortalUrl.trim())) {
      malformedUrls++;
    }

    if (
      !scheme.targetCategories ||
      scheme.targetCategories.length === 0 ||
      !scheme.targetBusinessTypes ||
      scheme.targetBusinessTypes.length === 0
    ) {
      missingEligibility++;
    }

    if (
      typeof scheme.minAmount !== 'number' ||
      typeof scheme.maxAmount !== 'number' ||
      scheme.minAmount < 0 ||
      scheme.maxAmount <= 0 ||
      scheme.minAmount > scheme.maxAmount
    ) {
      missingFinancialInfo++;
      malformedFinancialValues++;
    }

    if (!scheme.applicationMode || scheme.applicationMode.trim() === '') {
      missingApplicationInfo++;
    }

    if (!scheme.requiredDocuments || scheme.requiredDocuments.length === 0) {
      missingDocuments++;
    }

    if (!scheme.sponsoringMinistry || scheme.sponsoringMinistry.trim() === '') {
      missingSourceInfo++;
    }
  }

  // Health score calculation (100 base minus deductions for defects)
  let healthScore = 100;
  if (missingOfficialUrl > 0) healthScore -= 10;
  if (missingEligibility > 0) healthScore -= 15;
  if (missingFinancialInfo > 0) healthScore -= 15;
  if (malformedFinancialValues > 0) healthScore -= 15;
  if (malformedUrls > 0) healthScore -= 10;
  if (potentialDuplicates > 0) healthScore -= 20;

  return {
    timestamp: new Date().toISOString(),
    referenceDate: formattedRefDate,
    totalSchemes: schemes.length,
    nationalSchemes,
    stateSpecificSchemes,
    regionalBreakdown: {
      centralNational,
      karnataka,
      kerala,
      tamilNadu,
      telangana,
      andhraPradesh,
      otherStates,
    },
    trustBreakdown: {
      verified,
      partiallyVerified,
      unverified,
      outdated,
    },
    freshnessBreakdown: {
      current: currentFreshness,
      dueForReview: dueForReviewFreshness,
      outdated: outdatedFreshness,
      unknown: unknownFreshness,
    },
    confidenceBreakdown: {
      high: highConfidence,
      medium: mediumConfidence,
      low: lowConfidence,
      unknown: unknownConfidence,
    },
    urlSafetyBreakdown: {
      officialGovernment: officialGovernmentUrl,
      implementingAgency: implementingAgencyUrl,
      governmentBacked: governmentBackedUrl,
      secondaryAggregator: secondaryAggregatorUrl,
      suspiciousOrInvalid: suspiciousOrInvalidUrl,
    },
    dataQualityIssues: {
      missingOfficialUrl,
      missingEligibility,
      missingFinancialInfo,
      missingApplicationInfo,
      missingDocuments,
      missingSourceInfo,
      potentialDuplicates,
      malformedFinancialValues,
      malformedUrls,
    },
    overallHealthScore: Math.max(0, healthScore),
  };
}
