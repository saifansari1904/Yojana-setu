import { SCHEMES_DATABASE } from '../data/schemes';
import {
  evaluateSchemeEligibility,
  rankSchemesForProfile,
  findAlternativeSchemes,
} from './matchingEngine';
import { UserProfile, Scheme } from '../types';

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

console.log('\n--- RUNNING YOJANA SETU MATCHING ENGINE TEST SUITE ---\n');

// Test 1: All 5 criteria match -> eligible, 100%
{
  const profile: UserProfile = {
    category: 'SC',
    age: 28,
    annualIncome: 250000,
    businessType: 'manufacturing',
    state: 'Maharashtra',
  };
  const pmegp = SCHEMES_DATABASE.find((s) => s.id === 'pmegp-msme')!;
  const result = evaluateSchemeEligibility(pmegp, profile, 'en');

  assert(result.matchPercentage === 100, 'Test 1: All 5 criteria match -> 100% score', `Got ${result.matchPercentage}`);
  assert(result.isEligible === true, 'Test 1: All 5 criteria match -> isEligible is true');
  assert(result.matchStatus === 'eligible', 'Test 1: All 5 criteria match -> matchStatus is eligible');
  assert(result.matchedCount === 5, 'Test 1: Matched count is 5/5');
}

// Test 2: Only income fails -> near-match, 80%, one primary gap with numerical distance
{
  // UP MMYSY has maxAnnualIncomeCap = 600000. Profile has 700000.
  const profile: UserProfile = {
    category: 'OBC',
    age: 25,
    annualIncome: 700000, // ₹1,00,000 above ₹6,00,000 cap
    businessType: 'services',
    state: 'Uttar Pradesh',
  };
  const upMmysy = SCHEMES_DATABASE.find((s) => s.id === 'up-mmysy')!;
  const result = evaluateSchemeEligibility(upMmysy, profile, 'en');

  assert(result.matchPercentage === 80, 'Test 2: Only income fails -> 80% score', `Got ${result.matchPercentage}`);
  assert(result.isEligible === false, 'Test 2: Income exceeds cap -> isEligible is false');
  assert(result.matchStatus === 'near-match', 'Test 2: Only income fails -> matchStatus is near-match');
  assert(result.primaryGap?.factorKey === 'income', 'Test 2: Primary gap is income');
  assert(result.primaryGap?.gapDistance?.includes('above ceiling') === true, 'Test 2: Primary gap specifies gap distance');
}

// Test 3: Business type fails -> not eligible
{
  // SCLCSS MSME supports only ['manufacturing', 'food', 'tech'], profile is 'trading'
  const profile: UserProfile = {
    category: 'SC',
    age: 32,
    annualIncome: 400000,
    businessType: 'trading',
    state: 'Delhi',
  };
  const sclcss = SCHEMES_DATABASE.find((s) => s.id === 'sclcss-msme')!;
  const result = evaluateSchemeEligibility(sclcss, profile, 'en');

  assert(result.isEligible === false, 'Test 3: Ineligible business type -> isEligible is false');
  assert(result.unmetCriteria.some((u) => u.factorKey === 'businessType'), 'Test 3: Business type is in unmet criteria');
}

// Test 4: State-specific scheme + wrong state -> not eligible, state clearly identified as blocker
{
  // CMEGP Maharashtra is restricted to Maharashtra, profile is in Gujarat
  const profile: UserProfile = {
    category: 'General',
    age: 30,
    annualIncome: 500000,
    businessType: 'manufacturing',
    state: 'Gujarat',
  };
  const cmegp = SCHEMES_DATABASE.find((s) => s.id === 'cmegp-maharashtra')!;
  const result = evaluateSchemeEligibility(cmegp, profile, 'en');

  assert(result.isEligible === false, 'Test 4: Wrong state -> isEligible is false');
  assert(result.primaryGap?.factorKey === 'state', 'Test 4: State is primary blocker gap');
  assert(result.primaryGap?.gapDistance?.includes('Maharashtra') === true, 'Test 4: Gap explains restriction to Maharashtra');
}

