/**
 * YOJANA SETU — CANDIDATE SCHEME DEDUPLICATION ENGINE
 *
 * Compares candidate schemes against existing authoritative databases (SCHEMES_DATABASE)
 * and intra-batch candidate records.
 *
 * Evaluates:
 * 1. Exact Scheme ID / Slug match
 * 2. Canonical Slug similarity (e.g. `pmegp` vs `pmegp-msme`, `standup_india` vs `standup-india`)
 * 3. Normalized Scheme Name (case-folded, punctuation-stripped)
 * 4. State + Normalized Scheme Name
 * 5. Official Application / Portal URL match
 */

import { Scheme } from '../../types';
import { CandidateDeduplicationResult } from '../../types/rawScheme';

function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Strips common prefixes/suffixes to extract scheme core brand.
 */
function extractCoreBrand(name: string): string {
  return normalizeText(
    name
      .replace(/pradhan\s+mantri|mukhyamantri|chief\s+minister'?s?|yojana|scheme|mission|program|project/gi, '')
  );
}

/**
 * Evaluates candidate schemes against existing authoritative schemes.
 */
export function deduplicateCandidateSchemes(
  candidateSchemes: Scheme[],
  authoritativeSchemes: Scheme[]
): {
  reconciledCandidates: Scheme[];
  duplicateAudit: CandidateDeduplicationResult[];
  potentialDuplicateCount: number;
} {
  const duplicateAudit: CandidateDeduplicationResult[] = [];
  const existingIdSet = new Set(authoritativeSchemes.map((s) => s.id));
  const existingNameMap = new Map<string, Scheme>();
  const existingCoreMap = new Map<string, Scheme>();
  const existingUrlMap = new Map<string, Scheme>();

  for (const auth of authoritativeSchemes) {
    existingNameMap.set(normalizeText(auth.name), auth);
    const core = extractCoreBrand(auth.name);
    if (core.length >= 4) {
      existingCoreMap.set(core, auth);
    }
    if (auth.officialPortalUrl && !auth.officialPortalUrl.includes('myscheme.gov.in')) {
      existingUrlMap.set(auth.officialPortalUrl.toLowerCase().trim(), auth);
    }
  }

  const seenCandidateIds = new Set<string>();

  const reconciledCandidates = candidateSchemes.map((cand) => {
    let isDuplicate = false;
    let duplicateType: CandidateDeduplicationResult['duplicateType'] = undefined;
    let existingSchemeId: string | undefined = undefined;
    let notes = '';
    let confidenceScore = 0;

    // Check 1: Intra-batch exact ID collision
    if (seenCandidateIds.has(cand.id)) {
      isDuplicate = true;
      duplicateType = 'EXACT_ID';
      notes = `Candidate ID '${cand.id}' already seen within current batch. ID deduplicated with suffix.`;
      confidenceScore = 1.0;
      cand.id = `${cand.id}-cand-${Math.floor(Math.random() * 1000)}`;
    } else {
      seenCandidateIds.add(cand.id);
    }

    // Check 2: Collision with existing authoritative scheme ID
    if (existingIdSet.has(cand.id)) {
      isDuplicate = true;
      duplicateType = 'EXACT_ID';
      existingSchemeId = cand.id;
      notes = `Exact match with authoritative scheme ID '${cand.id}'. Candidate ID prefixed to prevent clobbering.`;
      confidenceScore = 1.0;
      cand.id = `candidate-${cand.id}`;
    }

    // Check 3: Normalized scheme name match
    const candNormName = normalizeText(cand.name);
    const nameMatch = existingNameMap.get(candNormName);
    if (nameMatch) {
      isDuplicate = true;
      duplicateType = 'NORMALIZED_NAME';
      existingSchemeId = nameMatch.id;
      notes = `Name matches existing authoritative scheme '${nameMatch.name}' (${nameMatch.id}).`;
      confidenceScore = 0.95;
    }

    // Check 4: Core brand match (e.g. PMEGP, MUDRA, Stand Up India)
    if (!isDuplicate) {
      const candCore = extractCoreBrand(cand.name);
      if (candCore.length >= 4) {
        const coreMatch = existingCoreMap.get(candCore);
        if (coreMatch) {
          // Check if state applicability matches or if both are national
          const candState = cand.applicableStates[0] || 'National';
          const authState = coreMatch.applicableStates[0] || 'National';
          if (candState === authState || candState === 'National' || authState === 'National') {
            isDuplicate = true;
            duplicateType = 'CANONICAL_SLUG';
            existingSchemeId = coreMatch.id;
            notes = `Core brand matches existing scheme '${coreMatch.name}' (${coreMatch.id}). Candidate represents potential regional/discovery duplicate.`;
            confidenceScore = 0.85;
          }
        }
      }
    }

    // Check 5: Official portal URL match
    if (!isDuplicate && cand.officialPortalUrl) {
      const candUrl = cand.officialPortalUrl.toLowerCase().trim();
      const urlMatch = existingUrlMap.get(candUrl);
      if (urlMatch) {
        isDuplicate = true;
        duplicateType = 'OFFICIAL_URL';
        existingSchemeId = urlMatch.id;
        notes = `Portal URL matches existing scheme '${urlMatch.name}' (${urlMatch.id}).`;
        confidenceScore = 0.8;
      }
    }

    if (isDuplicate) {
      duplicateAudit.push({
        candidateId: cand.id,
        existingSchemeId,
        isDuplicate: true,
        duplicateType,
        confidenceScore,
        notes,
      });

      // Annotate candidate scheme metadata with duplicate audit without mutating authoritative scheme
      if (cand.trustProfile?.verification) {
        cand.trustProfile.verification.notes = `${cand.trustProfile.verification.notes} [AUDIT: Potential duplicate of authoritative scheme '${existingSchemeId}'].`;
      }
    }

    return cand;
  });

  return {
    reconciledCandidates,
    duplicateAudit,
    potentialDuplicateCount: duplicateAudit.length,
  };
}
