/**
 * YOJANA SETU — PROFILE OWNERSHIP TESTS (spec §20)
 * ------------------------------------------------------------------
 * Verifies the user-scoped local profile ownership model:
 *
 * Guest profile:          yojana_setu_guest_profile_v1
 * Authenticated profile:  yojana_setu_user_profile_v2:<SUPABASE_UID>
 * Legacy (read-only):     yojana_setu_user_profile_v1
 *
 * Covers spec §20 tests 1–16:
 *  1. Guest profile remains guest-only.
 *  2. User A profile stored under A UID.
 *  3. User B profile stored under B UID.
 *  4. User A cannot load B profile.
 *  5. User B cannot load A profile.
 *  6. Logout does not delete cloud profile.
 *  7. Login restores correct cloud profile.
 *  8. User A logout → User B login.
 *  9. User B logout → User A login.
 * 10. Legacy v1 profile migration.
 * 11. Unowned v1 profile is not assigned to arbitrary user.
 * 12. Guest → account migration still works.
 * 13. Authenticated save never writes to guest key.
 * 14. Logout clears syncUserId.
 * 15. Next authenticated user receives correct UID.
 * 16. Existing matching result remains identical after restore.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/* ---------------- Browser shims (installed before module load) -------- */

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string): string | null => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string): void => {
      store.set(k, String(v));
    },
    removeItem: (k: string): void => {
      store.delete(k);
    },
    clear: (): void => {
      store.clear();
    },
    get length(): number {
      return store.size;
    },
    key: (i: number): string | null => Array.from(store.keys())[i] ?? null,
  };
}

const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = makeStorage();
g.sessionStorage = makeStorage();
g.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

/* ---------------- Imports (after shims) -------------------------------- */

import {
  loadStoredProfile,
  saveStoredProfile,
  loadAuthenticatedProfile,
  loadGuestProfile,
  loadLegacyProfile,
  saveAuthenticatedProfile,
  clearAuthenticatedProfile,
  authenticatedProfileKey,
  GUEST_PROFILE_KEY,
  USER_PROFILE_STORAGE_KEY,
} from './profileStorage';
import {
  setSyncUserId,
  getSyncUserId,
  hasUsableLocalProfile,
} from '../supabase/sync';
import { rankSchemesForProfile } from '../matching/matchingEngine';
import { SCHEMES_DATABASE } from '../../data/schemes';
import type { UserProfile } from '../../types/user';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);
const readSrc = (rel: string): string =>
  fs.readFileSync(path.resolve(repoRoot, rel), 'utf8');

/* ---------------- Harness ------------------------------------------------- */

let passed = 0;
let failed = 0;

const assert = (name: string, condition: boolean, details?: string): void => {
  if (condition) {
    passed += 1;
    console.log(`✅ PASS: ${name}`);
  } else {
    failed += 1;
    console.error(`❌ FAIL: ${name}${details ? ` — ${details}` : ''}`);
  }
};

const ls = () => g.localStorage as ReturnType<typeof makeStorage>;

// Supabase UIDs (never emails)
const UID_A = 'aaaaaaaa-1111-4222-8333-444444444444';
const UID_B = 'bbbbbbbb-5555-4666-8777-888888888888';

const loginAs = (uid: string): void => setSyncUserId(uid);
const logoutToGuest = (): void => setSyncUserId(null);

const profileA: UserProfile = {
  category: 'OBC',
  age: 28,
  annualIncome: 350000,
  businessType: 'manufacturing',
  state: 'Tamil Nadu',
  applicantName: 'User A',
};

const profileB: UserProfile = {
  category: 'SC',
  age: 35,
  annualIncome: 200000,
  businessType: 'services',
  state: 'Karnataka',
  applicantName: 'User B',
};

const guestProfile: UserProfile = {
  category: 'General',
  age: 30,
  annualIncome: 250000,
  businessType: 'retail',
  state: 'Maharashtra',
  applicantName: 'Guest User',
};

const coreFields = (p: UserProfile | null): string =>
  JSON.stringify({
    category: p?.category,
    age: p?.age,
    annualIncome: p?.annualIncome,
    businessType: p?.businessType,
    state: p?.state,
    applicantName: p?.applicantName,
  });

console.log('\n=== PROFILE OWNERSHIP TESTS (spec §20) ===');

/* 1. Guest profile remains guest-only. */
ls().clear();
logoutToGuest();
saveStoredProfile(guestProfile);
assert(
  '1a. guest save writes to the guest key',
  ls().getItem(GUEST_PROFILE_KEY) !== null,
);
assert(
  '1b. guest save does not write to the legacy global key',
  ls().getItem(USER_PROFILE_STORAGE_KEY) === null,
);
assert(
  '1c. guest load returns the guest profile',
  coreFields(loadGuestProfile()) === coreFields(guestProfile),
);
assert(
  '1d. guest profile is not sent to cloud (no sync uid)',
  getSyncUserId() === null,
);

