/**
 * COMMAND CENTER MERGE TESTS
 *
 * Verifies the merged Command Center composes the app's authoritative data
 * without recomputing matching or inventing values.
 */

import {
  toApplicationRecords,
  toFeatureMatchResult,
  toFeatureProfile,
  toFeatureScheme,
  toFollowUpItems,
  toUserDocumentStates,
} from './adapter';
import { generateDashboardInsights } from './lib/dashboard/dashboardInsights';
import { en } from './en';
import { hi } from './hi';

let passed = 0;
let failed = 0;
const check = (name: string, condition: boolean) => {
  if (condition) {
    passed += 1;
    console.log(`✅ PASS: ${name}`);
  } else {
    failed += 1;
    console.log(`❌ FAIL: ${name}`);
  }
};

const TODAY = new Date('2026-09-13T00:00:00.000Z');

const appScheme = {
  id: 'pmegp',
  name: 'PMEGP',
  shortCode: 'PMEGP',
  sponsoringMinistry: 'Ministry of MSME',
  department: 'KVIC',
  schemeType: 'subsidy-linked-loan',
  benefitSummary: 'Margin money subsidy with bank loan',
  fundingRangeText: 'Up to ₹50 lakh',
  minAmount: 100000,
  maxAmount: 5000000,
  subsidyRatePercent: 35,
  baseInterestRate: 11,
  standardTenureYears: 7,
  moratoriumPeriodMonths: 6,
  targetCategories: ['General', 'OBC', 'SC'],
  minAge: 18,
  maxAge: 60,
  maxAnnualIncomeCap: 0,
  targetBusinessTypes: ['manufacturing', 'services'],
  applicableStates: [],
  requiredDocuments: ['Aadhaar Card', 'Project Report'],
  officialPortalUrl: 'https://www.kviconline.gov.in/pmegp',
  lastVerifiedDate: '2026-08-01',
  applicationMode: 'online',
} as never;

const matchResult = {
  scheme: appScheme,
  matchPercentage: 92,
  breakdown: [
    { factorKey: 'category', factorLabel: 'Social category', userValue: 'OBC', statutoryRequirement: 'OBC', matched: true, state: 'MATCHED', explanation: 'Category matches', scoreContribution: 30, maxContribution: 30 },
    { factorKey: 'businessType', factorLabel: 'Business type', userValue: 'manufacturing', statutoryRequirement: 'manufacturing', matched: true, state: 'MATCHED', explanation: 'Type matches', scoreContribution: 25, maxContribution: 25 },
    { factorKey: 'income', factorLabel: 'Income', userValue: '₹2,00,000', statutoryRequirement: 'No ceiling', matched: true, state: 'MATCHED', explanation: 'Within limit', scoreContribution: 20, maxContribution: 20 },
    { factorKey: 'age', factorLabel: 'Age', userValue: '32', statutoryRequirement: '18-60', matched: true, state: 'MATCHED', explanation: 'Within range', scoreContribution: 15, maxContribution: 15 },
    { factorKey: 'state', factorLabel: 'State', userValue: 'Maharashtra', statutoryRequirement: 'All States', matched: false, state: 'UNKNOWN', explanation: 'Not confirmed', scoreContribution: 2, maxContribution: 10 },
  ],
  plainLanguageExplanation: 'Strong match on all statutory factors.',
  isEligible: true,
  matchStatus: 'eligible',
  mandatoryCriteriaSatisfied: true,
  matchedCount: 4,
  totalFactorsCount: 5,
  unmetCriteria: [],
  matchedCriteria: [],
  unknownCriteria: [{ factorKey: 'state' }],
  confirmedBlockers: [],
} as never;

const appProfile = {
  category: 'OBC',
  age: 32,
  annualIncome: 200000,
  businessType: 'manufacturing',
  state: 'Maharashtra',
  businessName: 'Sai Foods',
  businessStage: 'new',
  businessRegistration: 'udyam',
} as never;

const trackedApp = {
  schemeId: 'pmegp',
  schemeName: 'PMEGP',
  status: 'applied',
  appliedOn: '2026-09-01',
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  followUp: { dueOn: '2026-09-25', noteEn: 'Call KVIC office', noteHi: 'केवीआईसी कार्यालय को कॉल करें' },
} as never;

console.log('\n=== COMMAND CENTER MERGE TESTS ===\n');

/* 1. Matching integrity — scores pass through verbatim */
const fm = toFeatureMatchResult(matchResult);
check('T1: match score passed through verbatim (92)', fm.totalMatchScore === 92);
check('T2: social category contribution preserved (30)', fm.dimensionScores.socialCategory === 30);
check('T3: business type contribution preserved (25)', fm.dimensionScores.businessType === 25);
check('T4: income contribution preserved (20)', fm.dimensionScores.income === 20);
check('T5: age contribution preserved (15)', fm.dimensionScores.age === 15);
check('T6: state weight capped at 10', fm.dimensionScores.state <= 10);
check('T7: unknown criteria counted, not guessed', fm.unknownCriteriaCount === 1);
check('T8: no blockers reported when none confirmed', fm.hasBlocker === false);

