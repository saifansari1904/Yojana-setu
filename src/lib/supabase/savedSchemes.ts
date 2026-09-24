/**
 * YOJANA SETU — SAVED SCHEMES SERVICE (public.saved_schemes)
 * ------------------------------------------------------------------
 * Drop-in: copy to `src/lib/supabase/savedSchemes.ts` in the repo.
 *
 * Replaces localStorage 'yojana_setu_saved_schemes' (a JSON string array of
 * scheme ids, managed in src/App.tsx). Same semantics: a per-user SET of
 * scheme ids. PK (user_id, scheme_id) makes save idempotent.
 */

import { getSupabaseClient } from './client';
import type { DbSavedSchemeRow } from './types';

const TABLE = 'saved_schemes';

/** All saved scheme ids for the user (array, like the old localStorage). */
export async function getSavedSchemeIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('scheme_id')
    .eq('user_id', userId);
  if (error) throw new Error(`[savedSchemes] load failed: ${error.message}`);
  return ((data ?? []) as Pick<DbSavedSchemeRow, 'scheme_id'>[]).map((r) => r.scheme_id);
}

/** Idempotent save (INSERT … ON CONFLICT DO NOTHING). */
export async function saveScheme(userId: string, schemeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, scheme_id: schemeId }, { onConflict: 'user_id,scheme_id' });
  if (error) throw new Error(`[savedSchemes] save failed: ${error.message}`);
}

/** Remove one bookmark. */
export async function unsaveScheme(userId: string, schemeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('scheme_id', schemeId);
  if (error) throw new Error(`[savedSchemes] unsave failed: ${error.message}`);
}

/**
 * Toggle helper mirroring the old App.tsx Set-toggle behaviour.
 * Returns the new saved state (true = now saved).
 */
export async function toggleSavedScheme(
  userId: string,
  schemeId: string,
  currentlySaved: boolean,
): Promise<boolean> {
  if (currentlySaved) {
    await unsaveScheme(userId, schemeId);
    return false;
  }
  await saveScheme(userId, schemeId);
  return true;
}
