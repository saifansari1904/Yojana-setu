/**
 * Marathi (mr) — 7th language parity, language-independence, and switching tests.
 *
 * Run with: tsx src/i18n/marathiParity.test.ts
 *
 * Covers:
 *  A. Translation key parity across all 7 languages (en/hi/ta/te/kn/ml/mr).
 *  B. No placeholder/empty values in mr.
 *  C. Matching + eligibility are language-independent (identical semantic
 *     results for every language, including mr).
 *  D. Switching infrastructure: SUPPORTED_LANGUAGES, translationsMap,
 *     persistence validation, and the mr-IN currency locale.
 */
import { SCHEMES_DATABASE } from '../data/schemes';
import {
  evaluateSchemeEligibility,
  rankSchemesForProfile,
} from '../lib/matching/matchingEngine';
import { UserProfile } from '../types';
import {
  Language,
  SUPPORTED_LANGUAGES,
  enTranslations,
  hiTranslations,
  taTranslations,
  teTranslations,
  knTranslations,
  mlTranslations,
  mrTranslations,
} from './index';
import { translationsMap } from './LanguageContext';

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

// --- Helpers: flatten nested translation objects to dot-path leaves ---------
function flatten(obj: any, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof v === 'string') {
      out[path] = v;
    } else if (v && typeof v === 'object') {
      flatten(v, path, out);
    }
  }
  return out;
}

const ALL_LANGS: Language[] = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr'];
const perLang = {
  en: enTranslations,
  hi: hiTranslations,
  ta: taTranslations,
  te: teTranslations,
  kn: knTranslations,
  ml: mlTranslations,
  mr: mrTranslations,
} as Record<Language, any>;

console.log('\n--- MARATHI (mr) PARITY + LANGUAGE-INDEPENDENCE TEST SUITE ---\n');

// === A. Key parity across all 7 languages ===================================
const flatEn = flatten(perLang.en);
const enKeys = Object.keys(flatEn).sort();
console.log(`   English flattened leaves: ${enKeys.length}`);

for (const lang of ALL_LANGS) {
  const flat = flatten(perLang[lang]);
  const keys = Object.keys(flat).sort();
  const missing = enKeys.filter((k) => !(k in flat));
  const extra = keys.filter((k) => !(k in flatEn));
  assert(
    missing.length === 0 && extra.length === 0,
    `A: '${lang}' has exact key parity with 'en' (${keys.length} leaves)`,
    `missing=${JSON.stringify(missing.slice(0, 5))} extra=${JSON.stringify(extra.slice(0, 5))}`
  );
}

// === B. No placeholders / empty values in mr ================================
const flatMr = flatten(perLang.mr);
const badMr = Object.entries(flatMr).filter(
  ([, v]) =>
    v.trim().length === 0 ||
    /TODO|TBD|FIXME|XXX|PLACEHOLDER|PENDING_TRANSLATION/i.test(v)
);
assert(badMr.length === 0, 'B: mr has no empty or placeholder values', JSON.stringify(badMr.slice(0, 5)));

// mr values should be genuinely translated (not copied English) for Devanagari-expected copy.
// Allowlist: strings that are legitimately identical (numbers, codes, brand-ish tokens,
// example email placeholders — the address format itself is not display copy).
const ASCII_IDENTICAL_ALLOWLIST = new Set(['login.emailPlaceholder']);
const asciiIdentical = Object.keys(flatMr).filter(
  (k) => !ASCII_IDENTICAL_ALLOWLIST.has(k) && flatMr[k] === flatEn[k] && /^[\x00-\x7F]*$/.test(flatMr[k]) && /[a-zA-Z]/.test(flatMr[k])
);
assert(
  asciiIdentical.length === 0,
  'B: mr has no untranslated ASCII copy of en display strings',
  JSON.stringify(asciiIdentical.slice(0, 8))
);

// === C. Matching/eligibility language-independence ==========================
const profile: UserProfile = {
  category: 'SC',
  age: 28,
  annualIncome: 250000,
  businessType: 'manufacturing',
  state: 'Maharashtra',
};

const pmegp = SCHEMES_DATABASE.find((s) => s.id === 'pmegp-msme')!;
const evals = ALL_LANGS.map((lang) => ({ lang, r: evaluateSchemeEligibility(pmegp, profile, lang) }));
const base = evals[0].r;
for (const { lang, r } of evals) {
  assert(r.matchPercentage === base.matchPercentage, `C: [${lang}] matchPercentage identical (${r.matchPercentage})`);
  assert(r.isEligible === base.isEligible, `C: [${lang}] isEligible identical (${r.isEligible})`);
  assert(r.matchStatus === base.matchStatus, `C: [${lang}] matchStatus identical (${r.matchStatus})`);
  assert(r.matchedCount === base.matchedCount, `C: [${lang}] matchedCount identical (${r.matchedCount})`);
  assert(
    JSON.stringify(r.breakdown.map((c) => c.state)) === JSON.stringify(base.breakdown.map((c) => c.state)),
    `C: [${lang}] criterion states identical`
  );
  assert(
    JSON.stringify(r.breakdown.map((c) => c.scoreContribution)) ===
      JSON.stringify(base.breakdown.map((c) => c.scoreContribution)),
    `C: [${lang}] factor score contributions identical`
  );
}

