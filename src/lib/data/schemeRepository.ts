import { Scheme, SocialCategory, BusinessType } from '../../types';
import { Sector, SchemeType } from '../../data/schemeTaxonomy';
import type {
  SchemeScope,
  NormalizedSchemeCategory,
  SchemeVerificationStatus,
  TrustVerificationStatus,
  FreshnessStatus,
  ConfidenceLevel,
  ReviewQueueItem,
  DataQualityAuditReport,
} from '../../types/scheme';
import { SCHEMES_DATABASE } from '../../data/schemes';

/**
 * PHASE 1 BACKEND — swappable dataset.
 *
 * `activeDataset` starts as the bundled SCHEMES_DATABASE. When the remote
 * Schemes API is enabled (see lib/data/schemeSync.ts), boot hydrates it with
 * the server dataset before first render. All repository queries read from
 * `activeDataset`, so every consumer keeps working unchanged — sync or not.
 */
let activeDataset: Scheme[] = SCHEMES_DATABASE;

/**
 * Replaces the dataset backing every repository query (Phase 1 remote sync).
 * Pass the bundled SCHEMES_DATABASE to revert.
 */
export function setActiveDataset(schemes: Scheme[]): void {
  activeDataset = schemes;
}

/** Returns whichever dataset is currently active (bundled or remote). */
export function getActiveDataset(): Scheme[] {
  return activeDataset;
}
import { SOUTH_INDIA_SCHEMES } from '../../data/southIndiaSchemes';
import {
  getSchemeScope,
  getSchemeCategories,
  getSchemeVerificationStatus,
  calculateDatasetMetadata,
  generateCompletenessReport,
  type DatasetMetadata,
  type CompletenessReport,
} from './normalization';
import {
  deriveSchemeTrustProfile,
  generateReviewQueue,
  generateDataQualityAuditReport,
} from './trustEngine';

/**
 * YOJANA SETU — DATA ACCESS LAYER (SCHEME REPOSITORY)
 *
 * Centralized data access abstraction separating UI components from raw scheme arrays.
 * Provides query methods for retrieving, filtering, searching, and isolating schemes.
 * Ready for future extension to REST API / Cloud Firestore / relational database backends.
 */

interface SchemeSearchFilters {
  query?: string;
  state?: string;
  scope?: SchemeScope;
  sector?: Sector;
  businessType?: BusinessType;
  category?: NormalizedSchemeCategory;
  fundingType?: SchemeType;
  verificationStatus?: SchemeVerificationStatus;
}

/**
 * Retrieves all registered schemes in the database.
 */
export function getAllSchemes(): Scheme[] {
  return activeDataset;
}

/**
 * Finds a single scheme by its unique identifier.
 */
export function getSchemeById(id: string): Scheme | undefined {
  return activeDataset.find((s) => s.id === id);
}

/**
 * Retrieves schemes applicable to a specific Indian state or Union Territory.
 * Includes both national pan-India schemes AND schemes specifically registered for the given state.
 */
export function getSchemesByState(state: string): Scheme[] {
  if (!state || state === 'All States & UTs') {
    return activeDataset;
  }
  return activeDataset.filter(
    (s) => s.applicableStates.length === 0 || s.applicableStates.includes(state)
  );
}

/**
 * Retrieves only Central / National schemes that apply across all states and Union Territories.
 */
export function getNationalSchemes(): Scheme[] {
  return activeDataset.filter((s) => s.applicableStates.length === 0);
}

/**
 * Retrieves state-specific schemes (schemes with designated regional jurisdiction).
 * If a state is specified, returns schemes restricted to that state.
 */
export function getStateSpecificSchemes(state?: string): Scheme[] {
  if (state && state !== 'All States & UTs') {
    return activeDataset.filter((s) => s.applicableStates.includes(state));
  }
  return activeDataset.filter((s) => s.applicableStates.length > 0);
}

/**
 * Retrieves all curated South India entrepreneur schemes.
 */
export function getSouthIndiaSchemes(): Scheme[] {
  return SOUTH_INDIA_SCHEMES;
}

/**
 * Retrieves schemes by operational scope: 'NATIONAL' or 'STATE_SPECIFIC'.
 */
export function getSchemesByScope(scope: SchemeScope, schemesPool: Scheme[] = activeDataset): Scheme[] {
  return schemesPool.filter((s) => getSchemeScope(s) === scope);
}

/**
 * Retrieves schemes matching a normalized taxonomy category (e.g., 'MSME', 'Startup', 'Women Entrepreneurship').
 */
export function getSchemesByNormalizedCategory(
  category: NormalizedSchemeCategory,
  schemesPool: Scheme[] = activeDataset
): Scheme[] {
  return schemesPool.filter((s) => getSchemeCategories(s).includes(category));
}

/**
 * Retrieves schemes by financial instrument / funding type.
 */
export function getSchemesByFundingType(
  type: SchemeType,
  schemesPool: Scheme[] = activeDataset
): Scheme[] {
  return schemesPool.filter((s) => s.schemeType === type);
}

