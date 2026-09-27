/**
 * YOJANA SETU — PHASE 2E.2 PRIVACY / TRUST CLAIM REGRESSION TESTS
 * ------------------------------------------------------------------
 * Guards the trust-claim hardening:
 *
 *   P1. No obsolete trust claim remains in active UI source: the banned
 *       phrases ("100% On-Device", "Zero PII Storage", "Zero PII Retention",
 *       "100% accurate", "100% verified", "fully verified",
 *       "100% government verified") must not appear in components or i18n.
 *   P2. All seven languages carry the corrected, semantically equivalent
 *       privacy messaging (device + cloud-account sync when signed in).
 *   P3. The corrected wording never promises zero PII / zero retention /
 *       guaranteed deletion.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${name}`);
  }
}

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf-8');
}

const BANNED: Array<[string, RegExp]> = [
  ['100% On-Device', /100%\s*on-device/i],
  ['Zero PII Storage', /zero\s+pii\s+storage/i],
  ['Zero PII Retention', /zero\s+pii\s+retention/i],
  ['100% accurate', /100%\s*accurate/i],
  ['100% verified', /100%\s*verified/i],
  ['fully verified', /fully\s+verified/i],
  ['100% government verified', /100%\s*government\s+verified/i],
];

// Active UI surface: components, i18n, features (excludes tests + historical docs)
const SCAN_FILES = [
  'components/account/AccountPrivacyModal.tsx',
  'components/account/EntrepreneurIdentityPod.tsx',
  'components/dashboard/DocumentOverview.tsx',
  'components/dashboard/TrustOverview.tsx',
  'features/commandCenter/components/DocumentOverview.tsx',
  'i18n/en.ts',
  'i18n/hi.ts',
  'i18n/ta.ts',
  'i18n/te.ts',
  'i18n/kn.ts',
  'i18n/ml.ts',
  'i18n/mr.ts',
  'i18n/commandCenter.ts',
  'features/commandCenter/en.ts',
  'features/commandCenter/hi.ts',
  'features/commandCenter/ta.ts',
  'features/commandCenter/te.ts',
  'features/commandCenter/kn.ts',
  'features/commandCenter/ml.ts',
  'features/commandCenter/mr.ts',
];

async function run(): Promise<void> {
  /* P1. Banned phrases absent from the active UI surface */
  for (const file of SCAN_FILES) {
    const content = read(file);
    for (const [label, re] of BANNED) {
      assert(`P1. no "${label}" in ${file}`, !re.test(content));
    }
  }

  /* P2. Seven-language parity of the corrected messaging */
  const langs = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr'] as const;
  // Markers that the corrected copy must carry in every language. English
  // markers are language-specific; for other languages we assert the key
  // exists and differs from the old misleading wording.
  const OLD_WORDING: Record<string, string[]> = {
    en: ['stored locally on your device in secure browser storage', 'Saved in this browser only', 'All of this is stored in this browser only'],
    hi: ['केवल आपके डिवाइस के स्थानीय ब्राउज़र में संग्रहीत है', 'यह सूची केवल इस ब्राउज़र में सहेजी जाती है', 'यह सब केवल इस ब्राउज़र में सहेजा जाता है'],
    ta: ['உங்கள் சாதனத்தில் பாதுகாப்பாக சேமிக்கப்படுகின்றன. திட்டம் சேது', 'இந்த உலாவியில் மட்டுமே பாதுகாக்கப்படுகிறது', 'இவை அனைத்தும் இந்த உலாவியில் மட்டுமே சேமிக்கப்படுகின்றன'],
    te: ['మీ పరికరంలో మాత్రమే సురక్షితంగా నిల్వ చేయబడతాయి', 'ఈ బ్రౌజర్‌లో మాత్రమే భద్రపరచబడుతుంది — నేరుగా', 'ఇదంతా ఈ బ్రౌజర్‌లో మాత్రమే భద్రపరచబడుతుంది'],
    kn: ['ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ. ಯೋಜನಾ ಸೇತು', 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮಾತ್ರ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ — ನೇರವಾಗಿ', 'ಇದೆಲ್ಲವೂ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮಾತ್ರ ಸಂಗ್ರಹವಾಗುತ್ತದೆ'],
    ml: ['നിങ്ങളുടെ ഉപകരണത്തിൽ സുരക്ഷിതമായി മാത്രം സൂക്ഷിക്കുന്നു', 'ഈ ബ്രൗസറിൽ മാത്രം സൂക്ഷിക്കുന്നു — നേരിട്ട്', 'ഇവയെല്ലാം ഈ ബ്രൗസറിൽ മാത്രമേ സൂക്ഷിക്കപ്പെടുകയുള്ളൂ'],
    mr: ['तुमच्या डिव्हाइसवर सुरक्षित ब्राउझर साठवणीत स्थानिकरित्या', 'केवळ या ब्राउझरमध्ये जतन — कोणत्याही', 'हे सर्व केवळ या ब्राउझरमध्ये साठवले आहे'],
  };
  for (const lang of langs) {
    const content = read(`i18n/${lang}.ts`);
    assert(`P2. ${lang}: privacyStorageNotice present`, content.includes('privacyStorageNotice'));
    assert(`P2. ${lang}: tracker.privacyNote present`, content.includes('privacyNote'));
    for (const old of OLD_WORDING[lang]) {
      assert(`P2. ${lang}: old misleading wording removed`, !content.includes(old));
    }
  }

  /* P2b. English corrected copy carries the sync disclosure */
  const en = read('i18n/en.ts');
  assert(
    'P2b. en privacyStorageNotice discloses account sync',
    en.includes('synchronized to your account when you sign in'),
  );
  assert(
    'P2b. en tracker privacyNote discloses cloud account',
    en.includes('and to your cloud account when signed in'),
  );
  assert(
    'P2b. en dashboard privacyNote discloses conditional sync',
    en.includes('syncs to your account only when you are signed in'),
  );

  /* P2c. privacyModalSubtitle carries the corrected "Citizen Data Security &
     Privacy Controls" wording (no "Sovereign", no on-device-storage claim)
     in all seven languages. */
  const SUBTITLES: Record<string, string> = {
    en: "privacyModalSubtitle: 'Citizen Data Security & Privacy Controls'",
    hi: "privacyModalSubtitle: 'नागरिक डेटा सुरक्षा एवं गोपनीयता नियंत्रण'",
    ta: "privacyModalSubtitle: 'குடிமக்கள் தரவு பாதுகாப்பு மற்றும் தனியுரிமை கட்டுப்பாடுகள்'",
    te: "privacyModalSubtitle: 'పౌర డేటా భద్రత మరియు గోప్యతా నియంత్రణలు'",
    kn: "privacyModalSubtitle: 'ನಾಗರಿಕ ಡೇಟಾ ಭದ್ರತೆ ಮತ್ತು ಗೌಪ್ಯತೆ ನಿಯಂತ್ರಣಗಳು'",
    ml: "privacyModalSubtitle: 'പൗര ഡാറ്റ സുരക്ഷയും സ്വകാര്യതാ നിയന്ത്രണങ്ങളും'",
    mr: "privacyModalSubtitle: 'नागरिक माहिती सुरक्षा व गोपनीयता नियंत्रणे'",
  };
  for (const lang of langs) {
    const content = read(`i18n/${lang}.ts`);
    assert(`P2c. ${lang}: privacyModalSubtitle corrected`, content.includes(SUBTITLES[lang]));
    assert(`P2c. ${lang}: no "Sovereign" in privacyModalSubtitle`, !/privacyModalSubtitle: '[^']*Sovereign/i.test(content));
    assert(`P2c. ${lang}: no "सार्वभौम" in privacyModalSubtitle`, !content.includes("privacyModalSubtitle: 'सार्वभौम"));
  }

  /* P3. Corrected copy never promises zero PII / zero retention / deletion */
  const allUi = SCAN_FILES.map(read).join('\n');
  assert('P3. no "zero PII" promise in UI surface', !/zero\s+pii/i.test(allUi));
  assert('P3. no "guaranteed deletion" promise', !/guaranteed\s+delet/i.test(allUi));
  assert('P3. no "never stored or transmitted" absolutism', !/never\s+stored\s+or\s+transmitted/i.test(allUi));

  console.log(`\n--- PRIVACY CLAIMS: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: privacy claims suite crashed', err);
  process.exitCode = 1;
});
