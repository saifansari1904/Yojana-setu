import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { ActiveScreen, ApplicationStatus, MatchResult, TrackedApplication, UserProfile } from './types';
import type { Scheme } from './types/scheme';
// Scheme data (1.5MB candidate dataset) loads asynchronously — never in the initial bundle.
// See the schemesLoaded effect below.
import { rankSchemesForProfile } from './utils/matchingEngine';
import { deriveBusinessNeedProfile, deriveBusinessProfile } from './lib/business';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AccountPromptModal } from './components/AccountPromptModal';
// Code-split screens: only the login shell ships in the initial bundle.
// Every other screen loads on demand when the user navigates to it.
const EligibilityFormScreen = lazy(() =>
  import('./components/EligibilityFormScreen').then((m) => ({ default: m.EligibilityFormScreen })),
);
const ResultsListScreen = lazy(() =>
  import('./components/ResultsListScreen').then((m) => ({ default: m.ResultsListScreen })),
);
const WhyMatchModal = lazy(() =>
  import('./components/WhyMatchModal').then((m) => ({ default: m.WhyMatchModal })),
);
const WhyNotEligibleView = lazy(() =>
  import('./components/WhyNotEligibleView').then((m) => ({ default: m.WhyNotEligibleView })),
);
const SchemeDetailScreen = lazy(() =>
  import('./components/SchemeDetailScreen').then((m) => ({ default: m.SchemeDetailScreen })),
);
const ApplicationTrackerScreen = lazy(() =>
  import('./components/ApplicationTrackerScreen').then((m) => ({ default: m.ApplicationTrackerScreen })),
);
const CommandCenterScreen = lazy(() =>
  import('./features/commandCenter/CommandCenterScreen').then((m) => ({ default: m.CommandCenterScreen })),
);
const ApplicationWorkspaceScreen = lazy(() =>
  import('./components/application').then((m) => ({ default: m.ApplicationWorkspaceScreen })),
);
const EntrepreneurProfileScreen = lazy(() =>
  import('./components/profile/EntrepreneurProfileScreen').then((m) => ({ default: m.EntrepreneurProfileScreen })),
);
import { SetuLoader } from './animations/SetuLoader';
import { loadStoredProfile, saveStoredProfile, subscribeProfileStorage } from './lib/profile/profileStorage';
import {
  completeFollowUpReminder,
  createTrackedApplication,
  loadTrackedApplications,
  patchTrackedApplication,
  removeTrackedApplication,
  saveTrackedApplications,
  setFollowUpReminder,
  upsertTrackedApplication,
} from './lib/tracker/applicationTracker';
import {
  recordDocumentProgressEvent,
  startApplicationFromPathway,
  statusChangeEvent,
  appendJourneyEvent,
} from './lib/tracker/applicationJourney';
import type { SupportPathway as SupportPathwayModel } from './types/supportPathway';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LanguageProvider, useTranslation } from './i18n';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase/client';
import { hasOAuthCallbackParams } from './lib/supabase';
import { syncSavedSchemeToggle, hasUsableLocalProfile } from './lib/supabase/sync';
import { canShowLoginScreen, decidePostAuthNavigation } from './lib/auth/authState';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { AnimatedPage } from './animations/AnimatedPage';
import { AmbientBackground } from './animations/AmbientBackground';
import { SplashScreen } from './animations/SplashScreen';
import { MatchingTransition } from './animations/MatchingTransition';
import { ScrollProgressBar } from './animations/ScrollProgressBar';
import { startScreenTransition } from './animations/viewTransition';

/** Minimal branded fallback while a code-split screen chunk loads. */
function ScreenFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <SetuLoader size="lg" />
    </div>
  );
}

