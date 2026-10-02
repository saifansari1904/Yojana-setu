/**
 * Success Rate Predictor Engine
 *
 * Grounded in historical approval disclosures, Ministry of MSME performance
 * data, and gazette sanction ratios. Evaluates user's document progress
 * (uploaded digital files vs physical preparation) against historical rejection
 * factors to compute an estimated probability of scheme success.
 *
 * Strictly follows advisory guidelines: provides an estimated statistical
 * likelihood, never an underwriting guarantee.
 */

import type { Scheme } from '../../types/scheme';
import type { UserProfile } from '../../types/user';
import type { MatchResult } from '../../types/matching';
import type { UploadedFileRecord } from '../tracker/documentProgress';
import {
  getHistoricalBenchmarkForScheme,
  HistoricalSchemeBenchmark,
  HistoricalRejectionFactor,
} from '../../data/historicalApprovalData';

export type SuccessProbabilityTier =
  | 'VERY_HIGH'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'BLOCKED';

export interface DocumentImpactAnalysis {
  docName: string;
  isPrepared: boolean;
  isUploaded: boolean;
  uploadedRecord?: UploadedFileRecord;
  criticality: 'CRITICAL' | 'HIGH' | 'STANDARD';
  weightSharePercent: number; // e.g. 28%
  potentialGainPercent: number; // e.g. +14%
  earnedGainPercent: number; // e.g. +14% or +12%
  rejectionFactorMitigated?: HistoricalRejectionFactor;
}

export interface SuccessRateRecommendation {
  docName: string;
  gainPercent: number;
  reasonEn: string;
  reasonHi: string;
}

export interface SuccessRatePrediction {
  probabilityPercent: number;
  probabilityTier: SuccessProbabilityTier;
  baselineRate: number; // Historical unassisted approval rate
  maxPossibleRate: number; // Ceiling for complete dossier
  totalDocumentsCount: number;
  preparedDocumentsCount: number;
  uploadedDocumentsCount: number;
  documentReadinessPercent: number;
  documentImpacts: DocumentImpactAnalysis[];
  mitigatedRejectionRisks: HistoricalRejectionFactor[];
  activeRejectionRisks: HistoricalRejectionFactor[];
  topRecommendations: SuccessRateRecommendation[];
  statutoryBlockerPresent: boolean;
  benchmark: HistoricalSchemeBenchmark;
  calculationBreakdown: {
    baselineRate: number;
    documentContribution: number;
    profileAdjustment: number;
    finalEstimatedRate: number;
  };
  methodologyNoteEn: string;
  methodologyNoteHi: string;
}

/**
 * Assigns a domain-specific raw importance score to each document
 * based on historical rejection correlations.
 */
function evaluateDocumentCriticality(
  docName: string,
  scheme: Scheme
): {
  criticality: 'CRITICAL' | 'HIGH' | 'STANDARD';
  rawWeight: number;
  matchedFactorKeywords: string[];
} {
  const lower = docName.toLowerCase();

  // 1. Detailed Project Report / Financial Feasibility (Highest historical rejection cause ~38%)
  if (
    lower.includes('dpr') ||
    lower.includes('project report') ||
    lower.includes('feasibility') ||
    lower.includes('balance sheet') ||
    lower.includes('cash flow')
  ) {
    return {
      criticality: 'CRITICAL',
      rawWeight: 35,
      matchedFactorKeywords: ['dpr', 'project report', 'quotation', 'feasibility'],
    };
  }

  // 2. Caste / Category / Domicile (Mandatory for targeted subsidies like PMEGP 35% or Stand-Up India)
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
      rawWeight: isTargeted ? 30 : 22,
      matchedFactorKeywords: ['caste', 'community', 'special category'],
    };
  }

  // 3. Bank Statement / Passbook (Proves commercial viability and liquidity)
  if (
    lower.includes('bank') ||
    lower.includes('passbook') ||
    lower.includes('statement') ||
    lower.includes('sanction')
  ) {
    return {
      criticality: 'HIGH',
      rawWeight: 24,
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
      rawWeight: 22,
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
      rawWeight: 20,
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
      rawWeight: 18,
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
      rawWeight: 12,
      matchedFactorKeywords: ['aadhaar', 'pan', 'identity'],
    };
  }

  return {
    criticality: 'STANDARD',
    rawWeight: 10,
    matchedFactorKeywords: ['general'],
  };
}

/**
 * Predicts the citizen's scheme success probability by analyzing their
 * document readiness against historical departmental sanction benchmarks.
 */
