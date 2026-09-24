/**
 * YOJANA SETU — BUSINESS REGISTRATION MODEL
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure functions bridging the legacy single-select registration fields
 * (`businessRegistration`, `registrationStatus`, `isRegistered`) and the new
 * per-registration record model (`businessRegistrations`,
 * `businessFormalization`).
 *
 * Direction of truth:
 *   - If `businessRegistrations` exists (even empty), records are the source
 *     of truth and legacy fields are DERIVED from them.
 *   - If records are absent, legacy fields are MIGRATED into records once.
 *
 * Nothing here touches matching weights, eligibility rules, or any engine —
 * those keep reading the (derived) legacy fields exactly as before.
 */

import type { UserProfile, BusinessRegistrationType } from '../../types/user';
import type { RegistrationStatus } from '../../types/business';
import type {
  BusinessFormalizationStatus,
  BusinessRegistrationKind,
  BusinessRegistrationRecord,
} from '../../types/registration';

const LEGACY_KIND_MAP: Record<Exclude<BusinessRegistrationType, 'unregistered'>, BusinessRegistrationKind> = {
  udyam: 'udyam',
  gst: 'gst',
  local_trade: 'trade_license',
};

/** Legacy kind -> record kind, preferred order when deriving legacy fields. */
const KIND_TO_LEGACY: Partial<Record<BusinessRegistrationKind, BusinessRegistrationType>> = {
  udyam: 'udyam',
  gst: 'gst',
  trade_license: 'local_trade',
};

