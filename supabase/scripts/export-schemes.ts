/**
 * YOJANA SETU — PHASE 1 BACKEND
 * Export script: bundled TypeScript scheme dataset -> supabase/seed.sql
 *
 * Reads the app's canonical in-bundle sources:
 *   - src/data/schemes.ts            -> SCHEMES_DATABASE (normalized, 39 schemes)
 *   - src/i18n/schemesData.ts        -> allLocalizedSchemes (hi/ta/te/kn/ml)
 * and emits idempotent UPSERT seed SQL so `supabase db reset` / re-seeds are safe.
 *
 * Usage (from repo root):
 *   npx tsx supabase/scripts/export-schemes.ts
 *
 * Re-run any time the bundled data changes, then apply the new seed.sql.
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMES_DATABASE } from '../../src/data/schemes';
import { getSchemeScope, getSchemeCategories } from '../../src/lib/data/normalization';
import { allLocalizedSchemes } from '../../src/i18n/schemesData';
import type { Scheme } from '../../src/types';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'seed.sql');

// --- SQL literal helpers ----------------------------------------------------

/** Quote a text value: standard '' doubling. NULL stays NULL. */
function sqlStr(v: string | undefined | null): string {
  if (v === undefined || v === null) return 'NULL';
  return `'${v.replace(/'/g, "''")}'`;
}

function sqlNum(v: number | undefined | null): string {
  if (v === undefined || v === null) return 'NULL';
  return Number.isFinite(v) ? String(v) : 'NULL';
}

/** text[] literal via ARRAY[...] — each element safely quoted. */
function sqlArr(v: readonly string[] | undefined | null): string {
  if (!v || v.length === 0) return "'{}'";
  return `ARRAY[${v.map((s) => sqlStr(s)).join(', ')}]`;
}

function sqlJson(v: unknown): string {
  return sqlStr(JSON.stringify(v));
}

// --- Row builders -----------------------------------------------------------

const SCHEME_COLUMNS = [
  'id', 'short_code', 'scheme_type', 'scope', 'sponsoring_ministry', 'department',
  'official_scheme_identifier', 'description', 'benefit_summary', 'purpose',
  'funding_range_text', 'min_amount', 'max_amount', 'subsidy_rate_percent',
  'subsidy_cap', 'base_interest_rate', 'standard_tenure_years',
  'moratorium_period_months', 'min_age', 'max_age', 'max_annual_income_cap',
  'target_categories', 'target_business_types', 'applicable_states',
  'required_documents', 'tags', 'categories', 'official_portal_url',
  'application_mode', 'last_verified_date', 'is_active', 'version', 'data',
] as const;

function schemeRow(s: Scheme): string {
  const vals = [
    sqlStr(s.id),
    sqlStr(s.shortCode),
    sqlStr(s.schemeType),
    sqlStr(getSchemeScope(s)),
    sqlStr(s.sponsoringMinistry),
    sqlStr(s.department),
    sqlStr(s.officialSchemeIdentifier),
    sqlStr(s.description),
    sqlStr(s.benefitSummary),
    sqlStr(s.purpose),
    sqlStr(s.fundingRangeText),
    sqlNum(s.minAmount),
    sqlNum(s.maxAmount),
    sqlNum(s.subsidyRatePercent),
    sqlNum(s.subsidyCap),
    sqlNum(s.baseInterestRate),
    sqlNum(s.standardTenureYears),
    sqlNum(s.moratoriumPeriodMonths),
    sqlNum(s.minAge),
    sqlNum(s.maxAge),
    sqlNum(s.maxAnnualIncomeCap),
    sqlArr(s.targetCategories),
    sqlArr(s.targetBusinessTypes),
    sqlArr(s.applicableStates),
    sqlArr(s.requiredDocuments),
    sqlArr(s.tags),
    sqlArr(getSchemeCategories(s)),
    sqlStr(s.officialPortalUrl),
    sqlStr(s.applicationMode),
    sqlStr(s.lastVerifiedDate),
    'true', // is_active
    '1',    // version
    sqlJson(s), // full normalized Scheme object — lossless
  ];
  const updates = SCHEME_COLUMNS.filter((c) => c !== 'id')
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(',\n    ');
  return (
    `insert into public.schemes (${SCHEME_COLUMNS.join(', ')})\n` +
    `values (${vals.join(', ')})\n` +
    `on conflict (id) do update set\n    ${updates};`
  );
}

const TRANSLATION_COLUMNS = [
  'scheme_id', 'lang', 'name', 'sponsoring_ministry', 'department', 'scheme_type',
  'benefit_summary', 'funding_range_text', 'required_documents', 'last_verified_date',
] as const;

function translationRow(schemeId: string, lang: string, t: {
  name: string;
  sponsoringMinistry: string;
  department?: string;
  schemeType: string;
  benefitSummary: string;
  fundingRangeText: string;
  requiredDocuments: string[];
  lastVerifiedDate: string;
}): string {
  const vals = [
    sqlStr(schemeId),
    sqlStr(lang),
    sqlStr(t.name),
    sqlStr(t.sponsoringMinistry),
    sqlStr(t.department),
    sqlStr(t.schemeType),
    sqlStr(t.benefitSummary),
    sqlStr(t.fundingRangeText),
    sqlArr(t.requiredDocuments),
    sqlStr(t.lastVerifiedDate),
  ];
  const updates = TRANSLATION_COLUMNS.filter((c) => c !== 'scheme_id' && c !== 'lang')
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(',\n    ');
  return (
    `insert into public.scheme_translations (${TRANSLATION_COLUMNS.join(', ')})\n` +
    `values (${vals.join(', ')})\n` +
    `on conflict (scheme_id, lang) do update set\n    ${updates};`
  );
}

// --- Main -------------------------------------------------------------------

const schemeIds = new Set(SCHEMES_DATABASE.map((s) => s.id));

const schemeStatements = SCHEMES_DATABASE.map(schemeRow);

let translationCount = 0;
let orphanCount = 0;
const translationStatements: string[] = [];
for (const [lang, dict] of Object.entries(allLocalizedSchemes)) {
  if (!dict) continue;
  for (const [schemeId, t] of Object.entries(dict)) {
    if (!schemeIds.has(schemeId)) {
      orphanCount++;
      continue; // translation for a scheme not in the dataset — skip
    }
    translationStatements.push(translationRow(schemeId, lang, t));
    translationCount++;
  }
}

const sql = [
  '-- ===========================================================================',
  '-- YOJANA SETU — PHASE 1 SEED (generated, do not hand-edit)',
  `-- Generated from the bundled dataset: ${SCHEMES_DATABASE.length} schemes,`,
  `-- ${translationCount} translations. Re-run: npx tsx supabase/scripts/export-schemes.ts`,
  '-- Idempotent: safe to re-apply (upserts).',
  '-- ===========================================================================',
  '',
  ...schemeStatements,
  '',
  ...translationStatements,
  '',
].join('\n');

writeFileSync(OUT, sql, 'utf8');

console.log(`Wrote ${OUT}`);
console.log(`  schemes:      ${SCHEMES_DATABASE.length}`);
console.log(`  translations: ${translationCount}`);
if (orphanCount > 0) {
  console.log(`  skipped orphan translations (no matching scheme): ${orphanCount}`);
}
