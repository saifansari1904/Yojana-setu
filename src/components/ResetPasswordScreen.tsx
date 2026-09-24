import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { staggerContainer, staggerItem } from '../animations/variants';
import { reducedMotionTransition } from '../animations/transitions';
import { ArrowFillButton } from './ui';
import { YojanaSetuLogo } from './YojanaSetuLogo';
import { MIN_PASSWORD_LENGTH } from '../lib/auth/authValidation';

interface ResetPasswordScreenProps {
  /** Fired when the user finishes (success path). The parent reloads the page. */
  onDone: () => void;
}

type ResetFieldErrors = Partial<Record<'newPassword' | 'confirmPassword', 'errorTooShort' | 'errorMismatch'>>;

/**
 * Set-new-password screen for the Supabase recovery flow.
 * The recovery link lands on /login; the parent renders this screen when a
 * recovery session is present. The new password is saved through
 * supabase.auth.updateUser({ password }) — the client is lazy-imported so
 * this screen never breaks a non-Supabase build.
 */
export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onDone }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<ResetFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const rp = (key: string) => t(`login.resetPassword.${key}`);

  // Guard the whole screen: without Supabase env config there is no session
  // to update, so surface the generic error state immediately.
  useEffect(() => {
    let active = true;
    import('../lib/supabase/client')
      .then(({ isSupabaseConfigured }) => {
        if (active && !isSupabaseConfigured()) {
          setFormError(t('login.resetPassword.errorGeneric'));
        }
      })
      .catch(() => {
        if (active) setFormError(t('login.resetPassword.errorGeneric'));
      });
    return () => {
      active = false;
    };
  }, [t]);

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

  const fieldError = (key: 'newPassword' | 'confirmPassword') =>
    errors[key] ? rp(errors[key] as string) : null;

  const clearFeedback = () => setFormError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    // Same password rules as src/lib/auth/authValidation.ts (min 8 chars, match).
    const fieldErrors: ResetFieldErrors = {};
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      fieldErrors.newPassword = 'errorTooShort';
    }
    if (!confirmPassword || confirmPassword !== newPassword) {
      fieldErrors.confirmPassword = 'errorMismatch';
    }
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { getSupabaseClient, isSupabaseConfigured } = await import('../lib/supabase/client');
      if (!isSupabaseConfigured()) {
        setFormError(rp('errorGeneric'));
        return;
      }
      const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        const expired = /expired|invalid|session missing|already been used|token|link/.test(msg);
        setFormError(rp(expired ? 'errorExpired' : 'errorGeneric'));
        return;
      }
      setSuccess(true);
    } catch {
      setFormError(rp('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

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
            {success ? rp('successTitle') : rp('title')}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#516A5F] dark:text-[var(--text-secondary)] max-w-[36ch] mx-auto">
            {success ? rp('successMessage') : rp('subtitle')}
          </p>
        </motion.div>

        {/* Authentication card */}
        <motion.div
          variants={shouldReduceMotion ? undefined : staggerItem}
          className="bg-white dark:bg-[var(--bg-card)] border border-[#E7ECE8] dark:border-[var(--border-subtle)] rounded-[var(--yj-radius-lg)] p-6 sm:p-8 shadow-[0_1px_2px_rgba(20,69,61,0.05),0_8px_24px_-12px_rgba(20,69,61,0.12)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] transition-colors duration-200"
        >
          {/* Feedback banner — calm, professional, no aggressive red */}
          {formError && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-[var(--yj-radius-md)] border border-[#C0392B]/25 dark:border-[#E57373]/25 bg-[#FDF3F2] dark:bg-[#E57373]/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-[#7B241C] dark:text-[#F5B7B1]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="flex-1 min-w-0">{formError}</p>
              <button type="button" onClick={() => setFormError(null)} aria-label={t('login.dismiss')} className={dismissBtnClass}>
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {success ? (
            <div className="rounded-[var(--yj-radius-md)] border border-[#1E6A50]/25 dark:border-[#4ADE80]/20 bg-[#F2F8F4] dark:bg-[#4ADE80]/[0.07] px-5 py-8 text-center">
              <CheckCircle2 className="w-9 h-9 mx-auto text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
              <p className="mt-3 text-[15px] font-semibold text-[#14453D] dark:text-[var(--accent-green)]">{rp('successTitle')}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#516A5F] dark:text-[var(--text-secondary)]">{rp('successMessage')}</p>
              <div className="mt-6">
                <ArrowFillButton id="reset-password-done-btn" type="button" variant="primary" size="lg" fullWidth={true} onClick={onDone}>
                  {rp('doneButton')}
                </ArrowFillButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-[18px]" noValidate>
              <div>
                <label htmlFor="reset-new-password" className={labelClass}>
                  {rp('newPasswordLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Lock className="h-[18px] w-[18px]" aria-hidden="true" />
                  </div>
                  <input
                    id="reset-new-password"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('login.newPasswordPlaceholder')}
                    aria-invalid={Boolean(fieldError('newPassword'))}
                    aria-describedby="reset-new-password-hint"
                    className={`${inputClass(Boolean(fieldError('newPassword')))} pr-[52px]`}
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
                <p id="reset-new-password-hint" className="mt-1.5 text-[12px] text-[#8A968F] dark:text-[var(--text-tertiary)]">{t('login.passwordHint')}</p>
                {fieldError('newPassword') && <p className={errorTextClass}>{fieldError('newPassword')}</p>}
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className={labelClass}>
                  {rp('confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Lock className="h-[18px] w-[18px]" aria-hidden="true" />
                  </div>
                  <input
                    id="reset-confirm-password"
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

              <div className="pt-1">
                <ArrowFillButton id="reset-password-submit-btn" type="submit" variant="primary" size="lg" fullWidth={true} disabled={submitting}>
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {rp('submitButton')}
                    </span>
                  ) : (
                    rp('submitButton')
                  )}
                </ArrowFillButton>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
