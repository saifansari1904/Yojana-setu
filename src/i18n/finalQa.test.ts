/**
 * Final Marathi QA pass — candidate UI localization, verification banner
 * accuracy, and Firebase removal.
 *
 * Run with: tsx src/i18n/finalQa.test.ts
 *
 * Covers:
 *  A. Hardcoded candidate "Unverified" removed from ResultsListScreen.
 *  B. Candidate UI has seven-language coverage in centralized resources.
 *  C. Results verification banner is accurate (no misleading "100% verified"
 *     claim when candidate records are present).
 *  H. Firebase remains removed (no imports, deps, or config).
 *
 * (D/E/F/G are covered in marathiParity.test.ts.)
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  Language,
  enTranslations,
  hiTranslations,
  taTranslations,
  teTranslations,
  knTranslations,
  mlTranslations,
  mrTranslations,
} from './index';

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

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(repoRoot, rel), 'utf-8');

const resources: Record<Language, any> = {
  en: enTranslations,
  hi: hiTranslations,
  ta: taTranslations,
  te: teTranslations,
  kn: knTranslations,
  ml: mlTranslations,
  mr: mrTranslations,
};
const langs = Object.keys(resources) as Language[];

function getPath(obj: any, dotPath: string): any {
  return dotPath.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

// --- A. Hardcoded candidate "Unverified" removed -----------------------------
const resultsScreen = readSrc('src/components/ResultsListScreen.tsx');

// No hardcoded JSX pill text ">Unverified<" (the advisory-box pill).
assert(
  !/>\s*Unverified\s*</.test(resultsScreen),
  'A: no hardcoded "Unverified" JSX in ResultsListScreen'
);
// The centralized i18n key is used instead.
assert(
  resultsScreen.includes("t('results.candidate.unverified')"),
  "A: ResultsListScreen uses t('results.candidate.unverified')"
);

// --- B. Candidate UI has seven-language coverage -----------------------------
const candidateKeys = [
  'results.candidate.unverified',
  'results.candidate.badge',
  'results.candidate.discovery',
  'results.candidate.sourcePending',
  'verificationBadge.unverifiedSource',
  'verificationBadge.candidateScheme',
  'verificationBadge.sourceVerificationPending',
  'trustStrip.candidateRecord',
  'trustStrip.sourcePending',
  'schemeDetail.candidateNoticeTitle',
  'schemeDetail.candidateStatusBadge',
  'schemeDetail.candidateDisclaimer',
  'schemeDetail.provenanceTitle',
  'schemeDetail.provenanceLevel1',
  'schemeDetail.provenanceLevel6',
  'schemeDetail.provenanceStatusLabel',
  'schemeDetail.provenanceConfidenceSuffix',
  'schemeDetail.provenanceDisclaimer',
  'schemeDetail.provenanceSponsoringBody',
  'schemeDetail.provenanceDataFreshness',
  'schemeDetail.provenanceSourceHierarchy',
];
for (const key of candidateKeys) {
  const missing = langs.filter((l) => {
    const v = getPath(resources[l], key);
    return typeof v !== 'string' || v.trim().length === 0;
  });
  assert(
    missing.length === 0,
    `B: '${key}' localized in all 7 languages`,
    missing.length ? `missing/empty in: ${missing.join(', ')}` : undefined
  );
}
// Marathi values must be real translations, not English copies.
for (const key of ['results.candidate.unverified', 'verificationBadge.candidateScheme']) {
  const mrVal = getPath(resources.mr, key) as string;
  const enVal = getPath(resources.en, key) as string;
  assert(
    mrVal !== enVal,
    `B: mr '${key}' is translated (not an English copy)`,
    `mr=${mrVal}`
  );
}

// --- C. Verification banner is accurate --------------------------------------
const misleading = [
  '100% Statutory Criteria Verified',
  '100% वैधानिक नियम सत्यापित',
  '100% वैधानिक निकष तपासले',
];
for (const s of misleading) {
  assert(
    !resultsScreen.includes(s),
    `C: misleading banner text removed: "${s.slice(0, 30)}…"`
  );
}
// Dynamic per-tier banner keys exist in the results screen local map.
assert(
  resultsScreen.includes('authoritativeVerifiedCount') &&
    resultsScreen.includes('candidateNeedsVerification'),
  'C: banner uses dynamic authoritative/candidate keys'
);
// Candidate pill renders only when candidate records exist.
assert(
  resultsScreen.includes('candidateCount > 0'),
  'C: candidate verification pill is conditional on candidateCount'
);
// Authoritative pill renders only when authoritative schemes exist.
assert(
  resultsScreen.includes('authoritativeCount > 0'),
  'C: authoritative verification pill is conditional on authoritativeCount'
);

// --- H. Firebase remains removed ----------------------------------------------
const packageJson = readSrc('package.json');
const pkg = JSON.parse(packageJson);
const allDeps = {
  ...(pkg.dependencies ?? {}),
  ...(pkg.devDependencies ?? {}),
};
assert(
  !Object.keys(allDeps).some((d) => d.toLowerCase().includes('firebase')),
  'H: no Firebase dependency in package.json'
);
const srcFiles = [
  'src/components/ResultsListScreen.tsx',
  'src/components/SchemeDetailScreen.tsx',
  'src/components/ui/VerificationBadge.tsx',
  'src/components/TrustFooterStrip.tsx',
  'src/i18n/LanguageContext.tsx',
];
for (const f of srcFiles) {
  const content = readSrc(f);
  assert(
    !/from\s+['"]firebase|require\s*\(\s*['"]firebase/i.test(content),
    `H: no Firebase import in ${f}`
  );
}
assert(
  !fs.existsSync(path.join(repoRoot, 'src', 'firebase.ts')) &&
    !fs.existsSync(path.join(repoRoot, 'src', 'firebase')) &&
    !fs.existsSync(path.join(repoRoot, 'firebase.json')) &&
    !fs.existsSync(path.join(repoRoot, '.firebaserc')),
  'H: no Firebase config files in repo'
);

console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---\n`);
if (failed > 0) process.exit(1);