/* 2. Scheme adaptation */
const fs = toFeatureScheme(appScheme, undefined, TODAY);
check('T9: scheme id preserved', fs.id === 'pmegp');
check('T10: central scheme detected from empty state list', fs.level === 'central');
check('T11: gov.in portal classified VERIFIED_OFFICIAL', fs.portalDomainClass === 'VERIFIED_OFFICIAL');
check('T12: freshness derived from lastVerifiedDate', fs.freshnessStatus === 'FRESH');
check('T13: required documents mapped', fs.requiredDocuments.length === 2);
check('T14: Aadhaar treated as reusable document', fs.requiredDocuments[0].type === 'REUSABLE');
check('T15: project report treated as scheme specific', fs.requiredDocuments[1].type === 'SCHEME_SPECIFIC');
check('T16: no fabricated application instructions', fs.applicationInstructions.length === 0);
check('T17: funding support category derived from real amount', fs.supportCategories.includes('Funding'));

/* 3. Profile adaptation */
const fp = toFeatureProfile(appProfile)!;
check('T18: social category normalised', fp.socialCategory === 'OBC');
check('T19: business type normalised', fp.businessType === 'MANUFACTURING');
check('T20: business stage normalised', fp.businessStage === 'REGISTRATION');
check('T21: udyam registration carried over', fp.hasUdyam === true);
check('T22: null profile stays null', toFeatureProfile(null) === null);

/* 4. Tracker + documents + follow-ups */
const records = toApplicationRecords([trackedApp]);
check('T23: tracked application mapped', records.length === 1 && records[0].status === 'applied');
const docs = toUserDocumentStates({ pmegp: ['Aadhaar Card'] });
check('T24: prepared document recorded as PREPARED', docs['aadhaar-card']?.status === 'PREPARED');
const followUps = toFollowUpItems([trackedApp]);
check('T25: follow-up is always a user reminder', followUps[0].type === 'USER_REMINDER');
check('T26: follow-up keeps citizen note', followUps[0].title === 'Call KVIC office');

/* 5. Insights composition */
const insights = generateDashboardInsights({
  profile: fp,
  schemes: [fs],
  matchResults: [fm],
  applicationRecords: records,
  userDocs: docs,
  savedSchemeIds: ['pmegp'],
  followUps,
});
check('T27: profile present', insights.hasProfile === true);
check('T28: matches detected', insights.hasMatches === true);
check('T29: top opportunity surfaced', insights.topOpportunity?.scheme.id === 'pmegp');
check('T30: no new 0-100 score invented', insights.topOpportunity?.matchResult.totalMatchScore === 92);
check('T31: priority list capped at three', insights.priorityOpportunities.length <= 3);
check('T32: action priority is a state, not a score', typeof insights.topOpportunity?.actionPriority === 'string');
check('T33: lifecycle stage assigned', Boolean(insights.topOpportunity?.lifecycleStage));
check('T34: next best action available', Boolean(insights.nextBestAction));
check('T35: application summary counts real records', insights.applicationSummary.total === 1);
check('T36: trust summary counts only visible schemes', insights.trustSummary.visibleSchemesCount === 1);
check('T37: official source counted from domain class', insights.trustSummary.officialSourcesCount === 1);
check('T38: follow-up summary uses tracker data', insights.followUpSummary.totalCount === 1);
check('T39: document summary reports readiness', insights.documentSummary.prepared >= 1);

/* 6. Empty state honesty */
const empty = generateDashboardInsights({
  profile: null,
  schemes: [],
  matchResults: [],
  applicationRecords: [],
  userDocs: {},
  savedSchemeIds: [],
  followUps: [],
});
check('T40: new user gets no profile flag', empty.hasProfile === false);
check('T41: new user gets no fake metrics', empty.applicationSummary.total === 0 && empty.allOpportunities.length === 0);
check('T42: new user completeness is zero, not estimated', empty.profileCompleteness.percentage === 0);
check('T43: new user is pointed at profile building', empty.nextBestAction?.targetWorkspace === 'PROFILE');

/* 7. Copy safety + bilingual parity */
const enKeys = Object.keys(en);
const hiKeys = Object.keys(hi);
check('T44: EN/HI key parity', enKeys.length === hiKeys.length && enKeys.every(k => hiKeys.includes(k)));
const allCopy = Object.values(en).join(' ').toLowerCase();
check('T45: never claims 100% trusted', !allCopy.includes('100% trusted'));
check('T46: never claims government verified', !allCopy.includes('government verified'));
check('T47: never claims officially approved', !allCopy.includes('officially approved'));
check('T48: never claims a government deadline', !allCopy.includes('government deadline'));
check('T49: no sensitive identifiers stored on records', !JSON.stringify(records).toLowerCase().match(/aadhaar number|pan number|otp|password|token/));

console.log('\n=== TEST RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.log('❌ COMMAND CENTER MERGE TESTS FAILED');
  process.exit(1);
}
console.log('✅ ALL TESTS PASSED');
