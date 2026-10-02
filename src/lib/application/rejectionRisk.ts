/**
 * Rejection Risk Assessment Engine
 *
 * Checks the citizen's document dossier against the common procedural
 * reasons scheme applications are returned or rejected (see
 * rejectionRiskData.ts), and reports which risks their prepared documents
 * already address and which are still open.
 *
 * This engine deliberately produces NO approval probability, success rate,
 * or statistical estimate of any kind. No official source publishes
 * verified per-scheme approval statistics, so Yojana Setu does not invent
 * any. Everything returned here is a fact about the citizen's own dossier
 * (documents prepared / uploaded) or qualitative preparation guidance.
 */

import type { Scheme } from '../../types/scheme';
import type { MatchResult } from '../../types/matching';
import type { UploadedFileRecord } from '../tracker/documentProgress';
import {
  getRejectionRiskFactorsForScheme,
  type RejectionRiskFactor,
} from '../../data/rejectionRiskData';

export type RiskCheckStatus = 'BLOCKED' | 'ALL_COVERED' | 'RISKS_OPEN';

export type DocumentCriticality = 'CRITICAL' | 'HIGH' | 'STANDARD';

export interface DocumentRiskStatus {
  docName: string;
  isPrepared: boolean;
  isUploaded: boolean;
  uploadedRecord?: UploadedFileRecord;
  criticality: DocumentCriticality;
  /** The rejection-risk factor this document helps address, if any. */
  relatedRiskFactor?: RejectionRiskFactor;
}

export interface RiskRecommendation {
  docName: string;
  reasonEn: string;
  reasonHi: string;
}

export interface RejectionRiskAssessment {
  status: RiskCheckStatus;
  statutoryBlockerPresent: boolean;
  blockerLabels: string[];
  totalDocumentsCount: number;
  preparedDocumentsCount: number;
  uploadedDocumentsCount: number;
  /** Share of this scheme's required documents the citizen has marked ready. A fact about their own dossier — not an approval estimate. */
  documentReadinessPercent: number;
  documents: DocumentRiskStatus[];
  riskFactors: RejectionRiskFactor[];
  mitigatedRisks: RejectionRiskFactor[];
  openRisks: RejectionRiskFactor[];
  topRecommendations: RiskRecommendation[];
}

/**
 * Classifies how central a document is to appraisal, used only to order
 * recommendations (most central first). The priority value is an internal
 * ordering heuristic — it is never shown to citizens as a statistic.
 */
function evaluateDocumentCriticality(
  docName: string,
  scheme: Scheme
): {
  criticality: DocumentCriticality;
  priority: number;
  matchedFactorKeywords: string[];
} {
  const lower = docName.toLowerCase();

  // 1. Detailed Project Report / Financial Feasibility
  if (
    lower.includes('dpr') ||
    lower.includes('project report') ||
    lower.includes('feasibility') ||
    lower.includes('balance sheet') ||
    lower.includes('cash flow')
  ) {
    return {
      criticality: 'CRITICAL',
      priority: 35,
      matchedFactorKeywords: ['dpr', 'project report', 'quotation', 'feasibility'],
    };
  }

  // 2. Caste / Category / Domicile (mandatory proofs for targeted subsidies)
  if (
    lower.includes('caste') ||
    lower.includes('community') ||
    lower.includes('domicile') ||
    lower.includes('nativity') ||
    lower.includes('tribe')
  ) {
    const isTargeted = scheme.isScStSpecific || scheme.isMinoritySpecific || (scheme.subsidyRatePercent && scheme.subsidyRatePercent > 20);
    return {
      criticality: isTargeted ? 'CRITICAL' : 'HIGH',
      priority: isTargeted ? 30 : 22,
      matchedFactorKeywords: ['caste', 'community', 'special category'],
    };
  }

  // 3. Bank Statement / Passbook
  if (
    lower.includes('bank') ||
    lower.includes('passbook') ||
    lower.includes('statement') ||
    lower.includes('sanction')
  ) {
    return {
      criticality: 'HIGH',
      priority: 24,
      matchedFactorKeywords: ['bank', 'passbook', 'statement'],
    };
  }

  // 4. MSME Udyam / Formal Registration
  if (
    lower.includes('udyam') ||
    lower.includes('msme') ||
    lower.includes('registration') ||
    lower.includes('gst')
  ) {
    return {
      criticality: 'HIGH',
      priority: 22,
      matchedFactorKeywords: ['udyam', 'msme', 'registration'],
    };
  }

  // 5. Machinery Quotations / Vendor Invoices
  if (
    lower.includes('quotation') ||
    lower.includes('machinery') ||
    lower.includes('invoice') ||
    lower.includes('estimate')
  ) {
    return {
      criticality: 'HIGH',
      priority: 20,
      matchedFactorKeywords: ['quotation', 'machinery'],
    };
  }

  // 6. EDP Training / Capacity Building
  if (
    lower.includes('edp') ||
    lower.includes('training') ||
    lower.includes('rseti') ||
    lower.includes('skill')
  ) {
    return {
      criticality: 'HIGH',
      priority: 18,
      matchedFactorKeywords: ['edp', 'training'],
    };
  }

  // 7. Identity & Address (Aadhaar, PAN, Electricity bill)
  if (
    lower.includes('aadhaar') ||
    lower.includes('pan') ||
    lower.includes('address') ||
    lower.includes('voter') ||
    lower.includes('rent')
  ) {
    return {
      criticality: 'STANDARD',
      priority: 12,
      matchedFactorKeywords: ['aadhaar', 'pan', 'identity'],
    };
  }

  return {
    criticality: 'STANDARD',
    priority: 10,
    matchedFactorKeywords: ['general'],
  };
}

