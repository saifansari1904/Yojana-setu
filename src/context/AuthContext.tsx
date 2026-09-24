import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStoredProfile, clearStoredProfile, subscribeProfileStorage } from '../lib/profile/profileStorage';
import {
  getSessionUser,
  onAuthStateChange,
  signOut as supabaseSignOut,
  isSupabaseConfigured,
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
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOutUser: async () => {},
});

const toCloudUser = (sessionUser: SessionUser): LocalUser => ({
  uid: sessionUser.id,
  displayName: sessionUser.displayName,
  isLocal: false,
});

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
  migrateLocalStorageToSupabase(userId).catch((err) => {
    console.warn('[Auth] One-time localStorage migration failed (local data kept):', err);
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
    const applySessionUser = (sessionUser: SessionUser | null) => {
      if (sessionUser) {
        setSyncUserId(sessionUser.id);
        setUser(toCloudUser(sessionUser));
        runOneTimeMigration(sessionUser.id);
      } else {
        setSyncUserId(null);
        setUser(toLocalUser());
      }
    };

    // Restore an existing session (page refresh, Google redirect return).
    getSessionUser()
      .then((sessionUser) => {
        if (cancelled) return;
        applySessionUser(sessionUser);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    // Live session changes: sign-in, sign-out, token refresh, and the
    // post-Google-OAuth redirect landing back on the app.
    const unsubscribeAuth = onAuthStateChange((sessionUser) => {
      if (!cancelled) applySessionUser(sessionUser);
    });

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

  return (
    <AuthContext.Provider value={{ user, loading, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
