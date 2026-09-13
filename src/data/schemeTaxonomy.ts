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

export const ENTERPRISE_TYPE_LABELS: Record<EnterpriseType, { en: string; hi: string }> = {
  nano_informal: {
    en: 'Nano / Informal Artisan Unit',
    hi: 'नैनो / अनौपचारिक कारीगर इकाई',
  },
  micro: {
    en: 'Micro Enterprise (Investment < ₹1 Cr, Turnover < ₹5 Cr)',
    hi: 'सूक्ष्म उद्यम (निवेश < ₹1 करोड़, टर्नओवर < ₹5 करोड़)',
  },
  small: {
    en: 'Small Enterprise (Investment < ₹10 Cr, Turnover < ₹50 Cr)',
    hi: 'लघु उद्यम (निवेश < ₹10 करोड़, टर्नओवर < ₹50 करोड़)',
  },
  medium: {
    en: 'Medium Enterprise (Investment < ₹50 Cr, Turnover < ₹250 Cr)',
    hi: 'मध्यम उद्यम (निवेश < ₹50 करोड़, टर्नओवर < ₹250 करोड़)',
  },
};

// ==========================================
// 2. SCHEME INSTRUMENT TYPES
// ==========================================
export type SchemeType =
  | 'Loan + Subsidy'
  | 'Grant'
  | 'Concessional Loan'
  | 'Credit Guarantee'
  | 'Venture Capital';

export const SCHEME_TYPE_LABELS: Record<SchemeType, { en: string; hi: string }> = {
  'Loan + Subsidy': {
    en: 'Capital Margin Money Subsidy + Bank Credit',
    hi: 'पूंजीगत मार्जिन मनी सब्सिडी + बैंक ऋण',
  },
  'Grant': {
    en: 'Direct Capital Grant / Incentive',
    hi: 'प्रत्यक्ष पूंजीगत अनुदान / प्रोत्साहन',
  },
  'Concessional Loan': {
    en: 'Concessional / Subsidized Interest Loan',
    hi: 'रियायती / ब्याज अनुदान ऋण',
  },
  'Credit Guarantee': {
    en: 'Collateral-Free Credit Guarantee Cover',
    hi: 'संपार्श्विक-मुक्त ऋण गारंटी कवर',
  },
  'Venture Capital': {
    en: 'Equity / Quasi-Equity Growth Capital',
    hi: 'इक्विटी / विकास पूंजी निवेश',
  },
};

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

export const SECTOR_LABELS: Record<Sector, { en: string; hi: string }> = {
  msme_general: {
    en: 'General MSME / Cross-Sector',
    hi: 'सामान्य एमएसएमई / बहु-क्षेत्रीय',
  },
  textiles_handicrafts: {
    en: 'Handicrafts, Handlooms & Traditional Trades',
    hi: 'हस्तशिल्प, हथकरघा एवं पारंपरिक व्यापार',
  },
  agriculture_allied: {
    en: 'Agriculture, Dairy & Allied Rural Activities',
    hi: 'कृषि, डेयरी एवं संबद्ध ग्रामीण गतिविधियां',
  },
  food_processing: {
    en: 'Agro & Food Processing Units',
    hi: 'कृषि एवं खाद्य प्रसंस्करण इकाइयां',
  },
  technology_it: {
    en: 'Technology, IT & Digital Services',
    hi: 'प्रौद्योगिकी, आईटी एवं डिजिटल सेवाएं',
  },
  services_hospitality: {
    en: 'Commercial Services & Hospitality',
    hi: 'व्यावसायिक सेवाएं एवं आतिथ्य',
  },
  retail_trade: {
    en: 'Retail, Wholesale & Trading Outlets',
    hi: 'खुदरा, थोक एवं व्यापारिक प्रतिष्ठान',
  },
  cooperatives: {
    en: 'Cooperative Societies & Producer Groups',
    hi: 'सहकारी समितियां एवं उत्पादक समूह',
  },
  heavy_engineering: {
    en: 'Manufacturing, Fabrication & Engineering',
    hi: 'विनिर्माण, निर्माण एवं इंजीनियरिंग',
  },
};

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

