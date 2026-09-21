/**
 * YOJANA SETU V2 — SCHEME INTELLIGENCE TAXONOMY
 * 
 * Reusable constants, enums, and domain types for:
 * - Social Categories & Beneficiary Demographics
 * - Business Types, Sectors, and Industry Domains
 * - Business Stages & Enterprise Scales
 * - Financial Instruments & Scheme Classifications
 * - Funding Purposes & Entrepreneurship Objectives
 * - Data Governance & Statutory Verification Statuses
 * - Application Channels & Statutory Authorities
 */

import { SocialCategory, BusinessType, BusinessStage } from '../types';

// Re-export core types for single-point import
export type { SocialCategory, BusinessType, BusinessStage };

// ==========================================
// 1. ENTERPRISE TYPE & SCALE
// ==========================================
export type EnterpriseType = 'micro' | 'small' | 'medium' | 'nano_informal';


// ==========================================
// 2. SCHEME INSTRUMENT TYPES
// ==========================================
export type SchemeType =
  | 'Loan + Subsidy'
  | 'Grant'
  | 'Concessional Loan'
  | 'Credit Guarantee'
  | 'Venture Capital';


// ==========================================
// 3. TARGETING & DEMOGRAPHICS
// ==========================================
export type GenderTargeting = 'any' | 'women_only' | 'preferential_women' | 'men_and_women';

export type RuralUrbanApplicability = 'all' | 'rural_only' | 'urban_only' | 'rural_preferential';

export type EntrepreneurType =
  | 'first_generation'
  | 'artisan_craftsperson'
  | 'cooperative_member'
  | 'shg_member'
  | 'general_entrepreneur'
  | 'sc_st_promoter'
  | 'youth_promoter'
  | 'street_vendor';

// ==========================================
// 4. INDUSTRY SECTORS
// ==========================================
export type Sector =
  | 'msme_general'
  | 'textiles_handicrafts'
  | 'agriculture_allied'
  | 'food_processing'
  | 'technology_it'
  | 'services_hospitality'
  | 'retail_trade'
  | 'cooperatives'
  | 'heavy_engineering';


// ==========================================
// 5. FUNDING PURPOSES & BUSINESS INTELLIGENCE
// ==========================================
export type FundingPurpose =
  | 'working_capital'
  | 'machinery_equipment'
  | 'infrastructure'
  | 'skill_development'
  | 'marketing'
  | 'export'
  | 'technology_adoption'
  | 'women_entrepreneurship'
  | 'rural_entrepreneurship'
  | 'marginalized_entrepreneurship'
  | 'greenfield_setup';


// ==========================================
// 6. STATUTORY REGISTRATION REQUIREMENTS
// ==========================================
export type RegistrationRequirement =
  | 'none'
  | 'udyam_required'
  | 'gst_required'
  | 'society_registration'
  | 'trade_license';


// ==========================================
// 7. APPLICATION MODES & CHANNELS
// ==========================================
export type ApplicationMode =
  | 'Online via Portal'
  | 'Nodal Bank Branch'
  | 'District Industry Center (DIC)'
  | 'Hybrid';

// ==========================================
// 8. DATA GOVERNANCE & SOURCE VERIFICATION
// ==========================================
export type VerificationStatus =
  | 'verified'
  | 'needs_review'
  | 'outdated'
  | 'inactive'
  | 'unknown';

export type SourceType =
  | 'official_gazette'
  | 'ministry_portal'
  | 'statutory_guideline'
  | 'nodal_agency'
  | 'cabinet_notification'
  | 'secondary_aggregator';


// ==========================================
// 9. PHASE 2 — SCHEME SCOPE & CATEGORIZATION TAXONOMY
// ==========================================
export type SchemeScope = 'NATIONAL' | 'STATE_SPECIFIC';

export type SchemeVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CANDIDATE'
  | 'verified'
  | 'needs_review'
  | 'unknown';

export type NormalizedSchemeCategory =
  | 'Entrepreneurship'
  | 'MSME'
  | 'Startup'
  | 'Business Loan'
  | 'Subsidy'
  | 'Grant'
  | 'Credit Support'
  | 'Working Capital'
  | 'Equipment / Machinery'
  | 'Manufacturing'
  | 'Services'
  | 'Agriculture & Allied Enterprise'
  | 'Food Processing'
  | 'Handicrafts / Artisans'
  | 'Women Entrepreneurship'
  | 'SC/ST Entrepreneurship'
  | 'Rural Entrepreneurship'
  | 'Skill & Self Employment'
  | 'Market / Export Support'
  | 'Infrastructure'
  | 'Technology / Digitalization';

export const NORMALIZED_SCHEME_CATEGORIES: NormalizedSchemeCategory[] = [
  'Entrepreneurship',
  'MSME',
  'Startup',
  'Business Loan',
  'Subsidy',
  'Grant',
  'Credit Support',
  'Working Capital',
  'Equipment / Machinery',
  'Manufacturing',
  'Services',
  'Agriculture & Allied Enterprise',
  'Food Processing',
  'Handicrafts / Artisans',
  'Women Entrepreneurship',
  'SC/ST Entrepreneurship',
  'Rural Entrepreneurship',
  'Skill & Self Employment',
  'Market / Export Support',
  'Infrastructure',
  'Technology / Digitalization',
];


