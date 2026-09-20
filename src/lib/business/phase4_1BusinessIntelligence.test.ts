import { UserProfile } from '../../types';
import {
  calculateFundingGap,
  analyzeFunding,
  mapLegacyStageToKey,
  mapKeyToLegacyStage,
  deriveBusinessStage,
  normalizeRegistrationStatus,
  normalizeOperationalStatus,
  normalizeBusinessEntityType,
  calculateBusinessProfileCompleteness,
  deriveBusinessNeedProfile,
  deriveBusinessProfile,
} from './index';
import { evaluateFundingFit } from '../matching/fundingFit';
import { SCHEMES_DATABASE } from '../../data/schemes';

console.log('--- RUNNING YOJANA SETU PHASE 4.1: BUSINESS INTELLIGENCE TEST SUITE ---');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// 1. FUNDING CALCULATOR & GAP INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- Section 1: Funding Logic & Gap Calculation ---');

const gapStandard = calculateFundingGap(1000000, 250000);
assert(gapStandard === 750000, 'T1: Standard funding gap is totalProjectCost - existingInvestment (10L - 2.5L = 7.5L)');

const gapOverFunded = calculateFundingGap(500000, 600000);
assert(gapOverFunded === 0, 'T2: Over-funded project returns 0 gap (never negative)');

const gapZeroInvestment = calculateFundingGap(800000, 0);
assert(gapZeroInvestment === 800000, 'T3: Zero existing investment returns full project cost as gap');

const gapFallback = calculateFundingGap(undefined, 100000, 500000);
assert(gapFallback === 400000, 'T4: Falls back to fundingRequired when totalProjectCost is undefined');

const gapEmpty = calculateFundingGap(undefined, undefined, undefined);
assert(gapEmpty === 0, 'T5: Undefined funding parameters return 0 gap safely');

// -----------------------------------------------------------------------------
// 2. FUNDING FIT EVALUATION WITH REAL SCHEMES
// -----------------------------------------------------------------------------
console.log('\n--- Section 2: Funding Fit Engine & Financial Analysis ---');

const fundingAnalysis = analyzeFunding(1000000, 200000);
assert(fundingAnalysis.fundingGap === 800000, 'T6: analyzeFunding calculates 8L gap');
assert(fundingAnalysis.ownContributionPercent === 20, 'T7: analyzeFunding calculates 20% own contribution');
assert(fundingAnalysis.fundingGapPercent === 80, 'T8: analyzeFunding calculates 80% funding gap percent');

const pmegpScheme = SCHEMES_DATABASE.find((s) => s.id === 'pmegp-msme')!;
const pmegpProfile: UserProfile = {
  age: 32,
  annualIncome: 400000,
  category: 'OBC',
  businessType: 'manufacturing',
  state: 'Karnataka',
  ruralUrban: 'rural',
  fundingRequired: 1500000,
};
const pmegpFit = evaluateFundingFit(pmegpScheme, pmegpProfile, 'en');
assert(pmegpFit.fitStatus === 'WITHIN_RANGE', 'T8b: PMEGP evaluates WITHIN_RANGE for 15L project within limits');

// -----------------------------------------------------------------------------
// 3. BUSINESS STAGE & LIFECYCLE TAXONOMY MAPPING
// -----------------------------------------------------------------------------
console.log('\n--- Section 3: Business Stage & Lifecycle Mapping ---');

assert(mapLegacyStageToKey('new') === 'NEW_BUSINESS', 'T9: Legacy "new" maps to NEW_BUSINESS');
assert(mapLegacyStageToKey('existing') === 'EARLY_OPERATION', 'T10: Legacy "existing" maps to EARLY_OPERATION');
assert(mapLegacyStageToKey('expanding') === 'EXPANSION', 'T11: Legacy "expanding" maps to EXPANSION');
assert(mapLegacyStageToKey('idea') === 'IDEA', 'T12: Legacy "idea" maps to IDEA');

