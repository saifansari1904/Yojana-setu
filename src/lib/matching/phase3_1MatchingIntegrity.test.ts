import { SCHEMES_DATABASE } from '../../data/schemes';
import { UserProfile } from '../../types';
import { calculateMatchScore } from './matchingEngine';
import { buildMatchExplanation } from './explanationBuilder';
import { getNextBestAction } from './decisionEngine';
import { evaluateFundingFit } from './fundingFit';
import { evaluateDocumentReadiness } from './documentReadiness';
import { compareSchemes } from './comparisonEngine';

console.log('--- RUNNING YOJANA SETU PHASE 3.1: MATCHING INTEGRITY & DECISION LAYER TEST SUITE ---');

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

// Test Profile 1: Full Qualifying Profile for Stand-Up India (SC female entrepreneur in Karnataka)
const qualifyingSCFemale: UserProfile = {
  age: 32,
  category: 'SC',
  annualIncome: 300000,
  gender: 'female',
  businessType: 'manufacturing',
  investmentAmount: 2500000,
  state: 'Karnataka',
  hasExistingBusiness: false,
};

// Test Profile 2: General Male in Karnataka (fails Stand-Up India category requirement)
const generalMale: UserProfile = {
  age: 40,
  category: 'General',
  annualIncome: 500000,
  gender: 'male',
  businessType: 'services',
  investmentAmount: 1500000,
  state: 'Karnataka',
  hasExistingBusiness: true,
};

// 1. Authoritative Engine Integrity & Mathematical Consistency
const standUpIndia = SCHEMES_DATABASE.find((s) => s.id === 'standup-india')!;
const resultQualifying = calculateMatchScore(qualifyingSCFemale, standUpIndia);

assert(resultQualifying.mathematicalIntegrityVerified === true, 'T1: Mathematical integrity audit flag is true');
assert(resultQualifying.matchPercentage >= 90, 'T2: Qualifying entrepreneur achieves high score');
assert(resultQualifying.eligibilityClassification === 'POTENTIALLY_ELIGIBLE', 'T3: Qualifying profile classified as POTENTIALLY_ELIGIBLE');
assert(resultQualifying.confirmedBlockers.length === 0, 'T4: Qualifying profile has zero confirmed blockers');
assert(resultQualifying.auditBreakdown.totalWeightEvaluated === 100, 'T5: Evaluates exactly 100% total weight across 5 factors');

// Verify exact factor weighting
const weights = resultQualifying.auditBreakdown.factorAudits.reduce((acc, f) => {
  acc[f.factorKey] = f.weightAssigned;
  return acc;
}, {} as Record<string, number>);

assert(weights['category'] === 30, 'T6: Social Category weight is authoritative 30%');
assert(weights['businessType'] === 25, 'T7: Business Type weight is authoritative 25%');
assert(weights['income'] === 20, 'T8: Income weight is authoritative 20%');
assert(weights['age'] === 15, 'T9: Age weight is authoritative 15%');
assert(weights['state'] === 10, 'T10: State weight is authoritative 10%');

// 2. Mandatory Blocker Detection
const resultGeneralMale = calculateMatchScore(generalMale, standUpIndia);
assert(resultGeneralMale.eligibilityClassification === 'BLOCKED', 'T11: Ineligible category classified as BLOCKED');
assert(resultGeneralMale.confirmedBlockers.length > 0, 'T12: Confirmed blockers recorded');
assert(resultGeneralMale.isEligible === false, 'T13: Blocked scheme has isEligible = false');
assert(resultGeneralMale.matchStatus === 'near-match', 'T14: Blocked scheme with 4/5 matched factors classified as near-match');

// 3. Three-state Evaluation
const categoryAudit = resultGeneralMale.auditBreakdown.factorAudits.find((f) => f.factorKey === 'category')!;
assert(categoryAudit.state === 'MISMATCHED', 'T15: Failed mandatory criterion state is MISMATCHED');
assert(categoryAudit.weightEarned === 0, 'T16: Mismatched criterion earns 0 weight');

// 4. Explanation Builder Consistency
const expEn = buildMatchExplanation(resultQualifying, qualifyingSCFemale, 'en');
const expHi = buildMatchExplanation(resultQualifying, qualifyingSCFemale, 'hi');
assert(expEn.plainLanguageSummary.length > 20, 'T17: English plain-language explanation generated');
assert(expHi.plainLanguageSummary.length > 20, 'T18: Hindi plain-language explanation generated');
assert(expEn.strongestFactors.length > 0, 'T19: Strongest factors highlighted in explanation');

