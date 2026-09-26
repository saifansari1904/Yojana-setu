/**
 * YOJANA SETU — PHASE 2E.2 SCHEME RETIREMENT / TOMBSTONE SEMANTICS TESTS
 * ------------------------------------------------------------------------
 * Catalog retirement invariants (frontend):
 *
 *   R1. isTombstoneRow() recognizes ONLY explicit lifecycle signals:
 *       status 'retired'/'archived' (case-insensitive),
 *       metadata.lifecycle_status 'retired'/'archived',
 *       non-empty metadata.retired_at. Everything else is not a tombstone.
 *   R2. An explicit tombstone retires the scheme — including overriding a
 *       bundled offline copy. The retired id is excluded from the merged
 *       catalog and is NOT resurrected by the bundled fallback.
 *   R3. A response carrying only tombstones still retires (it is not an
 *       "empty response" — the signals are explicit, not missing data).
 *   R4. Missing rows are NOT retirement: bundled schemes absent from the
 *       cloud response (with no tombstone signal) are retained as-is.
 *   R5. Empty / null / malformed cloud responses never shrink the catalog
 *       (network-failure path: merge is never called; the catalog stays).
 *   R6. Ordinary published rows still merge normally (no behavior change).
 */

import * as catalog from './cloudSchemeCatalog';
import { SCHEMES_DATABASE } from '../../data/schemes';

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, extra = ''): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

type Row = Parameters<typeof catalog.mergeCloudRows>[0][number];

const EMPTY_RELATED = new Map();

function makeRow(id: string, over: Partial<Row> = {}): Row {
  return {
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
    raw_payload: null,
    ...over,
  } as Row;
}

async function run(): Promise<void> {
  /* R1. Tombstone signal recognition — explicit only */
  assert('R1. status retired is a tombstone', catalog.isTombstoneRow(makeRow('a', { status: 'retired' })));
  assert('R1. status ARCHIVED (case) is a tombstone', catalog.isTombstoneRow(makeRow('a', { status: 'ARCHIVED' })));
  assert(
    'R1. metadata.lifecycle_status retired is a tombstone',
    catalog.isTombstoneRow(makeRow('a', { metadata: { lifecycle_status: 'retired' } })),
  );
  assert(
    'R1. metadata.retired_at set is a tombstone',
    catalog.isTombstoneRow(makeRow('a', { metadata: { retired_at: '2026-09-01' } })),
  );
  assert('R1. null is not a tombstone', catalog.isTombstoneRow(null) === false);
  assert('R1. undefined is not a tombstone', catalog.isTombstoneRow(undefined) === false);
  assert('R1. plain published-shaped row is not a tombstone', catalog.isTombstoneRow(makeRow('a')) === false);
  assert(
    'R1. status published is not a tombstone',
    catalog.isTombstoneRow(makeRow('a', { status: 'published' })) === false,
  );
  assert(
    'R1. status draft is not a tombstone',
    catalog.isTombstoneRow(makeRow('a', { status: 'draft' })) === false,
  );
  assert(
    'R1. empty retired_at is not a tombstone',
    catalog.isTombstoneRow(makeRow('a', { metadata: { retired_at: '  ' } })) === false,
  );

  const bundledId = SCHEMES_DATABASE[0].id;
  const otherBundledId = SCHEMES_DATABASE[1].id;

  /* R2. Explicit tombstone retires — overrides the bundled copy */
  {
    catalog.__resetCatalogStateForTests();
    const before = catalog.getCuratedSchemes();
    assert('R2. fixture: bundled id present before', before.some((s) => s.id === bundledId));

    const result = catalog.mergeCloudRows(
      [makeRow(bundledId, { metadata: { lifecycle_status: 'retired' } })],
      EMPTY_RELATED,
    );
    assert('R2. merge reports change on retirement', result.changed === true);
    assert(
      'R2. tombstoned bundled scheme excluded from merged catalog',
      !result.schemes.some((s) => s.id === bundledId),
    );
    assert(
      'R2. other bundled schemes retained',
      result.schemes.some((s) => s.id === otherBundledId),
    );
  }

  /* R3. Tombstone-only response still retires (not swallowed by empty guard) */
  {
    catalog.__resetCatalogStateForTests();
    const result = catalog.mergeCloudRows(
      [makeRow(bundledId, { status: 'archived' })],
      EMPTY_RELATED,
    );
    assert(
      'R3. tombstone-only response retires the scheme',
      result.changed === true && !result.schemes.some((s) => s.id === bundledId),
    );
  }

  /* R4. Missing rows are NOT retirement */
  {
    catalog.__resetCatalogStateForTests();
    // Cloud response mentions only the tombstoned id; every other bundled
    // scheme is simply absent — with no tombstone signal they must survive.
    const result = catalog.mergeCloudRows(
      [makeRow(bundledId, { metadata: { retired_at: '2026-01-15' } })],
      EMPTY_RELATED,
    );
    const retained = SCHEMES_DATABASE.filter((s) => s.id !== bundledId).every((s) =>
      result.schemes.some((m) => m.id === s.id),
    );
    assert('R4. absent-without-tombstone bundled schemes retained', retained);
  }

  /* R5. Empty / null responses never shrink the catalog */
  {
    catalog.__resetCatalogStateForTests();
    const before = catalog.getCuratedSchemes();
    const emptyResult = catalog.mergeCloudRows([], EMPTY_RELATED);
    assert('R5. empty rows → unchanged catalog', emptyResult.changed === false && emptyResult.schemes === before);
    const nullResult = catalog.mergeCloudRows(null as unknown as Row[], EMPTY_RELATED);
    assert('R5. null rows → unchanged catalog', nullResult.changed === false && nullResult.schemes === before);
    const malformed = catalog.mergeCloudRows(
      [{ id: '', official_name: null } as unknown as Row],
      EMPTY_RELATED,
    );
    assert('R5. fully-malformed rows → unchanged catalog', malformed.changed === false);
  }

  /* R6. Ordinary published rows still merge normally */
  {
    catalog.__resetCatalogStateForTests();
    const payload = JSON.parse(JSON.stringify(SCHEMES_DATABASE[0]));
    const result = catalog.mergeCloudRows([makeRow('brand-new-cloud-scheme', { raw_payload: payload })], EMPTY_RELATED);
    assert(
      'R6. new published row appears in merged catalog',
      result.schemes.some((s) => s.id === 'brand-new-cloud-scheme'),
    );
    assert('R6. bundled schemes retained alongside', result.schemes.some((s) => s.id === bundledId));
  }

  console.log(`\n--- RETIREMENT / TOMBSTONE: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: tombstone suite crashed', err);
  process.exitCode = 1;
});
