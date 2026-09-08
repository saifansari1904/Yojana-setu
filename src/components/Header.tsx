import React from 'react';
import { ActiveScreen, UserProfile } from '../types';
import {
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
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  applicantName,
  isAuthenticated,
  onLogout,
}) => {
  const { lang, setLang, t, getLocalizedCategory, getLocalizedBusinessType } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

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
              <button
                id="lang-btn-hi"
                type="button"
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
              </button>
              <span className="text-white/40 text-[10px] px-0.5">|</span>
              <button
                id="lang-btn-en"
                type="button"
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
              </button>
            </div>

            {/* Top Bar Theme Toggle Button (Sun/Moon icon only) */}
            <button
              id="top-theme-toggle-btn"
              type="button"
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
            </button>

            <span className="text-[#16A34A] hidden sm:inline">•</span>
            <span className="text-white/90 font-semibold hidden sm:inline">
              {t('common.gazetteVerified')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Brand */}
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate(isAuthenticated ? 'results' : 'login')}
            className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
          >
            <YojanaSetuLogo horizontal={true} size="sm" showTaglines={true} />
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-form-btn"
              onClick={() => onNavigate('form')}
              className={`px-3.5 py-2 text-xs font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentScreen === 'form'
                  ? 'bg-[#14453D] dark:bg-[#1C5045] text-white shadow-xs'
                  : 'text-[#3F4943] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2] hover:bg-[#EEEEED] dark:hover:bg-[#1E2723]'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('header.navEligibilityCheck')}</span>
            </button>

            <button
              id="nav-results-btn"
              onClick={() => onNavigate('results')}
              className={`px-3.5 py-2 text-xs font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentScreen === 'results' || currentScreen === 'alternatives'
                  ? 'bg-[#14453D] dark:bg-[#1C5045] text-white shadow-xs'
                  : 'text-[#3F4943] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2] hover:bg-[#EEEEED] dark:hover:bg-[#1E2723]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('header.navMatchedSchemes')}</span>
            </button>
          </nav>

          {/* User profile / Auth button */}
          <div className="flex items-center gap-2">
            {isAuthenticated && userProfile ? (
              <div className="flex items-center gap-2">
                <button
                  id="profile-chip-btn"
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
                </button>
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  className="p-2 text-[#6F7A73] dark:text-[#9EB0A7] hover:text-[#C2603F] dark:hover:text-[#F87171] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1E19]/40 rounded transition-colors cursor-pointer"
                  title={t('header.logout')}
                  aria-label={t('header.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  id="profile-chip-btn"
                  onClick={() => onNavigate('form')}
                  className="bg-[#F3F4F3] dark:bg-[#1E2723] hover:bg-[#EEEEED] dark:hover:bg-[#26352E] border border-[#E2E2E0] dark:border-[#2A3C34] px-3 py-1.5 rounded flex items-center gap-2 text-xs text-[#1A1C1B] dark:text-[#F0F4F2] transition-colors cursor-pointer"
                  title={t('header.modifyProfileTooltip')}
                >
                  <User className="w-3.5 h-3.5 text-[#14453D] dark:text-[#4ADE80]" />
                  <span className="font-semibold">{applicantName || (lang === 'hi' ? 'नागरिक' : 'Citizen')}</span>
                </button>
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  className="p-2 text-[#6F7A73] dark:text-[#9EB0A7] hover:text-[#C2603F] dark:hover:text-[#F87171] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1E19]/40 rounded transition-colors cursor-pointer"
                  title={t('header.logout')}
                  aria-label={t('header.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-cta"
                onClick={() => onNavigate('login')}
                className="bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-4 py-2 rounded text-xs font-bold tracking-wide transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('header.citizenLogin')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden items-center justify-start border-t border-[#E2E2E0] dark:border-[#24342D] py-2 px-1">
          <div className="flex items-center gap-2">
            <button
              id="mobile-nav-form-btn"
              onClick={() => onNavigate('form')}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors ${
                currentScreen === 'form' ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[#9EB0A7]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('header.navFormShort')}</span>
            </button>
            <button
              id="mobile-nav-results-btn"
              onClick={() => onNavigate('results')}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors ${
                currentScreen === 'results' || currentScreen === 'alternatives' ? 'bg-[#14453D] dark:bg-[#1C5045] text-white' : 'text-[#3F4943] dark:text-[#9EB0A7]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
              <span>{t('header.navSchemesShort')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
