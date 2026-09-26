import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStoredProfile, saveStoredProfile, clearStoredProfile, subscribeProfileStorage } from '../lib/profile/profileStorage';
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
import { setSyncUserId, restoreCloudToLocal } from '../lib/supabase/sync';

export interface LocalUser {
  uid: string;
  displayName: string;
  /** False for real Supabase sessions; true for the legacy local/guest user. */
  isLocal: boolean;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  /** Set when a Google OAuth return could not establish a session. Shown on the login screen. */
  authError: string | null;
  clearAuthError: () => void;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
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

const RESTORED_FLAG = 'yojana_setu_cloud_restored_v1';

const runOneTimeMigration = (userId: string): void => {
  try {
    if (hasMigrated()) {
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

const restoreForReturningUser = (userId: string): void => {
  try {
    if (sessionStorage.getItem(RESTORED_FLAG)) return;
  } catch {
    return;
  }
  restoreCloudToLocal(userId)
    .then((restored) => {
      if (!restored) return;
      try {
        sessionStorage.setItem(RESTORED_FLAG, '1');
      } catch {
        /* ignore */
      }
      // Fresh device: boot the app from the restored data.
      window.location.reload();
    })
    .catch((err) => {
      console.warn('[Auth] Cloud restore failed (continuing with local data):', err);
    });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(() => toLocalUser());
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return isSupabaseConfigured();
    } catch {
      return false;
    }
  });

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
    (async () => {
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
        authLog('SESSION_RESTORED', sessionUser ? sessionUser.id : '(none)');
        if (!sessionUser && hadCallback) {
          setAuthError('oauthUnknown');
        }
        applySessionUser(sessionUser);
      } catch {
        if (!cancelled) applySessionUser(null);
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
    try {
      if (isSupabaseConfigured()) {
        await supabaseSignOut();
      }
    } catch {
      // Backend unreachable — still clear local state below.
    }
    setSyncUserId(null);
    clearStoredProfile();
    setUser(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
