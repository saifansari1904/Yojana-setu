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
async function resolveDisplayName(userId: string, fallbackEmail: string | null): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle();
    const raw = (data?.display_name as string | undefined)?.trim();
    if (raw) return sanitizeApplicantName(raw);
  } catch {
    /* fall through to metadata */
  }
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getUser();
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

    const name = await resolveDisplayName(data.user.id, data.user.email ?? null);
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

/** Current session user, or null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const displayName = await resolveDisplayName(user.id, user.email ?? null);
    return toSessionUser(user, displayName);
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
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      callback(null);
      return;
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      const user = session?.user;
      if (!user) {
        callback(null);
        return;
      }
      const displayName = await resolveDisplayName(user.id, user.email ?? null);
      callback(toSessionUser(user, displayName));
    }
  });
  return () => subscription.unsubscribe();
}
