/**
 * YOJANA SETU — LOCALSTORAGE → SUPABASE ONE-TIME MIGRATION
 * ------------------------------------------------------------------
 * Ownership model (do not weaken):
 *
 *   Guest:          yojana_setu_guest_profile_v1
 *   Authenticated:  yojana_setu_user_profile_v2:<SUPABASE_UID>  (device mirror)
 *   Durable cloud:  public.user_profiles WHERE user_id = UID
 *   Legacy v1:      yojana_setu_user_profile_v1  (READ-ONLY, never auto-claimed)
 *
 * Two flows, kept strictly separate:
 *
 * FLOW A — ORDINARY LOGIN: migrateLocalStorageToSupabase(userId).
 *   Never reads the legacy global v1 key, even when it holds a complete
 *   profile — that key may belong to a different person who previously used
 *   this browser. Never reads the guest key either. Saved schemes,
 *   applications and document progress are union-merged (additive only).
 *
 * FLOW B — EXPLICIT GUEST → ACCOUNT: migrateGuestProfileToSupabase(userId).
 *   Runs only when the user explicitly chose "Create Account" during the
 *   guest flow. App records that intent via requestExplicitGuestMigration();
 *   AuthContext consumes it exactly once per sign-in. Claims ONLY the
 *   current guest profile key. The legacy v1 key is never a source here.
 *
 * Remote-exists protection (both flows): if public.user_profiles already
 * has a row for userId, the cloud profile wins — local data is never
 * written over it.
 *
 * Other safety rules:
 * - NEVER deletes local data. Rollback = keep using localStorage.
 * - Idempotent: a per-user completion flag prevents double-runs; the flag
 *   is user-scoped, so one user's migration never suppresses another's.
 * - Malformed entries are skipped, never fatal.
 * - The '__reusable_vault__' entry inside the document-progress map is
 *   split out into vault_prepared; everything else goes to checklists.
 * - Legacy sessionStorage 'setu_docs_<schemeId>' keys are merged in
 *   (union) but left untouched in sessionStorage.
 */

import { getUserProfile, saveUserProfile, extractProfileColumns } from './userProfile';
import { getSavedSchemeIds, saveScheme } from './savedSchemes';
import { listApplications, upsertApplication } from './applications';
import { getDocumentProgress, setChecklistTicked, setVaultPrepared } from './documents';
import type { Json, TrackedApplicationInput } from './types';

const DONE_FLAG = 'yojana_setu_backend_migrated_v1';

/* Legacy keys (must match the repo exactly).
 * The pre-ownership global key (yojana_setu_user_profile_v1) is READ-ONLY
 * legacy data. It is NEVER read by either migration flow — an ordinary
 * login must not claim it (it may belong to a different person), and the
 * explicit guest migration claims only the guest key. */
/* The guest migration source: the current device guest's own profile. */
const GUEST_PROFILE_KEY = 'yojana_setu_guest_profile_v1';
const K_SAVED = 'yojana_setu_saved_schemes';
const K_APPLICATIONS = 'yojana_setu_applications_v1';
const K_DOC_PROGRESS = 'yojana_setu_document_progress_v1';
const LEGACY_DOC_PREFIX = 'setu_docs_';
const VAULT_KEY = '__reusable_vault__';

/* Session-scoped explicit-intent flag. Set by App when the user explicitly
 * chooses "Create Account" from the guest flow; consumed exactly once by
 * AuthContext on the next sign-in. Never survives logout (signOutUser
 * discards it), so a stale intent can never leak into another user's
 * sign-in on a shared device. */
const PENDING_GUEST_MIGRATION_KEY = 'yojana_setu_guest_migration_pending_v1';

/** Record the user's explicit "Create Account" intent from the guest flow. */
export function requestExplicitGuestMigration(): void {
  try {
    sessionStorage.setItem(PENDING_GUEST_MIGRATION_KEY, '1');
  } catch {
    /* non-fatal */
  }
}

/**
 * Consume the explicit-migration intent exactly once. Returns true when the
 * user explicitly initiated a guest → account migration during this
 * session; false for every ordinary login.
 */
export function consumeExplicitGuestMigration(): boolean {
  try {
    if (sessionStorage.getItem(PENDING_GUEST_MIGRATION_KEY) !== '1') return false;
    sessionStorage.removeItem(PENDING_GUEST_MIGRATION_KEY);
    return true;
  } catch {
    return false;
  }
}

