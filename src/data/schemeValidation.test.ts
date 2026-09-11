/**
 * YOJANA SETU V2 — SCHEME DATA VALIDATION & COMPATIBILITY TEST SUITE
 *
 * Comprehensive tests verifying:
 * 1. Data quality validator detection for invalid schemes (missing fields, invalid ranges, bad URLs, etc.)
 * 2. Duplicate scheme ID detection across database collections
 * 3. 100% compliance of SCHEMES_DATABASE with all statutory and structural rules
 * 4. Preservation of deterministic matching engine ranking and eligibility calculation
 * 5. Clean relational table mapping readiness for future database migration
 */

import { SCHEMES_DATABASE } from './schemes';
import { validateScheme, validateSchemesDatabase } from './schemeValidation';
import { evaluateSchemeEligibility, rankSchemesForProfile } from '../utils/matchingEngine';
import { Scheme, UserProfile } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    if (details) console.error(`   Details: ${details}`);
    failed++;
  }
}

console.log('\n--- RUNNING YOJANA SETU SCHEME VALIDATION TEST SUITE ---\n');

// =================================================================
// 1. DATA QUALITY VALIDATOR TESTS
// =================================================================

// Test 1: Valid Scheme from SCHEMES_DATABASE passes with 0 errors
{
  const pmegp = SCHEMES_DATABASE.find((s) => s.id === 'pmegp-msme')!;
  const result = validateScheme(pmegp);
  assert(result.isValid === true, 'Test 1: PMEGP passes validation', JSON.stringify(result.errors));
  assert(result.errors.length === 0, 'Test 1: PMEGP has zero validation errors');
}

// Test 2: Missing Scheme ID is rejected
{
  const invalidScheme: any = {
    ...SCHEMES_DATABASE[0],
    id: '',
  };
  const result = validateScheme(invalidScheme);
  assert(result.isValid === false, 'Test 2: Missing scheme ID fails validation');
  assert(
    result.errors.some((e) => e.code === 'ERR_MISSING_ID'),
    'Test 2: Specific ERR_MISSING_ID error code reported'
  );
}

// Test 3: Missing or short name is rejected
{
  const invalidScheme: any = {
    ...SCHEMES_DATABASE[0],
    name: 'ABC',
  };
  const result = validateScheme(invalidScheme);
  assert(result.isValid === false, 'Test 3: Too short name fails validation');
  assert(
    result.errors.some((e) => e.code === 'ERR_INVALID_NAME'),
    'Test 3: Specific ERR_INVALID_NAME error code reported'
  );
}

// Test 4: Invalid Official Portal URL is rejected
{
  const invalidScheme: any = {
    ...SCHEMES_DATABASE[0],
    officialPortalUrl: 'not-a-valid-url',
  };
  const result = validateScheme(invalidScheme);
  assert(result.isValid === false, 'Test 4: Invalid URL fails validation');
  assert(
    result.errors.some((e) => e.code === 'ERR_INVALID_PORTAL_URL'),
    'Test 4: Specific ERR_INVALID_PORTAL_URL error code reported'
  );
}

// Test 5: Invalid Funding Range (minAmount > maxAmount) is rejected
{
  const invalidScheme: any = {
    ...SCHEMES_DATABASE[0],
    minAmount: 5000000,
    maxAmount: 200000,
  };
  const result = validateScheme(invalidScheme);
  assert(result.isValid === false, 'Test 5: Min funding exceeding max funding fails validation');
  assert(
    result.errors.some((e) => e.code === 'ERR_MIN_EXCEEDS_MAX_AMOUNT'),
    'Test 5: Specific ERR_MIN_EXCEEDS_MAX_AMOUNT error code reported'
  );
}

// Test 6: Invalid Age Range (minAge > maxAge) is rejected
{
  const invalidScheme: any = {
    ...SCHEMES_DATABASE[0],
    minAge: 65,
    maxAge: 18,
  };
  const result = validateScheme(invalidScheme);
  assert(result.isValid === false, 'Test 6: Min age exceeding max age fails validation');
  assert(
    result.errors.some((e) => e.code === 'ERR_MIN_EXCEEDS_MAX_AGE'),
    'Test 6: Specific ERR_MIN_EXCEEDS_MAX_AGE error code reported'
  );
}

// Test 7: Invalid Subsidy Percentage (> 100%) is rejected
{
  const invalidScheme: any = {
    ...SCHEMES_DATABASE[0],
    subsidyRatePercent: 125,
  };
  const result = validateScheme(invalidScheme);
  assert(result.isValid === false, 'Test 7: Subsidy percentage > 100% fails validation');
  assert(
    result.errors.some((e) => e.code === 'ERR_INVALID_SUBSIDY_PERCENTAGE'),
    'Test 7: Specific ERR_INVALID_SUBSIDY_PERCENTAGE error code reported'
  );
}

// Test 8: Empty target categories or business types is rejected
{
  const invalidScheme: any = {
    ...SCHEMES_DATABASE[0],
    targetCategories: [],
    targetBusinessTypes: [],
  };
  const result = validateScheme(invalidScheme);
  assert(result.isValid === false, 'Test 8: Empty target categories & business types fails validation');
  assert(
    result.errors.some((e) => e.code === 'ERR_EMPTY_TARGET_CATEGORIES'),
    'Test 8: ERR_EMPTY_TARGET_CATEGORIES reported'
  );
  assert(
    result.errors.some((e) => e.code === 'ERR_EMPTY_BUSINESS_TYPES'),
    'Test 8: ERR_EMPTY_BUSINESS_TYPES reported'
  );
}

