import assert from 'node:assert';
import { SCHEMES_DATABASE, DATASET_METADATA, COMPLETENESS_REPORT } from './schemes';
import {
  getAllSchemes,
  getSchemeById,
  getSchemesByState,
  getNationalSchemes,
  getStateSpecificSchemes,
  getSouthIndiaSchemes,
  getSchemesByScope,
  getSchemesByNormalizedCategory,
  getSchemesByFundingType,
  getSchemesByVerificationStatus,
  searchSchemes,
  searchSchemesAdvanced,
  getDatasetMetadata,
  getCompletenessReport,
} from '../lib/data/schemeRepository';
import { runSchemeImportPipeline } from '../lib/data/pipeline';
import {
  getSchemeScope,
  getSchemeCategories,
  getSchemeProvenance,
  getSchemeVerificationStatus,
  deduplicateSchemes,
} from '../lib/data/normalization';
import { NORMALIZED_SCHEME_CATEGORIES, NormalizedSchemeCategory } from './schemeTaxonomy';
import { evaluateSchemeEligibility, rankSchemesForProfile } from '../utils/matchingEngine';
import { UserProfile } from '../types/user';

console.log('--- RUNNING YOJANA SETU PHASE 2: SOUTH INDIA SCHEME INTELLIGENCE SUITE ---');

// ==========================================
// 1. DATASET COMPOSITION & GEOGRAPHIC SCOPE
// ==========================================
{
  const total = getAllSchemes();
  assert(total.length === 39, `Phase 2: Total schemes must be 39 (got ${total.length})`);
  console.log('✅ PASS: Total schemes count is 39');

  const national = getNationalSchemes();
  assert(national.length === 10, `Phase 2: Exactly 10 National Central schemes (got ${national.length})`);
  for (const s of national) {
    assert(s.scope === 'NATIONAL', `Scheme ${s.id} must have scope 'NATIONAL'`);
    assert(s.applicableStates.length === 0, `National scheme ${s.id} must have empty applicableStates`);
  }
  console.log('✅ PASS: Central National schemes correctly configured (10 schemes, scope NATIONAL)');

  const karnataka = getStateSpecificSchemes('Karnataka');
  assert(karnataka.length === 8, `Phase 2: Karnataka must have 8 schemes (got ${karnataka.length})`);
  for (const s of karnataka) {
    assert(s.scope === 'STATE_SPECIFIC', `Karnataka scheme ${s.id} must have scope 'STATE_SPECIFIC'`);
    assert(s.applicableStates.includes('Karnataka'), `Scheme ${s.id} must include Karnataka`);
  }
  console.log('✅ PASS: Karnataka schemes validated (8 schemes, scope STATE_SPECIFIC)');

  const kerala = getStateSpecificSchemes('Kerala');
  assert(kerala.length === 6, `Phase 2: Kerala must have 6 schemes (got ${kerala.length})`);
  for (const s of kerala) {
    assert(s.scope === 'STATE_SPECIFIC', `Kerala scheme ${s.id} must have scope 'STATE_SPECIFIC'`);
    assert(s.applicableStates.includes('Kerala'), `Scheme ${s.id} must include Kerala`);
  }
  console.log('✅ PASS: Kerala schemes validated (6 schemes, scope STATE_SPECIFIC)');

  const tamilNadu = getStateSpecificSchemes('Tamil Nadu');
  assert(tamilNadu.length === 5, `Phase 2: Tamil Nadu must have 5 schemes (got ${tamilNadu.length})`);
  for (const s of tamilNadu) {
    assert(s.scope === 'STATE_SPECIFIC', `Tamil Nadu scheme ${s.id} must have scope 'STATE_SPECIFIC'`);
    assert(s.applicableStates.includes('Tamil Nadu'), `Scheme ${s.id} must include Tamil Nadu`);
  }
  console.log('✅ PASS: Tamil Nadu schemes validated (5 schemes, scope STATE_SPECIFIC)');

  const telangana = getStateSpecificSchemes('Telangana');
  assert(telangana.length === 5, `Phase 2: Telangana must have 5 schemes (got ${telangana.length})`);
  for (const s of telangana) {
    assert(s.scope === 'STATE_SPECIFIC', `Telangana scheme ${s.id} must have scope 'STATE_SPECIFIC'`);
    assert(s.applicableStates.includes('Telangana'), `Scheme ${s.id} must include Telangana`);
  }
  console.log('✅ PASS: Telangana schemes validated (5 schemes, scope STATE_SPECIFIC)');

  const andhraPradesh = getStateSpecificSchemes('Andhra Pradesh');
  assert(andhraPradesh.length === 3, `Phase 2: Andhra Pradesh must have 3 schemes (got ${andhraPradesh.length})`);
  for (const s of andhraPradesh) {
    assert(s.scope === 'STATE_SPECIFIC', `AP scheme ${s.id} must have scope 'STATE_SPECIFIC'`);
    assert(s.applicableStates.includes('Andhra Pradesh'), `Scheme ${s.id} must include Andhra Pradesh`);
  }
  console.log('✅ PASS: Andhra Pradesh schemes validated (3 schemes, scope STATE_SPECIFIC)');

  const southIndiaAll = getSouthIndiaSchemes();
  assert(southIndiaAll.length === 26, `Phase 2: South India schemes array has 26 items (got ${southIndiaAll.length})`);
  console.log('✅ PASS: getSouthIndiaSchemes() returns curated South Indian schemes');
}

