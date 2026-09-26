/**
 * YOJANA SETU — PHASE 2E.2 DEDUPE / COLLISION PUBLICATION-SAFETY TESTS
 * ----------------------------------------------------------------------
 * In-repo guarantees for candidate ingestion collisions:
 *
 *   D1. A candidate colliding with an AUTHORITATIVE scheme record
 *       (exact id, normalized name, core brand, official URL) is flagged
 *       needsReview: true — never silently renamed-and-cleared.
 *   D2. The audit entry records the matched authoritative id
 *       (existingSchemeId) so a review surface can demand resolution.
 *   D3. Intra-batch ID collisions (no authoritative counterpart) are true
 *       duplicates of the same ingest and do NOT require review.
 *   D4. generateReviewQueue() surfaces every unresolved collision as a
 *       HIGH-priority UNRESOLVED_COLLISION item carrying matched_scheme_id,
 *       duplicate type, and confidence.
 *   D5. Resolved (needsReview=false) entries never appear as collisions in
 *       the review queue — an unresolved collision cannot look cleared.
 */

import { deduplicateCandidateSchemes } from './candidateDeduplication';
import { generateReviewQueue } from './trustEngine';
import type { Scheme } from '../../types';

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${name}`);
  }
}

function makeScheme(over: Partial<Scheme> & { id: string; name: string }): Scheme {
  return {
    ...over,
    id: over.id,
    name: over.name,
  } as Scheme;
}

const AUTH = makeScheme({
  id: 'pmegp',
  name: 'Prime Minister\u2019s Employment Generation Programme',
  sponsoringMinistry: 'Ministry of Micro, Small and Medium Enterprises',
  applicableStates: ['National'],
  officialPortalUrl: 'https://www.kviconline.gov.in/pmegpeportal/',
});

async function run(): Promise<void> {
  /* D1/D2. Authoritative collisions → needsReview with matched id */
  const candidates: Scheme[] = [
    makeScheme({ id: 'pmegp', name: 'PMEGP New Discovery', applicableStates: ['National'] }), // EXACT_ID vs authoritative
    makeScheme({ id: 'cand-2', name: 'Prime Minister\u2019s Employment Generation Programme', applicableStates: ['National'] }), // NORMALIZED_NAME
    makeScheme({ id: 'cand-3', name: 'Prime Ministers Employment Generation Programme', applicableStates: ['National'] }), // core brand (normalizes to same core as authoritative)
    makeScheme({ id: 'cand-4', name: 'Some Other Scheme', applicableStates: ['National'], officialPortalUrl: 'https://www.kviconline.gov.in/pmegpeportal/' }), // OFFICIAL_URL
    makeScheme({ id: 'cand-5', name: 'Totally Unrelated Scheme', applicableStates: ['National'] }), // no collision
  ];

  const { reconciledCandidates, duplicateAudit } = deduplicateCandidateSchemes(candidates, [AUTH]);

  assert('D1. audit produced for collisions', duplicateAudit.length >= 4);
  for (const entry of duplicateAudit) {
    assert(
      `D1. collision on '${entry.candidateId}' flagged needsReview`,
      entry.needsReview === true,
    );
    assert(
      `D2. collision on '${entry.candidateId}' records matched scheme id`,
      entry.existingSchemeId === 'pmegp',
    );
    assert(
      `D2. collision on '${entry.candidateId}' names resolution requirement`,
      /UNRESOLVED COLLISION/i.test(entry.notes) && /resolution/i.test(entry.notes),
    );
  }
  // The unrelated candidate must not be in the audit at all
  assert(
    'D1. non-colliding candidate has no audit entry',
    !duplicateAudit.some((e) => e.candidateId === 'cand-5'),
  );
  // Ingestion records are preserved (renamed, never dropped)
  assert(
    'D1. colliding candidates retained in reconciled output',
    reconciledCandidates.length === 5,
  );
  const exactIdCand = reconciledCandidates.find((c) => c.id === 'candidate-pmegp');
  assert('D1. exact-id collision renamed to preserve ingest record', exactIdCand !== undefined);

  /* D3. Intra-batch collision → not review-required */
  const batchDupes: Scheme[] = [
    makeScheme({ id: 'dup-batch', name: 'Batch Scheme A', applicableStates: ['National'] }),
    makeScheme({ id: 'dup-batch', name: 'Batch Scheme B', applicableStates: ['National'] }),
  ];
  const batchResult = deduplicateCandidateSchemes(batchDupes, [AUTH]);
  assert('D3. intra-batch collision audited', batchResult.duplicateAudit.length === 1);
  assert(
    'D3. intra-batch collision does not require review',
    batchResult.duplicateAudit[0].needsReview === false,
  );
  assert(
    'D3. intra-batch collision has no authoritative match',
    batchResult.duplicateAudit[0].existingSchemeId === undefined,
  );

  /* D4. Review queue surfaces unresolved collisions */
  const queue = generateReviewQueue(
    reconciledCandidates,
    '2026-09-27',
    duplicateAudit,
  );
  const collisions = queue.filter((q) => q.issueType === 'UNRESOLVED_COLLISION');
  assert('D4. every unresolved collision becomes a review item', collisions.length === duplicateAudit.length);
  for (const item of collisions) {
    assert(`D4. '${item.id}' is HIGH priority`, item.priority === 'HIGH');
    assert(
      `D4. '${item.id}' carries matched_scheme_id`,
      item.field === 'matched_scheme_id' && item.currentValue === 'pmegp',
    );
    assert(
      `D4. '${item.id}' suggests resolution not auto-merge`,
      /merge|distinct/i.test(item.suggestedAction) && !/auto-merge/i.test(item.suggestedAction.replace('Do not auto-merge', '')),
    );
  }

  /* D5. Cleared entries never surface as collisions */
  const cleared = duplicateAudit.map((e) => ({ ...e, needsReview: false }));
  const queueCleared = generateReviewQueue(reconciledCandidates, '2026-09-27', cleared);
  assert(
    'D5. resolved collisions do not appear in review queue',
    queueCleared.filter((q) => q.issueType === 'UNRESOLVED_COLLISION').length === 0,
  );

  // Backward compatibility: optional param omitted
  const queueDefault = generateReviewQueue(reconciledCandidates, '2026-09-27');
  assert(
    'D5. review queue works without collision audit (no collision items)',
    queueDefault.filter((q) => q.issueType === 'UNRESOLVED_COLLISION').length === 0,
  );

  console.log(`\n--- DEDUPE COLLISION SAFETY: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: dedupe suite crashed', err);
  process.exitCode = 1;
});