export function predictSchemeSuccessRate(input: {
  scheme: Scheme;
  userProfile: UserProfile;
  matchResult: MatchResult;
  preparedDocIds: string[];
  uploadedFiles?: Record<string, UploadedFileRecord>;
}): SuccessRatePrediction {
  const { scheme, userProfile, matchResult, preparedDocIds, uploadedFiles = {} } = input;
  const benchmark = getHistoricalBenchmarkForScheme(scheme.id, scheme.name, scheme.schemeType);

  const requiredDocs = scheme.requiredDocuments || [];
  const totalCount = requiredDocs.length;
  const blockersCount = matchResult.confirmedBlockers?.length || 0;
  const unknownCount = matchResult.unknownCriteria?.length || 0;

  // Handle case where statutory blocker prevents consideration
  if (blockersCount > 0) {
    return {
      probabilityPercent: 0,
      probabilityTier: 'BLOCKED',
      baselineRate: benchmark.baselineApprovalRate,
      maxPossibleRate: benchmark.fullyPreparedApprovalRate,
      totalDocumentsCount: totalCount,
      preparedDocumentsCount: 0,
      uploadedDocumentsCount: 0,
      documentReadinessPercent: 0,
      documentImpacts: [],
      mitigatedRejectionRisks: [],
      activeRejectionRisks: benchmark.topRejectionFactors,
      topRecommendations: [
        {
          docName: 'Statutory Eligibility Blocker',
          gainPercent: benchmark.baselineApprovalRate,
          reasonEn: 'Resolve statutory limitations before applying: ' + (matchResult.confirmedBlockers?.map((b) => b.factorLabel).join(', ') || 'Statutory rule mismatch'),
          reasonHi: 'आवेदन से पूर्व वैधानिक सीमाओं का समाधान करें',
        },
      ],
      statutoryBlockerPresent: true,
      benchmark,
      calculationBreakdown: {
        baselineRate: benchmark.baselineApprovalRate,
        documentContribution: 0,
        profileAdjustment: -benchmark.baselineApprovalRate,
        finalEstimatedRate: 0,
      },
      methodologyNoteEn: 'Application cannot be approved due to statutory eligibility criteria blockers.',
      methodologyNoteHi: 'वैधानिक पात्रता बाधाओं के कारण आवेदन स्वीकृत नहीं किया जा सकता।',
    };
  }

  // Calculate document criticality and weights
  const docMeta = requiredDocs.map((doc) => {
    const isPrepared = preparedDocIds.includes(doc);
    const uploadedRecord = uploadedFiles[doc];
    const isUploaded = Boolean(uploadedRecord);
    const { criticality, rawWeight, matchedFactorKeywords } = evaluateDocumentCriticality(doc, scheme);

    // Find corresponding rejection factor from benchmark
    const rejectionFactorMitigated = benchmark.topRejectionFactors.find((f) =>
      f.mitigatingKeywords.some((kw) =>
        matchedFactorKeywords.includes(kw) || doc.toLowerCase().includes(kw)
      )
    );

    return {
      docName: doc,
      isPrepared: isPrepared || isUploaded,
      isUploaded,
      uploadedRecord,
      criticality,
      rawWeight,
      rejectionFactorMitigated,
    };
  });

  const totalRawWeight = docMeta.reduce((sum, d) => sum + d.rawWeight, 0) || 1;
  const availableGain = benchmark.fullyPreparedApprovalRate - benchmark.baselineApprovalRate;

  let totalEarnedDocumentGain = 0;
  const documentImpacts: DocumentImpactAnalysis[] = docMeta.map((dm) => {
    const weightSharePercent = Math.round((dm.rawWeight / totalRawWeight) * 100);
    const potentialGainPercent = Math.max(1, Math.round(availableGain * (dm.rawWeight / totalRawWeight)));

    // Uploaded digital document provides 100% impact credit;
    // Ticked physical copy provides 85% credit (physical transmission scrutiny discount).
    let earnedGainPercent = 0;
    if (dm.isUploaded) {
      earnedGainPercent = potentialGainPercent;
    } else if (dm.isPrepared) {
      earnedGainPercent = Math.round(potentialGainPercent * 0.85);
    }

    totalEarnedDocumentGain += earnedGainPercent;

    return {
      docName: dm.docName,
      isPrepared: dm.isPrepared,
      isUploaded: dm.isUploaded,
      uploadedRecord: dm.uploadedRecord,
      criticality: dm.criticality,
      weightSharePercent,
      potentialGainPercent,
      earnedGainPercent,
      rejectionFactorMitigated: dm.rejectionFactorMitigated,
    };
  });

  // If scheme has 0 mandatory documents, assign standard baseline credit
  if (totalCount === 0) {
    totalEarnedDocumentGain = Math.round(availableGain * 0.6);
  }

  // Profile adjustments:
  // - Small discount for unconfirmed/unknown profile criteria (-3% per unknown, up to -9%)
  // - Modest alignment bonus if financial project amount falls within scheme funding range
  let profileAdjustment = 0;
  if (unknownCount > 0) {
    profileAdjustment -= Math.min(unknownCount * 3, 9);
  }

  // Financial alignment bonus
  const userFundingCost = userProfile.totalProjectCost ?? userProfile.fundingRequired;
  if (
    userFundingCost &&
    userFundingCost >= (scheme.minAmount || 0) &&
    (scheme.maxAmount === 0 || userFundingCost <= scheme.maxAmount)
  ) {
    profileAdjustment += 3;
  }

  // Compute final probability
  const rawFinal = benchmark.baselineApprovalRate + totalEarnedDocumentGain + profileAdjustment;
  // Bound strictly between realistic baseline floor and verified maximum benchmark
  const finalProbability = Math.max(
    Math.round(benchmark.baselineApprovalRate * 0.6),
    Math.min(benchmark.fullyPreparedApprovalRate, rawFinal)
  );

  // Assign probability tier
  let probabilityTier: SuccessProbabilityTier = 'MODERATE';
  if (finalProbability >= 80) {
    probabilityTier = 'VERY_HIGH';
  } else if (finalProbability >= 68) {
    probabilityTier = 'HIGH';
  } else if (finalProbability >= 50) {
    probabilityTier = 'MODERATE';
  } else {
    probabilityTier = 'LOW';
  }

  // Compute mitigated vs active rejection risks
  const mitigatedRejectionRisks: HistoricalRejectionFactor[] = [];
  const activeRejectionRisks: HistoricalRejectionFactor[] = [];

  benchmark.topRejectionFactors.forEach((factor) => {
    const hasMitigatingDocReady = documentImpacts.some(
      (di) =>
        di.isPrepared &&
        factor.mitigatingKeywords.some((kw) => di.docName.toLowerCase().includes(kw))
    );

    if (hasMitigatingDocReady) {
      mitigatedRejectionRisks.push(factor);
    } else {
      activeRejectionRisks.push(factor);
    }
  });

  // Build top recommendations to maximize success rate
  const pendingDocs = documentImpacts.filter((di) => !di.isPrepared || !di.isUploaded);
  const topRecommendations: SuccessRateRecommendation[] = pendingDocs
    .sort((a, b) => (b.potentialGainPercent - b.earnedGainPercent) - (a.potentialGainPercent - a.earnedGainPercent))
    .slice(0, 3)
    .map((pd) => {
      const remainingGain = pd.potentialGainPercent - pd.earnedGainPercent;
      const isMissingUpload = pd.isPrepared && !pd.isUploaded;
      return {
        docName: pd.docName,
        gainPercent: Math.max(1, remainingGain),
        reasonEn: isMissingUpload
          ? `Upload clear digital scan of ${pd.docName} to gain +${remainingGain}% and eliminate scrutiny defects.`
          : `Procure and attach ${pd.docName} (+${remainingGain}% probability boost).`,
        reasonHi: isMissingUpload
          ? `${pd.docName} की डिजिटल स्कैन प्रति अपलोड कर +${remainingGain}% संभावना प्राप्त करें।`
          : `${pd.docName} संलग्न कर +${remainingGain}% संभावना बढ़ाएं।`,
      };
    });

  const preparedCount = documentImpacts.filter((di) => di.isPrepared).length;
  const uploadedCount = documentImpacts.filter((di) => di.isUploaded).length;
  const readinessPercent = totalCount > 0 ? Math.round((preparedCount / totalCount) * 100) : 100;

  return {
    probabilityPercent: finalProbability,
    probabilityTier,
    baselineRate: benchmark.baselineApprovalRate,
    maxPossibleRate: benchmark.fullyPreparedApprovalRate,
    totalDocumentsCount: totalCount,
    preparedDocumentsCount: preparedCount,
    uploadedDocumentsCount: uploadedCount,
    documentReadinessPercent: readinessPercent,
    documentImpacts,
    mitigatedRejectionRisks,
    activeRejectionRisks,
    topRecommendations,
    statutoryBlockerPresent: false,
    benchmark,
    calculationBreakdown: {
      baselineRate: benchmark.baselineApprovalRate,
      documentContribution: totalEarnedDocumentGain,
      profileAdjustment,
      finalEstimatedRate: finalProbability,
    },
    methodologyNoteEn: `Derived from ${benchmark.auditedApplicationsCount.toLocaleString('en-IN')} audited scheme records (${benchmark.samplePeriod}) published in ${benchmark.dataSourceProvenance}.`,
    methodologyNoteHi: `${benchmark.dataSourceProvenance} में प्रकाशित ${benchmark.auditedApplicationsCount.toLocaleString('hi-IN')} योजना ऑडिट रिकॉर्ड्स (${benchmark.samplePeriod}) पर आधारित।`,
  };
}
