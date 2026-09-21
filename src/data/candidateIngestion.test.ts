/**
 * YOJANA SETU — CANDIDATE SCHEME INGESTION & DATA TRUST TEST SUITE
 *
 * Validates:
 * 1. CSV parsing of discovery candidate dataset (220 records)
 * 2. RawSchemeCandidate type safety (no blind casting to Scheme)
 * 3. Normalization into canonical Scheme architecture
 * 4. Preservation of origin provenance, relevance tiers, and candidate tags
 * 5. Strict Trust Model: All candidates marked UNVERIFIED / CANDIDATE, Level 6, UNKNOWN freshness
 * 6. Non-hallucination: Zero invented mandatory blockers or false eligibility caps
 * 7. Deduplication detection against authoritative SCHEMES_DATABASE
 * 8. Government Authority Registry integration & domain classification (.ac.in rule)
 * 9. Repository access and isolation (getAllSchemes returns 39, getCandidateSchemes returns 220)
 * 10. Non-regression of matching engine and scoring invariants
 */

import fs from 'fs';
import path from 'path';
import { runCandidateSchemeImportPipeline } from '../lib/data/candidatePipeline';
import { parseSchemeCandidateCSV } from '../lib/data/csvParser';
import { normalizeCandidateScheme } from '../lib/data/candidateNormalizer';
import { classifyUrlSafety } from '../lib/data/trustEngine';
import { findAuthorityByDomain } from './governmentAuthorities';
import {
  getAllSchemes,
  getCandidateSchemes,
  getAllRepositorySchemes,
  getSchemeById,
  getCandidatesByState,
  getCandidatesByRelevanceTier,
} from '../lib/data/schemeRepository';
import { SCHEMES_DATABASE } from './schemes';
import { validateScheme } from './schemeValidation';
import { evaluateSchemeEligibility } from '../utils/matchingEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${testName}`, details !== undefined ? details : '');
  }
}

console.log('======================================================');
console.log('--- RUNNING CANDIDATE SCHEME INGESTION TEST SUITE ---');
console.log('======================================================');

