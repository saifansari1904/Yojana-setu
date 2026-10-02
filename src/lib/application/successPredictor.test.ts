import assert from 'node:assert';
import { predictSchemeSuccessRate } from './successPredictor';
import type { Scheme } from '../../types/scheme';
import type { UserProfile } from '../../types/user';
import type { MatchResult } from '../../types/matching';
import type { UploadedFileRecord } from '../tracker/documentProgress';

console.log('=== SUCCESS RATE PREDICTOR TESTS ===');

const mockScheme: Scheme = {
  id: 'pmegp-msme',
  name: 'Prime Minister’s Employment Generation Programme (PMEGP)',
  shortCode: 'PMEGP',
  sponsoringMinistry: 'Ministry of MSME',
  schemeType: 'Loan + Subsidy',
  benefitSummary: 'Up to 35% margin subsidy',
  fundingRangeText: '₹2,00,000 – ₹50,00,000',
  minAmount: 200000,
  maxAmount: 5000000,
  baseInterestRate: 8.5,
  standardTenureYears: 5,
  moratoriumPeriodMonths: 6,
  targetCategories: ['OBC', 'General'],
  minAge: 18,
  maxAge: 65,
  maxAnnualIncomeCap: 0,
  targetBusinessTypes: ['manufacturing', 'services'],
  applicableStates: [],
  requiredDocuments: [
    'Aadhaar Card',
    'Caste/Community Certificate',
    'Detailed Project Report (DPR)',
    'Bank Passbook',
  ],
  officialPortalUrl: 'https://kviconline.gov.in/pmegpeportal',
  lastVerifiedDate: '15 August 2024',
  applicationMode: 'Online via Portal',
};

const mockUserProfile: UserProfile = {
  applicantName: 'Ramesh Patel',
  category: 'OBC',
  state: 'Gujarat',
  district: 'Ahmedabad',
  ruralUrban: 'rural',
  age: 32,
  annualIncome: 350000,
  businessType: 'manufacturing',
  businessStage: 'idea',
  fundingRequired: 1500000,
};

const mockMatchResult: MatchResult = {
  scheme: mockScheme,
  matchPercentage: 92,
  breakdown: [],
  reasonCodes: ['BUSINESS_TYPE_MATCHED'],
  plainLanguageExplanation: 'Eligible for PMEGP based on profile',
  isEligible: true,
  matchStatus: 'eligible',
  mandatoryCriteriaSatisfied: true,
  matchedCount: 1,
  totalFactorsCount: 1,
  matchedCriteria: [{
    factorKey: 'businessType',
    factorLabel: 'Manufacturing',
    userValue: 'manufacturing',
    statutoryRequirement: 'manufacturing',
    matched: true,
    state: 'MATCHED',
    explanation: 'Manufacturing activity verified',
    scoreContribution: 25,
    maxContribution: 25,
  }],
  unmetCriteria: [],
  confirmedBlockers: [],
  unknownCriteria: [],
};

// Test 1: Zero documents prepared gives baseline approval rate
const pred0 = predictSchemeSuccessRate({
  scheme: mockScheme,
  userProfile: mockUserProfile,
  matchResult: mockMatchResult,
  preparedDocIds: [],
  uploadedFiles: {},
});

assert.strictEqual(pred0.statutoryBlockerPresent, false);
assert(pred0.probabilityPercent >= 40 && pred0.probabilityPercent <= 48, `T1: Baseline probability in expected range: ${pred0.probabilityPercent}`);
assert.strictEqual(pred0.uploadedDocumentsCount, 0);
assert.strictEqual(pred0.preparedDocumentsCount, 0);
assert.strictEqual(pred0.activeRejectionRisks.length > 0, true, 'T1b: Active rejection risks present when docs missing');
console.log('✅ PASS: T1: Zero documents yields historical baseline rate (~42-45%)');

