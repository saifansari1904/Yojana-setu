/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FreshnessStatus, PortalDomainClass } from '../../types';

// Explicit known nodal domains operated by statutory government development banks / corporations
const KNOWN_NODAL_DOMAINS = [
  'sidbi.in',
  'nabard.org',
  'cgtmse.in',
  'standupmitra.in',
  'jansamarth.in',
];

// Explicit verified exceptions that are validated by official scheme notifications
const VERIFIED_EXCEPTIONS = [
  'jansamarth.gov.in',
];

/**
 * Classifies a URL domain with strict domain hardening.
 * Does NOT treat .org.in, .edu.in, .ac.in as automatically government-authoritative!
 */
export function classifyPortalDomain(url: string, isExplicitException = false): PortalDomainClass {
  if (!url || typeof url !== 'string') {
    return 'INVALID';
  }

  try {
    let hostname: string;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      hostname = new URL(`https://${url}`).hostname.toLowerCase();
    } else {
      hostname = new URL(url).hostname.toLowerCase();
    }

    if (!hostname || hostname.includes(' ') || !hostname.includes('.')) {
      return 'INVALID';
    }

    // 1. Government top-level / second-level domains
    if (hostname.endsWith('.gov.in') || hostname.endsWith('.nic.in')) {
      return 'VERIFIED_OFFICIAL';
    }

    // 2. Explicit verified exceptions through provenance metadata
    if (isExplicitException || VERIFIED_EXCEPTIONS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
      return 'VERIFIED_OFFICIAL';
    }

    // 3. Known statutory nodal platforms (e.g. SIDBI, CGTMSE, NABARD)
    if (KNOWN_NODAL_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
      return 'KNOWN_NODAL';
    }

    // 4. Broad academic / organizational / commercial domains are UNVERIFIED_EXTERNAL
    // Specific rule: .org.in, .edu.in, .ac.in are NOT government-authoritative
    return 'UNVERIFIED_EXTERNAL';
  } catch {
    return 'INVALID';
  }
}

/**
 * Calculates freshness based on audit date
 */
export function evaluateFreshness(lastAuditedDate: string): FreshnessStatus {
  if (!lastAuditedDate) return 'NEEDS_VERIFICATION';

  const auditTime = new Date(lastAuditedDate).getTime();
  if (isNaN(auditTime)) return 'NEEDS_VERIFICATION';

  const now = new Date('2026-09-15T12:00:00Z').getTime();
  const daysDiff = (now - auditTime) / (1000 * 60 * 60 * 24);

  if (daysDiff <= 90) {
    return 'FRESH';
  } else if (daysDiff <= 180) {
    return 'RECENTLY_VERIFIED';
  } else {
    return 'NEEDS_VERIFICATION';
  }
}

export const evaluateSchemeFreshness = evaluateFreshness;
