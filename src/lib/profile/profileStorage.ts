/**
 * YOJANA SETU — AUTHORITATIVE USER PROFILE STORAGE
 *
 * Persistent single source of truth for the Citizen Entrepreneur's profile.
 * Ensures the profile survives page refreshes and seamlessly drives:
 * - Matching Engine (re-ranked dynamically)
 * - Eligibility Audits
 * - Document Requirements
 * - Application Preparation Workspace
 * - Command Center Dashboard
 */

import { UserProfile } from '../../types/user';
import { deriveBusinessProfile, deriveBusinessNeedProfile } from '../business/businessNeedProfile';

export const USER_PROFILE_STORAGE_KEY = 'yojana_setu_user_profile_v1';

/**
 * Loads the citizen's profile from persistent local storage.
 * Gracefully handles parsing errors and returns null if not set.
 */
export function loadStoredProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.category || !parsed.state) {
      return null;
    }
    const profile = parsed as UserProfile;
    if (!profile.businessNeedProfile) {
      profile.businessNeedProfile = deriveBusinessNeedProfile(profile);
    }
    if (!profile.businessProfile) {
      profile.businessProfile = deriveBusinessProfile(profile);
    }
    return profile;
  } catch (err) {
    console.warn('[ProfileStorage] Failed to load user profile from storage:', err);
    return null;
  }
}

/**
 * Saves the user profile as the authoritative source of truth.
 * Automatically synchronizes derived business profiles and need models.
 * If passed null or undefined, safely clears the stored profile.
 */
export function saveStoredProfile(profile: UserProfile | null | undefined): UserProfile | null {
  if (!profile) {
    clearStoredProfile();
    return null;
  }

  const needProfile = profile.businessNeedProfile || deriveBusinessNeedProfile(profile);
  const bizProfile = profile.businessProfile || deriveBusinessProfile(profile);

  const updatedProfile: UserProfile = {
    ...profile,
    businessNeedProfile: needProfile,
    businessProfile: bizProfile,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (err) {
      console.warn('[ProfileStorage] Failed to persist user profile:', err);
    }
  }

  return updatedProfile;
}

/**
 * Clears the stored user profile (e.g. on logout or explicit reset).
 */
export function clearStoredProfile(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    } catch {
      // Ignore storage failure
    }
  }
}