function makeId(kind: BusinessRegistrationKind): string {
  return `reg_${kind}_${Math.random().toString(36).slice(2, 9)}`;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * One-time migration: legacy single-select fields -> a single record.
 * Returns undefined when there is nothing meaningful to migrate (caller then
 * treats "no records" as the empty state rather than inventing data).
 */
export function migrateLegacyRegistrations(profile: Partial<Pick<UserProfile, 'businessRegistration' | 'registrationStatus' | 'isRegistered'>>): BusinessRegistrationRecord[] | undefined {
  const legacyKind = profile.businessRegistration;
  const legacyStatus: RegistrationStatus =
    profile.registrationStatus || (profile.isRegistered ? 'REGISTERED' : 'NOT_REGISTERED');

  if (!legacyKind || legacyKind === 'unregistered') {
    // Explicitly unregistered, or nothing ever captured: no records to migrate.
    return undefined;
  }

  const kind = LEGACY_KIND_MAP[legacyKind];
  if (!kind) return undefined;

  return [
    {
      id: makeId(kind),
      kind,
      status: legacyStatus,
      verificationStatus: 'USER_PROVIDED',
      updatedAt: new Date().toISOString(),
    },
  ];
}

/**
 * Suggests a formalization posture from records. A stored user choice always
 * wins — this is only the default when the user has never set one.
 */
export function suggestFormalization(
  records: BusinessRegistrationRecord[] | undefined,
  legacy: Partial<Pick<UserProfile, 'registrationStatus' | 'isRegistered' | 'businessRegistration'>>
): BusinessFormalizationStatus {
  if (!records || records.length === 0) {
    if (legacy.registrationStatus === 'NOT_REGISTERED' || legacy.businessRegistration === 'unregistered' || legacy.isRegistered === false) {
      return 'INFORMAL';
    }
    return 'UNKNOWN';
  }
  const statuses = records.map((r) => r.status);
  const hasRegistered = statuses.includes('REGISTERED');
  const hasApplied = statuses.includes('IN_PROCESS');
  const rest = statuses.filter((s) => s !== 'REGISTERED');
  if (hasRegistered && rest.length === 0) return 'FORMALIZED';
  if (hasRegistered || hasApplied) return 'PARTIALLY_FORMALIZED';
  if (statuses.every((s) => s === 'NOT_REGISTERED')) return 'INFORMAL';
  return 'UNKNOWN';
}

/**
 * Derives the legacy GLOBAL registrationStatus from records so the matching
 * engine, eligibility engine, journey logic and completeness scorer keep
 * working unchanged. Priority: REGISTERED > IN_PROCESS > NOT_REGISTERED >
 * NOT_APPLICABLE > UNKNOWN.
 *
 * An explicitly emptied record list ([]) is honest data — it resolves through
 * the user's formalization posture instead of a stale fallback.
 */
export function deriveLegacyRegistrationStatus(
  records: BusinessRegistrationRecord[] | undefined,
  fallback: RegistrationStatus | undefined,
  formalization?: BusinessFormalizationStatus
): RegistrationStatus | undefined {
  if (!records) return fallback;
  if (records.length === 0) {
    return formalization === 'INFORMAL' ? 'NOT_REGISTERED' : 'UNKNOWN';
  }
  const statuses = records.map((r) => r.status);
  if (statuses.includes('REGISTERED')) return 'REGISTERED';
  if (statuses.includes('IN_PROCESS')) return 'IN_PROCESS';
  if (statuses.includes('NOT_REGISTERED')) return 'NOT_REGISTERED';
  if (statuses.includes('NOT_APPLICABLE')) return 'NOT_APPLICABLE';
  return fallback ?? 'UNKNOWN';
}

/**
 * Derives the legacy single-select `businessRegistration` from records so
 * existing consumers (`commandCenter/adapter`, `businessJourney`,
 * `businessNeedProfile`) see record data without any changes.
 * Only udyam/gst/local_trade have legacy equivalents; other kinds leave the
 * legacy value untouched rather than clobbering it.
 */
export function deriveLegacyBusinessRegistration(
  records: BusinessRegistrationRecord[] | undefined,
  fallback: BusinessRegistrationType | undefined
): BusinessRegistrationType | undefined {
  if (!records) return fallback;
  // Explicitly emptied: clear the legacy single-select rather than leaving a
  // stale kind behind.
  if (records.length === 0) return undefined;
  const activeKinds = new Set(
    records.filter((r) => r.status === 'REGISTERED' || r.status === 'IN_PROCESS').map((r) => r.kind)
  );
  for (const kind of ['udyam', 'gst', 'trade_license'] as const) {
    if (activeKinds.has(kind)) return KIND_TO_LEGACY[kind];
  }
  return fallback;
}

function deriveLegacyIsRegistered(
  records: BusinessRegistrationRecord[] | undefined,
  formalization: BusinessFormalizationStatus | undefined,
  fallback: boolean | undefined
): boolean | undefined {
  if (!records) return fallback;
  if (records.length === 0) {
    if (formalization === 'INFORMAL') return false;
    if (formalization === 'FORMALIZED' || formalization === 'PARTIALLY_FORMALIZED') return true;
    return undefined;
  }
  return records.some((r) => r.status === 'REGISTERED');
}

/**
 * Normalizes a profile's registration fields:
 *  1. Migrates legacy fields -> records (one time, when records are absent).
 *  2. Defaults formalization from records/legacy when the user never set it.
 *  3. Derives legacy fields from records (records win when present).
 *
 * Pure and idempotent — safe to run on load and on every save.
 */
export function normalizeRegistrationFields(profile: UserProfile): UserProfile {
  const records = profile.businessRegistrations ?? migrateLegacyRegistrations(profile);
  const formalization = profile.businessFormalization ?? suggestFormalization(records, profile);

  return {
    ...profile,
    businessRegistrations: records,
    businessFormalization: formalization,
    // Legacy bridge: keep every existing consumer working unchanged.
    registrationStatus: deriveLegacyRegistrationStatus(records, profile.registrationStatus, formalization),
    businessRegistration: deriveLegacyBusinessRegistration(records, profile.businessRegistration),
    isRegistered: deriveLegacyIsRegistered(records, formalization, profile.isRegistered),
  };
}

// ---------------------------------------------------------------------------
// Completeness — computed ONLY from actual stored data, never fabricated.
// ---------------------------------------------------------------------------

/**
 * A record is "complete" when its status-appropriate required fields are
 * filled. NOT_REGISTERED / NOT_APPLICABLE / UNKNOWN require nothing.
 */
export function isRegistrationRecordComplete(record: BusinessRegistrationRecord): boolean {
  switch (record.status) {
    case 'REGISTERED':
      return !!clean(record.registrationNumber);
    case 'IN_PROCESS':
      return !!clean(record.applicationReference) || !!clean(record.applicationDate);
    default:
      return true;
  }
}

export interface RegistrationCompleteness {
  totalRecords: number;
  completeRecords: number;
  /** 0-100. 0 when there are no records (empty state handles display). */
  percentage: number;
  /** Records whose linked vault document is marked prepared. */
  documentsAvailable: number;
  /** Records missing status-appropriate details. */
  missingDetails: number;
}

/**
 * Computes the "Registration Profile" summary. `isDocPrepared` is injected so
 * this stays pure and the vault remains the single document store.
 */
export function calculateRegistrationCompleteness(
  records: BusinessRegistrationRecord[] | undefined,
  isDocPrepared: (documentId: string | undefined) => boolean
): RegistrationCompleteness {
  const list = records ?? [];
  if (list.length === 0) {
    return { totalRecords: 0, completeRecords: 0, percentage: 0, documentsAvailable: 0, missingDetails: 0 };
  }
  const completeRecords = list.filter(isRegistrationRecordComplete).length;
  const documentsAvailable = list.filter((r) => isDocPrepared(r.documentId)).length;
  return {
    totalRecords: list.length,
    completeRecords,
    percentage: Math.round((completeRecords / list.length) * 100),
    documentsAvailable,
    missingDetails: list.length - completeRecords,
  };
}

/** Records that the Next Best Action engine should treat as incomplete. */
export function getIncompleteRegistrationRecords(
  records: BusinessRegistrationRecord[] | undefined
): BusinessRegistrationRecord[] {
  return (records ?? []).filter((r) => !isRegistrationRecordComplete(r));
}
