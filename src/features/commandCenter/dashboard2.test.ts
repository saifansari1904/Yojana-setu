/**
 * DASHBOARD 2.0 TESTS
 *
 * Verifies the Entrepreneur Command Center presentation selectors:
 * - Engagement journey derived from real state only (no fabricated stages)
 * - Resume target routing
 * - Honest readiness categories (no invented percentages)
 * - Recent activity from real journey events only
 * - Top opportunities: eligible-first, engine order preserved, capped
 * - Seven-language parity for all new dashboard copy
 * - Language-independent selector output
 */

import {
  deriveEngagementStage,
  resolveResumeTarget,
  deriveReadinessCategories,
  collectRecentActivity,
  selectTopOpportunities,
  selectActiveApplications,
} from './lib/dashboard/dashboardSelectors';
import { en } from './en';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';
import { kn } from './kn';
import { ml } from './ml';
import { mr } from './mr';
import type { MatchResult, UserProfile } from '../../types';
import type { JourneyEvent, TrackedApplication } from '../../types/tracker';

let passed = 0;
let failed = 0;
const check = (name: string, condition: boolean) => {
  if (condition) {
    passed += 1;
    console.log(`✅ PASS: ${name}`);
  } else {
    failed += 1;
    console.log(`❌ FAIL: ${name}`);
  }
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseProfile = {
  category: 'general',
  age: 32,
  annualIncome: 600000,
  businessType: 'manufacturing',
  state: 'Karnataka',
  applicantName: 'Saif',
  businessStageKey: 'STARTUP',
  sector: 'manufacturing',
  operationalStatus: 'NEW',
  businessEntityType: 'PROPRIETORSHIP',
  totalProjectCost: 1000000,
  fundingRequired: 500000,
  fundingRangeId: '5l_10l',
  registrationStatus: 'REGISTERED',
} as unknown as UserProfile;

const matchFixture = (id: string, status: MatchResult['matchStatus'], pct: number): MatchResult =>
  ({
    scheme: { id, officialPortalUrl: 'https://www.kviconline.gov.in' },
    matchPercentage: pct,
    matchStatus: status,
    strongestFactors: [],
    unmetCriteria: [],
    matchedCriteria: [],
    plainLanguageExplanation: 'Why this matches.',
  }) as unknown as MatchResult;

const appFixture = (
  id: string,
  status: TrackedApplication['status'],
  journey: TrackedApplication['journey'] = [],
): TrackedApplication =>
  ({
    schemeId: id,
    schemeName: `Scheme ${id}`,
    status,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
    journey,
  }) as TrackedApplication;

const eventFixture = (id: string, at: string): JourneyEvent => ({
  id,
  at,
  source: 'USER_ACTION',
  labelEn: 'Marked documents ready',
  labelHi: 'दस्तावेज़ तैयार चिह्नित',
});

// ---------------------------------------------------------------------------
// Engagement stage
// ---------------------------------------------------------------------------

check('stage: null profile -> null (no fabricated stage)', deriveEngagementStage({
  profile: null, matchResults: [], applications: [], savedSchemeIds: new Set(), docProgress: {},
}) === null);

check('stage: profile only -> DISCOVER', deriveEngagementStage({
  profile: baseProfile, matchResults: [], applications: [], savedSchemeIds: new Set(), docProgress: {},
}) === 'DISCOVER');

check('stage: matches -> MATCH', deriveEngagementStage({
  profile: baseProfile,
  matchResults: [matchFixture('a', 'eligible', 90)],
  applications: [], savedSchemeIds: new Set(), docProgress: {},
}) === 'MATCH');

check('stage: matches + saved -> UNDERSTAND', deriveEngagementStage({
  profile: baseProfile,
  matchResults: [matchFixture('a', 'eligible', 90)],
  applications: [], savedSchemeIds: new Set(['a']), docProgress: {},
}) === 'UNDERSTAND');

check('stage: interested application -> PREPARE', deriveEngagementStage({
  profile: baseProfile,
  matchResults: [matchFixture('a', 'eligible', 90)],
  applications: [appFixture('1', 'interested')],
  savedSchemeIds: new Set(), docProgress: {},
}) === 'PREPARE');

check('stage: engaged documents -> PREPARE', deriveEngagementStage({
  profile: baseProfile, matchResults: [], applications: [],
  savedSchemeIds: new Set(), docProgress: { a: ['doc-1'] },
}) === 'PREPARE');

check('stage: docs-ready application -> APPLY', deriveEngagementStage({
  profile: baseProfile, matchResults: [], applications: [appFixture('1', 'docs-ready')],
  savedSchemeIds: new Set(), docProgress: {},
}) === 'APPLY');

check('stage: applied application -> TRACK', deriveEngagementStage({
  profile: baseProfile, matchResults: [], applications: [appFixture('1', 'applied')],
  savedSchemeIds: new Set(), docProgress: {},
}) === 'TRACK');

check('stage: approved application -> TRACK', deriveEngagementStage({
  profile: baseProfile, matchResults: [], applications: [appFixture('1', 'approved')],
  savedSchemeIds: new Set(), docProgress: {},
}) === 'TRACK');

check('stage: applied outranks docs-ready', deriveEngagementStage({
  profile: baseProfile, matchResults: [],
  applications: [appFixture('1', 'docs-ready'), appFixture('2', 'applied')],
  savedSchemeIds: new Set(), docProgress: {},
}) === 'TRACK');

// ---------------------------------------------------------------------------
// Resume target
// ---------------------------------------------------------------------------

check('resume: active application -> tracker (pending)', (() => {
  const r = resolveResumeTarget({ matchResults: [], applications: [appFixture('1', 'interested')] });
  return r.target === 'tracker' && r.hasPendingJourney === true;
})());

check('resume: matches only -> results (pending)', (() => {
  const r = resolveResumeTarget({ matchResults: [matchFixture('a', 'eligible', 90)], applications: [] });
  return r.target === 'results' && r.hasPendingJourney === true;
})());

check('resume: nothing -> results (not pending)', (() => {
  const r = resolveResumeTarget({ matchResults: [], applications: [] });
  return r.target === 'results' && r.hasPendingJourney === false;
})());

check('resume: only terminal applications -> results (not pending journey)', (() => {
  const r = resolveResumeTarget({ matchResults: [], applications: [appFixture('1', 'approved')] });
  return r.hasPendingJourney === false;
})());

// ---------------------------------------------------------------------------
// Readiness categories
// ---------------------------------------------------------------------------

check('readiness: full profile -> personal/business/financial/registrations COMPLETE', (() => {
  const cats = deriveReadinessCategories(baseProfile, {});
  const byKey = Object.fromEntries(cats.map((c) => [c.key, c.state]));
  return (
    byKey.personal === 'COMPLETE' &&
    byKey.business === 'COMPLETE' &&
    byKey.financial === 'COMPLETE' &&
    byKey.registrations === 'COMPLETE' &&
    byKey.documents === 'NOT_ASSESSED'
  );
})());

check('readiness: missing name -> personal ATTENTION (not failure)', (() => {
  const p = { ...baseProfile, applicantName: undefined } as unknown as UserProfile;
  const cats = deriveReadinessCategories(p, {});
  return cats.find((c) => c.key === 'personal')?.state === 'ATTENTION';
})());

check('readiness: unknown registration -> NOT_ASSESSED (not incomplete)', (() => {
  const p = { ...baseProfile, registrationStatus: 'UNKNOWN' } as unknown as UserProfile;
  const cats = deriveReadinessCategories(p, {});
  return cats.find((c) => c.key === 'registrations')?.state === 'NOT_ASSESSED';
})());

check('readiness: unregistered -> ATTENTION', (() => {
  const p = { ...baseProfile, registrationStatus: 'UNREGISTERED' } as unknown as UserProfile;
  const cats = deriveReadinessCategories(p, {});
  return cats.find((c) => c.key === 'registrations')?.state === 'ATTENTION';
})());

check('readiness: engaged docs -> documents ATTENTION', (() => {
  const cats = deriveReadinessCategories(baseProfile, { pmegp: ['aadhaar'] });
  return cats.find((c) => c.key === 'documents')?.state === 'ATTENTION';
})());

check('readiness: five categories, stable keys', (() => {
  const cats = deriveReadinessCategories(baseProfile, {});
  return (
    cats.length === 5 &&
    cats.map((c) => c.key).join(',') === 'personal,business,financial,registrations,documents'
  );
})());

// ---------------------------------------------------------------------------
// Recent activity
// ---------------------------------------------------------------------------

check('activity: empty applications -> empty (no fabricated activity)', 
  collectRecentActivity([], 5).length === 0);

check('activity: events sorted newest-first', (() => {
  const apps = [appFixture('1', 'applied', [
    eventFixture('e1', '2026-09-10T10:00:00.000Z'),
    eventFixture('e2', '2026-09-20T10:00:00.000Z'),
  ])];
  const items = collectRecentActivity(apps, 5);
  return items.length === 2 && items[0].id === 'e2' && items[1].id === 'e1';
})());

check('activity: events without timestamps excluded', (() => {
  const apps = [appFixture('1', 'applied', [
    { ...eventFixture('e1', '2026-09-10T10:00:00.000Z'), at: '' },
  ])];
  return collectRecentActivity(apps, 5).length === 0;
})());

check('activity: capped at limit', (() => {
  const events = [1, 2, 3, 4, 5, 6, 7].map((i) =>
    eventFixture(`e${i}`, `2026-09-${String(i).padStart(2, '0')}T10:00:00.000Z`),
  );
  const apps = [appFixture('1', 'applied', events)];
  return collectRecentActivity(apps, 5).length === 5;
})());

// ---------------------------------------------------------------------------
// Top opportunities
// ---------------------------------------------------------------------------

check('opportunities: eligible first, engine order preserved within groups', (() => {
  const input = [
    matchFixture('low', 'low-match', 40),
    matchFixture('elig1', 'eligible', 95),
    matchFixture('near', 'near-match', 70),
    matchFixture('elig2', 'eligible', 88),
  ];
  const out = selectTopOpportunities(input, 4);
  return out.map((m) => m.scheme.id).join(',') === 'elig1,elig2,low,near';
})());

check('opportunities: capped at count', 
  selectTopOpportunities(
    [1, 2, 3, 4, 5, 6].map((i) => matchFixture(`s${i}`, 'eligible', 90 - i)),
    4,
  ).length === 4);

check('opportunities: no eligible -> original order kept', (() => {
  const input = [matchFixture('a', 'near-match', 70), matchFixture('b', 'low-match', 40)];
  const out = selectTopOpportunities(input, 4);
  return out[0].scheme.id === 'a' && out[1].scheme.id === 'b';
})());

check('opportunities: input not mutated', (() => {
  const input = [matchFixture('low', 'low-match', 40), matchFixture('elig', 'eligible', 95)];
  selectTopOpportunities(input, 4);
  return input[0].scheme.id === 'low' && input[1].scheme.id === 'elig';
})());

// ---------------------------------------------------------------------------
// Active applications
// ---------------------------------------------------------------------------

check('applications: terminal states excluded', (() => {
  const apps = [
    appFixture('1', 'interested'),
    appFixture('2', 'approved'),
    appFixture('3', 'rejected'),
    appFixture('4', 'docs-ready'),
  ];
  const out = selectActiveApplications(apps, 5);
  return out.length === 2 && out[0].schemeId === '1' && out[1].schemeId === '4';
})());

// ---------------------------------------------------------------------------
// Language independence of selector output
// ---------------------------------------------------------------------------

check('selectors: identical output regardless of profile name language', (() => {
  const hiProfile = { ...baseProfile, applicantName: 'सैफ़' } as unknown as UserProfile;
  const a = JSON.stringify(deriveReadinessCategories(baseProfile, {}));
  const b = JSON.stringify(deriveReadinessCategories(hiProfile, {}));
  const stageA = deriveEngagementStage({
    profile: baseProfile, matchResults: [matchFixture('x', 'eligible', 90)],
    applications: [], savedSchemeIds: new Set(['x']), docProgress: {},
  });
  const stageB = deriveEngagementStage({
    profile: hiProfile, matchResults: [matchFixture('x', 'eligible', 90)],
    applications: [], savedSchemeIds: new Set(['x']), docProgress: {},
  });
  return a === b && stageA === stageB;
})());

// ---------------------------------------------------------------------------
// Seven-language parity for dashboard copy
// ---------------------------------------------------------------------------

const locales = { en, hi, ta, te, kn, ml, mr } as const;
const localeNames = Object.keys(locales) as (keyof typeof locales)[];

check('i18n: all 7 locales expose identical key sets', (() => {
  const enKeys = Object.keys(en).sort().join('|');
  return localeNames.every((l) => Object.keys(locales[l]).sort().join('|') === enKeys);
})());

check('i18n: every dash* key non-empty in all 7 languages', (() => {
  const dashKeys = Object.keys(en).filter((k) => k.startsWith('dash'));
  if (dashKeys.length === 0) return false;
  return dashKeys.every((k) =>
    localeNames.every((l) => {
      const v = (locales[l] as Record<string, string>)[k];
      return typeof v === 'string' && v.trim().length > 0;
    }),
  );
})());

check('i18n: journey stage + CTA keys present for all 6 stages x 7 languages', (() => {
  const stages = ['DISCOVER', 'MATCH', 'UNDERSTAND', 'PREPARE', 'APPLY', 'TRACK'];
  return stages.every((s) =>
    localeNames.every((l) => {
      const rec = locales[l] as Record<string, string>;
      return (
        typeof rec[`dashStage${s}`] === 'string' &&
        typeof rec[`dashStageLine${s}`] === 'string' &&
        typeof rec[`dashCta${s}`] === 'string'
      );
    }),
  );
})());

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nDashboard 2.0: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
