/**
 * YOJANA SETU — CLOUD SCHEME CATALOG (PHASE 2A HARDENED)
 * ------------------------------------------------------------------
 * The curated (authoritative) scheme catalog now lives in Supabase.
 * This module is the single source of truth for curated schemes:
 *
 *   boot:      bundled SCHEMES_DATABASE -> instant, offline-safe
 *   + cache:   last good cloud payload from localStorage -> instant, fresh-ish
 *   + refresh: background fetch of published rows -> live updates, no reload
 *
 * Candidates (unverified discovery data) stay bundled by design — they are
 * drafts in the database and never publicly readable.
 *
 * Mapping contract (see migration 017):
 *   Scheme = { ...row.raw_payload, <structured display columns override> }
 * Structured columns (official_name, benefit_summary, ...) win so an admin
 * edit in the database is reflected in the app. Eligibility semantics stay
 * exactly as curated (raw_payload), so matching behavior never changes.
 *
 * ARCHITECTURE — READ BEFORE CHANGING MATCHING
 * ---------------------------------------------
 * CURRENT (production matching path — do not reroute):
 *
 *   Supabase scheme row (status='published')
 *         |
 *   raw_payload (lossless frontend JSON, backfilled for all 259 rows)
 *         |
 *   mapRowToScheme() below
 *         |
 *   existing deterministic matching / eligibility engines (unchanged)
 *
 * The normalized tables (scheme_eligibility_rules, scheme_document_requirements,
 * scheme_funding, scheme_application_info, scheme_sources, scheme_localizations,
 * scheme_versions) are SEEDED and validated, but they are NOT consumed by the
 * production matching path — EXCEPT as a best-effort fallback when building a
 * Scheme object for a genuinely new admin-added row that has no raw_payload
 * yet (see blankScheme). They must NOT become a second conflicting source of
 * truth for curated schemes: for those, raw_payload is the single source.
 *
 * FUTURE (NOT designed yet — do not start):
 *
 *   Supabase normalized scheme intelligence
 *         |
 *   validated rules
 *         |
 *   existing deterministic matching / eligibility engines
 *
 * TODO(phase-3): separately design Source Registry -> ingestion -> normalization
 * -> validation -> scheme versions -> structured eligibility rules -> document
 * requirements -> funding intelligence -> verification workflow -> admin review.
 * That phase must not accidentally change matching weights, eligibility
 * semantics, MATCHED/UNKNOWN/MISMATCHED states, or scoring.
 *
 * DESIGN CONTRACTS
 * ----------------
 * 1. Boot is instant and offline-safe: bundled data (or cache) renders first;
 *    the cloud refresh runs in the background and never throws.
 * 2. Catalog source is tracked internally as 'bundled' | 'cached' | 'cloud'.
 *    A cached catalog is NEVER presented as freshly verified cloud data.
 * 3. Cache is versioned (CACHE_VERSION). Old versions are ignored, never parsed.
 *    Only scheme-catalog cache keys are ever touched — never user data.
 * 4. The digest is stable/deterministic and covers every field that can
 *    materially affect scheme behavior (see schemeDigest). Volatile timestamps
 *    are excluded.
 * 5. Merge is a UNION: a partial cloud response never shrinks the catalog.
 *    Explicit unpublish/tombstone semantics belong to the admin-review phase.
 */

import type { Scheme, SchemeFactorKey, SchemeSourceProvenance } from '../../types/scheme';
import type { SocialCategory, BusinessType } from '../../types/user';
import type { SchemeType, ApplicationMode } from '../../data/schemeTaxonomy';
import { SCHEMES_DATABASE } from '../../data/schemes';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';

// ---------------------------------------------------------------------------
// Local cache (instant boot, offline resilience)
// ---------------------------------------------------------------------------
//
// Cache versioning: bump CACHE_VERSION when the mapper or the cached shape
// changes. Old versions are ignored (never parsed, never crash). Only the
// scheme-catalog cache keys are ever touched — never user data.

const CACHE_VERSION = 2;
const CACHE_KEY = `ys_cloud_schemes_v${CACHE_VERSION}`;
const LEGACY_CACHE_KEYS = ['ys_cloud_schemes_v1'];

interface CacheShape {
  version: number;
  fetchedAt: string;
  schemes: Scheme[];
}

/**
 * Internal catalog provenance — NOT a user-facing feature. Exists so tests
 * and diagnostics can distinguish bundled / cached / cloud states. A cached
 * catalog is never presented as freshly verified cloud data.
 */
export type CatalogSource = 'bundled' | 'cached' | 'cloud';

let curatedSchemes: Scheme[] = SCHEMES_DATABASE;
let catalogSource: CatalogSource = 'bundled';
let inFlightRefresh: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function removeStorage(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Validate that a cached payload is really a scheme array we wrote. */
function isValidCachedCatalog(value: unknown): value is CacheShape {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== CACHE_VERSION) return false;
  if (typeof v.fetchedAt !== 'string') return false;
  if (!Array.isArray(v.schemes)) return false;
  return v.schemes.every(
    (s) => typeof s === 'object' && s !== null && typeof (s as Scheme).id === 'string',
  );
}

