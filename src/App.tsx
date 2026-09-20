import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig } from 'motion/react';
import { ActiveScreen, ApplicationStatus, MatchResult, TrackedApplication, UserProfile } from './types';
import { getAllSchemes } from './lib/data';
import { rankSchemesForProfile } from './utils/matchingEngine';
import { deriveBusinessNeedProfile, deriveBusinessProfile } from './lib/business';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { EligibilityFormScreen } from './components/EligibilityFormScreen';
import { ResultsListScreen } from './components/ResultsListScreen';
import { WhyMatchModal } from './components/WhyMatchModal';
import { WhyNotEligibleView } from './components/WhyNotEligibleView';
import { SchemeDetailScreen } from './components/SchemeDetailScreen';
import { ApplicationTrackerScreen } from './components/ApplicationTrackerScreen';
import { CommandCenterScreen } from './features/commandCenter/CommandCenterScreen';
import { ApplicationWorkspaceScreen } from './components/application';
import { EntrepreneurProfileScreen } from './components/profile/EntrepreneurProfileScreen';
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
import { AnimatedPage } from './animations/AnimatedPage';
import { AmbientBackground } from './animations/AmbientBackground';
import { SplashScreen } from './animations/SplashScreen';
import { MatchingTransition } from './animations/MatchingTransition';
import { ScrollProgressBar } from './animations/ScrollProgressBar';
import { startScreenTransition } from './animations/viewTransition';

