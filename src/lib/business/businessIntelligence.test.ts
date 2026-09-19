import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SCHEMES_DATABASE } from '../../data/schemes';
import { UserProfile } from '../../types/user';
import {
  calculateFundingGap,
  deriveBusinessStage,
  deriveBusinessReadiness,
  calculateBusinessProfileCompleteness,
  deriveBusinessNeedProfile,
  getSchemeSupportedNeeds,
  evaluateBusinessRelevance,
} from './index';

console.log('--- RUNNING YOJANA SETU PHASE 4.1 BUSINESS INTELLIGENCE TEST SUITE ---');

// Test 1: Funding Gap Calculation (Explicit prompt specifications)
// projectCost = 12L, existing = 4L, gap = 8L
const gapPrompt1 = calculateFundingGap(1200000, 400000);
assert.strictEqual(gapPrompt1, 800000, 'Project cost 12L - Investment 4L must equal 8L gap');

// projectCost = 5L, existing = 0, gap = 5L
const gapPrompt2 = calculateFundingGap(500000, 0);
assert.strictEqual(gapPrompt2, 500000, 'Project cost 5L - Investment 0 must equal 5L gap');

// projectCost = 5L, existing = 7L, gap = 0 (Never return negative funding gap)
const gapPrompt3 = calculateFundingGap(500000, 700000);
assert.strictEqual(gapPrompt3, 0, 'Project cost 5L - Investment 7L must cap at 0 (never negative)');

const gapNegativeInput = calculateFundingGap(-500000, -200000);
assert.strictEqual(gapNegativeInput, 0, 'Negative financial inputs must safely normalize to 0');

const gapNaNInput = calculateFundingGap(NaN, NaN, NaN);
assert.strictEqual(gapNaNInput, 0, 'NaN financial inputs must safely normalize to 0');

console.log('✅ PASS: Funding gap calculations accurate, non-negative, and resilient against invalid values');

// Test 2: Business Stage Derivation
const stage1 = deriveBusinessStage({ businessStageKey: 'IDEA' });
assert.strictEqual(stage1.stage, 'IDEA');
assert.strictEqual(stage1.source, 'EXPLICIT');

const stage2 = deriveBusinessStage({ operationalStatus: 'OPERATING' });
assert.strictEqual(stage2.stage, 'EARLY_OPERATION');
assert.strictEqual(stage2.source, 'INFERRED');

const stage3 = deriveBusinessStage({});
assert.strictEqual(stage3.stage, 'IDEA');
assert.strictEqual(stage3.source, 'UNKNOWN');
console.log('✅ PASS: Business stage derived deterministically with provenance tracking');

// Test 3: Business Readiness Derivation
const readiness1 = deriveBusinessReadiness(
  {
    businessStageKey: 'NEW_BUSINESS',
    registrationStatus: 'NOT_REGISTERED',
  },
  500000
);
assert.ok(['EARLY', 'DEVELOPING', 'READY_TO_LAUNCH', 'OPERATING', 'GROWTH_READY'].includes(readiness1));
console.log('✅ PASS: Business readiness derived with statutory guidelines');

// Test 4: Profile Completeness Scoring
const completeness = calculateBusinessProfileCompleteness({
  businessType: 'manufacturing',
  businessStage: 'new',
  state: 'Karnataka',
  category: 'OBC',
  age: 28,
});
assert.ok(completeness.score > 0, 'Completeness score should be positive');
assert.ok(completeness.percentage > 0 && completeness.percentage <= 100, 'Completeness percentage within range');
console.log('✅ PASS: Profile completeness calculation operates reliably');

// Test 5: Scheme Supported Needs & Relevance Engine across all 39 production schemes
const sampleProfile: UserProfile = {
  businessType: 'manufacturing',
  businessStage: 'new',
  state: 'Karnataka',
  category: 'General',
  annualIncome: 300000,
  age: 30,
  totalProjectCost: 2500000,
  existingInvestment: 500000,
  primarySupportNeed: 'CAPITAL',
  secondarySupportNeeds: ['SUBSIDY', 'EQUIPMENT'],
};

const needProfile = deriveBusinessNeedProfile(sampleProfile);
assert.strictEqual(needProfile.fundingGap, 2000000, 'Funding gap should be 20 Lakhs');