export interface MigrationReport {
  ranAt: string;
  userId: string;
  alreadyRan: boolean;
  profile: 'migrated' | 'skipped-empty' | 'skipped-remote-newer' | 'skipped-legacy-read-only' | 'invalid';
  savedSchemes: number;
  applications: number;
  checklistTicks: number;
  vaultPrepared: number;
  legacySessionKeysMerged: number;
  errors: string[];
}

/**
 * Remote-access seam. Production defaults call the Supabase service
 * modules; tests inject an in-memory store. This keeps the ownership
 * rules under test without any network.
 */
export interface MigrationRemoteDeps {
  getProfile: (userId: string) => Promise<Record<string, unknown> | null>;
  saveProfile: (userId: string, profile: Record<string, unknown>) => Promise<void>;
  getSavedSchemeIds: (userId: string) => Promise<string[]>;
  saveScheme: (userId: string, schemeId: string) => Promise<void>;
  listApplications: (userId: string) => Promise<Array<{ schemeId: string }>>;
  upsertApplication: (userId: string, input: TrackedApplicationInput) => Promise<void>;
  getDocumentProgress: (userId: string) => Promise<Record<string, string[]>>;
  setChecklistTicked: (userId: string, schemeId: string, docId: string, ticked: boolean) => Promise<void>;
  setVaultPrepared: (userId: string, ids: string[]) => Promise<void>;
}

