import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { User, Mail, Smartphone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Info, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { fadeUp } from '../animations/variants';
import { transitions, reducedMotionTransition } from '../animations/transitions';
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

interface LoginScreenProps {
  onLogin: (applicantName?: string) => void;
  onSkipToForm: () => void;
}

type Tab = 'signin' | 'signup';

/**
 * Full credential login page — the backend seam lives in
 * src/lib/auth/authService.ts. Until the backend is written, the service
 * runs a local fallback so the app keeps working (see that file).
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSkipToForm }) => {
  const { t } = useTranslation();
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

  const inputClass = (hasError: boolean) =>
    `w-full pl-10 pr-3 py-3 bg-[#F7F8F7] dark:bg-[var(--bg-inset)] border rounded-xl text-[15px] text-[#1A1C1B] dark:text-[var(--text-main)] placeholder-[#8A968F] dark:placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? 'border-[#C0392B] dark:border-[#E57373] focus:border-[#C0392B] dark:focus:border-[#E57373] focus:ring-[#C0392B]/20'
        : 'border-[#E4E8E4] dark:border-[var(--border-subtle)] focus:border-[#14453D] dark:focus:border-[var(--accent-green)] focus:ring-[#14453D]/20 dark:focus:ring-[var(--accent-green)]/25 hover:border-[#14453D]/40 dark:hover:border-[#4ADE80]/40'
    }`;

  const iconWrap = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#516A5F] dark:text-[var(--text-tertiary)]';

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
      const result = await signInWithPassword({ identifier: identifier.trim(), password, rememberMe });
      if (result.ok) {
        setRememberedIdentifier(rememberMe ? identifier.trim() : '');
        onLogin(result.name);
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
      const result = await signUpWithCredentials({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password: newPassword,
      });
      if (result.ok) {
        onLogin(result.name);
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
    setSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (result.ok) {
        onLogin(result.name);
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
            {tab === 'signin' ? t('login.signInTitle') : t('login.signUpTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-center text-[#516A5F] dark:text-[var(--text-secondary)]">
            {tab === 'signin' ? t('login.signInSubtitle') : t('login.signUpSubtitle')}
          </p>

          {/* Tabs */}
          <div role="tablist" aria-label={t('login.signInTitle')} className="mt-5 grid grid-cols-2 gap-1 p-1 bg-[#F1F3F1] dark:bg-[var(--bg-inset)] rounded-xl">
            {(['signin', 'signup'] as Tab[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                type="button"
                onClick={() => switchTab(key)}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  tab === key
                    ? 'bg-white dark:bg-[var(--bg-card)] text-[#14453D] dark:text-[var(--accent-green)] shadow-sm'
                    : 'text-[#516A5F] dark:text-[var(--text-tertiary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)]'
                }`}
              >
                {t(key === 'signin' ? 'login.tabSignIn' : 'login.tabSignUp')}
              </button>
            ))}
          </div>

          {/* Feedback banners */}
          {formError && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 dark:bg-[#E57373]/10 px-3.5 py-3 text-[13px] text-[#7B241C] dark:text-[#F5B7B1]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p>{formError}</p>
                {formError === t('login.errNoAccount') && (
                  <button type="button" onClick={() => switchTab('signup')} className="mt-1 font-semibold underline underline-offset-2 cursor-pointer">
                    {t('login.errNoAccountAction')}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => setFormError(null)} aria-label="Dismiss" className="shrink-0 cursor-pointer opacity-70 hover:opacity-100">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {notice && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#1E6A50]/30 bg-[#1E6A50]/10 dark:bg-[var(--accent-green)]/10 px-3.5 py-3 text-[13px] text-[#14453D] dark:text-[var(--accent-green)]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="flex-1">{notice}</p>
              <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="shrink-0 cursor-pointer opacity-70 hover:opacity-100">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {tab === 'signin' && !showReset && (
            <form onSubmit={handleSignIn} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="login-identifier" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                  {t('login.identifierLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    {identifier.includes('@') ? <Mail className="h-4 w-4" aria-hidden="true" /> : <Smartphone className="h-4 w-4" aria-hidden="true" />}
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
                {fieldError('identifier') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('identifier')}</p>}
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                  {t('login.passwordLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Lock className="h-4 w-4" aria-hidden="true" />
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
                    className={`${inputClass(Boolean(fieldError('password')))} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={t(showPassword ? 'login.hidePassword' : 'login.showPassword')}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#516A5F] dark:text-[var(--text-tertiary)] hover:text-[#14453D] dark:hover:text-[var(--accent-green)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {fieldError('password') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('password')}</p>}
              </div>

              <div className="flex items-center justify-between">
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
                  className="text-[13px] font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] cursor-pointer"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              <ArrowFillButton id="login-submit-btn" type="submit" variant="primary" size="md" fullWidth={true} disabled={submitting}>
                {submitting ? t('login.statusSigningIn') : t('login.signInCta')}
              </ArrowFillButton>

              <div className="flex items-center gap-3 text-[12px] text-[#8A968F] dark:text-[var(--text-tertiary)]">
                <span className="flex-1 h-px bg-[#E4E8E4] dark:bg-[var(--border-subtle)]" aria-hidden="true" />
                {t('login.orDivider')}
                <span className="flex-1 h-px bg-[#E4E8E4] dark:bg-[var(--border-subtle)]" aria-hidden="true" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-[#E4E8E4] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-inset)] text-[14px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] hover:border-[#14453D]/40 dark:hover:border-[#4ADE80]/40 transition-colors cursor-pointer disabled:opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z" />
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
                </svg>
                {t('login.googleButton')}
              </button>
            </form>
          )}

          {tab === 'signin' && showReset && (
            <div className="mt-5">
              {resetSent ? (
                <div className="rounded-xl border border-[#1E6A50]/30 bg-[#1E6A50]/10 dark:bg-[var(--accent-green)]/10 px-4 py-5 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
                  <p className="mt-2 text-[14px] font-semibold text-[#14453D] dark:text-[var(--accent-green)]">{t('login.resetSentTitle')}</p>
                  <p className="mt-1 text-[13px] text-[#516A5F] dark:text-[var(--text-secondary)]">{t('login.resetSentMessage')}</p>
                  <button
                    type="button"
                    onClick={() => { setShowReset(false); setResetSent(false); }}
                    className="mt-3 text-[13px] font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] cursor-pointer"
                  >
                    {t('login.backToSignIn')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendReset} className="space-y-4" noValidate>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1A1C1B] dark:text-[var(--text-main)]">{t('login.resetTitle')}</h2>
                    <p className="mt-1 text-[13px] text-[#516A5F] dark:text-[var(--text-secondary)]">{t('login.resetSubtitle')}</p>
                  </div>
                  <div>
                    <label htmlFor="reset-email" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                      {t('login.emailLabel')}
                    </label>
                    <div className="relative">
                      <div className={iconWrap}>
                        <Mail className="h-4 w-4" aria-hidden="true" />
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
                    {fieldError('email') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('email')}</p>}
                  </div>
                  <ArrowFillButton id="reset-submit-btn" type="submit" variant="primary" size="md" fullWidth={true} disabled={submitting}>
                    {submitting ? t('login.statusSending') : t('login.sendResetLink')}
                  </ArrowFillButton>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setShowReset(false); setErrors({}); clearFeedback(); }}
                      className="text-[13px] font-semibold text-[#14453D] dark:text-[var(--accent-green)] hover:text-[#1E6A50] dark:hover:text-[#6EE7B7] cursor-pointer"
                    >
                      {t('login.backToSignIn')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="signup-name" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                  {t('login.nameLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <User className="h-4 w-4" aria-hidden="true" />
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
                {fieldError('name') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('name')}</p>}
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                  {t('login.emailLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Mail className="h-4 w-4" aria-hidden="true" />
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
                {fieldError('email') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('email')}</p>}
              </div>

              <div>
                <label htmlFor="signup-mobile" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                  {t('login.mobileLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[14px] font-semibold text-[#516A5F] dark:text-[var(--text-tertiary)] border-r border-[#E4E8E4] dark:border-[var(--border-subtle)] pr-2.5 mr-0.5">+91</span>
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
                    className={`${inputClass(Boolean(fieldError('mobile')))} pl-[4.25rem]`}
                  />
                </div>
                {fieldError('mobile') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('mobile')}</p>}
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                  {t('login.passwordLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Lock className="h-4 w-4" aria-hidden="true" />
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
                    className={`${inputClass(Boolean(fieldError('password')))} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={t(showNewPassword ? 'login.hidePassword' : 'login.showPassword')}
                    aria-pressed={showNewPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#516A5F] dark:text-[var(--text-tertiary)] hover:text-[#14453D] dark:hover:text-[var(--accent-green)] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                <p id="signup-password-hint" className="mt-1.5 text-[12px] text-[#8A968F] dark:text-[var(--text-tertiary)]">{t('login.passwordHint')}</p>
                {fieldError('password') && <p className="mt-1 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('password')}</p>}
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-[13px] font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] mb-1.5">
                  {t('login.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Lock className="h-4 w-4" aria-hidden="true" />
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
                    className={`${inputClass(Boolean(fieldError('confirmPassword')))} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={t(showConfirmPassword ? 'login.hidePassword' : 'login.showPassword')}
                    aria-pressed={showConfirmPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#516A5F] dark:text-[var(--text-tertiary)] hover:text-[#14453D] dark:hover:text-[var(--accent-green)] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {fieldError('confirmPassword') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('confirmPassword')}</p>}
              </div>

              <div>
                <label className="flex items-start gap-2.5 text-[13px] text-[#3F4943] dark:text-[var(--text-secondary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    aria-invalid={Boolean(fieldError('termsAccepted'))}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#14453D] dark:accent-[#4ADE80] cursor-pointer"
                  />
                  <span>{t('login.termsLine')}</span>
                </label>
                {fieldError('termsAccepted') && <p className="mt-1.5 text-[12px] text-[#C0392B] dark:text-[#E57373]">{fieldError('termsAccepted')}</p>}
              </div>

              <ArrowFillButton id="signup-submit-btn" type="submit" variant="primary" size="md" fullWidth={true} disabled={submitting}>
                {submitting ? t('login.statusCreatingAccount') : t('login.signUpCta')}
              </ArrowFillButton>
            </form>
          )}

          {/* One-line trust statement */}
          <p className="mt-5 flex items-start justify-center gap-1.5 text-[12px] leading-relaxed text-center text-[#516A5F] dark:text-[var(--text-tertiary)]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
            <span>{t('login.trustLine')}</span>
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