let evaluatedCount = 0;
for (const scheme of SCHEMES_DATABASE) {
  const supportedNeeds = getSchemeSupportedNeeds(scheme);
  assert.ok(Array.isArray(supportedNeeds), `Supported needs should be array for scheme ${scheme.id}`);
  assert.ok(supportedNeeds.length > 0, `At least one supported need identified for scheme ${scheme.id}`);

  const relevance = evaluateBusinessRelevance(scheme, needProfile, 'en');
  assert.ok(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'].includes(relevance.relevanceLevel));
  assert.ok(typeof relevance.badgeLabelEn === 'string' && relevance.badgeLabelEn.length > 0);
  assert.ok(typeof relevance.badgeLabelHi === 'string' && relevance.badgeLabelHi.length > 0);
  assert.ok(typeof relevance.explanationEn === 'string' && relevance.explanationEn.length > 0);
  assert.ok(typeof relevance.explanationHi === 'string' && relevance.explanationHi.length > 0);
  evaluatedCount++;
}

assert.strictEqual(evaluatedCount, SCHEMES_DATABASE.length, 'All production schemes evaluated for business relevance');
console.log(`✅ PASS: All ${evaluatedCount} production schemes evaluated safely without error`);

// Test 6: UNKNOWN states — unknown registration, unknown business stage, unknown funding, unknown support need do NOT create false ineligibility
import { calculateMatchScore } from '../matching/matchingEngine';

const baseProfile: UserProfile = {
  category: 'OBC',
  businessType: 'manufacturing',
  state: 'Tamil Nadu',
  annualIncome: 450000,
  age: 32,
};

const unknownProfile: UserProfile = {
  ...baseProfile,
  registrationStatus: 'UNKNOWN',
  businessStageKey: undefined,
  totalProjectCost: undefined,
  existingInvestment: undefined,
  fundingRequired: undefined,
  primarySupportNeed: undefined,
  secondarySupportNeeds: undefined,
};

const pmegpScheme = SCHEMES_DATABASE.find(s => s.id === 'pmegp-msme')!;
const baseScore = calculateMatchScore(baseProfile, pmegpScheme);
const unknownScore = calculateMatchScore(unknownProfile, pmegpScheme);

assert.strictEqual(unknownScore.matchPercentage, baseScore.matchPercentage, 'UNKNOWN business fields must not reduce statutory match percentage');
assert.strictEqual(unknownScore.isEligible, baseScore.isEligible, 'UNKNOWN business fields must not create false ineligibility');
assert.strictEqual(unknownScore.confirmedBlockers.length, baseScore.confirmedBlockers.length, 'UNKNOWN business fields must not create false blockers');
console.log('✅ PASS: UNKNOWN states do not create false ineligibility or penalize statutory score');

// Test 7: CRITICAL REGRESSION TEST — Zero score difference before & after Phase 4.1 fields
const richBusinessProfile: UserProfile = {
  ...baseProfile,
  businessIdea: 'Eco-friendly banana fiber packaging unit',
  businessStageKey: 'PRE_LAUNCH',
  businessEntityType: 'PRIVATE_LIMITED',
  registrationStatus: 'IN_PROCESS',
  totalProjectCost: 2000000,
  existingInvestment: 500000,
  fundingRequired: 1500000,
  primarySupportNeed: 'EQUIPMENT',
  secondarySupportNeeds: ['WORKING_CAPITAL', 'SUBSIDY'],
};

for (const scheme of SCHEMES_DATABASE) {
  const scoreBefore = calculateMatchScore(baseProfile, scheme);
  const scoreAfter = calculateMatchScore(richBusinessProfile, scheme);
  
  // The authoritative 5-factor matching score MUST remain 100% identical
  assert.strictEqual(
    scoreAfter.matchPercentage,
    scoreBefore.matchPercentage,
    `Regression failure: Scheme ${scheme.id} score changed from ${scoreBefore.matchPercentage} to ${scoreAfter.matchPercentage}`
  );
  assert.strictEqual(
    scoreAfter.isEligible,
    scoreBefore.isEligible,
    `Regression failure: Scheme ${scheme.id} eligibility changed`
  );
}
console.log('✅ PASS: CRITICAL REGRESSION TEST: 100% of schemes retain identical match score before and after Phase 4.1');

console.log('======================================================');
console.log('PHASE 4.1 BUSINESS INTELLIGENCE TEST SUITE: ALL TESTS PASSED!');
console.log('======================================================');
