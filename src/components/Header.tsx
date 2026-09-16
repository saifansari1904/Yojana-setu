import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ActiveScreen, UserProfile } from '../types';
import {
  ClipboardList,
  LayoutDashboard,
  FileCheck2,
  Sparkles,
  User,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { useTranslation } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

interface HeaderProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  userProfile: UserProfile | null;
  applicantName?: string;
  isAuthenticated: boolean;
  onLogout: () => void;
  /** Number of tracked applications, shown as a badge on the tracker tab. */
  trackedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  applicantName,
  isAuthenticated,
  onLogout,
  trackedCount = 0,
}) => {
  const { lang, setLang, t, getLocalizedCategory, getLocalizedBusinessType } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const isFormActive = currentScreen === 'form';
  const isResultsActive =
    currentScreen === 'results' || currentScreen === 'alternatives' || currentScreen === 'scheme-detail' || currentScreen === 'workspace';
  const isTrackerActive = currentScreen === 'tracker';
  const isDashboardActive = currentScreen === 'dashboard';
  const trackerLabel = t('tracker.title');
  const trackerShortLabel = t('tracker.navShort');

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#FAFAF9]/95 dark:bg-[#151C19]/95 backdrop-blur-sm border-b border-[#E2E2E0] dark:border-[#24342D] transition-colors duration-200">
      {/* Top micro-bar: Official Taglines, Language Switcher & Quick Theme */}
      <div className="bg-[#14453D] dark:bg-[#0B2A24] text-white px-4 py-1.5 text-[11px] font-medium border-b border-[#1E6156] dark:border-[#164239]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#16A34A] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
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
            {/* Direct Bilingual Switcher: हिन्दी | English */}
            <div className="flex items-center bg-[#0B302B] dark:bg-[#061814] rounded-full p-0.5 border border-[#23584E] dark:border-[#1A4238]">
              <motion.button
                id="lang-btn-hi"
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                onClick={() => setLang('hi')}
                aria-pressed={lang === 'hi'}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label="Switch to Hindi"
              >
                हिन्दी
              </motion.button>
              <span className="text-white/40 text-[10px] px-0.5">|</span>
              <motion.button
                id="lang-btn-en"
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label="Switch to English"
              >
                English
              </motion.button>
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

            <span className="text-[#16A34A] hidden sm:inline">•</span>
            <span className="text-white/90 font-semibold hidden sm:inline">
              {t('common.gazetteVerified')}
            </span>
          </div>
        </div>
      </div>

      {/* Sovereign Tricolor Gold & Emerald Hairline Accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-[#16A34A] to-[#0F766E] opacity-80" />

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
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-[#F1F5F3] dark:bg-[#101714] rounded-lg border border-[#E2E8E5] dark:border-[#1E2E27]">
            <motion.button
              id="nav-form-btn"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => onNavigate('form')}
              className={`relative px-3.5 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer z-10 ${
                isFormActive
                  ? 'text-white'
                  : 'text-[#3F4943] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2]'
              }`}
            >
              {isFormActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <FileCheck2 className={`w-4 h-4 ${isFormActive ? 'text-[#4ADE80]' : 'text-[#16A34A] dark:text-[#4ADE80]'}`} />
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
                  : 'text-[#3F4943] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2]'
              }`}
            >
              {isDashboardActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <LayoutDashboard className={`w-4 h-4 ${isDashboardActive ? 'text-[#4ADE80]' : 'text-[#16A34A] dark:text-[#4ADE80]'}`} />
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
                  : 'text-[#3F4943] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2]'
              }`}
            >
              {isResultsActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Sparkles className={`w-4 h-4 ${isResultsActive ? 'text-[#4ADE80]' : 'text-[#16A34A] dark:text-[#4ADE80]'}`} />
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
                  : 'text-[#3F4943] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2]'
              }`}
            >
              {isTrackerActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#14453D] dark:bg-[#1C5045] rounded-md -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <ClipboardList className={`w-4 h-4 ${isTrackerActive ? 'text-[#4ADE80]' : 'text-[#16A34A] dark:text-[#4ADE80]'}`} />
              <span>{trackerLabel}</span>
              {trackedCount > 0 && (
                <span
                  className={`min-w-4 px-1 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    isTrackerActive
                      ? 'bg-white/25 text-white'
                      : 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80]'
                  }`}
                >
                  {trackedCount}
                </span>
              )}
            </motion.button>
          </nav>

          {/* User profile / Auth button */}
          <div className="flex items-center gap-2">
            {isAuthenticated && userProfile ? (
              <div className="flex items-center gap-2">
                <motion.button
                  id="profile-chip-btn"
                  whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => onNavigate('form')}
                  className="bg-[#F3F4F3] dark:bg-[#1E2723] hover:bg-[#EEEEED] dark:hover:bg-[#26352E] border border-[#E2E2E0] dark:border-[#2A3C34] px-3 py-1.5 rounded flex items-center gap-2 text-xs text-[#1A1C1B] dark:text-[#F0F4F2] transition-colors cursor-pointer"
                  title={t('header.modifyProfileTooltip')}
                >
                  <div className="w-5 h-5 rounded-full bg-[#14453D] dark:bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-bold">
                    {userProfile.category.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="font-bold text-[#14453D] dark:text-[#4ADE80]">
                      {getLocalizedCategory(userProfile.category)}
                    </span>
                    <span className="text-[#6F7A73] dark:text-[#9EB0A7]"> · {getLocalizedBusinessType(userProfile.businessType)}</span>
                  </div>
                </motion.button>
                <motion.button
                  id="logout-btn"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  onClick={onLogout}
                  className="p-2 text-[#6F7A73] dark:text-[#9EB0A7] hover:text-[#C2603F] dark:hover:text-[#F87171] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1E19]/40 rounded transition-colors cursor-pointer"
                  title={t('header.logout')}
                  aria-label={t('header.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <motion.button
                  id="profile-chip-btn"
                  whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => onNavigate('form')}
                  className="bg-[#F3F4F3] dark:bg-[#1E2723] hover:bg-[#EEEEED] dark:hover:bg-[#26352E] border border-[#E2E2E0] dark:border-[#2A3C34] px-3 py-1.5 rounded flex items-center gap-2 text-xs text-[#1A1C1B] dark:text-[#F0F4F2] transition-colors cursor-pointer"
                  title={t('header.modifyProfileTooltip')}
                >
                  <User className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                  <span className="font-semibold">{applicantName || (lang === 'hi' ? 'नागरिक' : 'Citizen')}</span>
                </motion.button>
                <motion.button
                  id="logout-btn"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  onClick={onLogout}
                  className="p-2 text-[#6F7A73] dark:text-[#9EB0A7] hover:text-[#C2603F] dark:hover:text-[#F87171] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1E19]/40 rounded transition-colors cursor-pointer"
                  title={t('header.logout')}
                  aria-label={t('header.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                id="header-login-cta"
                whileHover={shouldReduceMotion ? undefined : { y: -1, scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => onNavigate('login')}
                className="bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-4 py-2 rounded text-xs font-bold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('header.citizenLogin')}</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden items-center overflow-x-auto scrollbar-none border-t border-[#E2E2E0] dark:border-[#24342D] py-2 px-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              id="mobile-nav-form-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('form')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isFormActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[#9EB0A7]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('header.navFormShort')}</span>
            </motion.button>
            <motion.button
              id="mobile-nav-dashboard-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('dashboard')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isDashboardActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[#9EB0A7]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('dashboard.navShort')}</span>
            </motion.button>
            <motion.button
              id="mobile-nav-results-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('results')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isResultsActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[#9EB0A7]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('header.navSchemesShort')}</span>
            </motion.button>
            <motion.button
              id="mobile-nav-tracker-btn"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onNavigate('tracker')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isTrackerActive ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[#9EB0A7]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{trackerShortLabel}</span>
              {trackedCount > 0 && (
                <span
                  className={`min-w-4 px-1 rounded-full text-[10px] font-bold leading-none ${
                    isTrackerActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80]'
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