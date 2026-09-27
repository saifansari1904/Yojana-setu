/**
 * YOJANA SETU — PHASE 2E.2 TRUST REGISTRY CENTRALIZATION TESTS
 * --------------------------------------------------------------
 * Guards the final correction pass:
 *
 *   R1. src/data/governmentAuthorities.ts is the single authoritative
 *       registry: no additional hard-coded trusted-domain lists exist in
 *       trust utilities (lib/data/trustEngine, lib/data/normalization,
 *       features/commandCenter/lib/trust/trustEngine).
 *   R2. Every domain that was previously hard-coded in those utilities now
 *       resolves through the registry with its previous classification.
 *   R3. Hostname matching is exact / domain-boundary only: fake prefixes,
 *       fake suffixes, attacker subdomains, unknown domains, malformed URLs,
 *       non-government .org.in / .com, and uppercase/trailing-dot variants
 *       behave safely.
 *   R4. Consumers (classifyUrlSafety, classifySourceHierarchy,
 *       getSchemeProvenance, command-center classifyPortalDomain) consume
 *       the registry and keep their existing tier semantics.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import {
  findAuthorityByDomain,
  matchAuthorityByHostname,
  normalizeHostname,
} from '../../data/governmentAuthorities';
import { classifySourceHierarchy, classifyUrlSafety } from './trustEngine';
import { getSchemeProvenance } from './normalization';
import { classifyPortalDomain } from '../../features/commandCenter/lib/trust/trustEngine';
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

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
function read(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf-8');
}

function schemeWithUrl(url: string, isCandidate = false, states: string[] = []): Scheme {
  return {
    officialPortalUrl: url,
    applicableStates: states,
    sponsoringMinistry: 'Ministry of MSME',
    isCandidateScheme: isCandidate,
  } as Scheme;
}

async function run(): Promise<void> {
  /* R1. No hard-coded trusted-domain lists remain in trust utilities */
  const mainEngine = read('lib/data/trustEngine.ts');
  assert('R1. no statutoryAgencyDomains list in trustEngine', !mainEngine.includes('statutoryAgencyDomains'));
  assert('R1. no knownGovernmentBackedDomains list in trustEngine', !mainEngine.includes('knownGovernmentBackedDomains'));
  const normalization = read('lib/data/normalization.ts');
  assert('R1. no OFFICIAL_SOURCE_DOMAINS list in normalization', !normalization.includes('OFFICIAL_SOURCE_DOMAINS'));
  const ccEngine = read('features/commandCenter/lib/trust/trustEngine.ts');
  assert('R1. no KNOWN_NODAL_DOMAINS list in command-center trustEngine', !ccEngine.includes('KNOWN_NODAL_DOMAINS'));
  assert('R1. no VERIFIED_EXCEPTIONS list in command-center trustEngine', !ccEngine.includes('VERIFIED_EXCEPTIONS'));
  assert('R1. main trustEngine consumes matchAuthorityByHostname', mainEngine.includes('matchAuthorityByHostname'));
  assert('R1. normalization consumes findAuthorityByDomain', normalization.includes('findAuthorityByDomain'));
  assert('R1. command-center trustEngine consumes the registry', ccEngine.includes('governmentAuthorities'));

  /* R2. Previously hard-coded domains resolve through the registry with prior classifications */
  assert('R2. vcfsc.in -> IMPLEMENTING_AGENCY', classifyUrlSafety('https://vcfsc.in') === 'IMPLEMENTING_AGENCY');
  assert('R2. ncdc.in -> IMPLEMENTING_AGENCY', classifyUrlSafety('https://ncdc.in') === 'IMPLEMENTING_AGENCY');
  assert('R2. ksfc.in -> IMPLEMENTING_AGENCY', classifyUrlSafety('https://ksfc.in') === 'IMPLEMENTING_AGENCY');
  assert('R2. tiic.co.in -> IMPLEMENTING_AGENCY', classifyUrlSafety('https://tiic.co.in') === 'IMPLEMENTING_AGENCY');
  assert('R2. tnsfac.org -> GOVERNMENT_BACKED', classifyUrlSafety('https://tnsfac.org') === 'GOVERNMENT_BACKED');
  assert('R2. kswdc.org -> GOVERNMENT_BACKED', classifyUrlSafety('https://kswdc.org') === 'GOVERNMENT_BACKED');
  assert('R2. norkaroots.org -> GOVERNMENT_BACKED', classifyUrlSafety('https://norkaroots.org') === 'GOVERNMENT_BACKED');
  assert('R2. keralakhadi.org -> GOVERNMENT_BACKED', classifyUrlSafety('https://keralakhadi.org') === 'GOVERNMENT_BACKED');
  assert('R2. vcfsc.in hierarchy level 5', classifySourceHierarchy(schemeWithUrl('https://vcfsc.in')) === 5);
  assert('R2. ksfc.in hierarchy level 4', classifySourceHierarchy(schemeWithUrl('https://ksfc.in')) === 4);
  assert('R2. tiic.co.in hierarchy level 4', classifySourceHierarchy(schemeWithUrl('https://tiic.co.in')) === 4);
  assert('R2. standupmitra.in hierarchy level 1', classifySourceHierarchy(schemeWithUrl('https://standupmitra.in')) === 1);
  assert('R2. sidbi.in hierarchy level 4', classifySourceHierarchy(schemeWithUrl('https://sidbi.in')) === 4);
  assert('R2. cgtmse.in hierarchy level 4', classifySourceHierarchy(schemeWithUrl('https://cgtmse.in')) === 4);
  assert('R2. mudra.org.in hierarchy level 4', classifySourceHierarchy(schemeWithUrl('https://mudra.org.in')) === 4);
  assert('R2. nmdfc.org hierarchy level 5', classifySourceHierarchy(schemeWithUrl('https://nmdfc.org')) === 5);
  assert('R2. scsthub.in hierarchy level 5', classifySourceHierarchy(schemeWithUrl('https://scsthub.in')) === 5);
  // startupmission.kerala.gov.in: the .gov.in extension rules take precedence
  // (national -> 1, state-scoped -> 2) exactly as in the pre-pass classifier.
  assert('R2. startupmission.kerala.gov.in national -> level 1', classifySourceHierarchy(schemeWithUrl('https://startupmission.kerala.gov.in')) === 1);
  assert('R2. startupmission.kerala.gov.in state-scoped -> level 2', classifySourceHierarchy(schemeWithUrl('https://startupmission.kerala.gov.in', false, ['Kerala'])) === 2);

  /* R3. Boundary-safe hostname matching */
  // valid registered authority
  assert('R3. sidbi.in resolves to auth_sidbi', findAuthorityByDomain('sidbi.in')?.authorityId === 'auth_sidbi');
  assert('R3. match reports the exact pattern', matchAuthorityByHostname('sidbi.in')?.matchedPattern === 'sidbi.in');
  // www subdomain
  assert('R3. www.sidbi.in resolves to auth_sidbi', findAuthorityByDomain('www.sidbi.in')?.authorityId === 'auth_sidbi');
  // nested subdomain
  assert('R3. apply.standupmitra.in resolves to auth_sidbi', findAuthorityByDomain('apply.standupmitra.in')?.authorityId === 'auth_sidbi');
  // fake prefix / fake suffix / attacker subdomain
  assert('R3. fake-sidbi.in does NOT resolve', findAuthorityByDomain('fake-sidbi.in') === undefined);
  assert('R3. attacker-sidbi.in does NOT resolve', findAuthorityByDomain('attacker-sidbi.in') === undefined);
  assert('R3. sidbi.in.attacker.com does NOT resolve', findAuthorityByDomain('sidbi.in.attacker.com') === undefined);
  // unknown domain
  assert('R3. unknown-portal.example does NOT resolve', findAuthorityByDomain('unknown-portal.example') === undefined);
  // normalization: uppercase, whitespace, trailing dot
  assert('R3. WWW.SIDBI.IN normalizes and resolves', findAuthorityByDomain('WWW.SIDBI.IN')?.authorityId === 'auth_sidbi');
  assert('R3. trailing dot sidbi.in. resolves', findAuthorityByDomain('sidbi.in.')?.authorityId === 'auth_sidbi');
  assert('R3. normalizeHostname lowercases + strips dots', normalizeHostname('  WWW.Sidbi.IN... ') === 'www.sidbi.in');
  assert('R3. normalizeHostname empty on junk', normalizeHostname('') === '');

  /* R3b. Consumer-level boundary safety */
  assert('R3b. fake-sidbi.in -> SECONDARY_AGGREGATOR', classifyUrlSafety('https://fake-sidbi.in') === 'SECONDARY_AGGREGATOR');
  assert('R3b. attacker-sidbi.in -> SECONDARY_AGGREGATOR', classifyUrlSafety('https://attacker-sidbi.in') === 'SECONDARY_AGGREGATOR');
  assert('R3b. sidbi.in.attacker.com -> SECONDARY_AGGREGATOR', classifyUrlSafety('https://sidbi.in.attacker.com') === 'SECONDARY_AGGREGATOR');
  assert('R3b. non-government .org.in -> SECONDARY_AGGREGATOR', classifyUrlSafety('https://example.org.in') === 'SECONDARY_AGGREGATOR');
  assert('R3b. non-government .com -> SECONDARY_AGGREGATOR', classifyUrlSafety('https://example.com') === 'SECONDARY_AGGREGATOR');
  assert('R3b. malformed URL -> SUSPICIOUS_OR_INVALID', classifyUrlSafety('not a url') === 'SUSPICIOUS_OR_INVALID');
  assert('R3b. uppercase HTTPS://WWW.SIDBI.IN -> IMPLEMENTING_AGENCY', classifyUrlSafety('HTTPS://WWW.SIDBI.IN') === 'IMPLEMENTING_AGENCY');
  assert('R3b. sidbi.in.attacker.com hierarchy is NOT level 4', classifySourceHierarchy(schemeWithUrl('https://sidbi.in.attacker.com')) !== 4);
  assert('R3b. fake-sidbi.in hierarchy is NOT level 4', classifySourceHierarchy(schemeWithUrl('https://fake-sidbi.in')) !== 4);

  /* R4. Consumer semantics preserved */
  // candidate guard: a guarded portal (myscheme.gov.in, which candidates were
  // harvested from) never elevates a candidate to Level 1 on its URL alone.
  // (For state-scoped candidates the generic state .gov.in Level 2 rule still
  // applies — unchanged pre-pass behavior.)
  assert(
    'R4. state candidate on myscheme.gov.in is NOT level 1 (guard)',
    classifySourceHierarchy(schemeWithUrl('https://myscheme.gov.in', true, ['Karnataka'])) !== 1,
  );
  assert('R4. non-candidate on myscheme.gov.in is level 1', classifySourceHierarchy(schemeWithUrl('https://myscheme.gov.in')) === 1);
  // provenance: registry-consistent official detection, .ac.in never official
  assert('R4. udyamregistration.gov.in provenance official', getSchemeProvenance(schemeWithUrl('https://udyamregistration.gov.in')).isOfficialGovernmentSource === true);
  assert('R4. sidbi.in provenance official (registry)', getSchemeProvenance(schemeWithUrl('https://www.sidbi.in')).isOfficialGovernmentSource === true);
  assert('R4. generic .ac.in provenance NOT official', getSchemeProvenance(schemeWithUrl('https://www.example.ac.in')).isOfficialGovernmentSource === false);
  assert('R4. cgtmse.in.attacker.com provenance NOT official', getSchemeProvenance(schemeWithUrl('https://cgtmse.in.attacker.com')).isOfficialGovernmentSource === false);
  // command-center tiers: nodal set preserved via registry flag, extension policy intact
  assert('R4. cc: sidbi.in -> KNOWN_NODAL', classifyPortalDomain('https://sidbi.in') === 'KNOWN_NODAL');
  assert('R4. cc: nabard.org -> KNOWN_NODAL', classifyPortalDomain('https://nabard.org') === 'KNOWN_NODAL');
  assert('R4. cc: cgtmse.in -> KNOWN_NODAL', classifyPortalDomain('https://cgtmse.in') === 'KNOWN_NODAL');
  assert('R4. cc: standupmitra.in -> KNOWN_NODAL', classifyPortalDomain('https://standupmitra.in') === 'KNOWN_NODAL');
  assert('R4. cc: jansamarth.in -> KNOWN_NODAL', classifyPortalDomain('https://jansamarth.in') === 'KNOWN_NODAL');
  assert('R4. cc: www.sidbi.in -> KNOWN_NODAL (boundary)', classifyPortalDomain('https://www.sidbi.in') === 'KNOWN_NODAL');
  assert('R4. cc: fake-sidbi.in -> UNVERIFIED_EXTERNAL', classifyPortalDomain('https://fake-sidbi.in') === 'UNVERIFIED_EXTERNAL');
  assert('R4. cc: msme.gov.in -> VERIFIED_OFFICIAL', classifyPortalDomain('https://msme.gov.in') === 'VERIFIED_OFFICIAL');
  assert('R4. cc: jansamarth.gov.in -> VERIFIED_OFFICIAL', classifyPortalDomain('https://jansamarth.gov.in') === 'VERIFIED_OFFICIAL');
  assert('R4. cc: mudra.org.in stays UNVERIFIED_EXTERNAL', classifyPortalDomain('https://mudra.org.in') === 'UNVERIFIED_EXTERNAL');
  assert('R4. cc: example.ac.in -> UNVERIFIED_EXTERNAL', classifyPortalDomain('https://example.ac.in') === 'UNVERIFIED_EXTERNAL');
  assert('R4. cc: empty url -> INVALID', classifyPortalDomain('') === 'INVALID');

  console.log(`\n--- TRUST REGISTRY CENTRALIZATION: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
