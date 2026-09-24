/**
 * YOJANA SETU — SUPABASE CLIENT (SINGLETON)
 * ------------------------------------------------------------------
 * Drop-in: copy this file to `src/lib/supabase/client.ts` in the repo.
 *
 * Reads the project URL and anon key from Vite env vars:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * Only the ANON (publishable) key is ever used here. The service_role key
 * must NEVER be placed in frontend env vars — it bypasses Row Level
 * Security. See README.md ("Security notes").
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  // Minimal Vite env typing so this file typechecks outside a Vite project.
  interface ImportMeta {
    env: Record<string, string | undefined>;
  }
}

let client: SupabaseClient | null = null;

/** True when both env vars are present. Useful for gating backend calls. */
export function isSupabaseConfigured(): boolean {
  try {
    return Boolean(
      import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY,
    );
  } catch {
    return false;
  }
}

/**
 * Returns the shared Supabase client, creating it on first use.
 * Throws a descriptive error when env vars are missing so misconfiguration
 * fails loudly at the call site instead of as an obscure network error.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env?.VITE_SUPABASE_URL;
  const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
        'Add them to your .env (local) and to Vercel Project Settings → Environment Variables (production).',
    );
  }

  client = createClient(url, anonKey);
  return client;
}

/** Test-only escape hatch: drop the cached instance. */
export function resetSupabaseClient(): void {
  client = null;
}
