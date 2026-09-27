/**
 * YOJANA SETU — GOVERNMENT AUTHORITY & NODAL AGENCY REGISTRY
 *
 * THE single authoritative registry of government ministries, state
 * departments, statutory bodies, and external institutions. Every URL /
 * domain trust decision in the app (trustEngine.classifyUrlSafety,
 * trustEngine.classifySourceHierarchy, normalization.getSchemeProvenance,
 * commandCenter classifyPortalDomain, applicationPreparation) consumes this
 * registry — no consumer may keep its own hard-coded trusted-domain list.
 *
 * Rules:
 * 1. .gov.in and .nic.in domains are official government portals.
 * 2. Academic domains (.ac.in, .edu.in) are ACADEMIC_INSTITUTION and isOfficialGovernment = false.
 * 3. Specific authorized state nodal partner portals (e.g. TNAU) are designated explicitly.
 * 4. Aggregators are explicitly classified with isOfficialGovernment = false.
 * 5. Hostnames are normalized (lowercase, trimmed, trailing dots stripped)
 *    and matched by exact hostname or domain boundary only — substring
 *    matching is never used, so fake-sidbi.in, sidbi.in.attacker.com and
 *    attacker-sidbi.in never match sidbi.in.
 */

import { GovernmentAuthority } from '../types/authority';

/**
 * Normalizes a hostname for safe comparison: lowercases, trims whitespace,
 * and strips trailing dots. Never strips subdomains — www.sidbi.in stays a
 * subdomain and matches via domain-boundary rules, it is not collapsed to
 * sidbi.in.
 */
export function normalizeHostname(hostname: string): string {
  if (!hostname || typeof hostname !== 'string') return '';
  return hostname.toLowerCase().trim().replace(/\.+$/, '');
}

