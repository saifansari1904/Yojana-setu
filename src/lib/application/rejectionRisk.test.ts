import assert from 'node:assert';
import { assessRejectionRisk } from './rejectionRisk';
import type { Scheme } from '../../types/scheme';
import type { MatchResult } from '../../types/matching';
import type { UploadedFileRecord } from '../tracker/documentProgress';

console.log('=== REJECTION RISK ASSESSMENT TESTS ===');

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

const upload = (docId: string, schemeId: string): UploadedFileRecord => ({
  docId,
  schemeId,
  fileName: `${docId.replace(/\s+/g, '_').toLowerCase()}.pdf`,
  fileSize: 500000,
  fileType: 'application/pdf',
  uploadedAt: new Date().toISOString(),
});

// Test 1: Zero documents prepared → every risk open, readiness 0
const a0 = assessRejectionRisk({
  scheme: mockScheme,
  matchResult: mockMatchResult,
  preparedDocIds: [],
  uploadedFiles: {},
});

assert.strictEqual(a0.statutoryBlockerPresent, false);
assert.strictEqual(a0.status, 'RISKS_OPEN');
assert.strictEqual(a0.preparedDocumentsCount, 0);
assert.strictEqual(a0.uploadedDocumentsCount, 0);
assert.strictEqual(a0.documentReadinessPercent, 0);
assert.strictEqual(a0.mitigatedRisks.length, 0);
assert.strictEqual(a0.openRisks.length, a0.riskFactors.length);
assert(a0.topRecommendations.length > 0, 'T1b: Recommendations provided when docs pending');
console.log('✅ PASS: T1: Zero documents → all rejection risks open, readiness 0');

// Test 2: Uploading the DPR mitigates exactly the DPR risk
const a1 = assessRejectionRisk({
  scheme: mockScheme,
  matchResult: mockMatchResult,
  preparedDocIds: ['Detailed Project Report (DPR)'],
  uploadedFiles: { 'Detailed Project Report (DPR)': upload('Detailed Project Report (DPR)', mockScheme.id) },
});

assert(a1.documents.find((d) => d.docName.includes('DPR'))?.isUploaded === true, 'T2: DPR marked uploaded');
assert(a1.mitigatedRisks.some((f) => f.id === 'pmegp_dpr'), 'T2b: DPR risk mitigated');
assert.strictEqual(a1.mitigatedRisks.length, 1);
assert.strictEqual(a1.uploadedDocumentsCount, 1);
console.log('✅ PASS: T2: DPR upload mitigates the DPR rejection risk only');

// Test 3: All PMEGP docs prepared → 3 of 4 risks covered (EDP training has no matching document)
const allDocs = mockScheme.requiredDocuments;
const allUploads: Record<string, UploadedFileRecord> = {};
allDocs.forEach((d) => { allUploads[d] = upload(d, mockScheme.id); });

const aAll = assessRejectionRisk({
  scheme: mockScheme,
  matchResult: mockMatchResult,
  preparedDocIds: allDocs,
  uploadedFiles: allUploads,
});

assert.strictEqual(aAll.documentReadinessPercent, 100);
assert.strictEqual(aAll.mitigatedRisks.length, 3);
assert(aAll.openRisks.some((f) => f.id === 'pmegp_edp'), 'T3b: EDP risk stays open — no training document in dossier');
assert.strictEqual(aAll.status, 'RISKS_OPEN');
console.log('✅ PASS: T3: Full PMEGP dossier covers 3/4 risks; EDP risk honestly remains open');

// Test 4: A dossier covering every common factor reports ALL_COVERED
const genericScheme: Scheme = {
  ...mockScheme,
  id: 'generic-test-scheme',
  requiredDocuments: [
    'Detailed Project Report (DPR)',
    'Income Certificate',
    'Bank Passbook',
    'Udyam Registration Certificate',
    'Aadhaar Card',
  ],
};
const genericMatch: MatchResult = { ...mockMatchResult, scheme: genericScheme };
const genericUploads: Record<string, UploadedFileRecord> = {};
genericScheme.requiredDocuments.forEach((d) => { genericUploads[d] = upload(d, genericScheme.id); });

const aCovered = assessRejectionRisk({
  scheme: genericScheme,
  matchResult: genericMatch,
  preparedDocIds: genericScheme.requiredDocuments,
  uploadedFiles: genericUploads,
});

assert.strictEqual(aCovered.openRisks.length, 0);
assert.strictEqual(aCovered.status, 'ALL_COVERED');
assert.strictEqual(aCovered.topRecommendations.length, 0);
console.log('✅ PASS: T4: Dossier covering every common factor → ALL_COVERED');

// Test 5: Statutory blocker short-circuits with BLOCKED status
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

const aBlocked = assessRejectionRisk({
  scheme: mockScheme,
  matchResult: blockedMatch,
  preparedDocIds: allDocs,
  uploadedFiles: allUploads,
});

assert.strictEqual(aBlocked.status, 'BLOCKED');
assert.strictEqual(aBlocked.statutoryBlockerPresent, true);
assert.deepStrictEqual(aBlocked.blockerLabels, ['Excluded sector']);
console.log('✅ PASS: T5: Statutory blocker → BLOCKED with blocker label surfaced');

// Test 6: Honesty guard — the assessment must never carry invented statistics
assert(!('probabilityPercent' in a0), 'T6: No probabilityPercent field');
assert(!('baselineRate' in a0), 'T6b: No baselineRate field');
assert(!('maxPossibleRate' in a0), 'T6c: No maxPossibleRate field');
for (const f of a0.riskFactors) {
  assert(!('sharePercentage' in f), `T6d: Risk factor ${f.id} carries no share percentage`);
}
for (const r of a0.topRecommendations) {
  assert(!('gainPercent' in r), 'T6e: Recommendations carry no percentage gains');
}
console.log('✅ PASS: T6: No fabricated statistics anywhere in the assessment');

// Test 7: Recommendations lead with the most critical pending document (DPR)
assert(a0.topRecommendations[0].docName.includes('DPR'), 'T7: DPR recommended first');
console.log('✅ PASS: T7: Recommendations ordered by document criticality');

console.log('=== ALL REJECTION RISK TESTS PASSED ===');
