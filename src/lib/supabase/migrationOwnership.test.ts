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
 *     claims the guest key, and never migrates auxiliary local stores
 *     (saved schemes, applications, document progress) — those hold mixed
 *     historical state of unknown ownership. The authenticated user's
 *     durable data comes from the cloud tables via the normal restore path.
 *   Remote-exists protection: an existing cloud row is never overwritten.
 *
 * Covers spec §12 tests A–F, the mandatory cross-user test (§13), and
 * spec §17 items 1–10:
 *  1. ordinary login does not migrate global saved schemes
 *  2. ordinary login does not migrate global applications
 *  3. ordinary login does not migrate global documents
 *  4. explicit guest migration does migrate guest data
 *  5. User A data cannot become User B data
 *  6. User A cloud data restores after relogin
 *  7. User B cloud data restores after relogin
 *  8. cloud data wins over local data
 *  9. logout clears active user cache
 * 10. authenticated profile remains cloud-persistent
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
import { clearCloudCaches } from './sync';

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
const K_SAVED = 'yojana_setu_saved_schemes';
const K_APPLICATIONS = 'yojana_setu_applications_v1';
const K_DOC_PROGRESS = 'yojana_setu_document_progress_v1';

const profileA = {
  applicantName: 'User A',
  category: 'SC',
  state: 'Maharashtra',
  businessNeed: 'Need A',
};
const guestProfile = {
  applicantName: 'Guest User',
  category: 'General',
  state: 'Tamil Nadu',
  businessNeed: 'Guest need',
};
const appA = {
  schemeId: 'scheme-a1',
  schemeName: 'Scheme A1',
  status: 'interested' as const,
};
const appG = {
  schemeId: 'scheme-g1',
  schemeName: 'Scheme G1',
  status: 'interested' as const,
};

/* Fake durable cloud, keyed by UID. */
let remoteProfiles: Map<string, Record<string, unknown>>;
let remoteSaved: Map<string, Set<string>>;
let remoteApplications: Map<string, Map<string, Record<string, unknown>>>;
let remoteDocs: Map<string, Map<string, Set<string>>>;
let remoteVault: Map<string, string[]>;
let savedProfileCalls: Array<{ userId: string; profile: Record<string, unknown> }>;
let saveSchemeCalls: Array<{ userId: string; schemeId: string }>;
let upsertAppCalls: Array<{ userId: string; schemeId: string }>;
let tickCalls: Array<{ userId: string; schemeId: string; docId: string }>;
let vaultCalls: Array<{ userId: string; ids: string[] }>;

function makeDeps(): MigrationRemoteDeps {
  return {
    getProfile: async (userId) => remoteProfiles.get(userId) ?? null,
    saveProfile: async (userId, profile) => {
      remoteProfiles.set(userId, profile);
      savedProfileCalls.push({ userId, profile });
    },
    getSavedSchemeIds: async (userId) => Array.from(remoteSaved.get(userId) ?? []),
    saveScheme: async (userId, schemeId) => {
      if (!remoteSaved.has(userId)) remoteSaved.set(userId, new Set());
      remoteSaved.get(userId)!.add(schemeId);
      saveSchemeCalls.push({ userId, schemeId });
    },
    listApplications: async (userId) =>
      Array.from((remoteApplications.get(userId) ?? new Map()).values()).map((a) => ({
        schemeId: String(a.schemeId),
      })),
    upsertApplication: async (userId, input) => {
      if (!remoteApplications.has(userId)) remoteApplications.set(userId, new Map());
      remoteApplications.get(userId)!.set(input.schemeId, { ...input });
      upsertAppCalls.push({ userId, schemeId: input.schemeId });
    },
    getDocumentProgress: async (userId) => {
      const out: Record<string, string[]> = {};
      for (const [k, v] of remoteDocs.get(userId) ?? new Map()) out[k] = Array.from(v);
      return out;
    },
    setChecklistTicked: async (userId, schemeId, docId) => {
      if (!remoteDocs.has(userId)) remoteDocs.set(userId, new Map());
      const m = remoteDocs.get(userId)!;
      if (!m.has(schemeId)) m.set(schemeId, new Set());
      m.get(schemeId)!.add(docId);
      tickCalls.push({ userId, schemeId, docId });
    },
    setVaultPrepared: async (userId, ids) => {
      remoteVault.set(userId, ids);
      vaultCalls.push({ userId, ids });
    },
  };
}

function reset(): MigrationRemoteDeps {
  ls().clear();
  ss().clear();
  remoteProfiles = new Map();
  remoteSaved = new Map();
  remoteApplications = new Map();
  remoteDocs = new Map();
  remoteVault = new Map();
  savedProfileCalls = [];
  saveSchemeCalls = [];
  upsertAppCalls = [];
  tickCalls = [];
  vaultCalls = [];
  return makeDeps();
}

