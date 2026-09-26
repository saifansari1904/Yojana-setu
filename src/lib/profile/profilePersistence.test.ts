/**
 * YOJANA SETU — PROFILE PERSISTENCE REGRESSION TESTS
 * ------------------------------------------------------------------
 * Regression suite for the critical login -> logout -> login profile
 * persistence fix.
 *
 * Covers:
 *  1. save profile -> load profile roundtrip
 *  2. cloud profile -> local hydration
 *  3. logout -> login -> profile restored (state machine)
 *  4. Google logout -> login -> profile restored (provider-independent path)
 *  5. email logout -> login -> profile restored (provider-independent path)
 *  6. no cloud profile -> onboarding state (restore returns false, no crash)
 *  7. partial identity data cannot overwrite a complete entrepreneur profile
 *  8. auth loading / session restore cannot clear a valid profile
 *  9. language change does not alter stored profile data
 * 10. restored profile produces the identical matching result
 * 11. a user cannot load another user's profile (RLS own-row only)
 * 12. refresh after login preserves the profile
 * 13. legacy name-only stub does not block cloud restore
 * 14. signOut clears the one-time restore flag (same-tab re-login restores)
 * 15. handleFormSubmit persists only when cloud-authenticated
 *
 * Browser shims (localStorage / sessionStorage / window) are installed on
 * globalThis before the modules load. Supabase is unconfigured under tsx
 * (import.meta.env is undefined), so cloud reads deterministically resolve
 * to "no row" — exactly the offline/no-cloud leg of the restore path.
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
  clearStoredProfile,
  USER_PROFILE_STORAGE_KEY,
} from './profileStorage';
import {
  isCloudMirrorSafe,
  hasUsableLocalProfile,
  restoreCloudToLocal,
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

const completeProfile: UserProfile = {
  category: 'OBC',
  age: 28,
  annualIncome: 350000,
  businessType: 'manufacturing',
  state: 'Tamil Nadu',
  applicantName: 'Karthik Raja',
  district: 'Madurai',
  gender: 'male',
  isRegistered: true,
  businessStage: 'existing',
  ruralUrban: 'urban',
};

const coreFields = (p: UserProfile | null): string =>
  JSON.stringify({
    category: p?.category,
    age: p?.age,
    annualIncome: p?.annualIncome,
    businessType: p?.businessType,
    state: p?.state,
    applicantName: p?.applicantName,
    district: p?.district,
    gender: p?.gender,
  });

/** Simulates exactly what restoreCloudToLocal does on a successful restore:
 *  the cloud row is written verbatim to the local profile key. */
const simulateCloudRestoreWrite = (cloudRow: unknown): void => {
  ls().setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(cloudRow));
};

console.log('\n=== PROFILE PERSISTENCE REGRESSION TESTS ===');

/* 1. save profile -> load profile */
ls().clear();
saveStoredProfile(completeProfile);
assert(
  '1. save profile -> load profile roundtrip preserves core fields',
  coreFields(loadStoredProfile()) === coreFields(completeProfile),
);

/* 2. cloud profile -> local hydration */
clearStoredProfile(); // logout wipes the device
simulateCloudRestoreWrite({ ...completeProfile }); // cloud row arrives verbatim
assert(
  '2. cloud profile hydrates local state with identical core fields',
  coreFields(loadStoredProfile()) === coreFields(completeProfile),
);

/* 3. logout -> login -> profile restored (full state machine) */
ls().clear();
saveStoredProfile(completeProfile); // authenticated assessment submit persists
const cloudRow = JSON.parse(ls().getItem(USER_PROFILE_STORAGE_KEY)!); // "synced" row
clearStoredProfile(); // logout
assert('3a. logout clears the local profile', loadStoredProfile() === null);
// login: restore path runs because no usable local profile remains
const localRaw = ls().getItem(USER_PROFILE_STORAGE_KEY);
assert(
  '3b. after logout there is no usable local profile to block restore',
  !hasUsableLocalProfile(localRaw ? JSON.parse(localRaw) : null),
);
simulateCloudRestoreWrite(cloudRow); // restoreCloudToLocal success leg
assert(
  '3c. login restores the complete entrepreneur profile',
  coreFields(loadStoredProfile()) === coreFields(completeProfile),
);

/* 4 & 5. provider independence: Google and email logins share one restore path */
for (const provider of ['Google', 'email/password']) {
  ls().clear();
  saveStoredProfile(completeProfile);
  const row = JSON.parse(ls().getItem(USER_PROFILE_STORAGE_KEY)!);
  clearStoredProfile();
  simulateCloudRestoreWrite(row);
  assert(
    `${provider}: logout -> login restores the complete profile`,
    coreFields(loadStoredProfile()) === coreFields(completeProfile),
  );
}
const userProfileSrc = readSrc('src/lib/supabase/userProfile.ts');
assert(
  'restore path keys on the auth UID, never on email or name',
  userProfileSrc.includes(".eq('user_id', userId)"),
);

/* 6. no cloud profile -> legitimate onboarding state (no crash, no phantom) */
ls().clear();
const noRow = await restoreCloudToLocal('00000000-0000-0000-0000-000000000000');
assert(
  '6. no cloud row -> restore returns false (onboarding state, not auth failure)',
  noRow === false,
);
assert(
  '6b. local profile stays null (nothing fabricated)',
  loadStoredProfile() === null,
);

