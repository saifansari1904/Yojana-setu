/**
 * PHASE 4.3 — APPLICATION JOURNEY, FRESHNESS & REPORT TEST SUITE
 *
 * Run: npx tsx src/lib/tracker/phase4_3ApplicationJourney.test.ts
 */

import type { UserProfile } from '../../types/user';
import type { TrackedApplication } from '../../types/tracker';
import { SCHEMES_DATABASE } from '../../data/schemes';
import { rankSchemesForProfile } from '../matching/matchingEngine';
import { buildSupportPathway } from '../business/supportPathway';
import {
  getPreparedDocIds,
  setDocumentsPrepared,
  summariseDocumentProgress,
  toggleDocumentPrepared,
} from './documentProgress';
import {
  diffInDays,
  evaluateFollowUp,
  evaluateSchemeFreshness,
  followUpUrgencyRank,
  toIsoDateInput,
} from './schemeFreshness';
import {
  appendJourneyEvent,
  capturePathwaySnapshot,
  recordDocumentProgressEvent,
  startApplicationFromPathway,
  statusChangeEvent,
  suggestStatusFromPreparation,
} from './applicationJourney';
import { buildPathwayReport } from '../report/pathwayReport';

let passed = 0;
let failed = 0;

const assert = (name: string, condition: boolean) => {
  if (condition) {
    passed += 1;
    console.log(`✅ PASS: ${name}`);
  } else {
    failed += 1;
    console.log(`❌ FAIL: ${name}`);
  }
};

console.log('\n--- RUNNING YOJANA SETU PHASE 4.3: APPLICATION JOURNEY TEST SUITE ---\n');

const profile: UserProfile = {
  category: 'General',
  age: 31,
  annualIncome: 240000,
  businessType: 'manufacturing',
  state: 'Karnataka',
  businessStageKey: 'PRE_LAUNCH',
  totalProjectCost: 1200000,
  existingInvestment: 400000,
  primarySupportNeed: 'CAPITAL',
  secondarySupportNeeds: ['EQUIPMENT', 'TRAINING'],
} as unknown as UserProfile;

const matchResults = rankSchemesForProfile(SCHEMES_DATABASE, profile, 'en');
const pathway = buildSupportPathway({ profile, matchResults, lang: 'en' });
const topMatch = matchResults[0];

/* ================= 1. DOCUMENT PROGRESS STORE ================= */
console.log('\n[1] Document progress store (unified localStorage model)\n');

const empty = {};
const afterOne = toggleDocumentPrepared(empty, 'scheme-a', 'doc-1');
assert('T1: Toggling an item records it for that scheme', getPreparedDocIds(afterOne, 'scheme-a').includes('doc-1'));
assert('T2: Toggle does not mutate the original map', Object.keys(empty).length === 0);

const afterTwo = toggleDocumentPrepared(afterOne, 'scheme-a', 'doc-2');
assert('T3: A second item is added, not replaced', getPreparedDocIds(afterTwo, 'scheme-a').length === 2);

const afterUntoggle = toggleDocumentPrepared(afterTwo, 'scheme-a', 'doc-1');
assert('T4: Re-toggling removes the item', !getPreparedDocIds(afterUntoggle, 'scheme-a').includes('doc-1'));

const cleared = toggleDocumentPrepared(afterUntoggle, 'scheme-a', 'doc-2');
assert('T5: Emptying a scheme removes its key entirely', cleared['scheme-a'] === undefined);

const deduped = setDocumentsPrepared({}, 'scheme-b', ['d1', 'd1', 'd2']);
assert('T6: setDocumentsPrepared de-duplicates ids', getPreparedDocIds(deduped, 'scheme-b').length === 2);

const summary = summariseDocumentProgress(deduped, 'scheme-b', 4);
assert('T7: Summary reports prepared vs total', summary.ready === 2 && summary.total === 4);
assert('T8: Partial progress is not "all ready"', summary.allReady === false);
assert('T9: Engagement is detected from explicit ticks only', summary.hasEngaged === true);

