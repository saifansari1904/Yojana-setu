/**
 * YOJANA SETU — CATALOG SET REGRESSION TESTS (Bug C)
 *
 * §20 regression scenarios for the cloud-catalog merge:
 *  5. Cloud publishes 39 + a stale cache holds 40 -> final curated is 39;
 *     the stale phantom is evicted, bundled rows are never lost.
 *  6. Bundled 39 + cloud 39 (identical) -> no churn (changed=false).
 *  7. Cloud publishes 40 with one genuinely NEW id -> 40 (no false eviction).
 *  8. Cloud failure (empty / fully malformed) -> catalog unchanged.
 *  9. Cloud publishes 39 with one RENAMED id -> 40: the new row is added and
 *     the old bundled id is retained (documented no-tombstone behavior).
 * 10. Language switching does not change the dataset or matching results.
 * 12/13. Measured pipeline timing markers exist ([AUTH]/[PROFILE]/[CATALOG]/
 *     [MATCHING]/[RENDER]) — guards the "diagnose with measurements" fix.
 * Plus the dev-only set-difference diagnostic (§12) on a crafted cache.
 *
 * The matching engine itself is untouched: weights, statuses, blockers,
 * ranking and score calculations are covered by matchingEngine.test.ts and
 * phase3_1MatchingIntegrity.test.ts, which must keep passing unchanged.
 *
 * Run: npx tsx src/lib/data/catalogSetRegression.test.ts
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SCHEMES_DATABASE } from '../../data/schemes';
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
type MergeRows = CatalogModule['mergeCloudRows'];

const HERE = dirname(fileURLToPath(import.meta.url));
const readSource = (rel: string) => readFileSync(resolve(HERE, rel), 'utf8');

async function main() {
  console.log('\n--- RUNNING CATALOG SET REGRESSION SUITE (Bug C) ---\n');

  const catalog: CatalogModule = await import('./cloudSchemeCatalog');

  const V2_KEY = 'ys_cloud_schemes_v2';
  const EMPTY_RELATED = new Map();
  const bundledIds = SCHEMES_DATABASE.map((s) => s.id);

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
    }) as unknown as Parameters<MergeRows>[0][number];

  /** Bundled-id rows without raw_payload: merge keeps the existing object. */
  const bundledRows = () => bundledIds.map((id) => makeRow(id, null));

  /** Plant a v2 cache and re-hydrate the module to that state. */
  const plantCache = (schemes: Scheme[]) => {
    memStore.set(
      V2_KEY,
      JSON.stringify({ version: 2, fetchedAt: new Date().toISOString(), schemes }),
    );
    catalog.__resetCatalogStateForTests();
  };
  const clearState = () => {
    memStore.clear();
    catalog.__resetCatalogStateForTests();
  };

  const PHANTOM_ID = 'phantom-stale-scheme';

  // ------------------------------------------------------------------
  // §20.5 — cloud 39 + stale cache 40 -> phantom evicted, final 39
  // ------------------------------------------------------------------
  {
    const phantom = cloneScheme(SCHEMES_DATABASE[0]);
    phantom.id = PHANTOM_ID;
    plantCache([...SCHEMES_DATABASE.map(cloneScheme), phantom]);
    assert(
      catalog.getCuratedSchemes().length === 40,
      '§20.5 setup: stale cache hydrates to 40 curated schemes',
    );
    const result = catalog.mergeCloudRows(bundledRows(), EMPTY_RELATED);
    const ids = result.schemes.map((s) => s.id);
    assert(result.schemes.length === 39, `§20.5 phantom evicted: final curated is 39 (got ${result.schemes.length})`);
    assert(!ids.includes(PHANTOM_ID), '§20.5 the stale phantom id is gone from the final set');
    assert(
      bundledIds.every((id) => ids.includes(id)),
      '§20.5 all 39 bundled ids survive the eviction',
    );
    assert(result.changed === true, '§20.5 changed=true so the refresh swaps the catalog');
    assert(
      catalog.getCatalogSource() === 'cached',
      '§20.5 mergeCloudRows is pure: module state (cached) untouched until doRefresh swaps',
    );
  }

  // ------------------------------------------------------------------
  // §20.6 — bundled 39 + cloud 39 identical -> no churn
  // ------------------------------------------------------------------
  {
    clearState();
    assert(catalog.getCuratedSchemes().length === 39, '§20.6 setup: bundled fallback is 39');
    const result = catalog.mergeCloudRows(bundledRows(), EMPTY_RELATED);
    assert(result.schemes.length === 39, '§20.6 identical cloud response keeps 39 schemes');
    assert(result.changed === false, '§20.6 changed=false: no catalog swap on identical data');
  }

  // ------------------------------------------------------------------
  // §20.7 — cloud 40 with one genuinely NEW id -> 40, no false eviction
  // ------------------------------------------------------------------
  {
    clearState();
    const newPayload = cloneScheme(SCHEMES_DATABASE[1]);
    newPayload.id = 'brand-new-scheme';
    const rows = [...bundledRows(), makeRow('brand-new-scheme', newPayload)];
    const result = catalog.mergeCloudRows(rows, EMPTY_RELATED);
    const ids = result.schemes.map((s) => s.id);
    assert(result.schemes.length === 40, `§20.7 new cloud id added: final curated is 40 (got ${result.schemes.length})`);
    assert(ids.includes('brand-new-scheme'), '§20.7 the new id is present');
    assert(bundledIds.every((id) => ids.includes(id)), '§20.7 all bundled ids retained');
  }

  // ------------------------------------------------------------------
  // §20.8 — cloud failure -> catalog unchanged
  // ------------------------------------------------------------------
  {
    clearState();
    const before = catalog.getCuratedSchemes();
    const empty = catalog.mergeCloudRows([], EMPTY_RELATED);
    assert(empty.changed === false && empty.schemes === before, '§20.8 empty cloud response -> changed=false, same object');
    const malformed = catalog.mergeCloudRows(
      [{ nope: 1 }, null, { id: '' }] as unknown as Parameters<MergeRows>[0],
      EMPTY_RELATED,
    );
    assert(
      malformed.changed === false && malformed.schemes.length === 39,
      '§20.8 fully-malformed response -> catalog unchanged at 39',
    );
  }

  // ------------------------------------------------------------------
  // §20.9 — cloud 39 with one RENAMED id -> 40 (new added, old retained)
  // ------------------------------------------------------------------
  {
    clearState();
    const droppedId = bundledIds[0];
    const newPayload = cloneScheme(SCHEMES_DATABASE[0]);
    newPayload.id = 'renamed-scheme';
    const rows = bundledIds
      .filter((id) => id !== droppedId)
      .map((id) => makeRow(id, null));
    rows.push(makeRow('renamed-scheme', newPayload));
    const result = catalog.mergeCloudRows(rows, EMPTY_RELATED);
    const ids = result.schemes.map((s) => s.id);
    assert(
      result.schemes.length === 40,
      `§20.9 rename without tombstones: 40 (new row + retained bundled old id), got ${result.schemes.length}`,
    );
    assert(ids.includes('renamed-scheme'), '§20.9 renamed id present');
    assert(ids.includes(droppedId), '§20.9 old bundled id retained (documented behavior)');
  }

  // ------------------------------------------------------------------
  // Diagnostic (§12): set-difference on a crafted 40-scheme cache
  // ------------------------------------------------------------------
  {
    const phantom = cloneScheme(SCHEMES_DATABASE[0]);
    phantom.id = PHANTOM_ID;
    plantCache([...SCHEMES_DATABASE.map(cloneScheme), phantom]);
    const diag = await catalog.diagnoseCatalogSets();
    assert(diag.cloudIds === null, 'diagnostic: no supabase configured -> cloudIds null');
    assert(diag.cloudError === 'supabase not configured', 'diagnostic: cloudError names the cause');
    assert(diag.bundledIds.length === 39, `diagnostic: bundledIds is 39 (got ${diag.bundledIds.length})`);
    assert(diag.cachedIds?.length === 40, `diagnostic: cachedIds is 40 (got ${diag.cachedIds?.length})`);
    assert(diag.finalCuratedIds.length === 40, 'diagnostic: finalCuratedIds is 40');
    assert(diag.finalIds.length === 260, `diagnostic: finalIds is 260 (40 curated + 220 candidates, got ${diag.finalIds.length})`);
    assert(
      diag.phantomIds.length === 1 && diag.phantomIds[0] === PHANTOM_ID,
      `diagnostic: phantomIds names the exact extra scheme ("${diag.phantomIds.join(',')}")`,
    );
    assert(diag.duplicateIds.length === 0, 'diagnostic: no duplicate ids in the crafted set');
    assert(diag.missingFromFinalIds.length === 0, 'diagnostic: nothing missing from final (no cloud data)');
  }

  // ------------------------------------------------------------------
  // Diagnostic: duplicate detection branch
  // ------------------------------------------------------------------
  {
    const dup = cloneScheme(SCHEMES_DATABASE[2]);
    plantCache([...SCHEMES_DATABASE.map(cloneScheme), dup]); // dup id repeats
    const diag = await catalog.diagnoseCatalogSets();
    assert(
      diag.duplicateIds.length === 1 && diag.duplicateIds[0] === dup.id,
      `diagnostic: duplicateIds names the repeated id ("${diag.duplicateIds.join(',')}")`,
    );
    assert(diag.phantomIds.length === 0, 'diagnostic: a repeated bundled id is not a phantom');
  }

  // ------------------------------------------------------------------
  // §20.10 — language switching changes neither dataset nor results
  // ------------------------------------------------------------------
  {
    const { rankSchemesForProfile } = await import('../matching/matchingEngine');
    const profile = {
      category: 'SC',
      age: 28,
      annualIncome: 250000,
      businessType: 'manufacturing',
      state: 'Maharashtra',
    } as Parameters<typeof rankSchemesForProfile>[1];
    const en = rankSchemesForProfile(SCHEMES_DATABASE, profile, 'en');
    const hi = rankSchemesForProfile(SCHEMES_DATABASE, profile, 'hi');
    const mr = rankSchemesForProfile(SCHEMES_DATABASE, profile, 'mr');
    const sig = (r: typeof en) => r.map((x) => `${x.scheme.id}:${x.matchPercentage}:${x.matchStatus}`).join('|');
    assert(en.length === 39 && hi.length === 39 && mr.length === 39, '§20.10 all languages rank the same 39 curated schemes');
    assert(sig(hi) === sig(en), '§20.10 hi results identical to en (ids, scores, statuses)');
    assert(sig(mr) === sig(en), '§20.10 mr results identical to en (ids, scores, statuses)');
  }

  // ------------------------------------------------------------------
  // §20.12/13 — measured pipeline timing markers exist (dev-only)
  // ------------------------------------------------------------------
  {
    const appSrc = readSource('../../App.tsx');
    const authSrc = readSource('../../context/AuthContext.tsx');
    const catalogSrc = readSource('./cloudSchemeCatalog.ts');
    assert(authSrc.includes('[Auth]'), 'timing: [Auth] boot/session markers in AuthContext');
    assert(authSrc.includes('[Profile]'), 'timing: [Profile] restore markers in AuthContext');
    assert(catalogSrc.includes('[Catalog]'), 'timing: [Catalog] fetch/merge markers in cloudSchemeCatalog');
    assert(appSrc.includes('[Matching]'), 'timing: [Matching] rank marker in App');
    assert(appSrc.includes('[Render]'), 'timing: [Render] navigation-to-ready marker in App');
    const loginGated = /canShowLogin\s*=\s*canShowLoginScreen\(authStatus,\s*currentScreen\)/.test(appSrc);
    assert(loginGated, 'single truth: login screen mounts only via canShowLoginScreen(authStatus, currentScreen)');
    const arbitraryTimeout = /setTimeout\(\s*\(\)\s*=>\s*navigate/.test(appSrc);
    assert(!arbitraryTimeout, 'no arbitrary setTimeout(()=>navigate(...)) in App');
  }

  console.log(`\n--- CATALOG SET REGRESSION: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