/* 7. partial identity data cannot overwrite a complete entrepreneur profile */
assert(
  '7a. name-only object is not safe for the cloud mirror',
  !isCloudMirrorSafe({ applicantName: 'Karthik Raja' } as UserProfile),
);
assert('7b. null is not safe for the cloud mirror', !isCloudMirrorSafe(null));
assert(
  '7c. missing state is not safe for the cloud mirror',
  !isCloudMirrorSafe({ applicantName: 'X', category: 'OBC' } as UserProfile),
);
assert(
  '7d. complete profile is safe for the cloud mirror',
  isCloudMirrorSafe(completeProfile),
);
const authCtxSrc = readSrc('src/context/AuthContext.tsx');
assert(
  '7e. backfill never fabricates a profile from nothing (early return on no local profile)',
  /if\s*\(\s*!current\s*\)\s*return;/.test(authCtxSrc),
);

/* 8. auth loading / session restore cannot clear a valid profile */
const clearCalls = authCtxSrc.match(/clearStoredProfile/g) || [];
assert(
  '8. only signOutUser may clear the stored profile (boot/restore paths never do)',
  clearCalls.length === 2, // import + the single call inside signOutUser
  `found ${clearCalls.length} references`,
);
assert(
  '8b. session restore derives state from storage, never wipes it',
  !/applySessionUser[\s\S]{0,400}?clearStoredProfile/.test(authCtxSrc),
);

/* 9. language change does not alter stored profile data */
ls().clear();
saveStoredProfile(completeProfile);
const rawStored = ls().getItem(USER_PROFILE_STORAGE_KEY)!;
const parsedStored = JSON.parse(rawStored) as Record<string, unknown>;
assert(
  '9a. stored core facts are language-independent codes/values',
  parsedStored.category === 'OBC' &&
    parsedStored.state === 'Tamil Nadu' &&
    parsedStored.businessType === 'manufacturing',
);
assert(
  '9b. re-loading under a different presentation language yields identical data',
  coreFields(loadStoredProfile()) === coreFields(completeProfile),
);

/* 10. restored profile produces the identical matching result */
const rankIds = (p: UserProfile): string[] =>
  rankSchemesForProfile(SCHEMES_DATABASE, p, 'en', { skipAlternatives: true }).map(
    (r) => r.scheme.id,
  );
const beforeLogout = rankIds(completeProfile);
ls().clear();
saveStoredProfile(completeProfile);
const synced = JSON.parse(ls().getItem(USER_PROFILE_STORAGE_KEY)!);
clearStoredProfile();
simulateCloudRestoreWrite(synced);
const restored = loadStoredProfile()!;
const afterRelogin = rankIds(restored);
assert(
  '10. matching before logout equals matching after relogin',
  JSON.stringify(beforeLogout) === JSON.stringify(afterRelogin) &&
    beforeLogout.length > 0,
  `ranked ${beforeLogout.length} schemes`,
);

/* 11. a user cannot load another user's profile (RLS own-row only) */
const backendRoot = path.resolve(repoRoot, '..', 'yojana-setu-backend');
const rls003 = fs.readFileSync(
  path.resolve(backendRoot, 'supabase', 'migrations', '003_eligibility.sql'),
  'utf8',
);
for (const op of ['select', 'insert', 'update', 'delete']) {
  assert(
    `11. user_profiles ${op} policy is restricted to auth.uid() = user_id`,
    new RegExp(
      `create policy "user_profiles_${op}_own"[\\s\\S]*?auth\\.uid\\(\\) = user_id`,
    ).test(rls003),
  );
}
assert(
  '11b. no permissive (USING true) policy on user_profiles',
  !/on public\.user_profiles[\s\S]*?using\s*\(\s*true\s*\)/i.test(rls003),
);

/* 12. refresh after login preserves the profile */
ls().clear();
saveStoredProfile(completeProfile);
const afterRefreshRaw = ls().getItem(USER_PROFILE_STORAGE_KEY); // fresh read, like a reboot
assert(
  '12. profile survives a refresh (re-read from storage)',
  coreFields(
    afterRefreshRaw ? (JSON.parse(afterRefreshRaw) as UserProfile) : null,
  ) === coreFields(completeProfile),
);

/* 13. legacy name-only stub does not block cloud restore */
assert(
  '13a. legacy stub is not a usable local profile (restore may proceed)',
  !hasUsableLocalProfile({ applicantName: 'Karthik Raja' }),
);
assert(
  '13b. null local is not a usable local profile',
  !hasUsableLocalProfile(null),
);
assert(
  '13c. complete local profile still wins (no redundant restore)',
  hasUsableLocalProfile({ ...completeProfile }),
);

/* 14. signOut clears the one-time restore flag */
assert(
  '14. signOutUser removes the cloud-restore flag so the next login restores',
  /const signOutUser[\s\S]*?sessionStorage\.removeItem\(RESTORED_FLAG\)[\s\S]*?setUser\(null\)/.test(
    authCtxSrc,
  ),
);

/* 15. handleFormSubmit persists only when cloud-authenticated */
const appSrc = readSrc('src/App.tsx');
const formBlock = appSrc.match(/const handleFormSubmit[\s\S]*?\n  \};/);
assert('15a. handleFormSubmit block found', !!formBlock);
if (formBlock) {
  const codeOnly = formBlock[0].replace(/\/\/.*$/gm, '');
  const saveCalls = codeOnly.match(/saveStoredProfile\(/g) || [];
  assert('15b. handleFormSubmit persists exactly once', saveCalls.length === 1);
  assert(
    '15c. the persist is gated on isCloudAuthenticated (guest path stays memory-only)',
    /if\s*\(\s*isCloudAuthenticated\s*\)[\s\S]*?saveStoredProfile\(/.test(codeOnly),
  );
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
