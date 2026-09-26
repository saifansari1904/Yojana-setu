/**
 * YOJANA SETU — AUTH STATE MACHINE REGRESSION TESTS
 *
 * §20 regression scenarios for Bug A (auth truth):
 *  1. Fresh login → login screen never mounted while authenticated.
 *  2. Returning session on refresh → no login flash while loading.
 *  3. Boot restore `null` arriving after a valid auth event → session NOT cleared.
 *  4. Logout → unauthenticated; login screen allowed again; sign-out always commits.
 *
 * These exercise the pure contract in lib/auth/authState.ts (the exact
 * functions AuthContext and App branch on), so a regression here fails
 * before it can reach the UI.
 *
 * Run: npx tsx src/lib/auth/authStateMachine.test.ts
 */

import {
  resolveAuthStatus,
  canShowLoginScreen,
  isProfileRestorePending,
  AuthSessionArbiter,
} from './authState';

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

const cloudUser = { isLocal: false };
const localUser = { isLocal: true };

// ------------------------------------------------------------------
// §20.1 — resolveAuthStatus: loading dominates, local is never auth'd
// ------------------------------------------------------------------
assert(resolveAuthStatus(true, cloudUser) === 'loading', '§20.1 loading+cloud user -> loading (never authenticated mid-restore)');
assert(resolveAuthStatus(true, null) === 'loading', '§20.1 loading+no user -> loading (never unauthenticated mid-restore)');
assert(resolveAuthStatus(false, cloudUser) === 'authenticated', '§20.1 settled cloud session -> authenticated');
assert(resolveAuthStatus(false, localUser) === 'unauthenticated', '§20.1 local/guest user -> unauthenticated (never authenticated)');
assert(resolveAuthStatus(false, null) === 'unauthenticated', '§20.1 settled no session -> unauthenticated');

// ------------------------------------------------------------------
// §20.2 — canShowLoginScreen: the ONLY mount gate
// ------------------------------------------------------------------
assert(canShowLoginScreen('unauthenticated', 'login') === true, '§20.4 logout -> login screen allowed on the login route');
assert(canShowLoginScreen('loading', 'login') === false, '§20.2 returning session on refresh -> login screen NOT mounted while loading (no flash)');
assert(canShowLoginScreen('authenticated', 'login') === false, '§20.1 fresh login -> login screen NEVER mounted while authenticated');
assert(canShowLoginScreen('unauthenticated', 'home') === false, 'login screen not mounted off the login route');
assert(canShowLoginScreen('unauthenticated', 'results') === false, 'login screen not mounted on the results route');
assert(canShowLoginScreen('loading', 'home') === false, 'loading on any other route -> no login screen');

// ------------------------------------------------------------------
// §20.11 — profile-restore gate: navigation waits for the restore
// ------------------------------------------------------------------
assert(isProfileRestorePending('pending') === true, '§20.11 restore pending -> navigation/UI must wait');
assert(isProfileRestorePending('idle') === false, 'restore idle -> no wait');
assert(isProfileRestorePending('done') === false, 'restore done -> no wait');

// ------------------------------------------------------------------
// §20.3 — AuthSessionArbiter: stale null boot read never clears a session
// ------------------------------------------------------------------
{
  // Race: boot read in flight, listener delivers a valid session first,
  // then the boot read resolves null. The null must be discarded.
  const arbiter = new AuthSessionArbiter();
  const readGeneration = arbiter.captureForBootRead(); // gen 0
  arbiter.beginApply(); // listener commits the valid session -> gen 1
  arbiter.recordApplied('user-123');
  assert(
    arbiter.isBootReadFresh(readGeneration) === false,
    '§20.3 stale boot read (listener applied first) is rejected — null result discarded',
  );
}
{
  // No race: boot read resolves before any listener event -> it commits.
  const arbiter = new AuthSessionArbiter();
  const readGeneration = arbiter.captureForBootRead();
  assert(
    arbiter.isBootReadFresh(readGeneration) === true,
    '§20.3 fresh boot read (no concurrent apply) is accepted',
  );
}
{
  // Listener applied before the boot read started -> the read is the newer
  // writer's contemporary and may commit (generation matches).
  const arbiter = new AuthSessionArbiter();
  arbiter.beginApply();
  const readGeneration = arbiter.captureForBootRead();
  assert(
    arbiter.isBootReadFresh(readGeneration) === true,
    '§20.3 read captured after the apply is not stale',
  );
}

// ------------------------------------------------------------------
// Duplicate-delivery guard: INITIAL_SESSION echo / token refresh no-op
// ------------------------------------------------------------------
{
  const arbiter = new AuthSessionArbiter();
  assert(arbiter.isDuplicateDelivery('user-123') === false, 'first delivery of a uid is not a duplicate');
  arbiter.recordApplied('user-123');
  assert(arbiter.isDuplicateDelivery('user-123') === true, 'duplicate uid delivery is skipped (no double migration/restore)');
  assert(arbiter.isDuplicateDelivery('user-456') === false, 'a different uid always applies');
  assert(arbiter.isDuplicateDelivery(null) === false, 'sign-out (null) is never a duplicate — it always commits');
  arbiter.recordApplied(null);
  assert(arbiter.isDuplicateDelivery('user-123') === false, '§20.4 after sign-out, the same uid signing back in applies');
  assert(arbiter.isDuplicateDelivery(null) === false, 'repeated sign-out still commits (idempotent, never skipped)');
}

console.log(`\n--- AUTH STATE MACHINE: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
