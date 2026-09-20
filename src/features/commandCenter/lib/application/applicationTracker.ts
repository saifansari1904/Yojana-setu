/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationRecord, ApplicationStatus } from '../../types';

/**
 * Creates or updates an application record.
 */

/**
 * Records the event of opening an official portal.
 * CRITICAL RULE: Opening the portal does NOT mean the application was submitted!
 */

/**
 * Confirms that the user has completed their statutory submission on the official portal.
 */

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
