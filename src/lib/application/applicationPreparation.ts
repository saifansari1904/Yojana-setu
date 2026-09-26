/**
 * Phase 5 — Guided Application & Preparation Engine
 *
 * Deterministic, rules-based intelligence for application preparation.
 *
 * Reuses existing engines:
 *  - Authoritative Phase 3.1 MatchResult (never recalculates eligibility or scores)
 *  - Document Progress store (`documentProgress.ts`)
 *  - Application Journey event engine (`applicationJourney.ts`)
 *  - Funding Fit evaluator (`fundingFit.ts`)
 *
 * Principles:
 *  - Yojana Setu is an advisory guidance workspace, NOT a submission portal.
 *  - Official application happens exclusively on government portal / designated nodal desks.
 *  - Never fabricates requirements or deadlines.
 */

import type { Scheme } from '../../types/scheme';
import type { UserProfile } from '../../types/user';
import type { MatchResult } from '../../types/matching';
import type { TrackedApplication, JourneyEvent } from '../../types/tracker';
import type {
  ApplicationWorkspace,
  CitizenSubmissionConfirmation,
  OfficialApplicationProcess,
  PreparationStep,
  StepInstruction,
  WorkspaceReadiness,
  WorkspaceReadinessPillar,
} from '../../types/application';
import { evaluateFundingFit } from '../matching/fundingFit';
import { createJourneyEvent, appendJourneyEvent } from '../tracker/applicationJourney';
import { createTrackedApplication } from '../tracker/applicationTracker';
import { classifyUrlSafety } from '../data/trustEngine';
import type { UrlSafetyClassification } from '../../types/trust';

// Domain verification for official government web properties.
//
// Phase 2E.2 hardening: this is a thin wrapper over the single shared
// classification path (trustEngine.classifyUrlSafety), which is
// registry-first and uses exact / domain-boundary hostname matching.
//
// Loose substring checks are never used here: fake-sidbi.in.attacker.com
// and sidbi.in.attacker.com must NOT verify, and generic suffixes
// (.org.in, .edu.in, .ac.in, .org, .com) never confer official status.
// A domain the authority registry does not know returns UNKNOWN
// (SECONDARY_AGGREGATOR), never a guess.
export function verifyOfficialPortalUrl(url?: string): {
  isVerifiedGovtDomain: boolean;
  domain: string;
  isSecure: boolean;
  classification: UrlSafetyClassification;
} {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isVerifiedGovtDomain: false, domain: '', isSecure: false, classification: 'SUSPICIOUS_OR_INVALID' };
  }

  let hostname = '';
  let isSecure = false;
  try {
    const parsed = new URL(url.trim());
    hostname = parsed.hostname.toLowerCase();
    isSecure = parsed.protocol === 'https:';
  } catch {
    return { isVerifiedGovtDomain: false, domain: url, isSecure: false, classification: 'SUSPICIOUS_OR_INVALID' };
  }

  const classification = classifyUrlSafety(url);
  // OFFICIAL_GOVERNMENT: registry-confirmed government domains (.gov.in/.nic.in
  // and registered ministries). IMPLEMENTING_AGENCY: registry-confirmed statutory
  // bodies and public financing corporations (e.g. sidbi.in, mudra.org.in).
  // Everything else — including GOVERNMENT_BACKED and SECONDARY_AGGREGATOR —
  // is not treated as a verified official channel.
  const isVerifiedGovtDomain =
    classification === 'OFFICIAL_GOVERNMENT' || classification === 'IMPLEMENTING_AGENCY';

  return {
    isVerifiedGovtDomain,
    domain: hostname,
    isSecure,
    classification,
  };
}

function addInstructionKeys(instructions: StepInstruction[]): StepInstruction[] {
  return instructions.map((instruction) => ({ ...instruction, titleKey: `application.steps.${instruction.stepNumber}.title`, descriptionKey: `application.steps.${instruction.stepNumber}.description` }));
}