export const GOVERNMENT_AUTHORITY_REGISTRY: GovernmentAuthority[] = [
  // =================================================================
  // 1. CENTRAL MINISTRIES (isOfficialGovernment: true)
  // =================================================================
  {
    authorityId: 'auth_msme_goi',
    name: 'Ministry of Micro, Small & Medium Enterprises',
    domain: 'msme.gov.in',
    domainPatterns: ['msme.gov.in', 'champions.gov.in', 'udyamregistration.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of MSME',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'msme.gov.in': 1 },
  },
  {
    authorityId: 'auth_finance_goi',
    name: 'Ministry of Finance, Government of India',
    domain: 'finmin.nic.in',
    domainPatterns: ['finmin.nic.in', 'financialservices.gov.in', 'incometax.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Finance',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_agriculture_goi',
    name: 'Ministry of Agriculture and Farmers Welfare',
    domain: 'agricoop.nic.in',
    domainPatterns: ['agricoop.nic.in', 'agriwelfare.gov.in', 'pmkisan.gov.in', 'nbm.nic.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Agriculture',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_rural_goi',
    name: 'Ministry of Rural Development',
    domain: 'rural.nic.in',
    domainPatterns: ['rural.nic.in', 'nrlm.gov.in', 'aajeevika.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Rural Development',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_fisheries_goi',
    name: 'Department of Fisheries, GoI',
    domain: 'dof.gov.in',
    domainPatterns: ['dof.gov.in', 'pmmsy.dof.gov.in', 'nfdb.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Fisheries, Animal Husbandry & Dairying',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_tribal_goi',
    name: 'Ministry of Tribal Affairs',
    domain: 'tribal.nic.in',
    domainPatterns: ['tribal.nic.in', 'trifed.tribal.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Tribal Affairs',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_minority_goi',
    name: 'Ministry of Minority Affairs',
    domain: 'minorityaffairs.gov.in',
    domainPatterns: ['minorityaffairs.gov.in', 'naimanzil.gov.in', 'usttad.amitsha.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Minority Affairs',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_social_justice_goi',
    name: 'Ministry of Social Justice and Empowerment',
    domain: 'socialjustice.gov.in',
    domainPatterns: ['socialjustice.gov.in', 'nsfdc.nic.in', 'nbcfdc.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Social Justice and Empowerment',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_food_processing_goi',
    name: 'Ministry of Food Processing Industries',
    domain: 'mofpi.gov.in',
    domainPatterns: ['mofpi.gov.in', 'pmfme.mofpi.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Food Processing Industries',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_textiles_goi',
    name: 'Ministry of Textiles',
    domain: 'texmin.nic.in',
    domainPatterns: ['texmin.nic.in', 'handlooms.nic.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Textiles',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_myscheme_goi',
    name: 'National myScheme Citizen Discovery Portal (NeGD / MeitY)',
    domain: 'myscheme.gov.in',
    domainPatterns: ['myscheme.gov.in', 'india.gov.in'],
    authorityType: 'CENTRAL_MINISTRY',
    ministry: 'Ministry of Electronics and Information Technology',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'myscheme.gov.in': 1, 'india.gov.in': 1 },
    // Candidate discovery records were harvested from this portal: it must
    // never elevate a candidate to Level 1 on the strength of its own URL.
    candidateGuardedPatterns: ['myscheme.gov.in'],
  },

  // =================================================================
  // 2. STATUTORY BODIES & IMPLEMENTING AGENCIES
  // =================================================================
  {
    authorityId: 'auth_sidbi',
    name: 'Small Industries Development Bank of India (SIDBI)',
    domain: 'sidbi.in',
    domainPatterns: ['sidbi.in', 'standupmitra.in', 'jansamarth.in'],
    authorityType: 'STATUTORY_BODY',
    active: true,
    isOfficialGovernment: true,
    isKnownNodalAgency: true,
    patternHierarchyLevels: { 'sidbi.in': 4, 'standupmitra.in': 1 },
  },
  {
    authorityId: 'auth_cgtmse',
    name: 'Credit Guarantee Fund Trust for Micro and Small Enterprises',
    domain: 'cgtmse.in',
    domainPatterns: ['cgtmse.in'],
    authorityType: 'STATUTORY_BODY',
    ministry: 'Ministry of MSME / SIDBI',
    active: true,
    isOfficialGovernment: true,
    isKnownNodalAgency: true,
    patternHierarchyLevels: { 'cgtmse.in': 4 },
  },
  {
    authorityId: 'auth_mudra',
    name: 'Micro Units Development & Refinance Agency (MUDRA)',
    domain: 'mudra.org.in',
    domainPatterns: ['mudra.org.in'],
    authorityType: 'STATUTORY_BODY',
    ministry: 'Ministry of Finance / SIDBI',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'mudra.org.in': 4 },
  },
  {
    authorityId: 'auth_kvic',
    name: 'Khadi and Village Industries Commission',
    domain: 'kvic.gov.in',
    domainPatterns: ['kvic.gov.in', 'kviconline.gov.in'],
    authorityType: 'STATUTORY_BODY',
    ministry: 'Ministry of MSME',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_nabard',
    name: 'National Bank for Agriculture and Rural Development',
    domain: 'nabard.org',
    domainPatterns: ['nabard.org'],
    authorityType: 'STATUTORY_BODY',
    active: true,
    isOfficialGovernment: true,
    isKnownNodalAgency: true,
  },
  {
    authorityId: 'auth_nsfdc',
    name: 'National Scheduled Castes Finance and Development Corporation',
    domain: 'nsfdc.nic.in',
    domainPatterns: ['nsfdc.nic.in'],
    authorityType: 'PUBLIC_CORPORATION',
    ministry: 'Ministry of Social Justice and Empowerment',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_nmdfc',
    name: 'National Minorities Development & Finance Corporation',
    domain: 'nmdfc.org',
    domainPatterns: ['nmdfc.org'],
    authorityType: 'PUBLIC_CORPORATION',
    ministry: 'Ministry of Minority Affairs',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'nmdfc.org': 5 },
  },
  {
    authorityId: 'auth_scsthub',
    name: 'National SC-ST Hub (NSSH)',
    domain: 'scsthub.in',
    domainPatterns: ['scsthub.in'],
    authorityType: 'PUBLIC_CORPORATION',
    ministry: 'Ministry of MSME',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'scsthub.in': 5 },
  },
  {
    authorityId: 'auth_vcfsc',
    name: 'Venture Capital Fund for Scheduled Castes (VCFSC)',
    domain: 'vcfsc.in',
    domainPatterns: ['vcfsc.in'],
    authorityType: 'PUBLIC_CORPORATION',
    ministry: 'Ministry of Social Justice and Empowerment',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'vcfsc.in': 5 },
  },
  {
    authorityId: 'auth_ncdc',
    name: 'National Cooperative Development Corporation',
    domain: 'ncdc.in',
    domainPatterns: ['ncdc.in'],
    authorityType: 'STATUTORY_BODY',
    ministry: 'Ministry of Cooperation',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_ksfc',
    name: 'Karnataka State Financial Corporation',
    domain: 'ksfc.in',
    domainPatterns: ['ksfc.in'],
    authorityType: 'PUBLIC_CORPORATION',
    stateOrUt: 'Karnataka',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'ksfc.in': 4 },
  },
  {
    authorityId: 'auth_tiic_alt',
    name: 'Tamil Nadu Industrial Investment Corporation (alternate domain)',
    domain: 'tiic.co.in',
    domainPatterns: ['tiic.co.in'],
    authorityType: 'PUBLIC_CORPORATION',
    stateOrUt: 'Tamil Nadu',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'tiic.co.in': 4 },
  },

  // =================================================================
  // 2b. STATE BOARDS & GOVERNMENT-BACKED BODIES
  // These are explicitly trusted state bodies classified as
  // GOVERNMENT_BACKED (a distinct tier below IMPLEMENTING_AGENCY).
  // Previously hard-coded in the trust engine's Tier 3 list; centralized
  // here so the registry is the single source of truth.
  // =================================================================
  {
    authorityId: 'auth_tnsfac',
    name: 'TNSFAC State Facilitation Portal',
    domain: 'tnsfac.org',
    domainPatterns: ['tnsfac.org'],
    authorityType: 'STATE_BOARD',
    stateOrUt: 'Tamil Nadu',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_kswdc',
    name: "Kerala State Women's Development Corporation",
    domain: 'kswdc.org',
    domainPatterns: ['kswdc.org'],
    authorityType: 'STATE_BOARD',
    stateOrUt: 'Kerala',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_norkaroots',
    name: 'NORKA Roots (Government of Kerala)',
    domain: 'norkaroots.org',
    domainPatterns: ['norkaroots.org'],
    authorityType: 'STATE_BOARD',
    stateOrUt: 'Kerala',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_keralakhadi',
    name: 'Kerala Khadi & Village Industries Board',
    domain: 'keralakhadi.org',
    domainPatterns: ['keralakhadi.org'],
    authorityType: 'STATE_BOARD',
    stateOrUt: 'Kerala',
    active: true,
    isOfficialGovernment: true,
  },

  // =================================================================
  // 3. STATE DEPARTMENTS & MISSIONS (isOfficialGovernment: true)
  // =================================================================
  {
    authorityId: 'auth_karnataka_gov',
    name: 'Government of Karnataka — Industries & Commerce Dept.',
    domain: 'karnataka.gov.in',
    domainPatterns: ['karnataka.gov.in', 'cmegp.kar.nic.in', 'kctc.karnataka.gov.in', 'kum.karnataka.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Karnataka',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_tamilnadu_gov',
    name: 'Government of Tamil Nadu — MSME & Industries Dept.',
    domain: 'tn.gov.in',
    domainPatterns: ['tn.gov.in', 'msmeonline.tn.gov.in', 'tiic.org', 'taico.nic.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Tamil Nadu',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'tiic.org': 4 },
  },
  {
    authorityId: 'auth_kerala_gov',
    name: 'Government of Kerala — Industries & Commerce',
    domain: 'kerala.gov.in',
    domainPatterns: ['kerala.gov.in', 'industry.kerala.gov.in', 'startupmission.kerala.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Kerala',
    active: true,
    isOfficialGovernment: true,
    patternHierarchyLevels: { 'startupmission.kerala.gov.in': 5 },
  },
  {
    authorityId: 'auth_kudumbashree',
    name: 'Kudumbashree State Poverty Eradication Mission',
    domain: 'kudumbashree.org',
    domainPatterns: ['kudumbashree.org'],
    authorityType: 'PUBLIC_CORPORATION',
    stateOrUt: 'Kerala',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_maharashtra_gov',
    name: 'Government of Maharashtra — Industries Dept.',
    domain: 'maharashtra.gov.in',
    domainPatterns: ['maharashtra.gov.in', 'cmeegp.gov.in', 'mahasamajkalyan.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Maharashtra',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_gujarat_gov',
    name: 'Government of Gujarat — Industries & Mines Dept.',
    domain: 'gujarat.gov.in',
    domainPatterns: ['gujarat.gov.in', 'industries.gujarat.gov.in', 'glpc.gujarat.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Gujarat',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_telangana_gov',
    name: 'Government of Telangana — Industries & Commerce',
    domain: 'telangana.gov.in',
    domainPatterns: ['telangana.gov.in', 'tgipass.telangana.gov.in', 'bcwelfare.telangana.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Telangana',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_andhra_gov',
    name: 'Government of Andhra Pradesh — Industries & MSME',
    domain: 'ap.gov.in',
    domainPatterns: ['ap.gov.in', 'apindustries.gov.in', 'apscorporation.ap.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Andhra Pradesh',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_delhi_gov',
    name: 'Government of NCT of Delhi — Industries / Social Welfare',
    domain: 'delhi.gov.in',
    domainPatterns: ['delhi.gov.in', 'dkvib.delhi.gov.in', 'dscstfdc.delhi.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Delhi',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_assam_gov',
    name: 'Government of Assam — Industries & Commerce',
    domain: 'assam.gov.in',
    domainPatterns: ['assam.gov.in', 'industriescom.assam.gov.in', 'handloom.assam.gov.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Assam',
    active: true,
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_andaman_gov',
    name: 'Andaman & Nicobar Administration',
    domain: 'andaman.gov.in',
    domainPatterns: ['andaman.gov.in', 'and.nic.in', 'fisheries.and.nic.in'],
    authorityType: 'STATE_DEPARTMENT',
    stateOrUt: 'Andaman & Nicobar',
    active: true,
    isOfficialGovernment: true,
  },

  // =================================================================
  // 4. ACADEMIC INSTITUTIONS (.ac.in / .edu.in)
  // CRITICAL: Academic institutions have isOfficialGovernment = false.
  // Exception: Specific designated university knowledge portals (e.g. TNAU)
  // are tracked with academic authority type.
  // =================================================================
  {
    authorityId: 'auth_tnau_agritech',
    name: 'Tamil Nadu Agricultural University (TNAU) Agritech Portal',
    domain: 'agritech.tnau.ac.in',
    domainPatterns: ['agritech.tnau.ac.in', 'tnau.ac.in'],
    authorityType: 'ACADEMIC_INSTITUTION',
    stateOrUt: 'Tamil Nadu',
    active: true,
    // Designated state knowledge extension partner portal
    isOfficialGovernment: true,
  },
  {
    authorityId: 'auth_generic_academic',
    name: 'Indian Academic Institutions (.ac.in)',
    domain: 'ac.in',
    domainPatterns: ['ac.in'],
    authorityType: 'ACADEMIC_INSTITUTION',
    active: true,
    isOfficialGovernment: false, // General academic domains are NOT government authorities!
  },

  // =================================================================
  // 5. AGGREGATORS & CANDIDATE DATA SOURCES (isOfficialGovernment: false)
  // =================================================================
  {
    authorityId: 'auth_yojana_sahay',
    name: 'Yojana Sahay Open Discovery Dataset',
    domain: 'yojanasahay.org',
    domainPatterns: ['yojanasahay.org', 'sahay.aggregator.org'],
    authorityType: 'AGGREGATOR',
    active: true,
    isOfficialGovernment: false,
  },
];

/**
 * Matches a hostname against the registry, returning the authority and the
 * exact domain pattern that matched. Matching is exact-hostname or
 * domain-boundary only (hostname === pattern or hostname ends with
 * '.' + pattern). When several patterns match, the LONGEST (most specific)
 * pattern wins, so startupmission.kerala.gov.in matches its dedicated
 * pattern rather than the generic kerala.gov.in pattern.
 */
export function matchAuthorityByHostname(
  hostname: string
): { authority: GovernmentAuthority; matchedPattern: string } | undefined {
  const cleanHost = normalizeHostname(hostname);
  if (!cleanHost) return undefined;

  // 1. Direct match on domain (exact — always the most specific possible)
  const directMatch = GOVERNMENT_AUTHORITY_REGISTRY.find(
    (a) => normalizeHostname(a.domain) === cleanHost
  );
  if (directMatch) {
    return { authority: directMatch, matchedPattern: normalizeHostname(directMatch.domain) };
  }

  // 2. Pattern match (subdomains or domain patterns) — longest pattern wins
  let best: { authority: GovernmentAuthority; matchedPattern: string } | undefined;
  for (const auth of GOVERNMENT_AUTHORITY_REGISTRY) {
    for (const rawPat of auth.domainPatterns) {
      const pat = normalizeHostname(rawPat);
      if (!pat) continue;
      if (cleanHost === pat || cleanHost.endsWith('.' + pat)) {
        if (!best || pat.length > best.matchedPattern.length) {
          best = { authority: auth, matchedPattern: pat };
        }
      }
    }
  }

  return best;
}

/**
 * Searches the authority registry for a matching authority given a domain hostname.
 */
export function findAuthorityByDomain(hostname: string): GovernmentAuthority | undefined {
  return matchAuthorityByHostname(hostname)?.authority;
}

/**
 * Resolves the government authority corresponding to a URL string.
 */
export function findAuthorityForUrl(url?: string | null): GovernmentAuthority | undefined {
  if (!url || typeof url !== 'string') return undefined;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return findAuthorityByDomain(parsed.hostname);
  } catch {
    return undefined;
  }
}

/**
 * Retrieves all registered authorities in the system.
 */
export function getAllAuthorities(): GovernmentAuthority[] {
  return GOVERNMENT_AUTHORITY_REGISTRY;
}
