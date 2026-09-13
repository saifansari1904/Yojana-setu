import { Scheme, UserProfile } from '../../types';

export type DocumentItemState = 'REQUIRED' | 'PROVIDED' | 'NOT_PROVIDED' | 'UNKNOWN';

export interface DocumentReadinessItem {
  id: string;
  name: string;
  state: DocumentItemState;
  isMandatory: boolean;
  notes?: string;
}

export interface DocumentReadinessAnalysis {
  totalRequired: number;
  preparedCount: number;
  missingCount: number;
  unknownCount: number;
  readinessPercentage: number;
  items: DocumentReadinessItem[];
  statusMessage: string;
}

/**
 * Evaluates document readiness for a given scheme and user profile.
 * Strictly adheres to rule: Never mark a document as PROVIDED unless the user
 * has explicitly marked/confirmed it.
 */
export function evaluateDocumentReadiness(
  scheme: Scheme,
  profile: UserProfile,
  preparedDocIds: string[] | Set<string> = new Set(),
  lang: 'hi' | 'en' = 'en'
): DocumentReadinessAnalysis {
  const isHi = lang === 'hi';
  const preparedSet = preparedDocIds instanceof Set ? preparedDocIds : new Set(preparedDocIds);

  const docs = scheme.requiredDocuments || [];
  const totalRequired = docs.length;

  if (totalRequired === 0) {
    return {
      totalRequired: 0,
      preparedCount: 0,
      missingCount: 0,
      unknownCount: 0,
      readinessPercentage: 100,
      items: [],
      statusMessage: isHi
        ? 'इस योजना हेतु किसी पूर्व-आवश्यक वैधानिक दस्तावेज की सूची निर्दिष्ट नहीं है।'
        : 'No pre-requisite statutory documents specified for this scheme.',
    };
  }

  const items: DocumentReadinessItem[] = docs.map((docName, index) => {
    const docId = `doc-${scheme.id}-${index}`;
    const isProvided = preparedSet.has(docId) || preparedSet.has(docName);

    // Profile confirmation heuristic only for official registration when registered
    let state: DocumentItemState = isProvided ? 'PROVIDED' : 'NOT_PROVIDED';

    return {
      id: docId,
      name: docName,
      state,
      isMandatory: true,
      notes: isProvided
        ? (isHi ? 'तैयार' : 'Prepared / Available')
        : (isHi ? 'तैयारी आवश्यक' : 'To be prepared'),
    };
  });

  const preparedCount = items.filter((i) => i.state === 'PROVIDED').length;
  const missingCount = items.filter((i) => i.state === 'NOT_PROVIDED').length;
  const unknownCount = items.filter((i) => i.state === 'UNKNOWN').length;

  const readinessPercentage = Math.round((preparedCount / totalRequired) * 100);

  let statusMessage = '';
  if (preparedCount === totalRequired) {
    statusMessage = isHi
      ? `सभी ${totalRequired} आवश्यक दस्तावेज तैयार हैं। आप आवेदन हेतु तैयार हैं!`
      : `All ${totalRequired} required documents are ready. You are prepared to apply!`;
  } else if (preparedCount > 0) {
    statusMessage = isHi
      ? `${totalRequired} में से ${preparedCount} दस्तावेज तैयार हैं (${missingCount} शेष)।`
      : `${preparedCount} of ${totalRequired} documents prepared (${missingCount} pending).`;
  } else {
    statusMessage = isHi
      ? `कुल ${totalRequired} दस्तावेज आवश्यक हैं। आवेदन से पूर्व इन्हें तैयार करें।`
      : `${totalRequired} statutory documents required. Prepare these before submitting.`;
  }

  return {
    totalRequired,
    preparedCount,
    missingCount,
    unknownCount,
    readinessPercentage,
    items,
    statusMessage,
  };
}
