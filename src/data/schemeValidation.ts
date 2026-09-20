/**
 * YOJANA SETU V2 — SCHEME DATA QUALITY VALIDATION ENGINE
 *
 * Strict, deterministic validation for scheme records to ensure statutory accuracy,
 * mathematical validity, and data integrity prior to ingestion, indexing, or ranking.
 */

import { Scheme, SocialCategory, BusinessType } from '../types';
import { INDIAN_STATES } from './schemes';

interface SchemeValidationError {
  schemeId: string;
  field: string;
  message: string;
  code: string;
}

interface SchemeValidationWarning {
  schemeId: string;
  field: string;
  message: string;
  code: string;
}

interface SchemeValidationResult {
  schemeId: string;
  isValid: boolean;
  errors: SchemeValidationError[];
  warnings: SchemeValidationWarning[];
}

export interface DatabaseValidationResult {
  isValid: boolean;
  totalSchemes: number;
  validSchemesCount: number;
  invalidSchemesCount: number;
  errors: SchemeValidationError[];
  warnings: SchemeValidationWarning[];
  duplicateIds: string[];
}

const VALID_CATEGORIES: Set<SocialCategory> = new Set([
  'SC',
  'ST',
  'OBC',
  'General',
  'Woman',
  'Minority',
]);

const VALID_BUSINESS_TYPES: Set<BusinessType> = new Set([
  'trading',
  'manufacturing',
  'services',
  'agri',
  'handicraft',
  'food',
  'tech',
]);

const VALID_VERIFICATION_STATUSES = new Set([
  'verified',
  'needs_review',
  'outdated',
  'inactive',
  'unknown',
  'VERIFIED',
  'PARTIALLY_VERIFIED',
  'UNVERIFIED',
]);

const VALID_SCOPES = new Set(['NATIONAL', 'STATE_SPECIFIC']);

const URL_PATTERN = /^https?:\/\/.+/i;

/**
 * Validates a single Scheme record against statutory, mathematical, and schema rules.
 */
