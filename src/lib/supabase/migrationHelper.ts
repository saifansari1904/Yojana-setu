/**
 * YOJANA SETU — LOCALSTORAGE → SUPABASE ONE-TIME MIGRATION
 * ------------------------------------------------------------------
 * Drop-in: copy to `src/lib/supabase/migrationHelper.ts` in the repo.
 *
 * When the backend goes live, existing citizens already have data in
 * localStorage. Call `migrateLocalStorageToSupabase(userId)` once, right
 * after the first successful sign-in on the backend (see README wiring).
 *
 * Reads every legacy key, validates defensively (malformed entries are
 * skipped, never fatal), and writes to Supabase via the services above.
 *
 * Safety rules:
 * - NEVER deletes local data. Rollback = keep using localStorage.
 * - Idempotent: a completion flag ('yojana_setu_backend_migrated_v1')
 *   prevents double-runs; upserts make re-runs harmless anyway.
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
 * K_PROFILE is the pre-ownership global key. It is read here ONLY for the
 * explicit one-time guest→account migration (with remote-exists protection).
 * It is never used as an authenticated profile source. */
const K_PROFILE = 'yojana_setu_user_profile_v1';
const K_SAVED = 'yojana_setu_saved_schemes';
const K_APPLICATIONS = 'yojana_setu_applications_v1';
const K_DOC_PROGRESS = 'yojana_setu_document_progress_v1';
const LEGACY_DOC_PREFIX = 'setu_docs_';
const VAULT_KEY = '__reusable_vault__';

export interface MigrationReport {
  ranAt: string;
  userId: string;
  alreadyRan: boolean;
  profile: 'migrated' | 'skipped-empty' | 'skipped-remote-newer' | 'invalid';
  savedSchemes: number;
  applications: number;
  checklistTicks: number;
  vaultPrepared: number;
  legacySessionKeysMerged: number;
  errors: string[];
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

/**
 * Run the one-time migration. Safe to call on every login — it no-ops
 * after the first successful run on the device.
 */
export async function migrateLocalStorageToSupabase(userId: string): Promise<MigrationReport> {
  const report: MigrationReport = {
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
  if (report.alreadyRan) return report;

  /* ---- 1. Eligibility profile (UserProfile JSON verbatim) ---- */
  try {
    const local = readJson<Record<string, unknown>>(K_PROFILE);
    if (local && typeof local === 'object' && local.category && local.state) {
      const remote = await getUserProfile(userId);
      if (!remote) {
        await saveUserProfile(userId, local as Json, extractProfileColumns(local));
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

  /* ---- 2. Saved schemes (string[]) ---- */
  try {
    const local = readJson<string[]>(K_SAVED);
    if (Array.isArray(local)) {
      const remote = new Set(await getSavedSchemeIds(userId));
      for (const id of new Set(local.filter((s) => typeof s === 'string'))) {
        if (!remote.has(id)) {
          await saveScheme(userId, id);
          report.savedSchemes += 1;
        }
      }
    }
  } catch (err) {
    report.errors.push(`savedSchemes: ${err instanceof Error ? err.message : String(err)}`);
  }

  /* ---- 3. Tracked applications ---- */
  try {
    const local = readJson<TrackedApplicationInput[]>(K_APPLICATIONS);
    if (Array.isArray(local)) {
      const remoteIds = new Set((await listApplications(userId)).map((a) => a.schemeId));
      for (const app of local) {
        if (!app || typeof app.schemeId !== 'string' || remoteIds.has(app.schemeId)) continue;
        await upsertApplication(userId, {
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

  /* ---- 4. Document progress map + vault ids + legacy session keys ---- */
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
      await setVaultPrepared(userId, vaultIds);
      report.vaultPrepared = vaultIds.length;
    }

    const remote = await getDocumentProgress(userId);
    for (const [schemeId, ids] of Object.entries(merged)) {
      const existing = new Set(remote[schemeId] ?? []);
      for (const docId of ids) {
        if (existing.has(docId)) continue;
        await setChecklistTicked(userId, schemeId, docId, true);
        report.checklistTicks += 1;
      }
    }
  } catch (err) {
    report.errors.push(`documents: ${err instanceof Error ? err.message : String(err)}`);
  }

  markDone(userId);
  return report;
}