function hydrateFromCache(): void {
  // Drop obsolete catalog-cache keys (catalog cache only — never user data).
  for (const legacy of LEGACY_CACHE_KEYS) removeStorage(legacy);
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidCachedCatalog(parsed) || parsed.schemes.length === 0) return;
    curatedSchemes = parsed.schemes;
    catalogSource = 'cached';
  } catch {
    // Corrupt cache -> discard safely, bundled data stays.
    removeStorage(CACHE_KEY);
  }
}

function persistCache(schemes: Scheme[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const payload: CacheShape = {
      version: CACHE_VERSION,
      fetchedAt: new Date().toISOString(),
      schemes,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full / private mode -> non-fatal.
  }
}

hydrateFromCache();

/** Current curated catalog: cloud data when available, bundled fallback otherwise. */
export function getCuratedSchemes(): Scheme[] {
  return curatedSchemes;
}

/** Internal catalog provenance: 'bundled' | 'cached' | 'cloud'. Not user-facing. */
export function getCatalogSource(): CatalogSource {
  return catalogSource;
}

export function subscribeCuratedSchemes(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Lifecycle-safe subscription helper (§11). Wires a catalog-change listener
 * that stops notifying once `isCancelled()` returns true — e.g. after the
 * subscribing component unmounts. The catalog module itself only notifies on
 * real digest changes, so the callback fires at most once per meaningful swap.
 */
export function subscribeCatalogChanges(
  onChange: () => void,
  isCancelled: () => boolean,
): () => void {
  return subscribeCuratedSchemes(() => {
    if (!isCancelled()) onChange();
  });
}

/**
 * @internal Test-only: fires catalog-change listeners exactly as a real swap
 * does (used to verify cancelled/unmounted subscribers stay silent).
 */
export function __emitCatalogChangeForTests(): void {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      // Listener errors must not break the catalog swap.
    }
  }
}

/**
 * @internal Test-only: resets in-memory catalog state and re-hydrates from
 * localStorage, simulating a fresh module load. Never used by the app.
 */
export function __resetCatalogStateForTests(): void {
  curatedSchemes = SCHEMES_DATABASE;
  catalogSource = 'bundled';
  inFlightRefresh = null;
  listeners.clear();
  hydrateFromCache();
}

// ---------------------------------------------------------------------------
// Database row types (loose: only the columns we read)
// ---------------------------------------------------------------------------

export interface SchemeRow {
  id: string;
  official_name: string | null;
  short_code: string | null;
  official_scheme_identifier: string | null;
  sponsoring_ministry: string | null;
  department: string | null;
  scheme_type: string | null;
  scope: string | null;
  benefit_summary: string | null;
  description: string | null;
  funding_range_text: string | null;
  metadata: { tags?: string[]; categories?: string[] } | null;
  raw_payload: Partial<Scheme> | null;
}

export interface SourceRow {
  scheme_id: string;
  source_name: string | null;
  source_type: string | null;
  official_source_url: string | null;
  is_official_government_source: boolean | null;
  priority_level: number | null;
  verification_status: string | null;
  last_verified_at: string | null;
  source_notes: string | null;
}

export interface RuleRow {
  scheme_id: string;
  criterion_key: string;
  operator: string;
  value: unknown;
  is_mandatory: boolean | null;
}

export interface DocRow {
  scheme_id: string;
  document_label: string | null;
}

export interface FundingRow {
  scheme_id: string;
  min_amount: number | null;
  max_amount: number | null;
}

export interface AppInfoRow {
  scheme_id: string;
  application_mode: string | null;
  official_portal_url: string | null;
}

export interface Related {
  source?: SourceRow;
  rules: RuleRow[];
  docs: DocRow[];
  funding?: FundingRow;
  appInfo?: AppInfoRow;
}

// ---------------------------------------------------------------------------
// Row -> Scheme mapping
// ---------------------------------------------------------------------------

/**
 * SOURCE / PROVENANCE (§8)
 * ------------------------
 * The Scheme domain model carries a SINGLE sourceProvenance object. When a
 * scheme has multiple source rows they are collapsed by authority (lowest
 * priority_level first, done by the caller) — documented here, not silently.
 * Verification status and the official-government flag are copied VERBATIM
 * from the database (with the payload as fallback); VERIFIED is never inferred
 * from "a URL exists", and "government source" is never inferred from
 * ".gov.in" alone — both come from the curated is_official_government_source /
 * verification_status columns.
 */
