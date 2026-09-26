/**
 * YOJANA SETU — PHASE 2E.2 OFFICIAL PORTAL URL VERIFICATION TESTS
 * ------------------------------------------------------------------
 * Verifies the hardened official-portal trust classification:
 *
 *   verifyOfficialPortalUrl() delegates to the single shared classification
 *   path (trustEngine.classifyUrlSafety), which is registry-first and uses
 *   exact / domain-boundary hostname matching. Loose substring checks are
 *   gone: attacker-controlled hostnames must never verify.
 *
 * Covers spec §11 URL TRUST cases:
 *   1. valid official hostname
 *   2. www subdomain
 *   3. attacker suffix
 *   4. attacker prefix
 *   5. lookalike domain
 *   6. unknown domain
 *   7. non-government .org.in
 *   8. non-government .com
 *   9. malformed URL
 *   10. uppercase hostname normalization
 *
 * Plus regression guards for classifySourceHierarchy() and
 * getSchemeProvenance(): attacker hostnames must not elevate hierarchy
 * levels or flip isOfficialGovernmentSource, and generic .ac.in must not
 * confer official status.
 */

import { verifyOfficialPortalUrl } from './applicationPreparation';
import { classifySourceHierarchy, classifyUrlSafety } from '../data/trustEngine';
import { getSchemeProvenance } from '../data/normalization';
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

function schemeWithUrl(url: string): Scheme {
  return {
    officialPortalUrl: url,
    applicableStates: [],
    sponsoringMinistry: 'Ministry of MSME',
  } as unknown as Scheme;
}