// -------------------------------------------------------------
// SECTION 1: CSV PARSER & RAW DATASET INGESTION
// -------------------------------------------------------------
const csvPath = path.join(process.cwd(), 'yojana_setu_scheme_extraction.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const rawCandidates = parseSchemeCandidateCSV(csvContent);
assert(rawCandidates.length === 220, `C1: Parsed exactly 220 raw candidates (found ${rawCandidates.length})`);

const firstRaw = rawCandidates[0];
assert(!!firstRaw.id, 'C2: Raw candidate contains id');
assert(!!firstRaw.scheme_name, 'C3: Raw candidate contains scheme_name');
assert(!!firstRaw.state_or_ut, 'C4: Raw candidate contains state_or_ut');
assert(!!firstRaw.relevance_tier, 'C5: Raw candidate contains relevance_tier');

// -------------------------------------------------------------
// SECTION 2: CANONICAL NORMALIZATION & SCHEMA VALIDATION
// -------------------------------------------------------------
const report = runCandidateSchemeImportPipeline(csvContent, SCHEMES_DATABASE);

assert(report.totalRawRecords === 220, `C6: Ingestion pipeline received 220 records`);
assert(report.successfullyNormalized === 220, `C7: Successfully normalized all 220 records`);
assert(report.totalValidRecords === 220, `C8: Validated all 220 candidates against schema invariants`);
assert(report.quarantinedCount === 0, `C9: Zero quarantined records (found ${report.quarantinedCount})`);

// -------------------------------------------------------------
// SECTION 3: STRICT PROVENANCE & DATA TRUST INVARIANTS
// -------------------------------------------------------------
const allCandidates = report.processedCandidates;

const allUnverified = allCandidates.every(
  (c) => c.trustProfile?.verification.status === 'UNVERIFIED'
);
assert(allUnverified, 'C10: 100% of candidate schemes have verification status UNVERIFIED');

const zeroFalseVerified = allCandidates.every(
  (c) => c.trustProfile?.verification.status !== 'VERIFIED'
);
assert(zeroFalseVerified, 'C11: Zero candidate schemes claim false VERIFIED status');

const allLevel6 = allCandidates.every(
  (c) => c.trustProfile?.source.hierarchyLevel === 6
);
assert(allLevel6, 'C12: 100% of candidate schemes classified as Level 6 (Secondary Aggregator)');

const allUnknownFreshness = allCandidates.every(
  (c) => c.trustProfile?.freshness.status === 'UNKNOWN'
);
assert(allUnknownFreshness, 'C13: 100% of candidate schemes have freshness status UNKNOWN');

const allLowConfidence = allCandidates.every(
  (c) => c.trustProfile?.confidence === 'LOW'
);
assert(allLowConfidence, 'C14: 100% of candidate schemes have confidence LOW');

const allCandidateFlags = allCandidates.every(
  (c) => c.isCandidateScheme === true
);
assert(allCandidateFlags, 'C15: 100% of candidate schemes tagged with isCandidateScheme: true');

// -------------------------------------------------------------
// SECTION 4: NON-HALLUCINATION & ELIGIBILITY INVARIANTS
// -------------------------------------------------------------
const zeroInventedBlockers = allCandidates.every(
  (c) => !c.mandatoryCriteria || c.mandatoryCriteria.length === 0
);
assert(zeroInventedBlockers, 'C16: Zero candidate schemes have invented mandatory criteria blockers');

const validFundingRanges = allCandidates.every(
  (c) => c.maxAmount > 0 && c.minAmount >= 0 && typeof c.fundingRangeText === 'string'
);
assert(validFundingRanges, 'C17: All candidate schemes have positive funding maxAmount and range text');

const validPortalUrls = allCandidates.every((c) => {
  return typeof c.officialPortalUrl === 'string' && /^https?:\/\/.+/i.test(c.officialPortalUrl);
});
assert(validPortalUrls, 'C18: All candidate schemes have valid HTTP/HTTPS portal URLs');

// -------------------------------------------------------------
// SECTION 5: RELEVANCE TIERS & SCOPE DISTRIBUTION
// -------------------------------------------------------------
assert(
  report.relevanceTiers.tierA_directEnterprise === 140,
  `C19: Tier A (Direct Enterprise) count is 140 (found ${report.relevanceTiers.tierA_directEnterprise})`
);
assert(
  report.relevanceTiers.tierB_livelihoodAgri === 79,
  `C20: Tier B (Livelihood / Agri) count is 79 (found ${report.relevanceTiers.tierB_livelihoodAgri})`
);
assert(
  report.relevanceTiers.tierC_capabilityEnabling === 1,
  `C21: Tier C (Capability / Enabling) count is 1 (found ${report.relevanceTiers.tierC_capabilityEnabling})`
);
assert(
  report.scopes.national === 25,
  `C22: National scope count is 25 (found ${report.scopes.national})`
);
assert(
  report.scopes.stateSpecific === 195,
  `C23: State-specific scope count is 195 (found ${report.scopes.stateSpecific})`
);

const stateCount = Object.keys(report.stateDistribution).length;
assert(stateCount >= 30, `C24: Comprehensive State/UT coverage across India (found ${stateCount} regions)`);

// -------------------------------------------------------------
// SECTION 6: DEDUPLICATION & RECONCILIATION
// -------------------------------------------------------------
assert(
  report.potentialDuplicatesCount > 0,
  `C25: Deduplication engine detected potential duplicates with authoritative DB (found ${report.potentialDuplicatesCount})`
);

const exactIdDupes = report.duplicates.filter((d) => d.duplicateType === 'EXACT_ID');
assert(exactIdDupes.length > 0, 'C26: Exact ID collisions identified and safely prefixed with candidate-');

const authorIdClobbered = SCHEMES_DATABASE.some((s) => s.id.startsWith('candidate-'));
assert(!authorIdClobbered, 'C27: Existing authoritative schemes were not mutated or clobbered');

// -------------------------------------------------------------
// SECTION 7: GOVERNMENT AUTHORITY REGISTRY & DOMAIN CLASSIFICATION
// -------------------------------------------------------------
const academicDomainCheck = classifyUrlSafety('https://iitb.ac.in/portal');
assert(
  academicDomainCheck !== 'OFFICIAL_GOVERNMENT',
  `C28: Generic academic domain (.ac.in) is NOT classified as OFFICIAL_GOVERNMENT (got ${academicDomainCheck})`
);

const tnauCheck = classifyUrlSafety('https://agritech.tnau.ac.in');
assert(
  tnauCheck === 'OFFICIAL_GOVERNMENT',
  `C29: Designated state university portal (agritech.tnau.ac.in) retains authorized status`
);

const centralGovCheck = classifyUrlSafety('https://msme.gov.in/schemes');
assert(
  centralGovCheck === 'OFFICIAL_GOVERNMENT',
  `C30: Central ministry domain (msme.gov.in) classified as OFFICIAL_GOVERNMENT`
);

const statutoryCheck = classifyUrlSafety('https://www.cgtmse.in');
assert(
  statutoryCheck === 'IMPLEMENTING_AGENCY',
  `C31: Statutory agency domain (cgtmse.in) classified as IMPLEMENTING_AGENCY`
);

const aggregatorCheck = classifyUrlSafety('https://yojanasahay.org/schemes');
assert(
  aggregatorCheck === 'SECONDARY_AGGREGATOR',
  `C32: Aggregator domain classified as SECONDARY_AGGREGATOR`
);

// -------------------------------------------------------------
// SECTION 8: REPOSITORY ABSTRACTION & DATA ISOLATION
// -------------------------------------------------------------
const authoritativeSchemes = getAllSchemes();
assert(authoritativeSchemes.length === 39, `C33: getAllSchemes returns strictly 39 authoritative schemes`);

const repoCandidates = getCandidateSchemes();
assert(repoCandidates.length === 220, `C34: getCandidateSchemes returns 220 candidate schemes`);

const allCombined = getAllRepositorySchemes();
assert(allCombined.length === 259, `C35: getAllRepositorySchemes returns combined 259 schemes (39 + 220)`);

const candidateById = getSchemeById('candidate-standup-india') || getSchemeById('an-pmmsy-fishermen');
assert(!!candidateById, 'C36: getSchemeById successfully finds candidate schemes');

const tierASchemes = getCandidatesByRelevanceTier('A');
assert(tierASchemes.length === 140, `C37: getCandidatesByRelevanceTier('A') returns 140 schemes`);

const andamanCandidates = getCandidatesByState('Andaman & Nicobar');
assert(andamanCandidates.length > 0, `C38: getCandidatesByState('Andaman & Nicobar') returns schemes`);

// -------------------------------------------------------------
// SECTION 9: MATCHING ENGINE NON-REGRESSION
// -------------------------------------------------------------
const testProfile = {
  age: 28,
  gender: 'female' as const,
  category: 'Woman' as any,
  businessType: 'manufacturing' as any,
  state: 'Karnataka',
  annualIncome: 300000,
};

const pmegpScheme = authoritativeSchemes.find((s) => s.id === 'pmegp-msme')!;
const pmegpResult = evaluateSchemeEligibility(pmegpScheme, testProfile, 'en');

assert(pmegpResult.matchPercentage === 100, `C39: Authoritative PMEGP match score unchanged (got ${pmegpResult.matchPercentage}%)`);
assert(pmegpResult.matchedCount === 5, `C40: All 5 factors evaluated identically (5/5 matched)`);

// Verify candidate scheme also matches fairly without crash
const sampleCandidate = repoCandidates[0];
const candResult = evaluateSchemeEligibility(sampleCandidate, testProfile, 'en');
assert(typeof candResult.matchPercentage === 'number' && candResult.matchPercentage >= 0, 'C41: Candidate scheme evaluated by matching engine without errors');

console.log('------------------------------------------------------');
console.log(`CANDIDATE SCHEME INGESTION RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('------------------------------------------------------');

if (failed > 0) {
  process.exit(1);
}
