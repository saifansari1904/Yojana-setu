/**
 * YOJANA SETU — CANDIDATE SCHEME IMPORT & INGESTION PIPELINE
 *
 * Implements the rigorous multi-stage candidate ingestion pipeline:
 * CSV Candidate Dataset
 *         ↓
 * Raw Scheme Candidate (explicit RawSchemeCandidate type, never cast 'raw as Scheme')
 *         ↓
 * Parser / Sanitizer (RFC-4180 parsing)
 *         ↓
 * Normalizer (map to canonical Scheme interface with conservative trust profile)
 *         ↓
 * Deduplicator (cross-reconciliation against authoritative SCHEMES_DATABASE)
 *         ↓
 * Schema Validator (enforce invariants, detect missing fields)
 *         ↓
 * Source & Provenance Classifier (assign Candidate/Unverified trust profile, domain verification)
 *         ↓
 * Canonical Scheme Intelligence Output
 */

import { Scheme } from '../../types';
import { RawSchemeCandidate, CandidateDeduplicationResult } from '../../types/rawScheme';
import { parseSchemeCandidateCSV } from './csvParser';
import { normalizeCandidateScheme } from './candidateNormalizer';
import { deduplicateCandidateSchemes } from './candidateDeduplication';
import { validateScheme, DatabaseValidationResult } from '../../data/schemeValidation';
import { SCHEMES_DATABASE } from '../../data/schemes';

export interface CandidateImportReport {
  timestamp: string;
  totalRawRecords: number;
  successfullyNormalized: number;
  totalValidRecords: number;
  quarantinedCount: number;
  potentialDuplicatesCount: number;
  duplicates: CandidateDeduplicationResult[];
  relevanceTiers: {
    tierA_directEnterprise: number;
    tierB_livelihoodAgri: number;
    tierC_capabilityEnabling: number;
  };
  scopes: {
    national: number;
    stateSpecific: number;
  };
  stateDistribution: { [state: string]: number };
  trustSummary: {
    unverifiedCount: number;
    verifiedCount: number;
    sourceHierarchyLevel: number;
    freshnessStatus: string;
    confidenceLevel: string;
  };
  validationIssues: { schemeId: string; field: string; message: string }[];
  processedCandidates: Scheme[];
}

/**
 * Executes the complete candidate scheme import pipeline from raw CSV text.
 */
export function runCandidateSchemeImportPipeline(
  csvContent: string,
  existingSchemes: Scheme[] = SCHEMES_DATABASE
): CandidateImportReport {
  // Step 1: Parse CSV into strongly-typed RawSchemeCandidate objects
  const rawCandidates: RawSchemeCandidate[] = parseSchemeCandidateCSV(csvContent);

  // Step 2: Normalize raw candidate records to canonical Scheme interface
  const normalizedSchemes: Scheme[] = rawCandidates.map((raw) =>
    normalizeCandidateScheme(raw)
  );

  // Step 3: Deduplicate against existing authoritative database
  const deduplicationResult = deduplicateCandidateSchemes(
    normalizedSchemes,
    existingSchemes
  );
  const reconciledSchemes = deduplicationResult.reconciledCandidates;

  // Step 4: Validate each candidate against Yojana Setu schema invariants
  const validationIssues: { schemeId: string; field: string; message: string }[] = [];
  const validCandidates: Scheme[] = [];
  let quarantinedCount = 0;

  for (const candidate of reconciledSchemes) {
    const valResult = validateScheme(candidate);
    if (valResult.isValid) {
      validCandidates.push(candidate);
    } else {
      // Collect errors
      valResult.errors.forEach((err) => {
        validationIssues.push({
          schemeId: err.schemeId,
          field: err.field,
          message: err.message,
        });
      });
      // In candidate discovery, record valid or flag
      if (valResult.errors.length > 0) {
        quarantinedCount++;
      } else {
        validCandidates.push(candidate);
      }
    }
  }

  // Step 5: Calculate State, Tier & Trust distributions
  const stateDistribution: { [state: string]: number } = {};
  const relevanceTiers = {
    tierA_directEnterprise: 0,
    tierB_livelihoodAgri: 0,
    tierC_capabilityEnabling: 0,
  };
  const scopes = {
    national: 0,
    stateSpecific: 0,
  };

  for (const s of reconciledSchemes) {
    const stateKey = s.applicableStates.length === 0 ? 'National' : s.applicableStates[0];
    stateDistribution[stateKey] = (stateDistribution[stateKey] || 0) + 1;

    if (s.scope === 'NATIONAL') {
      scopes.national++;
    } else {
      scopes.stateSpecific++;
    }

    const tier = s.relevanceTier || '';
    if (tier.startsWith('A')) {
      relevanceTiers.tierA_directEnterprise++;
    } else if (tier.startsWith('B')) {
      relevanceTiers.tierB_livelihoodAgri++;
    } else if (tier.startsWith('C')) {
      relevanceTiers.tierC_capabilityEnabling++;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalRawRecords: rawCandidates.length,
    successfullyNormalized: normalizedSchemes.length,
    totalValidRecords: validCandidates.length,
    quarantinedCount,
    potentialDuplicatesCount: deduplicationResult.potentialDuplicateCount,
    duplicates: deduplicationResult.duplicateAudit,
    relevanceTiers,
    scopes,
    stateDistribution,
    trustSummary: {
      unverifiedCount: reconciledSchemes.length,
      verifiedCount: 0, // Strict rule: Zero candidate schemes are marked verified!
      sourceHierarchyLevel: 6, // Unverified third-party discovery
      freshnessStatus: 'UNKNOWN',
      confidenceLevel: 'LOW',
    },
    validationIssues,
    processedCandidates: reconciledSchemes,
  };
}