// Builds step-by-step instructions for the application workspace.
//
// Phase 2E.2 trust hardening — SOURCE-BACKED vs UNKNOWN discipline:
//   * Steps marked SOURCE-BACKED use only values present in the scheme record
//     (official portal hostname, requiredDocuments count, agency name, and the
//     intelligence.application fields applicationProcess /
//     bankChannelInformation / helplineInformation when populated).
//   * Anything the scheme record does not establish — authentication method,
//     e-sign, editability after submission, processing time, approval body,
//     attestation rules — is returned as UNKNOWN / NOT SPECIFIED and phrased
//     as "check the official portal", never as a fabricated requirement.
//   * This generator never changes the Online / Hybrid / Offline-DIC channel
//     model and never touches readiness scoring.
function portalHostname(scheme: Scheme): string {
  try {
    return scheme.officialPortalUrl ? new URL(scheme.officialPortalUrl).hostname : 'the official portal';
  } catch {
    return 'the official portal';
  }
}

function sourceBackedProcessSteps(scheme: Scheme): StepInstruction[] {
  const process = scheme.intelligence?.application?.applicationProcess;
  if (!Array.isArray(process)) return [];
  const steps = process
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s) => s.length > 0);
  if (steps.length === 0) return [];
  // Source-backed: taken verbatim from the scheme's official process data.
  // Provided in the dataset language; Hindi fallback notes the source.
  return steps.map((step, i) => ({
    stepNumber: i + 1,
    titleEn: 'Official Process Step',
    titleHi: 'आधिकारिक प्रक्रिया चरण',
    descEn: step,
    descHi: `योजना के आधिकारिक विवरण अनुसार: ${step}`,
    isMandatory: false,
    agency: scheme.department || scheme.intelligence?.application?.nodalAgency,
  }));
}

