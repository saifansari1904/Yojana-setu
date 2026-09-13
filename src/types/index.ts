// Common Application Types
export * from './common';

// User Profile & Demographics
export * from './user';

// Business Profile & Need Intelligence (Phase 4.1)
export * from './business';

// Scheme Definition & Intelligence Models
export * from './scheme';

// Matching Engine & Statutory Audit Results
export * from './matching';

// Re-export core taxonomy types from schemeTaxonomy for backward compatibility
export type {
  EnterpriseType,
  GenderTargeting,
  RuralUrbanApplicability,
  Sector,
  FundingPurpose,
  RegistrationRequirement,
  VerificationStatus,
  SourceType,
  ApplicationMode,
  EntrepreneurType,
  SchemeType,
} from '../data/schemeTaxonomy';