function mapSource(row: SourceRow, fallback?: SchemeSourceProvenance): SchemeSourceProvenance {
  return {
    sourceName: row.source_name ?? fallback?.sourceName ?? '',
    sourceType: (row.source_type as SchemeSourceProvenance['sourceType']) ?? fallback?.sourceType ?? 'statutory_guideline',
    officialSourceUrl: row.official_source_url ?? fallback?.officialSourceUrl ?? '',
    isOfficialGovernmentSource: row.is_official_government_source ?? fallback?.isOfficialGovernmentSource ?? false,
    priorityLevel: (row.priority_level as SchemeSourceProvenance['priorityLevel']) ?? fallback?.priorityLevel ?? 5,
    verificationStatus: (row.verification_status as SchemeSourceProvenance['verificationStatus']) ?? fallback?.verificationStatus ?? 'UNVERIFIED',
    lastVerifiedDate: row.last_verified_at ?? fallback?.lastVerifiedDate ?? '',
    sourceNotes: row.source_notes ?? fallback?.sourceNotes,
  };
}

/**
 * UNKNOWN-INFORMATION SEMANTICS (§6 audit)
 * ----------------------------------------
 * How the existing engines treat scheme-side numeric fields:
 *
 *   maxAnnualIncomeCap: 0 = NO CONSTRAINT. The engines guard with `> 0`
 *     (eligibilityEngine, matchingCore), so 0 never blocks anyone.
 *   minAge: 0 = no lower bound (`profile.age >= scheme.minAge`).
 *   maxAge: 0 = HARD UPPER BOUND — there is NO "no constraint" value for age.
 *     `profile.age <= scheme.maxAge` with maxAge 0 marks every provided age
 *     MISMATCHED. The Scheme type (number) cannot represent "unknown limit".
 *   minAmount / maxAmount / baseInterestRate / standardTenureYears /
 *     moratoriumPeriodMonths: display-only, never consumed by matching.
 *   UNKNOWN (user didn't answer) is a separate, profile-side concept
 *     (CriterionEvaluationState / allows_unknown) — never conflated here.
 *
 * blankScheme() below therefore derives age/income/category bounds from the
 * seeded eligibility RULES (not zeros) whenever they exist — the most honest
 * best-effort for a new admin-added row without raw_payload. When no rules
 * exist either, the 0 fallbacks apply and the row should not be published
 * without real age bounds (see the dev warning in mergeCloudRows).
 * Widening the type (e.g. maxAge: number | null + an engine null-check) is the
 * correct future fix and belongs to the Scheme Intelligence phase — it needs
 * an engine change, which is out of scope for hardening.
 *
 * Best-effort Scheme for admin-added rows that have no raw_payload yet.
 */
function blankScheme(row: SchemeRow, rel: Related): Scheme {
  const inRule = (key: SchemeFactorKey): string[] => {
    const r = rel.rules.find((x) => x.criterion_key === key && x.operator === 'in');
    return Array.isArray(r?.value) ? (r.value as string[]) : [];
  };
  const numRule = (key: SchemeFactorKey, op: string): number | null => {
    const r = rel.rules.find((x) => x.criterion_key === key && x.operator === op);
    return typeof r?.value === 'number' ? r.value : null;
  };
  const between = rel.rules.find((x) => x.criterion_key === 'age' && x.operator === 'between')?.value as
    | { min?: number; max?: number }
    | undefined;

  return {
    id: row.id,
    name: row.official_name ?? row.id,
    shortCode: row.short_code ?? '',
    sponsoringMinistry: row.sponsoring_ministry ?? '',
    department: row.department ?? undefined,
    schemeType: (row.scheme_type as SchemeType) ?? 'Grant',
    benefitSummary: row.benefit_summary ?? '',
    fundingRangeText: row.funding_range_text ?? '',
    minAmount: rel.funding?.min_amount ?? 0,
    maxAmount: rel.funding?.max_amount ?? 0,
    baseInterestRate: 0,
    standardTenureYears: 0,
    moratoriumPeriodMonths: 0,
    targetCategories: inRule('category') as SocialCategory[],
    minAge: between?.min ?? numRule('age', 'gte') ?? 0,
    maxAge: between?.max ?? numRule('age', 'lte') ?? 0,
    maxAnnualIncomeCap: numRule('income', 'lte') ?? 0,
    targetBusinessTypes: inRule('businessType') as BusinessType[],
    applicableStates: inRule('state'),
    requiredDocuments: rel.docs.map((d) => d.document_label ?? '').filter(Boolean),
    officialPortalUrl: rel.appInfo?.official_portal_url ?? '',
    lastVerifiedDate: '',
    applicationMode: (rel.appInfo?.application_mode as ApplicationMode) ?? 'Online via Portal',
    scope: (row.scope as Scheme['scope']) ?? 'NATIONAL',
    categories: (row.metadata?.categories as Scheme['categories']) ?? [],
    tags: row.metadata?.tags ?? [],
    officialSchemeIdentifier: row.official_scheme_identifier ?? undefined,
    description: row.description ?? undefined,
    sourceProvenance: rel.source ? mapSource(rel.source) : undefined,
    mandatoryCriteria: rel.rules.filter((r) => r.is_mandatory).map((r) => r.criterion_key as SchemeFactorKey),
  };
}