export const FUNDING_PURPOSE_LABELS: Record<FundingPurpose, { en: string; hi: string }> = {
  greenfield_setup: {
    en: 'New Enterprise Setup (Greenfield)',
    hi: 'नए उद्यम की स्थापना (ग्रीनफील्ड)',
  },
  working_capital: {
    en: 'Working Capital & Operational Expenses',
    hi: 'कार्यशील पूंजी एवं दैनिक परिचालन खर्च',
  },
  machinery_equipment: {
    en: 'Plant, Machinery & Tool Acquisition',
    hi: 'संयंत्र, मशीनरी एवं आधुनिक उपकरण खरीद',
  },
  infrastructure: {
    en: 'Civil Works, Factory Shed & Site Infrastructure',
    hi: 'कारखाना भवन एवं बुनियादी ढांचा विकास',
  },
  technology_adoption: {
    en: 'Technology Upgradation & Digitalization',
    hi: 'प्रौद्योगिकी उन्नयन एवं डिजिटलीकरण',
  },
  women_entrepreneurship: {
    en: 'Women-Led Enterprise Development',
    hi: 'महिला नेतृत्व वाले उद्यमों का विकास',
  },
  rural_entrepreneurship: {
    en: 'Rural & Village Industry Generation',
    hi: 'ग्रामीण एवं ग्रामोद्योग रोजगार सृजन',
  },
  marginalized_entrepreneurship: {
    en: 'Affirmative Credit for SC/ST/Minorities',
    hi: 'अनुसूचित जाति/जनजाति एवं अल्पसंख्यकों हेतु सकारात्मक ऋण',
  },
  skill_development: {
    en: 'Skill Certification & Entrepreneurship Training',
    hi: 'कौशल प्रमाणन एवं उद्यमिता प्रशिक्षण',
  },
  marketing: {
    en: 'Branding, Exhibition & Market Linkage',
    hi: 'ब्रांडिंग, प्रदर्शनी एवं बाजार संपर्क',
  },
  export: {
    en: 'Export Promotion & Global Compliance',
    hi: 'निर्यात प्रोत्साहन एवं वैश्विक अनुपालन',
  },
};

// ==========================================
// 6. STATUTORY REGISTRATION REQUIREMENTS
// ==========================================
export type RegistrationRequirement =
  | 'none'
  | 'udyam_required'
  | 'gst_required'
  | 'society_registration'
  | 'trade_license';

export const REGISTRATION_REQUIREMENT_LABELS: Record<RegistrationRequirement, { en: string; hi: string }> = {
  none: {
    en: 'No Pre-Registration Mandatory at Application',
    hi: 'आवेदन के समय पूर्व-पंजीकरण अनिवार्य नहीं',
  },
  udyam_required: {
    en: 'Udyam MSME Registration Mandatory',
    hi: 'उद्यम एमएसएमई पंजीकरण अनिवार्य',
  },
  gst_required: {
    en: 'GST Registration Required',
    hi: 'जीएसटी पंजीकरण आवश्यक',
  },
  society_registration: {
    en: 'Registered Cooperative Society under State/Central Act',
    hi: 'सहकारी समिति पंजीकरण प्रमाण पत्र अनिवार्य',
  },
  trade_license: {
    en: 'Local Municipal Trade License / Skill Card',
    hi: 'स्थानीय नगर निगम व्यापार लाइसेंस / कौशल प्रमाण',
  },
};

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

export const VERIFICATION_STATUS_META: Record<
  VerificationStatus,
  { labelEn: string; labelHi: string; badgeColor: string }
> = {
  verified: {
    labelEn: 'Official Gazette / Portal Verified',
    labelHi: 'सरकारी राजपत्र / पोर्टल द्वारा सत्यापित',
    badgeColor: '#16A34A',
  },
  needs_review: {
    labelEn: 'Periodic Review Pending',
    labelHi: 'आवधिक समीक्षा लंबित',
    badgeColor: '#D97706',
  },
  outdated: {
    labelEn: 'Superseded by New Policy',
    labelHi: 'नवीन नीति द्वारा प्रतिस्थापित',
    badgeColor: '#DC2626',
  },
  inactive: {
    labelEn: 'Scheme Inactive / Concluded',
    labelHi: 'योजना निष्क्रिय / समाप्त',
    badgeColor: '#6B7280',
  },
  unknown: {
    labelEn: 'Under Statutory Verification',
    labelHi: 'वैधानिक सत्यापन प्रक्रियाधीन',
    badgeColor: '#9CA3AF',
  },
};