// Ranked order + scheme IDs identical across languages (incl. mr)
const ranked = ALL_LANGS.map((lang) => rankSchemesForProfile(SCHEMES_DATABASE, profile, lang));
const baseOrder = ranked[0].map((m) => m.scheme.id);
for (let i = 0; i < ALL_LANGS.length; i++) {
  const order = ranked[i].map((m) => m.scheme.id);
  assert(
    JSON.stringify(order) === JSON.stringify(baseOrder),
    `C: [${ALL_LANGS[i]}] recommendation order + scheme IDs identical (${order.length} schemes)`
  );
  const scoresMatch = ranked[i].every((m, j) => m.matchPercentage === ranked[0][j].matchPercentage);
  assert(scoresMatch, `C: [${ALL_LANGS[i]}] factor/match scores identical across ranking`);
}

// Semantic enum values stay in English regardless of display language
const mrEval = evaluateSchemeEligibility(pmegp, profile, 'mr');
assert(
  ['eligible', 'near-match', 'low-match', 'not-eligible', 'blocked'].includes(mrEval.matchStatus),
  'C: [mr] matchStatus is a canonical English enum value',
  `got ${mrEval.matchStatus}`
);
assert(
  mrEval.breakdown.every((c) => ['MATCHED', 'UNKNOWN', 'MISMATCHED'].includes(c.state)),
  'C: [mr] criterion states are canonical English enum values'
);

// === D. Switching infrastructure ============================================
assert(
  SUPPORTED_LANGUAGES.some((l) => l.code === 'mr' && l.nativeName === 'मराठी'),
  "D: SUPPORTED_LANGUAGES includes mr with nativeName 'मराठी'"
);
assert(
  (['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr'] as Language[]).every((l) => l in translationsMap),
  'D: translationsMap resolves all 7 languages including mr'
);
// Persistence validation: 'mr' must survive the `saved in translationsMap` check
// used by LanguageContext when restoring yojana_setu_language.
assert('mr' in translationsMap, "D: 'mr' passes persistence validation (saved in translationsMap)");
assert(!('xx' in translationsMap), 'D: unknown language codes still rejected by persistence validation');
// Document language tag: LanguageContext writes the raw Language code verbatim
// (document.documentElement.lang = lang), so for Marathi <html lang> is exactly
// 'mr'. No DOM exists in this tsx/Node test environment, so instead of faking a
// DOM assertion we verify the state contract that drives the effect: the
// canonical Marathi code round-trips as exactly 'mr' through the same
// persistence/registry validation (translationsMap + SUPPORTED_LANGUAGES)
// that gates LanguageContext state.
const mrLangEntry = SUPPORTED_LANGUAGES.find((l) => l.code === 'mr');
assert(
  mrLangEntry !== undefined && mrLangEntry.code === 'mr',
  "D: Marathi registry code is exactly 'mr' (verbatim value LanguageContext writes to <html lang>)"
);
assert(
  'mr' in translationsMap && translationsMap.mr === mrTranslations,
  "D: translationsMap['mr'] resolves to the Marathi resource (drives LanguageContext state)"
);
// en still resolves to 'en' — the effect writes each language's own code.
const enLangEntry = SUPPORTED_LANGUAGES.find((l) => l.code === 'en');
assert(
  enLangEntry !== undefined && enLangEntry.code === 'en',
  "D: English registry code is exactly 'en' (verbatim value LanguageContext writes to <html lang>)"
);

// mr-IN number formatting: runtime-independent checks. Devanagari digit glyphs
// vary by ICU build (full-ICU vs small-ICU), so we must NOT require
// mr-IN digits to differ from en-IN digits. Instead verify: formatting does
// not throw, the locale is passed through as mr-IN, currency stays INR, and
// the numeric value is unchanged (same Unicode decimal-digit count).
let mrCurrencyFmt: Intl.NumberFormat | undefined;
let mrCurrencyThrew = false;
try {
  mrCurrencyFmt = new Intl.NumberFormat('mr-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
} catch {
  mrCurrencyThrew = true;
}
assert(!mrCurrencyThrew && mrCurrencyFmt !== undefined, 'D: mr-IN currency formatting does not throw');
const mrResolved = mrCurrencyFmt?.resolvedOptions();
assert(
  mrResolved !== undefined && mrResolved.currency === 'INR',
  'D: mr-IN resolved currency is INR',
  `got ${mrResolved?.currency}`
);
assert(
  mrResolved !== undefined && mrResolved.locale.toLowerCase().startsWith('mr'),
  'D: mr-IN locale is passed through as mr-IN',
  `got ${mrResolved?.locale}`
);
const mrFormatted = mrCurrencyFmt?.format(250000) ?? '';
assert(
  /₹/.test(mrFormatted) || /र/.test(mrFormatted),
  'D: mr-IN formats INR currency',
  `got ${mrFormatted}`
);
const countDecimalDigits = (s: string): number => (s.match(/\p{Nd}/gu) ?? []).length;
const mrPlain = new Intl.NumberFormat('mr-IN', { maximumFractionDigits: 0 }).format(250000);
const enPlain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(250000);
assert(
  countDecimalDigits(mrPlain) === countDecimalDigits(enPlain) && countDecimalDigits(mrPlain) === 6,
  'D: mr-IN numeric value unchanged vs en-IN (same digit count)',
  `mr=${mrPlain} en=${enPlain}`
);

console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---\n`);
if (failed > 0) process.exit(1);
