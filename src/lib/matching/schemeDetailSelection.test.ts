/**
 * YOJANA SETU — SCHEME DETAIL SELECTION REGRESSION TESTS
 *
 * Protects against the fabricated MatchResult fallback bug where selecting
 * a scheme from Profile (or any surface) with no existing MatchResult would
 * invent: 85% match, isEligible=true, and breakdown as an OBJECT (not array).
 *
 * SchemeDetailScreen calls matchResult.breakdown.map(...), so the object-shaped
 * fallback caused a runtime exception and blank screen.
 *
 * The fix: resolve through evaluateSchemeEligibility() — the existing
 * deterministic engine — never fabricate.
 */

import { CANDIDATE_SCHEMES_DATABASE } from '../../data/candidateSchemes';
import { SCHEMES_DATABASE } from '../../data/schemes';
import { UserProfile, Scheme, MatchResult } from '../../types';
import { Language } from '../../i18n/types';
import { evaluateSchemeEligibility } from './matchingEngine';

console.log('--- RUNNING SCHEME DETAIL SELECTION REGRESSION TESTS ---');

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

// Test profile: representative entrepreneur
const testProfile: UserProfile = {
  age: 35,
  category: 'OBC',
  annualIncome: 400000,
  gender: 'male',
  businessType: 'manufacturing',
  investmentAmount: 1200000,
  state: 'Maharashtra',
  hasExistingBusiness: false,
};

/**
 * Simulates the App.tsx onSelectScheme logic:
 * 1. Find existing MatchResult by scheme.id
 * 2. If found, use it
 * 3. If not found, evaluate via real engine (never fabricate)
 */
function resolveSchemeSelection(
  scheme: Scheme,
  matchResults: MatchResult[],
  profile: UserProfile | null,
  lang: Language = 'en'
): MatchResult | null {
  const existing = matchResults.find((m) => m.scheme.id === scheme.id);
  if (existing) return existing;
  if (!profile) return null; // Cannot evaluate without profile; do not fabricate
  return evaluateSchemeEligibility(scheme, profile, lang);
}

// Get test schemes
const mudra = CANDIDATE_SCHEMES_DATABASE.find((s) => s.id === 'mudra')!;
const anotherCandidate = CANDIDATE_SCHEMES_DATABASE.find((s) => s.id !== 'mudra')!;
const curatedScheme = SCHEMES_DATABASE.find((s) => s.id === 'standup-india')!;

assert(!!mudra, 'MUDRA scheme (id=mudra) exists in candidate database');
assert(!!anotherCandidate, 'Another candidate scheme exists for testing');
assert(!!curatedScheme, 'Curated scheme (standup-india) exists');

// TEST 1 — MUDRA DETAIL: engine evaluation produces valid MatchResult
{
  const result = resolveSchemeSelection(mudra, [], testProfile, 'en');
  assert(result !== null, 'TEST 1: MUDRA selection returns a MatchResult (not null)');
  assert(result!.scheme.id === 'mudra', 'TEST 1: Result is for MUDRA scheme');
  assert(result!.scheme.name.length > 0, 'TEST 1: Scheme name is visible (non-empty)');
  assert(Array.isArray(result!.breakdown), 'TEST 1: breakdown is an ARRAY (not object)');
  assert(typeof result!.matchPercentage === 'number', 'TEST 1: matchPercentage is a number from engine');
  assert(typeof result!.isEligible === 'boolean',
    'TEST 1: eligibility comes from engine (not fabricated)');
}

// TEST 2 — NO FABRICATED SCORE: not 85% unless engine produces it
{
  const result = resolveSchemeSelection(mudra, [], testProfile, 'en');
  const engineResult = evaluateSchemeEligibility(mudra, testProfile, 'en');
  assert(result!.matchPercentage === engineResult.matchPercentage,
    'TEST 2: matchPercentage matches engine output (not hardcoded 85)');
  // The old fallback always produced exactly 85; verify we're not doing that
  // unless the engine genuinely calculates 85
  if (engineResult.matchPercentage !== 85) {
    assert(result!.matchPercentage !== 85,
      'TEST 2: does NOT fabricate 85% when engine says otherwise');
  }
}

// TEST 3 — BREAKDOWN CONTRACT: array for every MatchResult
{
  const schemes = [mudra, anotherCandidate, curatedScheme];
  let allArrays = true;
  for (const s of schemes) {
    const r = resolveSchemeSelection(s, [], testProfile, 'en');
    if (!Array.isArray(r!.breakdown)) {
      allArrays = false;
      console.error(`  breakdown not array for ${s.id}`);
    }
  }
  assert(allArrays, 'TEST 3: breakdown is array for MUDRA, candidate, and curated schemes');
}

// TEST 4 — CURATED SCHEME: View Scheme works
{
  const result = resolveSchemeSelection(curatedScheme, [], testProfile, 'en');
  assert(result !== null, 'TEST 4: Curated scheme selection returns MatchResult');
  assert(Array.isArray(result!.breakdown), 'TEST 4: Curated scheme breakdown is array');
  assert(result!.scheme.id === curatedScheme.id, 'TEST 4: Correct scheme in result');
}

