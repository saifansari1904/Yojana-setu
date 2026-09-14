import React, { useState, useMemo, useEffect } from 'react';
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
import {
  createTrackedApplication,
  loadTrackedApplications,
  patchTrackedApplication,
  removeTrackedApplication,
  saveTrackedApplications,
  upsertTrackedApplication,
} from './lib/tracker/applicationTracker';
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
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [applicantName, setApplicantName] = useState<string>('');
  const [isMatching, setIsMatching] = useState<boolean>(false);

  // User profile starts as null (no pre-selected default profile)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modal / Slide-over state for "Why this match?"
  const [whyMatchTarget, setWhyMatchTarget] = useState<MatchResult | null>(null);

  // Target match for "Why Not Eligible" dedicated view
  const [whyNotEligibleTarget, setWhyNotEligibleTarget] = useState<MatchResult | null>(null);

  // Selected scheme match for Scheme Detail Screen
  const [selectedSchemeMatch, setSelectedSchemeMatch] = useState<MatchResult | null>(null);

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

  // Smoothly scroll to the top of the portal when transitioning between screens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen]);

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
    setApplicantName('');
    navigateTo('login');
  };

  const handleFormSubmit = (newProfile: UserProfile) => {
    const needProfile = newProfile.businessNeedProfile || deriveBusinessNeedProfile(newProfile);
    const businessProfile = newProfile.businessProfile || deriveBusinessProfile(newProfile);
    setUserProfile({
      ...newProfile,
      applicantName: applicantName || newProfile.applicantName || (lang === 'hi' ? 'नागरिक उद्यमी' : 'Citizen Entrepreneur'),
      businessNeedProfile: needProfile,
      businessProfile: businessProfile,
    });
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
        onNavigate={(screen) => navigateTo(screen)}
        userProfile={userProfile}
        applicantName={applicantName}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        trackedCount={trackedApplications.length}
      />

      {/* Main View Area with Direction & Transition-Aware Pages */}
      <main className="relative z-10 flex-1 pb-12">
        <ErrorBoundary>
          <LayoutGroup id="yojana-setu-screens">
          <AnimatePresence mode="wait">
            {currentScreen === 'login' && (
              <AnimatedPage key="login">
                <LoginScreen
                  onLogin={handleLogin}
                  onSkipToForm={() => {
                    setIsAuthenticated(true);
                    navigateTo('form');
                  }}
                />
              </AnimatedPage>
            )}

            {currentScreen === 'form' && (
              <AnimatedPage key="form">
                <EligibilityFormScreen
                  initialProfile={userProfile}
                  onSubmit={handleFormSubmit}
                />
              </AnimatedPage>
            )}

            {currentScreen === 'results' && (
              <AnimatedPage key="results">
                <ResultsListScreen
                  matchResults={matchResults}
                  userProfile={userProfile}
                  onOpenWhyMatch={handleOpenWhyMatch}
                  onOpenWhyNotEligible={handleOpenWhyNotEligible}
                  onEditProfile={() => navigateTo('form')}
                  onSelectScheme={handleSelectScheme}
                  savedSchemeIds={savedSchemeIds}
                  onToggleSaveScheme={handleToggleSaveScheme}
                />
              </AnimatedPage>
            )}

            {currentScreen === 'alternatives' && (
              <AnimatedPage key="alternatives">
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
              <AnimatedPage key="scheme-detail">
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
                />
              </AnimatedPage>
            )}

            {currentScreen === 'tracker' && (
              <AnimatedPage key="tracker">
                <ApplicationTrackerScreen
                  applications={trackedApplications}
                  matchResults={matchResults}
                  onUpdateStatus={handleUpdateApplicationStatus}
                  onUpdateNote={handleUpdateApplicationNote}
                  onUpdateAppliedOn={handleUpdateApplicationAppliedOn}
                  onRemove={handleRemoveTrackedApplication}
                  onSelectScheme={handleSelectScheme}
                  onBackToResults={() => navigateTo('results')}
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