/* 2. User A profile stored under A UID. */
ls().clear();
loginAs(UID_A);
saveStoredProfile(profileA);
assert(
  '2a. User A profile stored under v2:<UID_A>',
  ls().getItem(authenticatedProfileKey(UID_A)) !== null,
);
assert(
  '2b. User A profile not in the guest key',
  ls().getItem(GUEST_PROFILE_KEY) === null,
);
assert(
  '2c. User A profile not in the legacy global key',
  ls().getItem(USER_PROFILE_STORAGE_KEY) === null,
);
assert(
  '2d. loadAuthenticatedProfile(UID_A) returns A profile',
  coreFields(loadAuthenticatedProfile(UID_A)) === coreFields(profileA),
);

/* 3. User B profile stored under B UID. */
loginAs(UID_B);
saveStoredProfile(profileB);
assert(
  '3a. User B profile stored under v2:<UID_B>',
  ls().getItem(authenticatedProfileKey(UID_B)) !== null,
);
assert(
  '3b. User B profile not in the guest key',
  ls().getItem(GUEST_PROFILE_KEY) === null,
);
assert(
  '3c. loadAuthenticatedProfile(UID_B) returns B profile',
  coreFields(loadAuthenticatedProfile(UID_B)) === coreFields(profileB),
);

/* 4. User A cannot load B profile. */
loginAs(UID_A);
const aSeesB = loadStoredProfile();
assert(
  '4. User A loadStoredProfile returns A profile, not B',
  coreFields(aSeesB) === coreFields(profileA),
);

/* 5. User B cannot load A profile. */
loginAs(UID_B);
const bSeesA = loadStoredProfile();
assert(
  '5. User B loadStoredProfile returns B profile, not A',
  coreFields(bSeesA) === coreFields(profileB),
);

/* 6. Logout does not delete cloud profile. */
/* The cloud profile lives in Supabase public.user_profiles, not localStorage.
 * Logout clears the device cache; we verify the AuthContext source never
 * issues a cloud delete on sign-out. */
const authCtxSrc = readSrc('src/context/AuthContext.tsx');
assert(
  '6a. signOutUser never calls a cloud profile delete',
  !/deleteUserProfile|delete.*user_profiles/i.test(authCtxSrc),
);
assert(
  '6b. signOutUser clears only the local device cache (clearAuthenticatedProfile)',
  /clearAuthenticatedProfile\(uid\)/.test(authCtxSrc),
);

/* 7. Login restores correct cloud profile. */
/* Simulate: User A has a cloud row; device cache is empty; restore writes
 * the cloud row to v2:<UID_A>. */
ls().clear();
loginAs(UID_A);
assert(
  '7a. no local profile for A (fresh device)',
  loadAuthenticatedProfile(UID_A) === null,
);
// Simulate restoreCloudToLocal success leg (writes cloud row to v2:<uid>)
saveAuthenticatedProfile(UID_A, profileA);
assert(
  '7b. after restore, A profile loads from v2:<UID_A>',
  coreFields(loadAuthenticatedProfile(UID_A)) === coreFields(profileA),
);
assert(
  '7c. restore writes to the user-scoped key, not the global key',
  ls().getItem(USER_PROFILE_STORAGE_KEY) === null,
);

/* 8. User A logout → User B login (no cross-contamination). */
ls().clear();
loginAs(UID_A);
saveStoredProfile(profileA);
// Simulate logout: clear A's device cache, clear sync uid
clearAuthenticatedProfile(UID_A);
logoutToGuest();
assert('8a. after A logout, A device cache is gone', ls().getItem(authenticatedProfileKey(UID_A)) === null);
// User B logs in on the same device
loginAs(UID_B);
saveStoredProfile(profileB);
const bProfile = loadStoredProfile();
assert(
  '8b. User B sees B category, not A',
  bProfile?.category === 'SC',
);
assert('8c. User B sees B state, not A', bProfile?.state === 'Karnataka');
assert('8d. User B sees B business type, not A', bProfile?.businessType === 'services');
assert('8e. User B sees B income, not A', bProfile?.annualIncome === 200000);
assert('8f. User B sees B age, not A', bProfile?.age === 35);

/* 9. User B logout → User A login (A's profile returns). */
clearAuthenticatedProfile(UID_B);
logoutToGuest();
loginAs(UID_A);
// Simulate cloud restore for A (device cache was cleared)
saveAuthenticatedProfile(UID_A, profileA);
const aAgain = loadStoredProfile();
assert(
  '9a. User A login returns A original profile',
  coreFields(aAgain) === coreFields(profileA),
);
assert('9b. A category restored', aAgain?.category === 'OBC');
assert('9c. A state restored', aAgain?.state === 'Tamil Nadu');

/* 10. Legacy v1 profile migration. */
/* A legacy v1 profile exists (pre-ownership build). On authenticated login,
 * the explicit guest→account migration may claim it; the direct read path
 * must NOT treat it as the authenticated user's profile. */
