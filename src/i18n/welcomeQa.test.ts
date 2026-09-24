/**
 * Welcome / Authentication Experience Upgrade QA.
 *
 * Run with: tsx src/i18n/welcomeQa.test.ts
 *
 * Covers:
 *  W1. All seven language resources contain every `welcome` i18n key.
 *  W2. No `welcome` value is an English copy in non-English languages
 *      (spot-check: heroTitle differs from English).
 *  W3. ActiveScreen includes 'welcome'.
 *  W4. App defaults to 'welcome' when no stored profile exists
 *      (source-contract: initializer reads loadStoredProfile()).
 *  W5. handleFormSubmit no longer persists the profile or authenticates
 *      (source-contract: no saveStoredProfile / setIsAuthenticated(true)
 *      in the submit handler).
 *  W6. Persistence actions are guarded by requestPersistentAction
 *      (source-contract on save/track/workspace/header-navigate).
 *  W7. Firebase remains absent.
 *  W8. WelcomeScreen has no hardcoded user-facing English strings
 *      (all copy via t('welcome.*')).
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
const languages: Language[] = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr'];

const WELCOME_KEYS = [
  'navHome', 'navHowItWorks', 'navSchemes', 'navAbout',
  'navSignIn', 'heroTitle', 'heroSubtitle', 'heroPrimaryCta',
  'heroNoAccount', 'howItWorksTitle', 'howItWorksSubtitle', 'step1Title',
  'step1Desc', 'step2Title', 'step2Desc', 'step3Title',
  'step3Desc', 'step4Title', 'step4Desc', 'privacyTitle',
  'privacySubtitle', 'footerTagline', 'footerNote', 'authPromptTitle',
  'authPromptDesc', 'authPromptPrimary', 'authPromptSecondary',
  'heroEyebrow', 'heroSecondaryCta', 'trustStrip1Title', 'trustStrip1Desc',
  'trustStrip2Title', 'trustStrip2Desc', 'trustStrip3Title', 'trustStrip3Desc',
  'trustStrip4Title', 'trustStrip4Desc', 'pathwayProfileTitle', 'pathwayEngineTitle',
  'pathwayDimCategory', 'pathwayDimBusiness', 'pathwayDimIncome', 'pathwayDimAge',
  'pathwayDimState', 'pathwayResultEligible', 'pathwayResultNear', 'pathwayResultLow',
  'pathwayIllustrative', 'previewTitle', 'previewSubtitle', 'previewIllustrative',
  'previewMatchLabel', 'previewEligibilityValue', 'previewNextValue', 'accountTitle',
  'accountDesc', 'accountSecondary', 'privacyPanel1Title', 'privacyPanel1Desc',
  'privacyPanel2Title', 'privacyPanel2Desc', 'privacyPanel3Title', 'privacyPanel3Desc',
  'privacyPanel4Title', 'privacyPanel4Desc', 'menuOpen', 'menuClose',
  'flowProfileTitle', 'flowDemoTag', 'flowBizLabel', 'flowBizValue',
  'flowLocLabel', 'flowLocValue', 'flowIncLabel', 'flowIncValue',
  'flowEngineTitle', 'flowResultTitle', 'flowCheck1', 'flowCheck2',
  'flowCheck3', 'flowNextTitle', 'flowNextDesc', 'flowIllustrative',
  'matchingTitle', 'matchingSubtitle', 'matchingStepFactors', 'matchingStepEligibility',
  'matchingStepConfidence', 'matchingStepPathway', 'explainTitle', 'explainSubtitle',
  'explainBullet1', 'explainBullet2', 'explainBullet3', 'explainCardTitle',
  'explainConfidence', 'explainEligibility', 'explainEligibilityDesc', 'explainNextDesc',
  'explainIllustrative', 'journeyTitle', 'journeySubtitle', 'journey1Title',
  'journey1Desc', 'journey2Title', 'journey2Desc', 'journey3Title',
  'journey3Desc', 'journey4Title', 'journey4Desc', 'journey5Title',
  'journey5Desc', 'journey6Title', 'journey6Desc', 'previewSchemeTitle',
  'previewPrepLabel', 'previewPrepValue', 'previewContinue', 'previewCard1Title',
  'previewCard1Desc', 'previewCard2Title', 'previewCard2Desc', 'previewCard3Title',
  'previewCard3Desc', 'demoTitle', 'demoSubtitle', 'demoControlsTitle',
  'demoBizLabel', 'demoLocLabel', 'demoIncLabel', 'demoCatLabel',
  'demoBiz1', 'demoBiz2', 'demoBiz3', 'demoLoc1',
  'demoLoc2', 'demoLoc3', 'demoInc1', 'demoInc2',
  'demoInc3', 'demoCat1', 'demoCat2', 'demoCat3',
  'demoResultTitle', 'demoReplay', 'demoIllustrative', 'diffTitle',
  'diffSubtitle', 'diffTradTitle', 'diffTrad1', 'diffTrad2',
  'diffTrad3', 'diffTrad4', 'diffTrad5', 'diffYsTitle',
  'diffYs1', 'diffYs2', 'diffYs3', 'diffYs4',
  'diffYs5', 'diffYs6', 'diffNote', 'trustTitle',
  'trustSubtitle', 'trustP1Title', 'trustP1Desc', 'trustP2Title',
  'trustP2Desc', 'trustP3Title', 'trustP3Desc', 'trustP4Title',
  'trustP4Desc', 'trustP5Title', 'trustP5Desc', 'trustP6Title',
  'trustP6Desc', 'accountCtaPrimary',
];

// W1 — every language has every welcome key, non-empty
for (const lang of languages) {
  const welcome = resources[lang]?.welcome;
  assert(!!welcome, `W1: '${lang}' has a welcome section`);
  if (welcome) {
    const missing = WELCOME_KEYS.filter(
      (k) => typeof welcome[k] !== 'string' || welcome[k].trim().length === 0,
    );
    assert(
      missing.length === 0,
      `W1: '${lang}' welcome has all ${WELCOME_KEYS.length} keys`,
      missing.length ? `Missing/empty: ${missing.join(', ')}` : undefined,
    );
  }
}

// W2 — non-English heroTitle is translated (not an English copy)
for (const lang of languages.filter((l) => l !== 'en')) {
  const val = resources[lang]?.welcome?.heroTitle;
  assert(
    typeof val === 'string' && val !== enTranslations.welcome.heroTitle,
    `W2: '${lang}' welcome.heroTitle is translated`,
  );
}

// W3 — ActiveScreen includes 'welcome'
const commonTypes = readSrc('src/types/common.ts');
assert(
  /['"]welcome['"]/.test(commonTypes),
  "W3: ActiveScreen includes 'welcome'",
);

// W4 — default screen is 'welcome' when no stored profile
const appSrc = readSrc('src/App.tsx');
assert(
  /return stored \? 'dashboard' : 'welcome'/.test(appSrc),
  'W4: new users start on welcome (stored ? dashboard : welcome)',
);

// W5 — handleFormSubmit does not persist or authenticate
const formSubmitMatch = appSrc.match(
  /const handleFormSubmit[\s\S]*?\n  \};/,
);
assert(!!formSubmitMatch, 'W5: handleFormSubmit block found');
if (formSubmitMatch) {
  const block = formSubmitMatch[0];
  // Strip comments to avoid false positives from explanatory text
  const codeOnly = block.replace(/\/\/.*$/gm, '');
  assert(
    !codeOnly.includes('saveStoredProfile'),
    'W5: handleFormSubmit does not call saveStoredProfile',
  );
  assert(
    !codeOnly.includes('setIsAuthenticated(true)'),
    'W5: handleFormSubmit does not set authenticated',
  );
  assert(
    codeOnly.includes('setUserProfile(fullProfile)'),
    'W5: handleFormSubmit keeps profile in React state',
  );
}

// W6 — persistence actions are guarded
const guardedHandlers = [
  'handleToggleSaveScheme',
  'handleUpdateApplicationStatus',
  'handleUpdateApplicationNote',
  'handleUpdateApplicationAppliedOn',
  'handleRemoveTrackedApplication',
  'handleStartPathwayApplication',
  'handleDocumentProgress',
  'handleSetFollowUp',
  'handleCompleteFollowUp',
  'handleOpenWorkspace',
];
for (const handler of guardedHandlers) {
  const pattern = new RegExp(
    `const ${handler}[\\s\\S]*?requestPersistentAction\\(\\)`,
  );
  assert(
    pattern.test(appSrc),
    `W6: ${handler} is guarded by requestPersistentAction`,
  );
}
assert(
  /persistentScreens.*includes\(screen\)/.test(appSrc),
  'W6: handleHeaderNavigate guards dashboard/tracker/profile/workspace',
);

// W7 — Firebase remains absent
const packageJson = readSrc('package.json');
assert(!/firebase/i.test(packageJson), 'W7: no Firebase dependency in package.json');
for (const f of [
  'src/components/WelcomeScreen.tsx',
  'src/components/AccountPromptModal.tsx',
  'src/App.tsx',
]) {
  assert(
    !/from ['"]firebase/.test(readSrc(f)) && !/require\(['"]firebase/.test(readSrc(f)),
    `W7: no Firebase import in ${f}`,
  );
}

// W8 — WelcomeScreen copy comes from i18n, not hardcoded English
const welcomeSrc = readSrc('src/components/WelcomeScreen.tsx');
// Find user-facing string literals in JSX text positions (between > and <)
// that look like sentences (contain a space and a lowercase letter).
const jsxTextLiterals = [...welcomeSrc.matchAll(/>([^<>{}]+)</g)]
  .map((m) => m[1].trim())
  .filter((s) => s.length > 0 && /[a-z]/.test(s) && s.includes(' '));
const suspicious = jsxTextLiterals.filter(
  (s) => !s.startsWith('{') && !/^\d+$/.test(s),
);
assert(
  suspicious.length === 0,
  'W8: WelcomeScreen has no hardcoded English sentences in JSX',
  suspicious.length ? `Found: ${suspicious.slice(0, 3).join(' | ')}` : undefined,
);

console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---\n`);
process.exit(failed > 0 ? 1 : 0);
