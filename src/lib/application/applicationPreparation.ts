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

// Domain validation helper for official government web properties
export function verifyOfficialPortalUrl(url?: string): {
  isVerifiedGovtDomain: boolean;
  domain: string;
  isSecure: boolean;
} {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isVerifiedGovtDomain: false, domain: '', isSecure: false };
  }

  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.toLowerCase();
    const isSecure = parsed.protocol === 'https:';

    // Recognised official Indian government and autonomous nodal authority domains
    const isGovDomain =
      hostname.endsWith('.gov.in') ||
      hostname.endsWith('.nic.in') ||
      hostname.endsWith('.gov') ||
      hostname.endsWith('.org.in') ||
      hostname.endsWith('.edu.in') ||
      hostname.endsWith('.ac.in') ||
      hostname.includes('msme.gov.in') ||
      hostname.includes('kvic.gov.in') ||
      hostname.includes('standupmitra.in') ||
      hostname.includes('udyamregistration.gov.in') ||
      hostname.includes('jansamarth.in') ||
      hostname.includes('sidbi.in');

    return {
      isVerifiedGovtDomain: isGovDomain,
      domain: hostname,
      isSecure,
    };
  } catch {
    return { isVerifiedGovtDomain: false, domain: url, isSecure: false };
  }
}

