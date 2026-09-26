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
import { validateUserProfile } from '../validation/userProfileValidation';
import { normalizeRegistrationFields } from '../registrations/registrationModel';
import { syncProfileToCloud, getSyncUserId } from '../supabase/sync';

/**
 * STORAGE OWNERSHIP MODEL
 * -----------------------
 * Guest profile (unauthenticated):      yojana_setu_guest_profile_v1
 * Authenticated profile (per Supabase UID): yojana_setu_user_profile_v2:<uid>
 * Legacy (pre-ownership, read-only):    yojana_setu_user_profile_v1
 *
 * The legacy v1 key is NEVER written. It is read only as a fallback for
 * guests (pre-migration data) and by migrationHelper for the explicit
 * guest→account migration. An authenticated user NEVER reads the legacy
 * key — their profile comes from v2:<uid> or the cloud.
 */
export const GUEST_PROFILE_KEY = 'yojana_setu_guest_profile_v1';
const AUTH_PROFILE_KEY_PREFIX = 'yojana_setu_user_profile_v2:';
const LEGACY_PROFILE_KEY = 'yojana_setu_user_profile_v1';
// Kept exported for tests/back-compat; do not use for new writes.
export const USER_PROFILE_STORAGE_KEY = LEGACY_PROFILE_KEY;
const PROFILE_SYNC_EVENT = 'yojana_setu_profile_sync';

/** User-scoped authenticated profile key. Uses the Supabase auth UID, never email. */
export function authenticatedProfileKey(userId: string): string {
  return `${AUTH_PROFILE_KEY_PREFIX}${userId}`;
}

/**
 * Sanitizes an applicant name to ensure Aadhaar numbers, PAN numbers,
 * or raw mobile numbers are never retained or logged.
 */
export function sanitizeApplicantName(rawName?: string, defaultFallback = 'Citizen Entrepreneur'): string {
  if (!rawName) return defaultFallback;
  const trimmed = rawName.trim();
  if (!trimmed) return defaultFallback;

  // 1. Strip/mask 12-digit Aadhaar pattern
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 12) {
    return defaultFallback;
  }

  // 2. Mask 10-digit phone number
  if (digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly)) {
    return `Citizen (••• ${digitsOnly.slice(-4)})`;
  }

  // 3. Strip PAN format (5 letters, 4 digits, 1 letter)
  if (/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(trimmed)) {
    return defaultFallback;
  }

  return trimmed.slice(0, 80);
}

/**
 * Strips any sensitive identifiers from user profile prior to storage.
 */
export function sanitizeProfilePII(profile: UserProfile): UserProfile {
  const sanitizedName = sanitizeApplicantName(profile.applicantName);
  let sanitizedBizName = profile.businessName ? profile.businessName.trim() : undefined;
  if (sanitizedBizName) {
    const digits = sanitizedBizName.replace(/\D/g, '');
    if (digits.length === 12 || /^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(sanitizedBizName)) {
      sanitizedBizName = undefined;
    }
  }

  return {
    ...profile,
    applicantName: sanitizedName,
    businessName: sanitizedBizName,
  };
}

/**
 * Loads and validates a profile from a specific storage key.
 * Returns null if missing, corrupt, or invalid.
 */
function loadProfileFromKey(storageKey: string): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const validation = validateUserProfile(parsed as Partial<UserProfile>);
    if (validation.isValid && validation.formattedProfile) {
      // One-time migration: legacy registration fields -> per-record model,
      // and legacy fields derived back from records for existing consumers.
      const normalized = normalizeRegistrationFields(validation.formattedProfile);
      return sanitizeProfilePII(normalized);
    }

    // Defensive repair for legacy or partially valid saved profiles
    if (parsed.category && parsed.state && parsed.businessType) {
      const repaired: UserProfile = {
        category: parsed.category,
        businessType: parsed.businessType,
        state: parsed.state,
        age: typeof parsed.age === 'number' && !isNaN(parsed.age) ? Math.max(18, Math.min(75, parsed.age)) : 30,
        annualIncome: typeof parsed.annualIncome === 'number' && !isNaN(parsed.annualIncome) ? Math.max(0, parsed.annualIncome) : 250000,
        applicantName: sanitizeApplicantName(parsed.applicantName),
        district: parsed.district,
        gender: parsed.gender,
        isRegistered: parsed.isRegistered,
        businessStage: parsed.businessStage,
        fundingRequired: parsed.fundingRequired,
        ruralUrban: parsed.ruralUrban,
      };
      repaired.businessNeedProfile = deriveBusinessNeedProfile(repaired);
      repaired.businessProfile = deriveBusinessProfile(repaired);
      return sanitizeProfilePII(repaired);
    }

    return null;
  } catch (err) {
    console.warn('[ProfileStorage] Failed to load user profile from storage:', err);
    return null;
  }
}

/**
 * Loads the citizen's profile from persistent local storage.
 * Ownership-aware: authenticated users read ONLY their v2:<uid> key;
 * guests read the guest key (with legacy v1 fallback for pre-migration data).
 */
