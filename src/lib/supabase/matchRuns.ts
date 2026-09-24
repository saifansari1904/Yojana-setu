/**
 * YOJANA SETU — MATCH RUN HISTORY (public.match_runs)
 * ------------------------------------------------------------------
 * Drop-in: copy to `src/lib/supabase/matchRuns.ts` in the repo.
 *
 * The app computes MatchResult objects in memory today and keeps no
 * history. This service records each assessment run (answers snapshot +
 * compact per-scheme summaries) so the citizen can revisit past runs.
 * Runs are immutable: insert + read only (no update policy in SQL).
 *
 * Only compact summaries are stored — never the full MatchResult with the
 * embedded Scheme object (schemes are static app data; storing them per run
 * would bloat the table and drift from the dataset).
 */

import { getSupabaseClient } from './client';
import type { DbMatchRunRow, Json, NewMatchRun } from './types';

const TABLE = 'match_runs';

/** Record one assessment run. Returns the created row. */
export async function recordMatchRun(
  userId: string,
  run: NewMatchRun,
): Promise<DbMatchRunRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      profile_snapshot: run.profile_snapshot,
      result_count: run.result_count,
      top_scheme_id: run.top_scheme_id ?? null,
      top_match_pct: run.top_match_pct ?? null,
      results: run.results as unknown as Json,
    })
    .select()
    .single();
  if (error) throw new Error(`[matchRuns] insert failed: ${error.message}`);
  return data as DbMatchRunRow;
}

/** Newest-first history for the user. Defaults to the 20 most recent. */
export async function listMatchRuns(
  userId: string,
  limit = 20,
): Promise<DbMatchRunRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`[matchRuns] list failed: ${error.message}`);
  return (data ?? []) as DbMatchRunRow[];
}

/** Delete a single run (e.g. "clear history" UI). */
export async function deleteMatchRun(userId: string, runId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', runId);
  if (error) throw new Error(`[matchRuns] delete failed: ${error.message}`);
}