ls().clear();
ls().setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profileA));
loginAs(UID_B);
assert(
  '10a. authenticated load does NOT fall back to legacy v1',
  loadStoredProfile() === null,
);
assert(
  '10b. loadAuthenticatedProfile(UID_B) does not see legacy v1',
  loadAuthenticatedProfile(UID_B) === null,
);
assert(
  '10c. legacy v1 is still readable via the explicit migration path',
  coreFields(loadLegacyProfile()) === coreFields(profileA),
);

/* 11. Unowned v1 profile is not assigned to arbitrary user. */
ls().clear();
ls().setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profileA));
loginAs(UID_B);
// The restore guard must not treat the legacy v1 as "usable local profile"
assert(
  '11a. legacy v1 does not count as UID_B usable local profile',
  !hasUsableLocalProfile(loadAuthenticatedProfile(UID_B)),
);
assert(
  '11b. UID_B cannot load UID_A legacy data via the standard path',
  loadStoredProfile() === null,
);

/* 12. Guest → account migration still works. */
/* migrationHelper reads the legacy v1 key explicitly for the one-time
 * guest→cloud migration (with remote-exists protection). Verify the
 * migration source still points at the legacy key. */
const migrationSrc = readSrc('src/lib/supabase/migrationHelper.ts');
assert(
  '12a. migrationHelper still reads the legacy v1 key for guest→account migration',
  migrationSrc.includes("K_PROFILE = 'yojana_setu_user_profile_v1'"),
);
assert(
  '12b. migration keeps the remote-exists protection (never overwrites cloud)',
  /if\s*\(\s*!remote\s*\)/.test(migrationSrc),
);

/* 13. Authenticated save never writes to guest key. */
ls().clear();
loginAs(UID_A);
saveStoredProfile(profileA);
assert(
  '13a. authenticated save does not touch the guest key',
  ls().getItem(GUEST_PROFILE_KEY) === null,
);
assert(
  '13b. authenticated save does not touch the legacy key',
  ls().getItem(USER_PROFILE_STORAGE_KEY) === null,
);
// Guest save after logout goes to guest key; authenticated keys untouched
logoutToGuest();
const aKeyBefore = ls().getItem(authenticatedProfileKey(UID_A));
saveStoredProfile(guestProfile);
assert(
  '13c. guest save writes to the guest key',
  ls().getItem(GUEST_PROFILE_KEY) !== null,
);
assert(
  '13d. guest save does not modify the authenticated key',
  ls().getItem(authenticatedProfileKey(UID_A)) === aKeyBefore,
);

/* 14. Logout clears syncUserId. */
loginAs(UID_A);
assert('14a. syncUserId set on login', getSyncUserId() === UID_A);
// Simulate signOutUser ordering: setSyncUserId(null) before any writes
setSyncUserId(null);
assert('14b. syncUserId cleared on logout', getSyncUserId() === null);
assert(
  '14c. signOutUser calls setSyncUserId(null) before clearing state',
  /setSyncUserId\(null\)[\s\S]*?clearAuthenticatedProfile/.test(authCtxSrc),
);

/* 15. Next authenticated user receives correct UID. */
ls().clear();
loginAs(UID_A);
saveStoredProfile(profileA);
clearAuthenticatedProfile(UID_A); // A logout
setSyncUserId(null);
saveStoredProfile(guestProfile); // guest write after A logout
assert(
  '15a. guest write after logout targets the guest key, not A key',
  ls().getItem(GUEST_PROFILE_KEY) !== null &&
    ls().getItem(authenticatedProfileKey(UID_A)) === null,
);
loginAs(UID_B);
saveStoredProfile(profileB);
assert(
  '15b. B write targets v2:<UID_B>',
  coreFields(loadAuthenticatedProfile(UID_B)) === coreFields(profileB),
);
assert(
  '15c. A key untouched by B write (still null after A logout)',
  ls().getItem(authenticatedProfileKey(UID_A)) === null,
);

/* 16. Existing matching result remains identical after restore. */
const rankIds = (p: UserProfile): string[] =>
  rankSchemesForProfile(SCHEMES_DATABASE, p, 'en', { skipAlternatives: true }).map(
    (r) => r.scheme.id,
  );
const before = rankIds(profileA);
ls().clear();
loginAs(UID_A);
saveAuthenticatedProfile(UID_A, profileA); // restore leg
const restored = loadAuthenticatedProfile(UID_A)!;
const after = rankIds(restored);
assert(
  '16. matching before save equals matching after restore',
  JSON.stringify(before) === JSON.stringify(after) && before.length > 0,
  `ranked ${before.length} schemes`,
);

console.log(`\n--- PROFILE OWNERSHIP: ${passed} passed, ${failed} failed ---`);
if (failed > 0) {
  process.exitCode = 1;
}
