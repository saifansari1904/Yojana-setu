/**
 * YOJANA SETU — AUTH SERVICE (BACKEND SEAM)
 * ------------------------------------------------------------------
 * This is the single place where the login page talks to authentication.
 *
 * TODAY: there is no backend yet, so every function below runs a LOCAL
 * fallback that preserves the app's existing name-based local account
 * (the same behavior LoginScreen had before the credential UI was added).
 *
 * WHEN YOU WRITE THE BACKEND: replace the body of each function with a
 * real API call (fetch to your /auth/* endpoints). The function signatures
 * and the AuthResult shape are the contract — the login UI already speaks
 * it, so no UI changes will be needed.
 *
 *   signUpWithCredentials -> POST /auth/signup   { name, email, mobile, password }
 *   signInWithPassword    -> POST /auth/login    { identifier, password }
 *   sendPasswordReset     -> POST /auth/reset    { email }
 *   signInWithGoogle      -> your OAuth flow, then POST /auth/google { idToken }
 */

import { loadStoredProfile, sanitizeApplicantName } from '../profile/profileStorage';

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
  | 'noAccount' // no local profile exists yet (local fallback only)
  | 'invalidCredentials' // backend: wrong email/mobile or password
  | 'emailInUse' // backend: account already exists
  | 'notConnected' // backend: provider not wired up yet
  | 'network' // backend: request failed
  | 'unknown';

export interface AuthResult {
  ok: boolean;
  /** Authenticated display name — passed to onLogin() on success. */
  name?: string;
  error?: AuthErrorCode;
}

const REMEMBERED_IDENTIFIER_KEY = 'yojana_setu_remembered_identifier_v1';

/** Tiny artificial delay so loading states are perceptible during local fallback. */
const localDelay = (ms = 450) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * BACKEND SEAM — create account.
 * TODO(backend): POST /auth/signup and return the created user's display name.
 * Local fallback: resolves immediately with the sanitized name, and the
 * caller creates the same local account sign-in always did.
 */
export async function signUpWithCredentials(input: SignUpInput): Promise<AuthResult> {
  await localDelay();
  // TODO(backend): replace with fetch('/auth/signup', { method: 'POST', body: JSON.stringify(input) })
  const name = sanitizeApplicantName(input.name);
  return { ok: true, name };
}

/**
 * BACKEND SEAM — sign in with email/mobile + password.
 * TODO(backend): POST /auth/login and return the user's display name.
 * Local fallback: if a local profile was previously created on this device,
 * sign in as that profile's name (password is not checked locally — there
 * is no credential store yet). Otherwise report 'noAccount' so the UI can
 * point the user at account creation.
 */
export async function signInWithPassword(input: SignInInput): Promise<AuthResult> {
  await localDelay();
  // TODO(backend): replace with fetch('/auth/login', { method: 'POST', body: JSON.stringify(input) })
  const stored = loadStoredProfile();
  const storedName = stored?.applicantName?.trim();
  if (storedName) {
    return { ok: true, name: storedName };
  }
  return { ok: false, error: 'noAccount' };
}

/**
 * BACKEND SEAM — request a password reset link.
 * TODO(backend): POST /auth/reset { email }.
 * Local fallback: always "succeeds" so the UI flow can be exercised.
 */
export async function sendPasswordReset(email: string): Promise<{ ok: boolean }> {
  await localDelay(350);
  // TODO(backend): replace with fetch('/auth/reset', { method: 'POST', body: JSON.stringify({ email }) })
  return { ok: Boolean(email) };
}

/**
 * BACKEND SEAM — Google sign-in.
 * TODO(backend): run the OAuth flow, POST the ID token to /auth/google.
 * Local fallback: reports 'notConnected' — the UI shows a notice that
 * Google sign-in activates once the backend is connected.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  await localDelay(350);
  // TODO(backend): replace with your Google OAuth + /auth/google exchange
  return { ok: false, error: 'notConnected' };
}

/** Remember-me helpers — persist only the identifier, never the password. */
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