// ==========================================
// 9. PHASE 2 — SCHEME SCOPE & CATEGORIZATION TAXONOMY
// ==========================================
export type SchemeScope = 'NATIONAL' | 'STATE_SPECIFIC';

export type SchemeVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
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

export const NORMALIZED_SCHEME_CATEGORY_LABELS: Record<
  NormalizedSchemeCategory,
  { en: string; hi: string }
> = {
  'Entrepreneurship': {
    en: 'Entrepreneurship & Enterprise Setup',
    hi: 'उद्यमिता एवं उद्यम स्थापना',
  },
  'MSME': {
    en: 'MSME Growth & Competitiveness',
    hi: 'सूक्ष्म, लघु एवं मध्यम उद्यम',
  },
  'Startup': {
    en: 'Startups, Innovation & Seed Grants',
    hi: 'स्टार्टअप एवं नवाचार अनुदान',
  },
  'Business Loan': {
    en: 'Term Loans & Working Credit',
    hi: 'व्यावसायिक ऋण एवं कार्यशील पूंजी',
  },
  'Subsidy': {
    en: 'Capital Investment Subsidy',
    hi: 'पूंजीगत निवेश सब्सिडी',
  },
  'Grant': {
    en: 'Direct Innovation & Matching Grants',
    hi: 'प्रत्यक्ष अनुदान एवं सहायता',
  },
  'Credit Support': {
    en: 'Credit Guarantee & Collateral-Free Cover',
    hi: 'ऋण गारंटी एवं संपार्श्विक-मुक्त कवर',
  },
  'Working Capital': {
    en: 'Working Capital & Inventory Finance',
    hi: 'कार्यशील पूंजी एवं दैनिक परिचालन',
  },
  'Equipment / Machinery': {
    en: 'Plant, Machinery & Tool Acquisition',
    hi: 'संयंत्र, मशीनरी एवं उपकरण खरीद',
  },
  'Manufacturing': {
    en: 'Manufacturing & Industrial Production',
    hi: 'विनिर्माण एवं औद्योगिक उत्पादन',
  },
  'Services': {
    en: 'Commercial & Technical Services',
    hi: 'व्यावसायिक एवं तकनीकी सेवाएं',
  },
  'Agriculture & Allied Enterprise': {
    en: 'Agro-Enterprises, Dairy & Animal Husbandry',
    hi: 'कृषि उद्यम, डेयरी एवं पशुपालन',
  },
  'Food Processing': {
    en: 'Agro & Food Processing Units',
    hi: 'कृषि एवं खाद्य प्रसंस्करण इकाइयां',
  },
  'Handicrafts / Artisans': {
    en: 'Artisans, Handlooms & Traditional Crafts',
    hi: 'दस्तकार, हथकरघा एवं पारंपरिक शिल्प',
  },
  'Women Entrepreneurship': {
    en: 'Women-Led Enterprise Development',
    hi: 'महिला उद्यमिता संवर्धन',
  },
  'SC/ST Entrepreneurship': {
    en: 'Affirmative Credit for SC/ST Promoters',
    hi: 'अनुसूचित जाति/जनजाति उद्यमिता सहायता',
  },
  'Rural Entrepreneurship': {
    en: 'Rural & Village Enterprise Promotion',
    hi: 'ग्रामीण एवं ग्रामोद्योग प्रोत्साहन',
  },
  'Skill & Self Employment': {
    en: 'Skill Certification & Self-Employment',
    hi: 'कौशल विकास एवं स्वरोजगार',
  },
  'Market / Export Support': {
    en: 'Marketing, Branding & Export Support',
    hi: 'विपणन, ब्रांडिंग एवं निर्यात प्रोत्साहन',
  },
  'Infrastructure': {
    en: 'Industrial Sheds & Site Infrastructure',
    hi: 'औद्योगिक बुनियादी ढांचा विकास',
  },
  'Technology / Digitalization': {
    en: 'Technology Adoption & Digital Transformation',
    hi: 'तकनीकी उन्नयन एवं डिजिटलीकरण',
  },
};

