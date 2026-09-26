/**
 * YOJANA SETU — AUTH STATE MACHINE (pure, UI-free)
 * ------------------------------------------------------------------
 * The single authoritative authentication contract. Routing, the header,
 * and the login screen branch on these values and nothing else — never on
 * `user`, `loading`, localStorage, or a component-local boolean.
 *
 * Kept free of React/DOM imports so the contract is unit-testable with the
 * repo's tsx script convention. AuthContext is a thin driver over this.
 */

/**
 * - `loading`:         session restore in flight — render neutral auth
 *                      loading; nothing may render as authenticated and the
 *                      login screen must not be mounted.
 * - `authenticated`:   a real Supabase session is active — the login screen
 *                      must never be mounted.
 * - `unauthenticated`: no session — the login screen may be shown when the
 *                      user explicitly navigates there.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Cloud-profile restore lifecycle for fresh devices (no usable local
 * profile). While `pending`, the authenticated UI must not assume the
 * profile is blank — post-login navigation waits for `done`.
 */
export type ProfileRestoreState = 'idle' | 'pending' | 'done';

/** Minimal shape the status derivation needs — no Supabase types here. */
export interface AuthUserLike {
  isLocal: boolean;
}

/**
 * Derive the single authoritative auth status. `loading` dominates: while
 * the session restore is in flight the app is neither authenticated nor
 * unauthenticated. A local/guest user is never `authenticated`.
 */
export function resolveAuthStatus(loading: boolean, user: AuthUserLike | null): AuthStatus {
  if (loading) return 'loading';
  if (user && !user.isLocal) return 'authenticated';
  return 'unauthenticated';
}

/**
 * Login-screen mount contract — the ONLY gate for rendering the Sign-in
 * screen. It is mounted solely when the authoritative state is
 * `unauthenticated` AND the user explicitly navigated to it. In particular:
 * never during `loading`, never after a session is applied.
 */
export function canShowLoginScreen(authStatus: AuthStatus, currentScreen: string): boolean {
  return authStatus === 'unauthenticated' && currentScreen === 'login';
}

/** True while a fresh-device cloud profile restore is running. */
export function isProfileRestorePending(state: ProfileRestoreState): boolean {
  return state === 'pending';
}

// ── Post-auth navigation decision ──────────────────────────────────────
// Decides whether an auth-state change should move the user off the entry
// screens ('welcome' | 'login'). Pure: fully testable without React.
//
// Contract:
//  1. While a fresh-device profile restore is pending, NEVER navigate and
//     NEVER consume the uid — the destination depends on the restored
//     profile, so the caller must see this uid again once restore settles.
//  2. The uid is consumed (marked seen) even when not navigating, so a
//     stored session is never mistaken for a new sign-in on a later pass.
//  3. Only a NEW uid navigates — duplicates are ignored.
//  4. Only the entry screens navigate — deep links never get hijacked.
//  5. Only EXPLICIT user intent navigates: an in-page sign-in during this
//     page lifetime, or an OAuth redirect return (URL params). A session
//     restored from storage — even one that arrives late, after the boot
//     already resolved as unauthenticated — stays on the entry screen.
//     (Rule 5 is the fix for the spurious reload auto-navigation: the old
//     timing heuristic treated any session arriving after setLoading(false)
//     as a fresh sign-in, firing a mid-boot screen transition whose exit
//     animation could freeze the app on the faded welcome screen.)
export type PostAuthDestination = 'results' | 'form';

export interface PostAuthNavDecision {
  /** 'results' | 'form' when navigation should happen, null otherwise. */
  destination: PostAuthDestination | null;
  /** True when the caller should record this uid as seen (prevUid). */
  consumed: boolean;
}

export function decidePostAuthNavigation(args: {
  uid: string | null;
  prevUid: string | null;
  currentScreen: string;
  profileRestore: ProfileRestoreState;
  inPageSignIn: boolean;
  oauthReturn: boolean;
  hasProfile: boolean;
}): PostAuthNavDecision {
  const { uid, prevUid, currentScreen, profileRestore, inPageSignIn, oauthReturn, hasProfile } = args;
  // Rule 1: restore pending — wait, and don't consume the uid.
  if (isProfileRestorePending(profileRestore)) return { destination: null, consumed: false };
  // Rules 3–4: no uid, duplicate uid, or not on an entry screen — seen, no nav.
  if (!uid || uid === prevUid) return { destination: null, consumed: true };
  if (currentScreen !== 'welcome' && currentScreen !== 'login') {
    return { destination: null, consumed: true };
  }
  // Authenticated on the login route: the login UI is gated off when
  // authenticated (canShowLoginScreen is false), so staying here strands the
  // user on a blank screen. Navigate regardless of the intent flags — they
  // can be lost across a slow auth round-trip or a browser takeover, and the
  // blank-screen outcome is strictly worse than navigating. (The welcome
  // route below keeps the strict intent check: a restored session on reload
  // must not auto-navigate off welcome.)
  if (currentScreen === 'login') {
    return { destination: hasProfile ? 'results' : 'form', consumed: true };
  }
  // Rule 5: explicit intent only — a restored session stays put on welcome.
  if (!inPageSignIn && !oauthReturn) return { destination: null, consumed: true };
  return { destination: hasProfile ? 'results' : 'form', consumed: true };
}

/**
 * Arbitration for concurrent auth-state writers: Supabase listener events
 * vs the boot-time session restore.
 *
 * The observed failure mode: the listener applies a valid session, then the
 * boot restore — whose async read started earlier — resolves `null` and
 * clears the authenticated state. The protocol: every state-committing
 * apply bumps the generation first; the boot restore captures the
 * generation before its read and commits only if nothing was applied while
 * the read was in flight (the newer writer always wins).
 *
 * Duplicate deliveries (INITIAL_SESSION echoing the boot restore, token
 * refresh) are no-ops so migration/restore/enrichment never run twice for
 * one session. Sign-out (`null`) is never a duplicate — it always commits.
 */
export class AuthSessionArbiter {
  private generation = 0;
  private lastAppliedUid: string | null | undefined = undefined;

  /** Call at the start of every state-committing apply. */
  beginApply(): number {
    this.generation += 1;
    return this.generation;
  }

  /** Capture the generation before an async boot read (does not bump). */
  captureForBootRead(): number {
    return this.generation;
  }

  /** True when no apply happened during the boot read — safe to commit. */
  isBootReadFresh(captured: number): boolean {
    return this.generation === captured;
  }

  /**
   * True when this uid was already committed. `null` (signed out) is never
   * a duplicate.
   */
  isDuplicateDelivery(uid: string | null): boolean {
    if (uid === null) return false;
    return this.lastAppliedUid === uid;
  }

  /** Record the uid committed by an apply. */
  recordApplied(uid: string | null): void {
    this.lastAppliedUid = uid;
  }
}
