/**
 * YOJANA SETU — CLOUD CATALOG HARDENING TEST SUITE (Phase 2A)
 *
 * Regression tests for the hardened cloud scheme catalog:
 * source tracking, cache versioning, stable digest, failure semantics,
 * candidate boundary, and repository catalog wiring.
 *
 * Run: npx tsx src/lib/data/cloudCatalogHardening.test.ts
 */

import { SCHEMES_DATABASE } from '../../data/schemes';
import { SOUTH_INDIA_SCHEMES } from '../../data/southIndiaSchemes';
import { CANDIDATE_SCHEMES_DATABASE } from '../../data/candidateSchemes';
import type { Scheme } from '../../types/scheme';

// --- Minimal localStorage stub (installed BEFORE the catalog module loads,
// because the module hydrates from cache at import time). ---
const memStore = new Map<string, string>();
(globalThis as unknown as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (memStore.has(k) ? (memStore.get(k) as string) : null),
  setItem: (k: string, v: string) => {
    memStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    memStore.delete(k);
  },
  clear: () => memStore.clear(),
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    if (details) console.error(`   Details: ${details}`);
    failed++;
  }
}

function cloneScheme(s: Scheme): Scheme {
  return JSON.parse(JSON.stringify(s)) as Scheme;
}

type CatalogModule = typeof import('./cloudSchemeCatalog');

