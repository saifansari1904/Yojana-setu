import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStoredProfile, clearStoredProfile, subscribeProfileStorage } from '../lib/profile/profileStorage';

export interface LocalUser {
  uid: string;
  displayName: string;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(() => {
    const profile = loadStoredProfile();
    if (profile?.applicantName) {
      return {
        uid: 'local-session-user',
        displayName: profile.applicantName,
        isLocal: true,
      };
    }
    return null;
  });

  useEffect(() => {
    return subscribeProfileStorage((profile) => {
      if (profile?.applicantName) {
        setUser({
          uid: 'local-session-user',
          displayName: profile.applicantName,
          isLocal: true,
        });
      } else {
        setUser(null);
      }
    });
  }, []);

  const signOutUser = async (): Promise<void> => {
    clearStoredProfile();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading: false, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

