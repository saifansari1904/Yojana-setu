/**
 * YOJANA SETU — AUTH SERVICE (SUPABASE BACKEND)
 * ------------------------------------------------------------------
 * DROP-IN REPLACEMENT for `src/lib/auth/authService.ts` in the repo.
 * Copy this file over that path — the login UI needs ZERO changes.
 *
 * IDENTICAL contract to the old seam file:
 *   SignUpInput / SignInInput / AuthErrorCode / AuthResult — unchanged shapes
 *   signUpWithCredentials / signInWithPassword / sendPasswordReset /
 *   signInWithGoogle / getRememberedIdentifier / setRememberedIdentifier
 *   — identical names and signatures.
 *
 * What changed vs the old local fallback:
 * - REAL authentication now: Supabase Auth (email/password + Google OAuth).
 *   The local name-based fallback is GONE from this file. Do not re-add it —
 *   keeping a fake local session alongside real auth would fork identity and
 *   corrupt per-user data isolation.
 * - Email/mobile identifier: Supabase signs in by email. When the citizen
 *   types a mobile number, we resolve it to the account email via the
 *   `get_email_for_mobile()` SQL helper (migration 002). Exact match only.
 * - Remember-me: semantics UNCHANGED — the login screen stores/clears the
 *   *identifier* via setRememberedIdentifier; the password is never stored.
 *   Supabase additionally persists the session itself until sign-out.
 * - Google: real OAuth redirect flow. On success the browser navigates to
 *   Google and back; the session is restored automatically and the app must
 *   handle the SIGNED_IN event (see onAuthStateChange below + README wiring
 *   for AuthContext). If the Google provider is not enabled in Supabase,
 *   we return 'notConnected' so the UI keeps showing its existing honest
 *   "backend pending" notice.
 *
 * IMPORTANT setup note: in Supabase Dashboard → Authentication → Providers →
 * Email, turn OFF "Confirm email" unless you also build a "check your inbox"
 * screen. With confirmation ON, sign-up succeeds but there is no session
 * until the user clicks the email link, and the app's immediate onLogin()
 * flow would set a logged-in UI with no session.
 */

import { getSupabaseClient } from './client';
// Resolves once this file is dropped into src/lib/auth/ (repo file stays).
import { sanitizeApplicantName } from '../profile/profileStorage';

/* ============================ CONTRACT ============================ */

export interface SignUpInput {
  name: string;
  email: string;
  mobile: string; // digits, may include +91 prefix
  password: string;
}

export interface SignInInput {
  identifier: string; // email or mobile
  password: string;
  rememberMe: boolean;
}

export type AuthErrorCode =
  | 'noAccount' // no account matches this email/mobile
  | 'invalidCredentials' // wrong email/mobile or password (also: email not confirmed)
  | 'emailInUse' // account already exists
  | 'notConnected' // Google provider not enabled in Supabase
  | 'network' // request failed (offline / DNS / timeout)
  | 'unknown';

export interface AuthResult {
  ok: boolean;
  /** Authenticated display name — passed to onLogin() on success. */
  name?: string;
  error?: AuthErrorCode;
}

/** Supplemental: signed-in user shape for AuthContext wiring. */
export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string;
}

/* ============================ HELPERS ============================= */

const REMEMBERED_IDENTIFIER_KEY = 'yojana_setu_remembered_identifier_v1';

/**
 * Normalise an Indian mobile number to a canonical lookup form so the
 * value stored at sign-up and the value typed at sign-in always match.
 *   "98765 43210"      -> "+919876543210"
 *   "+91-9876543210"   -> "+919876543210"
 */
export function normalizeMobile(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return hasPlus ? `+${digits}` : digits;
}

function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /network|fetch|failed to fetch|load failed|timeout|econnrefused|enotfound/i.test(msg);
}

