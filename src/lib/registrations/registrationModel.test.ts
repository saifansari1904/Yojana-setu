/**
 * YOJANA SETU — BUSINESS REGISTRATION MODEL TESTS
 *
 * Run with: npx tsx src/lib/registrations/registrationModel.test.ts
 */

import {
  migrateLegacyRegistrations,
  suggestFormalization,
  deriveLegacyRegistrationStatus,
  deriveLegacyBusinessRegistration,
  normalizeRegistrationFields,
  isRegistrationRecordComplete,
  calculateRegistrationCompleteness,
  getIncompleteRegistrationRecords,
} from './registrationModel';
import type { UserProfile } from '../../types/user';
import type { BusinessRegistrationRecord } from '../../types/registration';

let passed = 0;
let failed = 0;
function assert(condition: boolean, name: string, details?: string) {
  if (condition) { console.log(`✅ PASS: ${name}`); passed++; }
  else { console.error(`❌ FAIL: ${name}`); if (details) console.error(`   ${details}`); failed++; }
}

const baseProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  category: 'General',
  age: 30,
  annualIncome: 250000,
  businessType: 'trading',
  state: 'Maharashtra',
  ...overrides,
});

const rec = (overrides: Partial<BusinessRegistrationRecord> = {}): BusinessRegistrationRecord => ({
  id: 'reg_test_1',
  kind: 'udyam',
  status: 'REGISTERED',
  registrationNumber: 'UDYAM-MH-01-0000001',
  verificationStatus: 'USER_PROVIDED',
  ...overrides,
});

// --- Migration ---------------------------------------------------------------
{
  const migrated = migrateLegacyRegistrations({ businessRegistration: 'udyam', registrationStatus: 'REGISTERED' });
  assert(migrated?.length === 1 && migrated[0].kind === 'udyam' && migrated[0].status === 'REGISTERED', 'migrates legacy udyam -> record');
}
{
  const migrated = migrateLegacyRegistrations({ businessRegistration: 'local_trade', registrationStatus: 'IN_PROCESS' });
  assert(migrated?.[0].kind === 'trade_license' && migrated[0].status === 'IN_PROCESS', 'migrates local_trade -> trade_license record');
}
{
  const migrated = migrateLegacyRegistrations({ businessRegistration: 'unregistered' });
  assert(migrated === undefined, 'unregistered migrates to no records');
}
{
  const migrated = migrateLegacyRegistrations({ isRegistered: true, registrationStatus: 'REGISTERED' });
  assert(migrated === undefined, 'isRegistered without kind migrates to no records (no invented kind)');
}

// --- Formalization suggestion -------------------------------------------------
{
  assert(suggestFormalization([rec()], {}) === 'FORMALIZED', 'single registered -> FORMALIZED');
  assert(suggestFormalization([rec(), rec({ id: 'x', kind: 'gst', status: 'NOT_REGISTERED' })], {}) === 'PARTIALLY_FORMALIZED', 'mixed -> PARTIALLY_FORMALIZED');
  assert(suggestFormalization([rec({ status: 'IN_PROCESS', registrationNumber: undefined })], {}) === 'PARTIALLY_FORMALIZED', 'in-process -> PARTIALLY_FORMALIZED');
  assert(suggestFormalization([], { registrationStatus: 'NOT_REGISTERED' }) === 'INFORMAL', 'legacy not registered -> INFORMAL');
  assert(suggestFormalization(undefined, {}) === 'UNKNOWN', 'nothing known -> UNKNOWN');
}