export function getStepByStepApplicationGuide(scheme: Scheme): StepInstruction[] {
  const mode = scheme.applicationMode || 'Online via Portal';
  const agency = scheme.department || scheme.intelligence?.application?.nodalAgency || scheme.sponsoringMinistry;
  const host = portalHostname(scheme);

  // When the dataset carries the scheme's own official process, prefer it:
  // those steps are source-backed by definition.
  const officialSteps = sourceBackedProcessSteps(scheme);
  if (officialSteps.length > 0) {
    return addInstructionKeys(officialSteps);
  }

  if (mode === 'Online via Portal') {
    return addInstructionKeys([
      {
        stepNumber: 1,
        titleEn: 'Portal Registration & Authentication',
        titleHi: 'पोर्टल पंजीकरण एवं प्रमाणीकरण',
        descEn: `Create your applicant account on the official portal (${host}) using the authentication method the portal specifies.`,
        descHi: `आधिकारिक पोर्टल पर पोर्टल द्वारा निर्दिष्ट प्रमाणीकरण विधि से अपना आवेदक खाता बनाएं।`,
        isMandatory: true,
        agency,
      },
      {
        stepNumber: 2,
        titleEn: 'Enter Business Details & Profile Data',
        titleHi: 'व्यवसाय विवरण एवं प्रोफ़ाइल दर्ज करें',
        descEn: 'Fill in the enterprise address, activity sector, proposed project cost, and promoter category details exactly as per your legal records.',
        descHi: 'अपने कानूनी अभिलेखों के अनुसार उद्यम का पता, कार्य क्षेत्र, प्रस्तावित परियोजना लागत एवं प्रवर्तक वर्ग विवरण भरें।',
        isMandatory: true,
      },
      {
        stepNumber: 3,
        titleEn: 'Upload Prescribed Supporting Documents',
        titleHi: 'निर्धारित सहायक दस्तावेज अपलोड करें',
        descEn: `Upload digital copies of the scheme's required documents (${scheme.requiredDocuments?.length || 0} listed for this scheme). Check the official portal for any attestation, format, or size requirements.`,
        descHi: `योजना हेतु आवश्यक दस्तावेजों की डिजिटल प्रतियां अपलोड करें (इस योजना हेतु ${scheme.requiredDocuments?.length || 0} सूचीबद्ध)। प्रमाणीकरण, प्रारूप या आकार संबंधी आवश्यकताओं हेतु आधिकारिक पोर्टल देखें।`,
        isMandatory: true,
      },
      {
        stepNumber: 4,
        titleEn: 'Final Review & Submission',
        titleHi: 'अंतिम समीक्षा एवं प्रस्तुति',
        descEn: 'Review the generated application preview carefully before submission. Check the portal\u2019s instructions for any edit or correction window after submission.',
        descHi: 'प्रस्तुति से पूर्व उत्पन्न आवेदन पूर्वावलोकन की सावधानीपूर्वक समीक्षा करें। प्रस्तुति के बाद संशोधन की सुविधा हेतु पोर्टल के निर्देश देखें।',
        isMandatory: true,
      },
      {
        stepNumber: 5,
        titleEn: 'Record Official Acknowledgement Number',
        titleHi: 'आधिकारिक पावती संख्या सुरक्षित रखें',
        descEn: 'Save any acknowledgement or reference number the portal issues after submission for departmental follow-up.',
        descHi: 'विभागीय अनुवर्ती कार्रवाई हेतु प्रस्तुति के बाद पोर्टल द्वारा जारी पावती या संदर्भ संख्या सुरक्षित रखें।',
        isMandatory: true,
      },
    ]);
  }

  if (mode === 'Hybrid') {
    const bankInfo = scheme.intelligence?.application?.bankChannelInformation?.trim();
    return addInstructionKeys([
      {
        stepNumber: 1,
        titleEn: 'Online Preliminary Application Filing',
        titleHi: 'ऑनलाइन प्रारंभिक आवेदन प्रस्तुति',
        descEn: `File the electronic preliminary application on ${host}.`,
        descHi: `आधिकारिक पोर्टल पर इलेक्ट्रॉनिक प्रारंभिक आवेदन जमा करें।`,
        isMandatory: true,
      },
      {
        stepNumber: 2,
        titleEn: 'Save the Portal Acknowledgement',
        titleHi: 'पोर्टल पावती सुरक्षित रखें',
        descEn: 'Save or print any acknowledgement the portal generates after the online step.',
        descHi: 'ऑनलाइन चरण के बाद पोर्टल द्वारा जारी पावती सुरक्षित रखें या उसका प्रिंट लें।',
        isMandatory: true,
      },
      {
        stepNumber: 3,
        titleEn: 'Bank Branch / Nodal Agency Verification',
        titleHi: 'बैंक शाखा / नोडल एजेंसी सत्यापन',
        descEn: bankInfo && bankInfo.length > 0
          ? bankInfo
          : 'If the scheme requires in-person verification, the official portal or nodal agency will specify the designated office or bank branch. Do not assume a channel the scheme has not declared.',
        descHi: bankInfo && bankInfo.length > 0
          ? bankInfo
          : 'यदि योजना में व्यक्तिगत सत्यापन आवश्यक है, तो आधिकारिक पोर्टल या नोडल एजेंसी निर्दिष्ट कार्यालय या बैंक शाखा बताएगी। योजना द्वारा घोषित न किए गए माध्यम की कल्पना न करें।',
        isMandatory: true,
        agency,
      },
    ]);
  }

  // Offline / DIC / Bank Channel mode
  return addInstructionKeys([
    {
      stepNumber: 1,
      titleEn: 'Procure Official Application Form',
      titleHi: 'आधिकारिक आवेदन प्रपत्र प्राप्त करें',
      descEn: `Obtain the official application form from the nodal office or District Industries Centre (DIC) designated for this scheme${agency ? ` (${agency})` : ''}.`,
      descHi: `इस योजना हेतु निर्दिष्ट नोडल कार्यालय या जिला उद्योग केंद्र (DIC) से आधिकारिक आवेदन प्रपत्र प्राप्त करें।`,
      isMandatory: true,
      agency,
    },
    {
      stepNumber: 2,
      titleEn: 'Complete Form & Collate Physical Dossier',
      titleHi: 'प्रपत्र पूर्ण करें एवं भौतिक दस्तावेज संलग्न करें',
      descEn: 'Complete the form as instructed and attach the documents the scheme lists. Check the official guidelines for any attestation or photograph requirements.',
      descHi: 'निर्देशानुसार प्रपत्र पूर्ण करें और योजना द्वारा सूचीबद्ध दस्तावेज संलग्न करें। प्रमाणीकरण या चित्र संबंधी आवश्यकताओं हेतु आधिकारिक दिशानिर्देश देखें।',
      isMandatory: true,
    },
    {
      stepNumber: 3,
      titleEn: 'Submit at Designated Desk & Obtain Acknowledgement',
      titleHi: 'निर्धारित पटल पर जमा कर पावती लें',
      descEn: 'Submit as instructed by the scheme\u2019s official guidelines and retain any acknowledgement issued.',
      descHi: 'योजना के आधिकारिक दिशानिर्देशों के अनुसार जमा करें और जारी पावती सुरक्षित रखें।',
      isMandatory: true,
      agency,
    },
  ]);
}

