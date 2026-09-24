/**
 * YOJANA SETU — AUTH FORM VALIDATION
 * Pure, UI-agnostic validators for the login page. Field keys match the
 * i18n error keys (login.err*), so the UI can map errors to messages.
 */

export type AuthFieldErrors = Partial<Record<string, 'errRequired' | 'errInvalidEmail' | 'errInvalidMobile' | 'errPasswordMin' | 'errPasswordMismatch' | 'errTerms'>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Accepts 10-digit Indian mobiles, with optional +91 / 91 / spaces / dashes. */
export function normalizeMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidMobile(value: string): boolean {
  const digits = normalizeMobile(value);
  return digits.length === 10 && /^[6-9]/.test(digits);
}

/** Sign-in identifier may be either an email or a mobile number. */
export function isValidIdentifier(value: string): boolean {
  const v = value.trim();
  return v.includes('@') ? isValidEmail(v) : isValidMobile(v);
}

export const MIN_PASSWORD_LENGTH = 8;

export function validateSignIn(values: { identifier: string; password: string }): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (!values.identifier.trim()) errors.identifier = 'errRequired';
  else if (!isValidIdentifier(values.identifier)) {
    errors.identifier = values.identifier.includes('@') ? 'errInvalidEmail' : 'errInvalidMobile';
  }
  if (!values.password) errors.password = 'errRequired';
  return errors;
}

export function validateSignUp(values: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (!values.name.trim()) errors.name = 'errRequired';
  if (!values.email.trim()) errors.email = 'errRequired';
  else if (!isValidEmail(values.email)) errors.email = 'errInvalidEmail';
  if (!values.mobile.trim()) errors.mobile = 'errRequired';
  else if (!isValidMobile(values.mobile)) errors.mobile = 'errInvalidMobile';
  if (!values.password) errors.password = 'errRequired';
  else if (values.password.length < MIN_PASSWORD_LENGTH) errors.password = 'errPasswordMin';
  if (!values.confirmPassword) errors.confirmPassword = 'errRequired';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'errPasswordMismatch';
  if (!values.termsAccepted) errors.termsAccepted = 'errTerms';
  return errors;
}
