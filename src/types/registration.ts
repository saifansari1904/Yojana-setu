/**
 * YOJANA SETU — BUSINESS REGISTRATION DOMAIN TYPES
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Per-registration records for the "Business Registrations & Compliance"
 * control center. This model evolves the legacy single-select
 * (`UserProfile.businessRegistration` + global `registrationStatus`) into
 * individual registration records while preserving backward compatibility:
 * the legacy fields are DERIVED from these records (see
 * `lib/registrations/registrationModel.ts`), so the matching engine,
 * eligibility engine, and every existing consumer keep working unchanged.
 */

import type { RegistrationStatus } from './business';

/**
 * Overall formalization posture of the business. This is a user-facing
 * organizational state — NOT a legal classification.
 */
export type BusinessFormalizationStatus =
  | 'FORMALIZED'
  | 'PARTIALLY_FORMALIZED'
  | 'INFORMAL'
  | 'UNKNOWN';

/**
 * Registration / license kinds supported by the control center.
 * Deliberately a small, real set — extensible via 'other' with a custom label.
 */
export type BusinessRegistrationKind =
  | 'udyam'
  | 'gst'
  | 'trade_license'
  | 'fssai'
  | 'professional_tax'
  | 'epf_esi'
  | 'other';

/**
 * Source / verification awareness for a registration record.
 *
 * Only 'USER_PROVIDED' and 'UNKNOWN' are ever assigned by the product today.
 * 'VERIFIED' / 'NOT_VERIFIED' are reserved for a future verification pipeline —
 * user-entered information is NEVER auto-marked as government verified, and
 * uploading a document does NOT imply official verification.
 */
export type RegistrationVerificationStatus =
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'USER_PROVIDED'
  | 'UNKNOWN';

/**
 * A single registration / license record owned by the entrepreneur.
 */
export interface BusinessRegistrationRecord {
  /** Stable client-generated id (e.g. `reg_<kind>_<random>`). */
  id: string;
  kind: BusinessRegistrationKind;
  /** Required when kind === 'other'. */
  customLabel?: string;
  /** Per-record lifecycle status. Reuses the existing RegistrationStatus enum. */
  status: RegistrationStatus;
  /** Shown only when status === 'REGISTERED'. */
  registrationNumber?: string;
  /** Shown only when status === 'IN_PROCESS'. */
  applicationReference?: string;
  /** ISO date (YYYY-MM-DD). Shown when status === 'REGISTERED'. */
  registrationDate?: string;
  /** ISO date (YYYY-MM-DD). Shown when status === 'IN_PROCESS'. */
  applicationDate?: string;
  issuingAuthority?: string;
  /**
   * Links to a Document Vault document id (see
   * `lib/documents/reusableDocuments.ts`). The vault remains the single
   * document store — this is a reference, never a copy.
   */
  documentId?: string;
  /** Never set to VERIFIED by user input. Defaults to USER_PROVIDED. */
  verificationStatus?: RegistrationVerificationStatus;
  notes?: string;
  /** ISO timestamp of last edit. */
  updatedAt?: string;
}

/**
 * Static metadata per registration kind. Label text itself comes from i18n
 * (see PROFILE_I18N `regKind*` keys) so language stays independent of data.
 */
export interface RegistrationKindMeta {
  /** i18n key in PROFILE_I18N for the display label. */
  labelKey: string;
  /** Default Document Vault document this registration links to, if any. */
  defaultDocumentId?: string;
}

export const REGISTRATION_KINDS: Record<BusinessRegistrationKind, RegistrationKindMeta> = {
  udyam: { labelKey: 'udyam', defaultDocumentId: 'udyam_certificate' },
  gst: { labelKey: 'gst' },
  trade_license: { labelKey: 'tradeLicense' },
  fssai: { labelKey: 'regKindFssai' },
  professional_tax: { labelKey: 'regKindProfessionalTax' },
  epf_esi: { labelKey: 'regKindEpfEsi' },
  other: { labelKey: 'regKindOther' },
};

/** Kinds offered in the "Add Registration" picker, in display order. */
export const REGISTRATION_KIND_ORDER: BusinessRegistrationKind[] = [
  'udyam',
  'gst',
  'trade_license',
  'fssai',
  'professional_tax',
  'epf_esi',
  'other',
];