// Computes the 4-Pillar Workspace Readiness
function calculateWorkspaceReadiness(
  matchResult: MatchResult,
  userProfile: UserProfile,
  preparedDocIds: string[],
  scheme: Scheme
): WorkspaceReadiness {
  // Pillar 1: Eligibility Audit
  const blockersCount = matchResult.confirmedBlockers?.length || 0;
  const unknownCount = matchResult.unknownCriteria?.length || 0;
  const criteriaMetCount = matchResult.matchedCriteria?.length || 0;

  let eligibilityScore = 100;
  let eligibilityState: 'SATISFIED' | 'PARTIAL' | 'PENDING' | 'BLOCKED' | 'UNKNOWN' = 'SATISFIED';
  let eligibilitySummaryEn = 'All statutory criteria verified and satisfied';
  let eligibilitySummaryHi = 'सभी वैधानिक शर्तें सत्यापित एवं संतुष्ट हैं';
  let eligibilityDetailEn = `${criteriaMetCount} criteria matched with zero statutory restrictions.`;
  let eligibilityDetailHi = `शून्य वैधानिक बाधाओं के साथ ${criteriaMetCount} शर्तें मेल खाती हैं।`;

  if (blockersCount > 0) {
    eligibilityScore = 20;
    eligibilityState = 'BLOCKED';
    eligibilitySummaryEn = `${blockersCount} confirmed statutory limitation(s)`;
    eligibilitySummaryHi = `${blockersCount} पुष्ट वैधानिक सीमाएं पाई गईं`;
    eligibilityDetailEn = `Application cannot proceed until statutory limitations are resolved: ${matchResult.confirmedBlockers?.map((b) => b.factorLabel).join(', ')}`;
    eligibilityDetailHi = `वैधानिक सीमाओं के समाधान तक आवेदन आगे नहीं बढ़ाया जा सकता: ${matchResult.confirmedBlockers?.map((b) => b.factorLabel).join(', ')}`;
  } else if (unknownCount > 0) {
    eligibilityScore = 75;
    eligibilityState = 'PARTIAL';
    eligibilitySummaryEn = `${unknownCount} criterion/criteria require profile clarification`;
    eligibilitySummaryHi = `${unknownCount} शर्तों हेतु प्रोफ़ाइल स्पष्टीकरण अपेक्षित`;
    eligibilityDetailEn = `Review profile details: ${matchResult.unknownCriteria?.map((u) => u.factorLabel).join(', ')}`;
    eligibilityDetailHi = `प्रोफ़ाइल विवरण की समीक्षा करें: ${matchResult.unknownCriteria?.map((u) => u.factorLabel).join(', ')}`;
  }

  const eligibilityPillar: WorkspaceReadinessPillar = {
    key: 'eligibility',
    labelEn: 'Statutory Eligibility',
    labelHi: 'वैधानिक पात्रता',
    score: eligibilityScore,
    state: eligibilityState,
    summaryEn: eligibilitySummaryEn,
    summaryHi: eligibilitySummaryHi,
    detailEn: eligibilityDetailEn,
    detailHi: eligibilityDetailHi,
  };

  // Pillar 2: Document Preparation
  const requiredDocs = scheme.requiredDocuments || [];
  const totalDocs = requiredDocs.length;
  const readyCount = requiredDocs.filter((doc) => preparedDocIds.includes(doc)).length;

  let docScore = 100;
  let docState: 'SATISFIED' | 'PARTIAL' | 'PENDING' | 'BLOCKED' | 'UNKNOWN' = 'SATISFIED';
  let docSummaryEn = 'All mandatory documents marked ready';
  let docSummaryHi = 'सभी अनिवार्य दस्तावेज तैयार चिह्नित';
  let docDetailEn = `${readyCount} of ${totalDocs} verified documents ready in your preparation dossier.`;
  let docDetailHi = `तैयारी डोजियर में ${totalDocs} में से ${readyCount} सत्यापित दस्तावेज तैयार हैं।`;

  if (totalDocs === 0) {
    docScore = 100;
    docState = 'SATISFIED';
    docSummaryEn = 'No statutory documents required by scheme';
    docSummaryHi = 'योजना हेतु कोई वैधानिक दस्तावेज अपेक्षित नहीं';
    docDetailEn = 'Standard identification documents may still be requested at the time of scrutiny.';
    docDetailHi = 'जांच के समय सामान्य पहचान दस्तावेज मांगे जा सकते हैं।';
  } else if (readyCount === totalDocs) {
    docScore = 100;
    docState = 'SATISFIED';
  } else if (readyCount > 0) {
    docScore = Math.round((readyCount / totalDocs) * 100);
    docState = 'PARTIAL';
    docSummaryEn = `${readyCount} of ${totalDocs} documents ready`;
    docSummaryHi = `${totalDocs} में से ${readyCount} दस्तावेज तैयार`;
    docDetailEn = `${totalDocs - readyCount} document(s) still require procurement prior to official filing.`;
    docDetailHi = `आधिकारिक आवेदन से पूर्व अभी ${totalDocs - readyCount} दस्तावेज जुटाना शेष है।`;
  } else {
    docScore = 0;
    docState = 'PENDING';
    docSummaryEn = 'Dossier preparation pending';
    docSummaryHi = 'दस्तावेज तैयारी लंबित';
    docDetailEn = `None of the ${totalDocs} mandated documents are marked ready yet.`;
    docDetailHi = `अभी तक ${totalDocs} आवश्यक दस्तावेजों में से कोई भी तैयार चिह्नित नहीं है।`;
  }

  const docPillar: WorkspaceReadinessPillar = {
    key: 'documents',
    labelEn: 'Document Dossier',
    labelHi: 'दस्तावेज डोजियर',
    score: docScore,
    state: docState,
    summaryEn: docSummaryEn,
    summaryHi: docSummaryHi,
    detailEn: docDetailEn,
    detailHi: docDetailHi,
  };

  // Pillar 3: Financial Alignment
  const fundingFit = evaluateFundingFit(scheme, userProfile, 'en');
  let finScore = 80;
  let finState: 'SATISFIED' | 'PARTIAL' | 'PENDING' | 'BLOCKED' | 'UNKNOWN' = 'SATISFIED';
  let finSummaryEn = 'Financial requirements aligned';
  let finSummaryHi = 'वित्तीय आवश्यकताएं अनुकूल हैं';
  let finDetailEn = fundingFit.explanation;
  let finDetailHi = fundingFit.explanation;

  if (fundingFit.fitStatus === 'WITHIN_RANGE') {
    finScore = 100;
    finState = 'SATISFIED';
    finSummaryEn = 'Project cost within statutory scheme limits';
    finSummaryHi = 'परियोजना लागत वैधानिक योजना सीमा के भीतर है';
  } else if (fundingFit.fitStatus === 'ABOVE_RANGE' || fundingFit.fitStatus === 'BELOW_RANGE') {
    finScore = 60;
    finState = 'PARTIAL';
    finSummaryEn = 'Funding mismatch with scheme ceiling';
    finSummaryHi = 'योजना सीमा के साथ वित्तीय आवश्यकता का अंतर';
  } else {
    finScore = 75;
    finState = 'UNKNOWN';
    finSummaryEn = 'Financial requirement not fully specified';
    finSummaryHi = 'वित्तीय आवश्यकता पूर्णतः निर्दिष्ट नहीं';
  }

  const financialPillar: WorkspaceReadinessPillar = {
    key: 'financial',
    labelEn: 'Financial Alignment',
    labelHi: 'वित्तीय अनुकूलता',
    score: finScore,
    state: finState,
    summaryEn: finSummaryEn,
    summaryHi: finSummaryHi,
    detailEn: finDetailEn,
    detailHi: finDetailHi,
  };

  // Pillar 4: Submission Process
  const portalInfo = verifyOfficialPortalUrl(scheme.officialPortalUrl);
  let procScore = 85;
  let procState: 'SATISFIED' | 'PARTIAL' | 'PENDING' | 'BLOCKED' | 'UNKNOWN' = 'SATISFIED';
  let procSummaryEn = 'Official channel verified';
  let procSummaryHi = 'आधिकारिक माध्यम सत्यापित';
  let procDetailEn = `Application mode: ${scheme.applicationMode || 'ONLINE'} via ${portalInfo.domain || scheme.sponsoringMinistry}`;
  let procDetailHi = `आवेदन माध्यम: ${scheme.applicationMode || 'ऑनलाइन'}, ${portalInfo.domain || scheme.sponsoringMinistry} के जरिए`;

  if (portalInfo.isVerifiedGovtDomain) {
    procScore = 100;
    procState = 'SATISFIED';
  } else if (scheme.officialPortalUrl) {
    // Phase 2E.2: the URL is listed but NOT in the verified government domain
    // registry. Score is unchanged (readiness scoring preserved); only the
    // state and wording are honest — never "verified" when it is not.
    procScore = 85;
    procState = 'UNKNOWN';
    procSummaryEn = 'Portal listed — official status unverified';
    procSummaryHi = 'पोर्टल सूचीबद्ध — आधिकारिक स्थिति असत्यापित';
    procDetailEn = `The listed portal (${portalInfo.domain || 'unknown address'}) is not in the verified government domain registry. Confirm the address on the ministry website before applying.`;
    procDetailHi = `सूचीबद्ध पोर्टल सत्यापित सरकारी डोमेन रजिस्ट्री में नहीं है। आवेदन से पूर्व मंत्रालय की वेबसाइट पर पता सत्यापित करें।`;
  } else {
    procScore = 50;
    procState = 'PARTIAL';
    procSummaryEn = 'Official portal URL not verified in gazette';
    procSummaryHi = 'आधिकारिक पोर्टल लिंक राजपत्र में असत्यापित';
    procDetailEn = 'Direct contact with local District Industries Centre required.';
    procDetailHi = 'स्थानीय जिला उद्योग केंद्र से सीधा संपर्क आवश्यक है।';
  }

  const processPillar: WorkspaceReadinessPillar = {
    key: 'process',
    labelEn: 'Official Channel & Mode',
    labelHi: 'आधिकारिक माध्यम एवं प्रक्रिया',
    score: procScore,
    state: procState,
    summaryEn: procSummaryEn,
    summaryHi: procSummaryHi,
    detailEn: procDetailEn,
    detailHi: procDetailHi,
  };

  // Weighted Aggregate Calculation
  // Eligibility: 35%, Documents: 35%, Financial: 15%, Process: 15%
  let rawScore = Math.round(
    eligibilityScore * 0.35 +
    docScore * 0.35 +
    finScore * 0.15 +
    procScore * 0.15
  );

  let state: 'READY_TO_APPLY' | 'READY_TO_REVIEW' | 'PARTIALLY_READY' | 'NOT_READY' = 'READY_TO_REVIEW';
  let labelEn = 'Ready to Review';
  let labelHi = 'समीक्षा हेतु तैयार';
  let summaryEn = 'Preparation is well advanced. Review the requirements before applying on the official portal.';
  let summaryHi = 'तैयारी अग्रिम चरण में है। आधिकारिक पोर्टल पर आवेदन से पूर्व आवश्यकताओं की समीक्षा करें।';

  if (blockersCount > 0) {
    rawScore = Math.min(rawScore, 40);
    state = 'NOT_READY';
    labelEn = 'Not Ready — Blocker Found';
    labelHi = 'तैयार नहीं — बाधा पाई गई';
    summaryEn = 'Statutory restrictions must be addressed before an application can be considered.';
    summaryHi = 'आवेदन पर विचार से पूर्व वैधानिक सीमाओं का समाधान किया जाना आवश्यक है।';
  } else if (rawScore >= 90 && docState === 'SATISFIED' && eligibilityState === 'SATISFIED') {
    state = 'READY_TO_APPLY';
    labelEn = 'Ready to Apply';
    labelHi = 'आवेदन हेतु तैयार';
    summaryEn = 'All statutory criteria, document preparation, and official requirements are satisfied.';
    summaryHi = 'सभी वैधानिक शर्तें, दस्तावेज तैयारी एवं आधिकारिक आवश्यकताएं पूर्ण हैं।';
  } else if (rawScore >= 70) {
    state = 'READY_TO_REVIEW';
    labelEn = 'Ready to Review';
    labelHi = 'समीक्षा हेतु तैयार';
    summaryEn = 'Preparation is progressing well. Review final checklist items before submitting.';
    summaryHi = 'तैयारी अच्छी तरह चल रही है। आवेदन से पूर्व अंतिम चेकलिस्ट की समीक्षा करें।';
  } else if (rawScore >= 40) {
    state = 'PARTIALLY_READY';
    labelEn = 'Partially Ready';
    labelHi = 'आंशिक रूप से तैयार';
    summaryEn = 'Key documentation or information remains pending.';
    summaryHi = 'महत्वपूर्ण दस्तावेज या जानकारी अभी लंबित है।';
  } else {
    state = 'NOT_READY';
    labelEn = 'Preparation Needed';
    labelHi = 'तैयारी आवश्यक';
    summaryEn = 'Begin by gathering necessary documentation and reviewing scheme eligibility.';
    summaryHi = 'आवश्यक दस्तावेज जुटाकर एवं पात्रता की समीक्षा कर शुरुआत करें।';
  }

  const readinessPillars = [eligibilityPillar, docPillar, financialPillar, processPillar].map((pillar) => ({ ...pillar, labelKey: `application.readiness.${pillar.key}.label`, summaryKey: `application.readiness.${pillar.key}.summary`, detailKey: `application.readiness.${pillar.key}.detail` }));

  return {
    overallScore: rawScore,
    state,
    labelKey: `application.readiness.state.${state}.label`,
    summaryKey: `application.readiness.state.${state}.summary`,
    labelEn,
    labelHi,
    summaryEn,
    summaryHi,
    pillars: readinessPillars,
    canProceedToOfficialPortal: blockersCount === 0,
  };
}

