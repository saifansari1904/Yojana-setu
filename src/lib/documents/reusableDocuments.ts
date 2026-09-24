/**
 * YOJANA SETU — REUSABLE DOCUMENT VAULT DEFINITIONS
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The Document Vault remains the SINGLE document store. Registration records
 * link to these documents by id (`BusinessRegistrationRecord.documentId`) —
 * they never duplicate document data.
 */

export interface CoreDocumentDefinition {
  id: string;
  nameEn: string;
  nameHi: string;
  category: 'IDENTITY' | 'FINANCIAL' | 'BUSINESS' | 'STATUTORY';
  descriptionEn: string;
  descriptionHi: string;
}

export const CORE_REUSABLE_DOCUMENTS: CoreDocumentDefinition[] = [
  {
    id: 'aadhaar_card',
    nameEn: 'Aadhaar Card',
    nameHi: 'आधार कार्ड',
    category: 'IDENTITY',
    descriptionEn: 'Universal proof of identity, age, and domicile.',
    descriptionHi: 'पहचान, आयु एवं निवास का सार्वभौमिक प्रमाण।',
  },
  {
    id: 'pan_card',
    nameEn: 'PAN Card',
    nameHi: 'पैन कार्ड',
    category: 'IDENTITY',
    descriptionEn: 'Income tax identity required for all commercial credit sanctions.',
    descriptionHi: 'वाणिज्यिक ऋण स्वीकृति हेतु अनिवार्य आयकर पहचान।',
  },
  {
    id: 'bank_statement',
    nameEn: 'Bank Passbook / 6-Month Statement',
    nameHi: 'बैंक पासबुक / 6 माह का विवरण',
    category: 'FINANCIAL',
    descriptionEn: 'Active savings or current account showing transaction continuity.',
    descriptionHi: 'लेन-देन निरंतरता दर्शाने वाला सक्रिय बैंक खाता।',
  },
  {
    id: 'caste_certificate',
    nameEn: 'Caste / Category Certificate',
    nameHi: 'जाति / श्रेणी प्रमाण पत्र',
    category: 'STATUTORY',
    descriptionEn: 'Competent authority certificate for SC/ST/OBC subsidy concessions.',
    descriptionHi: 'एससी/एसटी/ओबीसी सब्सिडी छूट हेतु सक्षम प्राधिकारी प्रमाण पत्र।',
  },
  {
    id: 'income_certificate',
    nameEn: 'Income Certificate / ITR',
    nameHi: 'आय प्रमाण पत्र / आईटीआर',
    category: 'FINANCIAL',
    descriptionEn: 'Revenue officer certificate or return proving family income slab.',
    descriptionHi: 'पारिवारिक आय स्लैब सत्यापित करने वाला प्राधिकृत प्रमाण।',
  },
  {
    id: 'project_report',
    nameEn: 'Detailed Project Report (DPR) / Quotation',
    nameHi: 'विस्तृत परियोजना रिपोर्ट (डीपीआर) / कोटेशन',
    category: 'BUSINESS',
    descriptionEn: 'Itemized machinery invoices, project feasibility, and working capital needs.',
    descriptionHi: 'मशीनरी कोटेशन, परियोजना व्यवहार्यता एवं कार्यशील पूंजी का विवरण।',
  },
  {
    id: 'udyam_certificate',
    nameEn: 'Udyam MSME Registration Certificate',
    nameHi: 'उद्यम एमएसएमई पंजीकरण प्रमाण पत्र',
    category: 'BUSINESS',
    descriptionEn: 'Official MSME certificate unlocking CGTMSE guarantee and subsidy.',
    descriptionHi: 'क्रेडिट गारंटी एवं ब्याज छूट हेतु आधिकारिक एमएसएमई प्रमाण।',
  },
  {
    id: 'address_proof_business',
    nameEn: 'Business Premises Proof (Rent Agreement / Utility Bill)',
    nameHi: 'व्यवसाय स्थल प्रमाण (किरायानामा / बिजली बिल)',
    category: 'BUSINESS',
    descriptionEn: 'Proof of commercial operating location or land ownership.',
    descriptionHi: 'व्यावसायिक संचालन स्थल या भूमि स्वामित्व का वैध प्रमाण।',
  },
];

/** Storage key under which the reusable vault's prepared-document ids live. */
export const VAULT_SCHEME_KEY = '__reusable_vault__';

/**
 * Custom event fired whenever the reusable vault's prepared ids change, so
 * other mounted sections (e.g. registrations) can refresh without duplicating
 * the vault store.
 */
export const VAULT_SYNC_EVENT = 'yojana_setu_vault_sync';

export function notifyVaultChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VAULT_SYNC_EVENT));
  }
}

export function getReusableDocument(id: string | undefined): CoreDocumentDefinition | undefined {
  if (!id) return undefined;
  return CORE_REUSABLE_DOCUMENTS.find((d) => d.id === id);
}
