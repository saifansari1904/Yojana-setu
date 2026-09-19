/**
 * YOJANA SETU — ENTREPRENEUR PROFILE I18N
 *
 * Full 6-language translations for the Authoritative Entrepreneur Profile section:
 * - English (en)
 * - Hindi (hi)
 * - Tamil (ta)
 * - Telugu (te)
 * - Kannada (kn)
 * - Malayalam (ml)
 */

import type { Language } from './types';

export interface ProfileI18nStrings {
  navLabel: string;
  pageBadge: string;
  pageTitle: string;
  pageSubtitle: string;
  gazetteVerified: string;
  ruleEngineActive: string;
  sourceOfTruthNotice: string;

  // Completeness Card
  completenessTitle: string;
  completenessSubtitle: string;
  completenessScore: string;
  fullyCompleteBadge: string;
  missingFieldsHeader: string;
  completeFieldsPrompt: string;
  completeFieldBtn: string;

  // Personal Section
  personalTitle: string;
  personalSubtitle: string;
  applicantName: string;
  category: string;
  age: string;
  ageBracket: string;
  gender: string;
  annualIncome: string;
  state: string;
  district: string;
  ruralUrban: string;
  rural: string;
  urban: string;

  // Business Section
  businessTitle: string;
  businessSubtitle: string;
  businessName: string;
  businessIdea: string;
  sector: string;
  subSector: string;
  businessStage: string;
  entityType: string;
  operationalStatus: string;
  businessLocation: string;
  interstateUnit: string;
  experienceYears: string;

  // Financial Section
  financialTitle: string;
  financialSubtitle: string;
  totalProjectCost: string;
  ownInvestment: string;
  fundingGap: string;
  turnover: string;
  primaryNeed: string;
  secondaryNeeds: string;
  notSpecified: string;

  // Registration Section
  registrationTitle: string;
  registrationSubtitle: string;
  registrationStatus: string;
  udyam: string;
  udyamPortal: string;
  gst: string;
  tradeLicense: string;
  bankAccount: string;
  panCard: string;
  msmeCategory: string;
  statusRegistered: string;
  statusNotRegistered: string;
  statusUnknown: string;

  // Documents Section
  documentsTitle: string;
  documentsSubtitle: string;
  docPrepared: string;
  docMissing: string;
  docsReadyCount: string;
  toggleHelp: string;

  // Impact Section
  impactTitle: string;
  impactSubtitle: string;
  eligibleCount: string;
  nearMatchesCount: string;
  viewMatchesBtn: string;
  viewDashboardBtn: string;
  viewTrackerBtn: string;
  syncNotice: string;

  // Action Buttons & Modals
  editProfileBtn: string;
  printSummaryBtn: string;
  retakeAssessmentBtn: string;
  saveChanges: string;
  cancel: string;
  editModalTitle: string;
  tabPersonal: string;
  tabBusiness: string;
  tabFinancial: string;
  tabRegistration: string;
  saveSuccess: string;
  validationError: string;

  // Print View
  printHeader: string;
  printRecordTitle: string;
  printTimestamp: string;
  printDisclaimer: string;
  printCloseBtn: string;
  printActionBtn: string;
  noProfilePrompt: string;
  startAssessmentBtn: string;

  // Photo Upload & Avatar
  uploadPhotoTitle: string;
  uploadPhotoDesc: string;
  choosePhotoBtn: string;
  removePhotoBtn: string;
  confirmPhotoBtn: string;
  cancelPhotoBtn: string;
  photoSizeError: string;
  photoTypeError: string;
  photoPreviewAlt: string;
  photoUploadedSuccess: string;
  photoRemovedSuccess: string;
  changePhotoPrompt: string;
  editPhotoAria: string;
}