// Test 2: Uploaded documents increase success rate monotonically
const uploadedMock: Record<string, UploadedFileRecord> = {
  'Detailed Project Report (DPR)': {
    docId: 'Detailed Project Report (DPR)',
    schemeId: mockScheme.id,
    fileName: 'dpr_agro_processing.pdf',
    fileSize: 1542000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString(),
  },
};

const pred1 = predictSchemeSuccessRate({
  scheme: mockScheme,
  userProfile: mockUserProfile,
  matchResult: mockMatchResult,
  preparedDocIds: ['Detailed Project Report (DPR)'],
  uploadedFiles: uploadedMock,
});

assert(pred1.probabilityPercent > pred0.probabilityPercent, 'T2: DPR upload increased probability');
assert(pred1.documentImpacts.find(d => d.docName.includes('DPR'))?.isUploaded === true, 'T2b: DPR marked uploaded');
console.log(`✅ PASS: T2: DPR upload boosts rate from ${pred0.probabilityPercent}% to ${pred1.probabilityPercent}%`);

// Test 3: All documents uploaded approaches maximum verified ceiling (~86-88%)
const allDocs = mockScheme.requiredDocuments;
const allUploads: Record<string, UploadedFileRecord> = {};
allDocs.forEach((d) => {
  allUploads[d] = {
    docId: d,
    schemeId: mockScheme.id,
    fileName: `${d.replace(/\s+/g, '_').toLowerCase()}.pdf`,
    fileSize: 500000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString(),
  };
});

const predAll = predictSchemeSuccessRate({
  scheme: mockScheme,
  userProfile: mockUserProfile,
  matchResult: mockMatchResult,
  preparedDocIds: allDocs,
  uploadedFiles: allUploads,
});

assert(predAll.probabilityPercent >= 80, `T3: High probability with all documents: ${predAll.probabilityPercent}%`);
assert(predAll.probabilityPercent <= predAll.maxPossibleRate, 'T3b: Never exceeds verified maximum benchmark');
assert.strictEqual(predAll.probabilityTier, 'VERY_HIGH');
assert(predAll.mitigatedRejectionRisks.length >= 3, 'T3c: Most historical rejection causes mitigated');
console.log(`✅ PASS: T3: Full dossier achieves ${predAll.probabilityPercent}% (ceiling: ${predAll.maxPossibleRate}%)`);

// Test 4: Blocker sets probability to 0 and marks tier BLOCKED
const blockedMatch: MatchResult = {
  ...mockMatchResult,
  matchPercentage: 0,
  matchStatus: 'low-match',
  confirmedBlockers: [{
    factorKey: 'businessType',
    factorLabel: 'Excluded sector',
    userValue: 'trading',
    statutoryRequirement: 'manufacturing',
    matched: false,
    state: 'MISMATCHED',
    explanation: 'Excluded sector',
    scoreContribution: 0,
    maxContribution: 25,
  }],
};

const predBlocked = predictSchemeSuccessRate({
  scheme: mockScheme,
  userProfile: mockUserProfile,
  matchResult: blockedMatch,
  preparedDocIds: allDocs,
  uploadedFiles: allUploads,
});

assert.strictEqual(predBlocked.probabilityPercent, 0, 'T4: Blocker zeroes probability');
assert.strictEqual(predBlocked.probabilityTier, 'BLOCKED');
assert.strictEqual(predBlocked.statutoryBlockerPresent, true);
console.log('✅ PASS: T4: Statutory blocker zeroes probability and sets BLOCKED tier');

// Test 5: Rejection risks are explained with transparent data provenance
assert(predAll.benchmark.dataSourceProvenance.length > 10, 'T5: Data provenance string present');
assert(predAll.benchmark.auditedApplicationsCount > 10000, 'T5b: Audited sample count populated');
assert(pred0.topRecommendations.length > 0, 'T5c: Recommendations provided when docs pending');
console.log('✅ PASS: T5: Rejection risk mitigation & data provenance verified');

console.log('=== ALL SUCCESS RATE PREDICTOR TESTS PASSED ===');
