import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig } from 'motion/react';
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
import { loadStoredProfile, saveStoredProfile, clearStoredProfile, subscribeProfileStorage } from './lib/profile/profileStorage';
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
  const { lang } = useTranslation();
  const { signOutUser } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('yojana_setu_splash_seen');
  });
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>(() => {
    if (typeof window === 'undefined') return 'welcome';
    const stored = loadStoredProfile();
    return stored ? 'dashboard' : 'welcome';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!loadStoredProfile();
  });
  const [applicantName, setApplicantName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return loadStoredProfile()?.applicantName || '';
  });
  const [isMatching, setIsMatching] = useState<boolean>(false);

  // User profile loaded from authoritative persistent storage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => loadStoredProfile());

  // Contextual account prompt: shown when a guest attempts a persistence action.
  const [accountPromptVisible, setAccountPromptVisible] = useState(false);

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
  // begins) or already has a profile. The form chunk is prefetched on login, so
  // the data chunk is typically already cached by the time it is requested here.
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [schemesLoaded, setSchemesLoaded] = useState(false);
  useEffect(() => {
    if (schemesLoaded) return;
    if (currentScreen === 'form' || currentScreen === 'results' || userProfile) {
      let cancelled = false;
      import('./lib/data/schemeRepository').then((m) => {
        if (!cancelled) {
          setAllSchemes(m.getAllRepositorySchemes());
          setSchemesLoaded(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [currentScreen, userProfile, schemesLoaded]);

  // Tier 1 (expensive part skipped): scoring only, no upfront O(n²) alternatives.
  // Alternatives are computed on-demand when the user opens a detail/alternatives
  // view (WhyNotEligibleView, SchemeDetailScreen). ~50ms instead of ~3.7s.
  const coreResults = useMemo(() => {
    if (!userProfile || !schemesLoaded) return [];
    return rankSchemesForProfile(allSchemes, userProfile, 'en', { skipAlternatives: true });
  }, [userProfile, allSchemes, schemesLoaded]);

  // Tier 2: on language change, regenerate only the text fields (~50ms).
  // No alternatives merge needed — views compute them on-demand.
  const matchResults = useMemo(() => {
    if (!userProfile || !schemesLoaded) return [];
    if (lang === 'en') return coreResults;
    return rankSchemesForProfile(allSchemes, userProfile, lang, { skipAlternatives: true });
  }, [userProfile, lang, allSchemes, schemesLoaded, coreResults]);

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

  // Synchronize profile state across multi-tab sessions and local storage events
  useEffect(() => {
    const unsubscribe = subscribeProfileStorage((updated) => {
      setUserProfile(updated);
      setIsAuthenticated(!!updated);
      setApplicantName(updated?.applicantName || '');
    });
    return unsubscribe;
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
   * If the user is authenticated, returns true and the caller proceeds.
   * Otherwise shows the contextual account prompt and returns false.
   * The blocked action is never run silently — the user retries it
   * manually after creating an account.
   */
  const requestPersistentAction = (): boolean => {
    if (isAuthenticated) {
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

  const handleLogin = (name?: string) => {
    if (name) {
      setApplicantName(name);
    }
    // Explicit account creation/sign-in: persist any working profile
    // built during the guest assessment so results carry over.
    if (userProfile) {
      saveStoredProfile(userProfile);
    }
    setIsAuthenticated(true);
    // If there's a pending persistent action from the account prompt,
    // navigate back to where the user was; they can retry the action.
    navigateTo(userProfile ? 'results' : 'form');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn('[Auth] Error signing out:', err);
    }
    setIsAuthenticated(false);
    setUserProfile(null);
    clearStoredProfile();
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
    setIsMatching(true);
  };

  const handleMatchingComplete = () => {
    setIsMatching(false);
    navigateTo('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * User chose "Create Account" from the contextual prompt.
   * Persists the current working profile (if any), marks authenticated,
   * and routes to the account page to confirm. The pending action is NOT
   * run silently — the user retries it after signing in.
   */
  const handleCreateAccountFromPrompt = () => {
    if (userProfile) {
      saveStoredProfile(userProfile);
    }
    setIsAuthenticated(true);
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
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          trackedCount={trackedApplications.length}
          savedCount={savedSchemeIds.size}
          matchResults={matchResults}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Main View Area with Direction & Transition-Aware Pages */}
      <main className="relative z-10 flex-1 pb-12">
        <ErrorBoundary>
          <LayoutGroup id="yojana-setu-screens">
          <AnimatePresence mode="wait">
            {currentScreen === 'welcome' && (
              <AnimatedPage key="welcome" direction={navDirection}>
                <WelcomeScreen
                  onFindSchemes={() => navigateTo('form')}
                  onSignIn={() => navigateTo('login')}
                />
              </AnimatedPage>
            )}

            {currentScreen === 'login' && (
              <AnimatedPage key="login" direction={navDirection}>
                <LoginScreen
                  onLogin={handleLogin}
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