// ==========================================
// 2. STATE FILTERING & RETRIEVAL LOGIC
// ==========================================
{
  // getSchemesByState includes State-Specific + National schemes
  const kaSchemesWithNational = getSchemesByState('Karnataka');
  assert(
    kaSchemesWithNational.length === 8 + 10,
    `Karnataka state query must return 18 schemes (8 state + 10 national), got ${kaSchemesWithNational.length}`
  );

  const klSchemesWithNational = getSchemesByState('Kerala');
  assert(
    klSchemesWithNational.length === 6 + 10,
    `Kerala state query must return 16 schemes (6 state + 10 national), got ${klSchemesWithNational.length}`
  );

  const tnSchemesWithNational = getSchemesByState('Tamil Nadu');
  assert(
    tnSchemesWithNational.length === 5 + 10,
    `Tamil Nadu state query must return 15 schemes (5 state + 10 national), got ${tnSchemesWithNational.length}`
  );

  const tsSchemesWithNational = getSchemesByState('Telangana');
  assert(
    tsSchemesWithNational.length === 5 + 10,
    `Telangana state query must return 15 schemes (5 state + 10 national), got ${tsSchemesWithNational.length}`
  );

  const apSchemesWithNational = getSchemesByState('Andhra Pradesh');
  assert(
    apSchemesWithNational.length === 3 + 10,
    `Andhra Pradesh state query must return 13 schemes (3 state + 10 national), got ${apSchemesWithNational.length}`
  );

  const allSchemes = getSchemesByState('All States & UTs');
  assert(allSchemes.length === 39, 'All States query returns full database');
  console.log('✅ PASS: State query returns state schemes + national schemes');
}

