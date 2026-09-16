/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessStage, Scheme, SupportCategory } from '../../types';

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  'Funding',
  'Registration',
  'Skill Development',
  'Infrastructure',
  'Market Access',
];

export const STAGE_TO_PRIMARY_SUPPORT: Record<BusinessStage, SupportCategory[]> = {
  IDEA: ['Skill Development', 'Registration'],
  REGISTRATION: ['Registration', 'Funding'],
  FUNDING: ['Funding', 'Infrastructure'],
  MARKET_ACCESS: ['Market Access', 'Skill Development'],
  EXPANSION: ['Funding', 'Infrastructure', 'Market Access'],
};

/**
 * Calculates aggregate count of schemes in the user's matched list that provide support in each category.
 */
export function getSupportStackCounts(schemes: Scheme[]): Record<SupportCategory, number> {
  const counts: Record<SupportCategory, number> = {
    'Funding': 0,
    'Registration': 0,
    'Skill Development': 0,
    'Infrastructure': 0,
    'Market Access': 0,
  };

  schemes.forEach(scheme => {
    scheme.supportCategories.forEach(cat => {
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
  });

  return counts;
}

/**
 * Filters schemes relevant to a specific support category.
 */
export function getSchemesBySupportCategory(schemes: Scheme[], category: SupportCategory): Scheme[] {
  return schemes.filter(s => s.supportCategories.includes(category));
}