/**
 * Assesses which known rejection risks the citizen's current dossier
 * addresses, and which remain open. Deterministic: the same dossier and
 * scheme always produce the same assessment.
 */
export function assessRejectionRisk(input: {
  scheme: Scheme;
  matchResult: MatchResult;
  preparedDocIds: string[];
  uploadedFiles?: Record<string, UploadedFileRecord>;
}): RejectionRiskAssessment {
  const { scheme, matchResult, preparedDocIds, uploadedFiles = {} } = input;
  const riskFactors = getRejectionRiskFactorsForScheme(scheme.id);

  const requiredDocs = scheme.requiredDocuments || [];
  const totalCount = requiredDocs.length;
  const blockers = matchResult.confirmedBlockers ?? [];

  // A confirmed statutory blocker prevents consideration regardless of
  // document readiness — surface it directly, with no risk scoring.
  if (blockers.length > 0) {
    return {
      status: 'BLOCKED',
      statutoryBlockerPresent: true,
      blockerLabels: blockers.map((b) => b.factorLabel),
      totalDocumentsCount: totalCount,
      preparedDocumentsCount: 0,
      uploadedDocumentsCount: 0,
      documentReadinessPercent: 0,
      documents: [],
      riskFactors,
      mitigatedRisks: [],
      openRisks: riskFactors,
      topRecommendations: [],
    };
  }

  const documents: (DocumentRiskStatus & { priority: number })[] = requiredDocs.map((doc) => {
    const uploadedRecord = uploadedFiles[doc];
    const isUploaded = Boolean(uploadedRecord);
    const { criticality, priority, matchedFactorKeywords } = evaluateDocumentCriticality(doc, scheme);

    const relatedRiskFactor = riskFactors.find((f) =>
      f.mitigatingKeywords.some((kw) =>
        matchedFactorKeywords.includes(kw) || doc.toLowerCase().includes(kw)
      )
    );

    return {
      docName: doc,
      isPrepared: preparedDocIds.includes(doc) || isUploaded,
      isUploaded,
      uploadedRecord,
      criticality,
      relatedRiskFactor,
      priority,
    };
  });

  // A risk counts as addressed when a prepared document's name matches one
  // of the factor's mitigating keywords (the same deterministic rule the
  // dossier checklist has always used).
  const mitigatedRisks: RejectionRiskFactor[] = [];
  const openRisks: RejectionRiskFactor[] = [];
  riskFactors.forEach((factor) => {
    const addressed = documents.some(
      (d) =>
        d.isPrepared &&
        factor.mitigatingKeywords.some((kw) => d.docName.toLowerCase().includes(kw))
    );
    if (addressed) {
      mitigatedRisks.push(factor);
    } else {
      openRisks.push(factor);
    }
  });

  // Next steps: pending documents first, most central to appraisal first.
  const topRecommendations: RiskRecommendation[] = documents
    .filter((d) => !d.isPrepared || !d.isUploaded)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((d) => {
      const isMissingUpload = d.isPrepared && !d.isUploaded;
      if (isMissingUpload) {
        return {
          docName: d.docName,
          reasonEn: `Upload a clear digital scan of ${d.docName} so it can be verified without a physical visit.`,
          reasonHi: `${d.docName} की स्पष्ट डिजिटल स्कैन प्रति अपलोड करें ताकि भौतिक यात्रा के बिना सत्यापन हो सके।`,
        };
      }
      return {
        docName: d.docName,
        reasonEn: d.relatedRiskFactor
          ? `Prepare ${d.docName} — it addresses: ${d.relatedRiskFactor.causeEn}.`
          : `Prepare and attach ${d.docName} — a required document for this scheme.`,
        reasonHi: d.relatedRiskFactor
          ? `${d.docName} तैयार करें — यह इस जोखिम को दूर करता है: ${d.relatedRiskFactor.causeHi}।`
          : `${d.docName} तैयार कर संलग्न करें — यह इस योजना का आवश्यक दस्तावेज है।`,
      };
    });

  const preparedCount = documents.filter((d) => d.isPrepared).length;
  const uploadedCount = documents.filter((d) => d.isUploaded).length;
  const readinessPercent = totalCount > 0 ? Math.round((preparedCount / totalCount) * 100) : 100;

  return {
    status: openRisks.length === 0 ? 'ALL_COVERED' : 'RISKS_OPEN',
    statutoryBlockerPresent: false,
    blockerLabels: [],
    totalDocumentsCount: totalCount,
    preparedDocumentsCount: preparedCount,
    uploadedDocumentsCount: uploadedCount,
    documentReadinessPercent: readinessPercent,
    documents: documents.map(({ priority: _priority, ...rest }) => rest),
    riskFactors,
    mitigatedRisks,
    openRisks,
    topRecommendations,
  };
}