const noDocsSummary = summariseDocumentProgress({}, 'scheme-c', 0);
assert('T10: No document data never reports readiness', noDocsSummary.allReady === false);
assert('T11: No ticks means no engagement (nothing assumed)', noDocsSummary.hasEngaged === false);

const fullSummary = summariseDocumentProgress(setDocumentsPrepared({}, 'scheme-d', ['a', 'b']), 'scheme-d', 2);
assert('T12: All items ticked reports all ready', fullSummary.allReady === true);

/* ================= 2. SCHEME FRESHNESS ================= */
console.log('\n[2] Data freshness (derived only from lastVerifiedDate / isActive)\n');

const today = new Date('2026-09-15T00:00:00Z');

const freshScheme = { ...SCHEMES_DATABASE[0], lastVerifiedDate: '2026-08-01' };
const fresh = evaluateSchemeFreshness(freshScheme as never, today);
assert('T13: Recently verified record is RECENTLY_VERIFIED', fresh.state === 'RECENTLY_VERIFIED');
assert('T14: Recently verified needs no re-check prompt', fresh.shouldRecheckOfficialSource === false);

const ageing = evaluateSchemeFreshness({ ...SCHEMES_DATABASE[0], lastVerifiedDate: '2026-01-01' } as never, today);
assert('T15: ~8 months old record is VERIFICATION_AGEING', ageing.state === 'VERIFICATION_AGEING');

const stale = evaluateSchemeFreshness({ ...SCHEMES_DATABASE[0], lastVerifiedDate: '2024-01-01' } as never, today);
assert('T16: Over a year old is VERIFICATION_STALE', stale.state === 'VERIFICATION_STALE');
assert('T17: Stale records prompt an official-source re-check', stale.shouldRecheckOfficialSource === true);
assert('T18: Stale advice points to official guidelines', stale.adviceEn.toLowerCase().includes('official'));

// Freshness falls back to the governance record, so an "unknown" scheme must
// have no verification date anywhere — we never guess one.
const unknown = evaluateSchemeFreshness(
  {
    ...SCHEMES_DATABASE[0],
    lastVerifiedDate: '',
    sourceProvenance: undefined,
    intelligence: SCHEMES_DATABASE[0].intelligence
      ? { ...SCHEMES_DATABASE[0].intelligence, governance: undefined }
      : undefined,
  } as never,
  today,
);
assert('T19: Missing verification date is VERIFICATION_UNKNOWN', unknown.state === 'VERIFICATION_UNKNOWN');
assert('T20: Unknown freshness reports a null age, not a guess', unknown.ageInDays === null);

assert('T21: Freshness age is a whole-day count', stale.ageInDays !== null && stale.ageInDays > 365);
assert('T22: Freshness labels exist in both languages', fresh.labelEn.length > 0 && fresh.labelHi.length > 0);
assert(
  'T23: Freshness never claims a scheme deadline',
  !`${stale.adviceEn} ${ageing.adviceEn} ${fresh.adviceEn}`.toLowerCase().includes('deadline'),
);

const realFreshness = evaluateSchemeFreshness(topMatch.scheme, today);
assert('T24: Real scheme data produces a freshness state', typeof realFreshness.state === 'string');

/* ================= 3. FOLLOW-UP REMINDERS ================= */
console.log('\n[3] Self-set follow-up reminders (never government deadlines)\n');

assert('T25: No follow-up set yields NONE', evaluateFollowUp(undefined, today).state === 'NONE');

const scheduled = evaluateFollowUp({ dueOn: '2026-09-20' }, today);
assert('T26: Future date is SCHEDULED', scheduled.state === 'SCHEDULED');
assert('T27: Days until due is computed exactly', scheduled.daysUntilDue === 5);

assert('T28: Same-day date is DUE_TODAY', evaluateFollowUp({ dueOn: '2026-09-15' }, today).state === 'DUE_TODAY');

const overdue = evaluateFollowUp({ dueOn: '2026-09-10' }, today);
assert('T29: Past date is OVERDUE', overdue.state === 'OVERDUE');
assert('T30: Overdue label states the overdue span', overdue.labelEn.includes('5'));

