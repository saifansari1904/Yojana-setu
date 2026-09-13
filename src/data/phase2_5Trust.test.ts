/**
 * YOJANA SETU — PHASE 2.5 GOVERNMENT DATA TRUST & FRESHNESS TEST SUITE
 *
 * Verifies:
 * 1. 6-level source hierarchy classification
 * 2. URL safety & official government domain checks
 * 3. Dynamic freshness calculation relative to September 2026
 * 4. Data Quality Audit report & health score calculation
 * 5. Automated Data Review Queue prioritization
 * 6. Repository Phase 2.5 query methods
 * 7. Invariant: Zero impact on matching engine scores & weights
 */

import { SCHEMES_DATABASE } from './schemes';
import { normalizeScheme } from '../lib/data/normalization';
import {
  parseGovernmentDate,
  calculateFreshness,
  classifyUrlSafety,
  classifySourceHierarchy,
  calculateConfidenceLevel,
  deriveSchemeTrustProfile,
  generateReviewQueue,
  generateDataQualityAuditReport,
  SYSTEM_REFERENCE_DATE,
} from '../lib/data/trustEngine';
import {
  getVerifiedSchemes,
  getSchemesNeedingReview,
  getReviewQueue,
  getDataQualityAudit,
} from '../lib/data/schemeRepository';
import { rankSchemesForProfile, evaluateSchemeEligibility } from '../utils/matchingEngine';
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

console.log('\n======================================================');
console.log('--- RUNNING YOJANA SETU PHASE 2.5 TRUST TEST SUITE ---');
console.log('======================================================\n');

// -----------------------------------------------------------
// 1. DATE PARSING & FRESHNESS CALCULATOR
// -----------------------------------------------------------
{
  const d1 = parseGovernmentDate('2026-03-15');
  assert(d1 !== null && d1.getFullYear() === 2026, 'T1: Standard ISO date parsed correctly');

  const d2 = parseGovernmentDate('15 August 2024');
  assert(d2 !== null && d2.getFullYear() === 2024 && d2.getMonth() === 7, 'T2: Indian gazette date parsed correctly');

  const d3 = parseGovernmentDate('');
  assert(d3 === null, 'T3: Empty date string returns null');

  // Freshness relative to 2026-09-13
  const freshCurrent = calculateFreshness('2026-07-01', '2026-09-13');
  assert(freshCurrent.status === 'CURRENT', 'T4: Verified 2 months ago is CURRENT (< 180 days)');

  const freshDue = calculateFreshness('2025-11-01', '2026-09-13');
  assert(freshDue.status === 'DUE_FOR_REVIEW', 'T5: Verified 10 months ago is DUE_FOR_REVIEW (181-365 days)');

  const freshOutdated = calculateFreshness('2024-08-15', '2026-09-13');
  assert(freshOutdated.status === 'OUTDATED', 'T6: Verified in 2024 (> 1 year ago) is OUTDATED');

  const freshUnknown = calculateFreshness(null, '2026-09-13');
  assert(freshUnknown.status === 'UNKNOWN', 'T7: Missing date returns UNKNOWN');
}

// -----------------------------------------------------------
// 2. URL SAFETY & SOURCE HIERARCHY
// -----------------------------------------------------------
{
  assert(
    classifyUrlSafety('https://msme.gov.in/schemes') === 'OFFICIAL_GOVERNMENT',
    'T8: .gov.in URL classified as OFFICIAL_GOVERNMENT'
  );
  assert(
    classifyUrlSafety('https://karnataka.gov.in/portal') === 'OFFICIAL_GOVERNMENT',
    'T9: State .gov.in classified as OFFICIAL_GOVERNMENT'
  );
  assert(
    classifyUrlSafety('https://www.cgtmse.in/Default.aspx') === 'IMPLEMENTING_AGENCY',
    'T10: CGTMSE domain classified as IMPLEMENTING_AGENCY'
  );
  assert(
    classifyUrlSafety('https://sahay.aggregator.org') === 'SECONDARY_AGGREGATOR',
    'T11: Aggregator URL classified as SECONDARY_AGGREGATOR'
  );
  assert(
    classifyUrlSafety('invalid-url') === 'SUSPICIOUS_OR_INVALID',
    'T12: Malformed URL classified as SUSPICIOUS_OR_INVALID'
  );
}

// -----------------------------------------------------------
// 3. SOURCE HIERARCHY LEVEL DETECTION
// -----------------------------------------------------------
{
  const centralScheme = SCHEMES_DATABASE.find((s) => s.id === 'pmegp-msme')!;
  const centralLevel = classifySourceHierarchy(centralScheme);
  assert(centralLevel === 1, 'T13: PMEGP classified as Level 1 (Central Govt Portal)');

  const stateScheme = SCHEMES_DATABASE.find((s) => s.id === 'karnataka-msme-subsidy')!;
  const stateLevel = classifySourceHierarchy(stateScheme);
  assert(stateLevel === 2, 'T14: Karnataka state scheme classified as Level 2 (State Govt Portal)');

  const cgtmseScheme = SCHEMES_DATABASE.find((s) => s.id === 'cgtmse-guarantee')!;
  const cgtmseLevel = classifySourceHierarchy(cgtmseScheme);
  assert(cgtmseLevel === 4, 'T15: CGTMSE classified as Level 4 (Statutory Implementing Agency)');
}

