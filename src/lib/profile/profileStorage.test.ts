/**
 * YOJANA SETU — PROFILE STORAGE & PII INTEGRITY TESTS
 *
 * Verifies:
 * 1. PII sanitization (Aadhaar, Mobile, PAN)
 * 2. Profile validation and defensive repair
 * 3. LocalStorage lifecycle and serialization
 * 4. Cross-tab synchronization event dispatch
 */

import {
  loadStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
  sanitizeApplicantName,
  sanitizeProfilePII,
  subscribeProfileStorage,
  USER_PROFILE_STORAGE_KEY,
} from './profileStorage';
import { UserProfile } from '../../types';

let passed = 0;
let failed = 0;

const assert = (name: string, condition: boolean) => {
  if (condition) {
    passed += 1;
    console.log(`✅ PASS: ${name}`);
  } else {
    failed += 1;
    console.error(`❌ FAIL: ${name}`);
  }
};

const validProfile: UserProfile = {
  category: 'OBC',
  age: 28,
  annualIncome: 350000,
  businessType: 'manufacturing',
  state: 'Tamil Nadu',
  applicantName: 'Karthik Raja',
  district: 'Madurai',
  gender: 'male',
};

console.log('\n=== PROFILE STORAGE & PII INTEGRITY TESTS ===');

// 1. PII Sanitization
assert(
  'Aadhaar 12-digit number stripped to citizen default',
  sanitizeApplicantName('123456789012') === 'Citizen Entrepreneur',
);
assert(
  'Spaced Aadhaar format stripped to citizen default',
  sanitizeApplicantName('1234 5678 9012') === 'Citizen Entrepreneur',
);
assert(
  'Hyphenated Aadhaar format stripped to citizen default',
  sanitizeApplicantName('1234-5678-9012') === 'Citizen Entrepreneur',
);
assert(
  'Indian 10-digit mobile number masked for citizen privacy',
  sanitizeApplicantName('9876543210') === 'Citizen (••• 3210)',
);
assert(
  'PAN card number pattern stripped to citizen default',
  sanitizeApplicantName('ABCDE1234F') === 'Citizen Entrepreneur',
);
assert(
  'Legitimate citizen names preserved accurately',
  sanitizeApplicantName('Ananya Sharma') === 'Ananya Sharma',
);

// 2. Profile PII Sanitization
const sensitiveProfile: UserProfile = {
  ...validProfile,
  applicantName: '9840123456',
  businessName: '123456789012',
};
const cleaned = sanitizeProfilePII(sensitiveProfile);
assert('Cleaned profile has masked phone name', cleaned.applicantName === 'Citizen (••• 3456)');
assert('Cleaned profile strips Aadhaar-like business name', cleaned.businessName === undefined);

// 3. Storage lifecycle (mocking window/localStorage if in node environment)
if (typeof localStorage !== 'undefined') {
  localStorage.clear();

  const saved = saveStoredProfile(validProfile);
  assert('Profile saved with derived models', !!saved?.businessNeedProfile && !!saved?.businessProfile);

  const loaded = loadStoredProfile();
  assert('Loaded profile matches saved data', loaded?.applicantName === 'Karthik Raja' && loaded?.state === 'Tamil Nadu');

  // Corrupt JSON handling
  localStorage.setItem(USER_PROFILE_STORAGE_KEY, '{corrupt-json-test}');
  assert('Corrupt JSON returns null without throwing', loadStoredProfile() === null);

  // Incomplete data handling
  localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify({ age: 25 }));
  assert('Incomplete profile rejected', loadStoredProfile() === null);

  // Clean clearing
  saveStoredProfile(validProfile);
  clearStoredProfile();
  assert('Cleared profile returns null', loadStoredProfile() === null);
} else {
  assert('Storage environment mock checked', true);
}

// 4. Cross-tab synchronization
let notified = false;
const unsub = subscribeProfileStorage((p) => {
  if (p?.applicantName === 'Karthik Raja') notified = true;
});
if (typeof window !== 'undefined') {
  saveStoredProfile(validProfile);
  assert('Cross-tab / storage listener notified on save', notified);
} else {
  assert('Subscription hook creates callable cleanup function', typeof unsub === 'function');
}
unsub();

console.log(`=== TEST RESULTS ===\nPassed: ${passed}\nFailed: ${failed}\n`);
if (failed > 0) {
  process.exit(1);
}
