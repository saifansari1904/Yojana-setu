/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationRecord, ApplicationStatus } from '../../types';

/**
 * Creates or updates an application record.
 */
export function createApplicationRecord(schemeId: string, status: ApplicationStatus = 'interested'): ApplicationRecord {
  return {
    id: `app_${schemeId}_${Date.now()}`,
    schemeId,
    status,
    submissionConfirmed: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Records the event of opening an official portal.
 * CRITICAL RULE: Opening the portal does NOT mean the application was submitted!
 */
export function recordPortalOpened(record: ApplicationRecord): ApplicationRecord {
  return {
    ...record,
    portalOpenedAt: new Date().toISOString(),
    // Status stays as is or moves to preparing; never automatically 'applied'
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Confirms that the user has completed their statutory submission on the official portal.
 */
export function confirmApplicationSubmitted(
  record: ApplicationRecord,
  acknowledgementNotes?: string
): ApplicationRecord {
  return {
    ...record,
    status: 'applied',
    submissionConfirmed: true,
    appliedDate: new Date().toISOString().split('T')[0],
    notes: acknowledgementNotes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Aggregates application records by tracker status.
 */
export function aggregateApplications(records: ApplicationRecord[]) {
  let readyToApply = 0;
  let preparing = 0;
  let applied = 0;
  let approved = 0;
  let interested = 0;

  records.forEach(r => {
    switch (r.status) {
      case 'docs-ready':
        readyToApply++;
        break;
      case 'preparing':
        preparing++;
        break;
      case 'applied':
        applied++;
        break;
      case 'approved':
        approved++;
        break;
      case 'interested':
        interested++;
        break;
    }
  });

  return {
    readyToApply,
    preparing,
    applied,
    approved,
    interested,
    total: records.length,
  };
}
