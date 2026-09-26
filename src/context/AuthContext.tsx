import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStoredProfile, saveStoredProfile, clearAuthenticatedProfile, subscribeProfileStorage } from '../lib/profile/profileStorage';
import type { UserProfile } from '../types/user';
import {
  getSessionUser,
  onAuthStateChange,
  signOut as supabaseSignOut,
  isSupabaseConfigured,
  hasOAuthCallbackParams,
  clearOAuthCallbackParams,
  resolveDisplayName,
  type SessionUser,
} from '../lib/supabase';
import {
  hasMigrated,
  migrateLocalStorageToSupabase,
} from '../lib/supabase/migrationHelper';
import { setSyncUserId, restoreCloudToLocal, hasUsableLocalProfile, clearCloudCaches } from '../lib/supabase/sync';
import { loadAuthenticatedProfile } from '../lib/profile/profileStorage';
import {
  resolveAuthStatus,
  AuthSessionArbiter,
  type AuthStatus,
  type ProfileRestoreState,
} from '../lib/auth/authState';

// Re-exported so existing import sites keep working; the definitions live
// in lib/auth/authState.ts (pure, unit-testable).
export type { AuthStatus, ProfileRestoreState } from '../lib/auth/authState';

export interface LocalUser {
  uid: string;
  displayName: string;
  /** False for real Supabase sessions; true for the legacy local/guest user. */
  isLocal: boolean;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  authStatus: AuthStatus;
  profileRestore: ProfileRestoreState;
  /** Set when a Google OAuth return could not establish a session. Shown on the login screen. */
  authError: string | null;
  clearAuthError: () => void;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  authStatus: 'unauthenticated',
  profileRestore: 'idle',
  authError: null,
  clearAuthError: () => {},
  signOutUser: async () => {},
});

const toCloudUser = (sessionUser: SessionUser): LocalUser => ({
  uid: sessionUser.id,
  displayName: sessionUser.displayName,
  isLocal: false,
});

/** Development-only auth diagnostic logging. Never logs tokens, codes, or PII. */
const authLog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Auth]', ...args);
  }
};

/** Legacy fallback: a locally stored profile still yields a local user (guests). */
const toLocalUser = (): LocalUser | null => {
  const profile = loadStoredProfile();
  if (profile?.applicantName) {
    return {
      uid: 'local-session-user',
      displayName: profile.applicantName,
      isLocal: true,
    };
  }
  return null;
};

/**
 * One-time legacy import after the first backend sign-in. Never deletes
 * local data; no-ops on later sign-ins via the hasMigrated() flag.
 *
 * For RETURNING users (flag already set) on a device with no local data —
 * e.g. a fresh phone — we pull the cloud account down instead, then reload
 * once so the whole app boots from the restored data.
 */
/**
 * OAuth sign-ins (Google) carry the user's real name in their metadata, but
 * the local profile — which the identity panel reads first — may have no
 * applicantName yet. Fill it in once so the UI shows the real name
 * everywhere; never overwrites a name the user already set. Runs before the
 * one-time migration so the name is carried into the cloud profile too.
 */
const backfillApplicantName = (displayName: string): void => {
  try {
    if (!displayName || displayName === 'Citizen Entrepreneur') return;
    const current = loadStoredProfile();
    // Never fabricate a profile from nothing. On a fresh login with no local
    // profile (e.g. after logout cleared it), the cloud-restore path owns
    // recovery: writing a name-only stub here would (a) make
    // restoreCloudToLocal skip the restore ("local data wins") and (b)
    // overwrite the good cloud copy with the stub via the fire-and-forget
    // sync. Together those two effects reset the user's profile on every
    // re-login. Only fill a missing name on a profile that already exists.
    if (!current) return;
    if (current.applicantName?.trim()) return;
    saveStoredProfile({ ...current, applicantName: displayName } as UserProfile);
  } catch {
    /* never break sign-in over a display-name nicety */
  }
};

