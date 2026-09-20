/**
 * YOJANA SETU — PHASE 1 BACKEND: schemeSync TEST SUITE
 *
 * Verifies the remote-dataset boot contract:
 *  1. Remote OFF (default): no fetch, bundled dataset untouched.
 *  2. Remote ON + healthy API: dataset swapped, translations merged, cached.
 *  3. Cache hit: no network call.
 *  4. Remote ON + API failure: silent fallback to bundled data, no throw.
 *  5. Malformed rows never kill the dataset.
 */

import {
  bootSchemeDataset,
  clearSchemeCache,
  getRemoteConfig,
  isRemoteSchemesEnabled,
  mapRemoteRows,
  resetToBundledDataset,
} from './schemeSync';
import {
  getActiveDataset,
  getAllSchemes,
  getSchemeById,
  setActiveDataset,
} from './schemeRepository';
import { SCHEMES_DATABASE } from '../../data/schemes';
import { allLocalizedSchemes } from '../../i18n/schemesData';

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

// --- Node-environment stubs -------------------------------------------------

const memStore = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (memStore.has(k) ? memStore.get(k)! : null),
  setItem: (k: string, v: string) => {
    memStore.set(k, v);
  },
  removeItem: (k: string) => {
    memStore.delete(k);
  },
  clear: () => memStore.clear(),
};

const realFetch = (globalThis as unknown as { fetch?: unknown }).fetch;
let fetchCalls = 0;
let fetchImpl: (...args: [RequestInfo, RequestInit?]) => Promise<unknown> = () =>
  Promise.reject(new Error('fetch not stubbed'));

(globalThis as unknown as { fetch: unknown }).fetch = (...args: [RequestInfo, RequestInit?]) => {
  fetchCalls++;
  return fetchImpl(...args);
};

function setEnv(on: boolean) {
  if (on) {
    process.env.VITE_SUPABASE_URL = 'https://xyzcompany.supabase.co/';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  } else {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
  }
}

function resetState() {
  memStore.clear();
  fetchCalls = 0;
  setActiveDataset(SCHEMES_DATABASE);
  setEnv(false);
}

// --- Fake API payload --------------------------------------------------------

function fakeRows() {
  return [
    {
      id: 'remote-test-scheme',
      data: {
        id: 'remote-test-scheme',
        name: 'Remote Test Scheme',
        shortCode: 'RTS',
        sponsoringMinistry: 'Ministry of Testing',
        schemeType: 'Grant',
        benefitSummary: 'Test benefits',
        fundingRangeText: '₹1 – ₹2',
        minAmount: 1,
        maxAmount: 2,
        baseInterestRate: 0,
        standardTenureYears: 1,
        moratoriumPeriodMonths: 0,
        targetCategories: ['General'],
        minAge: 18,
        maxAge: 60,
        maxAnnualIncomeCap: 0,
        targetBusinessTypes: ['services'],
        applicableStates: [],
        requiredDocuments: ['Aadhaar Card'],
        officialPortalUrl: 'https://example.gov.in',
        lastVerifiedDate: '2026',
        applicationMode: 'Online via Portal',
      },
      scheme_translations: [
        {
          lang: 'hi',
          name: 'रिमोट टेस्ट योजना',
          sponsoring_ministry: null,
          department: null,
          scheme_type: null,
          benefit_summary: 'परीक्षण लाभ',
          funding_range_text: null,
          required_documents: null,
          last_verified_date: null,
        },
      ],
    },
    // Malformed row: must be skipped, not fatal.
    { id: 'bad-row', data: { nonsense: true }, scheme_translations: [] },
  ];
}

function okResponse(rows: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(rows) };
}

// --- Tests -------------------------------------------------------------------

