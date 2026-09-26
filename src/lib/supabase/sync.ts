/**
 * YOJANA SETU — CLOUD SYNC LAYER
 * ------------------------------------------------------------------
 * Local-first sync: localStorage remains the synchronous store of truth,
 * so the app keeps its exact current behaviour — instant UI, offline-safe,
 * and guests are completely unaffected (they never get a sync user id).
 *
 * When a Supabase session is active, AuthContext registers the cloud user
 * id via setSyncUserId(). Every local write below is then mirrored to the
 * backend fire-and-forget: the promise is never awaited, failures are
 * logged and never thrown, so a network hiccup can never break the UI.
 *
 * The one-time localStorage -> Supabase import is NOT here — it lives in
 * migrationHelper.ts and runs once on first backend login (AuthContext).
 */

import { isSupabaseConfigured } from './client';
import { getUserProfile, saveUserProfile, extractProfileColumns } from './userProfile';
import { listApplications, upsertApplication, deleteApplication } from './applications';
import { getSavedSchemeIds, saveScheme, unsaveScheme } from './savedSchemes';
import {
  getDocumentProgress,
  getVaultPrepared,
  setChecklistTicked,
  setVaultPrepared,
} from './documents';
import type { Json, TrackedApplicationInput } from './types';
import type { UserProfile } from '../../types/user';
import type { TrackedApplication } from '../../types/tracker';
import type { DocumentProgressMap } from '../tracker/documentProgress';
import { VAULT_SCHEME_KEY } from '../documents/reusableDocuments';

/** Cloud user id set by AuthContext. Null for guests / signed-out / unconfigured. */
let syncUserId: string | null = null;

/** Diff baselines so repeat writes only send deltas. Reset on session change. */
let lastSyncedAppIds: Set<string> | null = null;
let lastSyncedDocMap: DocumentProgressMap | null = null;

export function setSyncUserId(userId: string | null): void {
  if (syncUserId === userId) return;
  syncUserId = userId;
  lastSyncedAppIds = null;
  lastSyncedDocMap = null;
}

/** Cloud user id when syncing is possible, else null. */
function activeUserId(): string | null {
  if (!syncUserId) return null;
  try {
    if (!isSupabaseConfigured()) return null;
  } catch {
    return null;
  }
  return syncUserId;
}

function background(task: Promise<unknown>, tag: string): void {
  task.catch((err) => {
    console.warn(`[cloud-sync:${tag}] background write failed (local data unaffected):`, err);
  });
}

/* ------------------------- Eligibility profile ------------------------- */

/**
 * Minimum integrity contract for the cloud mirror.
 *
 * A profile missing its core entrepreneur facts must never replace the
 * complete row in public.user_profiles (which saveUserProfile overwrites in
 * full on conflict). Every legitimate writer passes a full UserProfile, so
 * this rejects nothing real — it only makes a future partial-write
 * regression structurally incapable of clobbering cloud data.
 */
export function isCloudMirrorSafe(profile: UserProfile | null | undefined): boolean {
  return !!profile && !!(profile as UserProfile).category && !!(profile as UserProfile).state;
}

/** Mirror a profile save to the cloud. Call from saveStoredProfile. */
export function syncProfileToCloud(profile: UserProfile | null | undefined): void {
  const userId = activeUserId();
  if (!userId || !profile) return;
  if (!isCloudMirrorSafe(profile)) return;
  background(
    saveUserProfile(userId, profile as unknown as Json, extractProfileColumns(profile)),
    'profile',
  );
}

/* ------------------------- Tracked applications ------------------------ */

function toApplicationInput(app: TrackedApplication): TrackedApplicationInput {
  return {
    schemeId: app.schemeId,
    schemeName: app.schemeName,
    status: app.status,
    note: app.note,
    appliedOn: app.appliedOn,
    startedFromPathway: app.startedFromPathway,
    pathwaySnapshot: (app.pathwaySnapshot ?? undefined) as unknown as Json | undefined,
    journey: (app.journey ?? []) as unknown as Json,
    followUp: (app.followUp ?? undefined) as unknown as Json | undefined,
  };
}

/**
 * Mirror the full tracker list to the cloud. Upserts every entry (one row
 * per scheme — idempotent) and deletes cloud rows that disappeared locally.
 * Call from saveTrackedApplications (the single write path).
 */
export function syncTrackedApplicationsToCloud(applications: TrackedApplication[]): void {
  const userId = activeUserId();
  if (!userId) return;
  const currentIds = new Set(applications.map((a) => a.schemeId));
  if (lastSyncedAppIds) {
    for (const removedId of lastSyncedAppIds) {
      if (!currentIds.has(removedId)) {
        background(deleteApplication(userId, removedId), 'applications');
      }
    }
  }
  for (const app of applications) {
    background(upsertApplication(userId, toApplicationInput(app)), 'applications');
  }
  lastSyncedAppIds = currentIds;
}

/* ----------------------------- Saved schemes --------------------------- */

/** Mirror one save/unsave toggle. Call from the App.tsx toggle handler. */
export function syncSavedSchemeToggle(schemeId: string, nowSaved: boolean): void {
  const userId = activeUserId();
  if (!userId) return;
  background(
    nowSaved ? saveScheme(userId, schemeId) : unsaveScheme(userId, schemeId),
    'saved-schemes',
  );
}

/* --------------------------- Document progress ------------------------- */

