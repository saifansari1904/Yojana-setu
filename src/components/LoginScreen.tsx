import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { User, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../i18n';
import { fadeUp } from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
import { ArrowFillButton } from './ui';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { sanitizeApplicantName } from '../lib/profile/profileStorage';

interface LoginScreenProps {
  onLogin: (applicantName?: string) => void;
  onSkipToForm: () => void;
}

/**
 * Focused authentication utility — a natural continuation of the Welcome
 * experience, not a second landing page. Authentication behavior is
 * unchanged: the local account is created/signed in from the applicant's
 * name via onLogin. No marketing content, no invented auth methods.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSkipToForm }) => {
  const [username, setUsername] = useState('');
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const defaultUsernames: Record<string, string> = {
    en: 'Citizen Entrepreneur',
    hi: 'नागरिक उद्यमी',
    ta: 'குடிமகன் தொழில்முனைவோர்',
    te: 'పౌర పారిశ్రామికవేత్త',
    kn: 'ನಾಗರಿಕ ಉದ್ಯಮಿ',
    ml: 'പൗര സംരംഭകൻ',
    mr: 'नागरिक उद्योजक',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fallback = defaultUsernames[lang] || defaultUsernames.en;
    const sanitized = sanitizeApplicantName(username, fallback);
    onLogin(sanitized);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10 sm:py-12 transition-colors duration-200">
      <motion.div
        variants={shouldReduceMotion ? undefined : fadeUp}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: 0.05 }}
        className="w-full max-w-sm"
      >
        {/* Brand anchor — small emblem, no marketing */}
        <div className="flex justify-center mb-5">
          <YojanaSetuLogo iconOnly size={44} />
        </div>

        {/* Auth card */}
        <div className="bg-white dark:bg-[var(--bg-card)] border border-[#E4E8E4] dark:border-[var(--border-subtle)] rounded-2xl p-6 sm:p-7 shadow-sm transition-colors duration-200">
          <h1 className="text-[28px] sm:text-[32px] leading-tight font-extrabold tracking-tight text-center text-[#1A1C1B] dark:text-[var(--text-main)]">
            {t('login.signInTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-center text-[#516A5F] dark:text-[var(--text-secondary)]">
            {t('login.signInSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5"
              >
                {t('login.usernameLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#516A5F] dark:text-[var(--text-tertiary)]">
                  <User className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.usernamePlaceholder')}
                  className="w-full pl-9 pr-3 py-3 bg-[#F7F8F7] dark:bg-[var(--bg-inset)] border border-[#E4E8E4] dark:border-[var(--border-subtle)] rounded-xl text-[15px] text-[#1A1C1B] dark:text-[var(--text-main)] placeholder-[#8A968F] dark:placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#14453D] dark:focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[#14453D]/20 dark:focus:ring-[var(--accent-green)]/25 hover:border-[#14453D]/40 dark:hover:border-[#4ADE80]/40 transition-colors"
                />
              </div>
            </div>

            <ArrowFillButton
              id="login-submit-btn"
              type="submit"
              variant="primary"
              size="md"
              fullWidth={true}
            >
              {t('login.signInCta')}
            </ArrowFillButton>
          </form>

          {/* One-line trust statement */}
          <p className="mt-5 flex items-start justify-center gap-1.5 text-[12px] leading-relaxed text-center text-[#516A5F] dark:text-[var(--text-tertiary)]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
            <span>{t('login.trustLine')}</span>
          </p>

          {/* Account creation is part of sign-in in the local account model */}
          <p className="mt-4 text-center text-[13px] text-[#3F4943] dark:text-[var(--text-secondary)]">
            {t('login.newHereLine')}
          </p>

          {/* Guest path — help first, account when needed */}
          <div className="mt-3 pt-4 border-t border-[#E4E8E4] dark:border-[var(--border-subtle)] text-center">
            <motion.button
              id="skip-to-form-btn"
              type="button"
              onClick={onSkipToForm}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="text-[13px] text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] font-semibold cursor-pointer"
            >
              {t('login.continueGuest')}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
