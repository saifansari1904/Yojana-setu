import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Lock, User, ArrowRight } from 'lucide-react';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { useTranslation } from '../i18n';
import { fadeUp, fadeDown, scaleIn } from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username.trim() || (lang === 'hi' ? 'नागरिक उद्यमी' : 'Citizen Entrepreneur'));
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 py-8 bg-[#FAFAF9] dark:bg-[#0E1311] transition-colors duration-200">
      <div className="w-full max-w-lg">
        {/* Upper Branding Area */}
        <motion.div
          variants={shouldReduceMotion ? undefined : fadeDown}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          transition={shouldReduceMotion ? reducedMotionTransition : transitions.smooth}
          className="flex flex-col items-center justify-center mb-6"
        >
          <YojanaSetuLogo size="md" showTaglines={true} showEnglishPill={true} className="mb-2" />
        </motion.div>

        {/* Centered Login Card */}
        <motion.div
          variants={shouldReduceMotion ? undefined : fadeUp}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          transition={shouldReduceMotion ? reducedMotionTransition : { ...transitions.smooth, delay: 0.1 }}
          className="bg-white dark:bg-[#151C19] rounded-md border border-[#E2E2E0] dark:border-[#24342D] shadow-sm overflow-hidden transition-colors duration-200"
        >
          <div className="border-t-4 border-[#14453D] dark:border-[#20695B] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
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

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <motion.button
                id="login-submit-btn"
                type="submit"
                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                className="w-full mt-2 bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white font-bold py-2.5 px-4 rounded text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('login.signInBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Guest Direct Access */}
            <div className="mt-5 pt-4 border-t border-[#E2E2E0] dark:border-[#24342D] text-center">
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
      </div>
    </div>
  );
};
