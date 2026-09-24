/**
 * YOJANA SETU — AUTH SERVICE (BACKEND SEAM)
 * ------------------------------------------------------------------
 * This is the single place where the login page talks to authentication.
 *
 * The real implementation now lives in `../supabase/authService.ts`
 * (Supabase Auth: email/password + Google OAuth). This file re-exports it
 * so the existing import path — and the contract the login UI speaks —
 * stays exactly the same. See that file for the full documentation.
 */
export * from '../supabase/authService';
