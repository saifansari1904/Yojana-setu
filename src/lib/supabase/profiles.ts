/**
 * YOJANA SETU — ACCOUNT PROFILE SERVICE (public.profiles)
 * ------------------------------------------------------------------
 * Drop-in: copy to `src/lib/supabase/profiles.ts` in the repo.
 *
 * The `profiles` row is auto-created at sign-up by the handle_new_user()
 * trigger (migration 002). These helpers read/update the small account
 * fields (display name, mobile, language). The big eligibility profile
 * lives in userProfile.ts (public.user_profiles).
 */

import { getSupabaseClient } from './client';
import type { DbProfileRow, ProfilePatch } from './types';

const TABLE = 'profiles';

/** Load the signed-in user's account profile row. Null when absent. */
export async function getAccountProfile(userId: string): Promise<DbProfileRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`[profiles] load failed: ${error.message}`);
  return (data as DbProfileRow | null) ?? null;
}

/**
 * Update account fields. RLS restricts this to the caller's own row.
 * Only whitelisted columns are written — user_id/created_at are immutable.
 */
export async function updateAccountProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<DbProfileRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...(patch.display_name !== undefined ? { display_name: patch.display_name } : {}),
      ...(patch.mobile !== undefined ? { mobile: patch.mobile } : {}),
      ...(patch.preferred_language !== undefined
        ? { preferred_language: patch.preferred_language }
        : {}),
    })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(`[profiles] update failed: ${error.message}`);
  return data as DbProfileRow;
}
