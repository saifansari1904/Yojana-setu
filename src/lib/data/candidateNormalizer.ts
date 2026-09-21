/**
 * YOJANA SETU — CANDIDATE SCHEME NORMALIZER & TRUST ENGINE INTEGRATION
 *
 * Transforms RawSchemeCandidate records into canonical Scheme intelligence objects.
 * Strict invariants:
 * 1. Treats all candidate data as UNVERIFIED / CANDIDATE.
 * 2. Never marks as VERIFIED or AUTHORITATIVE without primary government gazette proof.
 * 3. Never invents mandatory blockers or false eligibility criteria.
 * 4. Preserves origin provenance and relevance tier.
 * 5. Uses Government Authority Registry for domain classification.
 */

import { Scheme, SocialCategory, BusinessType, BusinessStage } from '../../types';
import { RawSchemeCandidate, CandidateValidationSummary } from '../../types/rawScheme';
import { SchemeType, ApplicationMode, NormalizedSchemeCategory } from '../../data/schemeTaxonomy';
import { classifyUrlSafety } from './trustEngine';
import { findAuthorityForUrl, findAuthorityByDomain } from '../../data/governmentAuthorities';

/**
 * Derives a clean, URL-safe slug from scheme ID or name.
 */
export function sanitizeSchemeId(rawId?: string, schemeName?: string): string {
  if (rawId && rawId.trim()) {
    return rawId
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  if (schemeName && schemeName.trim()) {
    return schemeName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  return `candidate-scheme-${Date.now()}`;
}

/**
 * Extracts a concise short code from scheme name.
 */
export function deriveShortCode(schemeName: string, rawId?: string): string {
  if (!schemeName) return rawId?.toUpperCase().slice(0, 10) || 'SCHEME';

  // Check for common abbreviations inside parentheses, e.g. "PMMSY" in "PM Matsya Sampada Yojana (PMMSY)"
  const parenMatch = schemeName.match(/\(([A-Za-z0-9&/-]+)\)/);
  if (parenMatch && parenMatch[1] && parenMatch[1].length <= 15) {
    return parenMatch[1].toUpperCase();
  }

  // Check for em-dash / hyphen prefix, e.g. "PMMSY — PM Matsya Sampada"
  const dashMatch = schemeName.match(/^([A-Za-z0-9&/-]{2,12})\s*[-—]/);
  if (dashMatch && dashMatch[1]) {
    return dashMatch[1].toUpperCase();
  }

  // Generate acronym from uppercase letters or words
  const words = schemeName
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !['and', 'for', 'of', 'in', 'the', 'yojana', 'scheme'].includes(w.toLowerCase()));

  if (words.length > 0) {
    const acronym = words.slice(0, 4).map((w) => w[0].toUpperCase()).join('');
    if (acronym.length >= 2) return acronym;
  }

  return rawId?.toUpperCase().replace(/_/g, '-').slice(0, 12) || 'SCHEME';
}

/**
 * Informs funding type based on benefit text and tags.
 */
export function inferSchemeType(benefitText: string = '', tagsText: string = ''): SchemeType {
  const combined = `${benefitText} ${tagsText}`.toLowerCase();

  if (combined.includes('credit guarantee') || combined.includes('guarantee cover')) {
    return 'Credit Guarantee';
  }
  if (combined.includes('venture capital') || combined.includes('equity')) {
    return 'Venture Capital';
  }
  if (combined.includes('subsidy') && (combined.includes('loan') || combined.includes('credit') || combined.includes('bank'))) {
    return 'Loan + Subsidy';
  }
  if (combined.includes('subsidy') || combined.includes('grant') || combined.includes('financial assistance')) {
    return 'Grant';
  }
  if (combined.includes('interest subvention') || combined.includes('concessional') || combined.includes('soft loan')) {
    return 'Concessional Loan';
  }
  return 'Loan + Subsidy';
}

/**
 * Extracts monetary cap from raw annual field or benefit summary.
 */
export function parseFundingAmounts(annualRaw?: string | number, benefitText: string = ''): { minAmount: number; maxAmount: number; rangeText: string } {
  let maxAmount = 0;
  if (typeof annualRaw === 'number' && !isNaN(annualRaw) && annualRaw > 0) {
    maxAmount = annualRaw;
  } else if (typeof annualRaw === 'string' && annualRaw.trim()) {
    const num = parseFloat(annualRaw.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      maxAmount = num;
    }
  }

  // If annual field was 0 or unrecorded, scan benefit text for explicit Lakh/Crore amounts
  if (maxAmount === 0 && benefitText) {
    const croreMatch = benefitText.match(/₹?\s*([0-9.]+)\s*(?:cr|crore)/i);
    const lakhMatch = benefitText.match(/₹?\s*([0-9.]+)\s*(?:lakh|lac)/i);
    const directRupeeMatch = benefitText.match(/₹\s*([0-9,]+)/);

    if (croreMatch && croreMatch[1]) {
      maxAmount = Math.round(parseFloat(croreMatch[1]) * 10000000);
    } else if (lakhMatch && lakhMatch[1]) {
      maxAmount = Math.round(parseFloat(lakhMatch[1]) * 100000);
    } else if (directRupeeMatch && directRupeeMatch[1]) {
      const parsed = parseInt(directRupeeMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxAmount = parsed;
      }
    }
  }

  // Fallback discovery baseline if entirely unmentioned
  if (maxAmount <= 0) {
    maxAmount = 100000; // ₹1,00,000 baseline discovery placeholder
  }

  const rangeText = maxAmount >= 10000000
    ? `Up to ₹${(maxAmount / 10000000).toFixed(1)} Crore`
    : maxAmount >= 100000
    ? `Up to ₹${(maxAmount / 100000).toFixed(1)} Lakh`
    : `Up to ₹${maxAmount.toLocaleString('en-IN')}`;

  return {
    minAmount: 0,
    maxAmount,
    rangeText,
  };
}

/**
 * Extracts or sanitizes an official/valid portal URL from raw text.
 */
export function sanitizePortalUrl(rawUrl?: string, stateOrUt?: string, ministry?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return resolveDefaultPortal(stateOrUt);
  }

  const clean = rawUrl.trim();

  // 1. Direct valid HTTP/HTTPS URL
  const httpMatch = clean.match(/https?:\/\/[^\s,/]+/i);
  if (httpMatch) {
    return httpMatch[0];
  }

  // 2. Domain pattern in text (e.g. "fisheries.and.nic.in / District Office")
  const domainMatch = clean.match(/([a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[a-z0-9_-]+)*)/i);
  if (domainMatch && domainMatch[1] && domainMatch[1].includes('.')) {
    const candidateDomain = domainMatch[1].toLowerCase();
    // Verify it's a plausible domain (has a recognized TLD or structure)
    if (
      candidateDomain.endsWith('.gov.in') ||
      candidateDomain.endsWith('.nic.in') ||
      candidateDomain.endsWith('.in') ||
      candidateDomain.endsWith('.org') ||
      candidateDomain.endsWith('.org.in') ||
      candidateDomain.endsWith('.coop') ||
      candidateDomain.endsWith('.com') ||
      candidateDomain.endsWith('.net')
    ) {
      return `https://${candidateDomain}`;
    }
  }

  // 3. Fallback to state or central government portal
  return resolveDefaultPortal(stateOrUt);
}

