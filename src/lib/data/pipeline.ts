import type { Scheme } from '../../types/scheme';
import { normalizeScheme, deduplicateSchemes, calculateDatasetMetadata, generateCompletenessReport, type DatasetMetadata, type CompletenessReport } from './normalization';
import { validateSchemesDatabase, type DatabaseValidationResult } from '../../data/schemeValidation';

interface PipelineExecutionResult {
  success: boolean;
  rawInputCount: number;
  normalizedCount: number;
  deduplicatedCount: number;
  duplicateDetails: { id: string; name: string; reason: string }[];
  validation: DatabaseValidationResult;
  metadata: DatasetMetadata;
  completenessReport: CompletenessReport;
  processedSchemes: Scheme[];
}

/**
 * Reusable import and normalization pipeline for government schemes.
 * Executes: Parser/Sanitizer -> Normalizer -> Deduplicator -> Validator -> Metadata Generation
 */
export function runSchemeImportPipeline(rawSchemes: Partial<Scheme>[]): PipelineExecutionResult {
  const rawInputCount = rawSchemes.length;

  // 1. Normalization Step
  const normalizedSchemes: Scheme[] = rawSchemes.map((raw) => normalizeScheme(raw as Scheme));
  const normalizedCount = normalizedSchemes.length;

  // 2. Deduplication Step
  const deduplicationResult = deduplicateSchemes(normalizedSchemes);
  const deduplicatedSchemes = deduplicationResult.uniqueSchemes;

  // 3. Validation Step
  const validationResult = validateSchemesDatabase(deduplicatedSchemes);

  // 4. Intelligence Metadata & Completeness Reporting
  const metadata = calculateDatasetMetadata(deduplicatedSchemes);
  const completenessReport = generateCompletenessReport(deduplicatedSchemes);

  return {
    success: validationResult.isValid,
    rawInputCount,
    normalizedCount,
    deduplicatedCount: deduplicatedSchemes.length,
    duplicateDetails: deduplicationResult.duplicateDetails,
    validation: validationResult,
    metadata,
    completenessReport,
    processedSchemes: deduplicatedSchemes,
  };
}