async function run(): Promise<void> {
  /* 1. Valid official hostname verifies */
  let r = verifyOfficialPortalUrl('https://msme.gov.in/schemes');
  assert('T1. msme.gov.in verifies', r.isVerifiedGovtDomain === true);
  assert('T1. classification is OFFICIAL_GOVERNMENT', r.classification === 'OFFICIAL_GOVERNMENT');
  assert('T1. domain extracted', r.domain === 'msme.gov.in');
  assert('T1. https detected', r.isSecure === true);

  /* 2. www subdomain of a registered statutory body verifies */
  r = verifyOfficialPortalUrl('https://www.sidbi.in/en');
  assert('T2. www.sidbi.in verifies', r.isVerifiedGovtDomain === true);
  assert('T2. www.sidbi.in is IMPLEMENTING_AGENCY', r.classification === 'IMPLEMENTING_AGENCY');

  /* 2b. Registered statutory alias verifies (jansamarth.in via SIDBI registry entry) */
  r = verifyOfficialPortalUrl('https://www.jansamarth.in/home');
  assert('T2b. jansamarth.in verifies via registry', r.isVerifiedGovtDomain === true);

  /* 3. Attacker suffix must NOT verify */
  r = verifyOfficialPortalUrl('https://sidbi.in.attacker.com/login');
  assert('T3. sidbi.in.attacker.com does NOT verify', r.isVerifiedGovtDomain === false);
  assert(
    'T3. sidbi.in.attacker.com is SECONDARY_AGGREGATOR',
    r.classification === 'SECONDARY_AGGREGATOR',
  );

  /* 4. Attacker prefix must NOT verify */
  r = verifyOfficialPortalUrl('https://fake-sidbi.in/apply');
  assert('T4. fake-sidbi.in does NOT verify', r.isVerifiedGovtDomain === false);

  /* 5. Lookalike domain must NOT verify */
  r = verifyOfficialPortalUrl('https://sidbi-gov.in/apply');
  assert('T5. sidbi-gov.in lookalike does NOT verify', r.isVerifiedGovtDomain === false);
  r = verifyOfficialPortalUrl('https://msmegov.in/apply');
  assert('T5b. msmegov.in lookalike does NOT verify', r.isVerifiedGovtDomain === false);

  /* 6. Unknown domain → not verified, UNKNOWN (SECONDARY_AGGREGATOR) */
  r = verifyOfficialPortalUrl('https://some-random-portal.example.net/apply');
  assert('T6. unknown domain does NOT verify', r.isVerifiedGovtDomain === false);
  assert('T6. unknown domain is SECONDARY_AGGREGATOR', r.classification === 'SECONDARY_AGGREGATOR');

  /* 7. Non-government .org.in must NOT verify by suffix alone */
  r = verifyOfficialPortalUrl('https://random-ngo.org.in/donate');
  assert('T7. random-ngo.org.in does NOT verify', r.isVerifiedGovtDomain === false);
  /* 7b. Registered statutory .org.in still verifies (mudra.org.in is in the registry) */
  r = verifyOfficialPortalUrl('https://www.mudra.org.in/');
  assert('T7b. mudra.org.in verifies via registry', r.isVerifiedGovtDomain === true);

  /* 8. Non-government .com must NOT verify */
  r = verifyOfficialPortalUrl('https://random-aggregator.com/schemes');
  assert('T8. random .com does NOT verify', r.isVerifiedGovtDomain === false);

  /* 8b. US .gov TLD no longer auto-trusted */
  r = verifyOfficialPortalUrl('https://www.sba.gov/funding');
  assert('T8b. sba.gov (US) does NOT verify', r.isVerifiedGovtDomain === false);

  /* 8c. Generic .ac.in no longer auto-trusted */
  r = verifyOfficialPortalUrl('https://www.example.ac.in/');
  assert('T8c. generic .ac.in does NOT verify', r.isVerifiedGovtDomain === false);

  /* 9. Malformed URL → SUSPICIOUS_OR_INVALID, not verified */
  r = verifyOfficialPortalUrl('not a url at all');
  assert('T9. malformed URL does NOT verify', r.isVerifiedGovtDomain === false);
  assert('T9. malformed URL is SUSPICIOUS_OR_INVALID', r.classification === 'SUSPICIOUS_OR_INVALID');
  r = verifyOfficialPortalUrl('');
  assert('T9b. empty URL does NOT verify', r.isVerifiedGovtDomain === false);
  r = verifyOfficialPortalUrl(undefined);
  assert('T9c. undefined URL does NOT verify', r.isVerifiedGovtDomain === false);

  /* 10. Uppercase hostname normalizes */
  r = verifyOfficialPortalUrl('HTTPS://MSME.GOV.IN/Schemes');
  assert('T10. uppercase MSME.GOV.IN verifies', r.isVerifiedGovtDomain === true);
  assert('T10. hostname lowercased', r.domain === 'msme.gov.in');

  /* classifyUrlSafety direct: boundary-safe on suffix tricks */
  assert(
    'T11. classifyUrlSafety: evil-msme.gov.in.attacker.com is SECONDARY_AGGREGATOR',
    classifyUrlSafety('https://msme.gov.in.attacker.com/') === 'SECONDARY_AGGREGATOR',
  );
  assert(
    'T11b. classifyUrlSafety: subdomain of gov.in is OFFICIAL_GOVERNMENT',
    classifyUrlSafety('https://champions.gov.in/') === 'OFFICIAL_GOVERNMENT',
  );

  /* classifySourceHierarchy: attacker hostnames must not elevate */
  assert(
    'T12. hierarchy: msme.gov.in → level 1',
    classifySourceHierarchy(schemeWithUrl('https://msme.gov.in/x')) === 1,
  );
  assert(
    'T12b. hierarchy: sidbi.in.attacker.com is NOT level 4',
    classifySourceHierarchy(schemeWithUrl('https://sidbi.in.attacker.com/x')) !== 4,
  );
  assert(
    'T12c. hierarchy: fake-sidbi.in is NOT level 4',
    classifySourceHierarchy(schemeWithUrl('https://fake-sidbi.in/x')) !== 4,
  );
  assert(
    'T12d. hierarchy: URL with sidbi.in in path text is NOT level 4',
    classifySourceHierarchy(schemeWithUrl('https://evil.com/?next=sidbi.in')) !== 4,
  );
  assert(
    'T12e. hierarchy: www.sidbi.in → level 4',
    classifySourceHierarchy(schemeWithUrl('https://www.sidbi.in/x')) === 4,
  );

  /* getSchemeProvenance: boundary-safe, no .ac.in auto-trust */
  const provGov = getSchemeProvenance(schemeWithUrl('https://udyamregistration.gov.in/'));
  assert('T13. provenance: udyamregistration.gov.in is official', provGov.isOfficialGovernmentSource === true);
  const provAc = getSchemeProvenance(schemeWithUrl('https://www.example.ac.in/'));
  assert('T13b. provenance: generic .ac.in is NOT official', provAc.isOfficialGovernmentSource === false);
  const provAttacker = getSchemeProvenance(schemeWithUrl('https://cgtmse.in.attacker.com/'));
  assert(
    'T13c. provenance: cgtmse.in.attacker.com is NOT official',
    provAttacker.isOfficialGovernmentSource === false,
  );
  const provMudra = getSchemeProvenance(schemeWithUrl('https://mudra.org.in/'));
  assert('T13d. provenance: mudra.org.in is official (registry)', provMudra.isOfficialGovernmentSource === true);

  console.log(`\n--- URL TRUST: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: URL trust suite crashed', err);
  process.exitCode = 1;
});