function YojanaSetuMain() {
  const { lang } = useTranslation();
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('yojana_setu_splash_seen');
  });
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>(() => {
    if (typeof window === 'undefined') return 'login';
    const stored = loadStoredProfile();
    return stored ? 'dashboard' : 'login';
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

  // Compute matched schemes reactively with active language
  const matchResults = useMemo(() => {
    if (!userProfile) return [];
    const schemes = getAllSchemes();
    return rankSchemesForProfile(schemes, userProfile, lang);
  }, [userProfile, lang]);

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
    login: 0,
    dashboard: 1,
    form: 2,
    results: 3,
    alternatives: 4,
    'scheme-detail': 5,
    tracker: 6,
    workspace: 7,
    profile: 8,
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
    setIsAuthenticated(true);
    navigateTo('form');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    clearStoredProfile();
    setApplicantName('');
    navigateTo('login');
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
    saveStoredProfile(fullProfile);
    setUserProfile(fullProfile);
    setIsAuthenticated(true);
    setIsMatching(true);
  };

  const handleMatchingComplete = () => {
    setIsMatching(false);
    navigateTo('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWhyMatch = (match: MatchResult) => {
    setWhyMatchTarget(match);
  };

  const handleOpenWhyNotEligible = (match: MatchResult) => {
    setWhyNotEligibleTarget(match);
    navigateTo('alternatives');
  };

  const handleSelectScheme = (match: MatchResult) => {
    setSelectedSchemeMatch(match);
    setCurrentScreen('scheme-detail');
  };

  const handleOpenWorkspace = (match: MatchResult) => {
    setWorkspaceTarget(match);
    navigateTo('workspace');
  };

  const handleToggleSaveScheme = (schemeId: string) => {
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
    commitTrackedApplications((current) =>
      patchTrackedApplication(current, schemeId, { note }),
    );
  };

  const handleUpdateApplicationAppliedOn = (schemeId: string, appliedOn: string) => {
    commitTrackedApplications((current) =>
      patchTrackedApplication(current, schemeId, { appliedOn }),
    );
  };

  const handleRemoveTrackedApplication = (schemeId: string) => {
    commitTrackedApplications((current) => removeTrackedApplication(current, schemeId));
  };

  /* ================= PHASE 4.3 — APPLICATION JOURNEY ================= */

  /** Turns the Phase 4.2 pathway into a tracked application journey. */
  const handleStartPathwayApplication = (match: MatchResult, pathway: unknown) => {
    commitTrackedApplications((current) =>
      startApplicationFromPathway(current, match, pathway as SupportPathwayModel),
    );
  };

  /** Records preparation progress against the journey (never changes status silently). */
  const handleDocumentProgress = (schemeId: string, preparedDocIds: string[]) => {
    const total =
      matchResults.find((m) => m.scheme.id === schemeId)?.scheme.requiredDocuments?.length || 0;
    if (total === 0) return;
    commitTrackedApplications((current) =>
      recordDocumentProgressEvent(current, schemeId, preparedDocIds.length, total),
    );
  };

  const handleSetFollowUp = (schemeId: string, dueOn: string | null) => {
    commitTrackedApplications((current) =>
      setFollowUpReminder(current, schemeId, dueOn ? { dueOn } : null),
    );
  };

  const handleCompleteFollowUp = (schemeId: string) => {
    commitTrackedApplications((current) => completeFollowUpReminder(current, schemeId));
  };

  const handleHeaderNavigate = (screen: ActiveScreen, targetSectionId?: string) => {
    setTargetProfileSection(targetSectionId || null);
    navigateTo(screen);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAFAF9] dark:bg-[#0E1311] text-[#1A1C1B] dark:text-[#F0F4F2] font-sans antialiased selection:bg-[#D4EFE1] dark:selection:bg-[#1A382D] selection:text-[#14453D] dark:selection:text-[#4ADE80] transition-colors duration-200 overflow-x-hidden">
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
            totalSchemesCount={getAllSchemes().length}
          />
        )}
      </AnimatePresence>

      {/* App Navigation Header */}
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

      {/* Main View Area with Direction & Transition-Aware Pages */}
      <main className="relative z-10 flex-1 pb-12">
        <ErrorBoundary>
          <LayoutGroup id="yojana-setu-screens">
          <AnimatePresence mode="wait">
            {currentScreen === 'login' && (
              <AnimatedPage key="login" direction={navDirection}>
                <LoginScreen
                  onLogin={handleLogin}
                  onSkipToForm={() => {
                    setIsAuthenticated(true);
                    navigateTo('form');
                  }}
                />
              </AnimatedPage>
            )}

            {currentScreen === 'dashboard' && (
              <AnimatedPage key="dashboard" direction={navDirection}>
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
              </AnimatedPage>
            )}

            {currentScreen === 'form' && (
              <AnimatedPage key="form" direction={navDirection}>
                <EligibilityFormScreen
                  initialProfile={userProfile}
                  onSubmit={handleFormSubmit}
                />
              </AnimatedPage>
            )}

            {currentScreen === 'results' && (
              <AnimatedPage key="results" direction={navDirection}>
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
              </AnimatedPage>
            )}

            {currentScreen === 'alternatives' && (
              <AnimatedPage key="alternatives" direction={navDirection}>
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
              </AnimatedPage>
            )}

            {currentScreen === 'scheme-detail' && currentSelectedSchemeMatch && (
              <AnimatedPage key="scheme-detail" direction={navDirection}>
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
              </AnimatedPage>
            )}

            {currentScreen === 'tracker' && (
              <AnimatedPage key="tracker" direction={navDirection}>
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
              </AnimatedPage>
            )}

            {currentScreen === 'workspace' && currentWorkspaceTarget && userProfile && (
              <AnimatedPage key="workspace" direction={navDirection}>
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
              </AnimatedPage>
            )}

            {currentScreen === 'profile' && (
              <AnimatedPage key="profile" direction={navDirection}>
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
              </AnimatedPage>
            )}
          </AnimatePresence>
          </LayoutGroup>
        </ErrorBoundary>
      </main>

      {/* Slide-over / Modal for "Why This Match?" 5-Factor Audit */}
      {currentWhyMatchTarget && (
        <WhyMatchModal
          matchResult={currentWhyMatchTarget}
          onClose={() => setWhyMatchTarget(null)}
          onOpenWhyNotEligible={handleOpenWhyNotEligible}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {/* Honour the OS "reduce motion" setting globally, in one place */}
        <MotionConfig reducedMotion="user">
          <YojanaSetuMain />
        </MotionConfig>
      </LanguageProvider>
    </ThemeProvider>
  );
}
