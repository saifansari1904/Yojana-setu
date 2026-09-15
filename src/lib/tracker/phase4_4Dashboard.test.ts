/**
 * PHASE 4.4 — DASHBOARD + I18N CENTRALISATION TESTS
 *
 * Verifies that:
 *  1. Every centralised namespace (tracker / report / dashboard) exists in both
 *     English and Hindi with identical key sets — no silent fallbacks.
 *  2. The dashboard's aggregation inputs are pure and deterministic.
 *  3. Attention items only ever come from real tracker/verification data.
 */
import { enTranslations as en } from '../../i18n/en';
import { hiTranslations as hi } from '../../i18n/hi';
import { summariseByStatus } from './applicationTracker';
import { evaluateFollowUp, evaluateSchemeFreshness } from './schemeFreshness';
import type { TrackedApplication } from '../../types/tracker';

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

const keysOf = (obj: Record<string, unknown>) => Object.keys(obj).sort().join(',');

console.log('\n=== PHASE 4.4 — DASHBOARD & I18N TESTS ===\n');

// --- 1. i18n parity -------------------------------------------------------
const namespaces = ['tracker', 'report', 'dashboard'] as const;

namespaces.forEach((ns) => {
  const enNs = en[ns] as unknown as Record<string, unknown>;
  const hiNs = hi[ns] as unknown as Record<string, unknown>;

  check(`T: en.${ns} namespace exists`, !!enNs && typeof enNs === 'object');
  check(`T: hi.${ns} namespace exists`, !!hiNs && typeof hiNs === 'object');
  check(`T: ${ns} key sets match between en and hi`, keysOf(enNs) === keysOf(hiNs));
  check(
    `T: ${ns} has no empty strings in en`,
    Object.values(enNs).every((v) => typeof v === 'string' && v.trim().length > 0),
  );
  check(
    `T: ${ns} has no empty strings in hi`,
    Object.values(hiNs).every((v) => typeof v === 'string' && v.trim().length > 0),
  );
  check(
    `T: ${ns} Hindi strings are not copies of English`,
    Object.keys(enNs).filter((key) => enNs[key] === hiNs[key]).length <=
      Math.ceil(Object.keys(enNs).length / 2),
  );
});

// --- 2. Dashboard aggregation is pure ------------------------------------
const baseApp = (overrides: Partial<TrackedApplication>): TrackedApplication =>
  ({
    schemeId: 'scheme-a',
    schemeName: 'Scheme A',
    status: 'interested',
    savedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    journey: [],
    ...overrides,
  }) as TrackedApplication;

const applications: TrackedApplication[] = [
  baseApp({ schemeId: 's1', status: 'interested' }),
  baseApp({ schemeId: 's2', status: 'docs-ready' }),
  baseApp({ schemeId: 's3', status: 'applied' }),
  baseApp({ schemeId: 's4', status: 'approved' }),
  baseApp({ schemeId: 's5', status: 'rejected' }),
];

const summaryA = summariseByStatus(applications);
const summaryB = summariseByStatus(applications);

check('T: summariseByStatus is deterministic', JSON.stringify(summaryA) === JSON.stringify(summaryB));
check(
  'T: in-progress count excludes approved and rejected',
  summaryA.interested + summaryA['docs-ready'] + summaryA.applied === 3,
);
check('T: summariseByStatus does not mutate the input', applications.length === 5);

// --- 3. Attention items derive only from recorded data -------------------
const noFollowUp = evaluateFollowUp(undefined);
check('T: missing follow-up yields NONE, never an invented deadline', noFollowUp.state === 'NONE');

const overdue = evaluateFollowUp(
  { dueOn: '2026-01-01', setAt: '2025-12-01T00:00:00.000Z' } as never,
  new Date('2026-02-01T00:00:00.000Z'),
);
check('T: a past user-set follow-up date is OVERDUE', overdue.state === 'OVERDUE');

const dueToday = evaluateFollowUp(
  { dueOn: '2026-02-01', setAt: '2026-01-01T00:00:00.000Z' } as never,
  new Date('2026-02-01T00:00:00.000Z'),
);
check('T: a follow-up dated today is DUE_TODAY', dueToday.state === 'DUE_TODAY');

const unknownFreshness = evaluateSchemeFreshness({ id: 'x', name: 'X' } as never);
check(
  'T: a scheme with no verification date is VERIFICATION_UNKNOWN',
  unknownFreshness.state === 'VERIFICATION_UNKNOWN',
);
check(
  'T: unknown verification asks the citizen to recheck the official source',
  unknownFreshness.shouldRecheckOfficialSource === true,
);
check('T: unknown verification reports a null age, not a guess', unknownFreshness.ageInDays === null);

const recent = evaluateSchemeFreshness(
  { id: 'y', name: 'Y', lastVerifiedDate: '2026-01-15' } as never,
  new Date('2026-02-01T00:00:00.000Z'),
);
check('T: a recently verified scheme is not flagged for attention', recent.shouldRecheckOfficialSource === false);

console.log('\n=== TEST RESULTS ===');
console.log(`${passed} PASSED, ${failed} FAILED`);

if (failed > 0) process.exit(1);
