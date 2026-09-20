/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentStatus, Scheme, UserDocumentState } from '../../types';

interface AggregatedDocumentItem {
  id: string;
  name: string;
  nameHi: string;
  type: 'REUSABLE' | 'SCHEME_SPECIFIC';
  schemeCode?: string;
  status: DocumentStatus;
  isMandatory: boolean;
}

interface DocumentSummaryResult {
  prepared: number;
  needPreparation: number;
  unknown: number;
  notRequired: number;
  total: number;
  reusable: AggregatedDocumentItem[];
  applicationSpecific: AggregatedDocumentItem[];
}

/**
 * Aggregates document readiness across relevant schemes and the user's document status registry.
 * STRICT PRIVACY: Only handles status strings. Never collects or stores sensitive identifiers (Aadhaar, PAN, credentials, OTP).
 */
export function calculateDocumentReadiness(
  schemes: Scheme[],
  userDocs: Record<string, UserDocumentState>
): DocumentSummaryResult {
  const reusableMap = new Map<string, AggregatedDocumentItem>();
  const specificList: AggregatedDocumentItem[] = [];

  let prepared = 0;
  let needPreparation = 0;
  let unknown = 0;
  let notRequired = 0;

  schemes.forEach(scheme => {
    scheme.requiredDocuments.forEach(doc => {
      const userState = userDocs[doc.id];
      const status: DocumentStatus = userState ? userState.status : 'NEED_PREPARATION';

      if (doc.type === 'REUSABLE') {
        if (!reusableMap.has(doc.id)) {
          reusableMap.set(doc.id, {
            id: doc.id,
            name: doc.name,
            nameHi: doc.nameHi,
            type: 'REUSABLE',
            status,
            isMandatory: doc.isMandatory,
          });
        }
      } else {
        // Application-specific
        specificList.push({
          id: `${scheme.id}_${doc.id}`,
          name: doc.name,
          nameHi: doc.nameHi,
          type: 'SCHEME_SPECIFIC',
          schemeCode: scheme.code,
          status,
          isMandatory: doc.isMandatory,
        });
      }
    });
  });

  const reusableList = Array.from(reusableMap.values());
  const allDocs = [...reusableList, ...specificList];

  allDocs.forEach(item => {
    switch (item.status) {
      case 'PREPARED':
        prepared++;
        break;
      case 'NEED_PREPARATION':
        needPreparation++;
        break;
      case 'UNKNOWN':
        unknown++;
        break;
      case 'NOT_REQUIRED':
        notRequired++;
        break;
    }
  });

  return {
    prepared,
    needPreparation,
    unknown,
    notRequired,
    total: allDocs.length,
    reusable: reusableList,
    applicationSpecific: specificList,
  };
}

/**
 * Calculates document readiness for a specific scheme.
 */
export function getSchemeDocumentReadiness(
  scheme: Scheme,
  userDocs: Record<string, UserDocumentState>
) {
  let prepared = 0;
  let needsPreparation = 0;
  let unknown = 0;

  scheme.requiredDocuments.forEach(doc => {
    const key = doc.type === 'REUSABLE' ? doc.id : `${scheme.id}_${doc.id}`;
    const state = userDocs[key] || userDocs[doc.id];
    const status: DocumentStatus = state ? state.status : 'NEED_PREPARATION';

    if (status === 'PREPARED') {
      prepared++;
    } else if (status === 'UNKNOWN') {
      unknown++;
    } else {
      needsPreparation++;
    }
  });

  return {
    total: scheme.requiredDocuments.length,
    prepared,
    needsPreparation,
    unknown,
    isAllPrepared: prepared === scheme.requiredDocuments.length && scheme.requiredDocuments.length > 0,
  };
}