/**
 * Array fields the matcher and detail screens call `.includes()` on.
 * `aliases` accepts snake_case keys from hand-authored import payloads.
 * Anything missing or mistyped falls back to the blankScheme default
 * (already on `base`) — never to `undefined`.
 */
const SCHEME_ARRAY_ALIASES: Array<{ key: keyof Scheme; aliases: string[] }> = [
  { key: 'targetCategories', aliases: ['target_categories', 'social_categories'] },
  { key: 'targetBusinessTypes', aliases: ['target_business_types', 'business_types'] },
  { key: 'applicableStates', aliases: ['applicable_states', 'states'] },
  { key: 'requiredDocuments', aliases: ['required_documents', 'documents'] },
  { key: 'mandatoryCriteria', aliases: ['mandatory_criteria'] },
  { key: 'tags', aliases: [] },
  { key: 'categories', aliases: [] },
];

/** Extract a string array, dropping non-scalar values (never "[object Object]"). */
function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const v of value) {
    if (typeof v === 'string') out.push(v);
    else if (typeof v === 'number' || typeof v === 'boolean') out.push(String(v));
  }
  return out;
}

function coerceSchemeArrays(base: Scheme, raw: Record<string, unknown> | null): void {
  const rec = base as unknown as Record<string, unknown>;
  for (const { key, aliases } of SCHEME_ARRAY_ALIASES) {
    // 1) payload's own camelCase value wins (same as the old spread behavior)
    const direct = raw ? asStringArray(raw[key as string]) : undefined;
    if (direct) {
      rec[key] = direct;
      continue;
    }
    // 2) snake_case import aliases
    let aliased: string[] | undefined;
    if (raw) {
      for (const a of aliases) {
        aliased = asStringArray(raw[a]);
        if (aliased) break;
      }
    }
    if (aliased) {
      rec[key] = aliased;
      continue;
    }
    // 3) blankScheme rule-derived default, if the spread left a real array
    if (Array.isArray(rec[key])) continue;
    // 4) last resort: a mistyped payload value can never reach `.includes()`
    rec[key] = [];
  }
}