/**
 * Retrieves schemes by standardized statutory verification status.
 */
export function getSchemesByVerificationStatus(
  status: SchemeVerificationStatus,
  schemesPool: Scheme[] = activeDataset
): Scheme[] {
  const target = String(status).toUpperCase();
  return schemesPool.filter((s) => {
    const sStatus = getSchemeVerificationStatus(s);
    return sStatus === target;
  });
}

/**
 * Retrieves schemes matching a designated business domain or trade type.
 */

/**
 * Retrieves schemes targeting a designated social category.
 */

/**
 * Retrieves schemes matching a designated industrial sector.
 */

/**
 * Case-insensitive search across scheme name, short code, ministry, tags, categories, and description.
 */
export function searchSchemes(query: string, schemesPool: Scheme[] = activeDataset): Scheme[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return schemesPool;

  return schemesPool.filter((s) => {
    const inName = s.name.toLowerCase().includes(trimmed);
    const inShortCode = s.shortCode.toLowerCase().includes(trimmed);
    const inMinistry = s.sponsoringMinistry.toLowerCase().includes(trimmed);
    const inDesc = s.description ? s.description.toLowerCase().includes(trimmed) : false;
    const inBenefit = s.benefitSummary ? s.benefitSummary.toLowerCase().includes(trimmed) : false;
    const inTags = s.tags ? s.tags.some((t) => t.toLowerCase().includes(trimmed)) : false;
    const inCategories = getSchemeCategories(s).some((c) => c.toLowerCase().includes(trimmed));
    return inName || inShortCode || inMinistry || inDesc || inBenefit || inTags || inCategories;
  });
}

/**
 * Advanced multi-criteria search supporting combined queries across text, state, scope, sector,
 * business type, normalized category, funding type, and verification status.
 */
export function searchSchemesAdvanced(
  filters: SchemeSearchFilters,
  schemesPool: Scheme[] = activeDataset
): Scheme[] {
  let results = schemesPool;

  if (filters.query && filters.query.trim()) {
    results = searchSchemes(filters.query, results);
  }

  if (filters.state && filters.state !== 'All States & UTs') {
    results = results.filter(
      (s) => s.applicableStates.length === 0 || s.applicableStates.includes(filters.state!)
    );
  }

  if (filters.scope) {
    results = results.filter((s) => getSchemeScope(s) === filters.scope);
  }

  if (filters.sector) {
    results = results.filter((s) => {
      if (s.intelligence?.targeting?.sector) {
        return s.intelligence.targeting.sector.includes(filters.sector!);
      }
      return true;
    });
  }

  if (filters.businessType) {
    results = results.filter((s) => s.targetBusinessTypes.includes(filters.businessType!));
  }

  if (filters.category) {
    results = results.filter((s) => getSchemeCategories(s).includes(filters.category!));
  }

  if (filters.fundingType) {
    results = results.filter((s) => s.schemeType === filters.fundingType);
  }

  if (filters.verificationStatus) {
    const targetStatus = String(filters.verificationStatus).toUpperCase();
    results = results.filter((s) => getSchemeVerificationStatus(s) === targetStatus);
  }

  return results;
}

/**
 * Returns total count of production-active schemes in the database.
 */

/**
 * Returns comprehensive Phase 2 dataset metadata.
 */
export function getDatasetMetadata(): DatasetMetadata {
  return calculateDatasetMetadata(activeDataset);
}

/**
 * Returns automated data completeness metrics report across all active schemes.
 */
export function getCompletenessReport(): CompletenessReport {
  return generateCompletenessReport(activeDataset);
}

// ==========================================
// PHASE 2.5 — DATA TRUST LAYER QUERY METHODS
// ==========================================

/**
 * Retrieves schemes with full official government verification.
 */
export function getVerifiedSchemes(schemesPool: Scheme[] = activeDataset): Scheme[] {
  return schemesPool.filter((s) => {
    const profile = s.trustProfile || deriveSchemeTrustProfile(s);
    return profile.verification.status === 'VERIFIED';
  });
}

/**
 * Retrieves schemes whose verification is DUE_FOR_REVIEW or OUTDATED (historical > 1 year).
 */
export function getSchemesNeedingReview(schemesPool: Scheme[] = activeDataset): Scheme[] {
  return schemesPool.filter((s) => {
    const profile = s.trustProfile || deriveSchemeTrustProfile(s);
    return profile.freshness.status === 'DUE_FOR_REVIEW' || profile.freshness.status === 'OUTDATED';
  });
}

/**
 * Retrieves schemes matching a specific freshness status relative to September 2026.
 */

/**
 * Retrieves schemes matching a specific confidence tier (HIGH, MEDIUM, LOW, UNKNOWN).
 */

/**
 * Returns the active machine-readable data review queue for content auditors.
 */
export function getReviewQueue(): ReviewQueueItem[] {
  return generateReviewQueue(activeDataset);
}

/**
 * Generates the complete programmatic Data Quality & Trust Audit Report.
 */
export function getDataQualityAudit(): DataQualityAuditReport {
  return generateDataQualityAuditReport(activeDataset);
}


