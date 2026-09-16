import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Lock, User, ShieldCheck, Landmark, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { fadeUp } from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
import { ArrowFillButton, AnimatedScore } from './ui';
import { SetuHero } from './hero/SetuHero';

interface LoginScreenProps {
  onLogin: (applicantName?: string) => void;
  onSkipToForm: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSkipToForm }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  /** Secondary hero CTA: reveal the trust/how-it-works strip below the fold. */
  const handleExploreHowItWorks = () => {
    const target = document.getElementById('login-trust-counters');
    target?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username.trim() || (lang === 'hi' ? 'नागरिक उद्यमी' : 'Citizen Entrepreneur'));
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-6 sm:py-8 transition-colors duration-200">
      {/* Above-the-fold layout: sign-in sits beside the hero on desktop and
          first on mobile, so nobody has to scroll to reach it. */}
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
        <div className="order-2 lg:order-1">
          <SetuHero
            compact
            onFindSchemes={onSkipToForm}
            onExploreHowItWorks={handleExploreHowItWorks}
          />
        </div>

      {/* Sign-in column — brand emblem lives in the hero column beside it. */}
      <div className="order-1 lg:order-2 w-full max-w-lg mx-auto">
        {/* Centered Login Card */}
        <motion.div
          variants={shouldReduceMotion ? undefined : fadeUp}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: 0.1 }}
          className="yj-card shadow-sm overflow-hidden transition-colors duration-200"
        >
          <div className="border-t-4 border-[#14453D] dark:border-[#20695B] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">{t('login.title')}</h2>
                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] font-hindi">
                  {t('common.taglineHindi')}
                </p>
              </div>
              <span className="text-[11px] font-bold bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0F6B4C] dark:text-[#4ADE80] px-2 py-0.5 rounded">
                {t('common.verifiedGateway')}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold text-[#1A1C1B] dark:text-[#E2E8E4] uppercase tracking-wider mb-1.5"
                >
                  {t('login.usernameLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F7A73] dark:text-[#8E9F97]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('login.usernamePlaceholder')}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#2A3C34] rounded text-sm text-[#1A1C1B] dark:text-[#F0F4F2] placeholder-[#6F7A73] dark:placeholder-[#6C7E76] focus:outline-none focus:border-[#14453D] dark:focus:border-[#34D399] focus:ring-1 focus:ring-[#14453D] dark:focus:ring-[#34D399] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#1A1C1B] dark:text-[#E2E8E4] uppercase tracking-wider"
                  >
                    {t('login.passwordLabel')}
                  </label>
                  <span className="text-[11px] text-[#0F6B4C] dark:text-[#4ADE80] font-medium">{t('login.otpActive')}</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F7A73] dark:text-[#8E9F97]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAF9] dark:bg-[#101613] border border-[#E2E2E0] dark:border-[#2A3C34] rounded text-sm text-[#1A1C1B] dark:text-[#F0F4F2] placeholder-[#6F7A73] dark:placeholder-[#6C7E76] focus:outline-none focus:border-[#14453D] dark:focus:border-[#34D399] focus:ring-1 focus:ring-[#14453D] dark:focus:ring-[#34D399] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#3F4943] dark:text-[#A3B5AC]">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#E2E2E0] dark:border-[#2A3C34] text-[#14453D] dark:text-[#16A34A] focus:ring-[#14453D] dark:focus:ring-[#16A34A] bg-transparent"
                  />
                  <span>{t('login.rememberDevice')}</span>
                </label>
                <span className="text-[#516A5F] dark:text-[#8FA197] text-[11px]">{t('login.encrypted')}</span>
              </div>

              <div className="mt-3">
                <ArrowFillButton
                  id="login-submit-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth={true}
                >
                  {t('login.signInBtn')}
                </ArrowFillButton>
              </div>
            </form>

            {/* Guest Direct Access */}
            <div className="mt-4 pt-3 border-t border-[#E2E2E0] dark:border-[#24342D] text-center">
              <motion.button
                id="skip-to-form-btn"
                type="button"
                onClick={onSkipToForm}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="text-xs text-[#14453D] dark:text-[#4ADE80] hover:text-[#16A34A] dark:hover:text-[#6EE7B7] font-bold underline cursor-pointer inline-block"
              >
                {t('login.guestCheckBtn')}
              </motion.button>
            </div>
          </div>

          <div className="bg-[#F3F4F3] dark:bg-[#111714] px-6 py-3 border-t border-[#E2E2E0] dark:border-[#24342D] text-[11px] text-[#516A5F] dark:text-[#8FA197] text-center font-medium">
            {t('login.subFooter')}
          </div>
        </motion.div>

        {/* Section 29: Trust Counters Row */}
        <motion.div
          id="login-trust-counters"
          variants={shouldReduceMotion ? undefined : fadeUp}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: 0.2 }}
          className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center"
        >
          <div className="bg-white/80 dark:bg-[#151C19]/80 backdrop-blur-xs border border-[#E2E2E0] dark:border-[#24342D] rounded p-3 shadow-2xs">
            <div className="flex items-center justify-center text-[#14453D] dark:text-[#4ADE80] mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#14453D] dark:text-[#4ADE80]">
              <AnimatedScore value={39} suffix="+" />
            </div>
            <div className="text-[10px] text-[#516A5F] dark:text-[#8FA197] font-medium leading-tight">
              {lang === 'hi' ? 'सत्यापित योजनाएं' : 'Verified Schemes'}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#151C19]/80 backdrop-blur-xs border border-[#E2E2E0] dark:border-[#24342D] rounded p-3 shadow-2xs">
            <div className="flex items-center justify-center text-[#14453D] dark:text-[#4ADE80] mb-1">
              <Landmark className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#14453D] dark:text-[#4ADE80]">
              <AnimatedScore value={6} suffix="" />
            </div>
            <div className="text-[10px] text-[#516A5F] dark:text-[#8FA197] font-medium leading-tight">
              {lang === 'hi' ? 'दक्षिण राज्य व केंद्र' : 'South States & Central'}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#151C19]/80 backdrop-blur-xs border border-[#E2E2E0] dark:border-[#24342D] rounded p-3 shadow-2xs">
            <div className="flex items-center justify-center text-[#14453D] dark:text-[#4ADE80] mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#14453D] dark:text-[#4ADE80]">
              <AnimatedScore value={100} suffix="%" />
            </div>
            <div className="text-[10px] text-[#516A5F] dark:text-[#8FA197] font-medium leading-tight">
              {lang === 'hi' ? 'सटीक नियम गणना' : 'Deterministic Rules'}
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};