// Builds verifiable step-by-step instructions from verified scheme guidelines
export function getStepByStepApplicationGuide(scheme: Scheme, lang: 'en' | 'hi' = 'en'): StepInstruction[] {
  const mode = scheme.applicationMode || 'Online via Portal';
  const agency = scheme.department || scheme.intelligence?.application?.nodalAgency || scheme.sponsoringMinistry;

  if (mode === 'Online via Portal') {
    return [
      {
        stepNumber: 1,
        titleEn: 'Portal Registration & Authentication',
        titleHi: 'पोर्टल पंजीकरण एवं प्रमाणीकरण',
        descEn: `Register an entrepreneur account on the official portal (${scheme.officialPortalUrl ? new URL(scheme.officialPortalUrl).hostname : 'official portal'}) using mobile number and Aadhaar OTP verification.`,
        descHi: `आधिकारिक पोर्टल पर मोबाइल नंबर एवं आधार ओटीपी प्रमाणीकरण के माध्यम से उद्यमी खाता पंजीकृत करें।`,
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
        descEn: `Upload verified self-attested digital copies of all mandatory documents (${scheme.requiredDocuments?.length || 0} statutory documents mandated).`,
        descHi: `सभी अनिवार्य दस्तावेजों की सत्यापित स्व-प्रमाणित डिजिटल प्रतियां अपलोड करें (${scheme.requiredDocuments?.length || 0} वैधानिक दस्तावेज आवश्यक)।`,
        isMandatory: true,
      },
      {
        stepNumber: 4,
        titleEn: 'Final Review & e-Sign Submission',
        titleHi: 'अंतिम समीक्षा एवं ई-हस्ताक्षर प्रस्तुति',
        descEn: 'Review the generated application preview carefully before digital submission. Once submitted, changes cannot be made.',
        descHi: 'डिजिटल प्रस्तुति से पूर्व उत्पन्न आवेदन पूर्वावलोकन की सावधानीपूर्वक समीक्षा करें। एक बार प्रस्तुत करने के बाद बदलाव संभव नहीं है।',
        isMandatory: true,
      },
      {
        stepNumber: 5,
        titleEn: 'Record Official Acknowledgement Number',
        titleHi: 'आधिकारिक पावती संख्या सुरक्षित रखें',
        descEn: 'Download the submission PDF and record your Application / Acknowledgement Reference Number for departmental follow-up.',
        descHi: 'प्रस्तुति पीडीएफ डाउनलोड करें और विभागीय अनुवर्ती कार्रवाई हेतु अपनी आवेदन / पावती संदर्भ संख्या सुरक्षित रखें।',
        isMandatory: true,
      },
    ];
  }

  if (mode === 'Hybrid') {
    return [
      {
        stepNumber: 1,
        titleEn: 'Online Preliminary Application Filing',
        titleHi: 'ऑनलाइन प्रारंभिक आवेदन प्रस्तुति',
        descEn: `File the electronic preliminary application on ${scheme.officialPortalUrl ? new URL(scheme.officialPortalUrl).hostname : 'the official portal'}.`,
        descHi: `आधिकारिक पोर्टल पर इलेक्ट्रॉनिक प्रारंभिक आवेदन जमा करें।`,
        isMandatory: true,
      },
      {
        stepNumber: 2,
        titleEn: 'Download System-Generated Application Dossier',
        titleHi: 'सिस्टम द्वारा जनरेटेड आवेदन डोजियर डाउनलोड करें',
        descEn: 'Print the system-generated acknowledgement receipt and summary project profile.',
        descHi: 'सिस्टम जनरेटेड पावती रसीद एवं सारांश परियोजना प्रोफ़ाइल का प्रिंट लें।',
        isMandatory: true,
      },
      {
        stepNumber: 3,
        titleEn: 'Bank Branch / Nodal Agency Verification',
        titleHi: 'बैंक शाखा / नोडल एजेंसी सत्यापन',
        descEn: 'Present the physical dossier along with original identity and business documents to the designated bank branch or task force committee for appraisal.',
        descHi: 'मूल पहचान एवं व्यवसाय दस्तावेजों के साथ भौतिक डोजियर निर्दिष्ट बैंक शाखा या टास्क फोर्स समिति के समक्ष मूल्यांकन हेतु प्रस्तुत करें।',
        isMandatory: true,
        agency,
      },
    ];
  }

  // Offline / DIC / Bank Channel mode
  return [
    {
      stepNumber: 1,
      titleEn: 'Procure Official Application Form',
      titleHi: 'आधिकारिक आवेदन प्रपत्र प्राप्त करें',
      descEn: `Visit your nearest District Industries Centre (DIC), Khadi Board, or nodal desk of ${agency} to collect the physical application dossier.`,
      descHi: `भौतिक आवेदन प्रपत्र प्राप्त करने हेतु अपने निकटतम जिला उद्योग केंद्र (DIC) या ${agency} के नोडल कार्यालय में संपर्क करें।`,
      isMandatory: true,
      agency,
    },
    {
      stepNumber: 2,
      titleEn: 'Complete Form & Collate Physical Dossier',
      titleHi: 'प्रपत्र पूर्ण करें एवं भौतिक दस्तावेज संलग्न करें',
      descEn: 'Fill all sections in clear block letters and attach self-attested passport photographs and mandated statutory certificates.',
      descHi: 'सभी खंडों को स्पष्ट अक्षरों में भरें और स्व-प्रमाणित पासपोर्ट आकार के चित्र एवं निर्धारित वैधानिक प्रमाणपत्र संलग्न करें।',
      isMandatory: true,
    },
    {
      stepNumber: 3,
      titleEn: 'Submit at Designated Desk & Obtain Stamp',
      titleHi: 'निर्धारित पटल पर जमा कर मुहरयुक्त पावती लें',
      descEn: 'Submit the dossier to the designated nodal officer in person and obtain a signed, date-stamped counterfoil acknowledgment.',
      descHi: 'दस्तावेज व्यक्तिगत रूप से नोडल अधिकारी के समक्ष प्रस्तुत करें और हस्ताक्षरित, मुहरयुक्त पावती रसीद प्राप्त करें।',
      isMandatory: true,
      agency,
    },
  ];
}

// Computes the 4-Pillar Workspace Readiness
export function calculateWorkspaceReadiness(
  matchResult: MatchResult,
  userProfile: UserProfile,
  preparedDocIds: string[],
  scheme: Scheme,
  lang: 'en' | 'hi' = 'en'
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
  const fundingFit = evaluateFundingFit(scheme, userProfile, lang);
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
    procScore = 85;
    procState = 'SATISFIED';
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

  return {
    overallScore: rawScore,
    state,
    labelEn,
    labelHi,
    summaryEn,
    summaryHi,
    pillars: [eligibilityPillar, docPillar, financialPillar, processPillar],
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
  lang?: 'en' | 'hi';
}): ApplicationWorkspace {
  const { scheme, userProfile, matchResult, preparedDocIds, trackedApp, lang = 'en' } = input;
  const portalVerification = verifyOfficialPortalUrl(scheme.officialPortalUrl);
  const instructions = getStepByStepApplicationGuide(scheme, lang);
  const readiness = calculateWorkspaceReadiness(matchResult, userProfile, preparedDocIds, scheme, lang);

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