export function loadStoredProfile(): UserProfile | null {
  const uid = getSyncUserId();
  if (uid) {
    return loadProfileFromKey(authenticatedProfileKey(uid));
  }
  return loadProfileFromKey(GUEST_PROFILE_KEY) ?? loadProfileFromKey(LEGACY_PROFILE_KEY);
}

/** Loads the authenticated profile for a specific user. Never reads the legacy global key. */
export function loadAuthenticatedProfile(userId: string): UserProfile | null {
  return loadProfileFromKey(authenticatedProfileKey(userId));
}

/** Loads the guest profile. Includes legacy v1 fallback for pre-migration data. */
export function loadGuestProfile(): UserProfile | null {
  return loadProfileFromKey(GUEST_PROFILE_KEY) ?? loadProfileFromKey(LEGACY_PROFILE_KEY);
}

/** Reads the legacy v1 key directly (for the explicit guest→account migration only). */
export function loadLegacyProfile(): UserProfile | null {
  return loadProfileFromKey(LEGACY_PROFILE_KEY);
}

/**
 * Saves the user profile to the ownership-correct key.
 * Authenticated: yojana_setu_user_profile_v2:<uid> (+ cloud mirror).
 * Guest: yojana_setu_guest_profile_v1 (never sent to Supabase).
 * The legacy v1 key is never written.
 */
export function saveStoredProfile(profile: UserProfile | null | undefined): UserProfile | null {
  if (!profile) {
    clearStoredProfile();
    return null;
  }

  const sanitized = sanitizeProfilePII(profile);
  // Keep legacy registration fields in sync with per-record model so the
  // matching engine and all existing consumers see current data.
  const normalized = normalizeRegistrationFields(sanitized);
  const needProfile = normalized.businessNeedProfile || deriveBusinessNeedProfile(normalized);
  const bizProfile = normalized.businessProfile || deriveBusinessProfile(normalized);

  const updatedProfile: UserProfile = {
    ...normalized,
    businessNeedProfile: needProfile,
    businessProfile: bizProfile,
  };

  const uid = getSyncUserId();
  const storageKey = uid ? authenticatedProfileKey(uid) : GUEST_PROFILE_KEY;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT, { detail: updatedProfile }));
    } catch (err) {
      console.warn('[ProfileStorage] Failed to persist user profile:', err);
    }
  }

  // Mirror to the cloud backend when a Supabase session is active.
  // Fire-and-forget: never blocks the UI, never throws.
  // Guests never reach here with a uid, so guest data never goes to Supabase.
  syncProfileToCloud(updatedProfile);

  return updatedProfile;
}

/**
 * Saves an authenticated profile for an explicit user id (used by the
 * restore path, which runs before syncUserId may be set in all callers).
 */
export function saveAuthenticatedProfile(userId: string, profile: UserProfile | null | undefined): UserProfile | null {
  if (!profile) return null;
  const sanitized = sanitizeProfilePII(profile);
  const normalized = normalizeRegistrationFields(sanitized);
  const updatedProfile: UserProfile = {
    ...normalized,
    businessNeedProfile: normalized.businessNeedProfile || deriveBusinessNeedProfile(normalized),
    businessProfile: normalized.businessProfile || deriveBusinessProfile(normalized),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(authenticatedProfileKey(userId), JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT, { detail: updatedProfile }));
    } catch (err) {
      console.warn('[ProfileStorage] Failed to persist authenticated profile:', err);
    }
  }
  return updatedProfile;
}

/**
 * Clears the stored profile for the active ownership context.
 * Authenticated: removes v2:<uid> (the user's own device cache; the cloud
 * profile is NEVER deleted). Guest: removes the guest key.
 */
export function clearStoredProfile(): void {
  if (typeof window !== 'undefined') {
    try {
      const uid = getSyncUserId();
      localStorage.removeItem(uid ? authenticatedProfileKey(uid) : GUEST_PROFILE_KEY);
      window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT, { detail: null }));
    } catch {
      // Ignore storage failure
    }
  }
}

/** Removes the authenticated device cache for an explicit user id (logout). */
export function clearAuthenticatedProfile(userId: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(authenticatedProfileKey(userId));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Subscribes to storage events across tabs and within the current window.
 * Returns an unsubscription function.
 */
export function subscribeProfileStorage(callback: (profile: UserProfile | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const watchedKeys = new Set([GUEST_PROFILE_KEY, LEGACY_PROFILE_KEY]);
  const handleStorage = (event: StorageEvent) => {
    if (event.key && (watchedKeys.has(event.key) || event.key.startsWith(AUTH_PROFILE_KEY_PREFIX))) {
      callback(loadStoredProfile());
    }
  };

  const handleCustomSync = () => {
    callback(loadStoredProfile());
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(PROFILE_SYNC_EVENT, handleCustomSync);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(PROFILE_SYNC_EVENT, handleCustomSync);
  };
}
