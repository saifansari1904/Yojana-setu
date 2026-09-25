/**
 * YOJANA SETU — CLOUD SCHEME CATALOG
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
 */

import type { Scheme, SchemeFactorKey, SchemeSourceProvenance } from '../../types/scheme';
import type { SocialCategory, BusinessType } from '../../types/user';
import type { SchemeType, ApplicationMode } from '../../data/schemeTaxonomy';
import { SCHEMES_DATABASE } from '../../data/schemes';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';

// ---------------------------------------------------------------------------
// Local cache (instant boot, offline resilience)
// ---------------------------------------------------------------------------

const CACHE_KEY = 'ys_cloud_schemes_v1';

interface CacheShape {
  version: 1;
  fetchedAt: string;
  schemes: Scheme[];
}

let curatedSchemes: Scheme[] = SCHEMES_DATABASE;
let cloudActive = false;
const listeners = new Set<() => void>();

function hydrateFromCache(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CacheShape;
    if (parsed?.version === 1 && Array.isArray(parsed.schemes) && parsed.schemes.length > 0) {
      curatedSchemes = parsed.schemes;
      cloudActive = true;
    }
  } catch {
    // Corrupt cache -> ignore, bundled data stays.
  }
}

function persistCache(schemes: Scheme[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const payload: CacheShape = { version: 1, fetchedAt: new Date().toISOString(), schemes };
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

/** True once cloud (or cloud cache) data has replaced the bundle. */
export function isCloudCatalogActive(): boolean {
  return cloudActive;
}

export function subscribeCuratedSchemes(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
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

/** Best-effort Scheme for admin-added rows that have no raw_payload yet. */
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

export function mapRowToScheme(row: SchemeRow, rel: Related): Scheme {
  const raw = (row.raw_payload ?? null) as Scheme | null;
  const base: Scheme = raw ? { ...raw } : blankScheme(row, rel);

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
// Cloud refresh
// ---------------------------------------------------------------------------

function digest(schemes: Scheme[]): string {
  return schemes
    .map((s) => `${s.id}|${s.name}|${s.benefitSummary}|${s.fundingRangeText}|${s.sponsoringMinistry}`)
    .join('~');
}

/**
 * Fetches published curated schemes from Supabase and swaps them in when they
 * differ from what's currently held. Returns true when the catalog changed.
 * Never throws: any failure keeps the current (bundled or cached) catalog.
 */
export async function refreshCuratedSchemesFromCloud(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getSupabaseClient();
    const { data: rows, error } = await supabase
      .from('schemes')
      .select(
        'id, official_name, short_code, official_scheme_identifier, sponsoring_ministry, department, scheme_type, scope, benefit_summary, description, funding_range_text, metadata, raw_payload',
      )
      .eq('status', 'published')
      .order('official_name');
    if (error || !rows || rows.length === 0) return false;

    const ids = (rows as SchemeRow[]).map((r) => r.id);
    const [sourcesRes, rulesRes, docsRes, fundingRes, appInfoRes] = await Promise.all([
      supabase.from('scheme_sources').select('*').in('scheme_id', ids),
      supabase.from('scheme_eligibility_rules').select('scheme_id, criterion_key, operator, value, is_mandatory').in('scheme_id', ids),
      supabase.from('scheme_document_requirements').select('scheme_id, document_label').in('scheme_id', ids),
      supabase.from('scheme_funding').select('scheme_id, min_amount, max_amount').in('scheme_id', ids),
      supabase.from('scheme_application_info').select('scheme_id, application_mode, official_portal_url').in('scheme_id', ids),
    ]);

    const byId = <T extends { scheme_id: string }>(arr: T[] | null): Map<string, T[]> => {
      const m = new Map<string, T[]>();
      for (const r of arr ?? []) {
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

    const currentById = new Map(curatedSchemes.map((s) => [s.id, s]));
    const mapped = (rows as SchemeRow[]).map((row) => {
      const rel: Related = {
        source: sources.get(row.id)?.[0],
        rules: rules.get(row.id) ?? [],
        docs: docs.get(row.id) ?? [],
        funding: funding.get(row.id)?.[0],
        appInfo: appInfo.get(row.id)?.[0],
      };
      // Until raw_payload is backfilled (migration 017 seed), a row without it
      // maps losslessly to nothing — keep the bundled version instead so the
      // app never degrades. Truly new (admin-added) rows use structured mapping.
      if (!row.raw_payload) return currentById.get(row.id) ?? mapRowToScheme(row, rel);
      return mapRowToScheme(row, rel);
    });

    cloudActive = true;
    if (digest(mapped) === digest(curatedSchemes)) return false;

    curatedSchemes = mapped;
    persistCache(mapped);
    listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // Listener errors must not break the catalog swap.
      }
    });
    return true;
  } catch {
    return false;
  }
}