// Derives the full ApplicationWorkspace model
export function deriveApplicationWorkspace(input: {
  scheme: Scheme;
  userProfile: UserProfile;
  matchResult: MatchResult;
  preparedDocIds: string[];
  trackedApp?: TrackedApplication;
  lang?: string;
}): ApplicationWorkspace {
  const { scheme, userProfile, matchResult, preparedDocIds, trackedApp } = input;
  const portalVerification = verifyOfficialPortalUrl(scheme.officialPortalUrl);
  const instructions = getStepByStepApplicationGuide(scheme);
  const readiness = calculateWorkspaceReadiness(matchResult, userProfile, preparedDocIds, scheme);

  const steps: PreparationStep[] = [
    {
      key: 'ELIGIBILITY_AUDIT',
      labelEn: 'Statutory Review',
      labelHi: 'वैधानिक समीक्षा',
      descriptionEn: 'Review match score breakdown, verified criteria, and statutory limits.',
      descriptionHi: 'मैच स्कोर विश्लेषण, सत्यापित मानदंड एवं वैधानिक सीमाओं की समीक्षा करें।',
      status: matchResult.confirmedBlockers && matchResult.confirmedBlockers.length > 0
        ? 'NEEDS_ATTENTION'
        : 'COMPLETED',
      isMandatory: true,
    },
    {
      key: 'DOCUMENT_CHECKLIST',
      labelEn: 'Document Dossier',
      labelHi: 'दस्तावेज डोजियर',
      descriptionEn: 'Collate, verify and check off mandatory government certificates.',
      descriptionHi: 'अनिवार्य सरकारी प्रमाणपत्र जुटाएं, सत्यापित करें एवं चेकलिस्ट मार्क करें।',
      status: (scheme.requiredDocuments?.length || 0) === 0
        ? 'COMPLETED'
        : preparedDocIds.length >= (scheme.requiredDocuments?.length || 1)
          ? 'COMPLETED'
          : preparedDocIds.length > 0
            ? 'IN_PROGRESS'
            : 'PENDING',
      isMandatory: true,
    },
    {
      key: 'FINANCIAL_ALIGNMENT',
      labelEn: 'Financial Alignment',
      labelHi: 'वित्तीय अनुकूलता',
      descriptionEn: 'Verify project cost boundaries, promoter margin, and subsidy quantum.',
      descriptionHi: 'परियोजना लागत सीमा, प्रवर्तक मार्जिन एवं सब्सिडी राशि की पुष्टि करें।',
      status: 'COMPLETED',
      isMandatory: false,
    },
    {
      key: 'SUBMISSION_PROCESS',
      labelEn: 'Submission Guidelines',
      labelHi: 'आवेदन दिशानिर्देश',
      descriptionEn: 'Understand application mode, desk locations, and step sequence.',
      descriptionHi: 'आवेदन माध्यम, कार्यालय पता एवं क्रमवार प्रक्रिया को समझें।',
      status: 'COMPLETED',
      isMandatory: true,
    },
    {
      key: 'PORTAL_HANDOFF',
      labelEn: 'Official Handoff',
      labelHi: 'आधिकारिक पोर्टल प्रेषण',
      descriptionEn: 'Direct to official portal and capture citizen submission confirmation.',
      descriptionHi: 'आधिकारिक पोर्टल पर जाएं और नागरिक आवेदन पावती दर्ज करें।',
      status: trackedApp?.status === 'applied' || trackedApp?.status === 'approved'
        ? 'COMPLETED'
        : readiness.canProceedToOfficialPortal
          ? 'PENDING'
          : 'NEEDS_ATTENTION',
      isMandatory: true,
    },
  ];

  const officialProcess: OfficialApplicationProcess = {
    applicationMode: scheme.applicationMode || 'Online via Portal',
    sponsoringMinistry: scheme.sponsoringMinistry,
    implementingAgency: scheme.department || scheme.intelligence?.application?.nodalAgency || scheme.sponsoringMinistry,
    officialPortalUrl: scheme.officialPortalUrl || '',
    isVerifiedGovtDomain: portalVerification.isVerifiedGovtDomain,
    portalDomain: portalVerification.domain,
    instructions,
    nodalOffice: scheme.department || scheme.intelligence?.application?.nodalAgency || scheme.sponsoringMinistry,
    helpline: scheme.intelligence?.application?.helplineInformation,
  };

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    shortCode: scheme.shortCode || scheme.id,
    sponsoringMinistry: scheme.sponsoringMinistry,
    implementingAgency: scheme.department || scheme.intelligence?.application?.nodalAgency || scheme.sponsoringMinistry,
    officialPortalUrl: scheme.officialPortalUrl || '',
    applicationMode: scheme.applicationMode || 'Online via Portal',
    matchResult,
    readiness,
    steps,
    preparedDocumentIds: preparedDocIds,
    totalDocumentsCount: scheme.requiredDocuments?.length || 0,
    officialProcess,
    trackedApplication: trackedApp,
  };
}