function YojanaSetuMain() {
  const { lang, t } = useTranslation();
  const { signOutUser, user: authUser, authStatus, profileRestore, authError, clearAuthError, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('yojana_setu_splash_seen');
  });
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>(() => 'welcome');
  /**
   * SINGLE SOURCE OF TRUTH for cloud authentication: the authoritative
   * AuthContext status. There is no independent boolean — a local/guest
   * profile must never masquerade as an authenticated session, and a valid
   * session must never render a logged-out header. While auth is loading,
   * nothing may render as authenticated.
   */
  const isCloudAuthenticated = authStatus === 'authenticated';
  /**
   * Login-screen mount contract: the Sign-in screen exists ONLY when the
   * authoritative state is unauthenticated AND the user explicitly navigated
   * there. It is never mounted during auth loading, and it unmounts in the
   * same commit that a session is applied — no header/login overlap, no
   * effect-delayed navigation window, no independent local truth.
   */
  const canShowLogin = canShowLoginScreen(authStatus, currentScreen);
  const [applicantName, setApplicantName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return loadStoredProfile()?.applicantName || '';
  });
  const [isMatching, setIsMatching] = useState<boolean>(false);

  // User profile loaded from authoritative persistent storage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => loadStoredProfile());

  // Keep userProfile in sync when the cloud restore (or another tab) writes
  // to localStorage and dispatches the profile sync event. This replaces the
  // old window.location.reload() after restore — React state updates
  // naturally, and the post-auth navigation effect re-evaluates with the
  // fresh profile.
  useEffect(() => {
    return subscribeProfileStorage((profile) => {
      setUserProfile(profile);
    });
  }, []);

  /**
   * PROFILE_LOADING: a fresh-device sign-in whose cloud profile restore is
   * still running. The authenticated UI must not assume the profile is blank
   * (which would flash the onboarding form and lose in-progress input when
   * the restore's reload lands). A neutral loader covers the wait; the
   * navigation effect fires once the restore settles.
   */
  const showProfileLoading =
    authStatus === 'authenticated' &&
    profileRestore === 'pending' &&
    !hasUsableLocalProfile(userProfile);

  // Contextual account prompt: shown when a guest attempts a persistence action.
  const [accountPromptVisible, setAccountPromptVisible] = useState(false);

  // Password recovery: shown when the Supabase reset link returns to the app.
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Modal / Slide-over state for "Why this match?"
  const [whyMatchTarget, setWhyMatchTarget] = useState<MatchResult | null>(null);

  // Target match for "Why Not Eligible" dedicated view
  const [whyNotEligibleTarget, setWhyNotEligibleTarget] = useState<MatchResult | null>(null);

  // Selected scheme match for Scheme Detail Screen
  const [selectedSchemeMatch, setSelectedSchemeMatch] = useState<MatchResult | null>(null);

  // Target match for Phase 5 Application Preparation Workspace
  const [workspaceTarget, setWorkspaceTarget] = useState<MatchResult | null>(null);

  // Target profile section for direct deep linking from Account Menu
  const [targetProfileSection, setTargetProfileSection] = useState<string | null>(null);

  // Saved scheme IDs (persisted in localStorage)
  const [savedSchemeIds, setSavedSchemeIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem('yojana_setu_saved_schemes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Tracked applications (persisted in localStorage)
  const [trackedApplications, setTrackedApplications] = useState<TrackedApplication[]>(
    () => loadTrackedApplications(),
  );

  /** Single write path so state and localStorage never drift apart. */
  const commitTrackedApplications = (
    updater: (current: TrackedApplication[]) => TrackedApplication[],
  ) => {
    setTrackedApplications((prev) => {
      const next = updater(prev);
      saveTrackedApplications(next);
      return next;
    });
  };

  // Scheme dataset loads asynchronously so the 1.5MB candidate data never blocks
  // the initial bundle. Triggered when the user reaches the form (where matching
  // begins) or already has a profile. The post-auth prefetch below warms the
  // data chunk during the auth round-trip, so it is usually cached by the
  // time it is requested here.
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [schemesLoaded, setSchemesLoaded] = useState(false);
  // Root-mounted flag: the catalog subscription below is app-lifetime, so it
  // must never call setState after unmount (StrictMode-safe).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  // App-lifetime catalog subscription (installed once the data chunk loads):
  // the module notifies only on real digest changes, so state re-syncs at
  // most once per meaningful cloud swap — including swaps that finish while
  // the user navigates between screens (no missed updates, no refresh loop).
  const catalogSubRef = useRef<(() => void) | null>(null);
  const refreshStartedRef = useRef(false);
  useEffect(() => {
    if (schemesLoaded) return;
    if (currentScreen === 'form' || currentScreen === 'results' || userProfile) {
      let cancelled = false;
      const datasetStart = performance.now();
      import('./lib/data/schemeRepository').then((m) => {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log(`[Catalog] dataset chunk loaded in ${Math.round(performance.now() - datasetStart)}ms`);
        }
        setAllSchemes(m.getAllRepositorySchemes());
        setSchemesLoaded(true);
        if (!catalogSubRef.current) {
          catalogSubRef.current = m.subscribeCatalogChanges(
            () => setAllSchemes(m.getAllRepositorySchemes()),
            () => !mountedRef.current,
          );
        }
        // Background: pull the live curated catalog from Supabase (bundled
        // data stays as the offline fallback). Concurrent calls share one
        // in-flight request; failures keep the current catalog. Swap arrival
        // comes via the subscription above, so navigation can't miss it.
        if (!refreshStartedRef.current) {
          refreshStartedRef.current = true;
          m.refreshCuratedSchemesFromCloud();
        }
      });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [currentScreen, userProfile, schemesLoaded]);

  /**
   * Post-auth chunk prefetch (Bug B — real request-flow fix, not spinner
   * hiding): the moment the user reaches the Sign-in screen — or completes
   * authentication — the results screen chunk, the form chunk, and the
   * 1.3MB scheme dataset chunk start downloading in parallel with the auth
   * round-trip / user reading, instead of serially after navigation. The
   * same module paths are used as the real imports, so this only warms the
   * browser cache — zero duplicate bytes. Idle-scheduled; failures ignored.
   */
  useEffect(() => {
    if (currentScreen !== 'login' && authStatus !== 'authenticated') return;
    let cancelled = false;
    const prefetch = () => {
      if (cancelled) return;
      void import('./components/ResultsListScreen').catch(() => {});
      void import('./components/EligibilityFormScreen').catch(() => {});
      void import('./lib/data/schemeRepository').catch(() => {});
    };
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const timer = setTimeout(prefetch, 60);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentScreen, authStatus]);

  // Tier 1 (expensive part skipped): scoring only, no upfront O(n²) alternatives.
  // Alternatives are computed on-demand when the user opens a detail/alternatives
  // view (WhyNotEligibleView, SchemeDetailScreen). ~50ms instead of ~3.7s.
  const coreResults = useMemo(() => {
    if (!userProfile || !schemesLoaded) return [];
    const matchStart = performance.now();
    const ranked = rankSchemesForProfile(allSchemes, userProfile, 'en', { skipAlternatives: true });
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Matching] ranked ${ranked.length} schemes in ${Math.round(performance.now() - matchStart)}ms`);
    }
    return ranked;
  }, [userProfile, allSchemes, schemesLoaded]);

  // Tier 2: on language change, regenerate only the text fields (~50ms).
  // No alternatives merge needed — views compute them on-demand.
  const matchResults = useMemo(() => {
    if (!userProfile || !schemesLoaded) return [];
    if (lang === 'en') return coreResults;
    return rankSchemesForProfile(allSchemes, userProfile, lang, { skipAlternatives: true });
  }, [userProfile, lang, allSchemes, schemesLoaded, coreResults]);

  // [RENDER] pipeline timing: navigation to the results screen → first
  // non-empty match list painted. Dev-only; measures the real user-visible
  // delay without touching the spinner or the matching engine.
  const resultsNavStartRef = useRef<number | null>(null);
  const resultsReadyLoggedRef = useRef(false);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (currentScreen === 'results') {
      if (resultsNavStartRef.current === null) {
        resultsNavStartRef.current = performance.now();
        resultsReadyLoggedRef.current = false;
      }
      if (!resultsReadyLoggedRef.current && matchResults.length > 0) {
        resultsReadyLoggedRef.current = true;
        // eslint-disable-next-line no-console
        console.log(`[Render] results ready ${Math.round(performance.now() - (resultsNavStartRef.current ?? performance.now()))}ms after navigation`);
      }
    } else {
      resultsNavStartRef.current = null;
    }
  }, [currentScreen, matchResults.length]);

  // Keep modal/alternatives/detail targets in sync when language toggles
  const currentWhyMatchTarget = useMemo(() => {
    if (!whyMatchTarget) return null;
    return matchResults.find((m) => m.scheme.id === whyMatchTarget.scheme.id) || whyMatchTarget;
  }, [matchResults, whyMatchTarget]);

  const currentWhyNotEligibleTarget = useMemo(() => {
    if (!whyNotEligibleTarget) return null;
    return (
      matchResults.find((m) => m.scheme.id === whyNotEligibleTarget.scheme.id) ||
      whyNotEligibleTarget
    );
  }, [matchResults, whyNotEligibleTarget]);

  const currentSelectedSchemeMatch = useMemo(() => {
    if (!selectedSchemeMatch) return null;
    return (
      matchResults.find((m) => m.scheme.id === selectedSchemeMatch.scheme.id) ||
      selectedSchemeMatch
    );
  }, [matchResults, selectedSchemeMatch]);

  const currentWorkspaceTarget = useMemo(() => {
    if (!workspaceTarget) return null;
    return (
      matchResults.find((m) => m.scheme.id === workspaceTarget.scheme.id) ||
      workspaceTarget
    );
  }, [matchResults, workspaceTarget]);

  // Prefetch the form chunk while the user is on the login screen —
  // it is the certain next step, so navigation feels instant.
  useEffect(() => {
    if (currentScreen === 'login') {
      import('./components/EligibilityFormScreen');
    }
  }, [currentScreen]);

  // Smoothly scroll to the top of the portal when transitioning between screens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen]);

  // Direction-aware page transitions: derive forward/back from screen order so
  // AnimatedPage can slide in the natural direction. Shared-layout morph
  // transitions (results <-> scheme-detail) stay neutral (0) so the morph
  // owns the motion. Tracks via effect so every navigation path — navigateTo
  // and direct setCurrentScreen calls alike — is covered.
  const SCREEN_ORDER: Record<ActiveScreen, number> = {
    welcome: 0,
    login: 1,
    dashboard: 2,
    form: 3,
    results: 4,
    alternatives: 5,
    'scheme-detail': 6,
    tracker: 7,
    workspace: 8,
    profile: 9,
  };
  const prevScreenRef = useRef<ActiveScreen>(currentScreen);
  const [navDirection, setNavDirection] = useState<number>(0);
  useEffect(() => {
    const prev = prevScreenRef.current;
    if (prev !== currentScreen) {
      const usesSharedLayout =
        currentScreen === 'scheme-detail' || prev === 'scheme-detail';
      const direction = usesSharedLayout
        ? 0
        : Math.sign((SCREEN_ORDER[currentScreen] ?? 0) - (SCREEN_ORDER[prev] ?? 0));
      setNavDirection(direction);
      prevScreenRef.current = currentScreen;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  // Synchronize profile state across multi-tab sessions and local storage events.
  // NOTE: this syncs profile DATA only. Authentication state is derived from
  // AuthContext (isCloudAuthenticated) — a profile event must never flip the
  // header between logged-in and logged-out on its own.
  useEffect(() => {
    const unsubscribe = subscribeProfileStorage((updated) => {
      setUserProfile(updated);
      setApplicantName(updated?.applicantName || '');
    });
    return unsubscribe;
  }, []);

  /**
   * Password-recovery flow: Supabase sends a real reset email now, linking
   * back to /login. When the link returns, the client emits PASSWORD_RECOVERY
   * and we show the set-new-password screen instead of the normal UI.
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      if (!isSupabaseConfigured()) return;
      const { data } = getSupabaseClient().auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setShowResetPassword(true);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // Backend not configured — the recovery screen never appears.
    }
    return () => unsubscribe?.();
  }, []);

  /**
   * Screen navigation. Screens that rely on Framer shared-layout morphing
   * (results <-> scheme-detail) update directly; everything else goes through
   * the native View Transitions layer so the two systems never overlap.
   */
  const navigateTo = (screen: ActiveScreen) => {
    const usesSharedLayout = screen === 'scheme-detail' || currentScreen === 'scheme-detail';
    if (usesSharedLayout) {
      setCurrentScreen(screen);
      return;
    }
    startScreenTransition(() => setCurrentScreen(screen));
  };

  /**
   * Guards persistence actions behind account creation.
   * Cloud-authenticated users always pass. Guests with a persisted local
   * profile keep the access they had before (legacy behavior preserved).
   * A guest assessment kept only in memory does NOT pass — same as before.
   * Otherwise shows the contextual account prompt and returns false.
   * The blocked action is never run silently — the user retries it
   * manually after creating an account.
   */
  const requestPersistentAction = (): boolean => {
    if (isCloudAuthenticated || loadStoredProfile()) {
      return true;
    }
    setAccountPromptVisible(true);
    return false;
  };

  // Handlers
  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem('yojana_setu_splash_seen', 'true');
    } catch {
      // Ignore sessionStorage issues
    }
    setShowSplash(false);
  };

  /**
   * Login-screen sign-in callback (email/password, sign-up). Authentication
   * itself is established by Supabase/AuthContext — this only carries over a
   * guest assessment built before sign-in and records the display name.
   * Post-sign-in navigation reacts to the authoritative AuthContext state
   * in the effect below — except for one case it cannot see: an explicit
   * sign-in while a session for the same user is already active. The effect
   * skips navigation when the uid is unchanged, which left users stuck on
   * the login screen with zero feedback. That case navigates from here.
   */
  // True when this page load began with OAuth callback params in the URL.
  // Captured on first render: AuthContext consumes (clears) them during
  // session restore, so they must be read before any effect runs.
  const oauthReturnRef = useRef<boolean>(false);
  if (!oauthReturnRef.current && typeof window !== 'undefined') {
    try {
      oauthReturnRef.current = hasOAuthCallbackParams();
    } catch {
      // Non-fatal: without it an OAuth return is treated like a refresh.
    }
  }

  // Explicit sign-in intent for this page lifetime. Set synchronously by
  // the login screen BEFORE the auth round-trip starts (and therefore
  // before any auth state can land). A session restored from storage —
  // even a late-arriving one that lands after the boot already resolved
  // as unauthenticated — must never trigger auto-navigation; only an
  // explicit sign-in (or the OAuth return above) moves the user off the
  // entry screens. Consumed (cleared) once it has navigated.
  const inPageSignInRef = useRef<boolean>(false);

  /**
   * Post-sign-in navigation — NAVIGATION ONLY, never authentication.
   * Reacts to the single source of truth (AuthContext): when a cloud
   * session appears from an EXPLICIT sign-in — in-page login, or an OAuth
   * redirect return — move from the entry screens to results/form.
   * A plain page refresh that restores an existing session intentionally
   * leaves the user on the welcome page.
   *
   * While a fresh-device profile restore is pending, navigation WAITS: the
   * destination (results vs onboarding form) depends on the restored
   * profile, and navigating on the still-empty local state would flash the
   * wrong screen. The PROFILE_LOADING gate below covers the wait visually.
   */
  const prevCloudUidRef = useRef<string | null>(null);
  useEffect(() => {
    const uid = authUser && !authUser.isLocal ? authUser.uid : null;
    const decision = decidePostAuthNavigation({
      uid,
      prevUid: prevCloudUidRef.current,
      currentScreen,
      profileRestore,
      inPageSignIn: inPageSignInRef.current,
      oauthReturn: oauthReturnRef.current,
      hasProfile: !!userProfile,
    });
    // While a fresh-device profile restore is pending the uid is NOT
    // consumed: the destination (results vs onboarding form) depends on the
    // restored profile, and this effect must re-fire once the restore
    // settles. (Consuming the uid here would strand an authenticated user on
    // the login route when the restore finishes with no cloud profile.)
    if (decision.consumed) prevCloudUidRef.current = uid;
    if (!decision.destination || !authUser) return;
    // TEMPORARY instrumentation (auth cleanup): log every post-auth
    // navigation so the single-authority flow can be verified. Remove once
    // the login → results/form flow is confirmed in production.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Navigation] ${currentScreen} → ${decision.destination} (uid=${uid})`);
    }
    // Consume the explicit sign-in intent once it has navigated.
    inPageSignInRef.current = false;
    setApplicantName(authUser.displayName);
    navigateTo(decision.destination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authLoading, currentScreen, userProfile, profileRestore]);

  /**
   * AUTH INVARIANT (dev-only diagnostic): an authenticated user must never
   * be stranded on the login route — the login UI is gated off when
   * authenticated (canShowLoginScreen is false), so this state would render
   * blank. The single post-auth navigation effect above is the only
   * production navigation authority; this diagnostic only reports the
   * violation, it never navigates.
   */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (authStatus === 'authenticated' && currentScreen === 'login' && profileRestore !== 'pending') {
      // eslint-disable-next-line no-console
      console.error('[AuthInvariant] authenticated user stranded on login route');
    }
  }, [authStatus, currentScreen, profileRestore]);

  /**
   * Password recovery completed: the new password is set and the recovery
   * session is valid. Reload so AuthContext picks up the session through
   * its normal restore path (it ignores the PASSWORD_RECOVERY event itself).
   */
  const handleResetPasswordDone = () => {
    setShowResetPassword(false);
    window.location.reload();
  };

  const handleLogout = async () => {    try {
      await signOutUser();
    } catch (err) {
      console.warn('[Auth] Error signing out:', err);
    }
    // Auth state and the authenticated device cache are cleared by
    // signOutUser (Supabase SIGNED_OUT -> AuthContext). Here we only reset
    // the app-level React state ("active memory"). The cloud profile is
    // never deleted.
    setUserProfile(null);
    setApplicantName('');
    navigateTo('welcome');
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    saveStoredProfile(updatedProfile);
    setUserProfile(updatedProfile);
  };

  const handleFormSubmit = (newProfile: UserProfile) => {
    const needProfile = newProfile?.businessNeedProfile || deriveBusinessNeedProfile(newProfile);
    const businessProfile = newProfile?.businessProfile || deriveBusinessProfile(newProfile);
    const defaultCitizenName: Record<string, string> = {
      en: 'Citizen Entrepreneur',
      hi: 'नागरिक उद्यमी',
      ta: 'குடிமகன் தொழில்முனைவோர்',
      te: 'పౌర పారిశ్రామికవేత్త',
      kn: 'ನಾಗರಿಕ ಉದ್ಯಮಿ',
      ml: 'പൗര സംരംഭകൻ',
    };
    const fullProfile: UserProfile = {
      ...newProfile,
      applicantName: applicantName || newProfile.applicantName || (defaultCitizenName[lang] || 'Citizen Entrepreneur'),
      businessNeedProfile: needProfile,
      businessProfile: businessProfile,
    };
    // Guest-first flow: keep the profile in memory only. It is persisted
    // via saveStoredProfile() only when the user explicitly creates an
    // account (see handleLogin / handleCreateAccountFromPrompt).
    setUserProfile(fullProfile);
    // Authenticated users already have a durable home for the entrepreneur
    // profile (Supabase public.user_profiles, mirrored by saveStoredProfile).
    // Persist immediately so logout -> login restores the complete profile
    // instead of forcing re-entry. Guests stay memory-only by design: their
    // working profile is persisted on explicit account creation.
    if (isCloudAuthenticated) {
      saveStoredProfile(fullProfile);
    }
    setIsMatching(true);
  };

  const handleMatchingComplete = () => {
    setIsMatching(false);
    navigateTo('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * User chose "Create Account" from the contextual prompt.
   * Persists the current working profile (if any) and routes to the login
   * screen to confirm. The pending action is NOT run silently — the user
   * retries it after signing in.
   */
  const handleCreateAccountFromPrompt = () => {
    if (userProfile) {
      saveStoredProfile(userProfile);
    }
    setAccountPromptVisible(false);
    navigateTo('login');
  };

  /** User chose to continue without an account. Dismiss and keep guest state. */
  const handleDismissAccountPrompt = () => {
    setAccountPromptVisible(false);
  };

  const handleOpenWhyMatch = (match: MatchResult) => {
    setWhyMatchTarget(match);
  };

  const handleOpenWhyNotEligible = (match: MatchResult) => {
    setWhyNotEligibleTarget(match);
    navigateTo('alternatives');
  };

  const handleSelectScheme = (match: MatchResult) => {
    // Viewing full scheme details is gated like the persistent product
    // areas (dashboard/tracker) — guests get the account prompt first.
    if (!requestPersistentAction()) return;
    setSelectedSchemeMatch(match);
    setCurrentScreen('scheme-detail');
  };

  const handleOpenWorkspace = (match: MatchResult) => {
    if (!requestPersistentAction()) return;
    setWorkspaceTarget(match);
    navigateTo('workspace');
  };

  const handleToggleSaveScheme = (schemeId: string) => {
    // Saving is a persistence action — prompt guests to create an account.
    if (!requestPersistentAction()) {
      return;
    }

    const wasSaved = savedSchemeIds.has(schemeId);

    setSavedSchemeIds((prev) => {
      const next = new Set(prev);
      if (next.has(schemeId)) {
        next.delete(schemeId);
      } else {
        next.add(schemeId);
      }
      try {
        localStorage.setItem('yojana_setu_saved_schemes', JSON.stringify(Array.from(next)));
      } catch {
        // Ignore storage failure
      }
      return next;
    });

    // Mirror the toggle to the cloud backend when a Supabase session is
    // active. Fire-and-forget: never blocks the UI, never throws.
    syncSavedSchemeToggle(schemeId, !wasSaved);

    // Keep the tracker in step with saves, as a separate state write.
    if (wasSaved) {
      // Only drop the entry if no real progress has been recorded yet.
      commitTrackedApplications((current) => {
        const existing = current.find((a) => a.schemeId === schemeId);
        if (!existing || existing.status !== 'interested' || existing.note) {
          return current;
        }
        return removeTrackedApplication(current, schemeId);
      });
      return;
    }

    const schemeName =
      matchResults.find((m) => m.scheme.id === schemeId)?.scheme.name || schemeId;
    commitTrackedApplications((current) =>
      current.some((a) => a.schemeId === schemeId)
        ? current
        : upsertTrackedApplication(current, createTrackedApplication(schemeId, schemeName)),
    );
  };

  const handleUpdateApplicationStatus = (schemeId: string, status: ApplicationStatus) => {
    if (!requestPersistentAction()) return;
    commitTrackedApplications((current) =>
      patchTrackedApplication(current, schemeId, {
        status,
        // Phase 4.3 — every status change is recorded on the journey timeline.
        journey: appendJourneyEvent(
          current.find((a) => a.schemeId === schemeId) || {
            schemeId,
            schemeName: schemeId,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          statusChangeEvent(status),
        ).journey,
        // Stamp the submission date on first entry into "applied".
        appliedOn:
          status === 'applied'
            ? current.find((a) => a.schemeId === schemeId)?.appliedOn ||
              new Date().toISOString().slice(0, 10)
            : current.find((a) => a.schemeId === schemeId)?.appliedOn,
      }),
    );
  };

  const handleUpdateApplicationNote = (schemeId: string, note: string) => {
    if (!requestPersistentAction()) return;
    commitTrackedApplications((current) =>
      patchTrackedApplication(current, schemeId, { note }),
    );
  };

  const handleUpdateApplicationAppliedOn = (schemeId: string, appliedOn: string) => {
    if (!requestPersistentAction()) return;
    commitTrackedApplications((current) =>
      patchTrackedApplication(current, schemeId, { appliedOn }),
    );
  };

  const handleRemoveTrackedApplication = (schemeId: string) => {
    if (!requestPersistentAction()) return;
    commitTrackedApplications((current) => removeTrackedApplication(current, schemeId));
  };

  /* ================= PHASE 4.3 — APPLICATION JOURNEY ================= */

  /** Turns the Phase 4.2 pathway into a tracked application journey. */
  const handleStartPathwayApplication = (match: MatchResult, pathway: unknown) => {
    if (!requestPersistentAction()) return;
    commitTrackedApplications((current) =>
      startApplicationFromPathway(current, match, pathway as SupportPathwayModel),
    );
  };

  /** Records preparation progress against the journey (never changes status silently). */
  const handleDocumentProgress = (schemeId: string, preparedDocIds: string[]) => {
    if (!requestPersistentAction()) return;
    const total =
      matchResults.find((m) => m.scheme.id === schemeId)?.scheme.requiredDocuments?.length || 0;
    if (total === 0) return;
    commitTrackedApplications((current) =>
      recordDocumentProgressEvent(current, schemeId, preparedDocIds.length, total),
    );
  };

  const handleSetFollowUp = (schemeId: string, dueOn: string | null) => {
    if (!requestPersistentAction()) return;
    commitTrackedApplications((current) =>
      setFollowUpReminder(current, schemeId, dueOn ? { dueOn } : null),
    );
  };

  const handleCompleteFollowUp = (schemeId: string) => {
    if (!requestPersistentAction()) return;
    commitTrackedApplications((current) => completeFollowUpReminder(current, schemeId));
  };

  const handleHeaderNavigate = (screen: ActiveScreen, targetSectionId?: string) => {
    // Persistent product areas require an account; public screens are open.
    const persistentScreens: ActiveScreen[] = ['dashboard', 'tracker', 'profile', 'workspace'];
    if (persistentScreens.includes(screen) && !requestPersistentAction()) {
      return;
    }
    setTargetProfileSection(targetSectionId || null);
    navigateTo(screen);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAFAF9] dark:bg-transparent text-[#1A1C1B] dark:text-[var(--text-main)] font-sans antialiased selection:bg-[#D9E8DF] dark:selection:bg-[#1A382D] selection:text-[#14453D] dark:selection:text-[var(--accent-green)] transition-colors duration-200 overflow-x-hidden">
      {/* Ambient background subtle lighting gradient */}
      <AmbientBackground />

      {/* Scroll-linked reading progress for long scheme pages */}
      <ScrollProgressBar />

      {/* Splash Screen on initial app arrival */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} minDuration={1400} />
        )}
      </AnimatePresence>

      {/* Deterministic Scheme Matching Transition Sequence */}
      <AnimatePresence>
        {isMatching && (
          <MatchingTransition
            onComplete={handleMatchingComplete}
            totalSchemesCount={allSchemes.length}
          />
        )}
      </AnimatePresence>

      {/* App Navigation Header — hidden on the public welcome screen,
          which carries its own header */}
      {currentScreen !== 'welcome' && (
        <Header
          currentScreen={currentScreen}
          onNavigate={handleHeaderNavigate}
          userProfile={userProfile}
          applicantName={applicantName}
          isAuthenticated={isCloudAuthenticated}
          onLogout={handleLogout}
          trackedCount={trackedApplications.length}
          savedCount={savedSchemeIds.size}
          matchResults={matchResults}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* OAuth callback failure — visible on EVERY screen, not just login.
          After a Google redirect the app boots to welcome/dashboard, so a
          login-screen-only banner would never be seen. This surfaces the
          real reason instead of a silent "logged out". */}
      {authError && (
        <div role="alert" className="relative z-40 mx-auto flex w-full max-w-3xl items-start gap-2.5 px-4 pt-3">
          <div className="flex flex-1 items-start gap-2.5 rounded-[var(--yj-radius-md)] border border-[#C0392B]/25 dark:border-[#E57373]/25 bg-[#FDF3F2] dark:bg-[#E57373]/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-[#7B241C] dark:text-[#F5B7B1]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p>{t('login.oauthFailed')}</p>
              {authError !== 'oauthUnknown' && (
                <p className="mt-1 text-[12px] opacity-80 break-words">{authError}</p>
              )}
            </div>
            <button type="button" onClick={clearAuthError} aria-label={t('login.dismiss')} className="shrink-0 rounded p-1 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area with Direction & Transition-Aware Pages */}
      <main className="relative z-10 flex-1 pb-12">
        <ErrorBoundary>
          <LayoutGroup id="yojana-setu-screens">
          {/* PROFILE_LOADING (fresh-device restore): neutral loader instead of
              any authenticated screen until the cloud profile settles. */}
          {showProfileLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading your profile">
              <SetuLoader size="lg" />
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {currentScreen === 'welcome' && (
              <AnimatedPage key="welcome" direction={navDirection}>
                <WelcomeScreen
                  onFindSchemes={() => navigateTo('form')}
                  onSignIn={() => {
                    // Authenticated users must never be sent to the login
                    // form (it is gated off when authenticated, leaving a
                    // blank screen). Route them to the app instead.
                    if (isCloudAuthenticated) {
                      navigateTo(userProfile ? 'results' : 'form');
                    } else {
                      navigateTo('login');
                    }
                  }}
                />
              </AnimatedPage>
            )}

            {canShowLogin && (
              <AnimatedPage key="login" direction={navDirection}>
                <LoginScreen
                  onSignInInitiated={() => {
                    // Explicit user intent: an in-page sign-in round-trip
                    // started during this page lifetime. The post-auth
                    // navigation effect reads this (never timing) to decide
                    // whether the arriving session should move the user off
                    // the entry screens.
                    inPageSignInRef.current = true;
                  }}
                  onSkipToForm={() => {
                    navigateTo('form');
                  }}
                />
              </AnimatedPage>
            )}

            {currentScreen === 'dashboard' && (
              <AnimatedPage key="dashboard" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <CommandCenterScreen
                  userProfile={userProfile}
                  matchResults={matchResults}
                  applications={trackedApplications}
                  savedSchemeIds={savedSchemeIds}
                  onStartCheck={() => navigateTo('form')}
                  onOpenResults={() => navigateTo('results')}
                  onOpenTracker={() => navigateTo('tracker')}
                  onOpenProfile={() => navigateTo('profile')}
                  onSelectScheme={handleSelectScheme}
                  onToggleSave={handleToggleSaveScheme}
                />
                </Suspense>
              </AnimatedPage>
            )}

            {currentScreen === 'form' && (
              <AnimatedPage key="form" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <EligibilityFormScreen
                  initialProfile={userProfile}
                  onSubmit={handleFormSubmit}
                />
                </Suspense>
              </AnimatedPage>
            )}

            {currentScreen === 'results' && (
              <AnimatedPage key="results" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <ResultsListScreen
                  matchResults={matchResults}
                  userProfile={userProfile}
                  onOpenWhyMatch={handleOpenWhyMatch}
                  onOpenWhyNotEligible={handleOpenWhyNotEligible}
                  onEditProfile={() => navigateTo('profile')}
                  onSelectScheme={handleSelectScheme}
                  savedSchemeIds={savedSchemeIds}
                  onToggleSaveScheme={handleToggleSaveScheme}
                  onStartPathwayApplication={handleStartPathwayApplication}
                  applications={trackedApplications}
                  onOpenTracker={() => navigateTo('tracker')}
                  onOpenWorkspace={handleOpenWorkspace}
                />
                </Suspense>
              </AnimatedPage>
            )}

            {currentScreen === 'alternatives' && (
              <AnimatedPage key="alternatives" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <WhyNotEligibleView
                  targetMatch={
                    currentWhyNotEligibleTarget ||
                    matchResults.find((m) => m.matchPercentage < 75) ||
                    matchResults[0]
                  }
                  allMatches={matchResults}
                  userProfile={userProfile}
                  onBackToResults={() => navigateTo('results')}
                  onSelectAlternative={(alt) => {
                    handleSelectScheme(alt);
                  }}
                />
                </Suspense>
              </AnimatedPage>
            )}

            {currentScreen === 'scheme-detail' && currentSelectedSchemeMatch && (
              <AnimatedPage key="scheme-detail" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <SchemeDetailScreen
                  matchResult={currentSelectedSchemeMatch}
                  allMatches={matchResults}
                  userProfile={userProfile}
                  onBackToResults={() => setCurrentScreen('results')}
                  onSelectScheme={handleSelectScheme}
                  onOpenWhyMatch={handleOpenWhyMatch}
                  onOpenWhyNotEligible={handleOpenWhyNotEligible}
                  savedSchemeIds={savedSchemeIds}
                  onToggleSaveScheme={handleToggleSaveScheme}
                  onDocumentProgress={handleDocumentProgress}
                  onOpenWorkspace={handleOpenWorkspace}
                />
                </Suspense>
              </AnimatedPage>
            )}

            {currentScreen === 'tracker' && (
              <AnimatedPage key="tracker" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <ApplicationTrackerScreen
                  applications={trackedApplications}
                  matchResults={matchResults}
                  onUpdateStatus={handleUpdateApplicationStatus}
                  onUpdateNote={handleUpdateApplicationNote}
                  onUpdateAppliedOn={handleUpdateApplicationAppliedOn}
                  onRemove={handleRemoveTrackedApplication}
                  onSetFollowUp={handleSetFollowUp}
                  onCompleteFollowUp={handleCompleteFollowUp}
                  onSelectScheme={handleSelectScheme}
                  onBackToResults={() => navigateTo('results')}
                  onOpenWorkspace={handleOpenWorkspace}
                />
                </Suspense>
              </AnimatedPage>
            )}

            {currentScreen === 'workspace' && currentWorkspaceTarget && userProfile && (
              <AnimatedPage key="workspace" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <ApplicationWorkspaceScreen
                  matchResult={currentWorkspaceTarget}
                  userProfile={userProfile}
                  applications={trackedApplications}
                  savedSchemeIds={savedSchemeIds}
                  onToggleSaveScheme={handleToggleSaveScheme}
                  onBack={() => navigateTo('results')}
                  onOpenTracker={() => navigateTo('tracker')}
                  onUpdateApplications={(updated) => {
                    commitTrackedApplications(() => updated);
                  }}
                />
                </Suspense>
              </AnimatedPage>
            )}

            {currentScreen === 'profile' && (
              <AnimatedPage key="profile" direction={navDirection}>
                <Suspense fallback={<ScreenFallback />}>
                <EntrepreneurProfileScreen
                  userProfile={userProfile}
                  matchResults={matchResults}
                  onUpdateProfile={handleUpdateProfile}
                  onRetakeAssessment={() => navigateTo('form')}
                  onViewMatches={() => navigateTo('results')}
                  onViewDashboard={() => navigateTo('dashboard')}
                  onViewTracker={() => navigateTo('tracker')}
                  targetSectionId={targetProfileSection}
                  onSelectScheme={(scheme) => {
                    const match = matchResults.find((m) => m.scheme.id === scheme.id) || {
                      scheme,
                      matchScore: 85,
                      matchPercentage: 85,
                      isEligible: true,
                      reasons: [],
                      disqualifyingFactors: [],
                      breakdown: { categoryScore: 20, stateScore: 20, businessTypeScore: 20, investmentScore: 20, ageScore: 5 },
                      potentialSubsidyAmount: 250000,
                      calculatedSubsidyText: '25% - 35% Capital Subsidy',
                      priorityRank: 1,
                    };
                    handleSelectScheme(match as MatchResult);
                  }}
                />
                </Suspense>
              </AnimatedPage>
            )}
          </AnimatePresence>
          )}
          </LayoutGroup>
        </ErrorBoundary>
      </main>

      {/* Slide-over / Modal for "Why This Match?" 5-Factor Audit */}
      {currentWhyMatchTarget && (
        <Suspense fallback={null}>
          <WhyMatchModal
            matchResult={currentWhyMatchTarget}
            onClose={() => setWhyMatchTarget(null)}
            onOpenWhyNotEligible={handleOpenWhyNotEligible}
          />
        </Suspense>
      )}

      {/* Contextual account prompt for guest persistence actions */}
      <AnimatePresence>
        {accountPromptVisible && (
          <AccountPromptModal
            onCreateAccount={handleCreateAccountFromPrompt}
            onContinueWithoutAccount={handleDismissAccountPrompt}
          />
        )}
      </AnimatePresence>

      {/* Password-recovery overlay: set a new password after the reset link
          returns. Rendered above everything; the page reloads on success. */}
      {showResetPassword && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#FAFAF9] dark:bg-[#0E1311]">
          <ResetPasswordScreen onDone={handleResetPasswordDone} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          {/* Honour the OS "reduce motion" setting globally, in one place */}
          <MotionConfig reducedMotion="user">
            <YojanaSetuMain />
          </MotionConfig>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