/**
 * Mirror the document-progress map to the cloud. The '__reusable_vault__'
 * entry goes to vault_prepared; every other scheme id goes to the
 * per-scheme checklist ticks. Only deltas are sent.
 * Call from saveDocumentProgress (the single write path).
 */
export function syncDocumentProgressToCloud(map: DocumentProgressMap): void {
  const userId = activeUserId();
  if (!userId) return;

  const vaultIds = map[VAULT_SCHEME_KEY] ?? [];
  background(setVaultPrepared(userId, vaultIds), 'vault');

  const prev = lastSyncedDocMap ?? {};
  const schemeIds = new Set(
    [...Object.keys(prev), ...Object.keys(map)].filter((k) => k !== VAULT_SCHEME_KEY),
  );
  for (const schemeId of schemeIds) {
    const before = new Set(prev[schemeId] ?? []);
    const after = new Set(map[schemeId] ?? []);
    for (const docId of after) {
      if (!before.has(docId)) {
        background(setChecklistTicked(userId, schemeId, docId, true), 'checklist');
      }
    }
    for (const docId of before) {
      if (!after.has(docId)) {
        background(setChecklistTicked(userId, schemeId, docId, false), 'checklist');
      }
    }
  }
  try {
    lastSyncedDocMap = JSON.parse(JSON.stringify(map)) as DocumentProgressMap;
  } catch {
    lastSyncedDocMap = { ...map };
  }
}

/* ------------------- Cloud -> local restore (fresh device) ------------------- */

/*
 * Legacy localStorage keys (must match the repo's storage modules exactly).
 * Kept as literals — mirroring migrationHelper.ts — so this module never
 * imports the storage modules at runtime (they import this module).
 */
const LS_PROFILE_KEY = 'yojana_setu_user_profile_v1';
const LS_SAVED_KEY = 'yojana_setu_saved_schemes';
const LS_APPLICATIONS_KEY = 'yojana_setu_applications_v1';
const LS_DOC_PROGRESS_KEY = 'yojana_setu_document_progress_v1';
const PROFILE_SYNC_EVENT = 'yojana_setu_profile_sync';

function readLocalJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

/**
 * Validity-aware "local wins" guard.
 *
 * The restore must not run when this device already holds a real profile —
 * but a legacy name-only stub (left in localStorage by the pre-53d46de bug)
 * is truthy JSON without being a restorable entrepreneur profile. Treating
 * it as "local data wins" would block the cloud restore forever and reproduce
 * the exact "profile reset on re-login" symptom. A stub therefore counts as
 * absent so the cloud copy can hydrate the device.
 *
 * Kept inline (not imported from profileStorage) to avoid a circular import;
 * the core-facts heuristic mirrors migrationHelper's.
 */
export function hasUsableLocalProfile(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const rec = raw as Record<string, unknown>;
  return !!(rec.category && rec.state);
}

/**
 * Pull the cloud account's data into this device's localStorage.
 *
 * Runs ONLY for returning users (migration flag already set) whose device
 * has no local profile — i.e. a fresh device / cleared browser. The device's
 * own data always wins: when a local profile exists we do nothing, because
 * the active device is the freshest source and the sync layer keeps pushing
 * it to the cloud.
 *
 * Returns true when a profile was restored — the caller reloads the page so
 * every useState initializer in the app reads the restored data.
 */
export async function restoreCloudToLocal(userId: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    // Validity-aware: a legacy name-only stub must not block the restore.
    if (hasUsableLocalProfile(readLocalJson(LS_PROFILE_KEY))) return false;

    const remoteProfile = await getUserProfile<Json>(userId).catch(() => null);
    if (!remoteProfile || typeof remoteProfile !== 'object' || Array.isArray(remoteProfile)) {
      return false;
    }

    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(remoteProfile));

    try {
      const ids = await getSavedSchemeIds(userId).catch((): string[] => []);
      if (ids.length > 0) localStorage.setItem(LS_SAVED_KEY, JSON.stringify(ids));
    } catch {
      /* non-fatal — profile restore still counts */
    }

    try {
      const apps = await listApplications(userId).catch(() => []);
      if (apps.length > 0) {
        const mapped: TrackedApplication[] = apps.map((a) => ({
          schemeId: a.schemeId,
          schemeName: a.schemeName,
          status: a.status,
          note: a.note,
          appliedOn: a.appliedOn,
          createdAt: a.updatedAt,
          updatedAt: a.updatedAt,
          startedFromPathway: a.startedFromPathway,
          pathwaySnapshot: a.pathwaySnapshot as unknown as TrackedApplication['pathwaySnapshot'],
          journey: a.journey as unknown as TrackedApplication['journey'],
          followUp: a.followUp as unknown as TrackedApplication['followUp'],
        }));
        localStorage.setItem(LS_APPLICATIONS_KEY, JSON.stringify(mapped));
      }
    } catch {
      /* non-fatal */
    }

    try {
      const progress = await getDocumentProgress(userId).catch(
        (): DocumentProgressMap => ({}),
      );
      const vault = await getVaultPrepared(userId).catch((): string[] => []);
      if (vault.length > 0) progress[VAULT_SCHEME_KEY] = vault;
      if (Object.keys(progress).length > 0) {
        localStorage.setItem(LS_DOC_PROGRESS_KEY, JSON.stringify(progress));
      }
    } catch {
      /* non-fatal */
    }

    // Let live subscribers (App's profile state, AuthContext) pick it up.
    window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT));
    return true;
  } catch {
    return false;
  }
}