function resolveDefaultPortal(stateOrUt?: string): string {
  if (!stateOrUt || stateOrUt.toLowerCase() === 'national') {
    return 'https://myscheme.gov.in';
  }

  const stateSlugs: { [key: string]: string } = {
    'andaman & nicobar': 'https://andaman.gov.in',
    'andhra pradesh': 'https://ap.gov.in',
    'arunachal pradesh': 'https://arunachalpradesh.gov.in',
    'assam': 'https://assam.gov.in',
    'bihar': 'https://bihar.gov.in',
    'chandigarh': 'https://chandigarh.gov.in',
    'chhattisgarh': 'https://cgstate.gov.in',
    'delhi': 'https://delhi.gov.in',
    'goa': 'https://goa.gov.in',
    'gujarat': 'https://gujarat.gov.in',
    'haryana': 'https://haryana.gov.in',
    'himachal pradesh': 'https://himachal.nic.in',
    'jammu & kashmir': 'https://jk.gov.in',
    'jharkhand': 'https://jharkhand.gov.in',
    'karnataka': 'https://karnataka.gov.in',
    'kerala': 'https://kerala.gov.in',
    'ladakh': 'https://ladakh.nic.in',
    'madhya pradesh': 'https://mp.gov.in',
    'maharashtra': 'https://maharashtra.gov.in',
    'manipur': 'https://manipur.gov.in',
    'meghalaya': 'https://meghalaya.gov.in',
    'mizoram': 'https://mizoram.gov.in',
    'nagaland': 'https://nagaland.gov.in',
    'odisha': 'https://odisha.gov.in',
    'puducherry': 'https://py.gov.in',
    'punjab': 'https://punjab.gov.in',
    'rajasthan': 'https://rajasthan.gov.in',
    'sikkim': 'https://sikkim.gov.in',
    'tamil nadu': 'https://tn.gov.in',
    'telangana': 'https://telangana.gov.in',
    'tripura': 'https://tripura.gov.in',
    'uttar pradesh': 'https://up.gov.in',
    'uttarakhand': 'https://uk.gov.in',
    'west bengal': 'https://wb.gov.in',
  };

  const key = stateOrUt.trim().toLowerCase();
  return stateSlugs[key] || 'https://myscheme.gov.in';
}

