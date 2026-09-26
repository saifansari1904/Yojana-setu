import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { User, Mail, Smartphone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Info, AlertCircle, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { staggerContainer, staggerItem } from '../animations/variants';
import { reducedMotionTransition } from '../animations/transitions';
import { ArrowFillButton } from './ui';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import {
  signUpWithCredentials,
  signInWithPassword,
  sendPasswordReset,
  signInWithGoogle,
  getRememberedIdentifier,
  setRememberedIdentifier,
} from '../lib/auth/authService';
import { validateSignIn, validateSignUp, type AuthFieldErrors } from '../lib/auth/authValidation';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  /** Called synchronously when the user initiates a sign-in round-trip
   *  (before the auth request starts), so the app can distinguish an
   *  explicit sign-in from a stored session restored on page load. */
  onSignInInitiated: () => void;
  onSkipToForm: () => void;
}

type Tab = 'signin' | 'signup';

/**
 * Full credential login page — the backend seam lives in
 * src/lib/auth/authService.ts. Until the backend is written, the service
 * runs a local fallback so the app keeps working (see that file).
 *
 * NOTE: This file is presentation-only. All auth state, handlers, validation,
 * service calls, callbacks, and i18n keys are preserved exactly as implemented.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignInInitiated, onSkipToForm }) => {
  const { t } = useTranslation();
  const { authError, clearAuthError } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [tab, setTab] = useState<Tab>('signin');
  const [showReset, setShowReset] = useState(false);

  // Sign-in fields
  const [identifier, setIdentifier] = useState(() => getRememberedIdentifier());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => getRememberedIdentifier().length > 0);

  // Sign-up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Reset flow
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldError = (key: string) =>
    errors[key as keyof AuthFieldErrors] ? t(`login.${errors[key as keyof AuthFieldErrors]}`) : null;

  // Premium field surface: 48px tall, calm borders, confident focus state.
  const inputClass = (hasError: boolean) =>
    `w-full h-12 pl-11 pr-3.5 bg-white dark:bg-[var(--bg-raised)] border rounded-[var(--yj-radius-md)] text-[15px] text-[#1A1C1B] dark:text-[var(--text-main)] placeholder-[#8A968F] dark:placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-[border-color,box-shadow,background-color] duration-150 ${
      hasError
        ? 'border-[#C0392B] dark:border-[#E57373] focus:border-[#C0392B] dark:focus:border-[#E57373] focus:ring-[#C0392B]/15'
        : 'border-[#DDE3DE] dark:border-[var(--border-subtle)] hover:border-[#B9C4BC] dark:hover:border-[#4ADE80]/35 focus:border-[#14453D] dark:focus:border-[var(--accent-green)] focus:ring-[#14453D]/12 dark:focus:ring-[#4ADE80]/20'
    }`;

  const iconWrap = 'absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7A72] dark:text-[var(--text-tertiary)]';

  const labelClass = 'block text-[13px] font-semibold tracking-[-0.01em] text-[#2A332E] dark:text-[var(--text-main)] mb-2';

  const errorTextClass = 'mt-1.5 text-[12.5px] leading-snug text-[#B3261E] dark:text-[#F1948A]';

  const passwordToggleClass =
    'absolute inset-y-0 right-0 px-3.5 flex items-center justify-center min-w-[44px] text-[#6B7A72] dark:text-[var(--text-tertiary)] hover:text-[#14453D] dark:hover:text-[var(--accent-green)] cursor-pointer transition-colors duration-150 rounded-r-[var(--yj-radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]';

  const dismissBtnClass =
    'shrink-0 cursor-pointer opacity-60 hover:opacity-100 transition-opacity duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]';

  const clearFeedback = () => {
    setFormError(null);
    setNotice(null);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setShowReset(false);
    setResetSent(false);
    setErrors({});
    clearFeedback();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    const fieldErrors = validateSignIn({ identifier, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    setSubmitting(true);
    try {
      onSignInInitiated();
      const result = await signInWithPassword({ identifier: identifier.trim(), password, rememberMe });
      if (result.ok) {
        setRememberedIdentifier(rememberMe ? identifier.trim() : '');
        // Auth state is owned by AuthContext (Supabase session). Do not
        // notify App here — the post-auth navigation effect reacts to the
        // authoritative auth state when it lands.
      } else if (result.error === 'noAccount') {
        setFormError(t('login.errNoAccount'));
      } else {
        setFormError(t('login.errInvalidCredentials'));
      }
    } catch {
      setFormError(t('login.errSomethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    const fieldErrors = validateSignUp({
      name,
      email,
      mobile,
      password: newPassword,
      confirmPassword,
      termsAccepted,
    });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    setSubmitting(true);
    try {
      onSignInInitiated();
      const result = await signUpWithCredentials({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password: newPassword,
      });
      if (result.ok) {
        // Auth state is owned by AuthContext (Supabase session). Do not
        // notify App here — the post-auth navigation effect reacts to the
        // authoritative auth state when it lands.
      } else if (result.error === 'emailInUse') {
        setFormError(t('login.errEmailInUse'));
      } else {
        setFormError(t('login.errSomethingWrong'));
      }
    } catch {
      setFormError(t('login.errSomethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    clearFeedback();
    clearAuthError();
    setSubmitting(true);
    try {
      onSignInInitiated();
      const result = await signInWithGoogle();
      if (result.ok) {
        // Auth state is owned by AuthContext (Supabase session). Do not
        // notify App here — the post-auth navigation effect reacts to the
        // authoritative auth state when it lands.
      } else {
        // No backend yet — honest notice, not a dead button.
        setNotice(t('login.backendPendingNotice'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!resetEmail.trim()) {
      setErrors({ email: 'errRequired' });
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(resetEmail.trim());
      setResetSent(true);
    } catch {
      setFormError(t('login.errSomethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  // Header copy follows the active view; reset gets its own heading/subtitle.
  const headerTitle = showReset ? t('login.resetTitle') : tab === 'signin' ? t('login.signInTitle') : t('login.signUpTitle');
  const headerSubtitle = showReset ? t('login.resetSubtitle') : tab === 'signin' ? t('login.signInSubtitle') : t('login.signUpSubtitle');

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 transition-colors duration-200">
      <motion.div
        variants={shouldReduceMotion ? undefined : staggerContainer}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        transition={shouldReduceMotion ? reducedMotionTransition : undefined}
        className="w-full max-w-[440px]"
      >
        {/* Compact brand anchor */}
        <motion.div variants={shouldReduceMotion ? undefined : staggerItem} className="flex justify-center mb-6">
          <YojanaSetuLogo iconOnly size={40} />
        </motion.div>

        {/* Page heading — above the card, not inside it */}
        <motion.div variants={shouldReduceMotion ? undefined : staggerItem} className="text-center mb-6 sm:mb-7">
          <h1 className="text-[26px] sm:text-[30px] leading-[1.2] font-bold tracking-[-0.02em] text-[#1A1C1B] dark:text-[var(--text-main)]">
            {headerTitle}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#516A5F] dark:text-[var(--text-secondary)] max-w-[36ch] mx-auto">
            {headerSubtitle}
          </p>
        </motion.div>

        {/* Authentication card */}
        <motion.div
          variants={shouldReduceMotion ? undefined : staggerItem}
          className="bg-white dark:bg-[var(--bg-card)] border border-[#E7ECE8] dark:border-[var(--border-subtle)] rounded-[var(--yj-radius-lg)] p-6 sm:p-8 shadow-[0_1px_2px_rgba(20,69,61,0.05),0_8px_24px_-12px_rgba(20,69,61,0.12)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] transition-colors duration-200"
        >
          {/* Feedback banners — calm, professional, no aggressive red */}
          {formError && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-[var(--yj-radius-md)] border border-[#C0392B]/25 dark:border-[#E57373]/25 bg-[#FDF3F2] dark:bg-[#E57373]/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-[#7B241C] dark:text-[#F5B7B1]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p>{formError}</p>
                {formError === t('login.errNoAccount') && (
                  <button type="button" onClick={() => switchTab('signup')} className="mt-1 font-semibold underline underline-offset-2 cursor-pointer">
                    {t('login.errNoAccountAction')}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => setFormError(null)} aria-label={t('login.dismiss')} className={dismissBtnClass}>
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {notice && (
            <div className="mb-5 flex items-start gap-2.5 rounded-[var(--yj-radius-md)] border border-[#1E6A50]/25 dark:border-[#4ADE80]/20 bg-[#F2F8F4] dark:bg-[#4ADE80]/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-[#14453D] dark:text-[var(--accent-green)]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="flex-1 min-w-0">{notice}</p>
              <button type="button" onClick={() => setNotice(null)} aria-label={t('login.dismiss')} className={dismissBtnClass}>
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {authError && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-[var(--yj-radius-md)] border border-[#C0392B]/25 dark:border-[#E57373]/25 bg-[#FDF3F2] dark:bg-[#E57373]/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-[#7B241C] dark:text-[#F5B7B1]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p>{t('login.oauthFailed')}</p>
                {authError !== 'oauthUnknown' && (
                  <p className="mt-1 text-[12px] opacity-80">{authError}</p>
                )}
              </div>
              <button type="button" onClick={clearAuthError} aria-label={t('login.dismiss')} className={dismissBtnClass}>
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* ── Sign in view ─────────────────────────────────────────── */}
          {tab === 'signin' && !showReset && (
            <form onSubmit={handleSignIn} className="space-y-[18px]" noValidate>
              <div>
                <label htmlFor="login-identifier" className={labelClass}>
                  {t('login.identifierLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    {identifier.includes('@') ? <Mail className="h-[18px] w-[18px]" aria-hidden="true" /> : <Smartphone className="h-[18px] w-[18px]" aria-hidden="true" />}
                  </div>
                  <input
                    id="login-identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t('login.identifierPlaceholder')}
                    aria-invalid={Boolean(fieldError('identifier'))}
                    className={inputClass(Boolean(fieldError('identifier')))}
                  />
                </div>
                {fieldError('identifier') && <p className={errorTextClass}>{fieldError('identifier')}</p>}
              </div>

              <div>
                <label htmlFor="login-password" className={labelClass}>
                  {t('login.passwordLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Lock className="h-[18px] w-[18px]" aria-hidden="true" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    aria-invalid={Boolean(fieldError('password'))}
                    className={`${inputClass(Boolean(fieldError('password')))} pr-[52px]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={t(showPassword ? 'login.hidePassword' : 'login.showPassword')}
                    aria-pressed={showPassword}
                    className={passwordToggleClass}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
                  </button>
                </div>
                {fieldError('password') && <p className={errorTextClass}>{fieldError('password')}</p>}
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-[13px] text-[#3F4943] dark:text-[var(--text-secondary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#14453D] dark:accent-[#4ADE80] cursor-pointer"
                  />
                  {t('login.rememberMe')}
                </label>
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetSent(false); setResetEmail(identifier.includes('@') ? identifier : ''); clearFeedback(); setErrors({}); }}
                  className="text-[13px] font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              <div className="pt-1">
                <ArrowFillButton id="login-submit-btn" type="submit" variant="primary" size="lg" fullWidth={true} disabled={submitting}>
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {t('login.statusSigningIn')}
                    </span>
                  ) : (
                    t('login.signInCta')
                  )}
                </ArrowFillButton>
              </div>

              <div className="flex items-center gap-3 pt-1 text-[12px] font-medium text-[#8A968F] dark:text-[var(--text-tertiary)]">
                <span className="flex-1 h-px bg-[#E7ECE8] dark:bg-[var(--border-subtle)]" aria-hidden="true" />
                {t('login.orDivider')}
                <span className="flex-1 h-px bg-[#E7ECE8] dark:bg-[var(--border-subtle)]" aria-hidden="true" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full h-12 flex items-center justify-center gap-2.5 rounded-[var(--yj-radius-md)] border border-[#DDE3DE] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-raised)] text-[14px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] hover:border-[#B9C4BC] dark:hover:border-[#4ADE80]/35 hover:bg-[#FAFBFA] dark:hover:bg-[#26352E] active:bg-[#F1F3F1] dark:active:bg-[#1D2822] transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z" />
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
                </svg>
                {t('login.googleButton')}
              </button>

              {/* Sign up as the secondary path */}
              <p className="pt-1 text-center text-[13.5px] text-[#516A5F] dark:text-[var(--text-secondary)]">
                {t('login.noAccountPrompt')}{' '}
                <button
                  type="button"
                  onClick={() => switchTab('signup')}
                  className="font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]"
                >
                  {t('login.tabSignUp')}
                </button>
              </p>
            </form>
          )}

          {/* ── Password reset view ──────────────────────────────────── */}
          {tab === 'signin' && showReset && (
            <div>
              {resetSent ? (
                <div className="rounded-[var(--yj-radius-md)] border border-[#1E6A50]/25 dark:border-[#4ADE80]/20 bg-[#F2F8F4] dark:bg-[#4ADE80]/[0.07] px-5 py-8 text-center">
                  <CheckCircle2 className="w-9 h-9 mx-auto text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
                  <p className="mt-3 text-[15px] font-semibold text-[#14453D] dark:text-[var(--accent-green)]">{t('login.resetSentTitle')}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#516A5F] dark:text-[var(--text-secondary)]">{t('login.resetSentMessage')}</p>
                  <button
                    type="button"
                    onClick={() => { setShowReset(false); setResetSent(false); }}
                    className="mt-4 text-[13px] font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]"
                  >
                    {t('login.backToSignIn')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendReset} className="space-y-[18px]" noValidate>
                  <div>
                    <label htmlFor="reset-email" className={labelClass}>
                      {t('login.emailLabel')}
                    </label>
                    <div className="relative">
                      <div className={iconWrap}>
                        <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                      </div>
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder={t('login.emailPlaceholder')}
                        aria-invalid={Boolean(fieldError('email'))}
                        className={inputClass(Boolean(fieldError('email')))}
                      />
                    </div>
                    {fieldError('email') && <p className={errorTextClass}>{fieldError('email')}</p>}
                  </div>
                  <div className="pt-1">
                    <ArrowFillButton id="reset-submit-btn" type="submit" variant="primary" size="lg" fullWidth={true} disabled={submitting}>
                      {submitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          {t('login.statusSending')}
                        </span>
                      ) : (
                        t('login.sendResetLink')
                      )}
                    </ArrowFillButton>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setShowReset(false); setErrors({}); clearFeedback(); }}
                      className="text-[13px] font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]"
                    >
                      {t('login.backToSignIn')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Sign up view (secondary, full functionality) ─────────── */}
          {tab === 'signup' && (
            <div>
              <p className="mb-6 text-center text-[13.5px] text-[#516A5F] dark:text-[var(--text-secondary)]">
                {t('login.haveAccountPrompt')}{' '}
                <button
                  type="button"
                  onClick={() => switchTab('signin')}
                  className="font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]"
                >
                  {t('login.tabSignIn')}
                </button>
              </p>
              <form onSubmit={handleSignUp} className="space-y-[18px]" noValidate>
                <div>
                  <label htmlFor="signup-name" className={labelClass}>
                    {t('login.nameLabel')}
                  </label>
                  <div className="relative">
                    <div className={iconWrap}>
                      <User className="h-[18px] w-[18px]" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('login.namePlaceholder')}
                      aria-invalid={Boolean(fieldError('name'))}
                      className={inputClass(Boolean(fieldError('name')))}
                    />
                  </div>
                  {fieldError('name') && <p className={errorTextClass}>{fieldError('name')}</p>}
                </div>

                <div>
                  <label htmlFor="signup-email" className={labelClass}>
                    {t('login.emailLabel')}
                  </label>
                  <div className="relative">
                    <div className={iconWrap}>
                      <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      aria-invalid={Boolean(fieldError('email'))}
                      className={inputClass(Boolean(fieldError('email')))}
                    />
                  </div>
                  {fieldError('email') && <p className={errorTextClass}>{fieldError('email')}</p>}
                </div>

                <div>
                  <label htmlFor="signup-mobile" className={labelClass}>
                    {t('login.mobileLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-[14px] font-semibold text-[#516A5F] dark:text-[var(--text-tertiary)] border-r border-[#DDE3DE] dark:border-[var(--border-subtle)] pr-2.5">+91</span>
                    </div>
                    <input
                      id="signup-mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder={t('login.mobilePlaceholder')}
                      aria-invalid={Boolean(fieldError('mobile'))}
                      className={`${inputClass(Boolean(fieldError('mobile')))} pl-[68px]`}
                    />
                  </div>
                  {fieldError('mobile') && <p className={errorTextClass}>{fieldError('mobile')}</p>}
                </div>

                <div>
                  <label htmlFor="signup-password" className={labelClass}>
                    {t('login.passwordLabel')}
                  </label>
                  <div className="relative">
                    <div className={iconWrap}>
                      <Lock className="h-[18px] w-[18px]" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-password"
                      name="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('login.newPasswordPlaceholder')}
                      aria-invalid={Boolean(fieldError('password'))}
                      aria-describedby="signup-password-hint"
                      className={`${inputClass(Boolean(fieldError('password')))} pr-[52px]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label={t(showNewPassword ? 'login.hidePassword' : 'login.showPassword')}
                      aria-pressed={showNewPassword}
                      className={passwordToggleClass}
                    >
                      {showNewPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
                    </button>
                  </div>
                  <p id="signup-password-hint" className="mt-1.5 text-[12px] text-[#8A968F] dark:text-[var(--text-tertiary)]">{t('login.passwordHint')}</p>
                  {fieldError('password') && <p className="mt-1 text-[12.5px] text-[#B3261E] dark:text-[#F1948A]">{fieldError('password')}</p>}
                </div>

                <div>
                  <label htmlFor="signup-confirm" className={labelClass}>
                    {t('login.confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <div className={iconWrap}>
                      <Lock className="h-[18px] w-[18px]" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-confirm"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('login.confirmPasswordPlaceholder')}
                      aria-invalid={Boolean(fieldError('confirmPassword'))}
                      className={`${inputClass(Boolean(fieldError('confirmPassword')))} pr-[52px]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={t(showConfirmPassword ? 'login.hidePassword' : 'login.showPassword')}
                      aria-pressed={showConfirmPassword}
                      className={passwordToggleClass}
                    >
                      {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
                    </button>
                  </div>
                  {fieldError('confirmPassword') && <p className={errorTextClass}>{fieldError('confirmPassword')}</p>}
                </div>

                <div>
                  <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#3F4943] dark:text-[var(--text-secondary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      aria-invalid={Boolean(fieldError('termsAccepted'))}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#14453D] dark:accent-[#4ADE80] cursor-pointer"
                    />
                    <span>{t('login.termsLine')}</span>
                  </label>
                  {fieldError('termsAccepted') && <p className={errorTextClass}>{fieldError('termsAccepted')}</p>}
                </div>

                <div className="pt-1">
                  <ArrowFillButton id="signup-submit-btn" type="submit" variant="primary" size="lg" fullWidth={true} disabled={submitting}>
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {t('login.statusCreatingAccount')}
                      </span>
                    ) : (
                      t('login.signUpCta')
                    )}
                  </ArrowFillButton>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        {/* Trust + guest — quiet, below the card */}
        <motion.div variants={shouldReduceMotion ? undefined : staggerItem} className="mt-6 text-center">
          <p className="flex items-start justify-center gap-1.5 text-[12px] leading-relaxed text-[#6B7A72] dark:text-[var(--text-tertiary)] max-w-[38ch] mx-auto">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
            <span>{t('login.trustLine')}</span>
          </p>
          <motion.button
            id="skip-to-form-btn"
            type="button"
            onClick={onSkipToForm}
            whileHover={shouldReduceMotion ? undefined : { y: -1 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            className="mt-3.5 text-[13.5px] text-[#516A5F] dark:text-[var(--text-secondary)] hover:text-[#14453D] dark:hover:text-[var(--accent-green)] font-semibold transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]"
          >
            {t('login.continueGuest')}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};
