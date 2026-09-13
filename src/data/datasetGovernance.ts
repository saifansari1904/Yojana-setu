/**
 * YOJANA SETU — DATASET GOVERNANCE & AUDIT CHANGELOG
 *
 * Tracks version history, data freshness thresholds, statutory review cycles,
 * and change records for the scheme database.
 */

export interface DatasetChangeRecord {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  changes: string[];
  totalSchemes: number;
}

export const DATASET_VERSION = '2.5.0-government-data-trust';
export const DATASET_LAST_UPDATED = '2026-09-13';

export const DATA_CHANGE_LOG: DatasetChangeRecord[] = [
  {
    version: '1.0.0',
    releaseDate: '2024-08-15',
    title: 'Initial Central MSME Foundation Dataset',
    summary: 'Core National schemes including PMEGP, MUDRA, Stand-Up India, CGTMSE, and PM Vishwakarma.',
    changes: [
      'Established core scheme schema with financial, demographic, and document models',
      'Integrated 13 primary national schemes',
      'Configured deterministic 5-factor matching engine',
    ],
    totalSchemes: 13,
  },
  {
    version: '2.0.0',
    releaseDate: '2026-03-12',
    title: 'South India Regional Expansion',
    summary: 'Curated 26 state-specific schemes across Karnataka, Kerala, Tamil Nadu, Telangana, and Andhra Pradesh.',
    changes: [
      'Audited 219 schemes from raw Sahay repository',
      'Excluded 192 non-commercial welfare/pension schemes with documented rationale',
      'Migrated 26 high-impact MSME, artisan, and startup state schemes',
      'Established normalized category taxonomy and geographic scope filtering',
    ],
    totalSchemes: 39,
  },
  {
    version: '2.5.0-government-data-trust',
    releaseDate: '2026-09-13',
    title: 'Government Data Trust & Verification Layer',
    summary: 'Implemented authoritative trust model, 6-level source hierarchy, dynamic freshness awareness (as of Sept 2026), and data quality validation.',
    changes: [
      'Separated source origin provenance from official government statutory authority',
      'Implemented 6-level source hierarchy (Central Portal -> State Portal -> Dept -> Agency -> Govt Corp -> Aggregator)',
      'Added dynamic freshness tracking relative to September 2026 (CURRENT, DUE_FOR_REVIEW, OUTDATED, UNKNOWN)',
      'Distinguished historical verification (e.g. 2024) from current verification',
      'Created machine-readable data review queue for data maintainers',
      'Enriched UI cards and details with non-alarming data trust badges and transparency notes',
      'Reinforced legal distinction: "Potentially eligible — confirm with official authority" rather than guaranteed eligibility',
      'Zero changes to matching engine mathematical weights (20/20/20/20/20)',
    ],
    totalSchemes: 39,
  },
];