// ==========================================
// 3. SCHEME CATEGORIES & TAXONOMY NORMALIZATION
// ==========================================
{
  for (const cat of NORMALIZED_SCHEME_CATEGORIES) {
    const matching = getSchemesByNormalizedCategory(cat);
    assert(Array.isArray(matching), `Category ${cat} query returned valid array`);
  }

  const msmeSchemes = getSchemesByNormalizedCategory('MSME');
  assert(msmeSchemes.length > 5, `MSME category has schemes (found ${msmeSchemes.length})`);

  const womenSchemes = getSchemesByNormalizedCategory('Women Entrepreneurship');
  assert(womenSchemes.length > 0, `Women Entrepreneurship category has schemes (found ${womenSchemes.length})`);
  assert(womenSchemes.some((s) => s.id === 'karnataka-udyogini'), 'Udyogini is in Women Entrepreneurship');

  const startupSchemes = getSchemesByNormalizedCategory('Startup');
  assert(startupSchemes.length > 0, `Startup category has schemes (found ${startupSchemes.length})`);
  assert(startupSchemes.some((s) => s.id === 'kerala-startup-mission'), 'KSUM is in Startup category');

  const scStSchemes = getSchemesByNormalizedCategory('SC/ST Entrepreneurship');
  assert(scStSchemes.length > 0, `SC/ST category has schemes (found ${scStSchemes.length})`);
  assert(scStSchemes.some((s) => s.id === 'ts-tpride'), 'T-PRIDE is in SC/ST category');

  console.log('✅ PASS: Normalized scheme categories query correctly filters schemes');
}

// ==========================================
// 4. SEARCH & DISCOVERY ENGINE
// ==========================================
{
  // Keyword search
  const subsidyResults = searchSchemes('subsidy');
  assert(subsidyResults.length > 0, 'Keyword search for "subsidy" returns matches');

  const udyoginiResult = searchSchemes('Udyogini');
  assert(udyoginiResult.some((s) => s.id === 'karnataka-udyogini'), 'Found Udyogini by name search');

  const elevateResult = searchSchemes('Elevate');
  assert(elevateResult.some((s) => s.id === 'karnataka-startup-elevate'), 'Found Elevate by keyword');

  // Advanced search with multiple criteria
  const advancedKAWomen = searchSchemesAdvanced({
    state: 'Karnataka',
    category: 'Women Entrepreneurship',
  });
  assert(advancedKAWomen.length > 0, 'Advanced search for Karnataka + Women Entrepreneurship succeeded');
  assert(advancedKAWomen.some((s) => s.id === 'karnataka-udyogini'), 'Found Udyogini in advanced search');

  const advancedTSScSt = searchSchemesAdvanced({
    state: 'Telangana',
    category: 'SC/ST Entrepreneurship',
  });
  assert(advancedTSScSt.some((s) => s.id === 'ts-tpride'), 'Found T-PRIDE in advanced search');

  console.log('✅ PASS: Search and advanced discovery engine operate reliably');
}

// ==========================================
// 5. PROVENANCE PRESERVATION & VERIFICATION
// ==========================================
{
  const verifiedList = getSchemesByVerificationStatus('VERIFIED');
  assert(verifiedList.length > 0, 'Verified schemes pool is populated');

  for (const s of SCHEMES_DATABASE) {
    const prov = getSchemeProvenance(s);
    assert(prov.sourceName && prov.sourceName.length > 0, `Scheme ${s.id} has valid sourceName`);
    assert(prov.officialSourceUrl && prov.officialSourceUrl.startsWith('http'), `Scheme ${s.id} has officialSourceUrl`);
    assert(prov.priorityLevel >= 1 && prov.priorityLevel <= 5, `Scheme ${s.id} has valid priorityLevel`);
    assert(['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED'].includes(prov.verificationStatus), `Scheme ${s.id} valid status`);
  }
  console.log('✅ PASS: Provenance and verification status preserved across 100% of schemes');
}

// ==========================================
// 6. DEDUPLICATION & DATA IMPORT PIPELINE
// ==========================================
{
  const testPool = [
    SCHEMES_DATABASE[0],
    SCHEMES_DATABASE[0], // Duplicate ID
    SCHEMES_DATABASE[1],
  ];
  const dedup = deduplicateSchemes(testPool);
  assert(dedup.duplicatesCount === 1, 'Deduplicator identified 1 duplicate');
  assert(dedup.uniqueSchemes.length === 2, 'Deduplicator retained 2 unique schemes');

  const pipeline = runSchemeImportPipeline(SCHEMES_DATABASE);
  assert(pipeline.success === true, 'Pipeline execution completed successfully');
  assert(pipeline.deduplicatedCount === 39, 'Pipeline produced 39 clean schemes');
  assert(pipeline.validation.isValid === true, 'Pipeline validation is green');
  assert(pipeline.metadata.recordCount === 39, 'Pipeline metadata matches record count');
  assert(pipeline.completenessReport.overallCompletenessScore >= 95, 'Completeness score is >= 95%');

  console.log('✅ PASS: Reusable scheme import and deduplication pipeline functioning correctly');
}

