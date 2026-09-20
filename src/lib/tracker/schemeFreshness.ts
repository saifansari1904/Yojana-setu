/**
 * PHASE 4.3 — DATA FRESHNESS & FOLLOW-UP ENGINE
 *
 * IMPORTANT: the scheme dataset carries no verified application windows,
 * closing dates or renewal cycles. Therefore this module NEVER produces a
 * government deadline. It only reports:
 *   1. how old the scheme's own verification record is (`lastVerifiedDate`)
 *   2. whether the citizen's self-set follow-up date is due
 *
 * Everything is deterministic: pass `today` to get a stable result.
 */

import type { Scheme } from '../../types/scheme';
import type {
  FollowUpReminder,
  FollowUpStatus,
  SchemeFreshness,
  SchemeFreshnessState,
  PathwaySnapshot,
  JourneyEvent,
} from '../../types/tracker';
import type { Language } from '../../i18n/types';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';
import { FRESHNESS_COPY, FOLLOW_UP_COPY } from '../../i18n/freshnessI18n';

/** Verification older than this is "ageing". */
const FRESHNESS_AGEING_DAYS = 180;
/** Verification older than this should be re-checked at the official source. */
const FRESHNESS_STALE_DAYS = 365;

const MS_PER_DAY = 86400000;

const parseIsoDate = (value?: string): Date | null => {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfUtcDay = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** Whole-day difference (b - a), timezone-independent. */
export const diffInDays = (a: Date, b: Date): number =>
  Math.round((startOfUtcDay(b) - startOfUtcDay(a)) / MS_PER_DAY);



export const getLocalizedFreshness = (
  freshness: SchemeFreshness,
  lang: Language = 'en',
): { label: string; advice: string } => {
  const copy = FRESHNESS_COPY[freshness.state];
  if (copy && copy[lang]) return copy[lang];
  return {
    label: resolveLocalizedPair(freshness.labelEn, freshness.labelHi, lang),
    advice: resolveLocalizedPair(freshness.adviceEn, freshness.adviceHi, lang),
  };
};

/**
 * Freshness of a scheme's verification record.
 * Uses only `lastVerifiedDate`, governance `isActive` and `verificationStatus`.
 */
export const evaluateSchemeFreshness = (
  scheme: Scheme,
  today: Date = new Date(),
): SchemeFreshness => {
  const governance = scheme.intelligence?.governance;
  const lastVerifiedDate = scheme.lastVerifiedDate || governance?.lastVerifiedDate;
  const verificationStatus =
    governance?.verificationStatus || scheme.sourceProvenance?.verificationStatus;

  const verifiedAt = parseIsoDate(lastVerifiedDate);
  const ageInDays = verifiedAt ? diffInDays(verifiedAt, today) : null;

  let state: SchemeFreshnessState;
  if (governance && governance.isActive === false) {
    state = 'MARKED_INACTIVE';
  } else if (ageInDays === null) {
    state = 'VERIFICATION_UNKNOWN';
  } else if (ageInDays >= FRESHNESS_STALE_DAYS) {
    state = 'VERIFICATION_STALE';
  } else if (ageInDays >= FRESHNESS_AGEING_DAYS) {
    state = 'VERIFICATION_AGEING';
  } else {
    state = 'RECENTLY_VERIFIED';
  }

  return {
    state,
    ageInDays,
    lastVerifiedDate,
    verificationStatus: verificationStatus ? String(verificationStatus) : undefined,
    labelEn: FRESHNESS_COPY[state].en.label,
    labelHi: FRESHNESS_COPY[state].hi.label,
    adviceEn: FRESHNESS_COPY[state].en.advice,
    adviceHi: FRESHNESS_COPY[state].hi.advice,
    shouldRecheckOfficialSource:
      state === 'VERIFICATION_STALE' ||
      state === 'VERIFICATION_UNKNOWN' ||
      state === 'MARKED_INACTIVE',
  };
};

export const getLocalizedFollowUp = (
  status: FollowUpStatus,
  lang: Language = 'en',
): string => {
  if (status.state === 'NONE') {
    return FOLLOW_UP_COPY.NONE[lang] || FOLLOW_UP_COPY.NONE.en;
  }
  if (status.state === 'COMPLETED') {
    return FOLLOW_UP_COPY.COMPLETED[lang] || FOLLOW_UP_COPY.COMPLETED.en;
  }
  if (status.state === 'DUE_TODAY') {
    return FOLLOW_UP_COPY.DUE_TODAY[lang] || FOLLOW_UP_COPY.DUE_TODAY.en;
  }
  if (status.state === 'OVERDUE') {
    const overdueBy = status.daysUntilDue !== null ? Math.abs(status.daysUntilDue) : 0;
    const phrases: Record<Language, string> = {
      en: `Follow-up overdue by ${overdueBy} day${overdueBy === 1 ? '' : 's'}`,
      hi: `अनुसरण ${overdueBy} दिन विलंबित`,
      ta: `பின்தொடர்தல் ${overdueBy} நாள் தாமதம்`,
      te: `ఫాలో-అప్ ${overdueBy} రోజు ఆలస్యం`,
      kn: `ಫಾಲೋ-ಅಪ್ ${overdueBy} ದಿನ ವಿಳಂಬವಾಗಿದೆ`,
      ml: `ഫോളോ-അപ്പ് ${overdueBy} ദിവസം വൈകി`,
    };
    return phrases[lang] || phrases.en;
  }
  if (status.state === 'SCHEDULED') {
    const days = status.daysUntilDue ?? 0;
    const phrases: Record<Language, string> = {
      en: `Follow-up in ${days} day${days === 1 ? '' : 's'}`,
      hi: `अनुसरण ${days} दिन में`,
      ta: `பின்தொடர்தல் ${days} நாளில்`,
      te: `ఫాలో-అప్ ${days} రోజులలో`,
      kn: `ಫಾಲೋ-ಅಪ್ ${days} ದಿನಗಳಲ್ಲಿ`,
      ml: `ഫോളോ-അപ്പ് ${days} ദിവസത്തിൽ`,
    };
    return phrases[lang] || phrases.en;
  }
  return resolveLocalizedPair(status.labelEn, status.labelHi, lang);
};

export const getLocalizedJourneyEvent = (
  event: JourneyEvent,
  lang: Language = 'en',
): string => {
  return resolveLocalizedPair(event.labelEn, event.labelHi, lang);
};

export const getLocalizedPathwaySnapshot = (
  snapshot: PathwaySnapshot,
  lang: Language = 'en',
): { stageLabel: string; readinessLabel: string } => {
  return {
    stageLabel: resolveLocalizedPair(snapshot.stageLabelEn, snapshot.stageLabelHi, lang),
    readinessLabel: resolveLocalizedPair(snapshot.readinessLabelEn, snapshot.readinessLabelHi, lang),
  };
};

/**
 * Status of a citizen's self-set follow-up date.
 * Never describes itself as a government deadline.
 */
export const evaluateFollowUp = (
  followUp: FollowUpReminder | undefined,
  today: Date = new Date(),
): FollowUpStatus => {
  if (!followUp || !followUp.dueOn) {
    return {
      state: 'NONE',
      daysUntilDue: null,
      labelEn: 'No follow-up set',
      labelHi: 'कोई अनुसरण निर्धारित नहीं',
    };
  }

  const due = parseIsoDate(followUp.dueOn);
  if (!due) {
    return {
      state: 'NONE',
      dueOn: followUp.dueOn,
      daysUntilDue: null,
      labelEn: 'Follow-up date not readable',
      labelHi: 'अनुसरण तिथि पढ़ी नहीं जा सकी',
    };
  }

  const daysUntilDue = diffInDays(today, due);

  if (followUp.completedOn) {
    return {
      state: 'COMPLETED',
      dueOn: followUp.dueOn,
      daysUntilDue,
      labelEn: 'Follow-up done',
      labelHi: 'अनुसरण पूर्ण',
    };
  }

  if (daysUntilDue < 0) {
    const overdueBy = Math.abs(daysUntilDue);
    return {
      state: 'OVERDUE',
      dueOn: followUp.dueOn,
      daysUntilDue,
      labelEn: `Follow-up overdue by ${overdueBy} day${overdueBy === 1 ? '' : 's'}`,
      labelHi: `अनुसरण ${overdueBy} दिन विलंबित`,
    };
  }

  if (daysUntilDue === 0) {
    return {
      state: 'DUE_TODAY',
      dueOn: followUp.dueOn,
      daysUntilDue,
      labelEn: 'Follow-up due today',
      labelHi: 'अनुसरण आज नियत',
    };
  }

  return {
    state: 'SCHEDULED',
    dueOn: followUp.dueOn,
    daysUntilDue,
    labelEn: `Follow-up in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
    labelHi: `अनुसरण ${daysUntilDue} दिन में`,
  };
};

/** Sort key so overdue work surfaces first in the tracker. */
export const followUpUrgencyRank = (status: FollowUpStatus): number => {
  switch (status.state) {
    case 'OVERDUE':
      return 0;
    case 'DUE_TODAY':
      return 1;
    case 'SCHEDULED':
      return 2;
    case 'COMPLETED':
      return 3;
    default:
      return 4;
  }
};

/** Convenience helper for date inputs: today's date as YYYY-MM-DD. */
export const toIsoDateInput = (date: Date = new Date()): string =>
  new Date(startOfUtcDay(date)).toISOString().slice(0, 10);