/**
 * Infers target social categories from tags and benefit text.
 * INVARIANT: Does NOT invent restrictive blockers! If not specified or general,
 * includes all standard categories to ensure candidate schemes remain open for citizen discovery.
 */
export function inferTargetCategories(tagText: string = '', benefitText: string = '', schemeName: string = ''): SocialCategory[] {
  const combined = `${tagText} ${benefitText} ${schemeName}`.toLowerCase();
  const categories: Set<SocialCategory> = new Set();

  const isWomenOnly = combined.includes('women only') || combined.includes('mahila only');
  const isScStOnly = combined.includes('sc/st only') || combined.includes('tribal only');

  if (combined.includes('woman') || combined.includes('women') || combined.includes('mahila') || combined.includes('shg')) {
    categories.add('Woman');
  }
  if (combined.includes('sc') || combined.includes('scheduled caste') || combined.includes('dalit')) {
    categories.add('SC');
  }
  if (combined.includes('st') || combined.includes('scheduled tribe') || combined.includes('tribal') || combined.includes('pvtg') || combined.includes('adivasi')) {
    categories.add('ST');
  }
  if (combined.includes('obc') || combined.includes('backward class') || combined.includes('artisan') || combined.includes('weaver') || combined.includes('fishermen')) {
    categories.add('OBC');
  }
  if (combined.includes('minority') || combined.includes('minorities') || combined.includes('muslim') || combined.includes('christian') || combined.includes('sikh')) {
    categories.add('Minority');
  }

  // If no specific group targeted or general entrepreneurship: inclusive defaults
  if (categories.size === 0 || (!isWomenOnly && !isScStOnly)) {
    categories.add('General');
    categories.add('OBC');
    categories.add('SC');
    categories.add('ST');
    categories.add('Woman');
    categories.add('Minority');
  }

  return Array.from(categories);
}

/**
 * Infers business types from candidate tags and scheme metadata.
 */
export function inferTargetBusinessTypes(tagText: string = '', benefitText: string = '', schemeName: string = ''): BusinessType[] {
  const combined = `${tagText} ${benefitText} ${schemeName}`.toLowerCase();
  const types: Set<BusinessType> = new Set();

  if (combined.includes('handicraft') || combined.includes('artisan') || combined.includes('weaver') || combined.includes('craft') || combined.includes('khadi') || combined.includes('vishwakarma')) {
    types.add('handicraft');
  }
  if (combined.includes('agri') || combined.includes('farm') || combined.includes('fisher') || combined.includes('crop') || combined.includes('dairy') || combined.includes('animal') || combined.includes('horticulture') || combined.includes('sericulture')) {
    types.add('agri');
  }
  if (combined.includes('food') || combined.includes('processing') || combined.includes('bakery') || combined.includes('spice') || combined.includes('cold storage')) {
    types.add('food');
  }
  if (combined.includes('tech') || combined.includes('software') || combined.includes('digital') || combined.includes('innovation') || combined.includes('startup')) {
    types.add('tech');
  }
  if (combined.includes('trade') || combined.includes('retail') || combined.includes('shop') || combined.includes('vendor') || combined.includes('commercial')) {
    types.add('trading');
  }
  if (combined.includes('service') || combined.includes('tourism') || combined.includes('homestay') || combined.includes('transport') || combined.includes('e-rickshaw') || combined.includes('clinic')) {
    types.add('services');
  }
  if (combined.includes('manufactur') || combined.includes('industry') || combined.includes('unit') || combined.includes('production') || combined.includes('factory') || combined.includes('enterprise') || combined.includes('msme')) {
    types.add('manufacturing');
  }

  // Inclusive default if no specific industry is singled out
  if (types.size === 0) {
    types.add('manufacturing');
    types.add('services');
    types.add('trading');
  }

  return Array.from(types);
}

