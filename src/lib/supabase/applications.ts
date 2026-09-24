/**
 * YOJANA SETU — APPLICATION TRACKER SERVICE (public.applications)
 * ------------------------------------------------------------------
 * Drop-in: copy to `src/lib/supabase/applications.ts` in the repo.
 *
 * Replaces localStorage 'yojana_setu_applications_v1' (managed by
 * src/lib/tracker/applicationTracker.ts). Frontend field names are
 * camelCase (TrackedApplication); DB columns are snake_case — this module
 * owns the mapping so callers keep using the frontend shape.
 *
 * One tracked application per (user, scheme): upsert keyed on
 * unique(user_id, scheme_id), matching the old "one entry per scheme"
 * behaviour.
 */

import { getSupabaseClient } from './client';
import type {
  DbApplicationRow,
  DbApplicationStatus,
  Json,
  TrackedApplicationInput,
} from './types';

const TABLE = 'applications';

function toRow(userId: string, app: TrackedApplicationInput) {
  return {
    user_id: userId,
    scheme_id: app.schemeId,
    scheme_name: app.schemeName,
    status: app.status as DbApplicationStatus,
    note: app.note ?? null,
    applied_on: app.appliedOn ?? null,
    started_from_pathway: app.startedFromPathway ?? false,
    pathway_snapshot: (app.pathwaySnapshot ?? null) as Json | null,
    journey: (app.journey ?? []) as Json,
    follow_up: (app.followUp ?? null) as Json | null,
  };
}

function toInput(row: DbApplicationRow): TrackedApplicationInput & { updatedAt: string } {
  return {
    schemeId: row.scheme_id,
    schemeName: row.scheme_name,
    status: row.status,
    note: row.note ?? undefined,
    appliedOn: row.applied_on ?? undefined,
    startedFromPathway: row.started_from_pathway,
    pathwaySnapshot: (row.pathway_snapshot ?? undefined) as Json | undefined,
    journey: row.journey,
    followUp: (row.follow_up ?? undefined) as Json | undefined,
    updatedAt: row.updated_at,
  };
}

/** All tracked applications for the user, newest-updated first. */
export async function listApplications(
  userId: string,
): Promise<Array<TrackedApplicationInput & { updatedAt: string }>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`[applications] list failed: ${error.message}`);
  return ((data ?? []) as DbApplicationRow[]).map(toInput);
}

/** Create or replace the entry for a scheme (one entry per scheme). */
export async function upsertApplication(
  userId: string,
  app: TrackedApplicationInput,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLE)
    .upsert(toRow(userId, app), { onConflict: 'user_id,scheme_id' });
  if (error) throw new Error(`[applications] upsert failed: ${error.message}`);
}

/** Change status of one entry (updated_at bumps via trigger). */
export async function updateApplicationStatus(
  userId: string,
  schemeId: string,
  status: DbApplicationStatus,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq('user_id', userId)
    .eq('scheme_id', schemeId);
  if (error) throw new Error(`[applications] status update failed: ${error.message}`);
}

/** Remove one tracked application. */
export async function deleteApplication(userId: string, schemeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('scheme_id', schemeId);
  if (error) throw new Error(`[applications] delete failed: ${error.message}`);
}