const expBlocked = buildMatchExplanation(resultGeneralMale, generalMale, 'en');
assert(expBlocked.blockers.length > 0, 'T20: Blocker reflected in explanation');
assert(expBlocked.recommendationReason.includes('Statutory restriction') || expBlocked.plainLanguageSummary.includes('Near match'), 'T21: Blocker explained clearly without contradiction');

// 5. Decision Engine & Next Best Action
const nextActionQualifying = getNextBestAction(resultQualifying, qualifyingSCFemale, 'en');
assert(nextActionQualifying.priority === 'medium' || nextActionQualifying.priority === 'high', 'T22: Eligible next action has appropriate priority');
assert(nextActionQualifying.actionType === 'VERIFY_INFORMATION' || nextActionQualifying.actionType === 'VISIT_OFFICIAL_PORTAL' || nextActionQualifying.actionType === 'PREPARE_DOCUMENTS' || nextActionQualifying.actionType === 'COMPLETE_BUSINESS_PROFILE', 'T23: Actionable next step recommended');
assert(nextActionQualifying.buttonLabel.length > 0, 'T24: Action button label provided');

const nextActionBlocked = getNextBestAction(resultGeneralMale, generalMale, 'en');
assert(nextActionBlocked.actionTarget === 'alternatives', 'T25: Blocked scheme directs user to alternatives');

// 6. Funding Fit Analysis
const fundingFit = evaluateFundingFit(standUpIndia, qualifyingSCFemale, 'en');
assert(fundingFit.fitStatus === 'WITHIN_RANGE', 'T26: 25 Lakhs is within Stand-Up India range (10L - 100L)');
assert(fundingFit.explanation.includes('25,00,000'), 'T27: Funding explanation includes user requested amount');

const pmegp = SCHEMES_DATABASE.find((s) => s.id === 'pmegp-msme')!;
const fundingFitExceeds = evaluateFundingFit(pmegp, { ...qualifyingSCFemale, investmentAmount: 8000000 }, 'en');
assert(fundingFitExceeds.fitStatus === 'ABOVE_RANGE', 'T28: 80 Lakhs exceeds PMEGP manufacturing cap (50 Lakhs)');
assert(fundingFitExceeds.difference === 3000000, 'T29: Difference calculated correctly as 30 Lakhs');

// 7. Document Readiness Evaluation
const docReadiness0 = evaluateDocumentReadiness(standUpIndia, qualifyingSCFemale, []);
assert(docReadiness0.readinessPercentage === 0, 'T30: 0 documents ready returns 0%');
assert(docReadiness0.missingCount === standUpIndia.requiredDocuments.length, 'T31: Missing count matches total required');

const firstDoc = standUpIndia.requiredDocuments[0];
const docReadiness1 = evaluateDocumentReadiness(standUpIndia, qualifyingSCFemale, [firstDoc]);
assert(docReadiness1.preparedCount === 1, 'T32: 1 document ready registered');
assert(docReadiness1.items.some((i) => i.name === firstDoc && i.state === 'PROVIDED'), 'T33: Ready document marked PROVIDED in items');

// 8. Scheme Comparison Engine
const vishwakarma = SCHEMES_DATABASE.find((s) => s.id === 'pm-vishwakarma')!;
const resultVishwakarma = calculateMatchScore(qualifyingSCFemale, vishwakarma);
const comparison = compareSchemes([resultQualifying, resultVishwakarma], qualifyingSCFemale, 'en');

assert(comparison.columns.length === 2, 'T34: Comparison contains exactly 2 scheme columns');
assert(comparison.bestMatchSchemeId.length > 0, 'T35: Comparison identifies top recommended scheme');
assert(comparison.columns[0].schemeName.length > 0, 'T36: Column contains official scheme title');
assert(comparison.columns[0].fundingFit.fitStatus !== undefined, 'T37: Column includes funding fit analysis');
assert(comparison.columns[0].nextBestAction.actionType !== undefined, 'T38: Column includes next best action');
assert(comparison.summaryNote.length > 0, 'T39: Comparison provides summary note');

console.log(`\n======================================================`);
console.log(`PHASE 3.1 TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`======================================================`);

if (failed > 0) {
  process.exit(1);
}