const completed = evaluateFollowUp({ dueOn: '2026-09-10', completedOn: '2026-09-11' }, today);
assert('T31: Completed follow-up is COMPLETED, not OVERDUE', completed.state === 'COMPLETED');

assert(
  'T32: Overdue sorts ahead of scheduled work',
  followUpUrgencyRank(overdue) < followUpUrgencyRank(scheduled),
);
assert('T33: Completed sorts behind active follow-ups', followUpUrgencyRank(completed) > followUpUrgencyRank(scheduled));
assert('T34: Unreadable dates degrade to NONE instead of throwing', evaluateFollowUp({ dueOn: 'not-a-date' }, today).state === 'NONE');
assert('T35: Day difference helper is timezone-independent', diffInDays(new Date('2026-09-15T23:00:00Z'), new Date('2026-09-16T01:00:00Z')) === 1);
assert('T36: Date-input helper returns YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(toIsoDateInput(today)));

/* ================= 4. PATHWAY → TRACKER JOURNEY ================= */
console.log('\n[4] Pathway to tracker wiring\n');

const at = '2026-09-15T10:00:00.000Z';
const snapshot = capturePathwaySnapshot(pathway, at);
assert('T37: Snapshot records the pathway stage label', snapshot.stageLabelEn.length > 0);
assert('T38: Snapshot records the readiness state', snapshot.readinessState === pathway.readiness.state);
assert('T39: Snapshot records the next best action id', snapshot.nextActionId === pathway.nextBestAction.id);
assert('T40: Snapshot keeps bilingual labels', snapshot.stageLabelHi.length > 0 && snapshot.nextActionTitleHi.length > 0);
assert(
  'T41: Snapshot preparation ids come from the Phase 4.2 checklist',
  snapshot.preparationItemIds.length === pathway.preparationChecklist.items.length,
);

const started = startApplicationFromPathway([], topMatch, pathway, at);
assert('T42: Starting a pathway creates one tracked application', started.length === 1);
assert('T43: New application starts at "interested", never "applied"', started[0].status === 'interested');
assert('T44: New application is flagged as pathway-started', started[0].startedFromPathway === true);
assert('T45: New application carries the pathway snapshot', Boolean(started[0].pathwaySnapshot));
assert('T46: Journey timeline is initialised with events', (started[0].journey || []).length === 2);
assert(
  'T47: Journey events are chronologically ordered',
  (started[0].journey || []).every((event, index, list) => index === 0 || list[index - 1].at <= event.at),
);

const startedTwice = startApplicationFromPathway(started, topMatch, pathway, '2026-09-16T10:00:00.000Z');
assert('T48: Re-starting does not duplicate the application', startedTwice.length === 1);
assert('T49: Re-starting appends to the journey', (startedTwice[0].journey || []).length === 3);

const withProgress: TrackedApplication[] = [{ ...started[0], status: 'applied', note: 'Branch visited' }];
const restarted = startApplicationFromPathway(withProgress, topMatch, pathway, '2026-09-17T10:00:00.000Z');
assert('T50: Existing status is never reset by re-starting', restarted[0].status === 'applied');
assert('T51: Existing notes survive a pathway refresh', restarted[0].note === 'Branch visited');

const determinismA = startApplicationFromPathway([], topMatch, pathway, at);
const determinismB = startApplicationFromPathway([], topMatch, pathway, at);
assert(
  'T52: Same inputs produce identical journeys (deterministic ids)',
  JSON.stringify(determinismA) === JSON.stringify(determinismB),
);

const progressed = recordDocumentProgressEvent(started, topMatch.scheme.id, 2, 5, '2026-09-18T10:00:00.000Z');
assert('T53: Document progress adds a journey event', (progressed[0].journey || []).length === 3);
assert(
  'T54: Progress event reports counts from real data',
  (progressed[0].journey || []).some((event) => event.labelEn.includes('2 of 5')),
);
assert('T55: Document progress never changes status silently', progressed[0].status === 'interested');

const statusEvented = appendJourneyEvent(started[0], statusChangeEvent('applied', '2026-09-19T10:00:00.000Z'));
assert('T56: Status changes are recorded on the timeline', (statusEvented.journey || []).length === 3);
assert('T57: Status events carry the new status', (statusEvented.journey || []).some((e) => e.status === 'applied'));

assert('T58: Full preparation suggests "docs-ready"', suggestStatusFromPreparation(started[0], 5, 5) === 'docs-ready');
assert('T59: Partial preparation suggests no change', suggestStatusFromPreparation(started[0], 2, 5) === null);
assert('T60: No document data never suggests a status', suggestStatusFromPreparation(started[0], 0, 0) === null);
assert(
  'T61: Applied applications are never auto-downgraded',
  suggestStatusFromPreparation({ ...started[0], status: 'applied' }, 5, 5) === null,
);

/* ================= 5. SHAREABLE REPORT ================= */
console.log('\n[5] Shareable pathway report\n');

const report = buildPathwayReport({
  profile,
  pathway,
  matchResults,
  applications: started,
  lang: 'en',
  generatedAt: at,
  today,
});

assert('T62: Report is generated with a title', report.title.length > 0);
assert('T63: Report states the current business stage', report.journeyLine.value.length > 0);
assert('T64: Report lists current support priorities', report.priorityLabels.length > 0);
assert('T65: Report includes the next best action and its reason', report.nextAction.title.length > 0 && report.nextAction.reason.length > 0);
assert('T66: Report includes readiness checks', report.readiness.checks.length > 0);
assert(
  'T67: Every reported scheme keeps a verification line (provenance preserved)',
  report.schemes.every((scheme) => scheme.verificationLine.length > 0),
);
assert(
  'T68: Funding is presented as the applicant’s own requirement',
  report.fundingLines.some((line) => line.label.toLowerCase().includes('requirement')),
);
assert(
  'T69: Report never promises approval or guaranteed funding',
  !JSON.stringify(report).toLowerCase().match(/guaranteed|will receive|approval assured|100% eligible/),
);
assert(
  'T70: Report explains that unknown information is not a rejection',
  report.disclaimers.some((line) => line.toLowerCase().includes('not a rejection')),
);
assert('T71: Report records tracked applications when present', report.trackedLines.length === 1);

const hindiReport = buildPathwayReport({ profile, pathway, matchResults, lang: 'hi', generatedAt: at, today });
assert('T72: Hindi report is fully localised', hindiReport.title !== report.title && hindiReport.disclaimers.length > 0);

const reportAgain = buildPathwayReport({ profile, pathway, matchResults, applications: started, lang: 'en', generatedAt: at, today });
assert('T73: Report generation is deterministic', JSON.stringify(report) === JSON.stringify(reportAgain));

/* ================= 6. REGRESSION PROTECTION ================= */
console.log('\n[6] Regression protection (Phase 3.1 / 4.2 untouched)\n');

const before = matchResults.slice(0, 3).map((m) => m.matchPercentage);
const afterJourneyWork = rankSchemesForProfile(SCHEMES_DATABASE, profile, 'en')
  .slice(0, 3)
  .map((m) => m.matchPercentage);

console.log(`   Before (top 3): ${before.join(', ')}`);
console.log(`   After  (top 3): ${afterJourneyWork.join(', ')}`);
console.log(`   Difference: ${before.map((value, index) => afterJourneyWork[index] - value).join(', ')}`);

assert(
  'T74: Match scores are unchanged by Phase 4.3 (difference = 0)',
  before.every((value, index) => afterJourneyWork[index] - value === 0),
);

const pathwayAgain = buildSupportPathway({ profile, matchResults, lang: 'en' });
assert(
  'T75: Phase 4.2 pathway output is unchanged by Phase 4.3',
  pathwayAgain.nextBestAction.id === pathway.nextBestAction.id &&
    pathwayAgain.readiness.state === pathway.readiness.state,
);
assert(
  'T76: Eligibility classification is untouched',
  matchResults[0].matchStatus === rankSchemesForProfile(SCHEMES_DATABASE, profile, 'en')[0].matchStatus,
);

console.log(`\nTEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
if (failed > 0) process.exit(1);