// -----------------------------------------------------------
// 4. CONFIDENCE LEVEL DERIVATION
// -----------------------------------------------------------
{
  const highConf = calculateConfidenceLevel('VERIFIED', 'CURRENT', 'OFFICIAL_GOVERNMENT');
  assert(highConf === 'HIGH', 'T16: Verified + Current + Official Gov is HIGH confidence');

  const medConf = calculateConfidenceLevel('PARTIALLY_VERIFIED', 'CURRENT', 'OFFICIAL_GOVERNMENT');
  assert(medConf === 'MEDIUM', 'T17: Partially verified + Official Gov is MEDIUM confidence');

  const lowConf = calculateConfidenceLevel('OUTDATED', 'OUTDATED', 'OFFICIAL_GOVERNMENT');
  assert(lowConf === 'LOW', 'T18: Outdated scheme is LOW confidence');
}

// -----------------------------------------------------------
// 5. DATA QUALITY AUDIT REPORT
// -----------------------------------------------------------
{
  const audit = generateDataQualityAuditReport(SCHEMES_DATABASE, SYSTEM_REFERENCE_DATE);

  assert(audit.totalSchemes === 39, `T19: Total schemes in audit is 39 (found ${audit.totalSchemes})`);
  assert(audit.nationalSchemes === 10, `T20: National schemes count is 10 (found ${audit.nationalSchemes})`);
  assert(audit.stateSpecificSchemes === 29, `T21: State-specific schemes count is 29 (found ${audit.stateSpecificSchemes})`);
  assert(audit.dataQualityIssues.potentialDuplicates === 0, 'T22: Zero duplicate scheme IDs');
  assert(audit.dataQualityIssues.missingOfficialUrl === 0, 'T23: Zero missing official URLs');
  assert(audit.dataQualityIssues.missingEligibility === 0, 'T24: Zero missing eligibility definitions');
  assert(audit.dataQualityIssues.malformedFinancialValues === 0, 'T25: Zero malformed financial values');
  assert(audit.overallHealthScore >= 95, `T26: Overall data health score is >= 95 (score: ${audit.overallHealthScore})`);
}

// -----------------------------------------------------------
// 6. DATA REVIEW QUEUE GENERATOR
// -----------------------------------------------------------
{
  const queue = generateReviewQueue(SCHEMES_DATABASE, SYSTEM_REFERENCE_DATE);
  assert(Array.isArray(queue), 'T27: Review queue generated as array');
  assert(queue.length > 0, `T28: Review queue identified items requiring periodic review (count: ${queue.length})`);

  // Outdated verifications should be flagged
  const outdatedItems = queue.filter((i) => i.issueType === 'OUTDATED_VERIFICATION');
  assert(outdatedItems.length > 0, 'T29: Review queue contains items with historical verification dates');
  assert(
    outdatedItems.every((i) => i.priority === 'HIGH' || i.priority === 'MEDIUM'),
    'T30: Outdated verification items have HIGH or MEDIUM priority'
  );
}

// -----------------------------------------------------------
// 7. NORMALIZATION & REPOSITORY TRUST INTEGRATION
// -----------------------------------------------------------
{
  const sample = SCHEMES_DATABASE[0];
  const normalized = normalizeScheme(sample);
  assert(normalized.trustProfile !== undefined, 'T31: normalizeScheme attaches trustProfile');
  assert(normalized.trustProfile?.source.hierarchyLevel !== undefined, 'T32: trustProfile contains hierarchyLevel');
  assert(normalized.trustProfile?.freshness.status !== undefined, 'T33: trustProfile contains freshness status');

  const verified = getVerifiedSchemes();
  assert(verified.length > 0, `T34: getVerifiedSchemes returned verified schemes (${verified.length})`);

  const needingReview = getSchemesNeedingReview();
  assert(needingReview.length > 0, `T35: getSchemesNeedingReview identified schemes needing review (${needingReview.length})`);

  const repoAudit = getDataQualityAudit();
  assert(repoAudit.totalSchemes === 39, 'T36: getDataQualityAudit via repository matches database count');
}

// -----------------------------------------------------------
// 8. CRITICAL INVARIANT: MATCHING ENGINE INVARIANCE
// -----------------------------------------------------------
{
  const testProfile: UserProfile = {
    category: 'SC',
    age: 28,
    annualIncome: 250000,
    businessType: 'manufacturing',
    state: 'Maharashtra',
  };

  const results = rankSchemesForProfile(SCHEMES_DATABASE, testProfile);
  assert(results.length === 39, 'T37: Ranking returns all 39 schemes');
  assert(results[0].matchPercentage === 100, 'T38: Top matched scheme achieves 100% when all 5 criteria match');

  // Verify that mathematical scoring is intact: 5 factors, 20% each
  const firstMatch = results[0];
  assert(firstMatch.totalFactorsCount === 5, `T39: Matching engine evaluates exactly 5 factors (found ${firstMatch.totalFactorsCount})`);
  assert(firstMatch.matchedCount === 5, `T40: Matched count is 5/5, each factor contributing 20% (100% total)`);
}

console.log(`\n------------------------------------------------------`);
console.log(`PHASE 2.5 TRUST TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`------------------------------------------------------\n`);

if (failed > 0) {
  process.exit(1);
}