function mapSignInError(message: string): AuthErrorCode {
  if (/invalid login credentials/i.test(message)) return 'invalidCredentials';
  // With "Confirm email" ON, Supabase rejects sign-in until confirmed.
  // (Setup guidance: turn confirmation OFF — see file header.)
  if (/email not confirmed/i.test(message)) return 'invalidCredentials';
  if (isNetworkError(message)) return 'network';
  return 'unknown';
}

function mapSignUpError(message: string): AuthErrorCode {
  if (/already registered|already exists|duplicate|user already/i.test(message)) return 'emailInUse';
  if (isNetworkError(message)) return 'network';
  return 'unknown';
}

/**
 * Resolve a login identifier to the account email.
 * Email identifiers pass through; mobile identifiers are resolved via the
 * exact-match `get_email_for_mobile()` RPC (migration 002). Returns null
 * when no account matches — the caller maps this to 'noAccount'.
 */
async function resolveLoginEmail(identifier: string): Promise<string | null> {
  if (identifier.includes('@')) return identifier.trim().toLowerCase();
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_email_for_mobile', {
      p_mobile: normalizeMobile(identifier),
    });
    if (error || !data) return null;
    return String(data).toLowerCase();
  } catch {
    return null;
  }
}

/** Display name: profiles row first, user_metadata fallback, never raw PII. */

/**
 * Synchronous display name from the session's user_metadata — NO network.
 * This is the name used on the critical authentication path: auth state
 * must NEVER wait for profile/database lookups. Google OAuth stores the
 * name as `full_name` (sometimes `name`); email/password sign-up stores it
 * as `display_name`. Falls back to the email prefix, never raw PII.
 */
export function getSyncDisplayName(
  user: { user_metadata?: Record<string, unknown> },
  fallbackEmail: string | null,
): string {
  const meta = (user.user_metadata as Record<string, unknown> | undefined) ?? {};
  const metaName = meta.display_name ?? meta.full_name ?? meta.name;
  if (typeof metaName === 'string' && metaName.trim()) {
    return sanitizeApplicantName(metaName);
  }
  return sanitizeApplicantName(fallbackEmail?.split('@')[0]);
}

/**
 * Maximum time to wait for one display-name lookup. The name is cosmetic —
 * it must NEVER block (or silently break) sign-in if the network stalls.
 * On timeout we fall through to the next source, ending at the metadata /
 * email fallback. The abandoned request is left to settle on its own; its
 * late rejection is swallowed to avoid unhandled-rejection noise.
 */
const DISPLAY_NAME_LOOKUP_TIMEOUT_MS = 8000;

/**
 * The signup trigger's placeholder default (migration 002). A profile row
 * carrying exactly this value means "no name was captured at signup" —
 * it must never overwrite a real auth-metadata name (e.g. Google's
 * full_name). Only a genuinely user-set profile name takes precedence
 * over metadata.
 */
const PLACEHOLDER_DISPLAY_NAME = 'citizen entrepreneur';

function withLookupTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guarded = promise.then(
    (value) => {
      if (timer !== undefined) clearTimeout(timer);
      return value;
    },
    (err) => {
      if (timer !== undefined) clearTimeout(timer);
      throw err;
    },
  );
  // If the timeout wins, the abandoned promise may still reject later —
  // swallow it so it never surfaces as an unhandled rejection.
  guarded.catch(() => {});
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('display-name lookup timed out')), ms);
  });
  return Promise.race([guarded, timeout]);
}

/**
 * Background profile enrichment: checks the profiles table for a nicer
 * display name (e.g. one the user set in-app). NEVER call this on the
 * critical authentication path — auth state is applied first from the
 * synchronous metadata name, and this only upgrades the cosmetic name
 * afterwards. Never rejects: falls back to the metadata/email name.
 */