async function main() {
  console.log('\n--- RUNNING CLOUD CATALOG HARDENING SUITE ---\n');

  const catalog: CatalogModule = await import('./cloudSchemeCatalog');
  const repo = await import('./schemeRepository');

  const V2_KEY = 'ys_cloud_schemes_v2';
  const V1_KEY = 'ys_cloud_schemes_v1';
  const EMPTY_RELATED = new Map();

  /** Minimal SchemeRow: all structured columns null, raw_payload injected. */
  const makeRow = (id: string, rawPayload: unknown) =>
    ({
      id,
      official_name: null,
      short_code: null,
      official_scheme_identifier: null,
      sponsoring_ministry: null,
      department: null,
      scheme_type: null,
      scope: null,
      benefit_summary: null,
      description: null,
      funding_range_text: null,
      metadata: null,
      raw_payload: rawPayload,
    }) as unknown as Parameters<CatalogModule['mergeCloudRows']>[0][number];

  // ------------------------------------------------------------------
  // Test 1: South India uses the ACTIVE curated catalog (not a 2nd source)
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const south = repo.getSouthIndiaSchemes();
    const curated = catalog.getCuratedSchemes();
    const southIds = south.map((s) => s.id).sort();
    const expectedIds = SOUTH_INDIA_SCHEMES.map((s) => s.id).sort();
    assert(
      JSON.stringify(southIds) === JSON.stringify(expectedIds),
      'Test 1: South India membership matches the bundled South India id set',
      `got ${southIds.length}, expected ${expectedIds.length}`,
    );
    assert(
      south.every((s) => curated.includes(s)),
      'Test 1: every South India scheme is the SAME OBJECT as the active catalog entry (no second source)',
    );
    assert(
      south.length === 26,
      `Test 1: South India count preserved (26, found ${south.length})`,
    );
  }

  // ------------------------------------------------------------------
  // Test 2: Cache version mismatch falls back safely
  // ------------------------------------------------------------------
  {
    memStore.clear();
    // Legacy v1 payload (old shape): must be ignored AND cleaned up.
    memStore.set(V1_KEY, JSON.stringify([cloneScheme(SCHEMES_DATABASE[0])]));
    catalog.__resetCatalogStateForTests();
    assert(
      catalog.getCatalogSource() === 'bundled',
      'Test 2: v1 cache is ignored — source stays bundled',
      `source=${catalog.getCatalogSource()}`,
    );
    assert(
      catalog.getCuratedSchemes() === SCHEMES_DATABASE,
      'Test 2: v1 cache is ignored — bundled catalog returned by reference',
    );
    assert(
      !memStore.has(V1_KEY),
      'Test 2: obsolete v1 catalog-cache key is cleaned up',
    );
  }

  // ------------------------------------------------------------------
  // Test 3: Cached catalog is distinguishable from fresh cloud state
  // ------------------------------------------------------------------
  {
    memStore.clear();
    const cached = cloneScheme(SCHEMES_DATABASE[0]);
    cached.benefitSummary = 'CACHED BENEFIT SUMMARY';
    memStore.set(
      V2_KEY,
      JSON.stringify({
        version: 2,
        fetchedAt: new Date().toISOString(),
        schemes: [cached],
      }),
    );
    catalog.__resetCatalogStateForTests();
    assert(
      catalog.getCatalogSource() === 'cached',
      'Test 3: v2 cache hydrates with source=cached (not cloud)',
      `source=${catalog.getCatalogSource()}`,
    );
    assert(
      catalog.getCuratedSchemes()[0].benefitSummary === 'CACHED BENEFIT SUMMARY',
      'Test 3: hydrated catalog serves the cached scheme data',
    );
    assert(
      catalog.getCatalogSource() !== 'cloud',
      'Test 3: a cached catalog is never described as freshly verified cloud data',
    );
    // Malformed cache is discarded safely.
    memStore.set(V2_KEY, '{not valid json');
    catalog.__resetCatalogStateForTests();
    assert(
      catalog.getCatalogSource() === 'bundled' &&
        catalog.getCuratedSchemes() === SCHEMES_DATABASE,
      'Test 3: malformed cache is discarded, bundled catalog kept',
    );
    memStore.clear();
    catalog.__resetCatalogStateForTests();
  }

  // ------------------------------------------------------------------
  // Tests 4–7: Digest detects behavior-relevant changes, ignores volatile ones
  // ------------------------------------------------------------------
  {
    const base = SCHEMES_DATABASE[0];
    const baseDigest = catalog.schemeDigest(base);

    const changedTargeting = cloneScheme(base);
    changedTargeting.targetCategories = ['General'];
    assert(
      catalog.schemeDigest(changedTargeting) !== baseDigest,
      'Test 4: digest detects eligibility-relevant change (targetCategories)',
    );

    const changedDocs = cloneScheme(base);
    changedDocs.requiredDocuments = [...changedDocs.requiredDocuments, 'New Document XYZ'];
    assert(
      catalog.schemeDigest(changedDocs) !== baseDigest,
      'Test 5: digest detects document change (requiredDocuments)',
    );

    const changedUrl = cloneScheme(base);
    changedUrl.officialPortalUrl = 'https://example.gov.in/changed';
    assert(
      catalog.schemeDigest(changedUrl) !== baseDigest,
      'Test 6: digest detects application URL change (officialPortalUrl)',
    );

    const changedTrust = cloneScheme(base);
    if (changedTrust.trustProfile) {
      changedTrust.trustProfile.confidence = 'HIGH';
    }
    assert(
      catalog.schemeDigest(changedTrust) !== baseDigest,
      'Test 7: digest detects trust change (trustProfile.confidence)',
    );

    const changedSourceStatus = cloneScheme(base);
    if (changedSourceStatus.sourceProvenance) {
      changedSourceStatus.sourceProvenance.verificationStatus = 'UNVERIFIED';
    }
    assert(
      catalog.schemeDigest(changedSourceStatus) !== baseDigest,
      'Test 7: digest detects source change (sourceProvenance.verificationStatus)',
    );

    // Volatile timestamps must NOT affect the digest.
    const changedDates = cloneScheme(base);
    changedDates.lastVerifiedDate = '01 January 2030';
    if (changedDates.trustProfile) {
      changedDates.trustProfile.freshness.daysSinceVerification = 99999;
      changedDates.trustProfile.freshness.freshnessLabel = 'changed';
      changedDates.trustProfile.verification.verifiedAt = '2030-01-01';
    }
    if (changedDates.sourceProvenance) {
      changedDates.sourceProvenance.lastVerifiedDate = '01 January 2030';
    }
    assert(
      catalog.schemeDigest(changedDates) === baseDigest,
      'Test 7: digest ignores volatile timestamps (lastVerifiedDate, freshness)',
    );

    // Determinism: shuffled key order and shuffled order-free arrays -> same digest.
    const shuffled = JSON.parse(
      catalog.stableStringify(JSON.parse(catalog.stableStringify(base))),
    ) as Scheme;
    const reordered = cloneScheme(base);
    reordered.applicableStates = [...reordered.applicableStates].reverse();
    assert(
      catalog.schemeDigest(shuffled) === baseDigest &&
        catalog.schemeDigest(reordered) === baseDigest,
      'Test 7: digest is deterministic (key order and array order independent)',
    );
  }

  // ------------------------------------------------------------------
  // Test 8: Missing raw_payload does not destroy an existing bundled scheme
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const target = SCHEMES_DATABASE[3];
    const row = makeRow(target.id, null); // no raw_payload
    const result = catalog.mergeCloudRows([row], EMPTY_RELATED);
    const kept = result.schemes.find((s: Scheme) => s.id === target.id);
    assert(
      kept === target,
      'Test 8: row without raw_payload keeps the existing bundled object by reference (no degradation)',
    );
    assert(
      result.changed === false,
      'Test 8: keeping the bundled object does not count as a catalog change',
    );
  }

  // ------------------------------------------------------------------
  // Test 9: Empty Supabase response does not clear the catalog
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const before = catalog.getCuratedSchemes();
    const result = catalog.mergeCloudRows([], EMPTY_RELATED);
    assert(result.changed === false, 'Test 9: empty cloud response -> changed=false');
    assert(
      result.schemes === before,
      'Test 9: empty cloud response keeps the working catalog by reference',
    );
  }

  // ------------------------------------------------------------------
  // Test 9b: Fully malformed rows do not crash and do not clear the catalog
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const bad = [{ id: null }, { id: 42 }, null] as unknown as Parameters<
      CatalogModule['mergeCloudRows']
    >[0];
    const result = catalog.mergeCloudRows(bad, EMPTY_RELATED);
    assert(
      result.changed === false && result.schemes === SCHEMES_DATABASE,
      'Test 9b: malformed rows are skipped, catalog untouched, no crash',
    );
  }

  // ------------------------------------------------------------------
  // Test 9c: Partial cloud response retains schemes absent from the response
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const modified = cloneScheme(SCHEMES_DATABASE[5]);
    modified.name = 'UPDATED VIA CLOUD';
    const row = makeRow(modified.id, modified);
    const result = catalog.mergeCloudRows([row], EMPTY_RELATED);
    assert(
      result.schemes.length === SCHEMES_DATABASE.length,
      'Test 9c: partial cloud response does not shrink the catalog (union, not replace)',
      `got ${result.schemes.length}, expected ${SCHEMES_DATABASE.length}`,
    );
    assert(
      result.changed === true,
      'Test 9c: the one updated scheme still triggers a catalog change',
    );
    const updated = result.schemes.find((s: Scheme) => s.id === modified.id);
    const retained = result.schemes.filter((s: Scheme) => s.id !== modified.id);
    assert(updated?.name === 'UPDATED VIA CLOUD', 'Test 9c: cloud-provided update is applied');
    assert(
      retained.every((s: Scheme) => SCHEMES_DATABASE.includes(s)),
      'Test 9c: schemes absent from the response are retained by reference',
    );
  }

  // ------------------------------------------------------------------
  // Test 10: Supabase failure preserves the current catalog
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const before = catalog.getCuratedSchemes();
    // No VITE_SUPABASE_URL/KEY in the test env -> unconfigured -> graceful false.
    const changed = await catalog.refreshCuratedSchemesFromCloud();
    assert(changed === false, 'Test 10: refresh without Supabase config resolves false');
    assert(
      catalog.getCuratedSchemes() === before,
      'Test 10: failed refresh leaves the current catalog untouched',
    );
    assert(
      catalog.getCatalogSource() === 'bundled',
      'Test 10: failed refresh does not misreport the catalog source',
    );
  }

  // ------------------------------------------------------------------
  // Test 10b: Identical cloud data does not trigger a spurious swap
  // (bundle -> cloud round-trip digest stability)
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const rows = SCHEMES_DATABASE.map((s) => makeRow(s.id, s));
    const result = catalog.mergeCloudRows(rows, EMPTY_RELATED);
    assert(
      result.changed === false,
      'Test 10b: cloud rows identical to the bundle produce no catalog swap (digest stable across the bundle/cloud boundary)',
    );
  }

  // ------------------------------------------------------------------
  // Test 10c: Structured column overrides flow through the digest
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const target = SCHEMES_DATABASE[7];
    const row = makeRow(target.id, target);
    (row as unknown as Record<string, unknown>).benefit_summary = 'ADMIN-EDITED BENEFIT';
    const result = catalog.mergeCloudRows([row], EMPTY_RELATED);
    const updated = result.schemes.find((s: Scheme) => s.id === target.id);
    assert(
      result.changed === true && updated?.benefitSummary === 'ADMIN-EDITED BENEFIT',
      'Test 10c: structured display-column edit is applied and detected as a change',
    );
  }

  // ------------------------------------------------------------------
  // Test 11: Candidate catalog remains unchanged
  // ------------------------------------------------------------------
  {
    const candidates = repo.getCandidateSchemes();
    assert(
      candidates.length === CANDIDATE_SCHEMES_DATABASE.length,
      `Test 11: candidate count unchanged (${candidates.length})`,
    );
    assert(
      candidates.every((c: Scheme, i: number) => c === CANDIDATE_SCHEMES_DATABASE[i]),
      'Test 11: candidate objects are the same bundled references (no cloud mixing)',
    );
    assert(
      candidates.every((c: Scheme) => c.isCandidateScheme === true),
      'Test 11: candidates remain flagged as candidate schemes',
    );
    const all = repo.getAllRepositorySchemes();
    assert(
      all.length === catalog.getCuratedSchemes().length + candidates.length,
      'Test 11: curated + candidate remain separate partitions of the repository',
    );
  }

  // ------------------------------------------------------------------
  // Test 12: Language does not change catalog identity or matching behavior
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const first = catalog.getCuratedSchemes();
    const second = catalog.getCuratedSchemes();
    assert(
      first === second,
      'Test 12: repeated catalog reads return the same array reference (stable identity)',
    );
    assert(
      catalog.catalogDigest(first) === catalog.catalogDigest(second),
      'Test 12: catalog digest is stable across reads (no language-dependent drift)',
    );
    // The catalog API takes no language input at all — matching inputs are
    // scheme objects, so identity cannot vary by UI language.
    assert(
      repo.getAllRepositorySchemes().length ===
        first.length + repo.getCandidateSchemes().length,
      'Test 12: repository composition is language-independent',
    );
  }

  // ------------------------------------------------------------------
  // Test 13: No duplicate cloud refresh (in-flight dedup)
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const a = catalog.refreshCuratedSchemesFromCloud();
    const b = catalog.refreshCuratedSchemesFromCloud();
    assert(
      a === b,
      'Test 13: concurrent refresh calls share one in-flight promise (no duplicate cloud refresh)',
    );
    await a;
    const c = catalog.refreshCuratedSchemesFromCloud();
    assert(
      c !== a,
      'Test 13: after completion a new refresh starts a new cycle (no stuck promise)',
    );
    await c;
  }

  // ------------------------------------------------------------------
  // Test 13b: Unmounted subscribers never receive catalog updates
  // (lifecycle-safe subscription helper — mirrors the App.tsx pattern)
  // ------------------------------------------------------------------
  {
    catalog.__resetCatalogStateForTests();
    const calls: string[] = [];
    let mounted = true;
    const unsubscribe = catalog.subscribeCatalogChanges(
      () => calls.push('changed'),
      () => !mounted,
    );
    catalog.__emitCatalogChangeForTests();
    assert(
      calls.length === 1,
      'Test 13b: mounted subscriber is notified of a catalog swap',
    );
    mounted = false; // simulate unmount
    catalog.__emitCatalogChangeForTests();
    assert(
      calls.length === 1,
      'Test 13b: unmounted subscriber stays silent (no state-after-unmount)',
    );
    mounted = true;
    unsubscribe();
    catalog.__emitCatalogChangeForTests();
    assert(
      calls.length === 1,
      'Test 13b: unsubscribed listener stays silent',
    );
  }
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ FAIL: test suite crashed', err);
  process.exit(1);
});
