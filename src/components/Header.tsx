import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { ActiveScreen, MatchResult, UserProfile } from '../types';
import {
  ClipboardList,
  LayoutDashboard,
  FileCheck2,
  Sparkles,
  User,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Check,
} from 'lucide-react';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { AccountMenu } from './account/AccountMenu';

interface HeaderProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen, targetSectionId?: string) => void;
  userProfile: UserProfile | null;
  applicantName?: string;
  isAuthenticated: boolean;
  onLogout: () => void;
  /** Number of tracked applications, shown as a badge on the tracker tab. */
  trackedCount?: number;
  /** Number of saved schemes for the mini-stats */
  savedCount?: number;
  /** Computed match results for live next-action and recommendations */
  matchResults?: MatchResult[];
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  applicantName,
  isAuthenticated,
  onLogout,
  trackedCount = 0,
  savedCount = 0,
  matchResults = [],
  onUpdateProfile,
}) => {
  const { lang, setLang, t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langDropdownOpen]);

  const currentLangOption = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const isFormActive = currentScreen === 'form';
  const isResultsActive =
    currentScreen === 'results' || currentScreen === 'alternatives' || currentScreen === 'scheme-detail' || currentScreen === 'workspace';
  const isTrackerActive = currentScreen === 'tracker';
  const isDashboardActive = currentScreen === 'dashboard';
  const trackerLabel = t('tracker.title');
  const trackerShortLabel = t('tracker.navShort');

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#FAFAF9]/95 dark:bg-[#141b17]/95 backdrop-blur-sm border-b border-[#E4E8E4] dark:border-[var(--border-subtle)] transition-colors duration-200">
      {/* Top micro-bar: Official Taglines, Multilingual Language Switcher & Quick Theme */}
      <div className="bg-[#14453D] dark:bg-[#0B2A24] text-white px-4 py-1.5 text-[11px] font-medium border-b border-[#1E6A50] dark:border-[#164239]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#175741] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
              {t('common.citizenPortal')}
            </span>
            <span className="font-hindi hidden sm:inline text-white/90">
              {t('common.taglineHindi')}
            </span>
            <span className="hidden md:inline text-white/60">|</span>
            <span className="hidden md:inline text-white/80">
              {t('common.taglineEnglish')}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multilingual 6-Language Switcher Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <motion.button
                id="language-picker-btn"
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                aria-expanded={langDropdownOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1.5 bg-[#0B302B] hover:bg-[#12423A] dark:bg-[#061814] dark:hover:bg-[#0B251F] text-white px-2.5 py-1 rounded-full border border-[#23584E] dark:border-[#1A4238] transition-all cursor-pointer shadow-xs text-[11px] font-medium"
                title="Change language / भाषा बदलें / மொழியை மாற்றுக"
              >
                <Globe className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span className="font-bold tracking-tight">{currentLangOption.nativeName}</span>
                <span className="text-[10px] text-white/60 hidden sm:inline">({currentLangOption.label})</span>
                <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-150 ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Language Selection Popover Menu */}
              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1.5 w-60 bg-[#0E2822] text-white rounded-xl shadow-xl border border-[#23584E] p-1.5 z-50 overflow-hidden"
                    role="listbox"
                    aria-label="Supported Languages"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-[#4ADE80] uppercase tracking-wider border-b border-[#1E4D43] mb-1">
                      {t('header.langSwitch') || 'Select Language / भाषा चुनें'}
                    </div>
                    {SUPPORTED_LANGUAGES.map((option) => {
                      const isSelected = lang === option.code;
                      return (
                        <button
                          key={option.code}
                          id={`lang-select-${option.code}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setLang(option.code);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#175741] text-white font-bold'
                              : 'hover:bg-[#17463D] text-white/90 hover:text-white'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[13px] leading-tight font-semibold">
                              {option.nativeName}
                            </span>
                            <span className="text-[10px] text-white/70">
                              {option.label} • {option.region}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Top Bar Theme Toggle Button (Sun/Moon icon with tactile micro-rotate) */}
            <motion.button
              id="top-theme-toggle-btn"
              type="button"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9, rotate: 15 }}
              onClick={toggleTheme}
              className="w-7 h-7 flex items-center justify-center bg-[#0B302B] dark:bg-[#061814] hover:bg-[#12423A] dark:hover:bg-[#0B251F] text-white/90 hover:text-white rounded-full border border-[#23584E] dark:border-[#1A4238] transition-all cursor-pointer shadow-xs"
              title={isDark ? t('header.switchToLight') : t('header.switchToDark')}
              aria-label={isDark ? t('header.switchToLight') : t('header.switchToDark')}
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-emerald-300" />
              )}
            </motion.button>

            <span className="text-[#1E6A50] hidden sm:inline">•</span>
            <span className="text-white/90 font-semibold hidden sm:inline">
              {t('common.gazetteVerified')}
            </span>
          </div>
        </div>
      </div>

      {/* Sovereign Tricolor Gold & Emerald Hairline Accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-[#1E6A50] to-[#0F766E] opacity-80" />

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Brand */}
          <motion.button
            id="brand-logo-btn"
            whileHover={shouldReduceMotion ? undefined : { opacity: 0.9 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            onClick={() => onNavigate(isAuthenticated ? 'results' : 'login')}
            className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
          >
            <YojanaSetuLogo horizontal={true} size="sm" showTaglines={true} />
          </motion.button>

          {/* Navigation Links with animated active indicator pill */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-[#F1F5F3] dark:bg-[var(--bg-card)] rounded-lg border border-[#E2E8E5] dark:border-[var(--border-subtle)]">
            <motion.button
              id="nav-form-btn"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => onNavigate('form')}
              className={`relative px-3.5 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer z-10 ${
                isFormActive
                  ? 'text-white'
                  : 'text-[#3F4943] dark:text-[var(--text-secondary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)]'
              }`}
            >
              {isFormActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <FileCheck2 className={`w-4 h-4 ${isFormActive ? 'text-[#4ADE80]' : 'text-[#1E6A50] dark:text-[var(--accent-green)]'}`} />
              <span>{t('header.navEligibilityCheck')}</span>
            </motion.button>

            <motion.button
              id="nav-dashboard-btn"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => onNavigate('dashboard')}
              className={`relative px-3.5 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer z-10 ${
                isDashboardActive
                  ? 'text-white'
                  : 'text-[#3F4943] dark:text-[var(--text-secondary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)]'
              }`}
            >
              {isDashboardActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <LayoutDashboard className={`w-4 h-4 ${isDashboardActive ? 'text-[#4ADE80]' : 'text-[#1E6A50] dark:text-[var(--accent-green)]'}`} />
              <span>{t('dashboard.navLabel')}</span>
            </motion.button>

            <motion.button
              id="nav-results-btn"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => onNavigate('results')}
              className={`relative px-3.5 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer z-10 ${
                isResultsActive
                  ? 'text-white'
                  : 'text-[#3F4943] dark:text-[var(--text-secondary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)]'
              }`}
            >
              {isResultsActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Sparkles className={`w-4 h-4 ${isResultsActive ? 'text-[#4ADE80]' : 'text-[#1E6A50] dark:text-[var(--accent-green)]'}`} />
              <span>{t('header.navMatchedSchemes')}</span>
            </motion.button>

            <motion.button
              id="nav-tracker-btn"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => onNavigate('tracker')}
              className={`relative px-3.5 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer z-10 ${
                isTrackerActive
                  ? 'text-white'
                  : 'text-[#3F4943] dark:text-[var(--text-secondary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)]'
              }`}
            >
              {isTrackerActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <ClipboardList className={`w-4 h-4 ${isTrackerActive ? 'text-[#4ADE80]' : 'text-[#1E6A50] dark:text-[var(--accent-green)]'}`} />
              <span>{trackerLabel}</span>
              {trackedCount > 0 && (
                <span
                  className={`min-w-4 px-1 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    isTrackerActive
                      ? 'bg-white/25 text-white'
                      : 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]'
                  }`}
                >
                  {trackedCount}
                </span>
              )}
            </motion.button>
          </nav>

          {/* Account Menu & User Interaction */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <AccountMenu
                userProfile={userProfile}
                applicantName={applicantName}
                onNavigate={onNavigate}
                onLogout={onLogout}
                trackedCount={trackedCount}
                savedCount={savedCount}
                matchResults={matchResults}
                onUpdateProfile={onUpdateProfile}
              />
            ) : (
              <motion.button
                id="header-login-cta"
                whileHover={shouldReduceMotion ? undefined : { y: -1, scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => onNavigate('login')}
                className="bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[var(--brand-deep)] text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('header.citizenLogin')}</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden items-center overflow-x-auto scrollbar-none border-t border-[#E4E8E4] dark:border-[var(--border-subtle)] py-2 px-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              id="mobile-nav-form-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('form')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isFormActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[var(--text-secondary)]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              <span>{t('header.navFormShort')}</span>
            </motion.button>
            <motion.button
              id="mobile-nav-dashboard-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('dashboard')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isDashboardActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[var(--text-secondary)]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              <span>{t('dashboard.navShort')}</span>
            </motion.button>
            <motion.button
              id="mobile-nav-results-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('results')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isResultsActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[var(--text-secondary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              <span>{t('header.navSchemesShort')}</span>
            </motion.button>
            <motion.button
              id="mobile-nav-tracker-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('tracker')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isTrackerActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[var(--text-secondary)]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[var(--accent-green)]" />
              <span>{trackerShortLabel}</span>
              {trackedCount > 0 && (
                <span
                  className={`min-w-4 px-1 rounded-full text-[10px] font-bold leading-none ${
                    isTrackerActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]'
                  }`}
                >
                  {trackedCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};