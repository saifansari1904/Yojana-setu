/**
 * Rejection Risk Guidance Data
 *
 * Qualitative guidance on the most common procedural reasons government
 * scheme applications are returned, queried, or rejected — incomplete or
 * defective project reports, missing statutory certificates, absent banking
 * records, and similar documentation gaps — together with the practical
 * remedy for each.
 *
 * IMPORTANT: This file intentionally contains NO approval rates, rejection
 * percentages, sample sizes, or processing-time statistics. No official
 * source publishes verified per-scheme approval statistics that Yojana Setu
 * can stand behind, so none are shown to citizens. The causes and remedies
 * below are preparation guidance only, drawn from scheme guidelines and
 * standard appraisal practice — not statistical claims.
 */

export interface RejectionRiskFactor {
  id: string;
  causeEn: string;
  causeHi: string;
  /** Document-name keywords that indicate this risk is addressed. */
  mitigatingKeywords: string[];
  remedyEn: string;
  remedyHi: string;
}

/**
 * Common procedural rejection causes across Indian credit-linked and
 * grant schemes.
 */
export const COMMON_REJECTION_FACTORS: RejectionRiskFactor[] = [
  {
    id: 'dpr_financial_defect',
    causeEn: 'Defective or incomplete Detailed Project Report (DPR) / Financial Feasibility',
    causeHi: 'त्रुटिपूर्ण या अधूरी विस्तृत परियोजना रिपोर्ट (डीपीआर) / वित्तीय व्यवहार्यता',
    mitigatingKeywords: ['dpr', 'project report', 'quotation', 'machinery', 'feasibility', 'balance sheet'],
    remedyEn: 'Provide an itemized DPR with verified supplier machinery quotations and working capital estimates.',
    remedyHi: 'मशीनरी कोटेशन एवं कार्यशील पूंजी अनुमानों के साथ मदवार डीपीआर संलग्न करें।',
  },
  {
    id: 'caste_income_statutory_mismatch',
    causeEn: 'Incomplete or unverified Statutory Category / Domicile / Income proofs',
    causeHi: 'अपूर्ण या असत्यापित वैधानिक श्रेणी / निवास / आय प्रमाण पत्र',
    mitigatingKeywords: ['caste', 'community', 'income', 'domicile', 'nativity', 'residence'],
    remedyEn: 'Submit competent authority digital caste/income certificate with valid barcoded verification.',
    remedyHi: 'सक्षम प्राधिकारी द्वारा जारी वैध बारकोडयुक्त डिजिटल जाति/आय प्रमाण पत्र प्रस्तुत करें।',
  },
  {
    id: 'banking_track_record',
    causeEn: 'Lack of banking transaction continuity or unverified account statement',
    causeHi: 'बैंक लेन-देन निरंतरता का अभाव या असत्यापित खाता विवरण',
    mitigatingKeywords: ['bank', 'passbook', 'statement', 'account', 'financial'],
    remedyEn: 'Upload clear 6-month operational bank statement showing active commercial or personal flow.',
    remedyHi: 'सक्रिय वित्तीय प्रवाह दर्शाने वाला स्पष्ट 6 माह का बैंक विवरण अपलोड करें।',
  },
  {
    id: 'msme_enterprise_registration',
    causeEn: 'Missing formal enterprise identity (Udyam MSME / Trade License)',
    causeHi: 'औपचारिक उद्यम पहचान (उद्यम एमएसएमई / ट्रेड लाइसेंस) का अभाव',
    mitigatingKeywords: ['udyam', 'msme', 'registration', 'license', 'trade'],
    remedyEn: 'Furnish active Udyam Registration Certificate to activate statutory priority appraisal.',
    remedyHi: 'वैधानिक प्राथमिकता मूल्यांकन हेतु सक्रिय उद्यम पंजीकरण प्रमाण पत्र संलग्न करें।',
  },
  {
    id: 'kyc_mismatch',
    causeEn: 'Demographic discrepancies in Aadhaar / PAN identity documents',
    causeHi: 'आधार / पैन पहचान दस्तावेजों में जनसांख्यिकीय विवरण बेमेल',
    mitigatingKeywords: ['aadhaar', 'pan', 'identity', 'voter'],
    remedyEn: 'Ensure name, date of birth, and father/spouse name match exactly across Aadhaar and PAN.',
    remedyHi: 'सुनिश्चित करें कि नाम, जन्मतिथि और पिता/पति का नाम आधार और पैन में हूबहू मेल खाते हों।',
  },
];

