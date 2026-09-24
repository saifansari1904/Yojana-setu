/**
 * YOJANA SETU — ELIGIBILITY PROFILE SERVICE (public.user_profiles)
 * ------------------------------------------------------------------
 * Drop-in: copy to `src/lib/supabase/userProfile.ts` in the repo.
 *
 * Replaces localStorage 'yojana_setu_user_profile_v1'. The frontend's
 * UserProfile (src/types/user.ts) is stored VERBATIM as JSONB — the
 * matching engine, eligibility audits and registration model all read the
 * same shape they read from localStorage today, so no engine changes are
 * needed. The caller passes the repo's UserProfile type as the generic T.
 *
 * Four extracted columns (state/category/business_type/district) are kept
 * in sync for future server-side filtering; they are informational only.
 */

import { getSupabaseClient } from './client';
import type { DbUserProfileRow, Json, UserProfileExtracted } from './types';

const TABLE = 'user_profiles';

/** Load the user's eligibility profile. Null on first run (no row yet). */
export async function getUserProfile<T = Json>(userId: string): Promise<T | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('profile')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`[userProfile] load failed: ${error.message}`);
  return ((data as Pick<DbUserProfileRow, 'profile'> | null)?.profile as T | undefined) ?? null;
}

/**
 * Save (upsert) the user's eligibility profile. One row per user.
 * Pass the repo's UserProfile object directly as `profile`.
 */
export async function saveUserProfile<T = Json>(
  userId: string,
  profile: T,
  extracted: UserProfileExtracted = {},
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      profile: profile as Json,
      state: extracted.state ?? null,
      category: extracted.category ?? null,
      business_type: extracted.business_type ?? null,
      district: extracted.district ?? null,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(`[userProfile] save failed: ${error.message}`);
}

/**
 * Derive the extracted filter columns from a repo UserProfile-shaped object.
 * Call this at the wiring site so the caller doesn't hand-write mappings:
 *
 *   await saveUserProfile(user.id, profile, extractProfileColumns(profile));
 */
export function extractProfileColumns(profile: {
  state?: string;
  category?: string;
  businessType?: string;
  district?: string;
}): UserProfileExtracted {
  return {
    state: profile.state ?? null,
    category: profile.category ?? null,
    business_type: profile.businessType ?? null,
    district: profile.district ?? null,
  };
}