assert(mapKeyToLegacyStage('IDEA') === 'idea', 'T13: Sub-stage IDEA maps back to "idea"');
assert(mapKeyToLegacyStage('PRE_LAUNCH') === 'idea', 'T14: Sub-stage PRE_LAUNCH maps back to "idea"');
assert(mapKeyToLegacyStage('NEW_BUSINESS') === 'new', 'T15: Sub-stage NEW_BUSINESS maps back to "new"');
assert(mapKeyToLegacyStage('EARLY_OPERATION') === 'existing', 'T16: Sub-stage EARLY_OPERATION maps back to "existing"');
assert(mapKeyToLegacyStage('GROWTH') === 'scaling', 'T17: Sub-stage GROWTH maps back to "scaling"');
assert(mapKeyToLegacyStage('EXPANSION') === 'expanding', 'T18: Sub-stage EXPANSION maps back to "expanding"');

// Stage derivation precedence
const explicitStageProfile: UserProfile = {
  age: 28,
  annualIncome: 350000,
  category: 'General',
  businessType: 'manufacturing',
  state: 'Maharashtra',
  ruralUrban: 'urban',
  businessStage: 'new',
  businessStageKey: 'PRE_LAUNCH',
};
const derivedStage1 = deriveBusinessStage(explicitStageProfile);
assert(derivedStage1.stage === 'PRE_LAUNCH', 'T19: Explicit businessStageKey PRE_LAUNCH takes precedence over businessStage');
assert(derivedStage1.source === 'EXPLICIT', 'T20: Explicit businessStageKey source marked as EXPLICIT');

const inferredOnlyProfile: UserProfile = {
  age: 35,
  annualIncome: 600000,
  category: 'General',
  businessType: 'services',
  state: 'Gujarat',
  ruralUrban: 'rural',
  operationalStatus: 'EXPANDING',
};
const derivedStage2 = deriveBusinessStage(inferredOnlyProfile);
assert(derivedStage2.stage === 'EXPANSION', 'T21: Inferred from operationalStatus maps to EXPANSION');
assert(derivedStage2.source === 'INFERRED', 'T22: Inferred from operationalStatus marked as INFERRED');

// -----------------------------------------------------------------------------
// 4. REGISTRATION & OPERATIONAL STATUS NORMALIZATION
// -----------------------------------------------------------------------------
console.log('\n--- Section 4: Registration & Operational Status Normalization ---');

assert(normalizeRegistrationStatus({ businessRegistration: 'udyam' }) === 'REGISTERED', 'T23: Udyam maps to REGISTERED');
assert(normalizeRegistrationStatus({ businessRegistration: 'gst' }) === 'REGISTERED', 'T24: GST maps to REGISTERED');
assert(normalizeRegistrationStatus({ businessRegistration: 'unregistered' }) === 'NOT_REGISTERED', 'T25: Unregistered maps to NOT_REGISTERED');
assert(normalizeRegistrationStatus({}) === 'UNKNOWN', 'T26: Missing registration maps to UNKNOWN (not registered is not assumed)');
assert(normalizeRegistrationStatus({ registrationStatus: 'IN_PROCESS' }) === 'IN_PROCESS', 'T27: Explicit registrationStatus IN_PROCESS preserved');

assert(normalizeOperationalStatus({ businessStage: 'existing' }) === 'OPERATING', 'T28: Stage existing maps to OPERATING');
assert(normalizeOperationalStatus({ businessStage: 'expanding' }) === 'EXPANDING', 'T29: Stage expanding maps to EXPANDING');
assert(normalizeOperationalStatus({ businessStage: 'new' }) === 'NOT_STARTED', 'T30: Stage new maps to NOT_STARTED');
assert(normalizeOperationalStatus({ operationalStatus: 'TEMPORARILY_INACTIVE' }) === 'TEMPORARILY_INACTIVE', 'T31: Explicit operationalStatus TEMPORARILY_INACTIVE preserved');

// -----------------------------------------------------------------------------
// 5. BUSINESS PROFILE COMPLETENESS (13 FIELDS)
// -----------------------------------------------------------------------------
console.log('\n--- Section 5: Profile Completeness Score (13 Fields) ---');

const minimalProfile: UserProfile = {
  age: 26,
  annualIncome: 200000,
  category: 'OBC',
  businessType: 'trading',
  state: 'Uttar Pradesh',
  ruralUrban: 'rural',
};
const completenessMinimal = calculateBusinessProfileCompleteness(minimalProfile);
assert(completenessMinimal.maxScore === 13, 'T32: Completeness evaluates exactly 13 fields');
assert(completenessMinimal.score >= 2, 'T33: Minimal profile scores points for state and sector');
assert(completenessMinimal.missingHighValueFields.length > 0, 'T34: Identifies missing high value fields');

