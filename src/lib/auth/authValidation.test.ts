/**
 * YOJANA SETU — AUTH VALIDATION TESTS
 *
 * Run with: npx tsx src/lib/auth/authValidation.test.ts
 */

import {
  isValidEmail,
  isValidMobile,
  isValidIdentifier,
  normalizeMobile,
  validateSignIn,
  validateSignUp,
} from './authValidation';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${name}${details ? ` — ${details}` : ''}`);
  }
}

// --- email ---
assert(isValidEmail('saif@example.com'), 'valid email accepted');
assert(isValidEmail('  SAIF@EXAMPLE.IN  '), 'email trimmed + case-insensitive');
assert(!isValidEmail('not-an-email'), 'plain string rejected as email');
assert(!isValidEmail('a@b'), 'email without TLD rejected');
assert(!isValidEmail('a b@c.com'), 'email with space rejected');

// --- mobile ---
assert(isValidMobile('9876543210'), '10-digit mobile accepted');
assert(isValidMobile('+91 98765 43210'), '+91 prefixed mobile accepted');
assert(isValidMobile('919876543210'), '91 prefixed mobile accepted');
assert(isValidMobile('09876543210'), 'leading-zero mobile accepted');
assert(normalizeMobile('+91-98765-43210') === '9876543210', 'normalizeMobile strips to 10 digits');
assert(!isValidMobile('12345'), 'short number rejected');
assert(!isValidMobile('5876543210'), 'mobile not starting 6-9 rejected');

// --- identifier (either) ---
assert(isValidIdentifier('saif@example.com'), 'identifier accepts email');
assert(isValidIdentifier('9876543210'), 'identifier accepts mobile');
assert(!isValidIdentifier('garbage'), 'identifier rejects garbage');

// --- sign-in form ---
assert(Object.keys(validateSignIn({ identifier: '', password: '' })).length === 2, 'sign-in: empty fields flagged');
const badEmail = validateSignIn({ identifier: 'bad@', password: 'x' });
assert(badEmail.identifier === 'errInvalidEmail', 'sign-in: bad email mapped to errInvalidEmail');
const badMobile = validateSignIn({ identifier: '12345', password: 'x' });
assert(badMobile.identifier === 'errInvalidMobile', 'sign-in: bad mobile mapped to errInvalidMobile');
assert(Object.keys(validateSignIn({ identifier: 'saif@example.com', password: 'secret123' })).length === 0, 'sign-in: valid passes');

// --- sign-up form ---
const good = { name: 'Saif', email: 'saif@example.com', mobile: '9876543210', password: 'secret123', confirmPassword: 'secret123', termsAccepted: true };
assert(Object.keys(validateSignUp(good)).length === 0, 'sign-up: valid passes');
const shortPw = validateSignUp({ ...good, password: 'short', confirmPassword: 'short' });
assert(shortPw.password === 'errPasswordMin', 'sign-up: short password flagged');
const mismatch = validateSignUp({ ...good, confirmPassword: 'different1' });
assert(mismatch.confirmPassword === 'errPasswordMismatch', 'sign-up: mismatch flagged');
const noTerms = validateSignUp({ ...good, termsAccepted: false });
assert(noTerms.termsAccepted === 'errTerms', 'sign-up: terms required');
const badMob = validateSignUp({ ...good, mobile: '123' });
assert(badMob.mobile === 'errInvalidMobile', 'sign-up: bad mobile flagged');

console.log(`\nauthValidation: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
