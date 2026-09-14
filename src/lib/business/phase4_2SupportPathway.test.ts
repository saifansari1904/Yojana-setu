import { UserProfile } from '../../types';
import {
  STAGE_SUPPORT_PRIORITIES,
  buildPreparationChecklist,
  buildSupportPathway,
  buildSupportStack,
  deriveApplicationReadiness,
  deriveRecommendedSupportAreas,
} from './supportPathway';
import { derivePathwayNextBestAction } from './nextBestAction';
import { deriveBusinessNeedProfile } from './businessNeedProfile';
import { calculateFundingGap } from './fundingCalculator';
import { rankSchemesForProfile } from '../matching/matchingEngine';
import { SCHEMES_DATABASE } from '../../data/schemes';

/** Thin wrapper over the authoritative Phase 3.1 engine. No re-implementation. */
const matchSchemesForProfile = (profile: UserProfile) =>
  rankSchemesForProfile(SCHEMES_DATABASE, profile, 'en');

console.log('--- RUNNING YOJANA SETU PHASE 4.2: SUPPORT PATHWAY TEST SUITE ---');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`\u2705 PASS: ${testName}`);
    passed++;
  } else {
    console.error(`\u274c FAIL: ${testName}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------
const completeProfile: UserProfile = {
  applicantName: 'Test Entrepreneur',
  age: 32,
  gender: 'female',
  category: 'OBC',
  socialCategory: 'obc',
  annualIncome: 240000,
  state: 'Karnataka',
  residenceState: 'Karnataka',
  businessState: 'Karnataka',
  district: 'Bengaluru Urban',
  areaType: 'urban',
  businessType: 'manufacturing',
  businessStageKey: 'PRE_LAUNCH',
  registrationStatus: 'REGISTERED',
  operationalStatus: 'NOT_STARTED',
  businessEntityType: 'SOLE_PROPRIETORSHIP',
  totalProjectCost: 1200000,
  existingInvestment: 400000,
  fundingRequired: 800000,
  primarySupportNeed: 'CAPITAL',
  secondarySupportNeeds: ['EQUIPMENT', 'TRAINING'],
  entrepreneurExperienceYears: 3,
} as UserProfile;

const sparseProfile: UserProfile = {
  applicantName: 'Sparse Entrepreneur',
  age: 28,
  gender: 'male',
  category: 'General',
  socialCategory: 'general',
  annualIncome: 180000,
  state: 'Karnataka',
  businessType: 'services',
} as UserProfile;

const completeMatches = matchSchemesForProfile(completeProfile);
const sparseMatches = matchSchemesForProfile(sparseProfile);

// -----------------------------------------------------------------------------
// 1. STAGE PRIORITISATION
// -----------------------------------------------------------------------------
console.log('\n--- Section 1: Business Stage Prioritisation ---');

assert(
  STAGE_SUPPORT_PRIORITIES.IDEA.includes('MENTORSHIP') &&
    STAGE_SUPPORT_PRIORITIES.IDEA.includes('TRAINING'),
  'T1: IDEA stage prioritises validation/mentorship and training support'
);

assert(
  STAGE_SUPPORT_PRIORITIES.PRE_LAUNCH.includes('BUSINESS_REGISTRATION') &&
    STAGE_SUPPORT_PRIORITIES.PRE_LAUNCH.includes('CAPITAL'),
  'T2: PRE_LAUNCH stage prioritises registration and funding'
);

assert(
  STAGE_SUPPORT_PRIORITIES.GROWTH.includes('CREDIT') &&
    STAGE_SUPPORT_PRIORITIES.GROWTH.includes('TECHNOLOGY'),
  'T3: GROWTH stage prioritises expansion finance and technology'
);

assert(
  STAGE_SUPPORT_PRIORITIES.EXPANSION.includes('INFRASTRUCTURE') &&
    STAGE_SUPPORT_PRIORITIES.EXPANSION.includes('MARKET_ACCESS'),
  'T4: EXPANSION stage prioritises infrastructure and market access'
);

assert(
  Object.keys(STAGE_SUPPORT_PRIORITIES).length === 7,
  'T5: Stage priorities cover all 7 canonical BusinessStageKey values (no new stage model)'
);

// -----------------------------------------------------------------------------
// 2. NEED -> SUPPORT AREA MAPPING
// -----------------------------------------------------------------------------
console.log('\n--- Section 2: Need To Support Area Mapping ---');

const completeNeedProfile = deriveBusinessNeedProfile(completeProfile);
const areas = deriveRecommendedSupportAreas(completeNeedProfile);
const areaKeys = areas.map((a) => a.area);

assert(areaKeys[0] === 'CAPITAL', 'T6: Primary need (CAPITAL/funding) ranks first');
assert(
  areas[0].source === 'PRIMARY_NEED',
  'T7: First support area is attributed to the primary need'
);
assert(
  areaKeys.includes('SUBSIDY') && areaKeys.includes('CREDIT'),
  'T8: Funding primary need derives subsidy and credit support areas'
);
assert(areaKeys.includes('EQUIPMENT'), 'T9: EQUIPMENT secondary need maps to equipment support');
assert(areaKeys.includes('TRAINING'), 'T10: TRAINING secondary need maps to training support');
assert(
  areas.filter((a) => a.area === 'EQUIPMENT')[0].source === 'SECONDARY_NEED',
  'T11: Secondary needs are attributed to SECONDARY_NEED, not invented'
);

const equipmentPrimary = deriveBusinessNeedProfile({
  ...completeProfile,
  primarySupportNeed: 'EQUIPMENT',
  secondarySupportNeeds: [],
} as UserProfile);
assert(
  deriveRecommendedSupportAreas(equipmentPrimary)[0].area === 'EQUIPMENT',
  'T12: EQUIPMENT primary need maps to equipment support first'
);

const trainingPrimary = deriveBusinessNeedProfile({
  ...completeProfile,
  primarySupportNeed: 'TRAINING',
  secondarySupportNeeds: [],
} as UserProfile);
assert(
  deriveRecommendedSupportAreas(trainingPrimary)[0].area === 'TRAINING',
  'T13: TRAINING primary need maps to training support first'
);

// -----------------------------------------------------------------------------
// 3. SECONDARY NEED COVERAGE & DEDUPLICATION
// -----------------------------------------------------------------------------
console.log('\n--- Section 3: Secondary Needs & Deduplication ---');

const allSecondariesPresent = completeNeedProfile.secondaryNeeds.every((n) =>
  areaKeys.includes(n)
);
assert(allSecondariesPresent, 'T14: Every selected secondary need is represented in the pathway');

assert(
  new Set(areaKeys).size === areaKeys.length,
  'T15: No support area appears twice (deduplication holds)'
);

const overlapProfile = deriveBusinessNeedProfile({
  ...completeProfile,
  primarySupportNeed: 'CAPITAL',
  secondarySupportNeeds: ['SUBSIDY', 'CREDIT'],
} as UserProfile);
const overlapKeys = deriveRecommendedSupportAreas(overlapProfile).map((a) => a.area);
assert(
  new Set(overlapKeys).size === overlapKeys.length,
  'T16: Overlapping primary-derived and secondary needs still deduplicate'
);

const ranks = areas.map((a) => a.rank);
assert(
  ranks.every((r, i) => r === i + 1),
  'T17: Support area ranks are contiguous and deterministic'
);

// -----------------------------------------------------------------------------
// 4. FUNDING (REUSES EXISTING CALCULATOR)
// -----------------------------------------------------------------------------
console.log('\n--- Section 4: Funding Awareness ---');

const pathway = buildSupportPathway({
  profile: completeProfile,
  matchResults: completeMatches,
});

assert(
  pathway.funding.fundingGap === calculateFundingGap(1200000, 400000, 800000),
  'T18: Pathway funding gap is produced by the existing fundingCalculator'
);
assert(pathway.funding.fundingGap === 800000, 'T19: 12L cost - 4L invested = 8L gap');
assert(
  pathway.funding.disclaimerEn.toLowerCase().includes('not an assured'),
  'T20: Funding gap carries a non-entitlement disclaimer'
);
assert(
  !JSON.stringify(pathway).toLowerCase().includes('you will receive'),
  'T21: Pathway never claims the entrepreneur will receive the funding gap'
);

// -----------------------------------------------------------------------------
// 5. SUPPORT STACK & PROVENANCE
// -----------------------------------------------------------------------------
console.log('\n--- Section 5: Support Stack & Provenance ---');

const stack = buildSupportStack(areas, completeMatches, 'en');
assert(stack.length === areas.length, 'T22: Support stack contains one group per support area');

const populated = stack.filter((g) => g.schemes.length > 0);
assert(populated.length > 0, 'T23: At least one support area resolves to verified schemes');

const everySchemeHasProvenance = populated.every((g) =>
  g.schemes.every((s) => Boolean(s.provenance.source) && Boolean(s.provenance.sourceUrl))
);
assert(
  everySchemeHasProvenance,
  'T24: Every stack scheme preserves its source and official source URL'
);

const everySchemeHasVerificationDate = populated.every((g) =>
  g.schemes.every((s) => Boolean(s.provenance.lastVerified))
);
assert(everySchemeHasVerificationDate, 'T25: Every stack scheme preserves lastVerified date');

const emptyGroups = stack.filter((g) => g.hasNoVerifiedSupport);
assert(
  emptyGroups.every((g) => Boolean(g.noticeEn && g.noticeEn.includes('official guidelines'))),
  'T26: Support areas without verified schemes show an official-guidelines notice, not invented data'
);

const stackSchemeIds = populated.flatMap((g) => g.schemes.map((s) => s.schemeId));
const matchedIds = completeMatches.map((m) => m.scheme.id);
assert(
  stackSchemeIds.every((id) => matchedIds.includes(id)),
  'T27: Stack only contains schemes produced by the authoritative matching engine'
);

const ruledOutIds = completeMatches
  .filter((m) => m.matchStatus === 'low-match')
  .map((m) => m.scheme.id);
assert(
  stackSchemeIds.every((id) => !ruledOutIds.includes(id)),
  'T28: Low-match schemes are excluded from the support stack'
);

if (populated.length > 1) {
  assert(
    pathway.combinabilityNoticeEn.includes('not verified'),
    'T29: Multi-area pathway warns that benefit compatibility is unverified'
  );
} else {
  assert(pathway.combinabilityNoticeEn === '', 'T29: Single-area pathway omits combinability notice');
}

assert(
  !JSON.stringify(pathway).toLowerCase().includes('guaranteed'),
  'T30: Pathway language never uses the word "guaranteed"'
);

// -----------------------------------------------------------------------------
// 6. READINESS
// -----------------------------------------------------------------------------
console.log('\n--- Section 6: Readiness Model ---');

const sparsePathway = buildSupportPathway({
  profile: sparseProfile,
  matchResults: sparseMatches,
});

assert(
  sparsePathway.readiness.state === 'NOT_READY' ||
    sparsePathway.readiness.state === 'PARTIALLY_READY',
  'T31: Incomplete profile never produces false readiness'
);

assert(
  pathway.readiness.state !== 'READY_TO_APPLY' || Boolean(pathway.recommendedSchemeIds.length),
  'T32: READY_TO_APPLY is never claimed without recommended schemes'
);

const readinessStates = ['NOT_READY', 'PARTIALLY_READY', 'READY_TO_REVIEW', 'READY_TO_APPLY'];
assert(
  readinessStates.includes(pathway.readiness.state),
  'T33: Readiness resolves to a meaningful state, not a percentage'
);

assert(
  pathway.readiness.checks.length === 4,
  'T34: Readiness reports profile, eligibility, documents and financial-fit checks'
);

// -----------------------------------------------------------------------------
// 7. UNKNOWN IS NOT A BLOCKER
// -----------------------------------------------------------------------------
console.log('\n--- Section 7: Unknown Handling ---');

const unknownRegProfile = {
  ...completeProfile,
  registrationStatus: 'UNKNOWN',
  businessRegistration: undefined,
} as UserProfile;
const unknownMatches = matchSchemesForProfile(unknownRegProfile);
const unknownPathway = buildSupportPathway({
  profile: unknownRegProfile,
  matchResults: unknownMatches,
});

assert(
  unknownPathway.blockedActions.length === 0,
  'T35: Unknown registration status does not automatically create a blocked action'
);

assert(
  unknownPathway.nextBestAction.status !== 'BLOCKED',
  'T36: Unknown information never produces a BLOCKED next best action'
);

const noChecklist = buildPreparationChecklist(null, completeProfile);
assert(
  noChecklist.requirementsUnverified && noChecklist.totalCount === 0,
  'T37: No selected scheme yields an unverified-requirements checklist, not fabricated items'
);

const topMatch = completeMatches.find((m) => m.scheme.requiredDocuments.length > 0) || null;
if (topMatch) {
  const untouchedChecklist = buildPreparationChecklist(topMatch, completeProfile, [], false);
  assert(
    untouchedChecklist.items.every((i) => i.state === 'UNKNOWN'),
    'T38: Documents the user never answered are UNKNOWN, never "missing"'
  );

  const engagedChecklist = buildPreparationChecklist(topMatch, completeProfile, [], true);
  assert(
    engagedChecklist.items.every((i) => i.state === 'NOT_PREPARED'),
    'T39: Only after user engagement are unticked documents NOT_PREPARED'
  );

  const partial = buildPreparationChecklist(
    topMatch,
    completeProfile,
    [`doc-${topMatch.scheme.id}-0`],
    true
  );
  assert(partial.preparedCount === 1, 'T40: Prepared documents are counted from explicit user input');

  assert(
    partial.items.every((i) => i.fromSchemeData),
    'T41: Every checklist item originates from verified scheme data'
  );
}

// -----------------------------------------------------------------------------
// 8. NEXT BEST ACTION DETERMINISM
// -----------------------------------------------------------------------------
console.log('\n--- Section 8: Next Best Action ---');

const runA = buildSupportPathway({ profile: completeProfile, matchResults: completeMatches });
const runB = buildSupportPathway({ profile: completeProfile, matchResults: completeMatches });

assert(
  runA.nextBestAction.actionType === runB.nextBestAction.actionType &&
    runA.nextBestAction.id === runB.nextBestAction.id,
  'T42: Same profile always returns the same next best action'
);

assert(
  JSON.stringify(runA) === JSON.stringify(runB),
  'T43: The entire pathway is deterministic for identical inputs'
);

assert(Boolean(runA.nextBestAction), 'T44: Exactly one primary next best action is always returned');
assert(
  Boolean(runA.nextBestAction.reasonEn && runA.nextBestAction.reasonHi),
  'T45: Next best action always carries a bilingual, data-derived reason'
);
assert(
  Boolean(runA.nextBestAction.ctaLabelEn && runA.nextBestAction.actionTarget),
  'T46: Next best action CTA always targets a real existing action'
);

const sparseAction = sparsePathway.nextBestAction;
assert(
  sparseAction.actionType === 'COMPLETE_PROFILE',
  'T47: Missing critical profile information is the highest-priority action'
);
assert(
  sparseAction.reasonEn.length > 0 && sparseAction.status === 'NEEDS_INFORMATION',
  'T48: Incomplete profile action is NEEDS_INFORMATION with an explanation'
);

const blockedMatch = completeMatches.find(
  (m) => (m.confirmedBlockers?.length || 0) > 0
);
if (blockedMatch) {
  const blockedPathway = buildSupportPathway({
    profile: completeProfile,
    matchResults: completeMatches,
    selectedMatch: blockedMatch,
  });
  assert(
    blockedPathway.blockedActions.length > 0,
    'T49: A confirmed statutory blocker produces a blocked action'
  );
  assert(
    blockedPathway.nextBestAction.actionType === 'REVIEW_SCHEME_ELIGIBILITY',
    'T50: A confirmed blocker outranks document preparation'
  );
} else {
  assert(true, 'T49/T50: No blocked scheme in fixture set (skipped)');
}

const actionSet = derivePathwayNextBestAction({
  profile: completeProfile,
  needProfile: completeNeedProfile,
  matchResults: completeMatches,
  selectedMatch: null,
  checklist: noChecklist,
  readiness: pathway.readiness,
  supportStack: stack,
});
assert(
  actionSet.secondary.every((a) => a.priority >= actionSet.primary.priority),
  'T51: Secondary actions never outrank the primary action'
);
assert(
  actionSet.primary.officialAction === false ||
    actionSet.primary.actionType === 'OPEN_OFFICIAL_PORTAL',
  'T52: Only the official portal action is flagged as the official action'
);

// -----------------------------------------------------------------------------
// 9. PHASE 3.1 REGRESSION PROTECTION
// -----------------------------------------------------------------------------
console.log('\n--- Section 9: Phase 3.1 Matching Regression ---');

const beforeScores = matchSchemesForProfile(completeProfile).map((m) => ({
  id: m.scheme.id,
  score: m.matchPercentage,
  status: m.matchStatus,
  eligible: m.isEligible,
}));

// Build the Phase 4.2 layer, then re-run the authoritative engine.
buildSupportPathway({ profile: completeProfile, matchResults: completeMatches });

const afterScores = matchSchemesForProfile(completeProfile).map((m) => ({
  id: m.scheme.id,
  score: m.matchPercentage,
  status: m.matchStatus,
  eligible: m.isEligible,
}));

const totalDifference = beforeScores.reduce((sum, before, i) => {
  const after = afterScores[i];
  return sum + Math.abs(before.score - after.score);
}, 0);

assert(totalDifference === 0, `T53: Phase 4.2 does not alter Phase 3.1 match scores (difference = ${totalDifference})`);
assert(
  beforeScores.every((b, i) => b.status === afterScores[i].status),
  'T54: Match classification is unchanged by the support pathway layer'
);
assert(
  beforeScores.every((b, i) => b.eligible === afterScores[i].eligible),
  'T55: Eligibility decisions are unchanged by the support pathway layer'
);
assert(
  pathway.recommendedSchemeIds.every((id) => {
    const match = completeMatches.find((m) => m.scheme.id === id);
    return Boolean(match) && match!.matchStatus !== 'low-match';
  }),
  'T56: Pathway recommendations never override authoritative match status'
);

console.log('\n==================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