export function mapRowToScheme(row: SchemeRow, rel: Related): Scheme {
  const raw = (row.raw_payload ?? null) as Record<string, unknown> | null;
  // Never trust a hand-authored payload: start from blankScheme defaults
  // (match-critical arrays are derived from eligibility rules there),
  // overlay the payload, then coerce. A missing/mistyped array degrades
  // to [] instead of crashing the matcher on `.includes()`.
  const base = { ...blankScheme(row, rel), ...(raw ?? {}) } as Scheme;
  coerceSchemeArrays(base, raw);

  // Structured display columns override the payload so admin edits apply.
  base.id = row.id;
  if (row.official_name) base.name = row.official_name;
  if (row.short_code) base.shortCode = row.short_code;
  if (row.sponsoring_ministry) base.sponsoringMinistry = row.sponsoring_ministry;
  if (row.department != null) base.department = row.department || undefined;
  if (row.scheme_type) base.schemeType = row.scheme_type as SchemeType;
  if (row.scope) base.scope = row.scope as Scheme['scope'];
  if (row.benefit_summary) base.benefitSummary = row.benefit_summary;
  if (row.description != null) base.description = row.description || undefined;
  if (row.funding_range_text) base.fundingRangeText = row.funding_range_text;
  if (row.official_scheme_identifier != null)
    base.officialSchemeIdentifier = row.official_scheme_identifier || undefined;
  if (row.metadata?.tags) base.tags = row.metadata.tags;
  if (row.metadata?.categories) base.categories = row.metadata.categories as Scheme['categories'];

  if (rel.source) base.sourceProvenance = mapSource(rel.source, base.sourceProvenance);
  if (rel.appInfo?.application_mode) base.applicationMode = rel.appInfo.application_mode as ApplicationMode;
  if (rel.appInfo?.official_portal_url) base.officialPortalUrl = rel.appInfo.official_portal_url;
  if (rel.docs.length > 0)
    base.requiredDocuments = rel.docs.map((d) => d.document_label ?? '').filter(Boolean);
  if (rel.funding) {
    if (rel.funding.min_amount != null) base.minAmount = rel.funding.min_amount;
    if (rel.funding.max_amount != null) base.maxAmount = rel.funding.max_amount;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Stable digest (§5). Covers every field that can materially affect scheme
// behavior. Deterministic: object keys are sorted recursively, order-free
// string arrays are sorted, and volatile timestamps are excluded.
// ---------------------------------------------------------------------------

/** JSON stringify with recursively sorted keys (deterministic). */
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function sortedStrings(input: readonly string[] | undefined): string[] {
  return [...(input ?? [])].sort();
}

/**
 * Behavior-relevant digest input for one scheme.
 *
 * Included: identity, financial, targeting, eligibility, documents, application
 * channel, source provenance (non-volatile), trust signals (non-volatile),
 * relevant intelligence subtrees.
 *
 * Excluded (volatile, do not affect behavior): lastVerifiedDate /
 * last_verified_at / verifiedAt / nextReviewAt / daysSinceVerification /
 * freshnessLabel / lastUpdatedDate / source_notes.
 */
function schemeDigestInput(s: Scheme): unknown {
  const intel = s.intelligence;
  return {
    id: s.id,
    name: s.name ?? '',
    shortCode: s.shortCode ?? '',
    sponsoringMinistry: s.sponsoringMinistry ?? '',
    department: s.department ?? '',
    schemeType: s.schemeType ?? '',
    description: s.description ?? '',
    benefitSummary: s.benefitSummary ?? '',
    fundingRangeText: s.fundingRangeText ?? '',
    minAmount: s.minAmount ?? 0,
    maxAmount: s.maxAmount ?? 0,
    applicationMode: s.applicationMode ?? '',
    officialPortalUrl: s.officialPortalUrl ?? '',
    officialSchemeIdentifier: s.officialSchemeIdentifier ?? '',
    scope: s.scope ?? '',
    categories: sortedStrings(s.categories as readonly string[] | undefined),
    tags: sortedStrings(s.tags),
    applicableStates: sortedStrings(s.applicableStates),
    targetCategories: sortedStrings(s.targetCategories as readonly string[] | undefined),
    targetBusinessTypes: sortedStrings(s.targetBusinessTypes as readonly string[] | undefined),
    requiredDocuments: sortedStrings(s.requiredDocuments),
    mandatoryCriteria: sortedStrings(s.mandatoryCriteria as readonly string[] | undefined),
    isWomenSpecific: !!s.isWomenSpecific,
    isMinoritySpecific: !!s.isMinoritySpecific,
    isScStSpecific: !!s.isScStSpecific,
    purpose: s.purpose ?? '',
    fundingPurpose: s.fundingPurpose ?? '',
    source: s.sourceProvenance
      ? {
          sourceName: s.sourceProvenance.sourceName ?? '',
          sourceType: s.sourceProvenance.sourceType ?? '',
          officialSourceUrl: s.sourceProvenance.officialSourceUrl ?? '',
          isOfficialGovernmentSource: !!s.sourceProvenance.isOfficialGovernmentSource,
          priorityLevel: s.sourceProvenance.priorityLevel ?? 0,
          verificationStatus: s.sourceProvenance.verificationStatus ?? '',
        }
      : null,
    trust: s.trustProfile
      ? {
          source: {
            sourceName: s.trustProfile.source.sourceName ?? '',
            sourceType: s.trustProfile.source.sourceType ?? '',
            sourceUrl: s.trustProfile.source.sourceUrl ?? '',
            hierarchyLevel: s.trustProfile.source.hierarchyLevel ?? '',
            isOfficialGovernmentSource: !!s.trustProfile.source.isOfficialGovernmentSource,
          },
          officialSource: {
            ministryOrDepartment: s.trustProfile.officialSource.ministryOrDepartment ?? '',
            implementingAgency: s.trustProfile.officialSource.implementingAgency ?? '',
            officialPortalUrl: s.trustProfile.officialSource.officialPortalUrl ?? '',
            isGovernmentDomain: !!s.trustProfile.officialSource.isGovernmentDomain,
            gazetteOrNotificationRef:
              s.trustProfile.officialSource.gazetteOrNotificationRef ?? '',
          },
          verification: {
            status: s.trustProfile.verification.status ?? '',
            verifiedBy: s.trustProfile.verification.verifiedBy ?? '',
            verifiedFields: sortedStrings(s.trustProfile.verification.verifiedFields),
            unverifiedFields: sortedStrings(s.trustProfile.verification.unverifiedFields),
          },
          confidence: s.trustProfile.confidence ?? '',
          entrepreneurRelevance: s.trustProfile.entrepreneurRelevance ?? '',
          urlSafety: s.trustProfile.urlSafety ?? '',
        }
      : null,
    intelligence: intel
      ? {
          targeting: intel.targeting,
          financial: intel.financial,
          eligibility: intel.eligibility,
          application: intel.application,
          governance: {
            officialSourceUrl: intel.governance.officialSourceUrl ?? '',
            sourceName: intel.governance.sourceName ?? '',
            sourceType: intel.governance.sourceType ?? '',
            verificationStatus: intel.governance.verificationStatus ?? '',
            isActive: !!intel.governance.isActive,
            dataVersion: intel.governance.dataVersion ?? '',
          },
          // identity.* duplicates top-level fields already digested above.
        }
      : null,
  };
}

/** FNV-1a 32-bit hash (deterministic, fast; for change detection, not security). */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Stable digest of one scheme's behavior-relevant fields. */
export function schemeDigest(scheme: Scheme): string {
  return fnv1a(stableStringify(schemeDigestInput(scheme)));
}

/** Stable digest of a whole catalog (order-independent). */
export function catalogDigest(schemes: readonly Scheme[]): string {
  const parts = schemes.map((s) => `${s.id}:${schemeDigest(s)}`).sort();
  return fnv1a(parts.join('|'));
}

// ---------------------------------------------------------------------------
// Merge (§9). Pure function — extracted so failure semantics are unit-testable
// without a Supabase client.
// ---------------------------------------------------------------------------

export interface MergeResult {
  schemes: Scheme[];
  /** True when the catalog content meaningfully changed and should be swapped. */
  changed: boolean;
}

/**
 * Merge cloud rows into the active catalog.
 *
 * Guarantees:
 * - Empty cloud response -> { changed: false } (never replace a working
 *   catalog with empty data).
 * - Malformed rows are skipped per-row; one bad row never crashes the merge.
 * - Rows without raw_payload keep the existing bundled/cached object
 *   (no degradation window).
 * - UNION, not replace: current-catalog schemes whose ids are absent from
 *   the cloud response are retained as-is, so a partial/failed response can
 *   never silently shrink the catalog. Explicit unpublish/tombstone semantics
 *   belong to the future admin-review phase.
 * - STALE-PHANTOM EVICTION: the published query returns the complete set
 *   (no pagination; row counts are far below PostgREST limits), so on a
 *   successful refresh the cloud response is authoritative for membership.
 *   A previous-catalog scheme whose id is in NEITHER the cloud response NOR
 *   the bundled offline base is a stale phantom — e.g. cached during an era
 *   when the cloud briefly published an extra row — and is evicted. Without
 *   this, a stale cache fossilizes the extra scheme forever, because the
 *   plain UNION could never remove it. Bundled ids are always retained: the
 *   bundled catalog is the offline fallback and must never shrink.
 * - `changed` is true only when the stable digest differs.
 */
export function mergeCloudRows(
  rows: SchemeRow[],
  relatedById: Map<string, Related>,
): MergeResult {
  if (!rows || rows.length === 0) {
    return { schemes: getCuratedSchemes(), changed: false };
  }

  const currentById = new Map(getCuratedSchemes().map((s) => [s.id, s]));
  const mapped: Scheme[] = [];
  for (const row of rows) {
    try {
      if (!row || typeof row.id !== 'string' || row.id.length === 0) continue;
      const rel = relatedById.get(row.id) ?? {
        rules: [],
        docs: [],
      };
      // A row without raw_payload maps losslessly to nothing — keep the
      // existing version instead so the app never degrades. Truly new
      // (admin-added) rows use structured mapping (see blankScheme).
      if (!row.raw_payload) {
        const existing = currentById.get(row.id);
        if (existing) {
          mapped.push(existing);
          continue;
        }
        if (typeof window !== 'undefined' && import.meta.env?.DEV) {
          const rel = relatedById.get(row.id);
          const hasAgeRule = (rel?.rules ?? []).some((r) => r.criterion_key === 'age');
          if (!hasAgeRule) {
            // eslint-disable-next-line no-console
            console.warn(
              `[cloudSchemeCatalog] published scheme "${row.id}" has no raw_payload ` +
                'and no age rules; structured-only mapping in use. Ensure the row ' +
                'carries real age bounds — the matching engine treats maxAge 0 ' +
                'as a hard upper bound.',
            );
          }
        }
      }
      mapped.push(mapRowToScheme(row, rel));
    } catch {
      // One malformed row must never crash the catalog — skip it.
    }
  }

  if (mapped.length === 0) {
    return { schemes: getCuratedSchemes(), changed: false };
  }

  const previous = getCuratedSchemes();
  const seenIds = new Set(mapped.map((s) => s.id));
  // The bundled catalog is the offline base — its ids survive every merge.
  const bundledIds = new Set(SCHEMES_DATABASE.map((s) => s.id));
  const merged: Scheme[] = [...mapped];
  let evicted = 0;
  for (const s of previous) {
    if (seenIds.has(s.id)) continue; // superseded by the fresh cloud row
    if (!bundledIds.has(s.id)) {
      // Stale phantom (see doc comment): in neither the complete cloud
      // response nor the bundled base. Evict.
      evicted++;
      continue;
    }
    merged.push(s);
  }
  if (evicted > 0 && typeof window !== 'undefined' && import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[cloudSchemeCatalog] evicted ${evicted} stale non-bundled scheme(s) absent from the published cloud set`);
  }

  const changed = catalogDigest(previous) !== catalogDigest(merged);
  return { schemes: changed ? merged : previous, changed };
}

// ---------------------------------------------------------------------------
// Cloud refresh
// ---------------------------------------------------------------------------

const REFRESH_TIMEOUT_MS = 20_000;

const SCHEME_SELECT =
  'id, official_name, short_code, official_scheme_identifier, sponsoring_ministry, department, scheme_type, scope, benefit_summary, description, funding_range_text, metadata, raw_payload';

interface CloudTables {
  rows: SchemeRow[];
  relatedById: Map<string, Related>;
}

/** Fetch published rows + related tables. Rejects on network/timeout/API error. */
async function fetchCloudTables(): Promise<CloudTables> {
  const supabase = getSupabaseClient();

  const fetchAll = (async (): Promise<CloudTables> => {
    const { data: rows, error } = await supabase
      .from('schemes')
      .select(SCHEME_SELECT)
      .eq('status', 'published')
      .order('official_name');
    if (error) throw error;
    if (!rows || rows.length === 0) return { rows: [], relatedById: new Map() };

    const ids = (rows as SchemeRow[]).map((r) => r.id);
    const [sourcesRes, rulesRes, docsRes, fundingRes, appInfoRes] = await Promise.all([
      supabase.from('scheme_sources').select('*').in('scheme_id', ids),
      supabase
        .from('scheme_eligibility_rules')
        .select('scheme_id, criterion_key, operator, value, is_mandatory')
        .in('scheme_id', ids),
      supabase
        .from('scheme_document_requirements')
        .select('scheme_id, document_label')
        .in('scheme_id', ids),
      supabase.from('scheme_funding').select('scheme_id, min_amount, max_amount').in('scheme_id', ids),
      supabase
        .from('scheme_application_info')
        .select('scheme_id, application_mode, official_portal_url')
        .in('scheme_id', ids),
    ]);
    for (const res of [sourcesRes, rulesRes, docsRes, fundingRes, appInfoRes]) {
      if (res.error) throw res.error;
    }

    const byId = <T extends { scheme_id: string }>(arr: T[] | null): Map<string, T[]> => {
      const m = new Map<string, T[]>();
      for (const r of arr ?? []) {
        if (!r || typeof r.scheme_id !== 'string') continue;
        const list = m.get(r.scheme_id) ?? [];
        list.push(r);
        m.set(r.scheme_id, list);
      }
      return m;
    };
    const sources = byId(sourcesRes.data as SourceRow[] | null);
    const rules = byId(rulesRes.data as RuleRow[] | null);
    const docs = byId(docsRes.data as DocRow[] | null);
    const funding = byId(fundingRes.data as FundingRow[] | null);
    const appInfo = byId(appInfoRes.data as AppInfoRow[] | null);

    const relatedById = new Map<string, Related>();
    for (const id of ids) {
      // Multiple sources collapse to one provenance by authority (lowest
      // priority_level first) — see the SOURCE / PROVENANCE note on mapSource.
      const orderedSources = (sources.get(id) ?? [])
        .slice()
        .sort((a, b) => (a.priority_level ?? 99) - (b.priority_level ?? 99));
      relatedById.set(id, {
        source: orderedSources[0],
        rules: rules.get(id) ?? [],
        docs: docs.get(id) ?? [],
        funding: funding.get(id)?.[0],
        appInfo: appInfo.get(id)?.[0],
      });
    }
    return { rows: rows as SchemeRow[], relatedById };
  })();
  // If the timeout wins, swallow the late query's rejection so it can never
  // surface as an unhandled rejection.
  fetchAll.catch(() => {});

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () =>
        reject(
          new Error(`[cloudSchemeCatalog] refresh timed out after ${REFRESH_TIMEOUT_MS}ms`),
        ),
      REFRESH_TIMEOUT_MS,
    );
  });

  return Promise.race([fetchAll, timeout]);
}

async function doRefresh(): Promise<boolean> {
  // Every failure path returns false and leaves the current catalog untouched:
  // unconfigured -> no client; timeout/network/API error -> caught below;
  // empty or fully-malformed response -> mergeCloudRows returns changed:false.
  const refreshStart = performance.now();
  const devLog = (msg: string): void => {
    if (typeof window !== 'undefined' && import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Catalog] ${msg}`);
    }
  };
  try {
    if (!isSupabaseConfigured()) return false;
    const fetchStart = performance.now();
    const { rows, relatedById } = await fetchCloudTables();
    devLog(`cloud fetch: ${rows.length} published rows in ${Math.round(performance.now() - fetchStart)}ms`);
    const mergeStart = performance.now();
    const { schemes, changed } = mergeCloudRows(rows, relatedById);
    devLog(`merge: ${schemes.length} curated (changed=${changed}) in ${Math.round(performance.now() - mergeStart)}ms`);
    if (!changed) return false;
    curatedSchemes = schemes;
    catalogSource = 'cloud';
    persistCache(schemes);
    for (const cb of listeners) {
      try {
        cb();
      } catch {
        // Listener errors must not break the catalog swap.
      }
    }
    devLog(`refresh swapped catalog in ${Math.round(performance.now() - refreshStart)}ms total`);
    return true;
  } catch {
    devLog(`refresh failed after ${Math.round(performance.now() - refreshStart)}ms (catalog unchanged)`);
    return false;
  }
}