/**
 * Records an explicit citizen confirmation that an application was submitted
 * on the official government portal.
 *
 * CRITICAL RULE:
 * Never records an application as "applied" automatically.
 * Only explicit citizen action updates this status.
 */
export function confirmCitizenSubmission(
  currentApplications: TrackedApplication[],
  confirmation: CitizenSubmissionConfirmation
): {
  updatedApplications: TrackedApplication[];
  newEvent: JourneyEvent;
} {
  const at = new Date().toISOString();
  const existing = currentApplications.find((a) => a.schemeId === confirmation.schemeId);
  const refText = confirmation.applicationReferenceNumber
    ? `Ref: ${confirmation.applicationReferenceNumber.trim()}`
    : 'Direct Submission';
  const notesText = confirmation.submissionNotes?.trim()
    ? ` | Notes: ${confirmation.submissionNotes.trim()}`
    : '';
  const portalNote = `Portal: ${confirmation.portalUsed || 'Official Government Channel'}`;
  const fullNote = `${refText} | ${portalNote}${notesText}`;

  const event = createJourneyEvent({
    source: 'USER_ACTION',
    status: 'applied',
    at,
    labelEn: `Applied on official portal (${refText})`,
    labelHi: `आधिकारिक पोर्टल पर आवेदन किया गया (${refText})`,
  });

  let targetApp: TrackedApplication;

  if (existing) {
    targetApp = {
      ...existing,
      status: 'applied',
      appliedOn: confirmation.submittedAt || at.slice(0, 10),
      note: existing.note ? `${existing.note}\n${fullNote}` : fullNote,
      updatedAt: at,
      journey: appendJourneyEvent(existing, event).journey,
    };
  } else {
    const base = createTrackedApplication(confirmation.schemeId, confirmation.schemeId);
    targetApp = {
      ...base,
      status: 'applied',
      appliedOn: confirmation.submittedAt || at.slice(0, 10),
      note: fullNote,
      updatedAt: at,
      journey: [event],
    };
  }

  const updatedApplications = [
    ...currentApplications.filter((a) => a.schemeId !== confirmation.schemeId),
    targetApp,
  ];

  return {
    updatedApplications,
    newEvent: event,
  };
}