export async function resolveDisplayName(userId: string, fallbackEmail: string | null): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const profileQuery = Promise.resolve(
      supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle(),
    );
    const { data } = await withLookupTimeout(profileQuery, DISPLAY_NAME_LOOKUP_TIMEOUT_MS);
    const raw = (data?.display_name as string | undefined)?.trim();
    // Skip the trigger's placeholder default: it is not a user-chosen name.
    if (raw && raw.toLowerCase() !== PLACEHOLDER_DISPLAY_NAME) {
      return sanitizeApplicantName(raw);
    }
  } catch {
    /* fall through to metadata */
  }
  try {
    const supabase = getSupabaseClient();
    const { data } = await withLookupTimeout(supabase.auth.getUser(), DISPLAY_NAME_LOOKUP_TIMEOUT_MS);
    // Google OAuth stores the name as `full_name` (sometimes `name`); the
    // email/password sign-up stores it as `display_name`. Check all three.
    const meta = (data.user?.user_metadata as Record<string, unknown> | undefined) ?? {};
    const metaName = meta.display_name ?? meta.full_name ?? meta.name;
    if (typeof metaName === 'string' && metaName.trim()) {
      return sanitizeApplicantName(metaName);
    }
  } catch {
    /* ignore */
  }
  return sanitizeApplicantName(fallbackEmail?.split('@')[0]);
}

function toSessionUser(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  displayName: string,
): SessionUser {
  return { id: user.id, email: user.email ?? null, displayName };
}

/* ============================ CONTRACT ============================ */

/**
 * Create account. Real Supabase sign-up; the profiles row is created by the
 * handle_new_user() DB trigger (migration 002) from the metadata below.
 */
export async function signUpWithCredentials(input: SignUpInput): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const displayName = sanitizeApplicantName(input.name);
    const email = input.email.trim().toLowerCase();
    const mobile = normalizeMobile(input.mobile);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: { display_name: displayName, mobile },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) return { ok: false, error: mapSignUpError(error.message) };
    if (!data.user) return { ok: false, error: 'unknown' };

    // Safety net: if the DB trigger hasn't created the profile row yet and we
    // already hold a session, create it directly (RLS permits own-row insert).
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await supabase.from('profiles').upsert(
          {
            user_id: data.user.id,
            email,
            display_name: displayName,
            mobile: mobile || null,
          },
          { onConflict: 'user_id' },
        );
      }
    } catch {
      /* trigger owns this; best effort only */
    }

    return { ok: true, name: displayName };
  } catch (err) {
    return { ok: false, error: isNetworkError(err) ? 'network' : 'unknown' };
  }
}

/**
 * Sign in with email/mobile + password. Mobile identifiers resolve to the
 * account email first; unknown identifiers yield 'noAccount' (same UI copy
 * the local fallback used: "no account found").
 */
export async function signInWithPassword(input: SignInInput): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const email = await resolveLoginEmail(input.identifier.trim());
    if (!email) return { ok: false, error: 'noAccount' };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (error || !data.user) {
      return { ok: false, error: mapSignInError(error?.message ?? '') };
    }

    // The session is already established; the name here is cosmetic and
    // must not block on network lookups.
    const name = getSyncDisplayName(data.user, data.user.email ?? null);
    return { ok: true, name };
  } catch (err) {
    return { ok: false, error: isNetworkError(err) ? 'network' : 'unknown' };
  }
}

/**
 * Request a password reset email. Supabase sends the real email; the
 * redirect lands back on /login where the app must handle the recovery
 * session (Supabase emits PASSWORD_RECOVERY; the new password form is a
 * small UI addition — see README).
 */
export async function sendPasswordReset(email: string): Promise<{ ok: boolean }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/**
 * Google sign-in (OAuth redirect flow). On success the browser navigates to
 * Google and back — code after this call does not run. On return, Supabase
 * restores the session from the URL and the app picks it up via
 * onAuthStateChange (wire in AuthContext — see README).
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) return { ok: false, error: 'notConnected' };
    // Redirect is now in flight; the { ok: true } return is for type
    // compatibility only — the page navigates away before it is used.
    return { ok: true };
  } catch (err) {
    return { ok: false, error: isNetworkError(err) ? 'network' : 'unknown' };
  }
}

/* ==================== REMEMBER-ME (UNCHANGED) ===================== */
/* The login screen owns these; only the identifier is ever persisted.    */