const RESTORED_FLAG_PREFIX = 'yojana_setu_cloud_restored_v1:';
// Upper bound for the fresh-device cloud profile restore. If the restore
// hasn't settled by then, the app proceeds with local data instead of
// freezing on the profile loader.
const RESTORE_TIMEOUT_MS = 10_000;

/** User-scoped restore flag: one user's restore state never suppresses
 *  another user's restore. Uses the Supabase auth UID, never email. */
function restoredFlagKey(userId: string): string {
  return `${RESTORED_FLAG_PREFIX}${userId}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(() => toLocalUser());
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileRestore, setProfileRestore] = useState<ProfileRestoreState>('idle');
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return isSupabaseConfigured();
    } catch {
      return false;
    }
  });

  /**
   * Single authoritative auth state, derived from the same `user` + `loading`
   * pair that drives everything else. There is exactly one truth — routing
   * branches on this, never on `user`/`loading`/localStorage independently.
   */
  const authStatus = resolveAuthStatus(loading, user);

  /**
   * One-time legacy import after the first backend sign-in. Never deletes
   * local data; no-ops on later sign-ins via the hasMigrated() flag.
   *
   * For RETURNING users (flag already set) on a device with no local data —
   * e.g. a fresh phone — we pull the cloud account down instead, then reload
   * once so the whole app boots from the restored data.
   *
   * Lives inside the provider so the restore can publish its lifecycle:
   * while `pending`, the app must not navigate as if the profile were blank.
   *
   * The restore is BOUNDED: if the cloud fetch doesn't settle within
   * RESTORE_TIMEOUT_MS (hung network, stalled Supabase client — supabase-js
   * has no default request timeout), we stop waiting and let the user in
   * with local data. Without this bound, a never-settling promise would
   * leave profileRestore='pending' forever, freezing the app on the
   * profile loader after sign-in.
   */
  const restoreForReturningUser = (userId: string): void => {
    try {
      if (sessionStorage.getItem(restoredFlagKey(userId))) return;
    } catch {
      return;
    }
    // Ownership-aware: a device that already holds THIS USER's usable
    // profile (v2:<uid>) never needs a restore. Another user's profile or
    // an unowned legacy v1 profile must never suppress this user's restore.
    if (hasUsableLocalProfile(loadAuthenticatedProfile(userId))) return;
    const restoreStart = performance.now();
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[Profile] restore started for', userId);
    }
    setProfileRestore('pending');
    const boundedRestore: Promise<boolean> = Promise.race([
      restoreCloudToLocal(userId),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), RESTORE_TIMEOUT_MS);
      }),
    ]);
    boundedRestore
      .then((restored) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log(`[Profile] restore done (restored=${restored}) in ${Math.round(performance.now() - restoreStart)}ms`);
        }
        if (!restored) {
          setProfileRestore('done');
          return;
        }
        try {
          sessionStorage.setItem(restoredFlagKey(userId), '1');
        } catch {
          /* ignore */
        }
        // Fresh device: the restored profile is already in localStorage and
        // the PROFILE_SYNC_EVENT has been dispatched by restoreCloudToLocal.
        // App subscribers pick up the new profile via subscribeProfileStorage.
        // No reload — the navigation effect re-evaluates on profileRestore.
        setProfileRestore('done');
      })
      .catch((err) => {
        console.warn('[Auth] Cloud restore failed (continuing with local data):', err);
        setProfileRestore('done');
      });
  };

  const runOneTimeMigration = (userId: string): void => {
    try {
      if (hasMigrated(userId)) {
        restoreForReturningUser(userId);
        return;
      }
    } catch {
      return;
    }
    migrateLocalStorageToSupabase(userId)
      .catch((err) => {
        console.warn('[Auth] One-time localStorage migration failed (local data kept):', err);
      })
      .finally(() => {
        // The migration only pushes local -> cloud. On a fresh device (or a
        // cleared browser) with an existing cloud account, there is nothing
        // local to push — pull the cloud profile down instead, otherwise the
        // user sees an empty profile until their *next* login. This is a no-op
        // whenever local data exists.
        restoreForReturningUser(userId);
      });
  };

  useEffect(() => {
    // Local profile changes (guest flow, sign-out) keep working exactly as
    // before — but a cloud session always owns the state when present.
    const unsubscribeProfile = subscribeProfileStorage((profile) => {
      setUser((current) => {
        if (current && !current.isLocal) return current;
        return profile?.applicantName
          ? { uid: 'local-session-user', displayName: profile.applicantName, isLocal: true }
          : null;
      });
    });

    let configured = false;
    try {
      configured = isSupabaseConfigured();
    } catch {
      configured = false;
    }
    if (!configured) {
      // No backend keys (local dev / pre-launch): pure legacy behaviour.
      setLoading(false);
      return unsubscribeProfile;
    }

    let cancelled = false;

    /**
     * Auth-write arbitration (see lib/auth/authState.ts): the listener and
     * the boot restore are concurrent writers. Every state-committing apply
     * bumps the generation first; the boot restore commits only if no apply
     * landed while its read was in flight — the newer writer always wins,
     * so a stale `null` restore can never clear a valid session.
     */
    const arbiter = new AuthSessionArbiter();

    /**
     * Background profile enrichment. Runs AFTER the user is already
     * authenticated and the app is rendering: checks the profiles table
     * for a nicer display name and upgrades it if one is found. A failure
     * here can never log the user out — the metadata-derived name stays.
     */
    const enrichDisplayNameInBackground = (sessionUser: SessionUser): void => {
      authLog('PROFILE_ENRICHMENT_START', sessionUser.id);
      resolveDisplayName(sessionUser.id, sessionUser.email)
        .then((enriched) => {
          if (cancelled) return;
          if (enriched && enriched !== sessionUser.displayName) {
            authLog('PROFILE_ENRICHMENT_SUCCESS');
            setUser((current) =>
              current && !current.isLocal && current.uid === sessionUser.id
                ? { ...current, displayName: enriched }
                : current,
            );
            backfillApplicantName(enriched);
          } else {
            authLog('PROFILE_ENRICHMENT_SUCCESS', '(no change)');
          }
        })
        .catch((err) => {
          // Cosmetic only — the user stays logged in with the metadata name.
          authLog('PROFILE_ENRICHMENT_FAILED', err);
        });
    };

    const applySessionUser = (sessionUser: SessionUser | null) => {
      // Newest apply wins: bump before committing so a concurrent boot read
      // can detect it went stale.
      arbiter.beginApply();
      const appliedUid = sessionUser ? sessionUser.id : null;
      // Duplicate delivery (INITIAL_SESSION echoing the boot restore, token
      // refresh, re-subscription): the state already reflects this uid, so
      // skip the migration/restore/enrichment side effects entirely.
      // Sign-out (null) is never a duplicate — it always commits.
      if (arbiter.isDuplicateDelivery(appliedUid)) {
        authLog('SESSION_APPLIED', '(duplicate — skipped)');
        return;
      }
      arbiter.recordApplied(appliedUid);
      if (sessionUser) {
        authLog('SESSION_APPLIED', sessionUser.id);
        setSyncUserId(sessionUser.id);
        // Authenticated IMMEDIATELY — the app renders without waiting for
        // any profile/database work.
        setUser(toCloudUser(sessionUser));
        setAuthError(null);
        // The callback params are consumed — never leave them in the URL.
        clearOAuthCallbackParams();
        backfillApplicantName(sessionUser.displayName);
        runOneTimeMigration(sessionUser.id);
        enrichDisplayNameInBackground(sessionUser);
      } else {
        authLog('SESSION_APPLIED', '(signed out)');
        setSyncUserId(null);
        setUser(toLocalUser());
      }
    };

    // Race-safe initialization: the auth listener is established FIRST, so
    // an OAuth event arriving during startup cannot be missed. The restore
    // below then reconciles any session the listener hasn't delivered yet.
    authLog('AUTH_INIT');
    const unsubscribeAuth = onAuthStateChange((sessionUser) => {
      if (cancelled) return;
      authLog('AUTH_EVENT', sessionUser ? 'session' : 'null');
      applySessionUser(sessionUser);
    });

    // Restore an existing session (page refresh, Google redirect return).
    // Self-healing: if the URL carried an OAuth callback but no session
    // resulted (e.g. a stale ?code= retried after a reload), clear the
    // params and retry once against the stored session before giving up.
    // A failed callback is surfaced as authError instead of a silent logout.
    //
    // The restore is bounded: if Supabase stalls during the callback (the
    // token exchange itself can hang on some networks/browsers), we fail
    // visibly with the banner instead of hanging silently forever.
    const CALLBACK_RESTORE_TIMEOUT_MS = 20000;
    const bootStart = performance.now();
    (async () => {
      // Capture the generation BEFORE the async read: if the listener
      // delivers an auth event while this read is in flight, that event is
      // newer and this result must be discarded, never applied.
      const readGeneration = arbiter.captureForBootRead();
      try {
        const hadCallback = hasOAuthCallbackParams();
        if (hadCallback) authLog('OAUTH_CALLBACK', 'detected');
        let sessionUser: SessionUser | null = null;
        try {
          const restore = (async (): Promise<SessionUser | null> => {
            let user = await getSessionUser();
            if (!user && hadCallback) {
              clearOAuthCallbackParams();
              user = await getSessionUser();
            }
            return user;
          })();
          const timeout = new Promise<SessionUser | null>((_, reject) => {
            setTimeout(
              () => reject(new Error('OAuth callback restore timed out')),
              CALLBACK_RESTORE_TIMEOUT_MS,
            );
          });
          sessionUser = await Promise.race([restore, timeout]);
        } catch (err) {
          // Timeout or restore error: fall through to the banner below.
          // (getAuthCallbackError is skipped here — it can stall the same way.)
          authLog('SESSION_RESTORE_FAILED', err);
        }
        if (cancelled) return;
        if (!arbiter.isBootReadFresh(readGeneration)) {
          // A listener event landed mid-read and already committed a newer
          // state. Applying this (possibly null) result would clobber it.
          authLog('SESSION_RESTORED', '(stale read — listener already applied)');
        } else {
          authLog('SESSION_RESTORED', sessionUser ? sessionUser.id : '(none)');
          if (!sessionUser && hadCallback) {
            setAuthError('oauthUnknown');
          }
          applySessionUser(sessionUser);
        }
        authLog('TIMING', `boot→session-resolved ${Math.round(performance.now() - bootStart)}ms`);
      } catch {
        if (!cancelled && arbiter.isBootReadFresh(readGeneration)) applySessionUser(null);
      } finally {
        if (!cancelled) {
          authLog('AUTH_INIT', 'complete');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const signOutUser = async (): Promise<void> => {
    const uid = user?.uid;
    try {
      if (isSupabaseConfigured()) {
        await supabaseSignOut();
      }
    } catch {
      // Backend unreachable — still clear local state below.
    }
    // Ordering is critical (spec §18): stop cloud sync BEFORE any local
    // writes, so a subsequent guest write can never target the old uid.
    setSyncUserId(null);
    // Clear the authenticated device cache from active memory. The
    // user-scoped v2:<uid> key is removed so the next user on this device
    // can never read it; the durable cloud profile (public.user_profiles)
    // is NEVER deleted — next login restores it.
    if (uid) {
      clearAuthenticatedProfile(uid);
    }
    // Clear the global cloud caches (saved schemes, applications, documents)
    // so the next user cannot read the previous user's cached state.
    clearCloudCaches();
    setProfileRestore('idle');
    // The one-time restore flag must not survive logout: otherwise a restore
    // performed earlier in this tab session would suppress the cloud restore
    // on the next login, and the entrepreneur profile would look "reset"
    // even though public.user_profiles still holds it.
    try {
      if (uid) sessionStorage.removeItem(restoredFlagKey(uid));
    } catch {
      /* sessionStorage unavailable — restore will simply re-run */
    }
    setUser(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{ user, loading, authStatus, profileRestore, authError, clearAuthError, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