const fullProfile: UserProfile = {
  businessName: 'Surya Agro Processors',
  businessIdea: 'Solar cold storage and primary fruit packaging unit',
  category: 'General',
  age: 34,
  annualIncome: 500000,
  businessType: 'agri',
  state: 'Karnataka',
  residenceState: 'Karnataka',
  businessState: 'Karnataka',
  district: 'Mysuru',
  ruralUrban: 'rural',
  businessStage: 'new',
  businessStageKey: 'NEW_BUSINESS',
  operationalStatus: 'NOT_STARTED',
  businessEntityType: 'PRIVATE_LIMITED',
  subSector: 'Agri-Processing & Cold Chain',
  entrepreneurExperienceYears: 4,
  businessRegistration: 'udyam',
  registrationStatus: 'REGISTERED',
  totalProjectCost: 2500000,
  existingInvestment: 500000,
  fundingRequired: 2000000,
  primarySupportNeed: 'CAPITAL',
  secondarySupportNeeds: ['EQUIPMENT', 'SUBSIDY'],
};

const completenessFull = calculateBusinessProfileCompleteness(fullProfile);
assert(completenessFull.score === 13, 'T35: Fully populated profile achieves 13/13 completeness score');
assert(completenessFull.percentage === 100, 'T36: Fully populated profile achieves 100% completeness');
assert(completenessFull.missingHighValueFields.length === 0, 'T37: Zero missing fields for fully populated profile');

// -----------------------------------------------------------------------------
// 6. DERIVED BUSINESS NEED PROFILE & SECONDARY NEEDS ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- Section 6: Derived Business Need Profile & Intelligence ---');

const derivedNeedProfile = deriveBusinessNeedProfile(fullProfile);
assert(derivedNeedProfile.primaryNeed === 'CAPITAL', 'T38: Primary support need preserved');
assert(derivedNeedProfile.secondaryNeeds.length === 2, 'T39: Secondary support needs preserved');
assert(!derivedNeedProfile.secondaryNeeds.includes('CAPITAL'), 'T40: Primary need is NOT in secondary needs');
assert(derivedNeedProfile.fundingGap === 2000000, 'T41: Funding gap correctly calculated as 25L - 5L = 20L');
assert(derivedNeedProfile.hasFundingDetails === true, 'T42: hasFundingDetails flag is true');
assert(derivedNeedProfile.totalFieldCount === 13, 'T43: totalFieldCount matches 13');
assert(derivedNeedProfile.completedFieldCount === 13, 'T44: completedFieldCount matches 13');
assert(derivedNeedProfile.provenance.stage === 'USER_PROVIDED', 'T45: Provenance tracks stage as USER_PROVIDED');

// Interstate detection
const interstateProfile: UserProfile = {
  ...fullProfile,
  residenceState: 'Kerala',
  businessState: 'Tamil Nadu',
};
const derivedInterstate = deriveBusinessNeedProfile(interstateProfile);
assert(derivedInterstate.location.isInterstate === true, 'T46: Successfully detects interstate entrepreneur (Kerala domicile, Tamil Nadu business)');
assert(derivedInterstate.location.residenceState === 'Kerala', 'T47: Correctly stores residence state');
assert(derivedInterstate.location.businessState === 'Tamil Nadu', 'T48: Correctly stores business state');

// Same state detection
const localProfile: UserProfile = {
  ...fullProfile,
  residenceState: 'Karnataka',
  businessState: 'Karnataka',
};
const derivedLocal = deriveBusinessNeedProfile(localProfile);
assert(derivedLocal.location.isInterstate === false, 'T49: Correctly identifies non-interstate entrepreneur (Karnataka domicile & business)');

// Derive BusinessProfile
const derivedBizProfile = deriveBusinessProfile(fullProfile);
assert(derivedBizProfile.businessStage === 'NEW_BUSINESS', 'T50: deriveBusinessProfile populates businessStage');
assert(derivedBizProfile.businessEntityType === 'PRIVATE_LIMITED', 'T51: deriveBusinessProfile populates businessEntityType');
assert(derivedBizProfile.fundingGap === 2000000, 'T52: deriveBusinessProfile populates fundingGap');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\n==================================================`);
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`==================================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
