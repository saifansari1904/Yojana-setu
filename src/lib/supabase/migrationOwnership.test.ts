/**
 * YOJANA SETU — LEGACY MIGRATION OWNERSHIP TESTS
 * ------------------------------------------------------------------
 * Verifies the hardened migration ownership model:
 *
 *   Legacy v1 (yojana_setu_user_profile_v1): READ-ONLY, never auto-claimed.
 *   Guest key (yojana_setu_guest_profile_v1): claimed ONLY via the explicit
 *     guest → account flow (requestExplicitGuestMigration +
 *     migrateGuestProfileToSupabase).
 *   Ordinary login (migrateLocalStorageToSupabase): never claims v1, never
 *     claims the guest key. Remote-exists protection: an existing cloud
 *     profile is never overwritten.
 *
 * Covers spec §12 tests A–F and the mandatory cross-user test (§13):
 *  A. User A legacy v1 exists; User B logs in → B does NOT receive A's v1.
 *  B. Legacy v1 exists; normal login → v1 ignored.
 *  C. Guest profile exists; explicit create-account → guest migrates.
 *  D. Guest profile exists; user A has cloud profile; A logs in →
 *     cloud NOT overwritten by guest data.
 *  E. User A logout → User B login → B cannot receive A's legacy data.
 *  F. User A login after logout → A's v2/cloud profile restored intact.
 *  X. MANDATORY: v1 = User A, then User B signs in →
 *     public.user_profiles[B] must NOT receive A's profile.
 */

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
  migrateLocalStorageToSupabase,
  migrateGuestProfileToSupabase,
  requestExplicitGuestMigration,
  consumeExplicitGuestMigration,
  hasMigrated,
  type MigrationRemoteDeps,
} from './migrationHelper';

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
const ss = () => g.sessionStorage as ReturnType<typeof makeStorage>;

// Supabase UIDs (never emails)
const UID_A = 'aaaaaaaa-1111-4222-8333-444444444444';
const UID_B = 'bbbbbbbb-5555-4666-8777-888888888888';

const V1_KEY = 'yojana_setu_user_profile_v1';
const GUEST_KEY = 'yojana_setu_guest_profile_v1';

const profileA = {
  applicantName: 'User A',
  category: 'SC',
  state: 'Maharashtra',
  businessNeed: 'Need A',
};
const profileB = {
  applicantName: 'User B',
  category: 'OBC',
  state: 'Karnataka',
  businessNeed: 'Need B',
};
const guestProfile = {
  applicantName: 'Guest User',
  category: 'General',
  state: 'Tamil Nadu',
  businessNeed: 'Guest need',
};

/* Fake durable cloud: public.user_profiles keyed by UID. */
let remoteProfiles: Map<string, Record<string, unknown>>;
let savedProfileCalls: Array<{ userId: string; profile: Record<string, unknown> }>;

function makeDeps(): MigrationRemoteDeps {
  return {
    getProfile: async (userId) => remoteProfiles.get(userId) ?? null,
    saveProfile: async (userId, profile) => {
      remoteProfiles.set(userId, profile);
      savedProfileCalls.push({ userId, profile });
    },
    getSavedSchemeIds: async () => [],
    saveScheme: async () => {},
    listApplications: async () => [],
    upsertApplication: async () => {},
    getDocumentProgress: async () => ({}),
    setChecklistTicked: async () => {},
    setVaultPrepared: async () => {},
  };
}

function reset(): MigrationRemoteDeps {
  ls().clear();
  ss().clear();
  remoteProfiles = new Map();
  savedProfileCalls = [];
  return makeDeps();
}

const coreOf = (p: unknown): string => JSON.stringify(p);

