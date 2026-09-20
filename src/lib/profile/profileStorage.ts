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

export const USER_PROFILE_STORAGE_KEY = 'yojana_setu_user_profile_v1';
const PROFILE_SYNC_EVENT = 'yojana_setu_profile_sync';

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
 * Loads the citizen's profile from persistent local storage.
 * Gracefully handles parsing errors, validates data integrity, and returns null if corrupt or missing.
 */
export function loadStoredProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const validation = validateUserProfile(parsed as Partial<UserProfile>);
    if (validation.isValid && validation.formattedProfile) {
      return sanitizeProfilePII(validation.formattedProfile);
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
 * Saves the user profile as the authoritative source of truth.
 * Automatically sanitizes PII, synchronizes derived business profiles,
 * and notifies other open tabs via broadcast events.
 */
export function saveStoredProfile(profile: UserProfile | null | undefined): UserProfile | null {
  if (!profile) {
    clearStoredProfile();
    return null;
  }

  const sanitized = sanitizeProfilePII(profile);
  const needProfile = sanitized.businessNeedProfile || deriveBusinessNeedProfile(sanitized);
  const bizProfile = sanitized.businessProfile || deriveBusinessProfile(sanitized);

  const updatedProfile: UserProfile = {
    ...sanitized,
    businessNeedProfile: needProfile,
    businessProfile: bizProfile,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT, { detail: updatedProfile }));
    } catch (err) {
      console.warn('[ProfileStorage] Failed to persist user profile:', err);
    }
  }

  return updatedProfile;
}

/**
 * Clears the stored user profile (e.g. on logout or explicit reset)
 * and dispatches notification.
 */
export function clearStoredProfile(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT, { detail: null }));
    } catch {
      // Ignore storage failure
    }
  }
}

/**
 * Subscribes to storage events across tabs and within the current window.
 * Returns an unsubscription function.
 */
export function subscribeProfileStorage(callback: (profile: UserProfile | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === USER_PROFILE_STORAGE_KEY) {
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