/**
 * Fetches published curated schemes from Supabase and swaps them in when they
 * differ from what's currently held. Returns true when the catalog changed.
 * Never throws: any failure keeps the current (bundled or cached) catalog.
 * Concurrent calls share a single in-flight request (no duplicate cloud
 * refresh, StrictMode-safe).
 */
export function refreshCuratedSchemesFromCloud(): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = doRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

// ---------------------------------------------------------------------------
// Development-only set-difference diagnostic (§12).
// Compares the four ID sets that feed the catalog counts — live cloud
// published IDs, bundled IDs, cached IDs, and the final resolved frontend
// IDs — and names the exact extra/duplicate/missing schemes. Intended for
// the dev console (`await window.__ys_diagnoseCatalog()`); it is never
// rendered in the UI and never exposed to citizens.
// ---------------------------------------------------------------------------

export interface CatalogSetDiagnosis {
  /** Live `schemes` rows with status='published'. Null when the read failed. */
  cloudIds: string[] | null;
  cloudError: string | null;
  bundledIds: string[];
  /** IDs in the ys_cloud_schemes_v2 cache. Null when no cache exists. */
  cachedIds: string[] | null;
  /** Final frontend IDs: current curated set + bundled candidates. */
  finalIds: string[];
  finalCuratedIds: string[];
  /** IDs present in the final set but in NEITHER cloud NOR bundled. */
  phantomIds: string[];
  /** IDs present more than once in the final set. */
  duplicateIds: string[];
  /** Cloud-published IDs missing from the final set (should be empty). */
  missingFromFinalIds: string[];
}