async function run(): Promise<void> {
  /* ---- Test A: v1 = User A; User B ordinary login → B gets nothing ---- */
  let deps = reset();
  ls().setItem(V1_KEY, JSON.stringify(profileA));
  const reportA = await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'A1. ordinary login does NOT claim v1 (no saveProfile call)',
    savedProfileCalls.length === 0,
    `calls=${savedProfileCalls.length}`,
  );
  assert(
    'A2. User B cloud profile remains absent',
    remoteProfiles.get(UID_B) === undefined,
  );
  assert(
    'A3. report marks profile as skipped-legacy-read-only',
    reportA.profile === 'skipped-legacy-read-only',
    `profile=${reportA.profile}`,
  );
  assert('A4. legacy v1 left untouched on device', ls().getItem(V1_KEY) === JSON.stringify(profileA));
  assert('A5. migration flag recorded for B (no re-run)', hasMigrated(UID_B));

  /* ---- Test B: v1 complete; ordinary login ignores it ---- */
  deps = reset();
  ls().setItem(V1_KEY, JSON.stringify(profileA));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'B1. v1 ignored even when it holds a complete profile',
    remoteProfiles.size === 0 && savedProfileCalls.length === 0,
  );

  /* ---- Test C: guest profile + explicit create-account → migrates ---- */
  deps = reset();
  ls().setItem(GUEST_KEY, JSON.stringify(guestProfile));
  requestExplicitGuestMigration();
  assert('C0. explicit intent recorded', consumeExplicitGuestMigration() === true);
  // Intent is consumed exactly once.
  assert('C0b. intent cannot be consumed twice', consumeExplicitGuestMigration() === false);
  requestExplicitGuestMigration();
  const explicit = consumeExplicitGuestMigration();
  const reportC = explicit
    ? await migrateGuestProfileToSupabase(UID_B, deps)
    : await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'C1. guest profile migrated to the new account cloud profile',
    coreOf(remoteProfiles.get(UID_B)) === coreOf(guestProfile),
  );
  assert('C2. report marks profile as migrated', reportC.profile === 'migrated');
  assert(
    'C3. explicit migration wrote exactly one profile save',
    savedProfileCalls.length === 1 && savedProfileCalls[0].userId === UID_B,
  );

  /* ---- Test D: cloud A exists; explicit guest migration must NOT overwrite ---- */
  deps = reset();
  remoteProfiles.set(UID_A, { ...profileA });
  ls().setItem(GUEST_KEY, JSON.stringify(guestProfile));
  requestExplicitGuestMigration();
  assert('D0. explicit intent recorded', consumeExplicitGuestMigration() === true);
  const reportD = await migrateGuestProfileToSupabase(UID_A, deps);
  assert(
    'D1. existing cloud profile NOT overwritten by guest data',
    coreOf(remoteProfiles.get(UID_A)) === coreOf(profileA),
  );
  assert('D2. report marks profile as skipped-remote-newer', reportD.profile === 'skipped-remote-newer');
  assert('D3. no saveProfile call issued', savedProfileCalls.length === 0);

  /* ---- Test E: A logout → B login; B cannot receive A's legacy data ---- */
  deps = reset();
  ls().setItem(V1_KEY, JSON.stringify(profileA)); // A's old global key on device
  // (A's logout would have cleared caches; v1 is read-only legacy, kept.)
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'E1. B login does not claim A legacy data',
    remoteProfiles.get(UID_B) === undefined && savedProfileCalls.length === 0,
  );
  assert('E2. A legacy key still intact (read-only, not deleted)', ls().getItem(V1_KEY) !== null);

  /* ---- Test F: A login after logout → A's cloud profile intact ---- */
  deps = reset();
  remoteProfiles.set(UID_A, { ...profileA }); // durable cloud
  ls().setItem(V1_KEY, JSON.stringify({ ...profileA, businessNeed: 'stale' }));
  const reportF = await migrateLocalStorageToSupabase(UID_A, deps);
  assert(
    'F1. A cloud profile untouched by ordinary login',
    coreOf(remoteProfiles.get(UID_A)) === coreOf(profileA),
  );
  assert('F2. no profile save issued on ordinary login', savedProfileCalls.length === 0);
  assert('F3. report marks profile as skipped-legacy-read-only', reportF.profile === 'skipped-legacy-read-only');

  /* ---- MANDATORY cross-user test (§13): v1 = A, B signs in ---- */
  deps = reset();
  ls().setItem(V1_KEY, JSON.stringify(profileA));
  await migrateLocalStorageToSupabase(UID_B, deps);
  const bProfile = remoteProfiles.get(UID_B) ?? null;
  assert(
    'X1. MANDATORY: public.user_profiles[B] does NOT receive A profile',
    bProfile === null,
    `B cloud profile=${coreOf(bProfile)}`,
  );
  assert(
    'X2. MANDATORY: no profile write attributed to B at all',
    savedProfileCalls.filter((c) => c.userId === UID_B).length === 0,
  );

  /* ---- Explicit migration never sources v1, even when v1 differs ---- */
  deps = reset();
  ls().setItem(V1_KEY, JSON.stringify(profileA));
  ls().setItem(GUEST_KEY, JSON.stringify(guestProfile));
  requestExplicitGuestMigration();
  assert('G0. explicit intent recorded', consumeExplicitGuestMigration() === true);
  await migrateGuestProfileToSupabase(UID_B, deps);
  assert(
    'G1. explicit migration claims guest key, NOT v1',
    coreOf(remoteProfiles.get(UID_B)) === coreOf(guestProfile),
  );

  /* ---- Ordinary login never claims the guest key either ---- */
  deps = reset();
  ls().setItem(GUEST_KEY, JSON.stringify(guestProfile));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'H1. ordinary login leaves guest data alone (no claim, no save)',
    remoteProfiles.get(UID_B) === undefined && savedProfileCalls.length === 0,
  );
  assert('H2. guest key still present on device', ls().getItem(GUEST_KEY) !== null);

  console.log(`\n--- MIGRATION OWNERSHIP: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: migration ownership suite crashed', err);
  process.exitCode = 1;
});