// Test 5: Several criteria fail -> low-match
{
  // VCF-SC requires SC, age >= 21, tech/mfg/services/food. Profile is General, age 18, trading
  const profile: UserProfile = {
    category: 'General',
    age: 18,
    annualIncome: 1500000,
    businessType: 'trading',
    state: 'Bihar',
  };
  const vcf = SCHEMES_DATABASE.find((s) => s.id === 'vcf-sc')!;
  const result = evaluateSchemeEligibility(vcf, profile, 'en');

  assert(result.matchStatus === 'low-match', 'Test 5: Multiple failures -> low-match', `Got ${result.matchStatus}, score ${result.matchPercentage}`);
  assert(result.isEligible === false, 'Test 5: isEligible is false');
}

// Test 6: No income cap -> income criterion does not penalize user
{
  const profile: UserProfile = {
    category: 'General',
    age: 35,
    annualIncome: 5000000, // High income
    businessType: 'trading',
    state: 'Karnataka',
  };
  const mudra = SCHEMES_DATABASE.find((s) => s.id === 'pm-mudra-tarun')!;
  const result = evaluateSchemeEligibility(mudra, profile, 'en');

  const incomeFactor = result.breakdown.find((b) => b.factorKey === 'income');
  assert(incomeFactor?.matched === true, 'Test 6: No income ceiling -> income factor matched');
  assert(result.matchPercentage === 100, 'Test 6: 100% score for uncapped scheme');
}

// Test 7: National scheme -> state matches all states
{
  const states = ['Kerala', 'Assam', 'Rajasthan', 'Nagaland'];
  const pmegp = SCHEMES_DATABASE.find((s) => s.id === 'pmegp-msme')!;
  let allMatched = true;

  for (const st of states) {
    const prof: UserProfile = {
      category: 'OBC',
      age: 26,
      annualIncome: 300000,
      businessType: 'manufacturing',
      state: st,
    };
    const res = evaluateSchemeEligibility(pmegp, prof, 'en');
    const stateFactor = res.breakdown.find((b) => b.factorKey === 'state');
    if (!stateFactor?.matched) allMatched = false;
  }

  assert(allMatched, 'Test 7: National scheme matches across all tested states');
}

// Test 8: Scheme with only one near-miss criterion -> near-match
{
  // Stand-Up India is for SC, ST, Woman. Profile is OBC male (General/OBC male fails category).
  const profile: UserProfile = {
    category: 'OBC',
    age: 30,
    annualIncome: 400000,
    businessType: 'manufacturing',
    state: 'Punjab',
  };
  const standup = SCHEMES_DATABASE.find((s) => s.id === 'standup-india')!;
  const result = evaluateSchemeEligibility(standup, profile, 'en');

  assert(result.isEligible === false, 'Test 8: Stand-Up India is not eligible for OBC male');
  assert(result.matchStatus === 'near-match', 'Test 8: Fails only category (score 70%) -> near-match', `Got ${result.matchStatus}`);
  assert(result.unmetCriteria.length === 1, 'Test 8: Exactly 1 unmet criterion');
}

// Test 9: Alternative recommendations generation
{
  const profile: UserProfile = {
    category: 'OBC',
    age: 25,
    annualIncome: 800000,
    businessType: 'manufacturing',
    state: 'Uttar Pradesh',
  };
  const upMmysy = SCHEMES_DATABASE.find((s) => s.id === 'up-mmysy')!;
  const alternatives = findAlternativeSchemes(upMmysy, SCHEMES_DATABASE, profile, 'en');

  assert(alternatives.length > 0, 'Test 9: Finds alternative schemes for near-match');
  assert(alternatives[0].matchPercentage >= 75, 'Test 9: Recommended alternative has high match percentage');
}

// Test 10: Intelligent ranking order
{
  const profile: UserProfile = {
    category: 'SC',
    age: 27,
    annualIncome: 350000,
    businessType: 'manufacturing',
    state: 'Maharashtra',
  };
  const ranked = rankSchemesForProfile(SCHEMES_DATABASE, profile, 'en');

  // Top schemes should be eligible
  assert(ranked[0].matchStatus === 'eligible', 'Test 10: Top ranked scheme is eligible');
  // Eligible schemes must come before low-match
  const firstLowMatchIdx = ranked.findIndex((r) => r.matchStatus === 'low-match');
  const lastEligibleIdx = ranked.map((r) => r.matchStatus).lastIndexOf('eligible');
  if (firstLowMatchIdx !== -1 && lastEligibleIdx !== -1) {
    assert(lastEligibleIdx < firstLowMatchIdx, 'Test 10: All eligible schemes rank before low-match schemes');
  }
}

console.log(`\nTEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
if (failed > 0) {
  process.exit(1);
}