// --- Legacy derivation ---------------------------------------------------------
{
  assert(deriveLegacyRegistrationStatus([rec()], 'UNKNOWN') === 'REGISTERED', 'record REGISTERED dominates legacy status');
  assert(deriveLegacyRegistrationStatus([rec({ status: 'IN_PROCESS', registrationNumber: undefined })], 'REGISTERED') === 'IN_PROCESS', 'records win over stale legacy status');
  assert(deriveLegacyRegistrationStatus(undefined, 'NOT_REGISTERED') === 'NOT_REGISTERED', 'no records -> legacy fallback preserved');
  assert(deriveLegacyRegistrationStatus([], 'REGISTERED', 'INFORMAL') === 'NOT_REGISTERED', 'emptied records + informal -> NOT_REGISTERED (no stale REGISTERED)');
  assert(deriveLegacyRegistrationStatus([], 'REGISTERED', 'UNKNOWN') === 'UNKNOWN', 'emptied records + unknown -> UNKNOWN (no stale REGISTERED)');
  assert(deriveLegacyBusinessRegistration([rec({ kind: 'gst' })], 'udyam') === 'gst', 'legacy kind derived from records');
  assert(deriveLegacyBusinessRegistration([rec({ kind: 'fssai' })], 'udyam') === 'udyam', 'non-legacy kinds do not clobber legacy kind');
  assert(deriveLegacyBusinessRegistration([], 'udyam') === undefined, 'emptied records clear stale legacy kind');
}

// --- normalizeRegistrationFields ------------------------------------------------
{
  const p = normalizeRegistrationFields(baseProfile({ businessRegistration: 'gst', registrationStatus: 'REGISTERED' }));
  assert(p.businessRegistrations?.length === 1 && p.businessRegistrations[0].kind === 'gst', 'normalize migrates legacy on first run');
  assert(p.registrationStatus === 'REGISTERED', 'normalize keeps derived legacy status');
  assert(p.businessFormalization === 'FORMALIZED', 'normalize defaults formalization');
  // Idempotent: second run must not duplicate or change records.
  const p2 = normalizeRegistrationFields(p);
  assert(p2.businessRegistrations?.length === 1 && p2.businessRegistrations[0].id === p.businessRegistrations![0].id, 'normalize is idempotent');
}
{
  const p = normalizeRegistrationFields(baseProfile({
    businessFormalization: 'INFORMAL',
    businessRegistrations: [rec({ status: 'NOT_REGISTERED', registrationNumber: undefined })],
  }));
  assert(p.businessFormalization === 'INFORMAL', 'stored formalization choice wins over suggestion');
  assert(p.registrationStatus === 'NOT_REGISTERED', 'legacy status derived from records');
  assert(p.isRegistered === false, 'isRegistered derived false');
}

// --- Completeness -----------------------------------------------------------------
{
  assert(isRegistrationRecordComplete(rec()) === true, 'registered with number is complete');
  assert(isRegistrationRecordComplete(rec({ registrationNumber: '  ' })) === false, 'registered with blank number is incomplete');
  assert(isRegistrationRecordComplete(rec({ status: 'IN_PROCESS', registrationNumber: undefined, applicationReference: 'ACK/123' })) === true, 'applied with reference is complete');
  assert(isRegistrationRecordComplete(rec({ status: 'IN_PROCESS', registrationNumber: undefined })) === false, 'applied with nothing is incomplete');
  assert(isRegistrationRecordComplete(rec({ status: 'NOT_REGISTERED', registrationNumber: undefined })) === true, 'not-registered requires nothing');
  assert(isRegistrationRecordComplete(rec({ status: 'NOT_APPLICABLE', registrationNumber: undefined })) === true, 'n/a requires nothing');
}
{
  const records = [
    rec(),
    rec({ id: 'r2', kind: 'gst', registrationNumber: undefined, documentId: 'udyam_certificate' }),
    rec({ id: 'r3', kind: 'trade_license', status: 'IN_PROCESS', registrationNumber: undefined, applicationReference: 'ACK/9' }),
  ];
  const c = calculateRegistrationCompleteness(records, (id) => id === 'udyam_certificate');
  assert(c.totalRecords === 3 && c.completeRecords === 2 && c.percentage === 67, 'completeness percentage from real data', JSON.stringify(c));
  assert(c.documentsAvailable === 1 && c.missingDetails === 1, 'doc + missing counts from real data');
  const empty = calculateRegistrationCompleteness(undefined, () => false);
  assert(empty.percentage === 0 && empty.totalRecords === 0, 'empty profile -> zero, not fabricated');
}
{
  const incomplete = getIncompleteRegistrationRecords([rec(), rec({ id: 'r2', kind: 'gst', registrationNumber: undefined })]);
  assert(incomplete.length === 1 && incomplete[0].kind === 'gst', 'NBA helper surfaces only incomplete records');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
