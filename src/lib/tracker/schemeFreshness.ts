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
} from '../../types/tracker';

/** Verification older than this is "ageing". */
export const FRESHNESS_AGEING_DAYS = 180;
/** Verification older than this should be re-checked at the official source. */
export const FRESHNESS_STALE_DAYS = 365;

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

const FRESHNESS_COPY: Record<
  SchemeFreshnessState,
  { labelEn: string; labelHi: string; adviceEn: string; adviceHi: string }
> = {
  RECENTLY_VERIFIED: {
    labelEn: 'Recently verified',
    labelHi: 'हाल ही में सत्यापित',
    adviceEn: 'This scheme record was verified recently against its official source.',
    adviceHi: 'यह योजना विवरण हाल ही में इसके आधिकारिक स्रोत से सत्यापित किया गया था।',
  },
  VERIFICATION_AGEING: {
    labelEn: 'Verification ageing',
    labelHi: 'सत्यापन पुराना हो रहा है',
    adviceEn:
      'Details were last verified some months ago. Confirm current terms on the official portal before applying.',
    adviceHi:
      'विवरण कुछ माह पहले सत्यापित हुआ था। आवेदन से पहले आधिकारिक पोर्टल पर वर्तमान शर्तें जाँच लें।',
  },
  VERIFICATION_STALE: {
    labelEn: 'Re-check official source',
    labelHi: 'आधिकारिक स्रोत पुनः जाँचें',
    adviceEn:
      'Verification is more than a year old. Check the official scheme guidelines for the latest position.',
    adviceHi:
      'सत्यापन एक वर्ष से अधिक पुराना है। नवीनतम स्थिति हेतु आधिकारिक योजना दिशानिर्देश देखें।',
  },
  VERIFICATION_UNKNOWN: {
    labelEn: 'Verification date unavailable',
    labelHi: 'सत्यापन तिथि अनुपलब्ध',
    adviceEn:
      'No verification date is recorded for this scheme. Check the official scheme guidelines.',
    adviceHi:
      'इस योजना हेतु सत्यापन तिथि दर्ज नहीं है। आधिकारिक योजना दिशानिर्देश देखें।',
  },
  MARKED_INACTIVE: {
    labelEn: 'Marked inactive in our records',
    labelHi: 'हमारे रिकॉर्ड में निष्क्रिय',
    adviceEn:
      'Our records mark this scheme inactive. Confirm its current status on the official portal.',
    adviceHi:
      'हमारे रिकॉर्ड इस योजना को निष्क्रिय दर्शाते हैं। आधिकारिक पोर्टल पर वर्तमान स्थिति की पुष्टि करें।',
  },
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
    ...FRESHNESS_COPY[state],
    shouldRecheckOfficialSource:
      state === 'VERIFICATION_STALE' ||
      state === 'VERIFICATION_UNKNOWN' ||
      state === 'MARKED_INACTIVE',
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