/**
 * Scheme-specific procedural rejection causes, from scheme guidelines.
 * Qualitative guidance only — no statistics are attached to these.
 */
export const SCHEME_SPECIFIC_REJECTION_FACTORS: Record<string, RejectionRiskFactor[]> = {
  'pmegp-msme': [
    {
      id: 'pmegp_dpr',
      causeEn: 'Defective Project Report without vendor machinery quotation',
      causeHi: 'विक्रेता मशीनरी कोटेशन के बिना त्रुटिपूर्ण परियोजना रिपोर्ट',
      mitigatingKeywords: ['dpr', 'project report', 'quotation'],
      remedyEn: 'Attach certified DPR with GST-compliant equipment quotations.',
      remedyHi: 'जीएसटी-अनुपालक उपकरण कोटेशन के साथ प्रमाणित डीपीआर संलग्न करें।',
    },
    {
      id: 'pmegp_caste_quota',
      causeEn: 'Missing category certificate claiming special 35% margin subsidy',
      causeHi: 'विशेष 35% मार्जिन सब्सिडी दावा करने वाला श्रेणी प्रमाण पत्र गायब',
      mitigatingKeywords: ['caste', 'community', 'special category'],
      remedyEn: 'Provide Tahsildar/e-District issued digital caste/category certificate.',
      remedyHi: 'तहसीलदार/ई-डिस्ट्रिक्ट द्वारा जारी डिजिटल जाति/श्रेणी प्रमाण पत्र प्रस्तुत करें।',
    },
    {
      id: 'pmegp_edp',
      causeEn: 'Lack of mandatory Entrepreneurship Development Programme (EDP) training',
      causeHi: 'अनिवार्य उद्यमिता विकास कार्यक्रम (ईडीपी) प्रशिक्षण का अभाव',
      mitigatingKeywords: ['edp', 'training', 'rseti'],
      remedyEn: 'Complete 10-day RSETI/e-EDP online module prior to bank sanction release.',
      remedyHi: 'बैंक स्वीकृति जारी होने से पूर्व 10-दिवसीय आरसेटी/ई-ईडीपी मॉड्यूल पूरा करें।',
    },
    {
      id: 'pmegp_kyc',
      causeEn: 'Aadhaar demographic mismatch with bank passbook records',
      causeHi: 'बैंक पासबुक रिकॉर्ड के साथ आधार विवरण बेमेल',
      mitigatingKeywords: ['aadhaar', 'bank', 'passbook'],
      remedyEn: 'Verify matching name spellings between Aadhaar card and bank account.',
      remedyHi: 'आधार कार्ड और बैंक खाते के बीच नाम की स्पेलिंग का मिलान सत्यापित करें।',
    },
  ],
  'stand-up-india': [
    {
      id: 'su_margin_shortfall',
      causeEn: 'Promoter margin contribution proof below mandatory 10-15%',
      causeHi: 'प्रवर्तक मार्जिन अंशदान प्रमाण अनिवार्य 10-15% से कम',
      mitigatingKeywords: ['bank', 'margin', 'balance sheet', 'financial'],
      remedyEn: 'Demonstrate required unencumbered promoter equity through bank statement.',
      remedyHi: 'बैंक विवरण के माध्यम से आवश्यक प्रवर्तक इक्विटी स्पष्ट प्रदर्शित करें।',
    },
    {
      id: 'su_greenfield_proof',
      causeEn: 'Failure to establish Greenfield enterprise nature (first-time venture)',
      causeHi: 'ग्रीनफील्ड उद्यम (प्रथम बार उद्यम) स्थापित करने में विफलता',
      mitigatingKeywords: ['project report', 'udyam', 'premises', 'rent'],
      remedyEn: 'Submit detailed project report confirming new manufacturing or services unit.',
      remedyHi: 'नई विनिर्माण या सेवा इकाई की पुष्टि करने वाली परियोजना रिपोर्ट प्रस्तुत करें।',
    },
    {
      id: 'su_category_proof',
      causeEn: 'Unverified SC/ST or Women ownership documentation (must exceed 51%)',
      causeHi: 'असत्यापित एससी/एसटी या महिला स्वामित्व दस्तावेज (51% से अधिक अनिवार्य)',
      mitigatingKeywords: ['caste', 'aadhaar', 'partnership'],
      remedyEn: 'Furnish valid category certificate or women promoter partnership deed.',
      remedyHi: 'वैध श्रेणी प्रमाण पत्र या महिला प्रवर्तक साझेदारी विलेख प्रस्तुत करें।',
    },
    {
      id: 'su_cibil_banking',
      causeEn: 'Unreconciled liabilities on prior personal credit lines',
      causeHi: 'पूर्व व्यक्तिगत ऋण खातों में असमाधानित देनदारियां',
      mitigatingKeywords: ['bank', 'pan', 'itr'],
      remedyEn: 'Provide clean 6-month bank statements with active regularized standing.',
      remedyHi: 'सक्रिय नियमित स्थिति दर्शाने वाला 6 माह का बैंक विवरण संलग्न करें।',
    },
  ],
  'mudra-yojana': [
    {
      id: 'mudra_quotation',
      causeEn: 'Lack of supplier quotation for Kishore/Tarun equipment purchase',
      causeHi: 'किशोर/तरुण उपकरण खरीद हेतु आपूर्तिकर्ता कोटेशन का अभाव',
      mitigatingKeywords: ['quotation', 'machinery', 'project report'],
      remedyEn: 'Attach official machinery/raw material vendor quote.',
      remedyHi: 'आधिकारिक मशीनरी/कच्चे माल का विक्रेता कोटेशन संलग्न करें।',
    },
    {
      id: 'mudra_premises',
      causeEn: 'Absence of commercial address proof or local trade clearance',
      causeHi: 'व्यावसायिक पता प्रमाण या स्थानीय व्यापार अनुमति का अभाव',
      mitigatingKeywords: ['address', 'premises', 'rent', 'electricity'],
      remedyEn: 'Upload electricity bill or registered rent agreement of operating shop/unit.',
      remedyHi: 'दुकान/इकाई का बिजली बिल या पंजीकृत किरायानामा अपलोड करें।',
    },
    {
      id: 'mudra_kyc',
      causeEn: 'Incomplete Aadhaar or Voter ID proof of applicant',
      causeHi: 'आवेदक का अधूरा आधार या मतदाता पहचान पत्र प्रमाण',
      mitigatingKeywords: ['aadhaar', 'pan', 'identity'],
      remedyEn: 'Upload clear scanned front and back of Aadhaar and PAN card.',
      remedyHi: 'आधार एवं पैन कार्ड के दोनों पृष्ठों की स्पष्ट स्कैन प्रति अपलोड करें।',
    },
  ],
  'cgtmse-msme': [
    {
      id: 'cgtmse_udyam',
      causeEn: 'Missing active Udyam MSME Registration Certificate',
      causeHi: 'सक्रिय उद्यम एमएसएमई पंजीकरण प्रमाण पत्र का अभाव',
      mitigatingKeywords: ['udyam', 'msme', 'registration'],
      remedyEn: 'Register on udyamregistration.gov.in and upload certificate.',
      remedyHi: 'udyamregistration.gov.in पर पंजीकृत कर प्रमाणपत्र अपलोड करें।',
    },
    {
      id: 'cgtmse_audited_financials',
      causeEn: 'Unsubstantiated project financials or lack of CA certification',
      causeHi: 'अपुष्ट परियोजना वित्तीय आंकड़े या सीए प्रमाणन का अभाव',
      mitigatingKeywords: ['project report', 'financial', 'balance sheet', 'itr'],
      remedyEn: 'Submit CA certified project balance sheet and projected cash flows.',
      remedyHi: 'सीए प्रमाणित परियोजना बैलेंस शीट और नकदी प्रवाह अनुमान जमा करें।',
    },
    {
      id: 'cgtmse_kyc',
      causeEn: 'Promoter KYC or business address verification failure',
      causeHi: 'प्रवर्तक केवाईसी या व्यावसायिक पता सत्यापन विफलता',
      mitigatingKeywords: ['aadhaar', 'pan', 'address'],
      remedyEn: 'Upload verified commercial registration and PAN credentials.',
      remedyHi: 'सत्यापित व्यावसायिक पंजीकरण एवं पैन क्रेडेंशियल अपलोड करें।',
    },
  ],
};

/**
 * Returns the rejection-risk factors that apply to a scheme: the
 * scheme-specific set when one exists, otherwise the common set.
 */
export function getRejectionRiskFactorsForScheme(schemeId: string): RejectionRiskFactor[] {
  return SCHEME_SPECIFIC_REJECTION_FACTORS[schemeId] ?? COMMON_REJECTION_FACTORS;
}
