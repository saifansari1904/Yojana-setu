/**
 * YOJANA SETU V2 — SOUTH INDIA SCHEME MIGRATION TEST SUITE
 *
 * Verifies:
 * 1. Correct ingestion and statutory compliance of 26 migrated South Indian schemes
 * 2. State-level eligibility isolation (KA, KL, TN, TS, AP)
 * 3. Categorical targeting (Women, SC/ST, OBC, General)
 * 4. Deterministic matching engine accuracy for South Indian entrepreneur profiles
 */

import { SCHEMES_DATABASE } from './schemes';
import { SOUTH_INDIA_SCHEMES } from './southIndiaSchemes';
import { validateSchemesDatabase } from './schemeValidation';
import { evaluateSchemeEligibility, rankSchemesForProfile } from '../utils/matchingEngine';
import { UserProfile } from '../types';

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

console.log('\n--- RUNNING SOUTH INDIA DATASET VERIFICATION SUITE ---\n');

// Test 1: Complete South India dataset is valid
{
  const result = validateSchemesDatabase(SOUTH_INDIA_SCHEMES);
  assert(result.isValid === true, 'Test 1: South India schemes pass validation with zero errors');
  assert(result.totalSchemes === 26, 'Test 1: Exactly 26 newly migrated schemes validated');
  assert(result.duplicateIds.length === 0, 'Test 1: Zero duplicate IDs in South India dataset');
}

// Test 2: State-wise scheme count distribution
{
  const ka = SOUTH_INDIA_SCHEMES.filter((s) => s.applicableStates.includes('Karnataka'));
  const kl = SOUTH_INDIA_SCHEMES.filter((s) => s.applicableStates.includes('Kerala'));
  const tn = SCHEMES_DATABASE.filter((s) => s.applicableStates.includes('Tamil Nadu'));
  const ts = SOUTH_INDIA_SCHEMES.filter((s) => s.applicableStates.includes('Telangana'));
  const ap = SOUTH_INDIA_SCHEMES.filter((s) => s.applicableStates.includes('Andhra Pradesh'));

  assert(ka.length === 8, `Test 2: Karnataka has 8 schemes (found ${ka.length})`);
  assert(kl.length === 6, `Test 2: Kerala has 6 schemes (found ${kl.length})`);
  assert(tn.length === 5, `Test 2: Tamil Nadu has 5 total schemes including NEEDS (found ${tn.length})`);
  assert(ts.length === 5, `Test 2: Telangana has 5 schemes (found ${ts.length})`);
  assert(ap.length === 3, `Test 2: Andhra Pradesh has 3 schemes (found ${ap.length})`);
}

// Test 3: Karnataka Woman Entrepreneur matches Udyogini Scheme
{
  const profile: UserProfile = {
    category: 'Woman',
    age: 30,
    annualIncome: 120000,
    businessType: 'services',
    state: 'Karnataka',
  };

  const udyogini = SCHEMES_DATABASE.find((s) => s.id === 'karnataka-udyogini')!;
  const res = evaluateSchemeEligibility(udyogini, profile, 'en');
  assert(res.isEligible === true, 'Test 3: Karnataka woman is eligible for Udyogini Scheme');
  assert(res.matchPercentage === 100, 'Test 3: Udyogini match percentage is 100%');
}

// Test 4: Kerala Startup profile matches KSUM Seed Support
{
  const profile: UserProfile = {
    category: 'General',
    age: 27,
    annualIncome: 400000,
    businessType: 'tech',
    state: 'Kerala',
  };

  const ksum = SCHEMES_DATABASE.find((s) => s.id === 'kerala-startup-mission')!;
  const res = evaluateSchemeEligibility(ksum, profile, 'en');
  assert(res.isEligible === true, 'Test 4: Kerala tech founder is eligible for KSUM Seed Support');
}

// Test 5: Telangana Dalit Entrepreneur matches T-PRIDE
{
  const profile: UserProfile = {
    category: 'SC',
    age: 35,
    annualIncome: 500000,
    businessType: 'manufacturing',
    state: 'Telangana',
  };

  const tpride = SCHEMES_DATABASE.find((s) => s.id === 'ts-tpride')!;
  const res = evaluateSchemeEligibility(tpride, profile, 'en');
  assert(res.isEligible === true, 'Test 5: Telangana SC manufacturer is eligible for T-PRIDE');
}

// Test 6: Andhra Pradesh Street Vendor matches Jagananna Thodu
{
  const profile: UserProfile = {
    category: 'OBC',
    age: 40,
    annualIncome: 100000,
    businessType: 'trading',
    state: 'Andhra Pradesh',
  };

  const thodu = SCHEMES_DATABASE.find((s) => s.id === 'ap-jagananna-thodu')!;
  const res = evaluateSchemeEligibility(thodu, profile, 'en');
  assert(res.isEligible === true, 'Test 6: AP petty trader is eligible for Jagananna Thodu');
}

// Test 7: State isolation — Karnataka scheme rejected for Andhra Pradesh resident
{
  const profile: UserProfile = {
    category: 'General',
    age: 30,
    annualIncome: 300000,
    businessType: 'manufacturing',
    state: 'Andhra Pradesh',
  };

  const kaMsme = SCHEMES_DATABASE.find((s) => s.id === 'karnataka-msme-subsidy')!;
  const res = evaluateSchemeEligibility(kaMsme, profile, 'en');
  assert(res.isEligible === false, 'Test 7: Karnataka MSME subsidy rejects Andhra Pradesh resident');
  assert(res.mandatoryCriteriaSatisfied === false, 'Test 7: State mandatory criteria marked unsatisfied');
}

console.log(`\nSOUTH INDIA TEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
if (failed > 0) {
  process.exit(1);
}