export const PROFILE_I18N: Record<Language, ProfileI18nStrings> = {
  en: {
    navLabel: 'Profile',
    pageBadge: 'Citizen Identity Record',
    pageTitle: 'Entrepreneur Profile',
    pageSubtitle: 'Persistent Single Source of Truth for Scheme Discovery, Eligibility & Applications',
    gazetteVerified: 'Gazette & Policy Aligned',
    ruleEngineActive: 'Rule-Based Verification Active',
    sourceOfTruthNotice: 'This profile serves as your single source of truth across Yojana Setu. Any update instantly recalculates scheme matches, eligibility audits, and application workspaces.',

    completenessTitle: 'Profile Completeness',
    completenessSubtitle: 'Detailed profile information unlocks sharper matching and reduces application rejections.',
    completenessScore: 'Complete',
    fullyCompleteBadge: '100% Complete — Optimum Discovery Ready',
    missingFieldsHeader: 'Recommended Additional Fields',
    completeFieldsPrompt: 'Provide these details to unlock higher precision recommendations:',
    completeFieldBtn: 'Update',

    personalTitle: 'Personal & Demographics',
    personalSubtitle: 'Core identity attributes governing statutory reservations, quotas, and concessions.',
    applicantName: 'Citizen / Entrepreneur Name',
    category: 'Social Category',
    age: 'Age',
    ageBracket: 'Statutory Age Bracket',
    gender: 'Gender',
    annualIncome: 'Annual Household Income',
    state: 'Domicile State / UT',
    district: 'Home District',
    ruralUrban: 'Area Classification',
    rural: 'Rural Area (Qualifies for higher subsidy)',
    urban: 'Urban Area',

    businessTitle: 'Business & Enterprise Profile',
    businessSubtitle: 'Operational stage, domain taxonomy, and formal structural parameters.',
    businessName: 'Enterprise / Unit Name',
    businessIdea: 'Business Activity / Project Concept',
    sector: 'Industry Sector / Domain',
    subSector: 'Sub-Sector / Specific Trade',
    businessStage: 'Enterprise Lifecycle Stage',
    entityType: 'Legal Entity Structure',
    operationalStatus: 'Operational Status',
    businessLocation: 'Operating State / Territory',
    interstateUnit: 'Interstate Enterprise Unit',
    experienceYears: 'Experience in Sector',

    financialTitle: 'Financial Architecture & Capital Need',
    financialSubtitle: 'Project cost, own margin contribution, and calculated funding gap.',
    totalProjectCost: 'Total Project Cost',
    ownInvestment: 'Promoter Margin / Own Capital',
    fundingGap: 'Calculated Funding Gap',
    turnover: 'Annual Turnover',
    primaryNeed: 'Primary Support Priority',
    secondaryNeeds: 'Additional Support Requirements',
    notSpecified: 'Not Specified',

    registrationTitle: 'MSME Formalization & Statutory Registrations',
    registrationSubtitle: 'Formalization milestones required for credit guarantees, subsidy claims, and tenders.',
    registrationStatus: 'Formalization Status',
    udyam: 'Udyam MSME Registration',
    udyamPortal: 'Official Udyam Portal',
    gst: 'GSTIN Registration',
    tradeLicense: 'Local Trade / Shop License',
    bankAccount: 'Dedicated Business Bank Account',
    panCard: 'Business / Proprietor PAN',
    msmeCategory: 'MSME Category',
    statusRegistered: 'Registered',
    statusNotRegistered: 'Not Registered',
    statusUnknown: 'To Be Verified',

    documentsTitle: 'Reusable Document Readiness Vault',
    documentsSubtitle: 'Gathered documents automatically populate checklists across all scheme applications.',
    docPrepared: 'Ready & Gathered',
    docMissing: 'Pending Gathering',
    docsReadyCount: 'Documents Prepared',
    toggleHelp: 'Click any document to toggle your preparation status.',

    impactTitle: 'Portal Synchronization & Scheme Impact',
    impactSubtitle: 'Real-time impact of your verified profile on scheme discovery and workflows.',
    eligibleCount: 'Schemes You Directly Qualify For',
    nearMatchesCount: 'Near Matches with Potential Gaps',
    viewMatchesBtn: 'Explore Matched Schemes',
    viewDashboardBtn: 'Open Command Center',
    viewTrackerBtn: 'Application Tracker',
    syncNotice: 'All matching engine scores, gap audits, and preparation workspaces stay synchronized with this record.',

    editProfileBtn: 'Edit Profile',
    printSummaryBtn: 'Print Summary Card',
    retakeAssessmentBtn: 'Retake Full Assessment',
    saveChanges: 'Save Profile Changes',
    cancel: 'Cancel',
    editModalTitle: 'Edit Entrepreneur Profile',
    tabPersonal: 'Personal',
    tabBusiness: 'Business',
    tabFinancial: 'Financial',
    tabRegistration: 'Registrations',
    saveSuccess: 'Profile updated successfully! Scheme matches and eligibility have been recalculated.',
    validationError: 'Please check the entered values and correct any invalid fields.',

    printHeader: 'GOVERNMENT OF INDIA / STATE NODAL FACILITATION DESK',
    printRecordTitle: 'CITIZEN ENTREPRENEUR STATUTORY SUMMARY RECORD',
    printTimestamp: 'Generated from Yojana Setu Portal on',
    printDisclaimer: 'This document reflects self-attested citizen data evaluated against official scheme gazette notifications in the Yojana Setu deterministic rule engine. It is intended for bank credit review and DIC nodal counseling.',
    printCloseBtn: 'Close Preview',
    printActionBtn: 'Print / Save PDF',
    noProfilePrompt: 'No citizen profile has been established yet. Complete a brief 3-minute assessment to establish your persistent profile and discover eligible government schemes.',
    startAssessmentBtn: 'Start Eligibility Assessment',

    uploadPhotoTitle: 'Upload Profile Photo',
    uploadPhotoDesc: 'Upload a clear passport-style or professional portrait photo (JPG, JPEG, or PNG, up to 3MB).',
    choosePhotoBtn: 'Choose Photo',
    removePhotoBtn: 'Remove Photo',
    confirmPhotoBtn: 'Save Photo',
    cancelPhotoBtn: 'Cancel',
    photoSizeError: 'File size exceeds 3MB limit. Please upload a smaller photo.',
    photoTypeError: 'Unsupported file type. Please upload a JPG, JPEG, or PNG image.',
    photoPreviewAlt: 'Profile photo preview',
    photoUploadedSuccess: 'Profile photo updated successfully!',
    photoRemovedSuccess: 'Profile photo removed. Initial avatar restored.',
    changePhotoPrompt: 'Change Photo',
    editPhotoAria: 'Change profile photo',
  },
  hi: {
    navLabel: 'प्रोफ़ाइल',
    pageBadge: 'नागरिक पहचान अभिलेख',
    pageTitle: 'उद्यमी प्रोफ़ाइल',
    pageSubtitle: 'योजना खोज, पात्रता एवं आवेदन हेतु स्थायी विश्वसनीय स्रोत',
    gazetteVerified: 'राजपत्र एवं नीति सत्यापित',
    ruleEngineActive: 'नियम-आधारित सत्यापन सक्रिय',
    sourceOfTruthNotice: 'यह प्रोफ़ाइल योजना सेतु पर आपका स्थायी प्रमाण है। इसमें कोई भी बदलाव तुरंत योजना मिलान, पात्रता ऑडिट और आवेदन कार्यक्षेत्र को अपडेट करता है।',

    completenessTitle: 'प्रोफ़ाइल पूर्णता',
    completenessSubtitle: 'विस्तृत प्रोफ़ाइल सटीक योजना मिलान सुनिश्चित करती है एवं आवेदन निरस्तीकरण रोकती है।',
    completenessScore: 'पूर्ण',
    fullyCompleteBadge: '100% पूर्ण — इष्टतम योजना खोज तैयार',
    missingFieldsHeader: 'अनुशंसित अतिरिक्त विवरण',
    completeFieldsPrompt: 'अधिक सटीक सिफारिशों हेतु इन विवरणों को दर्ज करें:',
    completeFieldBtn: 'अद्यतन करें',

    personalTitle: 'व्यक्तिगत एवं जनसांख्यिकीय विवरण',
    personalSubtitle: 'वैधानिक आरक्षण, कोटा एवं छूट निर्धारित करने वाले मुख्य व्यक्तिगत घटक।',
    applicantName: 'नागरिक / उद्यमी का नाम',
    category: 'सामाजिक श्रेणी',
    age: 'आयु',
    ageBracket: 'वैधानिक आयु सीमा',
    gender: 'लिंग',
    annualIncome: 'वार्षिक पारिवारिक आय',
    state: 'निवास राज्य / केंद्रशासित प्रदेश',
    district: 'गृह जनपद',
    ruralUrban: 'क्षेत्र वर्गीकरण',
    rural: 'ग्रामीण क्षेत्र (अधिक सब्सिडी हेतु पात्र)',
    urban: 'शहरी क्षेत्र',

    businessTitle: 'व्यवसाय एवं उद्यम प्रोफ़ाइल',
    businessSubtitle: 'परिचालन चरण, उद्योग वर्गीकरण एवं विधिक संरचनात्मक पैरामीटर।',
    businessName: 'उद्यम / इकाई का नाम',
    businessIdea: 'व्यावसायिक गतिविधि / विचार',
    sector: 'उद्योग क्षेत्र / श्रेणी',
    subSector: 'उप-क्षेत्र / विशिष्ट कार्य',
    businessStage: 'उद्यम जीवनचक्र चरण',
    entityType: 'विधिक संरचना',
    operationalStatus: 'परिचालन स्थिति',
    businessLocation: 'कार्यस्थल राज्य / क्षेत्र',
    interstateUnit: 'अंतरराज्यीय उद्यम इकाई',
    experienceYears: 'क्षेत्र में कार्य अनुभव',

    financialTitle: 'वित्तीय संरचना एवं पूंजी आवश्यकता',
    financialSubtitle: 'परियोजना लागत, स्वयं का अंशदान एवं अनुमानित वित्तीय अंतर।',
    totalProjectCost: 'कुल परियोजना लागत',
    ownInvestment: 'प्रवर्तक पूंजी / स्वयं का निवेश',
    fundingGap: 'अनुमानित वित्तीय आवश्यकता',
    turnover: 'वार्षिक कारोबार',
    primaryNeed: 'प्राथमिक आवश्यकता',
    secondaryNeeds: 'अतिरिक्त सहायता आवश्यकताएं',
    notSpecified: 'अनिर्दिष्ट',

    registrationTitle: 'एमएसएमई औपचारिकीकरण एवं वैधानिक पंजीकरण',
    registrationSubtitle: 'क्रेडिट गारंटी, ब्याज छूट एवं सरकारी निविदाओं हेतु आवश्यक पंजीकरण स्थिति।',
    registrationStatus: 'पंजीकरण स्थिति',
    udyam: 'उद्यम एमएसएमई पंजीकरण',
    udyamPortal: 'आधिकारिक उद्यम पोर्टल',
    gst: 'जीएसटी पंजीकरण (GSTIN)',
    tradeLicense: 'स्थानीय व्यापार / दुकान लाइसेंस',
    bankAccount: 'व्यावसायिक चालू बैंक खाता',
    panCard: 'उद्यम / स्वामी पैन कार्ड',
    msmeCategory: 'एमएसएमई श्रेणी',
    statusRegistered: 'पंजीकृत',
    statusNotRegistered: 'पंजीकृत नहीं',
    statusUnknown: 'सत्यापन योग्य',

    documentsTitle: 'पुनः प्रयोज्य दस्तावेज़ वॉल्ट',
    documentsSubtitle: 'तैयार दस्तावेज़ सभी योजना आवेदनों की चेकलिस्ट में स्वतः जुड़ जाते हैं।',
    docPrepared: 'तैयार एवं सत्यापित',
    docMissing: 'एकत्र करना शेष',
    docsReadyCount: 'तैयार दस्तावेज़',
    toggleHelp: 'तैयारी की स्थिति बदलने हेतु दस्तावेज़ पर क्लिक करें।',

    impactTitle: 'पोर्टल समन्वय एवं योजना प्रभाव',
    impactSubtitle: 'आपकी सत्यापित प्रोफ़ाइल का योजना खोज एवं कार्यप्रवाह पर सीधा प्रभाव।',
    eligibleCount: 'सीधे पात्र योजनाएं',
    nearMatchesCount: 'निकटतम मिलान (संभावित अंतर सहित)',
    viewMatchesBtn: 'पात्र योजनाएं देखें',
    viewDashboardBtn: 'कमांड सेंटर खोलें',
    viewTrackerBtn: 'आवेदन ट्रैकर',
    syncNotice: 'सभी मिलान स्कोर, पात्रता ऑडिट और तैयारी कार्यक्षेत्र इस प्रोफ़ाइल से स्वतः समन्वयित रहते हैं।',

    editProfileBtn: 'प्रोफ़ाइल संपादित करें',
    printSummaryBtn: 'सारांश कार्ड प्रिंट करें',
    retakeAssessmentBtn: 'पूर्ण मूल्यांकन पुनः करें',
    saveChanges: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    editModalTitle: 'उद्यमी प्रोफ़ाइल संपादित करें',
    tabPersonal: 'व्यक्तिगत',
    tabBusiness: 'व्यवसाय',
    tabFinancial: 'वित्तीय',
    tabRegistration: 'पंजीकरण',
    saveSuccess: 'प्रोफ़ाइल सफलतापूर्वक अद्यतन हुई! योजना मिलान और पात्रता पुनः गणना की गई है।',
    validationError: 'कृपया दर्ज किए गए विवरणों की जांच करें और अमान्य फ़ील्ड्स को सुधारें।',

    printHeader: 'भारत सरकार / राज्य नोडल सुविधा केंद्र',
    printRecordTitle: 'नागरिक उद्यमी वैधानिक सारांश अभिलेख',
    printTimestamp: 'योजना सेतु पोर्टल द्वारा जनरेट किया गया:',
    printDisclaimer: 'यह दस्तावेज योजना सेतु नियम-आधारित इंजन द्वारा राजपत्र अधिसूचनाओं के आधार पर स्व-सत्यापित डेटा का निष्पक्ष विश्लेषण दर्शाता है। यह बैंक ऋण समीक्षा एवं डीआईसी परामर्श हेतु उपयोगी है।',
    printCloseBtn: 'बंद करें',
    printActionBtn: 'प्रिंट / पीडीएफ सहेजें',
    noProfilePrompt: 'अभी कोई नागरिक प्रोफ़ाइल उपलब्ध नहीं है। अपनी प्रोफ़ाइल बनाने और पात्र सरकारी योजनाओं की खोज हेतु 3 मिनट का मूल्यांकन पूरा करें।',
    startAssessmentBtn: 'पात्रता मूल्यांकन प्रारंभ करें',

    uploadPhotoTitle: 'प्रोफ़ाइल फ़ोटो अपलोड करें',
    uploadPhotoDesc: 'एक स्पष्ट पासपोर्ट आकार या व्यावसायिक फ़ोटो अपलोड करें (JPG, JPEG या PNG, 3MB तक)।',
    choosePhotoBtn: 'फ़ोटो चुनें',
    removePhotoBtn: 'फ़ोटो हटाएं',
    confirmPhotoBtn: 'फ़ोटो सहेजें',
    cancelPhotoBtn: 'रद्द करें',
    photoSizeError: 'फ़ाइल का आकार 3MB से अधिक है। कृपया छोटी फ़ोटो अपलोड करें।',
    photoTypeError: 'अमान्य फ़ॉर्मेट। कृपया केवल JPG, JPEG या PNG फ़ोटो चुनें।',
    photoPreviewAlt: 'प्रोफ़ाइल फ़ोटो पूर्वावलोकन',
    photoUploadedSuccess: 'प्रोफ़ाइल फ़ोटो सफलतापूर्वक अपडेट की गई!',
    photoRemovedSuccess: 'प्रोफ़ाइल फ़ोटो हटाई गई। पहला अक्षर अवतार बहाल किया गया।',
    changePhotoPrompt: 'फ़ोटो बदलें',
    editPhotoAria: 'प्रोफ़ाइल फ़ोटो बदलें',
  },
  ta: {
    navLabel: 'சுயவிவரம்',
    pageBadge: 'குடிமகன் அடையாளப் பதிவு',
    pageTitle: 'தொழில்முனைவோர் சுயவிவரம்',
    pageSubtitle: 'திட்டக் கண்டறிதல், தகுதி மற்றும் விண்ணப்பங்களுக்கான நிலையான உண்மை மூலம்',
    gazetteVerified: 'அரசாணை மற்றும் கொள்கை சரிபார்க்கப்பட்டது',
    ruleEngineActive: 'விதிகள் அடிப்படையிலான சரிபார்ப்பு இயங்குகிறது',
    sourceOfTruthNotice: 'இந்த சுயவிவரம் யோஜனா சேதுவில் உங்கள் நிலையான மூலமாக செயல்படுகிறது. இதில் செய்யப்படும் மாற்றங்கள் உடனடியாக அனைத்து திட்டப் பொருத்தங்களையும் தகுதிகளையும் புதுப்பிக்கும்.',

    completenessTitle: 'சுயவிவர முழுமை',
    completenessSubtitle: 'விரிவான விவரங்கள் துல்லியமான திட்டப் பொருத்தத்தை வழங்கி விண்ணப்ப நிராகரிப்பைத் தடுக்கிறது.',
    completenessScore: 'முழுமை',
    fullyCompleteBadge: '100% முழுமை — சிறந்த பொருத்தம் தயார்',
    missingFieldsHeader: 'பரிந்துரைக்கப்பட்ட கூடுதல் விவரங்கள்',
    completeFieldsPrompt: 'துல்லியமான பரிந்துரைகளுக்கு இந்த விவரங்களை உள்ளிடவும்:',
    completeFieldBtn: 'புதுப்பிக்கவும்',

    personalTitle: 'தனிநபர் மற்றும் புள்ளிவிவரங்கள்',
    personalSubtitle: 'சட்டரீதியான இடஒதுக்கீடு மற்றும் சலுகைகளை நிர்ணயிக்கும் முக்கிய தகவல்கள்.',
    applicantName: 'விண்ணப்பதாரர் பெயர்',
    category: 'சமூகப் பிரிவு',
    age: 'வயது',
    ageBracket: 'சட்டரீதியான வயது வரம்பு',
    gender: 'பாலினம்',
    annualIncome: 'ஆண்டு குடும்ப வருமானம்',
    state: 'வசிப்பிட மாநிலம் / யூனியன் பிரதேசம்',
    district: 'சொந்த மாவட்டம்',
    ruralUrban: 'பகுதி வகைப்பாடு',
    rural: 'கிராமப்புறம் (கூடுதல் மானியத்திற்கு தகுதி)',
    urban: 'நகர்ப்புறம்',

    businessTitle: 'வணிகம் மற்றும் நிறுவன விவரம்',
    businessSubtitle: 'இயக்க நிலை, தொழில் துறை மற்றும் சட்டக் கட்டமைப்பு அளவுருக்கள்.',
    businessName: 'நிறுவனத்தின் பெயர்',
    businessIdea: 'வணிக செயல்பாடு / யோசனை',
    sector: 'தொழில் துறை',
    subSector: 'துணைத் துறை / குறிப்பிட்ட வர்த்தகம்',
    businessStage: 'நிறுவன வாழ்க்கைச் சுழற்சி நிலை',
    entityType: 'சட்ட அமைப்பு',
    operationalStatus: 'செயல்பாட்டு நிலை',
    businessLocation: 'வணிக இடம் / மாநிலம்',
    interstateUnit: 'மாநிலங்களுக்கு இடையேயான பிரிவு',
    experienceYears: 'துறையில் அனுபவம்',

    financialTitle: 'நிதி கட்டமைப்பு மற்றும் தேவை',
    financialSubtitle: 'திட்டச் செலவு, சொந்த முதலீடு மற்றும் கணக்கிடப்பட்ட நிதி இடைவெளி.',
    totalProjectCost: 'மொத்த திட்டச் செலவு',
    ownInvestment: 'சொந்த முதலீடு',
    fundingGap: 'மதிப்பிடப்பட்ட நிதி இடைவெளி',
    turnover: 'ஆண்டு வருவாய் (விற்றுமுதல்)',
    primaryNeed: 'முதன்மைத் தேவை',
    secondaryNeeds: 'கூடுதல் ஆதரவுத் தேவைகள்',
    notSpecified: 'குறிப்பிடப்படவில்லை',

    registrationTitle: 'எம்எஸ்எம்இ முறைப்படுத்துதல் மற்றும் பதிவுகள்',
    registrationSubtitle: 'கடன் உத்தரவாதங்கள் மற்றும் மானியங்களுக்குத் தேவையான அதிகாரப்பூர்வ பதிவுகள்.',
    registrationStatus: 'பதிவு நிலை',
    udyam: 'உத்யம் எம்எஸ்எம்இ பதிவு',
    udyamPortal: 'அதிகாரப்பூர்வ உத்யம் தளம்',
    gst: 'ஜிஎஸ்டி பதிவு',
    tradeLicense: 'உள்ளூர் வணிக உரிமம்',
    bankAccount: 'வணிக நடப்புக் கணக்கு',
    panCard: 'பான் அட்டை',
    msmeCategory: 'எம்எஸ்எம்இ பிரிவு',
    statusRegistered: 'பதிவு செய்யப்பட்டது',
    statusNotRegistered: 'பதிவு செய்யப்படவில்லை',
    statusUnknown: 'சரிபார்க்கப்பட வேண்டும்',

    documentsTitle: 'மறுபயன்பாட்டு ஆவணப் பெட்டகம்',
    documentsSubtitle: 'சேகரிக்கப்பட்ட ஆவணங்கள் தானாகவே அனைத்து விண்ணப்பப் பட்டியல்களிலும் சேர்க்கப்படும்.',
    docPrepared: 'தயாராக உள்ளது',
    docMissing: 'தயார் செய்ய நிலுவையில்',
    docsReadyCount: 'தயாரான ஆவணங்கள்',
    toggleHelp: 'தயார் நிலையை மாற்ற ஆவணத்தின் மீது கிளிக் செய்யவும்.',

    impactTitle: 'தள ஒருங்கிணைப்பு மற்றும் திட்டத் தாக்கம்',
    impactSubtitle: 'உங்கள் சுயவிவரம் திட்டப் பொருத்தங்களை எவ்வாறு நேரடியாக வழிநடத்துகிறது.',
    eligibleCount: 'நீங்கள் தகுதிபெறும் திட்டங்கள்',
    nearMatchesCount: 'அருகிலுள்ள பொருத்தங்கள்',
    viewMatchesBtn: 'பொருத்தமான திட்டங்களை காண்க',
    viewDashboardBtn: 'டாஷ்போர்டை திறக்கவும்',
    viewTrackerBtn: 'விண்ணப்ப கண்காணிப்பகம்',
    syncNotice: 'அனைத்து கணக்கீடுகளும் மற்றும் தயார்நிலை பணியிடங்களும் இந்த சுயவிவரத்துடன் ஒத்திசைக்கப்பட்டுள்ளன.',

    editProfileBtn: 'சுயவிவரத்தைத் திருத்துக',
    printSummaryBtn: 'சுருக்க அட்டையை அச்சிடுக',
    retakeAssessmentBtn: 'முழு மதிப்பீட்டை மீண்டும் செய்க',
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
    cancel: 'ரத்துசெய்',
    editModalTitle: 'தொழில்முனைவோர் சுயவிவரத்தைத் திருத்துக',
    tabPersonal: 'தனிநபர்',
    tabBusiness: 'வணிகம்',
    tabFinancial: 'நிதி',
    tabRegistration: 'பதிவுகள்',
    saveSuccess: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது! திட்டப் பொருத்தங்கள் மறு கணக்கீடு செய்யப்பட்டன.',
    validationError: 'உள்ளிட்ட மதிப்புகளைச் சரிபார்த்து திருத்தவும்.',

    printHeader: 'இந்திய அரசு / மாநில நோடல் உதவி மையம்',
    printRecordTitle: 'குடிமகன் தொழில்முனைவோர் சட்ட சுருக்க அறிக்கை',
    printTimestamp: 'உருவாக்கப்பட்ட தேதி:',
    printDisclaimer: 'இந்த ஆவணம் யோஜனா சேதுவின் தன்னிச்சையான விதிகள் இயந்திரத்தின் மூலம் சரிபார்க்கப்பட்ட குடிமகன் தரவை பிரதிபலிக்கிறது. வங்கி கடன் மறுஆய்வு மற்றும் ஆலோசனைக்கு இது பயன்படும்.',
    printCloseBtn: 'மூடுக',
    printActionBtn: 'அச்சிடுக / PDF சேமிக்க',
    noProfilePrompt: 'இன்னும் சுயவிவரம் உருவாக்கப்படவில்லை. தகுதியான திட்டங்களைக் கண்டறிய 3 நிமிட மதிப்பீட்டை முடிக்கவும்.',
    startAssessmentBtn: 'தகுதி மதிப்பீட்டைத் தொடங்குக',

    uploadPhotoTitle: 'சுயவிவரப் புகைப்படத்தைப் பதிவேற்றவும்',
    uploadPhotoDesc: 'தெளிவான பாஸ்போர்ட் அல்லது தொழில்முறை புகைப்படத்தைப் பதிவேற்றவும் (JPG, JPEG அல்லது PNG, 3MB வரை).',
    choosePhotoBtn: 'புகைப்படத்தைத் தேர்ந்தெடுக்கவும்',
    removePhotoBtn: 'புகைப்படத்தை நீக்கு',
    confirmPhotoBtn: 'புகைப்படத்தைச் சேமி',
    cancelPhotoBtn: 'ரத்துசெய்',
    photoSizeError: 'கோப்பு அளவு 3MB-ஐ விட அதிகமாக உள்ளது. சிறிய புகைப்படத்தைத் தேர்ந்தெடுக்கவும்.',
    photoTypeError: 'தவறான வடிவம். JPG, JPEG அல்லது PNG புகைப்படத்தை மட்டுமே பதிவேற்றவும்.',
    photoPreviewAlt: 'சுயவிவரப் புகைப்பட முன்னோட்டம்',
    photoUploadedSuccess: 'சுயவிவரப் புகைப்படம் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது!',
    photoRemovedSuccess: 'சுயவிவரப் புகைப்படம் நீக்கப்பட்டது. முதல் எழுத்து அவதார் மீட்டமைக்கப்பட்டது.',
    changePhotoPrompt: 'புகைப்படத்தை மாற்று',
    editPhotoAria: 'சுயவிவரப் புகைப்படத்தை மாற்றவும்',
  },
  te: {
    navLabel: 'ప్రొఫైల్',
    pageBadge: 'పౌర గుర్తింపు రికార్డు',
    pageTitle: 'వ్యవస్థాపక ప్రొఫైల్',
    pageSubtitle: 'పథకాల గుర్తింపు, అర్హత మరియు దరఖాస్తులకు నిరంతర ప్రామాణిక మూలం',
    gazetteVerified: 'గెజిట్ మరియు విధాన ధృవీకరించబడింది',
    ruleEngineActive: 'నియమాల ఆధారిత ధృవీకరణ క్రియాశీలం',
    sourceOfTruthNotice: 'ఈ ప్రొఫైల్ యోజనా సేతులో మీ స్థిరమైన రికార్డుగా పనిచేస్తుంది. ఇందులో మార్పులు తక్షణమే అన్ని పథకాల సరిపోలికలను అప్‌డేట్ చేస్తాయి.',

    completenessTitle: 'ప్రొఫైల్ సంపూర్ణత',
    completenessSubtitle: 'పూర్తి వివరాలు ఖచ్చితమైన పథక సరిపోలికను అందించి దరఖాస్తు తిరస్కరణను నిరోధిస్తాయి.',
    completenessScore: 'పూర్తయింది',
    fullyCompleteBadge: '100% పూర్తయింది — ఉత్తమ సరిపోలిక సిద్ధం',
    missingFieldsHeader: 'సిఫార్సు చేయబడిన అదనపు వివరాలు',
    completeFieldsPrompt: 'ఖచ్చితమైన సిఫార్సుల కోసం ఈ వివరాలను నమోదు చేయండి:',
    completeFieldBtn: 'అప్‌డేట్ చేయండి',

    personalTitle: 'వ్యక్తిగత మరియు జనాభా వివరాలు',
    personalSubtitle: 'చట్టపరమైన రిజర్వేషన్లు, కోటా మరియు రాయితీలను నిర్ణయించే కీలక అంశాలు.',
    applicantName: 'దరఖాస్తుదారు పేరు',
    category: 'సామాజిక వర్గం',
    age: 'వయస్సు',
    ageBracket: 'చట్టపరమైన వయోపరిమితి',
    gender: 'లింగం',
    annualIncome: 'వార్షిక కుటుంబ ఆదాయం',
    state: 'నివాస రాష్ట్రం / కేంద్రపాలిత ప్రాంతం',
    district: 'సొంత జిల్లా',
    ruralUrban: 'ప్రాంత వర్గీకరణ',
    rural: 'గ్రామీణ ప్రాంతం (అదనపు సబ్సిడీకి అర్హత)',
    urban: 'పట్టణ ప్రాంతం',

    businessTitle: 'వ్యాపార మరియు సంస్థ వివరాలు',
    businessSubtitle: 'కార్యాచరణ దశ, పరిశ్రమ విభాగం మరియు చట్టపరమైన నిర్మాణ పారామితులు.',
    businessName: 'సంస్థ పేరు',
    businessIdea: 'వ్యాపార కార్యకలాపం / ఆలోచన',
    sector: 'పరిశ్రమ రంగం',
    subSector: 'ఉప-రంగం / నిర్దిష్ట వ్యాపారం',
    businessStage: 'సంస్థ జీవిత చక్ర దశ',
    entityType: 'చట్టపరమైన నిర్మాణం',
    operationalStatus: 'కార్యాచరణ స్థితి',
    businessLocation: 'వ్యాపార ప్రాంతం / రాష్ట్రం',
    interstateUnit: 'అంతర్రాష్ట్ర విభాగం',
    experienceYears: 'రంగంలో అనుభవం',

    financialTitle: 'ఆర్థిక నిర్మాణం మరియు పెట్టుబడి అవసరం',
    financialSubtitle: 'ప్రాజెక్ట్ ఖర్చు, స్వంత పెట్టుబడి మరియు నిధుల అంతరం.',
    totalProjectCost: 'మొత్తం ప్రాజెక్ట్ ఖర్చు',
    ownInvestment: 'స్వంత పెట్టుబడి',
    fundingGap: 'అంచనా వేసిన నిధుల అంతరం',
    turnover: 'వార్షిక టర్నోవర్',
    primaryNeed: 'ప్రాథమిక అవసరం',
    secondaryNeeds: 'అదనపు మద్దతు అవసరాలు',
    notSpecified: 'పేర్కొనబడలేదు',

    registrationTitle: 'ఎంఎస్ఎంఈ అధికారిక నమోదులు',
    registrationSubtitle: 'రుణ హామీలు మరియు రాయితీల కోసం అవసరమైన అధికారిక రిజిస్ట్రేషన్లు.',
    registrationStatus: 'నమోదు స్థితి',
    udyam: 'ఉద్యమ్ ఎంఎస్ఎంఈ నమోదు',
    udyamPortal: 'అధికారిక ఉద్యమ్ పోర్టల్',
    gst: 'జీఎస్టీ నమోదు (GSTIN)',
    tradeLicense: 'స్థానిక వాణిజ్య లైసెన్స్',
    bankAccount: 'వ్యాపార కరెంట్ ఖాతా',
    panCard: 'పాన్ కార్డు',
    msmeCategory: 'ఎంఎస్ఎంఈ వర్గం',
    statusRegistered: 'నమోదైంది',
    statusNotRegistered: 'నమోదు కాలేదు',
    statusUnknown: 'ధృవీకరించబడాలి',

    documentsTitle: 'పునర్వినియోగ పత్రాల వాల్ట్',
    documentsSubtitle: 'సేకరించిన పత్రాలు స్వయంచాలకంగా అన్ని దరఖాస్తు చెక్‌లిస్టులలో చేర్చబడతాయి.',
    docPrepared: 'సిద్ధంగా ఉంది',
    docMissing: 'సేకరించాల్సి ఉంది',
    docsReadyCount: 'సిద్ధమైన పత్రాలు',
    toggleHelp: 'సిద్ధత స్థితిని మార్చడానికి పత్రంపై క్లిక్ చేయండి.',

    impactTitle: 'పోర్టల్ సమన్వయం మరియు పథక ప్రభావం',
    impactSubtitle: 'మీ ధృవీకరించిన ప్రొఫైల్ నేరుగా పథకాల సరిపోలికను ఎలా ప్రభావితం చేస్తుంది.',
    eligibleCount: 'మీరు అర్హత సాధించిన పథకాలు',
    nearMatchesCount: 'దగ్గరి సరిపోలికలు',
    viewMatchesBtn: 'పథకాలను అన్వేషించండి',
    viewDashboardBtn: 'డ్యాష్‌బోర్డ్ తెరవండి',
    viewTrackerBtn: 'దరఖాస్తు ట్రాకర్',
    syncNotice: 'అన్ని సరిపోలిక స్కోర్‌లు మరియు కార్యస్థలాలు ఈ ప్రొఫైల్‌తో సమకాలీకరించబడతాయి.',

    editProfileBtn: 'ప్రొఫైల్‌ను సవరించండి',
    printSummaryBtn: 'సారాంశ కార్డును ప్రింట్ చేయండి',
    retakeAssessmentBtn: 'పూర్తి అంచనాను మళ్లీ చేయండి',
    saveChanges: 'మార్పులను సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    editModalTitle: 'వ్యవస్థాపక ప్రొఫైల్‌ను సవరించండి',
    tabPersonal: 'వ్యక్తిగత',
    tabBusiness: 'వ్యాపారం',
    tabFinancial: 'ఆర్థిక',
    tabRegistration: 'నమోదులు',
    saveSuccess: 'ప్రొఫైల్ విజయవంతంగా అప్‌డేట్ చేయబడింది! పథక సరిపోలికలు తిరిగి లెక్కించబడ్డాయి.',
    validationError: 'దయచేసి నమోదు చేసిన వివరాలను తనిఖీ చేసి సరిదిద్దండి.',

    printHeader: 'భారత ప్రభుత్వం / రాష్ట్ర నోడల్ సహాయ కేంద్రం',
    printRecordTitle: 'పౌర వ్యవస్థాపక చట్టబద్ధ సారాంశ నివేదిక',
    printTimestamp: 'రూపొందించిన తేదీ:',
    printDisclaimer: 'ఈ పత్రం యోజనా సేతు రూల్ ఇంజిన్ ద్వారా గెజిట్ నిబంధనలతో సరిపోల్చిన పౌర సమాచారాన్ని ప్రతిబింబిస్తుంది. ఇది బ్యాంక్ మరియు కౌన్సెలింగ్ కోసం ఉపయోగపడుతుంది.',
    printCloseBtn: 'మూసివేయండి',
    printActionBtn: 'ప్రింట్ / PDF సేవ్ చేయండి',
    noProfilePrompt: 'ఇంకా ప్రొఫైల్ సృష్టించబడలేదు. అర్హత గల పథకాలను కనుగొనడానికి 3 నిమిషాల అంచనాను పూర్తి చేయండి.',
    startAssessmentBtn: 'అర్హత అంచనాను ప్రారంభించండి',

    uploadPhotoTitle: 'ప్రొఫైల్ ఫోటోను అప్‌లోడ్ చేయండి',
    uploadPhotoDesc: 'స్పష్టమైన పాస్‌పోర్ట్ లేదా వృత్తిపరమైన ఫోటోను అప్‌లోడ్ చేయండి (JPG, JPEG లేదా PNG, 3MB వరకు).',
    choosePhotoBtn: 'ఫోటోను ఎంచుకోండి',
    removePhotoBtn: 'ఫోటోను తొలగించు',
    confirmPhotoBtn: 'ఫోటోను సేవ్ చేయి',
    cancelPhotoBtn: 'రద్దు చేయి',
    photoSizeError: 'ఫైల్ పరిమాణం 3MB కంటే ఎక్కువ. దయచేసి చిన్న ఫోటోను అప్‌లోడ్ చేయండి.',
    photoTypeError: 'చెల్లని ఫైల్ ఫార్మాట్. దయచేసి JPG, JPEG లేదా PNG ఫోటోను ఎంచుకోండి.',
    photoPreviewAlt: 'ప్రొఫైల్ ఫోటో ముందస్తు వీక్షణ',
    photoUploadedSuccess: 'ప్రొఫైల్ ఫోటో విజయవంతంగా నవీకరించబడింది!',
    photoRemovedSuccess: 'ప్రొఫైల్ ఫోటో తొలగించబడింది. మొదటి అక్షర అవతార్ పునరుద్ధరించబడింది.',
    changePhotoPrompt: 'ఫోటో మార్చండి',
    editPhotoAria: 'ప్రొఫైల్ ఫోటోను మార్చండి',
  },
  kn: {
    navLabel: 'ಪ್ರೊಫೈಲ್',
    pageBadge: 'ನಾಗರಿಕ ಗುರುತಿನ ದಾಖಲೆ',
    pageTitle: 'ಉದ್ಯಮಿ ಪ್ರೊಫೈಲ್',
    pageSubtitle: 'ಯೋಜನೆಗಳ ಅನ್ವೇಷಣೆ, ಅರ್ಹತೆ ಮತ್ತು ಅರ್ಜಿಗಳಿಗಾಗಿ ಅಧಿಕೃತ ನಿರಂತರ ಮೂಲ',
    gazetteVerified: 'ಗೆಜೆಟ್ ಮತ್ತು ನೀತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    ruleEngineActive: 'ನಿಯಮ ಆಧಾರಿತ ಪರಿಶೀಲನೆ ಸಕ್ರಿಯವಾಗಿದೆ',
    sourceOfTruthNotice: 'ಈ ಪ್ರೊಫೈಲ್ ಯೋಜನಾ ಸೇತುವಿನಲ್ಲಿ ನಿಮ್ಮ ಶಾಶ್ವತ ಮೂಲವಾಗಿದೆ. ಇದರಲ್ಲಿ ಯಾವುದೇ ಬದಲಾವಣೆ ತಕ್ಷಣವೇ ಎಲ್ಲಾ ಯೋಜನೆಗಳ ಹೊಂದಾಣಿಕೆಯನ್ನು ನವೀಕರಿಸುತ್ತದೆ.',

    completenessTitle: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣತೆ',
    completenessSubtitle: 'ಸಂಪೂರ್ಣ ಮಾಹಿತಿ ನಿಖರ ಯೋಜನೆ ಹೊಂದಾಣಿಕೆಯನ್ನು ಒದಗಿಸಿ ಅರ್ಜಿ ತಿರಸ್ಕಾರವನ್ನು ತಡೆಯುತ್ತದೆ.',
    completenessScore: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    fullyCompleteBadge: '100% ಪೂರ್ಣಗೊಂಡಿದೆ — ಗರಿಷ್ಠ ಹೊಂದಾಣಿಕೆ ಸಿದ್ಧ',
    missingFieldsHeader: 'ಶಿಫಾರಸು ಮಾಡಲಾದ ಹೆಚ್ಚುವರಿ ವಿವರಗಳು',
    completeFieldsPrompt: 'ನಿಖರವಾದ ಶಿಫಾರಸುಗಳಿಗಾಗಿ ಈ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ:',
    completeFieldBtn: 'ನವೀಕರಿಸಿ',

    personalTitle: 'ವೈಯಕ್ತಿಕ ಮತ್ತು ಜನಸಂಖ್ಯಾ ವಿವರಗಳು',
    personalSubtitle: 'ಕಾನೂನುಬದ್ಧ ಮೀಸಲಾತಿ ಮತ್ತು ಸವಲತ್ತುಗಳನ್ನು ನಿರ್ಧರಿಸುವ ಪ್ರಮುಖ ಅಂಶಗಳು.',
    applicantName: 'ಅರ್ಜಿದಾರರ ಹೆಸರು',
    category: 'ಸಾಮಾಜಿಕ ವರ್ಗ',
    age: 'ವಯಸ್ಸು',
    ageBracket: 'ಕಾನೂನುಬದ್ಧ ವಯೋಮಿತಿ',
    gender: 'ಲಿಂಗ',
    annualIncome: 'ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ',
    state: 'ವಾಸಸ್ಥಳ ರಾಜ್ಯ / ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶ',
    district: 'ಸ್ವಂತ ಜಿಲ್ಲೆ',
    ruralUrban: 'ಪ್ರದೇಶ ವರ್ಗೀಕರಣ',
    rural: 'ಗ್ರಾಮೀಣ ಪ್ರದೇಶ (ಹೆಚ್ಚುವರಿ ಸಬ್ಸಿಡಿಗೆ ಅರ್ಹ)',
    urban: 'ನಗರ ಪ್ರದೇಶ',

    businessTitle: 'ವ್ಯವಹಾರ ಮತ್ತು ಉದ್ಯಮ ವಿವರಗಳು',
    businessSubtitle: 'ಕಾರ್ಯಾಚರಣೆಯ ಹಂತ, ಉದ್ಯಮ ಕ್ಷೇತ್ರ ಮತ್ತು ಕಾನೂನು ರಚನೆಯ ನಿಯತಾಂಕಗಳು.',
    businessName: 'ಉದ್ಯಮದ ಹೆಸರು',
    businessIdea: 'ವ್ಯವಹಾರ ಚಟುವಟಿಕೆ / ಕಲ್ಪನೆ',
    sector: 'ಉದ್ಯಮ ಕ್ಷೇತ್ರ',
    subSector: 'ಉಪ-ಕ್ಷೇತ್ರ / ನಿರ್ದಿಷ್ಟ ವ್ಯಾಪಾರ',
    businessStage: 'ಉದ್ಯಮ ಜೀವನಚಕ್ರ ಹಂತ',
    entityType: 'ಕಾನೂನು ರಚನೆ',
    operationalStatus: 'ಕಾರ್ಯಾಚರಣೆಯ ಸ್ಥಿತಿ',
    businessLocation: 'ವ್ಯವಹಾರದ ಸ್ಥಳ / ರಾಜ್ಯ',
    interstateUnit: 'ಅಂತಾರಾಜ್ಯ ಘಟಕ',
    experienceYears: 'ಕ್ಷೇತ್ರದಲ್ಲಿ ಅನುಭವ',

    financialTitle: 'ಹಣಕಾಸು ರಚನೆ ಮತ್ತು ಬಂಡವಾಳದ ಅಗತ್ಯತೆ',
    financialSubtitle: 'ಯೋಜನಾ ವೆಚ್ಚ, ಸ್ವಂತ ಹೂಡಿಕೆ ಮತ್ತು ನಿಧಿಯ ಅಂತರ.',
    totalProjectCost: 'ಒಟ್ಟು ಯೋಜನಾ ವೆಚ್ಚ',
    ownInvestment: 'ಸ್ವಂತ ಹೂಡಿಕೆ',
    fundingGap: 'ಅಂದಾಜು ಹಣಕಾಸಿನ ಅಂತರ',
    turnover: 'ವಾರ್ಷಿಕ ವಹಿವಾಟು',
    primaryNeed: 'ಪ್ರಾಥಮಿಕ ಅಗತ್ಯ',
    secondaryNeeds: 'ಹೆಚ್ಚುವರಿ ಬೆಂಬಲ ಅಗತ್ಯಗಳು',
    notSpecified: 'ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ',

    registrationTitle: 'ಎಂಎಸ್ಎಂಇ ನೋಂದಣಿಗಳು ಮತ್ತು ಶಾಸನಬದ್ಧ ಸ್ಥಿತಿ',
    registrationSubtitle: 'ಸಾಲ ಖಾತರಿಗಳು ಮತ್ತು ಸಬ್ಸಿಡಿಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ಅಧಿಕೃತ ನೋಂದಣಿಗಳು.',
    registrationStatus: 'ನೋಂದಣಿ ಸ್ಥಿತಿ',
    udyam: 'ಉದ್ಯಮ್ ಎಂಎಸ್ಎಂಇ ನೋಂದಣಿ',
    udyamPortal: 'ಅಧಿಕೃತ ಉದ್ಯಮ್ ಪೋರ್ಟಲ್',
    gst: 'ಜಿಎಸ್‌ಟಿ ನೋಂದಣಿ (GSTIN)',
    tradeLicense: 'ಸ್ಥಳೀಯ ವ್ಯಾಪಾರ ಪರವಾನಗಿ',
    bankAccount: 'ವ್ಯವಹಾರ ಚಾಲ್ತಿ ಖಾತೆ',
    panCard: 'ಪ್ಯಾನ್ ಕಾರ್ಡ್',
    msmeCategory: 'ಎಂಎಸ್ಎಂಇ ವರ್ಗ',
    statusRegistered: 'ನೋಂದಾಯಿಸಲಾಗಿದೆ',
    statusNotRegistered: 'ನೋಂದಾಯಿಸಲಾಗಿಲ್ಲ',
    statusUnknown: 'ಪರಿಶೀಲಿಸಬೇಕಾಗಿದೆ',

    documentsTitle: 'ಮರುಬಳಕೆ ಮಾಡಬಹುದಾದ ದಾಖಲೆಗಳ ವಾಲ್ಟ್',
    documentsSubtitle: 'ಸಿದ್ಧಪಡಿಸಿದ ದಾಖಲೆಗಳು ಎಲ್ಲಾ ಅರ್ಜಿಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿಗೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸೇರ್ಪಡೆಗೊಳ್ಳುತ್ತವೆ.',
    docPrepared: 'ಸಿದ್ಧವಾಗಿದೆ',
    docMissing: 'ಸಂಗ್ರಹಿಸಬೇಕಾಗಿದೆ',
    docsReadyCount: 'ಸಿದ್ಧವಾದ ದಾಖಲೆಗಳು',
    toggleHelp: 'ಸ್ಥಿತಿಯನ್ನು ಬದಲಾಯಿಸಲು ದಾಖಲೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.',

    impactTitle: 'ಪೋರ್ಟಲ್ ಸಮನ್ವಯ ಮತ್ತು ಯೋಜನೆಯ ಪ್ರಭಾವ',
    impactSubtitle: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಯೋಜನೆ ಹೊಂದಾಣಿಕೆಯನ್ನು ಹೇಗೆ ನೇರವಾಗಿ ನಿರ್ಧರಿಸುತ್ತದೆ.',
    eligibleCount: 'ನೀವು ಅರ್ಹತೆ ಹೊಂದಿರುವ ಯೋಜನೆಗಳು',
    nearMatchesCount: 'ಹತ್ತಿರದ ಹೊಂದಾಣಿಕೆಗಳು',
    viewMatchesBtn: 'ಯೋಜನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    viewDashboardBtn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
    viewTrackerBtn: 'ಅರ್ಜಿ ಟ್ರ್ಯಾಕರ್',
    syncNotice: 'ಎಲ್ಲಾ ಹೊಂದಾಣಿಕೆ ಅಂಕಗಳು ಮತ್ತು ಕಾರ್ಯಕ್ಷೇತ್ರಗಳು ಈ ಪ್ರೊಫೈಲ್‌ನೊಂದಿಗೆ ಸಿಂಕ್ ಆಗಿರುತ್ತವೆ.',

    editProfileBtn: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    printSummaryBtn: 'ಸಾರಾಂಶ ಕಾರ್ಡ್ ಪ್ರಿಂಟ್ ಮಾಡಿ',
    retakeAssessmentBtn: 'ಪೂರ್ಣ ಮೌಲ್ಯಮಾಪನವನ್ನು ಮರುಮಾಡಿ',
    saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    editModalTitle: 'ಉದ್ಯಮಿ ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    tabPersonal: 'ವೈಯಕ್ತಿಕ',
    tabBusiness: 'ವ್ಯವಹಾರ',
    tabFinancial: 'ಹಣಕಾಸು',
    tabRegistration: 'ನೋಂದಣಿಗಳು',
    saveSuccess: 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! ಯೋಜನೆ ಹೊಂದಾಣಿಕೆಗಳನ್ನು ಮರು ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ.',
    validationError: 'ದಯವಿಟ್ಟು ನಮೂದಿಸಿದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಸರಿಪಡಿಸಿ.',

    printHeader: 'ಭಾರತ ಸರ್ಕಾರ / ರಾಜ್ಯ ನೋಡಲ್ ಸಹಾಯ ಕೇಂದ್ರ',
    printRecordTitle: 'ನಾಗರಿಕ ಉದ್ಯಮಿ ಶಾಸನಬದ್ಧ ಸಾರಾಂಶ ದಾಖಲೆ',
    printTimestamp: 'ರಚಿಸಲಾದ ದಿನಾಂಕ:',
    printDisclaimer: 'ಈ ದಾಖಲೆಯು ಯೋಜನಾ ಸೇತು ನಿಯಮ ಎಂಜಿನ್ ಮೂಲಕ ಗೆಜೆಟ್ ನಿಯಮಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾದ ಡೇಟಾವನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ. ಬ್ಯಾಂಕ್ ಸಾಲ ಪರಿಶೀಲನೆಗೆ ಇದು ಉಪಯುಕ್ತವಾಗಿದೆ.',
    printCloseBtn: 'ಮುಚ್ಚಿ',
    printActionBtn: 'ಪ್ರಿಂಟ್ / PDF ಉಳಿಸಿ',
    noProfilePrompt: 'ಇನ್ನೂ ಪ್ರೊಫೈಲ್ ರಚಿಸಲಾಗಿಲ್ಲ. ಅರ್ಹ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು 3 ನಿಮಿಷಗಳ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.',
    startAssessmentBtn: 'ಅರ್ಹತಾ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪ್ರಾರಂಭಿಸಿ',

    uploadPhotoTitle: 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    uploadPhotoDesc: 'ಸ್ಪಷ್ಟವಾದ ಪಾಸ್‌ಪೋರ್ಟ್ ಅಥವಾ ವೃತ್ತಿಪರ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (JPG, JPEG ಅಥವಾ PNG, 3MB ವರೆಗೆ).',
    choosePhotoBtn: 'ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ',
    removePhotoBtn: 'ಫೋಟೋ ತೆಗೆದುಹಾಕಿ',
    confirmPhotoBtn: 'ಫೋಟೋ ಉಳಿಸಿ',
    cancelPhotoBtn: 'ರದ್ದುಮಾಡಿ',
    photoSizeError: 'ಫೈಲ್ ಗಾತ್ರವು 3MB ಗಿಂತ ಹೆಚ್ಚಿದೆ. ದಯವಿಟ್ಟು ಸಣ್ಣ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    photoTypeError: 'ಅಮಾನ್ಯ ಫೈಲ್ ಫಾರ್ಮ್ಯಾಟ್. ದಯವಿಟ್ಟು JPG, JPEG ಅಥವಾ PNG ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    photoPreviewAlt: 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಪೂರ್ವವೀಕ್ಷಣೆ',
    photoUploadedSuccess: 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!',
    photoRemovedSuccess: 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ತೆಗೆದುಹಾಕಲಾಗಿದೆ. ಮೊದಲ ಅಕ್ಷರದ ಅವತಾರ್ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.',
    changePhotoPrompt: 'ಫೋಟೋ ಬದಲಾಯಿಸಿ',
    editPhotoAria: 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಬದಲಾಯಿಸಿ',
  },
  ml: {
    navLabel: 'പ്രൊഫൈൽ',
    pageBadge: 'പൗര തിരിച്ചറിയൽ രേഖ',
    pageTitle: 'സംരംഭക പ്രൊഫൈൽ',
    pageSubtitle: 'പദ്ധതി കണ്ടെത്തൽ, യോഗ്യത, അപേക്ഷകൾ എന്നിവയ്ക്കുള്ള ആധികാരിക സ്രോതസ്സ്',
    gazetteVerified: 'ഗസറ്റും നയവും പരിശോധിച്ചു',
    ruleEngineActive: 'നിയമാധിഷ്ഠിത പരിശോധന സജീവം',
    sourceOfTruthNotice: 'ഈ പ്രൊഫൈൽ യോജന സേതുവിൽ നിങ്ങളുടെ സ്ഥിരമായ രേഖയായി പ്രവർത്തിക്കുന്നു. ഇതിലെ മാറ്റങ്ങൾ ഉടൻ തന്നെ എല്ലാ പദ്ധതി പൊരുത്തങ്ങളും അപ്‌ഡേറ്റ് ചെയ്യുന്നു.',

    completenessTitle: 'പ്രൊഫൈൽ പൂർണ്ണത',
    completenessSubtitle: 'വിശദമായ വിവരങ്ങൾ കൃത്യമായ പദ്ധതി പൊരുത്തം നൽകുകയും അപേക്ഷ നിരസിക്കുന്നത് തടയുകയും ചെയ്യുന്നു.',
    completenessScore: 'പൂർത്തിയായി',
    fullyCompleteBadge: '100% പൂർത്തിയായി — മികച്ച പൊരുത്തം തയ്യാർ',
    missingFieldsHeader: 'ശുപാർശ ചെയ്യുന്ന അധിക വിവരങ്ങൾ',
    completeFieldsPrompt: 'കൂടുതൽ കൃത്യമായ നിർദ്ദേശങ്ങൾക്കായി ഈ വിവരങ്ങൾ നൽകുക:',
    completeFieldBtn: 'അപ്‌ഡേറ്റ് ചെയ്യുക',

    personalTitle: 'വ്യക്തിഗത വിവരങ്ങൾ',
    personalSubtitle: 'നിയമപരമായ സംവരണം, ആനുകൂല്യങ്ങൾ എന്നിവ നിർണ്ണയിക്കുന്ന പ്രധാന വിവരങ്ങൾ.',
    applicantName: 'അപേക്ഷകന്റെ പേര്',
    category: 'സാമൂഹിക വിഭാഗം',
    age: 'പ്രായം',
    ageBracket: 'നിയമപരമായ പ്രായപരിധി',
    gender: 'ലിംഗഭേദം',
    annualIncome: 'വാർഷിക കുടുംബ വരുമാനം',
    state: 'താമസിക്കുന്ന സംസ്ഥാനം / പ്രദേശം',
    district: 'സ്വന്തം ജില്ല',
    ruralUrban: 'മേഖലാ വർഗ്ഗീകരണം',
    rural: 'ഗ്രാമീണ മേഖല (കൂടുതൽ സബ്‌സിഡിക്ക് യോഗ്യത)',
    urban: 'നഗര മേഖല',

    businessTitle: 'ബിസിനസ്സ് വിവരങ്ങൾ',
    businessSubtitle: 'പ്രവർത്തന ഘട്ടം, വ്യവസായ മേഖല, നിയമപരമായ ഘടന എന്നിവ.',
    businessName: 'സ്ഥാപനത്തിന്റെ പേര്',
    businessIdea: 'ബിസിനസ്സ് പ്രവർത്തനം / ആശയം',
    sector: 'വ്യവസായ മേഖല',
    subSector: 'ഉപമേഖല / നിർദ്ദിഷ്ട തൊഴിൽ',
    businessStage: 'സംരംഭ ഘട്ടം',
    entityType: 'നിയമപരമായ ഘടന',
    operationalStatus: 'പ്രവർത്തന നില',
    businessLocation: 'ബിസിനസ്സ് സ്ഥലം / സംസ്ഥാനം',
    interstateUnit: 'അന്തർസംസ്ഥാന യൂണിറ്റ്',
    experienceYears: 'മേഖലയിലെ പരിചയം',

    financialTitle: 'സാമ്പത്തിക ഘടനയും ആവശ്യകതയും',
    financialSubtitle: 'പദ്ധതി ചെലവ്, സ്വന്തം നിക്ഷേപം, പ്രതീക്ഷിക്കുന്ന ഫണ്ടിംഗ് വിടവ്.',
    totalProjectCost: 'ആകെ പ്രോജക്ട് ചെലവ്',
    ownInvestment: 'സ്വന്തം നിക്ഷേപം',
    fundingGap: 'കണക്കാക്കിയ ഫണ്ടിംഗ് വിടവ്',
    turnover: 'വാർഷിക വിറ്റുവരവ്',
    primaryNeed: 'പ്രാഥമിക ആവശ്യം',
    secondaryNeeds: 'കൂടുതൽ സഹായ ആവശ്യങ്ങൾ',
    notSpecified: 'വ്യക്തമാക്കിയിട്ടില്ല',

    registrationTitle: 'എംഎസ്എംഇ രജിസ്ട്രേഷനുകൾ',
    registrationSubtitle: 'വായ്പാ ഗ്യാരണ്ടികൾക്കും സബ്‌സിഡികൾക്കും ആവശ്യമായ ഔദ്യോഗിക രജിസ്ട്രേഷനുകൾ.',
    registrationStatus: 'രജിസ്ട്രേഷൻ നില',
    udyam: 'ഉദ്യം എംഎസ്എംഇ രജിസ്ട്രേഷൻ',
    udyamPortal: 'ഔദ്യോഗിക ഉദ്യം പോർട്ടൽ',
    gst: 'ജിഎസ്ടി രജിസ്ട്രേഷൻ (GSTIN)',
    tradeLicense: 'തദ്ദേശീയ വ്യാപാര ലൈസൻസ്',
    bankAccount: 'ബിസിനസ്സ് കറന്റ് അക്കൗണ്ട്',
    panCard: 'പാൻ കാർഡ്',
    msmeCategory: 'എംഎസ്എംഇ വിഭാഗം',
    statusRegistered: 'രജിസ്റ്റർ ചെയ്തു',
    statusNotRegistered: 'രജിസ്റ്റർ ചെയ്തിട്ടില്ല',
    statusUnknown: 'പരിശോധിക്കേണ്ടതുണ്ട്',

    documentsTitle: 'പുനരുപയോഗിക്കാവുന്ന രേഖകളുടെ നിലവറ',
    documentsSubtitle: 'തയ്യാറാക്കിയ രേഖകൾ എല്ലാ അപേക്ഷാ ചെക്ക്‌ലിസ്റ്റുകളിലും സ്വയമേവ ചേർക്കപ്പെടും.',
    docPrepared: 'തയ്യാറാണ്',
    docMissing: 'ശേഖരിക്കേണ്ടതുണ്ട്',
    docsReadyCount: 'തയ്യാറായ രേഖകൾ',
    toggleHelp: 'തയ്യാറെടുപ്പ് നില മാറ്റാൻ രേഖയിൽ ക്ലിക്ക് ചെയ്യുക.',

    impactTitle: 'പോർട്ടൽ സമന്വയവും പദ്ധതി സ്വാധീനവും',
    impactSubtitle: 'നിങ്ങളുടെ പ്രൊഫൈൽ പദ്ധതി കണ്ടെത്തലുകളെ എങ്ങനെ സ്വാധീനിക്കുന്നു.',
    eligibleCount: 'നിങ്ങൾക്ക് യോഗ്യതയുള്ള പദ്ധതികൾ',
    nearMatchesCount: 'അടുത്ത പൊരുത്തങ്ങൾ',
    viewMatchesBtn: 'പദ്ധതികൾ കാണുക',
    viewDashboardBtn: 'ഡാഷ്‌ബോർഡ് തുറക്കുക',
    viewTrackerBtn: 'അപേക്ഷാ ട്രാക്കർ',
    syncNotice: 'എല്ലാ പൊരുത്ത സ്കോറുകളും ഈ പ്രൊഫൈലുമായി സ്വയമേവ സമന്വയിപ്പിച്ചിരിക്കുന്നു.',

    editProfileBtn: 'പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക',
    printSummaryBtn: 'സംഗ്രഹ കാർഡ് പ്രിന്റ് ചെയ്യുക',
    retakeAssessmentBtn: 'പൂർണ്ണ വിലയിരുത്തൽ വീണ്ടും നടത്തുക',
    saveChanges: 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക',
    cancel: 'റദ്ദാക്കുക',
    editModalTitle: 'സംരംഭക പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക',
    tabPersonal: 'വ്യക്തിഗതം',
    tabBusiness: 'ബിസിനസ്സ്',
    tabFinancial: 'സാമ്പത്തികം',
    tabRegistration: 'രജിസ്ട്രേഷൻ',
    saveSuccess: 'പ്രൊഫൈൽ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു! പദ്ധതി പൊരുത്തങ്ങൾ വീണ്ടും കണക്കാക്കി.',
    validationError: 'നൽകിയ വിവരങ്ങൾ പരിശോധിച്ച് തിരുത്തുക.',

    printHeader: 'ഇന്ത്യൻ സർക്കാർ / സംസ്ഥാന നോഡൽ കേന്ദ്രം',
    printRecordTitle: 'പൗര സംരംഭക നിയമപരമായ സംഗ്രഹ രേഖ',
    printTimestamp: 'തയ്യാറാക്കിയ തീയതി:',
    printDisclaimer: 'യോജന സേതു നിയമ എഞ്ചിൻ വഴി ഗസറ്റ് ചട്ടങ്ങളുമായി പൊരുത്തപ്പെടുത്തിയ വിവരങ്ങളാണ് ഈ രേഖയിലുള്ളത്. ബാങ്ക് വായ്പാ പരിശോധനയ്ക്ക് ഇത് ഉപയോഗിക്കാം.',
    printCloseBtn: 'അടയ്ക്കുക',
    printActionBtn: 'പ്രിന്റ് / PDF സംരക്ഷിക്കുക',
    noProfilePrompt: 'ഇതുവരെ പ്രൊഫൈൽ സൃഷ്ടിച്ചിട്ടില്ല. അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്തുന്നതിന് 3 മിനിറ്റ് വിലയിരുത്തൽ പൂർത്തിയാക്കുക.',
    startAssessmentBtn: 'യോഗ്യതാ വിലയിരുത്തൽ ആരംഭിക്കുക',

    uploadPhotoTitle: 'പ്രൊഫൈൽ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക',
    uploadPhotoDesc: 'വ്യക്തമായ പാസ്‌പോർട്ട് അല്ലെങ്കിൽ പ്രൊഫഷണൽ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക (JPG, JPEG അല്ലെങ്കിൽ PNG, 3MB വരെ).',
    choosePhotoBtn: 'ഫോട്ടോ തിരഞ്ഞെടുക്കുക',
    removePhotoBtn: 'ഫോട്ടോ നീക്കംചെയ്യുക',
    confirmPhotoBtn: 'ഫോട്ടോ സംരക്ഷിക്കുക',
    cancelPhotoBtn: 'റദ്ദാക്കുക',
    photoSizeError: 'ഫയൽ വലുപ്പം 3MB-ൽ കൂടുതലാണ്. ദയവായി ചെറിയ ഫോട്ടോ തിരഞ്ഞെടുക്കുക.',
    photoTypeError: 'അസാധുവായ ഫോർമാറ്റ്. ദയവായി JPG, JPEG അല്ലെങ്കിൽ PNG ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക.',
    photoPreviewAlt: 'പ്രൊഫൈൽ ഫോട്ടോ പ്രിവ്യൂ',
    photoUploadedSuccess: 'പ്രൊഫൈൽ ഫോട്ടോ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു!',
    photoRemovedSuccess: 'പ്രൊഫൈൽ ഫോട്ടോ നീക്കംചെയ്‌തു. ആദ്യ അക്ഷര അവതാരം പുനഃസ്ഥാപിച്ചു.',
    changePhotoPrompt: 'ഫോട്ടോ മാറ്റുക',
    editPhotoAria: 'പ്രൊഫൈൽ ഫോട്ടോ മാറ്റുക',
  },
};
