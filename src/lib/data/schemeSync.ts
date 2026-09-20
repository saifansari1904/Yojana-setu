/**
 * YOJANA SETU — PHASE 1 BACKEND: REMOTE SCHEME DATASET SYNC
 *
 * Boot-time hydration of the scheme dataset from the Supabase Schemes API.
 *
 * Behavior contract (deliberately conservative):
 *  - Remote is OFF unless BOTH VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 *    are set. When off, this module is a no-op and the app runs 100% on the
 *    bundled dataset — byte-for-byte identical behavior to before Phase 1.
 *  - When on: fetch schemes (+ embedded translations) once at boot, cache
 *    for 24h in localStorage, and swap the repository dataset BEFORE first
 *    render (called from main.tsx). Any failure — network, timeout, bad
 *    payload — silently keeps the bundled dataset. The app never blocks on
 *    the network and never renders empty.
 *  - Matching stays on-device: the server only ships scheme content.
 */

import type { Scheme } from '../../types';
import type { LocalizedSchemeData } from '../../i18n/types';
import { SCHEMES_DATABASE } from '../../data/schemes';
import { normalizeScheme } from './normalization';
import { setActiveDataset } from './schemeRepository';
import { mergeRemoteSchemeTranslations } from '../../i18n/schemesData';

const CACHE_KEY = 'ys.schemes.cache.v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const FETCH_TIMEOUT_MS = 4000; // never hold up boot longer than this

// ---------------------------------------------------------------------------
// Remote config (env-flagged; default off)
// ---------------------------------------------------------------------------

function readEnv(name: string): string | undefined {
  try {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
    if (viteEnv && viteEnv[name]) return viteEnv[name];
  } catch {
    /* import.meta.env unavailable (tests / SSR) — fall through */
  }
  return typeof process !== 'undefined' ? process.env[name] : undefined;
}

export interface RemoteConfig {
  url: string;
  anonKey: string;
}

/** Null when the remote Schemes API is not configured (default). */
export function getRemoteConfig(): RemoteConfig | null {
  const url = readEnv('VITE_SUPABASE_URL');
  const anonKey = readEnv('VITE_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ''), anonKey };
}

export function isRemoteSchemesEnabled(): boolean {
  return getRemoteConfig() !== null;
}

// ---------------------------------------------------------------------------
// Remote row shapes (PostgREST)
// ---------------------------------------------------------------------------

interface RemoteTranslationRow {
  lang: string;
  name: string;
  sponsoring_ministry: string | null;
  department: string | null;
  scheme_type: string | null;
  benefit_summary: string | null;
  funding_range_text: string | null;
  required_documents: string[] | null;
  last_verified_date: string | null;
}

interface RemoteSchemeRow {
  id: string;
  data: unknown; // full normalized Scheme object (JSONB)
  scheme_translations: RemoteTranslationRow[] | null;
}

// ---------------------------------------------------------------------------
// Fetch + map
// ---------------------------------------------------------------------------

async function fetchRemoteSchemes(cfg: RemoteConfig): Promise<RemoteSchemeRow[]> {
  const endpoint =
    `${cfg.url}/rest/v1/schemes` +
    `?select=*,scheme_translations(*)&is_active=eq.true&order=updated_at.desc`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`Schemes API responded ${res.status}`);
    const rows = (await res.json()) as RemoteSchemeRow[];
    if (!Array.isArray(rows)) throw new Error('Schemes API returned non-array payload');
    return rows;
  } finally {
    clearTimeout(timer);
  }
}

function mapTranslationRow(t: RemoteTranslationRow, fallback: Scheme): LocalizedSchemeData {
  return {
    name: t.name,
    sponsoringMinistry: t.sponsoring_ministry ?? fallback.sponsoringMinistry,
    department: t.department ?? fallback.department,
    schemeType: t.scheme_type ?? fallback.schemeType,
    benefitSummary: t.benefit_summary ?? fallback.benefitSummary,
    fundingRangeText: t.funding_range_text ?? fallback.fundingRangeText,
    requiredDocuments: t.required_documents ?? fallback.requiredDocuments,
    lastVerifiedDate: t.last_verified_date ?? fallback.lastVerifiedDate,
  };
}

export interface RemoteDataset {
  schemes: Scheme[];
  translations: Partial<Record<string, Record<string, LocalizedSchemeData>>>;
}

/**
 * Maps raw PostgREST rows to app types. Rows whose `data` payload is not a
 * plausible Scheme are skipped (never let one bad row kill the dataset).
 */
export function mapRemoteRows(rows: RemoteSchemeRow[]): RemoteDataset {
  const schemes: Scheme[] = [];
  const translations: Partial<Record<string, Record<string, LocalizedSchemeData>>> = {};

  for (const row of rows) {
    try {
      const raw = row.data as Partial<Scheme> | null;
      if (!raw || typeof raw !== 'object' || raw.id !== row.id || !raw.name) continue;
      const scheme = normalizeScheme({ ...(raw as Scheme), id: row.id });
      schemes.push(scheme);

      for (const t of row.scheme_translations ?? []) {
        if (!t.lang || !t.name) continue;
        (translations[t.lang] ??= {})[row.id] = mapTranslationRow(t, scheme);
      }
    } catch {
      // Skip malformed rows — never let one bad row kill the dataset.
    }
  }
  return { schemes, translations };
}

// ---------------------------------------------------------------------------
// Cache (localStorage, 24h TTL)
// ---------------------------------------------------------------------------

interface CacheEntry {
  fetchedAt: number;
  schemes: Scheme[];
  translations: RemoteDataset['translations'];
}

function readCache(): CacheEntry | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry || !Array.isArray(entry.schemes) || entry.schemes.length === 0) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(schemes: Scheme[], translations: RemoteDataset['translations']): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const entry: CacheEntry = { fetchedAt: Date.now(), schemes, translations };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / privacy mode — cache is best-effort */
  }
}

export function clearSchemeCache(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function applyDataset(schemes: Scheme[], translations: RemoteDataset['translations']): void {
  // normalizeScheme is idempotent; re-apply defensively (e.g. cached payloads).
  setActiveDataset(schemes.map((s) => normalizeScheme(s)));
  mergeRemoteSchemeTranslations(translations);
}

/**
 * Hydrate the scheme dataset before first render. Resolves in all cases —
 * on any failure the bundled SCHEMES_DATABASE stays active.
 */
export async function bootSchemeDataset(): Promise<void> {
  const cfg = getRemoteConfig();
  if (!cfg) return; // remote off (default): bundled data, zero behavior change

  const cached = readCache();
  if (cached) {
    applyDataset(cached.schemes, cached.translations);
    return;
  }

  try {
    const { schemes, translations } = mapRemoteRows(await fetchRemoteSchemes(cfg));
    if (schemes.length === 0) return; // empty/malformed payload: keep bundled
    applyDataset(schemes, translations);
    writeCache(schemes, translations);
  } catch {
    // Network down, timeout, bad key, CORS — app continues on bundled data.
  }
}

/** Test/dev helper: revert to the bundled dataset. */
export function resetToBundledDataset(): void {
  clearSchemeCache();
  setActiveDataset(SCHEMES_DATABASE);
}