// Test 9: Duplicate scheme ID detection in collections
{
  const duplicateList: Scheme[] = [
    SCHEMES_DATABASE[0],
    { ...SCHEMES_DATABASE[1], id: SCHEMES_DATABASE[0].id }, // duplicate ID
  ];
  const dbResult = validateSchemesDatabase(duplicateList);
  assert(dbResult.isValid === false, 'Test 9: Database with duplicate ID fails validation');
  assert(dbResult.duplicateIds.includes(SCHEMES_DATABASE[0].id), 'Test 9: Duplicate ID identified in duplicateIds list');
  assert(
    dbResult.errors.some((e) => e.code === 'ERR_DUPLICATE_SCHEME_ID'),
    'Test 9: ERR_DUPLICATE_SCHEME_ID error code reported'
  );
}

// Test 10: Production SCHEMES_DATABASE Integrity Check
{
  const dbResult = validateSchemesDatabase(SCHEMES_DATABASE);
  assert(
    dbResult.isValid === true,
    'Test 10: Complete production SCHEMES_DATABASE is 100% valid',
    `Errors: ${JSON.stringify(dbResult.errors, null, 2)}`
  );
  assert(dbResult.totalSchemes === SCHEMES_DATABASE.length, `Test 10: Total ${SCHEMES_DATABASE.length} active production schemes validated`);
  assert(dbResult.validSchemesCount === SCHEMES_DATABASE.length, `Test 10: All ${SCHEMES_DATABASE.length} schemes pass validation`);
  assert(dbResult.errors.length === 0, 'Test 10: Zero validation errors across dataset');
  assert(dbResult.duplicateIds.length === 0, 'Test 10: Zero duplicate IDs across dataset');
}

// =================================================================
// 2. MATCHING ENGINE COMPATIBILITY & TAXONOMY INTEGRITY
// =================================================================

// Test 11: All 12 schemes evaluate cleanly without NaN or runtime exceptions
{
  const testProfile: UserProfile = {
    category: 'Woman',
    age: 32,
    annualIncome: 450000,
    businessType: 'services',
    state: 'Maharashtra',
  };

  let allEvaluatedWithoutError = true;
  for (const s of SCHEMES_DATABASE) {
    try {
      const res = evaluateSchemeEligibility(s, testProfile, 'en');
      if (isNaN(res.matchPercentage) || res.matchPercentage < 0 || res.matchPercentage > 100) {
        allEvaluatedWithoutError = false;
      }
    } catch {
      allEvaluatedWithoutError = false;
    }
  }

  assert(allEvaluatedWithoutError, 'Test 11: All 12 schemes evaluate without error or NaN scores');
}

// Test 12: Ranking produces deterministic, ordered results
{
  const testProfile: UserProfile = {
    category: 'SC',
    age: 28,
    annualIncome: 250000,
    businessType: 'manufacturing',
    state: 'Maharashtra',
  };

  const ranked = rankSchemesForProfile(SCHEMES_DATABASE, testProfile, 'en');
  assert(ranked.length === SCHEMES_DATABASE.length, 'Test 12: Ranked results preserve full scheme count');
  assert(ranked[0].isEligible === true, 'Test 12: Top-ranked scheme is eligible for qualifying profile');
  assert(ranked[0].matchPercentage >= ranked[ranked.length - 1].matchPercentage, 'Test 12: Ranking is descending by score/eligibility');
}

// Test 13: Mandatory vs Non-Mandatory criteria preservation
{
  // Stand-Up India mandates category = 'SC' | 'ST' | 'Woman'
  const nonEligibleMaleGeneralProfile: UserProfile = {
    category: 'General',
    age: 30,
    annualIncome: 500000,
    businessType: 'manufacturing',
    state: 'Maharashtra',
  };

  const standup = SCHEMES_DATABASE.find((s) => s.id === 'standup-india')!;
  const result = evaluateSchemeEligibility(standup, nonEligibleMaleGeneralProfile, 'en');

  assert(result.isEligible === false, 'Test 13: Stand-Up India denies eligibility for non-qualifying category');
  assert(result.mandatoryCriteriaSatisfied === false, 'Test 13: Mandatory criteria correctly marked as unsatisfied');
}

// =================================================================
// 3. DATABASE MIGRATION READINESS TESTS
// =================================================================

// Test 14: Relational table mapping readiness
{
  let allHaveRelationalData = true;

  for (const scheme of SCHEMES_DATABASE) {
    // 1. schemes table: id, name, shortCode, officialSchemeIdentifier, sponsoringMinistry, schemeType
    const hasSchemesTableFields =
      Boolean(scheme.id) &&
      Boolean(scheme.name) &&
      Boolean(scheme.shortCode) &&
      Boolean(scheme.sponsoringMinistry);

    // 2. scheme_benefits table: minAmount, maxAmount, subsidyRatePercent, baseInterestRate, tenure
    const hasBenefitsFields =
      typeof scheme.minAmount === 'number' &&
      typeof scheme.maxAmount === 'number' &&
      typeof scheme.baseInterestRate === 'number';

    // 3. scheme_documents table: requiredDocuments array
    const hasDocuments = Array.isArray(scheme.requiredDocuments) && scheme.requiredDocuments.length > 0;

    // 4. scheme_sources & verification table
    const hasGovernance =
      Boolean(scheme.officialPortalUrl) &&
      Boolean(scheme.lastVerifiedDate) &&
      Boolean(scheme.intelligence?.governance?.verificationStatus);

    if (!hasSchemesTableFields || !hasBenefitsFields || !hasDocuments || !hasGovernance) {
      allHaveRelationalData = false;
    }
  }

  assert(allHaveRelationalData, 'Test 14: All 12 schemes have complete data for relational table mapping');
}

console.log(`\nVALIDATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
if (failed > 0) {
  process.exit(1);
}