async function main() {
  // 1. Remote OFF (default): no fetch, bundled data untouched
  resetState();
  await bootSchemeDataset();
  assert(fetchCalls === 0, 'Remote off: no network call at boot');
  assert(!isRemoteSchemesEnabled(), 'Remote off: isRemoteSchemesEnabled() is false');
  assert(
    getAllSchemes().length === SCHEMES_DATABASE.length,
    'Remote off: bundled dataset stays active'
  );

  // 2. getRemoteConfig reads env + trims trailing slash
  resetState();
  setEnv(true);
  const cfg = getRemoteConfig();
  assert(cfg !== null, 'Remote on: getRemoteConfig() returns config');
  assert(
    cfg?.url === 'https://xyzcompany.supabase.co',
    'getRemoteConfig trims trailing slash from URL',
    cfg?.url
  );
  assert(isRemoteSchemesEnabled(), 'Remote on: isRemoteSchemesEnabled() is true');

  // 3. Remote ON + healthy API: swap + translations + cache
  resetState();
  setEnv(true);
  fetchImpl = () => Promise.resolve(okResponse(fakeRows()));
  await bootSchemeDataset();
  assert(fetchCalls === 1, 'Remote on: exactly one API call at boot');
  assert(
    getSchemeById('remote-test-scheme')?.name === 'Remote Test Scheme',
    'Remote dataset replaces bundled dataset in repository'
  );
  assert(
    getAllSchemes().length === 1,
    'Remote dataset contains only remote schemes',
    `got ${getAllSchemes().length}`
  );
  const hiName = allLocalizedSchemes.hi?.['remote-test-scheme']?.name;
  assert(hiName === 'रिमोट टेस्ट योजना', 'Remote translations merged into i18n dictionaries', hiName);
  assert(
    allLocalizedSchemes.hi?.['remote-test-scheme']?.benefitSummary === 'परीक्षण लाभ',
    'Remote translation fields mapped (snake_case -> camelCase)'
  );
  assert(
    memStore.has('ys.schemes.cache.v1'),
    'Remote dataset cached to localStorage'
  );

  // 4. Cache hit: no network on second boot
  fetchCalls = 0;
  fetchImpl = () => Promise.reject(new Error('should not be called'));
  await bootSchemeDataset();
  assert(fetchCalls === 0, 'Fresh cache: no network call on second boot');
  assert(
    getSchemeById('remote-test-scheme') !== undefined,
    'Fresh cache: cached dataset applied'
  );

  // 5. Remote ON + API failure: silent fallback to bundled
  resetState();
  setEnv(true);
  fetchImpl = () => Promise.reject(new Error('network down'));
  let threw = false;
  try {
    await bootSchemeDataset();
  } catch {
    threw = true;
  }
  assert(!threw, 'API failure: boot never throws');
  assert(
    getAllSchemes().length === SCHEMES_DATABASE.length,
    'API failure: bundled dataset stays active'
  );

  // 6. HTTP error status: same fallback
  resetState();
  setEnv(true);
  fetchImpl = () => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
  await bootSchemeDataset();
  assert(
    getAllSchemes().length === SCHEMES_DATABASE.length,
    'HTTP 401: bundled dataset stays active'
  );

  // 7. mapRemoteRows skips malformed rows
  const mapped = mapRemoteRows(fakeRows() as never);
  assert(mapped.schemes.length === 1, 'mapRemoteRows skips malformed rows');
  assert(
    mapped.schemes[0].id === 'remote-test-scheme',
    'mapRemoteRows keeps valid rows'
  );

  // 8. resetToBundledDataset restores the bundle
  resetToBundledDataset();
  assert(
    getActiveDataset().length === SCHEMES_DATABASE.length,
    'resetToBundledDataset restores bundled dataset'
  );
  assert(!memStore.has('ys.schemes.cache.v1'), 'resetToBundledDataset clears cache');

  // --- cleanup ---
  resetState();
  if (realFetch) {
    (globalThis as unknown as { fetch: unknown }).fetch = realFetch;
  } else {
    delete (globalThis as unknown as { fetch?: unknown }).fetch;
  }

  console.log(`=== TEST RESULTS ===\nPassed: ${passed}\nFailed: ${failed}\n`);
  if (failed > 0) process.exit(1);
}

main();
