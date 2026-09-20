/**
 * PHASE 4.3 — DOCUMENT PROGRESS STORE
 *
 * Single source of truth for "which documents has this citizen prepared".
 * Previously the scheme detail checklist wrote to sessionStorage while the
 * tracker read localStorage, so progress vanished on a new tab. This store
 * unifies both on localStorage and migrates any legacy sessionStorage keys.
 *
 * Deterministic, no network, no fabricated document state: an id is only
 * present when the citizen explicitly ticked it.
 */

const STORAGE_KEY = 'yojana_setu_document_progress_v1';
const LEGACY_PREFIX = 'setu_docs_';

export type DocumentProgressMap = Record<string, string[]>;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Reads the whole map, discarding malformed entries rather than throwing. */
export const loadDocumentProgress = (): DocumentProgressMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const clean: DocumentProgressMap = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([schemeId, ids]) => {
      if (isStringArray(ids)) clean[schemeId] = Array.from(new Set(ids));
    });
    return clean;
  } catch {
    return {};
  }
};

export const saveDocumentProgress = (map: DocumentProgressMap): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage blocked or full — progress stays in memory for this session.
  }
};

/**
 * One-time migration of legacy per-scheme sessionStorage keys
 * (`setu_docs_<schemeId>`) into the unified localStorage map.
 * Legacy keys are left untouched; the merge prefers the union of both.
 */
export const migrateLegacyDocumentProgress = (): DocumentProgressMap => {
  if (typeof window === 'undefined') return {};
  const current = loadDocumentProgress();

  try {
    let changed = false;
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith(LEGACY_PREFIX)) continue;

      const schemeId = key.slice(LEGACY_PREFIX.length);
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!isStringArray(parsed)) continue;

      const merged = Array.from(new Set([...(current[schemeId] || []), ...parsed]));
      if (merged.length !== (current[schemeId] || []).length) {
        current[schemeId] = merged;
        changed = true;
      }
    }
    if (changed) saveDocumentProgress(current);
  } catch {
    // A malformed legacy key must never break startup.
  }

  return current;
};

export const getPreparedDocIds = (
  map: DocumentProgressMap,
  schemeId: string,
): string[] => map[schemeId] || [];

/** Pure toggle — returns a new map, never mutates the input. */
export const toggleDocumentPrepared = (
  map: DocumentProgressMap,
  schemeId: string,
  docId: string,
): DocumentProgressMap => {
  const existing = map[schemeId] || [];
  const next = existing.includes(docId)
    ? existing.filter((id) => id !== docId)
    : [...existing, docId];

  const result: DocumentProgressMap = { ...map, [schemeId]: next };
  if (next.length === 0) delete result[schemeId];
  return result;
};

export const setDocumentsPrepared = (
  map: DocumentProgressMap,
  schemeId: string,
  docIds: string[],
): DocumentProgressMap => {
  const unique = Array.from(new Set(docIds));
  const result: DocumentProgressMap = { ...map, [schemeId]: unique };
  if (unique.length === 0) delete result[schemeId];
  return result;
};

/**
 * Readiness for a scheme, derived from explicit ticks only.
 * `allReady` stays false when the scheme lists no documents, because
 * "no document data" is not the same as "nothing required".
 */
export const summariseDocumentProgress = (
  map: DocumentProgressMap,
  schemeId: string,
  totalDocuments: number,
): { ready: number; total: number; allReady: boolean; hasEngaged: boolean } => {
  const prepared = getPreparedDocIds(map, schemeId);
  const ready = Math.min(prepared.length, totalDocuments);
  return {
    ready,
    total: totalDocuments,
    allReady: totalDocuments > 0 && ready >= totalDocuments,
    hasEngaged: prepared.length > 0,
  };
};
