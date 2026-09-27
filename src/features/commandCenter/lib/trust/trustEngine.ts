/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FreshnessStatus, PortalDomainClass } from '../../types';
import {
  findAuthorityByDomain,
  normalizeHostname,
} from '../../../../data/governmentAuthorities';

/**
 * Classifies a URL domain with strict domain hardening.
 *
 * Phase 2E.2 centralization: explicitly trusted domain data comes from the
 * single authoritative registry (src/data/governmentAuthorities.ts) — no
 * hard-coded trusted-domain lists live here. Known nodal agencies
 * (SIDBI, NABARD, CGTMSE and their portals) are flagged in the registry via
 * isKnownNodalAgency and matched by exact hostname / domain boundary only.
 * Does NOT treat .org.in, .edu.in, .ac.in as automatically
 * government-authoritative. Tier semantics are unchanged: VERIFIED_OFFICIAL
 * for .gov.in/.nic.in (and explicit provenance exceptions), KNOWN_NODAL for
 * registry-flagged nodal agencies, UNVERIFIED_EXTERNAL otherwise.
 */
export function classifyPortalDomain(url: string, isExplicitException = false): PortalDomainClass {
  if (!url || typeof url !== 'string') {
    return 'INVALID';
  }

  try {
    let rawHostname: string;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      rawHostname = new URL(`https://${url}`).hostname;
    } else {
      rawHostname = new URL(url).hostname;
    }
    const hostname = normalizeHostname(rawHostname);

    if (!hostname || hostname.includes(' ') || !hostname.includes('.')) {
      return 'INVALID';
    }

    // 1. Government top-level / second-level domains
    if (hostname.endsWith('.gov.in') || hostname.endsWith('.nic.in')) {
      return 'VERIFIED_OFFICIAL';
    }

    // 2. Explicit verified exceptions through provenance metadata
    // (the former hard-coded single-domain exception list is subsumed by the
    // .gov.in rule above; only the caller-supplied provenance flag remains)
    if (isExplicitException) {
      return 'VERIFIED_OFFICIAL';
    }

    // 3. Known statutory nodal platforms (e.g. SIDBI, CGTMSE, NABARD) —
    // sourced from the registry's isKnownNodalAgency flag.
    if (findAuthorityByDomain(hostname)?.isKnownNodalAgency) {
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
function evaluateFreshness(lastAuditedDate: string): FreshnessStatus {
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