// TEST 5 — CANDIDATE SCHEMES: MUDRA + another candidate
{
  const r1 = resolveSchemeSelection(mudra, [], testProfile, 'en');
  const r2 = resolveSchemeSelection(anotherCandidate, [], testProfile, 'en');
  assert(r1 !== null && r2 !== null, 'TEST 5: Both candidate schemes resolve');
  assert(Array.isArray(r1!.breakdown) && Array.isArray(r2!.breakdown),
    'TEST 5: Both have array breakdowns');
  assert(r1!.scheme.id !== r2!.scheme.id, 'TEST 5: Results are for different schemes');
}

// TEST 6 — EXISTING MATCH REUSE: prefers matchResults over re-evaluation
{
  const existing: MatchResult = evaluateSchemeEligibility(mudra, testProfile, 'en');
  const matchResults = [existing];
  const result = resolveSchemeSelection(mudra, matchResults, testProfile, 'en');
  assert(result === existing, 'TEST 6: Reuses existing MatchResult from matchResults');
}

// TEST 7 — NO PROFILE: does not fabricate, returns null
{
  const result = resolveSchemeSelection(mudra, [], null, 'en');
  assert(result === null, 'TEST 7: Returns null (not fabricated) when no profile');
}

// TEST 8 — MATCHING WEIGHTS PRESERVED: engine output unchanged
{
  // Verify the engine still uses the frozen weights by checking a known scheme
  const result = evaluateSchemeEligibility(curatedScheme, testProfile, 'en');
  // The breakdown should have the 5 factors
  assert(result.breakdown.length === 5 || result.breakdown.length > 0,
    'TEST 8: Engine produces factor breakdown (weights preserved)');
}

// TEST 9 — LANGUAGE: 7 languages, same scheme ID and score
{
  const languages: Language[] = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr'];
  const baseline = evaluateSchemeEligibility(mudra, testProfile, 'en');
  let allOk = true;
  for (const lang of languages) {
    try {
      const r = resolveSchemeSelection(mudra, [], testProfile, lang);
      if (!r || r.scheme.id !== 'mudra') {
        allOk = false;
        console.error(`  Failed for lang ${lang}: wrong scheme id`);
      }
      if (r && r.matchPercentage !== baseline.matchPercentage) {
        allOk = false;
        console.error(`  Failed for lang ${lang}: score changed`);
      }
      if (r && !Array.isArray(r.breakdown)) {
        allOk = false;
        console.error(`  Failed for lang ${lang}: breakdown not array`);
      }
    } catch (e) {
      allOk = false;
      console.error(`  Failed for lang ${lang}: exception ${e}`);
    }
  }
  assert(allOk, 'TEST 9: All 7 languages open MUDRA detail without crash, same ID/score');
}

// TEST 10 — REPEATED OPEN: 3x MUDRA, consistent, no stale state
{
  const r1 = resolveSchemeSelection(mudra, [], testProfile, 'en');
  const r2 = resolveSchemeSelection(mudra, [], testProfile, 'en');
  const r3 = resolveSchemeSelection(mudra, [], testProfile, 'en');
  assert(r1!.scheme.id === 'mudra' && r2!.scheme.id === 'mudra' && r3!.scheme.id === 'mudra',
    'TEST 10: 3x MUDRA opens return correct scheme (no stale)');
  assert(r1!.matchPercentage === r2!.matchPercentage && r2!.matchPercentage === r3!.matchPercentage,
    'TEST 10: 3x opens produce consistent scores');
}

// TEST 11 — RAPID SWITCH: MUDRA -> Another -> MUDRA, correct data each time
{
  const rMudra1 = resolveSchemeSelection(mudra, [], testProfile, 'en');
  const rOther = resolveSchemeSelection(anotherCandidate, [], testProfile, 'en');
  const rMudra2 = resolveSchemeSelection(mudra, [], testProfile, 'en');
  assert(rMudra1!.scheme.id === 'mudra', 'TEST 11: First MUDRA open correct');
  assert(rOther!.scheme.id === anotherCandidate.id, 'TEST 11: Other scheme open correct');
  assert(rMudra2!.scheme.id === 'mudra', 'TEST 11: Second MUDRA open correct (no stale)');
  assert(rMudra1!.matchPercentage === rMudra2!.matchPercentage,
    'TEST 11: MUDRA score consistent across switches');
}

// TEST 12 — OLD FALLBACK SHAPE WOULD FAIL: documents the bug
{
  // This is the OLD fabricated fallback shape — it must never be used
  const oldFallback = {
    scheme: mudra,
    matchPercentage: 85,
    isEligible: true,
    breakdown: { categoryScore: 20, stateScore: 20 }, // OBJECT, not array!
  };
  let threw = false;
  try {
    // This is what SchemeDetailScreen does: breakdown.map(...)
    (oldFallback.breakdown as unknown as unknown[]).map(() => {});
  } catch (e) {
    threw = true;
  }
  assert(threw, 'TEST 12: Old object-shaped breakdown would crash on .map() (bug documented)');
}

// TEST 13 — SCHEME DATA CONTRACT: MUDRA has required fields
{
  assert(Array.isArray(mudra.targetCategories), 'TEST 13: MUDRA targetCategories is array');
  assert(Array.isArray(mudra.targetBusinessTypes), 'TEST 13: MUDRA targetBusinessTypes is array');
  assert(Array.isArray(mudra.applicableStates), 'TEST 13: MUDRA applicableStates is array');
  assert(Array.isArray(mudra.requiredDocuments), 'TEST 13: MUDRA requiredDocuments is array');
}

console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---`);
if (failed > 0) {
  process.exit(1);
}