export function getRememberedIdentifier(): string {
  try {
    return localStorage.getItem(REMEMBERED_IDENTIFIER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setRememberedIdentifier(identifier: string): void {
  try {
    if (identifier) localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier);
    else localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/* ================= SUPPLEMENTAL (NEW — for wiring) ================= */
/* These did not exist in the seam file; AuthContext needs them.         */

export async function signOut(): Promise<void> {
  await getSupabaseClient().auth.signOut();
}

/** Current session user, or null when signed out. Never blocks on profile lookups. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    // Authentication state is applied IMMEDIATELY from the session's own
    // metadata. Profile/database enrichment happens separately, in the
    // background, and can never turn a valid session into a logout.
    return toSessionUser(user, getSyncDisplayName(user, user.email ?? null));
  } catch {
    return null;
  }
}

/**
 * Subscribe to auth changes. Returns an unsubscribe function.
 * Wire this in AuthContext: on SIGNED_IN (incl. post-Google-redirect),
 * call the app's onLogin(user.displayName); on SIGNED_OUT, clear it.
 */
export function onAuthStateChange(callback: (user: SessionUser | null) => void): () => void {
  const supabase = getSupabaseClient();
  // NOTE: the subscriber is intentionally SYNCHRONOUS. It must never await
  // profile/database work before notifying — authentication state is
  // applied immediately from the session, and enrichment runs afterwards
  // in the background (see AuthContext).
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      callback(null);
      return;
    }
    // Any other event that carries a session means the user is authenticated
    // (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED,
    // PASSWORD_RECOVERY, ...). Requiring an exact event name here silently
    // dropped real sessions.
    const user = session?.user;
    if (!user) return;
    callback(toSessionUser(user, getSyncDisplayName(user, user.email ?? null)));
  });
  return () => subscription.unsubscribe();
}

/* ============ OAUTH CALLBACK PARAMS (URL hygiene + diagnostics) ============ */

const OAUTH_CALLBACK_PARAMS = [
  'code', 'state', 'error', 'error_code', 'error_description',
  'access_token', 'refresh_token', 'expires_in', 'expires_at',
  'token_type', 'provider_token', 'provider_refresh_token',
];

/** True when the current URL carries an OAuth/OIDC callback (query or hash). */
export function hasOAuthCallbackParams(): boolean {
  try {
    const url = new URL(window.location.href);
    if (OAUTH_CALLBACK_PARAMS.some((p) => url.searchParams.has(p))) return true;
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    return OAUTH_CALLBACK_PARAMS.some((p) => hashParams.has(p));
  } catch {
    return false;
  }
}

/**
 * Remove OAuth callback params from the address bar (query + hash).
 * Returns true when anything was removed. Safe to call after the session
 * is established — the client has already consumed the params by then.
 * A stale ?code= / #access_token= left in the URL poisons later reloads
 * (the exchange is retried with a used code and fails), so the app must
 * not leave them behind.
 */
export function clearOAuthCallbackParams(): boolean {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const p of OAUTH_CALLBACK_PARAMS) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        changed = true;
      }
    }
    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      let hashChanged = false;
      for (const p of OAUTH_CALLBACK_PARAMS) {
        if (hashParams.has(p)) {
          hashParams.delete(p);
          hashChanged = true;
        }
      }
      if (hashChanged) {
        const rest = hashParams.toString();
        url.hash = rest ? `#${rest}` : '';
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
    return changed;
  } catch {
    return false;
  }
}

/**
 * The error (if any) from processing the OAuth callback URL during client
 * initialization — e.g. a rejected code exchange. Null when the callback
 * processed cleanly or there was no callback. Surfaces the real reason
 * instead of failing silently as "logged out".
 */
export async function getAuthCallbackError(): Promise<string | null> {
  try {
    const { error } = await getSupabaseClient().auth.initialize();
    return error?.message ?? null;
  } catch {
    return null;
  }
}