/**
 * Normalizes tags array from raw tag string.
 */
export function parseTags(rawTag?: string): string[] {
  if (!rawTag) return ['candidate', 'discovery'];
  return rawTag
    .split(/[/,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

/**
 * Transforms a single RawSchemeCandidate into a canonical Scheme object.
 */
export function normalizeCandidateScheme(raw: RawSchemeCandidate): Scheme {
  const cleanId = sanitizeSchemeId(raw.id, raw.scheme_name);
  const cleanName = raw.scheme_name?.trim() || 'Candidate Scheme';
  const shortCode = deriveShortCode(cleanName, raw.id);
  const sponsoringMinistry = raw.ministry?.trim() || 'State Government Department (Candidate Discovery)';
  const benefitSummary = raw.benefit?.trim() || 'Government assistance and developmental support for enterprise and livelihood activities.';
  const tags = parseTags(raw.tag);

  // Scope & State applicability
  const isNational = raw.scope?.trim().toLowerCase() === 'national' || raw.state_or_ut?.trim().toLowerCase() === 'national';
  const applicableStates = isNational || !raw.state_or_ut ? [] : [raw.state_or_ut.trim()];
  const scope = isNational ? 'NATIONAL' : 'STATE_SPECIFIC';

  // Financial info
  const funding = parseFundingAmounts(raw.annual, benefitSummary);
  const schemeType = inferSchemeType(benefitSummary, raw.tag);

  // Portal & Application URL
  const portalUrl = sanitizePortalUrl(raw.application_url, raw.state_or_ut, raw.ministry);
  const applicationMode: ApplicationMode = raw.application_type?.trim().toLowerCase() === 'online'
    ? 'Online via Portal'
    : 'District Industry Center (DIC)';

  // Demographics & Targeting (inclusive, non-blocking)
  const targetCategories = inferTargetCategories(raw.tag, benefitSummary, cleanName);
  const targetBusinessTypes = inferTargetBusinessTypes(raw.tag, benefitSummary, cleanName);

  // URL Safety & Provenance
  const urlSafety = classifyUrlSafety(portalUrl);

  // Build trust profile (Mandatory: Level 6, UNVERIFIED, UNKNOWN Freshness)
  const trustProfile = {
    source: {
      sourceName: 'Yojana Sahay Candidate Extraction',
      sourceType: 'secondary_aggregator',
      sourceUrl: raw.source_file || 'candidate_extraction.csv',
      hierarchyLevel: 6 as const,
      isOfficialGovernmentSource: false,
    },
    officialSource: {
      ministryOrDepartment: sponsoringMinistry,
      implementingAgency: raw.application_url?.includes('/') ? raw.application_url.split('/')[0].trim() : undefined,
      officialPortalUrl: portalUrl,
      isGovernmentDomain: urlSafety === 'OFFICIAL_GOVERNMENT',
    },
    verification: {
      status: 'UNVERIFIED' as const,
      verifiedAt: null,
      verifiedBy: 'System Candidate Ingestion Pipeline',
      verifiedFields: [],
      unverifiedFields: ['eligibility', 'fundingCap', 'documentChecklist', 'guidelines'],
      notes: 'Imported as candidate discovery scheme. Authoritative primary government verification required before official certification.',
    },
    freshness: {
      status: 'UNKNOWN' as const,
      lastVerifiedAt: null,
      nextReviewAt: null,
      daysSinceVerification: null,
      freshnessLabel: 'Candidate record — verification unrecorded',
    },
    confidence: 'LOW' as const,
    entrepreneurRelevance: 'CORE_ENTREPRENEUR' as const,
    urlSafety,
  };

  // Structured Intelligence Model
  const intelligence = {
    identity: {
      id: cleanId,
      schemeName: cleanName,
      shortCode,
      officialSchemeIdentifier: raw.id || cleanId,
      sponsoringMinistry,
      department: sponsoringMinistry,
      schemeType,
      description: benefitSummary,
      benefitSummary,
    },
    targeting: {
      socialCategory: targetCategories,
      genderTargeting: cleanName.toLowerCase().includes('women') || cleanName.toLowerCase().includes('mahila') ? ('preferential_women' as const) : ('any' as const),
      businessType: targetBusinessTypes,
      businessStage: ['idea', 'new', 'existing', 'expanding'] as BusinessStage[],
      enterpriseType: ['micro', 'small', 'nano_informal'] as any,
      ruralUrbanApplicability: 'all' as const,
      stateApplicability: applicableStates,
      sector: ['msme_general'] as any,
      entrepreneurType: ['general_entrepreneur'] as any,
    },
    financial: {
      minFunding: funding.minAmount,
      maxFunding: funding.maxAmount,
      fundingRangeText: funding.rangeText,
      interestRate: 0,
      tenureYears: 5,
      moratoriumMonths: 6,
    },
    eligibility: {
      minAge: 18,
      maxAge: 99,
      maxAnnualIncomeCap: 0, // 0 denotes no limit
      targetCategories,
      targetBusinessTypes,
      applicableStates,
      registrationRequirement: 'none' as const,
      mandatoryCriteria: [], // INVARIANT: No invented mandatory criteria!
    },
    application: {
      requiredDocuments: ['Aadhaar Card', 'Identity Proof', 'Address Proof'],
      applicationMode,
      officialApplicationUrl: portalUrl,
      bankChannelInformation: raw.application_url || 'Nearest designated implementing agency / bank branch',
    },
    governance: {
      officialSourceUrl: portalUrl,
      sourceName: 'Yojana Sahay Candidate Extraction',
      sourceType: 'secondary_aggregator' as any,
      lastVerifiedDate: '',
      verificationStatus: 'unknown' as any,
      isActive: true,
      dataVersion: 'candidate-2026.09',
      lastUpdatedDate: '2026-09-21',
      sourceNotes: `Source: ${raw.source_file || 'CSV extraction'}. Raw ID: ${raw.id}. Raw URL notes: ${raw.application_url}`,
    },
  };

  const scheme: Scheme = {
    id: cleanId,
    name: cleanName,
    shortCode,
    sponsoringMinistry,
    schemeType,
    benefitSummary,
    fundingRangeText: funding.rangeText,
    minAmount: funding.minAmount,
    maxAmount: funding.maxAmount,
    baseInterestRate: 0,
    standardTenureYears: 5,
    moratoriumPeriodMonths: 6,
    targetCategories,
    minAge: 18,
    maxAge: 99,
    maxAnnualIncomeCap: 0,
    targetBusinessTypes,
    applicableStates,
    requiredDocuments: ['Aadhaar Card', 'Identity Proof', 'Address Proof'],
    officialPortalUrl: portalUrl,
    lastVerifiedDate: '',
    applicationMode,
    isWomenSpecific: targetCategories.length === 1 && targetCategories[0] === 'Woman',
    purpose: benefitSummary.slice(0, 120),
    tags,
    mandatoryCriteria: [], // Zero invented blockers

    // Scope & Provenance
    scope,
    sourceProvenance: {
      sourceName: 'Yojana Sahay Candidate Dataset',
      sourceType: 'secondary_aggregator',
      officialSourceUrl: portalUrl,
      isOfficialGovernmentSource: false,
      priorityLevel: 5,
      verificationStatus: 'UNVERIFIED',
      lastVerifiedDate: '',
      sourceNotes: `Candidate scheme extracted from ${raw.source_file || 'CSV extraction'}. Raw ID: ${raw.id}.`,
    },

    // Extended Scheme Intelligence & Trust
    description: benefitSummary,
    intelligence,
    trustProfile,

    // Candidate Discovery Metadata
    relevanceTier: raw.relevance_tier || 'A — direct enterprise/finance',
    isCandidateScheme: true,
    candidateSourceFile: raw.source_file,
    rawCandidateId: raw.id,
  };

  return scheme;
}