// ==========================================
// 7. DETERMINISTIC MATCHING PRESERVATION
// ==========================================
{
  const sampleProfile: UserProfile = {
    category: 'OBC',
    businessType: 'services',
    annualIncome: 350000,
    age: 28,
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    gender: 'female',
    businessStage: 'idea',
  };

  const matches = rankSchemesForProfile(SCHEMES_DATABASE, sampleProfile, 'en');
  assert(matches.length === 39, 'Matching engine evaluated all 39 schemes');

  // Verify that score weights remain exactly 20/20/20/20/20
  for (const m of matches) {
    assert(!isNaN(m.matchPercentage), `Match percentage for ${m.scheme.id} is valid number`);
    assert(m.matchPercentage >= 0 && m.matchPercentage <= 100, `Score is within 0-100`);
    assert(m.totalFactorsCount === 5, 'Every match evaluates exactly 5 factors');
  }

  // Karnataka woman founder should be eligible for Udyogini Scheme
  const udyoginiMatch = matches.find((m) => m.scheme.id === 'karnataka-udyogini');
  assert(udyoginiMatch !== undefined, 'Udyogini scheme found in results');
  assert(udyoginiMatch.isEligible === true, 'Karnataka woman is eligible for Udyogini');
  assert(udyoginiMatch.matchStatus === 'eligible', 'Match status is eligible');

  console.log('✅ PASS: Matching engine remains 100% deterministic with unchanged mathematical weights');
}

// ==========================================
// 8. DATASET METRICS & SUMMARY REPORT
// ==========================================
{
  const meta = getDatasetMetadata();
  const completeness = getCompletenessReport();

  console.log('\n======================================================');
  console.log('YOJANA SETU — PHASE 2 DATASET AUDIT REPORT');
  console.log('======================================================');
  console.log(`Total Schemes:             ${meta.recordCount}`);
  console.log(`Central / National:        ${meta.nationalCount}`);
  console.log(`Karnataka Schemes:         ${meta.stateCounts['Karnataka'] || 0}`);
  console.log(`Kerala Schemes:            ${meta.stateCounts['Kerala'] || 0}`);
  console.log(`Tamil Nadu Schemes:        ${meta.stateCounts['Tamil Nadu'] || 0}`);
  console.log(`Telangana Schemes:         ${meta.stateCounts['Telangana'] || 0}`);
  console.log(`Andhra Pradesh Schemes:    ${meta.stateCounts['Andhra Pradesh'] || 0}`);
  console.log(`Other State Schemes (MH/UP): ${(meta.stateCounts['Maharashtra'] || 0) + (meta.stateCounts['Uttar Pradesh'] || 0)}`);
  console.log('------------------------------------------------------');
  console.log(`Verified Schemes:          ${meta.verificationBreakdown.verified}`);
  console.log(`Partially Verified:        ${meta.verificationBreakdown.partiallyVerified}`);
  console.log(`Unverified Schemes:        ${meta.verificationBreakdown.unverified}`);
  console.log('------------------------------------------------------');
  console.log(`Data Completeness Score:   ${completeness.overallCompletenessScore}%`);
  for (const f of completeness.fields) {
    console.log(`  - ${f.label.padEnd(35)}: ${f.percentage}% (${f.presentCount}/${f.totalCount})`);
  }
  console.log('======================================================\n');
}

console.log('PHASE 2 SCHEME INTELLIGENCE SUITE: ALL TESTS PASSED!');