export function validateScheme(scheme: Scheme): SchemeValidationResult {
  const errors: SchemeValidationError[] = [];
  const warnings: SchemeValidationWarning[] = [];
  const schemeId = scheme?.id || 'UNKNOWN_ID';

  // 1. Identity & Mandatory Identifiers
  if (!scheme) {
    return {
      schemeId: 'NULL_RECORD',
      isValid: false,
      errors: [{ schemeId: 'NULL_RECORD', field: 'root', message: 'Scheme record is null or undefined', code: 'ERR_NULL_RECORD' }],
      warnings: [],
    };
  }

  if (!scheme.id || typeof scheme.id !== 'string' || scheme.id.trim() === '') {
    errors.push({
      schemeId,
      field: 'id',
      message: 'Scheme ID is missing or empty',
      code: 'ERR_MISSING_ID',
    });
  } else if (/\s/.test(scheme.id)) {
    errors.push({
      schemeId,
      field: 'id',
      message: `Scheme ID '${scheme.id}' contains whitespace characters; must be a clean slug`,
      code: 'ERR_INVALID_ID_SLUG',
    });
  }

  if (!scheme.name || typeof scheme.name !== 'string' || scheme.name.trim().length < 5) {
    errors.push({
      schemeId,
      field: 'name',
      message: 'Scheme name is missing, empty, or too short (minimum 5 characters)',
      code: 'ERR_INVALID_NAME',
    });
  }

  if (!scheme.shortCode || typeof scheme.shortCode !== 'string' || scheme.shortCode.trim() === '') {
    errors.push({
      schemeId,
      field: 'shortCode',
      message: 'Scheme short code is missing or empty',
      code: 'ERR_MISSING_SHORT_CODE',
    });
  }

  if (!scheme.sponsoringMinistry || typeof scheme.sponsoringMinistry !== 'string' || scheme.sponsoringMinistry.trim() === '') {
    errors.push({
      schemeId,
      field: 'sponsoringMinistry',
      message: 'Sponsoring ministry is missing or empty',
      code: 'ERR_MISSING_MINISTRY',
    });
  }

  // 2. Official Portal URL & Verification Source
  if (!scheme.officialPortalUrl || typeof scheme.officialPortalUrl !== 'string') {
    errors.push({
      schemeId,
      field: 'officialPortalUrl',
      message: 'Official portal URL is missing',
      code: 'ERR_MISSING_PORTAL_URL',
    });
  } else if (!URL_PATTERN.test(scheme.officialPortalUrl.trim())) {
    errors.push({
      schemeId,
      field: 'officialPortalUrl',
      message: `Official portal URL '${scheme.officialPortalUrl}' is not a valid HTTP/HTTPS URL`,
      code: 'ERR_INVALID_PORTAL_URL',
    });
  }

  // 3. Financial Range & Mathematical Sanity
  if (typeof scheme.minAmount !== 'number' || isNaN(scheme.minAmount) || scheme.minAmount < 0) {
    errors.push({
      schemeId,
      field: 'minAmount',
      message: `Minimum funding amount must be a non-negative number, got ${scheme.minAmount}`,
      code: 'ERR_INVALID_MIN_AMOUNT',
    });
  }

  if (typeof scheme.maxAmount !== 'number' || isNaN(scheme.maxAmount) || scheme.maxAmount <= 0) {
    errors.push({
      schemeId,
      field: 'maxAmount',
      message: `Maximum funding amount must be a positive number greater than 0, got ${scheme.maxAmount}`,
      code: 'ERR_INVALID_MAX_AMOUNT',
    });
  }

  if (
    typeof scheme.minAmount === 'number' &&
    typeof scheme.maxAmount === 'number' &&
    scheme.minAmount > scheme.maxAmount
  ) {
    errors.push({
      schemeId,
      field: 'fundingRange',
      message: `Minimum funding amount (₹${scheme.minAmount}) cannot exceed maximum funding amount (₹${scheme.maxAmount})`,
      code: 'ERR_MIN_EXCEEDS_MAX_AMOUNT',
    });
  }

  if (!scheme.fundingRangeText || typeof scheme.fundingRangeText !== 'string' || scheme.fundingRangeText.trim() === '') {
    warnings.push({
      schemeId,
      field: 'fundingRangeText',
      message: 'Scheme is missing human-readable fundingRangeText representation',
      code: 'WARN_MISSING_FUNDING_TEXT',
    });
  }

  // Subsidy percentage checks (0 to 100)
  if (scheme.subsidyRatePercent !== undefined) {
    if (
      typeof scheme.subsidyRatePercent !== 'number' ||
      isNaN(scheme.subsidyRatePercent) ||
      scheme.subsidyRatePercent < 0 ||
      scheme.subsidyRatePercent > 100
    ) {
      errors.push({
        schemeId,
        field: 'subsidyRatePercent',
        message: `Subsidy rate must be between 0% and 100%, got ${scheme.subsidyRatePercent}%`,
        code: 'ERR_INVALID_SUBSIDY_PERCENTAGE',
      });
    }
  }

  // Interest rate checks (0% to 50%)
  if (typeof scheme.baseInterestRate !== 'number' || isNaN(scheme.baseInterestRate) || scheme.baseInterestRate < 0 || scheme.baseInterestRate > 50) {
    errors.push({
      schemeId,
      field: 'baseInterestRate',
      message: `Base interest rate must be between 0% and 50%, got ${scheme.baseInterestRate}%`,
      code: 'ERR_INVALID_INTEREST_RATE',
    });
  }

  // 4. Statutory Age Range
  if (typeof scheme.minAge !== 'number' || isNaN(scheme.minAge) || scheme.minAge < 14 || scheme.minAge > 100) {
    errors.push({
      schemeId,
      field: 'minAge',
      message: `Minimum eligible age must be between 14 and 100 years, got ${scheme.minAge}`,
      code: 'ERR_INVALID_MIN_AGE',
    });
  }

  if (typeof scheme.maxAge !== 'number' || isNaN(scheme.maxAge) || scheme.maxAge < 14 || scheme.maxAge > 100) {
    errors.push({
      schemeId,
      field: 'maxAge',
      message: `Maximum eligible age must be between 14 and 100 years, got ${scheme.maxAge}`,
      code: 'ERR_INVALID_MAX_AGE',
    });
  }

  if (typeof scheme.minAge === 'number' && typeof scheme.maxAge === 'number' && scheme.minAge > scheme.maxAge) {
    errors.push({
      schemeId,
      field: 'ageRange',
      message: `Minimum age (${scheme.minAge}) cannot exceed maximum age (${scheme.maxAge})`,
      code: 'ERR_MIN_EXCEEDS_MAX_AGE',
    });
  }

  // 5. Target Categories & Business Types
  if (!Array.isArray(scheme.targetCategories) || scheme.targetCategories.length === 0) {
    errors.push({
      schemeId,
      field: 'targetCategories',
      message: 'Target social categories list cannot be empty',
      code: 'ERR_EMPTY_TARGET_CATEGORIES',
    });
  } else {
    for (const cat of scheme.targetCategories) {
      if (!VALID_CATEGORIES.has(cat)) {
        errors.push({
          schemeId,
          field: 'targetCategories',
          message: `Unknown social category '${cat}' specified`,
          code: 'ERR_UNKNOWN_CATEGORY',
        });
      }
    }
  }

  if (!Array.isArray(scheme.targetBusinessTypes) || scheme.targetBusinessTypes.length === 0) {
    errors.push({
      schemeId,
      field: 'targetBusinessTypes',
      message: 'Target business types list cannot be empty',
      code: 'ERR_EMPTY_BUSINESS_TYPES',
    });
  } else {
    for (const bt of scheme.targetBusinessTypes) {
      if (!VALID_BUSINESS_TYPES.has(bt)) {
        errors.push({
          schemeId,
          field: 'targetBusinessTypes',
          message: `Unknown business type '${bt}' specified`,
          code: 'ERR_UNKNOWN_BUSINESS_TYPE',
        });
      }
    }
  }

  // 6. Income Ceiling
  if (typeof scheme.maxAnnualIncomeCap !== 'number' || isNaN(scheme.maxAnnualIncomeCap) || scheme.maxAnnualIncomeCap < 0) {
    errors.push({
      schemeId,
      field: 'maxAnnualIncomeCap',
      message: `Income ceiling must be a non-negative number (0 denotes no limit), got ${scheme.maxAnnualIncomeCap}`,
      code: 'ERR_INVALID_INCOME_CAP',
    });
  }

  // 7. Applicable States
  if (!Array.isArray(scheme.applicableStates)) {
    errors.push({
      schemeId,
      field: 'applicableStates',
      message: 'Applicable states must be an array (empty array denotes All States & UTs)',
      code: 'ERR_INVALID_STATES_ARRAY',
    });
  } else if (scheme.applicableStates.length > 0) {
    const validStatesSet = new Set(INDIAN_STATES);
    for (const stateName of scheme.applicableStates) {
      if (!validStatesSet.has(stateName) && stateName !== 'All States & UTs') {
        warnings.push({
          schemeId,
          field: 'applicableStates',
          message: `State '${stateName}' does not match standard Indian state/UT registry`,
          code: 'WARN_NONSTANDARD_STATE',
        });
      }
    }
  }

  // 8. Required Documents
  if (!Array.isArray(scheme.requiredDocuments) || scheme.requiredDocuments.length === 0) {
    warnings.push({
      schemeId,
      field: 'requiredDocuments',
      message: 'Scheme specifies no required documents checklist',
      code: 'WARN_EMPTY_REQUIRED_DOCUMENTS',
    });
  }

  // 9. Governance & Verification Metadata
  if (!scheme.lastVerifiedDate || typeof scheme.lastVerifiedDate !== 'string' || scheme.lastVerifiedDate.trim() === '') {
    warnings.push({
      schemeId,
      field: 'lastVerifiedDate',
      message: 'Scheme is missing lastVerifiedDate statutory timestamp',
      code: 'WARN_MISSING_VERIFICATION_DATE',
    });
  }

  // Intelligence governance layer checks (if extended intelligence is present)
  if (scheme.intelligence?.governance) {
    const gov = scheme.intelligence.governance;
    if (!VALID_VERIFICATION_STATUSES.has(gov.verificationStatus)) {
      errors.push({
        schemeId,
        field: 'intelligence.governance.verificationStatus',
        message: `Invalid verification status '${gov.verificationStatus}'`,
        code: 'ERR_INVALID_VERIFICATION_STATUS',
      });
    }
    if (!gov.officialSourceUrl || !URL_PATTERN.test(gov.officialSourceUrl)) {
      errors.push({
        schemeId,
        field: 'intelligence.governance.officialSourceUrl',
        message: `Governance officialSourceUrl '${gov.officialSourceUrl}' is invalid`,
        code: 'ERR_INVALID_SOURCE_URL',
      });
    }
    if (!gov.sourceName || gov.sourceName.trim() === '') {
      warnings.push({
        schemeId,
        field: 'intelligence.governance.sourceName',
        message: 'Governance sourceName is empty',
        code: 'WARN_EMPTY_SOURCE_NAME',
      });
    }
  }

  // 10. Phase 2 Scope & Categorization
  if (scheme.scope && !VALID_SCOPES.has(scheme.scope)) {
    errors.push({
      schemeId,
      field: 'scope',
      message: `Invalid scheme scope '${scheme.scope}'. Must be 'NATIONAL' or 'STATE_SPECIFIC'`,
      code: 'ERR_INVALID_SCOPE',
    });
  }

  if (scheme.sourceProvenance) {
    const prov = scheme.sourceProvenance;
    if (!VALID_VERIFICATION_STATUSES.has(prov.verificationStatus)) {
      errors.push({
        schemeId,
        field: 'sourceProvenance.verificationStatus',
        message: `Invalid sourceProvenance verificationStatus '${prov.verificationStatus}'`,
        code: 'ERR_INVALID_PROVENANCE_STATUS',
      });
    }
    if (!prov.officialSourceUrl || !URL_PATTERN.test(prov.officialSourceUrl)) {
      errors.push({
        schemeId,
        field: 'sourceProvenance.officialSourceUrl',
        message: `sourceProvenance officialSourceUrl '${prov.officialSourceUrl}' is invalid`,
        code: 'ERR_INVALID_PROVENANCE_URL',
      });
    }
    if (prov.priorityLevel < 1 || prov.priorityLevel > 5) {
      errors.push({
        schemeId,
        field: 'sourceProvenance.priorityLevel',
        message: `sourceProvenance priorityLevel must be between 1 and 5, got ${prov.priorityLevel}`,
        code: 'ERR_INVALID_PRIORITY_LEVEL',
      });
    }
  }

  return {
    schemeId,
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates an entire collection of schemes, enforcing cross-record integrity
 * such as duplicate ID detection, unique identifier checks, and overall readiness.
 */
export function validateSchemesDatabase(schemes: Scheme[]): DatabaseValidationResult {
  const allErrors: SchemeValidationError[] = [];
  const allWarnings: SchemeValidationWarning[] = [];
  const seenIds = new Map<string, number>();
  const duplicateIds: string[] = [];

  let validCount = 0;
  let invalidCount = 0;

  for (const scheme of schemes) {
    const id = scheme?.id;
    if (id) {
      const count = (seenIds.get(id) || 0) + 1;
      seenIds.set(id, count);
      if (count === 2) {
        duplicateIds.push(id);
      }
    }

    const res = validateScheme(scheme);
    if (res.isValid) {
      validCount++;
    } else {
      invalidCount++;
      allErrors.push(...res.errors);
    }
    allWarnings.push(...res.warnings);
  }

  // Register errors for duplicate IDs
  for (const dupId of duplicateIds) {
    allErrors.push({
      schemeId: dupId,
      field: 'id',
      message: `Duplicate scheme ID '${dupId}' found in database (${seenIds.get(dupId)} occurrences)`,
      code: 'ERR_DUPLICATE_SCHEME_ID',
    });
  }

  const isDatabaseValid = allErrors.length === 0;

  return {
    isValid: isDatabaseValid,
    totalSchemes: schemes.length,
    validSchemesCount: validCount,
    invalidSchemesCount: invalidCount,
    errors: allErrors,
    warnings: allWarnings,
    duplicateIds,
  };
}
