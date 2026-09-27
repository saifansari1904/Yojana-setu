/**
 * YOJANA SETU — ADMIN CONSOLE auth.
 * Supabase Auth is the identity authority; the ys_admins table is the
 * authorization authority. A signed-in user who has no active ys_admins
 * row is NOT an admin and sees nothing.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client';
import type { AdminIdentity, AdminRole } from '../lib/adminTypes';

export type AdminAuthStatus =
  | 'loading'
  | 'no-backend'
  | 'signed-out'
  | 'not-admin'
  | 'ready';

interface AdminAuthValue {
  status: AdminAuthStatus;
  identity: AdminIdentity | null;
  client: SupabaseClient | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue>({
  status: 'loading',
  identity: null,
  client: null,
  signIn: async () => ({ ok: false, error: 'not initialised' }),
  signOut: async () => {},
  refresh: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

async function resolveIdentity(client: SupabaseClient): Promise<AdminIdentity | null> {
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data, error } = await client
    .from('ys_admins')
    .select('user_id, role, disabled')
    .eq('user_id', user.id)
    .maybeSingle();
  // A missing table (migrations not run) surfaces as an error — treat as
  // "not an admin" rather than crashing; the login page explains the fix.
  if (error || !data || (data as { disabled: boolean }).disabled) return null;
  return {
    userId: user.id,
    email: user.email ?? null,
    role: (data as { role: AdminRole }).role,
  };
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AdminAuthStatus>('loading');
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [client, setClient] = useState<SupabaseClient | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setStatus('no-backend');
      setClient(null);
      setIdentity(null);
      return;
    }
    let c: SupabaseClient;
    try {
      c = getSupabaseClient();
    } catch {
      setStatus('no-backend');
      return;
    }
    setClient(c);
    setStatus('loading');
    try {
      const id = await resolveIdentity(c);
      if (id) {
        setIdentity(id);
        setStatus('ready');
      } else {
        const { data } = await c.auth.getSession();
        setIdentity(null);
        setStatus(data.session ? 'not-admin' : 'signed-out');
      }
    } catch {
      setIdentity(null);
      setStatus('signed-out');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured()) return { ok: false, error: 'Supabase is not configured.' };
      const c = getSupabaseClient();
      setClient(c);
      const { error } = await c.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      const id = await resolveIdentity(c);
      if (!id) {
        await c.auth.signOut();
        return {
          ok: false,
          error: 'This account is not an administrator. Ask a Super Admin to grant access.',
        };
      }
      setIdentity(id);
      setStatus('ready');
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      getSupabaseClient().auth.signOut();
    } catch {
      /* ignore */
    }
    setIdentity(null);
    setStatus('signed-out');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ status, identity, client, signIn, signOut, refresh }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
