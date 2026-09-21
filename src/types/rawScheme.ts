/**
 * YOJANA SETU — RAW SCHEME CANDIDATE TYPES
 *
 * Explicit boundary types for external/unverified candidate scheme ingestion.
 * Raw candidate records must NEVER be cast directly to Scheme (`raw as Scheme`).
 * Every field represents raw input from the discovery dataset (e.g. CSV).
 */

export interface RawSchemeCandidate {
  id?: string;
  state_or_ut?: string;
  scope?: string;
  scheme_name?: string;
  tag?: string;
  ministry?: string;
  benefit?: string;
  annual?: string | number;
  application_url?: string;
  application_type?: string;
  relevance_tier?: string;
  source_file?: string;
}

export interface CandidateDeduplicationResult {
  candidateId: string;
  existingSchemeId?: string;
  isDuplicate: boolean;
  duplicateType?: 'EXACT_ID' | 'NORMALIZED_NAME' | 'CANONICAL_SLUG' | 'OFFICIAL_URL' | 'STATE_NAME_MATCH';
  confidenceScore: number;
  notes: string;
}

export interface CandidateValidationSummary {
  candidateId: string;
  schemeName: string;
  stateOrUt: string;
  relevanceTier: string;
  isValid: boolean;
  issues: string[];
  missingFields: string[];
  sanitizedPortalUrl?: string;
  inferredCategoryCount: number;
}
