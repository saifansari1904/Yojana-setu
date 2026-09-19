import type {
  ApplicationStatus,
  FollowUpReminder,
  TrackedApplication,
} from '../../types/tracker';
import type { Language } from '../../i18n/types';
import {
  loadDocumentProgress,
  summariseDocumentProgress,
} from './documentProgress';

const STORAGE_KEY = 'yojana_setu_applications_v1';

/** Pipeline order. Also used to decide what "advance" means. */
export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'interested',
  'docs-ready',
  'applied',
  'approved',
];

export interface StatusMeta {
  status: ApplicationStatus;
  label: string;
  description: string;
  /** Tailwind classes for the status pill. */
  pillClass: string;
  dotClass: string;
}

import { STATUS_COPY } from '../../i18n/trackerI18n';



export const getStatusMeta = (status: ApplicationStatus, lang: string): StatusMeta => {
  const language: Language = (lang in STATUS_COPY.interested) ? (lang as Language) : 'en';
  const copy = STATUS_COPY[status]?.[language] || STATUS_COPY[status]?.en || STATUS_COPY.interested.en;

  switch (status) {
    case 'docs-ready':
      return {
        status,
        label: copy.label,
        description: copy.description,
        pillClass:
          'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border-[#C1E2D0] dark:border-[#22503E]',
        dotClass: 'bg-[#16A34A]',
      };
    case 'applied':
      return {
        status,
        label: copy.label,
        description: copy.description,
        pillClass:
          'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/70',
        dotClass: 'bg-blue-500',
      };
    case 'approved':
      return {
        status,
        label: copy.label,
        description: copy.description,
        pillClass:
          'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900',
        dotClass: 'bg-emerald-600',
      };
    case 'rejected':
      return {
        status,
        label: copy.label,
        description: copy.description,
        pillClass:
          'bg-[#FFDAD6]/60 dark:bg-[#3D1A14]/60 text-[#7C2C0F] dark:text-[#F87171] border-[#FFCCBD] dark:border-[#5A2B20]',
        dotClass: 'bg-[#C2603F]',
      };
    case 'interested':
    default:
      return {
        status: 'interested',
        label: copy.label,
        description: copy.description,
        pillClass:
          'bg-[#F3F4F3] dark:bg-[#1E2723] text-[#3F4943] dark:text-[#9EB0A7] border-[#E2E2E0] dark:border-[#2A3C34]',
        dotClass: 'bg-[#6F7A73]',
      };
  }
};

/** Terminal states never appear as an "advance" target. */
export const getNextStatus = (status: ApplicationStatus): ApplicationStatus | null => {
  const idx = APPLICATION_STATUS_ORDER.indexOf(status);
  if (idx === -1 || idx === APPLICATION_STATUS_ORDER.length - 1) return null;
  return APPLICATION_STATUS_ORDER[idx + 1];
};

const isValidStatus = (value: unknown): value is ApplicationStatus =>
  value === 'interested' ||
  value === 'docs-ready' ||
  value === 'applied' ||
  value === 'approved' ||
  value === 'rejected';

/**
 * Reads tracked applications from localStorage, discarding anything malformed
 * rather than throwing — a corrupt entry must never break the screen.
 */
export const loadTrackedApplications = (): TrackedApplication[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is TrackedApplication =>
        !!item &&
        typeof item === 'object' &&
        typeof item.schemeId === 'string' &&
        isValidStatus(item.status),
    );
  } catch {
    return [];
  }
};

export const saveTrackedApplications = (applications: TrackedApplication[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  } catch {
    // Storage full or blocked — tracker stays in-memory for this session.
  }
};

export const createTrackedApplication = (
  schemeId: string,
  schemeName: string,
): TrackedApplication => {
  const now = new Date().toISOString();
  return {
    schemeId,
    schemeName,
    status: 'interested',
    createdAt: now,
    updatedAt: now,
  };
};

export const upsertTrackedApplication = (
  applications: TrackedApplication[],
  entry: TrackedApplication,
): TrackedApplication[] => {
  const exists = applications.some((a) => a.schemeId === entry.schemeId);
  if (!exists) return [...applications, entry];
  return applications.map((a) => (a.schemeId === entry.schemeId ? entry : a));
};

export const patchTrackedApplication = (
  applications: TrackedApplication[],
  schemeId: string,
  patch: Partial<Omit<TrackedApplication, 'schemeId' | 'createdAt'>>,
): TrackedApplication[] =>
  applications.map((a) =>
    a.schemeId === schemeId
      ? { ...a, ...patch, updatedAt: new Date().toISOString() }
      : a,
  );

export const removeTrackedApplication = (
  applications: TrackedApplication[],
  schemeId: string,
): TrackedApplication[] => applications.filter((a) => a.schemeId !== schemeId);

/**
 * Document readiness for a scheme.
 *
 * PHASE 4.3: reads the unified localStorage document-progress store instead of
 * the old per-scheme sessionStorage keys, so tracker and scheme detail can no
 * longer disagree about what the citizen has prepared.
 */
export const getDocReadiness = (
  schemeId: string,
  totalDocuments: number,
): { ready: number; total: number; allReady: boolean } => {
  const total = totalDocuments;
  if (typeof window === 'undefined' || total === 0) {
    return { ready: 0, total, allReady: false };
  }

  const summary = summariseDocumentProgress(loadDocumentProgress(), schemeId, total);
  return { ready: summary.ready, total: summary.total, allReady: summary.allReady };
};

/* ===================== PHASE 4.3 — FOLLOW-UP REMINDERS ===================== */

/**
 * Sets or clears the citizen's own follow-up date.
 * This is never a government deadline — the dataset carries no verified
 * application windows, so none is ever generated.
 */
export const setFollowUpReminder = (
  applications: TrackedApplication[],
  schemeId: string,
  followUp: FollowUpReminder | null,
): TrackedApplication[] =>
  applications.map((application) => {
    if (application.schemeId !== schemeId) return application;
    const next = { ...application, updatedAt: new Date().toISOString() };
    if (!followUp) {
      delete next.followUp;
      return next;
    }
    return { ...next, followUp };
  });

export const completeFollowUpReminder = (
  applications: TrackedApplication[],
  schemeId: string,
  completedOn: string = new Date().toISOString().slice(0, 10),
): TrackedApplication[] =>
  applications.map((application) =>
    application.schemeId === schemeId && application.followUp
      ? {
          ...application,
          followUp: { ...application.followUp, completedOn },
          updatedAt: new Date().toISOString(),
        }
      : application,
  );

/** Pipeline counts for the tracker header. */
export const summariseByStatus = (
  applications: TrackedApplication[],
): Record<ApplicationStatus, number> => {
  const summary: Record<ApplicationStatus, number> = {
    interested: 0,
    'docs-ready': 0,
    applied: 0,
    approved: 0,
    rejected: 0,
  };
  applications.forEach((a) => {
    summary[a.status] += 1;
  });
  return summary;
};
