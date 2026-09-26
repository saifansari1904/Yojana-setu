/**
 * YOJANA SETU — POST-AUTH NAVIGATION REGRESSION TESTS
 *
 * Regression scenarios for the spurious reload auto-navigation bug:
 * on a page reload, the Supabase session can arrive AFTER the boot
 * already resolved as unauthenticated (delayed listener event / slow
 * storage read). The old timing heuristic treated ANY session arriving
 * after setLoading(false) as a "fresh sign-in" and auto-navigated from
 * 'welcome' — firing a mid-boot screen transition whose exit animation
 * could freeze the app on the faded welcome screen.
 *
 * The contract (lib/auth/authState.ts → decidePostAuthNavigation):
 * only EXPLICIT user intent (in-page sign-in this page lifetime, or an
 * OAuth redirect return) navigates off the entry screens. A stored
 * session — however late — stays on welcome.
 *
 * Run: npx tsx src/lib/auth/postAuthNav.test.ts
 */

import { decidePostAuthNavigation } from './authState';

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

const UID = 'user-123';
const OTHER_UID = 'user-456';

// ── 1. THE BUG: late session on reload must NOT navigate ─────────────
// Simulates: boot resolves (loading=false, no session yet) → delayed
// listener delivers the stored session. No in-page sign-in, no OAuth.
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null,
    currentScreen: 'welcome',
    profileRestore: 'idle',
    inPageSignIn: false,
    oauthReturn: false,
    hasProfile: true,
  });
  assert(d.destination === null, 'late restored session on reload stays on welcome (no nav)');
  assert(d.consumed === true, 'late restored session uid is consumed (seen)');
}

// ── 2. Same, but on the login route ──────────────────────────────────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null,
    currentScreen: 'login',
    profileRestore: 'idle',
    inPageSignIn: false,
    oauthReturn: false,
    hasProfile: false,
  });
  assert(d.destination === null, 'late restored session on login route does not navigate');
}

// ── 3. In-page sign-in WITH profile → results ────────────────────────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null,
    currentScreen: 'login',
    profileRestore: 'idle',
    inPageSignIn: true,
    oauthReturn: false,
    hasProfile: true,
  });
  assert(d.destination === 'results', 'in-page sign-in with profile navigates to results');
  assert(d.consumed === true, 'in-page sign-in uid is consumed');
}

// ── 4. In-page sign-in WITHOUT profile → form ───────────────────────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null,
    currentScreen: 'welcome',
    profileRestore: 'idle',
    inPageSignIn: true,
    oauthReturn: false,
    hasProfile: false,
  });
  assert(d.destination === 'form', 'in-page sign-in without profile navigates to form');
}

// ── 5. OAuth redirect return navigates (no in-page flag needed) ─────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null,
    currentScreen: 'welcome',
    profileRestore: 'idle',
    inPageSignIn: false,
    oauthReturn: true,
    hasProfile: false,
  });
  assert(d.destination === 'form', 'OAuth return navigates even without in-page flag');
}

// ── 6. Restore pending: no nav, uid NOT consumed ─────────────────────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null,
    currentScreen: 'welcome',
    profileRestore: 'pending',
    inPageSignIn: true,
    oauthReturn: false,
    hasProfile: false,
  });
  assert(d.destination === null, 'profile restore pending blocks navigation');
  assert(d.consumed === false, 'profile restore pending does NOT consume the uid');
}

// ── 7. After restore settles, the same uid navigates ────────────────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null, // still null — pending pass did not consume it
    currentScreen: 'welcome',
    profileRestore: 'done',
    inPageSignIn: true,
    oauthReturn: false,
    hasProfile: true,
  });
  assert(d.destination === 'results', 'post-restore settled uid navigates to results');
}

// ── 8. Duplicate uid never re-navigates ──────────────────────────────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: UID,
    currentScreen: 'welcome',
    profileRestore: 'idle',
    inPageSignIn: true,
    oauthReturn: false,
    hasProfile: true,
  });
  assert(d.destination === null, 'duplicate uid delivery does not re-navigate');
}

// ── 9. Off entry screens: no nav, uid consumed ───────────────────────
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: null,
    currentScreen: 'results',
    profileRestore: 'idle',
    inPageSignIn: true,
    oauthReturn: false,
    hasProfile: true,
  });
  assert(d.destination === null, 'session on results screen does not navigate');
  assert(d.consumed === true, 'off-entry uid is still consumed');
}

// ── 10. No uid (signed out) ─────────────────────────────────────────
{
  const d = decidePostAuthNavigation({
    uid: null,
    prevUid: UID,
    currentScreen: 'welcome',
    profileRestore: 'idle',
    inPageSignIn: false,
    oauthReturn: false,
    hasProfile: false,
  });
  assert(d.destination === null, 'null uid never navigates');
  assert(d.consumed === true, 'null uid pass is consumed');
}

// ── 11. A DIFFERENT user signing in is a new uid ─────────────────────
{
  const d = decidePostAuthNavigation({
    uid: OTHER_UID,
    prevUid: UID,
    currentScreen: 'welcome',
    profileRestore: 'idle',
    inPageSignIn: true,
    oauthReturn: false,
    hasProfile: false,
  });
  assert(d.destination === 'form', 'different uid is treated as a new sign-in');
}

// ── 12. Intent is one-shot: consumed uid + cleared flag = no-op ──────
// (Models App clearing inPageSignInRef after navigating.)
{
  const d = decidePostAuthNavigation({
    uid: UID,
    prevUid: UID, // consumed by the navigating pass
    currentScreen: 'results',
    profileRestore: 'idle',
    inPageSignIn: false, // cleared after navigating
    oauthReturn: false,
    hasProfile: true,
  });
  assert(d.destination === null, 'post-navigation re-fire is a no-op');
}

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} assertions.`);
if (failed > 0) process.exit(1);
