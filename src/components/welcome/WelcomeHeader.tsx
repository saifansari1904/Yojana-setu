import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Menu, X, Globe, ChevronDown, Check } from 'lucide-react';
import { YojanaSetuLogo } from '../YojanaSetuLogo';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '../../i18n';
import { transitions } from '../../animations/transitions';

interface WelcomeHeaderProps {
  activeSection: string;
  onNavigate: (id: string) => void;
  onSignIn: () => void;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  activeSection,
  onNavigate,
  onSignIn,
}) => {
  const { t, lang, setLang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

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

  /* Compact the header once the user scrolls past the hero top */
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const selectLanguage = (code: Language) => {
    setLang(code);
    setLangDropdownOpen(false);
  };

  const navItems = [
    { id: 'welcome-hero', label: t('welcome.navHome') },
    { id: 'welcome-how-it-works', label: t('welcome.navHowItWorks') },
    { id: 'welcome-preview', label: t('welcome.navSchemes') },
    { id: 'welcome-trust', label: t('welcome.navAbout') },
  ];

  return (
    <header
      className={`sticky top-0 z-40 bg-[#FAFAF9]/85 dark:bg-[#0E1311]/85 backdrop-blur-md border-b border-[#E4E8E4]/80 dark:border-[#24342D]/80 transition-all duration-200 ${
        compact ? 'shadow-[0_8px_24px_-16px_rgba(20,69,61,0.35)]' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`flex items-center justify-between gap-3 transition-all duration-200 ${
            compact ? 'h-13 min-h-[52px]' : 'h-16'
          }`}
        >
          <div className="flex items-center gap-7 min-w-0">
            <YojanaSetuLogo size="sm" horizontal showTaglines={false} showEnglishPill={false} />
            <nav className="hidden md:flex items-center gap-1" aria-label={t('welcome.navHome')}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={activeSection === item.id ? 'true' : undefined}
                  className={`relative px-3 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? 'text-[#14453D] dark:text-[#4ADE80]'
                      : 'text-[#3F4943] dark:text-[#A3B5AC] hover:text-[#14453D] dark:hover:text-[#4ADE80]'
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.span
                      layoutId="welcome-nav-underline"
                      className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-[#14453D] dark:bg-[#4ADE80]"
                      transition={transitions.fast}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Compact language selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#3F4943] dark:text-[#A3B5AC] hover:text-[#14453D] dark:hover:text-[#4ADE80] hover:border-[#14453D]/40 dark:hover:border-[#4ADE80]/40 px-2.5 py-2 rounded-lg border border-[#E4E8E4] dark:border-[#2A3C34] bg-white/60 dark:bg-[#141b17]/60 transition-all cursor-pointer min-h-[44px]"
                aria-haspopup="listbox"
                aria-expanded={langDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline max-w-[92px] truncate">{currentLangOption.label}</span>
                <span className="sm:hidden">{currentLangOption.code.toUpperCase()}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {langDropdownOpen && (
                <motion.div
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={transitions.fast}
                  className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#141b17] border border-[#E4E8E4] dark:border-[#2A3C34] rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  role="listbox"
                >
                  {SUPPORTED_LANGUAGES.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => selectLanguage(opt.code)}
                      className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-xs text-[#1A1C1B] dark:text-[#F0F4F2] hover:bg-[#F3F4F3] dark:hover:bg-[#1d2822] transition-colors cursor-pointer"
                      role="option"
                      aria-selected={opt.code === lang}
                    >
                      <span>{opt.label}</span>
                      {opt.code === lang && <Check className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" aria-hidden="true" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <button
              onClick={onSignIn}
              className="hidden sm:inline-flex text-sm font-bold text-white bg-[#14453D] dark:bg-[#1E6A50] hover:bg-[#1E6A50] dark:hover:bg-[#25795f] px-4 py-2 min-h-[44px] items-center rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
            >
              {t('welcome.navSignIn')}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#3F4943] dark:text-[#A3B5AC] hover:bg-[#F3F4F3] dark:hover:bg-[#1d2822] transition-colors cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('welcome.menuClose') : t('welcome.menuOpen')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <motion.nav
          initial={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, height: 'auto' }}
          transition={transitions.fast}
          className="md:hidden border-t border-[#E4E8E4] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#0E1311] overflow-hidden"
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(item.id);
                }}
                className={`text-left px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80]'
                    : 'text-[#3F4943] dark:text-[#A3B5AC] hover:bg-[#F3F4F3] dark:hover:bg-[#1d2822]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignIn();
              }}
              className="mt-2 text-center px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-bold text-white bg-[#14453D] dark:bg-[#1E6A50] cursor-pointer"
            >
              {t('welcome.navSignIn')}
            </button>
          </div>
        </motion.nav>
      )}
    </header>
  );
};