const coreOf = (p: unknown): string => JSON.stringify(p);
const auxWritesFor = (uid: string): number =>
  saveSchemeCalls.filter((c) => c.userId === uid).length +
  upsertAppCalls.filter((c) => c.userId === uid).length +
  tickCalls.filter((c) => c.userId === uid).length +
  vaultCalls.filter((c) => c.userId === uid).length;

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
  assert('A2. User B cloud profile remains absent', remoteProfiles.get(UID_B) === undefined);
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
  ls().setItem(V1_KEY, JSON.stringify(profileA));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'E1. B login does not claim A legacy data',
    remoteProfiles.get(UID_B) === undefined && savedProfileCalls.length === 0,
  );
  assert('E2. A legacy key still intact (read-only, not deleted)', ls().getItem(V1_KEY) !== null);

  /* ---- Test F: A login after logout → A's cloud profile intact ---- */
  deps = reset();
  remoteProfiles.set(UID_A, { ...profileA });
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

  /* ============ §17 auxiliary-ownership tests ============ */

  /* 1. ordinary login does not migrate global saved schemes */
  deps = reset();
  ls().setItem(K_SAVED, JSON.stringify(['scheme-a1', 'scheme-a2']));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'S1a. ordinary login writes no saved schemes for B',
    saveSchemeCalls.filter((c) => c.userId === UID_B).length === 0,
  );
  assert('S1b. B cloud saved schemes remain empty', (remoteSaved.get(UID_B) ?? new Set()).size === 0);
  assert('S1c. local saved schemes left untouched', ls().getItem(K_SAVED) !== null);

  /* 2. ordinary login does not migrate global applications */
  deps = reset();
  ls().setItem(K_APPLICATIONS, JSON.stringify([appA]));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'S2a. ordinary login writes no applications for B',
    upsertAppCalls.filter((c) => c.userId === UID_B).length === 0,
  );
  assert('S2b. B cloud applications remain empty', (remoteApplications.get(UID_B) ?? new Map()).size === 0);

  /* 3. ordinary login does not migrate global documents */
  deps = reset();
  ls().setItem(K_DOC_PROGRESS, JSON.stringify({ 'scheme-a1': ['doc-1'] }));
  ss().setItem('setu_docs_scheme-a1', JSON.stringify(['doc-2']));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'S3a. ordinary login writes no document progress for B',
    tickCalls.filter((c) => c.userId === UID_B).length === 0 &&
      vaultCalls.filter((c) => c.userId === UID_B).length === 0,
  );
  assert('S3b. B cloud document progress remains empty', (remoteDocs.get(UID_B) ?? new Map()).size === 0);
  assert('S3c. legacy session doc keys left untouched', ss().getItem('setu_docs_scheme-a1') !== null);

  /* 4. explicit guest migration DOES migrate guest aux data */
  deps = reset();
  ls().setItem(GUEST_KEY, JSON.stringify(guestProfile));
  ls().setItem(K_SAVED, JSON.stringify(['scheme-g1']));
  ls().setItem(K_APPLICATIONS, JSON.stringify([appG]));
  ls().setItem(K_DOC_PROGRESS, JSON.stringify({ 'scheme-g1': ['gdoc-1'], __reusable_vault__: ['vdoc-1'] }));
  requestExplicitGuestMigration();
  assert('S4a. explicit intent recorded', consumeExplicitGuestMigration() === true);
  await migrateGuestProfileToSupabase(UID_B, deps);
  assert(
    'S4b. guest saved schemes migrated to B cloud',
    (remoteSaved.get(UID_B) ?? new Set()).has('scheme-g1'),
  );
  assert(
    'S4c. guest applications migrated to B cloud',
    (remoteApplications.get(UID_B) ?? new Map()).has('scheme-g1'),
  );
  assert(
    'S4d. guest document progress migrated to B cloud',
    (remoteDocs.get(UID_B)?.get('scheme-g1') ?? new Set()).has('gdoc-1'),
  );
  assert(
    'S4e. guest vault ids migrated to B cloud',
    (remoteVault.get(UID_B) ?? []).includes('vdoc-1'),
  );

  /* 5. MANDATORY aux cross-user: A's local data; B ordinary login → B gets none */
  deps = reset();
  ls().setItem(K_SAVED, JSON.stringify(['scheme-a1']));
  ls().setItem(K_APPLICATIONS, JSON.stringify([appA]));
  ls().setItem(K_DOC_PROGRESS, JSON.stringify({ 'scheme-a1': ['doc-1'] }));
  ss().setItem('setu_docs_scheme-a1', JSON.stringify(['doc-2']));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'S5a. MANDATORY: B receives NONE of A local aux data',
    auxWritesFor(UID_B) === 0,
    `writes=${auxWritesFor(UID_B)}`,
  );
  assert(
    'S5b. MANDATORY: B cloud aux stores all empty',
    (remoteSaved.get(UID_B) ?? new Set()).size === 0 &&
      (remoteApplications.get(UID_B) ?? new Map()).size === 0 &&
      (remoteDocs.get(UID_B) ?? new Map()).size === 0,
  );

  /* 6. User A cloud data restores after relogin (ordinary login never touches it) */
  deps = reset();
  remoteProfiles.set(UID_A, { ...profileA });
  remoteSaved.set(UID_A, new Set(['cloud-a1']));
  remoteApplications.set(UID_A, new Map([['cloud-a1', { schemeId: 'cloud-a1' }]]));
  remoteDocs.set(UID_A, new Map([['cloud-a1', new Set(['cdoc-1'])]]));
  ls().setItem(K_SAVED, JSON.stringify(['stale-local']));
  ls().setItem(K_APPLICATIONS, JSON.stringify([{ schemeId: 'stale-local' }]));
  ls().setItem(K_DOC_PROGRESS, JSON.stringify({ 'stale-local': ['x'] }));
  await migrateLocalStorageToSupabase(UID_A, deps);
  assert(
    'S6a. A cloud profile intact after relogin',
    coreOf(remoteProfiles.get(UID_A)) === coreOf(profileA),
  );
  assert(
    'S6b. A cloud saved schemes intact after relogin',
    coreOf(Array.from(remoteSaved.get(UID_A) ?? [])) === coreOf(['cloud-a1']),
  );
  assert(
    'S6c. A cloud applications intact after relogin',
    Array.from(remoteApplications.get(UID_A)?.keys() ?? []) .join(',') === 'cloud-a1',
  );
  assert('S6d. zero writes issued for A on ordinary login', auxWritesFor(UID_A) === 0);

  /* 7. User B cloud data restores after relogin */
  deps = reset();
  remoteProfiles.set(UID_B, { applicantName: 'User B', category: 'OBC', state: 'Karnataka' });
  remoteSaved.set(UID_B, new Set(['cloud-b1']));
  await migrateLocalStorageToSupabase(UID_B, deps);
  assert(
    'S7a. B cloud data intact after relogin',
    (remoteSaved.get(UID_B) ?? new Set()).has('cloud-b1') && auxWritesFor(UID_B) === 0,
  );

  /* 8. cloud data wins over local data (explicit flow, union-merge never removes) */
  deps = reset();
  remoteProfiles.set(UID_A, { ...profileA });
  remoteSaved.set(UID_A, new Set(['cloud-s']));
  ls().setItem(GUEST_KEY, JSON.stringify(guestProfile));
  ls().setItem(K_SAVED, JSON.stringify(['cloud-s', 'local-s']));
  requestExplicitGuestMigration();
  assert('S8a. explicit intent recorded', consumeExplicitGuestMigration() === true);
  await migrateGuestProfileToSupabase(UID_A, deps);
  assert(
    'S8b. cloud profile NOT overwritten by guest data',
    coreOf(remoteProfiles.get(UID_A)) === coreOf(profileA),
  );
  const savedA = remoteSaved.get(UID_A) ?? new Set();
  assert(
    'S8c. cloud saved scheme kept; local only added, never removed',
    savedA.has('cloud-s') && savedA.has('local-s'),
  );

  /* 9. logout clears active user cache (device caches, never cloud) */
  deps = reset();
  ls().setItem(K_SAVED, JSON.stringify(['scheme-a1']));
  ls().setItem(K_APPLICATIONS, JSON.stringify([appA]));
  ls().setItem(K_DOC_PROGRESS, JSON.stringify({ 'scheme-a1': ['doc-1'] }));
  ls().setItem(V1_KEY, JSON.stringify(profileA)); // legacy read-only: preserved
  clearCloudCaches();
  assert('S9a. saved schemes cache cleared', ls().getItem(K_SAVED) === null);
  assert('S9b. applications cache cleared', ls().getItem(K_APPLICATIONS) === null);
  assert('S9c. document progress cache cleared', ls().getItem(K_DOC_PROGRESS) === null);
  assert('S9d. legacy v1 NOT deleted (read-only)', ls().getItem(V1_KEY) !== null);

  /* 10. authenticated profile remains cloud-persistent across ordinary logins */
  deps = reset();
  remoteProfiles.set(UID_A, { ...profileA });
  await migrateLocalStorageToSupabase(UID_A, deps);
  await migrateLocalStorageToSupabase(UID_A, deps); // second login still no-op
  assert(
    'S10. cloud profile persists (never deleted/overwritten by ordinary login)',
    coreOf(remoteProfiles.get(UID_A)) === coreOf(profileA),
  );

  console.log(`\n--- MIGRATION OWNERSHIP: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: migration ownership suite crashed', err);
  process.exitCode = 1;
});