function defaultDeps(): MigrationRemoteDeps {
  return {
    getProfile: (userId) => getUserProfile(userId),
    saveProfile: (userId, profile) =>
      saveUserProfile(userId, profile as Json, extractProfileColumns(profile)),
    getSavedSchemeIds,
    saveScheme,
    listApplications: (userId) => listApplications(userId),
    upsertApplication: (userId, input) => upsertApplication(userId, input),
    getDocumentProgress,
    setChecklistTicked: (userId, schemeId, docId, ticked) =>
      setChecklistTicked(userId, schemeId, docId, ticked),
    setVaultPrepared,
  };
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** True when this user already migrated on this device. User-scoped: one
 *  user's migration state never suppresses another user's migration. */
export function hasMigrated(userId: string): boolean {
  try {
    return localStorage.getItem(`${DONE_FLAG}:${userId}`) === '1';
  } catch {
    return false;
  }
}

function markDone(userId: string): void {
  try {
    localStorage.setItem(`${DONE_FLAG}:${userId}`, '1');
  } catch {
    /* non-fatal */
  }
}

function newReport(userId: string): MigrationReport {
  return {
    ranAt: new Date().toISOString(),
    userId,
    alreadyRan: hasMigrated(userId),
    profile: 'skipped-empty',
    savedSchemes: 0,
    applications: 0,
    checklistTicks: 0,
    vaultPrepared: 0,
    legacySessionKeysMerged: 0,
    errors: [],
  };
}

/**
 * Claim a local profile key into the user's cloud profile, with
 * remote-exists protection: an existing cloud row is NEVER overwritten.
 * The legacy global v1 key is never passed as sourceKey — see the module
 * header. The only legitimate profile sources are the guest key (explicit
 * guest → account flow) and the cloud itself.
 */
async function claimLocalProfile(
  userId: string,
  sourceKey: string,
  report: MigrationReport,
  deps: MigrationRemoteDeps,
): Promise<void> {
  try {
    const local = readJson<Record<string, unknown>>(sourceKey);
    if (local && typeof local === 'object' && local.category && local.state) {
      const remote = await deps.getProfile(userId);
      if (!remote) {
        await deps.saveProfile(userId, local);
        report.profile = 'migrated';
      } else {
        // Backend already has a profile (e.g. migrated on another device) —
        // never overwrite remote data with a possibly-stale local copy.
        report.profile = 'skipped-remote-newer';
      }
    } else if (local) {
      report.profile = 'invalid';
    }
  } catch (err) {
    report.errors.push(`profile: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Union-merge the additive local stores (saved schemes, tracked
 * applications, document progress). Never deletes or overwrites remote
 * state; remote data always wins on conflict.
 */
async function migrateAuxiliaryData(
  userId: string,
  report: MigrationReport,
  deps: MigrationRemoteDeps,
): Promise<void> {
  /* ---- Saved schemes (string[]) ---- */
  try {
    const local = readJson<string[]>(K_SAVED);
    if (Array.isArray(local)) {
      const remote = new Set(await deps.getSavedSchemeIds(userId));
      for (const id of new Set(local.filter((s) => typeof s === 'string'))) {
        if (!remote.has(id)) {
          await deps.saveScheme(userId, id);
          report.savedSchemes += 1;
        }
      }
    }
  } catch (err) {
    report.errors.push(`savedSchemes: ${err instanceof Error ? err.message : String(err)}`);
  }

  /* ---- Tracked applications ---- */
  try {
    const local = readJson<TrackedApplicationInput[]>(K_APPLICATIONS);
    if (Array.isArray(local)) {
      const remoteIds = new Set((await deps.listApplications(userId)).map((a) => a.schemeId));
      for (const app of local) {
        if (!app || typeof app.schemeId !== 'string' || remoteIds.has(app.schemeId)) continue;
        await deps.upsertApplication(userId, {
          schemeId: app.schemeId,
          schemeName: String(app.schemeName ?? app.schemeId),
          status: app.status ?? 'interested',
          note: app.note,
          appliedOn: app.appliedOn,
          startedFromPathway: app.startedFromPathway,
          pathwaySnapshot: (app.pathwaySnapshot ?? null) as Json | null,
          journey: (app.journey ?? []) as Json,
          followUp: (app.followUp ?? null) as Json | null,
        });
        report.applications += 1;
      }
    }
  } catch (err) {
    report.errors.push(`applications: ${err instanceof Error ? err.message : String(err)}`);
  }

  /* ---- Document progress map + vault ids + legacy session keys ---- */
  try {
    const merged: Record<string, string[]> = {};
    const absorb = (schemeId: string, ids: unknown) => {
      if (!Array.isArray(ids)) return;
      const clean = ids.filter((d): d is string => typeof d === 'string');
      if (clean.length === 0) return;
      merged[schemeId] = Array.from(new Set([...(merged[schemeId] ?? []), ...clean]));
    };

    const local = readJson<Record<string, unknown>>(K_DOC_PROGRESS);
    if (local && typeof local === 'object') {
      for (const [k, v] of Object.entries(local)) absorb(k, v);
    }
    try {
      for (let i = 0; i < sessionStorage.length; i += 1) {
        const key = sessionStorage.key(i);
        if (!key?.startsWith(LEGACY_DOC_PREFIX)) continue;
        absorb(key.slice(LEGACY_DOC_PREFIX.length), JSON.parse(sessionStorage.getItem(key) ?? 'null'));
        report.legacySessionKeysMerged += 1;
      }
    } catch {
      /* sessionStorage unavailable — skip legacy merge */
    }

    // Vault prepared ids live under the magic key; everything else is per-scheme.
    const vaultIds = merged[VAULT_KEY] ?? [];
    delete merged[VAULT_KEY];
    if (vaultIds.length > 0) {
      await deps.setVaultPrepared(userId, vaultIds);
      report.vaultPrepared = vaultIds.length;
    }

    const remote = await deps.getDocumentProgress(userId);
    for (const [schemeId, ids] of Object.entries(merged)) {
      const existing = new Set(remote[schemeId] ?? []);
      for (const docId of ids) {
        if (existing.has(docId)) continue;
        await deps.setChecklistTicked(userId, schemeId, docId, true);
        report.checklistTicks += 1;
      }
    }
  } catch (err) {
    report.errors.push(`documents: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * FLOW A — ordinary login. Safe to call on every login — it no-ops after
 * the first successful run on the device.
 *
 * The legacy global v1 profile and the guest profile are BOTH ignored:
 * neither may be auto-assigned to the signing-in user. The authenticated
 * profile comes only from v2:<uid> / public.user_profiles via the normal
 * restore path.
 */
export async function migrateLocalStorageToSupabase(
  userId: string,
  deps?: MigrationRemoteDeps,
): Promise<MigrationReport> {
  const report = newReport(userId);
  if (report.alreadyRan) return report;

  // Ownership rule: legacy v1 is read-only and never auto-claimed.
  // Ordinary login does not read it, not even when complete.
  report.profile = 'skipped-legacy-read-only';

  await migrateAuxiliaryData(userId, report, deps ?? defaultDeps());

  markDone(userId);
  return report;
}

/**
 * FLOW B — explicit guest → account migration. Call only after
 * consumeExplicitGuestMigration() confirms the user explicitly chose
 * "Create Account" during the guest flow.
 *
 * Claims ONLY the current guest profile key. The legacy global v1 key is
 * never a migration source. Remote-exists protection applies: an existing
 * cloud profile is never overwritten.
 */
export async function migrateGuestProfileToSupabase(
  userId: string,
  deps?: MigrationRemoteDeps,
): Promise<MigrationReport> {
  const report = newReport(userId);
  if (report.alreadyRan) return report;

  const resolved = deps ?? defaultDeps();
  await claimLocalProfile(userId, GUEST_PROFILE_KEY, report, resolved);
  await migrateAuxiliaryData(userId, report, resolved);

  markDone(userId);
  return report;
}
