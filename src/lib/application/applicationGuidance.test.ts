/**
 * YOJANA SETU — PHASE 2E.2 APPLICATION GUIDANCE SAFETY TESTS
 * ------------------------------------------------------------
 * Verifies the SOURCE-BACKED vs UNKNOWN discipline of the application
 * guidance generator (getStepByStepApplicationGuide):
 *
 *   * No generic Aadhaar OTP / mobile OTP / e-sign / irreversible-submission
 *     / fabricated-channel requirement may appear unless the scheme record
 *     itself establishes it.
 *   * Source-backed fields (intelligence.application.applicationProcess,
 *     bankChannelInformation) are wired in when present.
 *   * Missing data degrades to UNKNOWN / NOT_SPECIFIED phrasing
 *     ("check the official portal"), never to a fabricated universal.
 *   * The Online / Hybrid / Offline-DIC channel model is preserved.
 */

import { getStepByStepApplicationGuide } from './applicationPreparation';
import type { Scheme } from '../../types/scheme';

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

function baseScheme(overrides: Partial<Scheme> = {}): Scheme {
  return {
    id: 'test-scheme',
    name: 'Test Scheme',
    officialPortalUrl: 'https://msme.gov.in/test',
    applicationMode: 'Online via Portal',
    requiredDocuments: ['doc-a', 'doc-b'],
    department: 'Test Department',
    sponsoringMinistry: 'Ministry of MSME',
    intelligence: { application: {} },
    ...overrides,
  } as unknown as Scheme;
}

function allText(scheme: Scheme): string {
  return getStepByStepApplicationGuide(scheme)
    .map((s) => `${s.titleEn} ${s.descEn} ${s.titleHi} ${s.descHi}`)
    .join('\n')
    .toLowerCase();
}

async function run(): Promise<void> {
  /* G1. No fabricated Aadhaar/mobile-OTP requirement in the default guide */
  let text = allText(baseScheme());
  assert('G1. no "aadhaar" in default guide', !text.includes('aadhaar'));
  assert('G1b. no "otp" in default guide', !text.includes('otp'));

  /* G2. No fabricated e-sign requirement */
  assert('G2. no "e-sign" in default guide', !text.includes('e-sign'));

  /* G3. No fabricated irreversible-submission claim */
  assert(
    'G3. no "changes cannot be made" in default guide',
    !text.includes('changes cannot be made'),
  );
  assert(
    'G3b. edit window is UNKNOWN — defers to portal',
    text.includes('check the portal'),
  );

  /* G4. No fabricated "download the submission PDF" artifact */
  assert('G4. no "submission pdf" in default guide', !text.includes('submission pdf'));

  /* G5. No fabricated attestation mandate ("self-attested ... statutory") */
  assert('G5. no "self-attested" in default guide', !text.includes('self-attested'));

  /* G6. Source-backed value retained: requiredDocuments count is real data */
  const steps = getStepByStepApplicationGuide(baseScheme());
  const docStep = steps.find((s) => s.titleEn.includes('Supporting Documents'));
  assert('G6. doc count step exists', !!docStep);
  assert('G6b. doc count is source-backed (2 listed)', !!docStep && docStep.descEn.includes('(2 listed for this scheme)'));

  /* G7. Source-backed applicationProcess is wired in when present */
  const withProcess = baseScheme({
    intelligence: {
      application: {
        applicationProcess: [
          'Apply through the state single-window portal.',
          'Upload the project report in PDF format.',
        ],
      },
    } as Scheme['intelligence'],
  });
  const processSteps = getStepByStepApplicationGuide(withProcess);
  assert('G7. applicationProcess steps used', processSteps.length === 2);
  assert(
    'G7b. first step is source-backed verbatim',
    processSteps[0].descEn === 'Apply through the state single-window portal.',
  );

  /* G8. Source-backed bankChannelInformation is wired into the hybrid guide */
  const hybridBank = baseScheme({
    applicationMode: 'Hybrid',
    intelligence: {
      application: {
        bankChannelInformation: 'Submit the dossier to the lead bank of your district.',
      },
    } as Scheme['intelligence'],
  });
  const hybridSteps = getStepByStepApplicationGuide(hybridBank);
  const bankStep = hybridSteps.find((s) => s.titleEn.includes('Nodal Agency'));
  assert('G8. bankChannelInformation used verbatim', !!bankStep && bankStep.descEn === 'Submit the dossier to the lead bank of your district.');

  /* G9. UNKNOWN fallback: hybrid without bankChannelInformation does not invent a channel */
  const hybridNoBank = baseScheme({ applicationMode: 'Hybrid' });
  const hybridNoBankSteps = getStepByStepApplicationGuide(hybridNoBank);
  const bankStepUnknown = hybridNoBankSteps.find((s) => s.titleEn.includes('Nodal Agency'));
  assert('G9. hybrid bank step exists', !!bankStepUnknown);
  assert(
    'G9b. no fabricated bank branch channel',
    !!bankStepUnknown && !bankStepUnknown.descEn.toLowerCase().includes('designated bank branch'),
  );
  assert(
    'G9c. UNKNOWN phrasing present',
    !!bankStepUnknown && bankStepUnknown.descEn.includes('Do not assume a channel the scheme has not declared'),
  );

  /* G10. Offline guide: no KVIC-specific "Khadi Board" universal */
  const offlineText = allText(baseScheme({ applicationMode: 'District Industry Center (DIC)' }));
  assert('G10. no "khadi board" in offline guide', !offlineText.includes('khadi board'));
  assert('G10b. no "block letters" fabrication', !offlineText.includes('block letters'));

  /* G11. Channel model preserved: 5 online / 3 hybrid / 3 offline steps */
  assert('G11. online has 5 steps', getStepByStepApplicationGuide(baseScheme()).length === 5);
  assert('G11b. hybrid has 3 steps', getStepByStepApplicationGuide(baseScheme({ applicationMode: 'Hybrid' })).length === 3);
  assert('G11c. offline has 3 steps', getStepByStepApplicationGuide(baseScheme({ applicationMode: 'District Industry Center (DIC)' })).length === 3);

  /* G12. Helpline is never fabricated here (component renders "Not specified in scheme data") */
  assert('G12. no helpline number fabricated in guide', !text.includes('1800'));

  console.log(`\n--- GUIDANCE SAFETY: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: guidance safety suite crashed', err);
  process.exitCode = 1;
});