/** Read the raw v2 cache IDs without mutating catalog state. */
function readCachedIds(): string[] | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; schemes?: Array<{ id?: string }> };
    if (!parsed || parsed.version !== CACHE_VERSION || !Array.isArray(parsed.schemes)) return null;
    return parsed.schemes.map((s) => s.id).filter((id): id is string => typeof id === 'string');
  } catch {
    return null;
  }
}

export async function diagnoseCatalogSets(): Promise<CatalogSetDiagnosis> {
  let cloudIds: string[] | null = null;
  let cloudError: string | null = null;
  try {
    if (!isSupabaseConfigured()) {
      cloudError = 'supabase not configured';
    } else {
      const { data, error } = await getSupabaseClient()
        .from('schemes')
        .select('id')
        .eq('status', 'published');
      if (error) cloudError = error.message;
      else cloudIds = (data ?? []).map((r: { id: string }) => r.id);
    }
  } catch (err) {
    cloudError = err instanceof Error ? err.message : String(err);
  }

  const bundledIds = SCHEMES_DATABASE.map((s) => s.id);
  const cachedIds = readCachedIds();
  const finalCuratedIds = getCuratedSchemes().map((s) => s.id);
  // Mirrors getAllRepositorySchemes() without importing schemeRepository
  // (which imports this module — direct candidate import avoids the cycle).
  const { CANDIDATE_SCHEMES_DATABASE } = await import('../../data/candidateSchemes');
  const finalIds = [...finalCuratedIds, ...CANDIDATE_SCHEMES_DATABASE.map((s) => s.id)];

  const cloudSet = new Set(cloudIds ?? []);
  const bundledSet = new Set(bundledIds);
  const seen = new Set<string>();
  const duplicateIds = [...new Set(finalIds.filter((id) => (seen.has(id) ? true : (seen.add(id), false))))];
  const phantomIds = [...new Set(finalCuratedIds.filter((id) => !cloudSet.has(id) && !bundledSet.has(id)))];
  const finalSet = new Set(finalIds);
  const missingFromFinalIds = (cloudIds ?? []).filter((id) => !finalSet.has(id));

  const diagnosis: CatalogSetDiagnosis = {
    cloudIds,
    cloudError,
    bundledIds,
    cachedIds,
    finalIds,
    finalCuratedIds,
    phantomIds,
    duplicateIds,
    missingFromFinalIds,
  };

  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log('[CatalogDiagnosis] counts:', {
      cloudPublished: cloudIds?.length ?? `(read failed: ${cloudError})`,
      bundled: bundledIds.length,
      cached: cachedIds?.length ?? '(no cache)',
      finalCurated: finalCuratedIds.length,
      finalTotal: finalIds.length,
    });
    // eslint-disable-next-line no-console
    console.log('[CatalogDiagnosis] phantomIds (final, in neither cloud nor bundled):', phantomIds);
    // eslint-disable-next-line no-console
    console.log('[CatalogDiagnosis] duplicateIds:', duplicateIds);
    // eslint-disable-next-line no-console
    console.log('[CatalogDiagnosis] missingFromFinalIds:', missingFromFinalIds);
  }
  return diagnosis;
}

// Dev-console entry point. Attached only in development builds; production
// bundles never carry it, so citizens can never invoke it.
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as unknown as Record<string, unknown>).__ys_diagnoseCatalog = diagnoseCatalogSets;
}
