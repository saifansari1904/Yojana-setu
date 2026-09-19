import { Language } from './types';
import {
  SupportNeedType,
  BusinessStageKey,
  OperationalStatus,
  RegistrationStatus,
  BusinessEntityType,
} from '../types/business';

export interface FormI18nStrings {
  journeyEyebrow: string;
  stepIndicator: (curr: number, total: number, name: string) => string;
  clearAllFields: string;
  resetForm: string;
  completedPercent: string;

  // Validation messages
  valCategory: string;
  valAge: string;
  valState: string;
  valLocation: string;
  valIncome: string;
  valBizStage: string;
  valBizSector: string;
  valFunding: string;
  valRegistration: string;
  valTurnover: string;
  valCompleteAll: string;

  // About you
  notSetAge: string;
  agePlaceholder: string;
  selectStatePlaceholder: string;
  districtLabel: string;
  districtPlaceholder: string;
  diffStateCheckbox: string;
  domicileStateLabel: string;
  domicileQuotaHint: string;
  selectHomeStatePlaceholder: string;
  notEnteredIncome: string;
  incomePlaceholder: string;

  // Business stage
  planningPrompt: string;
  lifecyclePhaseLabel: string;
  lifecyclePhaseHint: string;
  operationalStatusLabel: string;

  // Business type
  legalEntityLabel: string;
  legalEntityHint: string;
  subSectorLabel: string;
  subSectorPlaceholder: string;
  experienceLabel: string;

  // Funding & Intelligence
  fundingPrompt: string;
  exactFundingLabel: string;
  exactFundingPlaceholder: string;
  costAndGapTitle: string;
  totalCostLabel: string;
  totalCostPlaceholder: string;
  ownInvestmentLabel: string;
  ownInvestmentPlaceholder: string;
  fundingGapLabel: string;
  gapFormulaHint: string;
  primaryNeedLabel: string;
  secondaryNeedsLabel: string;
  selectedCount: (cnt: number) => string;
  secondaryNeedsHint: string;
  bizIdeaLabel: string;
  bizIdeaPlaceholder: string;

  // Registration
  regStatusLabel: string;

  // Review & Confirmation
  reviewProjectCostGap: string;
  reviewPrimaryNeed: string;
  reviewSecondaryNeeds: string;
  reviewEntityStructure: string;
  reviewSubSector: string;
}

export const FORM_I18N: Record<Language, FormI18nStrings> = {
  en: {
    journeyEyebrow: 'Your Business Profile Journey',
    stepIndicator: (curr, total, name) => `Step ${curr} of ${total}: ${name}`,
    clearAllFields: 'Clear all fields',
    resetForm: 'Reset Form',
    completedPercent: 'Completed',

    valCategory: 'Please select your Social Category to proceed.',
    valAge: 'Please enter a valid age (minimum 18 years).',
    valState: 'Please select your Business State or Union Territory.',
    valLocation: 'Please select your Enterprise Location (Rural or Urban).',
    valIncome: 'Please enter your approximate Annual Household Income.',
    valBizStage: 'Please select your Business Planning Stage.',
    valBizSector: 'Please select your primary Business Sector.',
    valFunding: 'Please select your funding or credit requirement range.',
    valRegistration: 'Please select your Business Registration status.',
    valTurnover: 'Please select your Annual Business Turnover range.',
    valCompleteAll: 'Please complete all required questions.',

    notSetAge: 'Not set (18–70)',
    agePlaceholder: 'e.g. 28',
    selectStatePlaceholder: '-- Select your State or Union Territory --',
    districtLabel: 'District / City (Optional):',
    districtPlaceholder: 'e.g. Mysuru, Pune, Varanasi',
    diffStateCheckbox: 'Business is in a different state from residence',
    domicileStateLabel: 'Permanent Residence / Domicile State:',
    domicileQuotaHint: 'For state domicile quotas',
    selectHomeStatePlaceholder: '-- Select your Home / Domicile State --',
    notEnteredIncome: 'Not entered',
    incomePlaceholder: 'e.g. 250000',

    planningPrompt: 'What are you currently planning for your business enterprise?',
    lifecyclePhaseLabel: 'Specific Lifecycle Phase (Optional):',
    lifecyclePhaseHint: 'Refines grant vs credit matching',
    operationalStatusLabel: 'Current Operational Status (Optional):',

    legalEntityLabel: 'Legal Entity Structure (Optional):',
    legalEntityHint: 'Sole prop, Pvt Ltd, SHG, etc.',
    subSectorLabel: 'Specific Sub-Sector / Trade (Optional):',
    subSectorPlaceholder: 'e.g. Dairy Chilling, Readymade Garments, Solar Equipment',
    experienceLabel: 'Industry Experience (Years):',

    fundingPrompt: 'How much funding or loan assistance does your enterprise require?',
    exactFundingLabel: 'Or specify an exact loan / funding requirement:',
    exactFundingPlaceholder: 'e.g. 300000',
    costAndGapTitle: 'Project Cost, Funding Gap & Business Needs',
    totalCostLabel: 'Total Estimated Project Cost:',
    totalCostPlaceholder: 'e.g. 500000',
    ownInvestmentLabel: 'Your Own Investment / Contribution:',
    ownInvestmentPlaceholder: 'e.g. 100000',
    fundingGapLabel: 'Calculated Funding Gap:',
    gapFormulaHint: 'Project Cost − Own Investment',
    primaryNeedLabel: 'Primary Support Need:',
    secondaryNeedsLabel: 'Secondary Support Needs (Multi-select, Optional):',
    selectedCount: (cnt) => `${cnt} selected`,
    secondaryNeedsHint: 'Select any complementary support required (primary need is excluded from secondary selection).',
    bizIdeaLabel: 'Business Idea / Activity Summary (Optional):',
    bizIdeaPlaceholder: 'e.g. Solar-powered micro cold storage unit or eco-friendly packaging',

    regStatusLabel: 'Registration lifecycle state:',

    reviewProjectCostGap: 'Project Cost / Gap:',
    reviewPrimaryNeed: 'Primary Need:',
    reviewSecondaryNeeds: 'Secondary Needs:',
    reviewEntityStructure: 'Entity Structure:',
    reviewSubSector: 'Sub-Sector:',
  },

  hi: {
    journeyEyebrow: 'आपकी व्यवसाय प्रोफ़ाइल यात्रा',
    stepIndicator: (curr, total, name) => `चरण ${curr} / ${total}: ${name}`,
    clearAllFields: 'सभी फ़ील्ड साफ़ करें',
    resetForm: 'रीसेट करें',
    completedPercent: 'पूर्ण',

    valCategory: 'कृपया आगे बढ़ने के लिए अपना सामाजिक वर्ग चुनें।',
    valAge: 'कृपया एक मान्य आयु दर्ज करें (न्यूनतम 18 वर्ष)।',
    valState: 'कृपया अपना व्यवसाय राज्य अथवा केंद्र शासित प्रदेश चुनें।',
    valLocation: 'कृपया अपना उद्यम क्षेत्र (ग्रामीण अथवा शहरी) चुनें।',
    valIncome: 'कृपया परिवार की अनुमानित वार्षिक आय दर्ज करें।',
    valBizStage: 'कृपया अपने व्यवसाय का वर्तमान चरण चुनें।',
    valBizSector: 'कृपया अपने व्यवसाय का क्षेत्र (उद्योग/व्यापार) चुनें।',
    valFunding: 'कृपया अपेक्षित ऋण राशि अथवा सीमा चुनें।',
    valRegistration: 'कृपया अपने व्यवसाय का पंजीकरण प्रकार चुनें।',
    valTurnover: 'कृपया अपने व्यवसाय का वार्षिक टर्नओवर सीमा चुनें।',
    valCompleteAll: 'कृपया सभी आवश्यक प्रश्न पूर्ण करें।',

    notSetAge: 'आयु चुनें (18–70)',
    agePlaceholder: 'उदा. 28',
    selectStatePlaceholder: '-- अपना राज्य या केंद्र शासित प्रदेश चुनें --',
    districtLabel: 'ज़िला / शहर (वैकल्पिक):',
    districtPlaceholder: 'उदा. मैसूर, पुणे, वाराणसी',
    diffStateCheckbox: 'व्यवसाय किसी अन्य राज्य में है (आवासीय राज्य भिन्न)',
    domicileStateLabel: 'स्थायी निवास / अधिवास राज्य (Domicile State):',
    domicileQuotaHint: 'योजना पात्रता हेतु',
    selectHomeStatePlaceholder: '-- अपना निवास राज्य चुनें --',
    notEnteredIncome: 'दर्ज नहीं किया गया',
    incomePlaceholder: 'उदा. 250000',

    planningPrompt: 'आप अपने उद्यम के लिए वर्तमान में क्या योजना बना रहे हैं?',
    lifecyclePhaseLabel: 'विस्तृत व्यावसायिक चरण (वैकल्पिक):',
    lifecyclePhaseHint: 'सटीक योजना मिलान हेतु',
    operationalStatusLabel: 'वर्तमान परिचालन स्थिति (Operational Status):',

    legalEntityLabel: 'कानूनी संरचना / व्यावसायिक स्वरूप (वैकल्पिक):',
    legalEntityHint: 'कंपनी / स्वामित्व / समूह',
    subSectorLabel: 'विशिष्ट उप-क्षेत्र / गतिविधि (वैकल्पिक):',
    subSectorPlaceholder: 'उदा. डेयरी चिलिंग, वस्त्र निर्माण, सोलर उपकरण',
    experienceLabel: 'उद्यमिता / उद्योग अनुभव (वर्ष):',

    fundingPrompt: 'आपके व्यवसाय को शुरू करने अथवा संचालित करने के लिए कितनी पूंजी या ऋण चाहिए?',
    exactFundingLabel: 'अथवा सटीक राशि दर्ज करें (वैकल्पिक):',
    exactFundingPlaceholder: 'उदा. 300000',
    costAndGapTitle: 'परियोजना लागत, वित्तीय अंतर एवं सहायता आवश्यकता',
    totalCostLabel: 'कुल अनुमानित परियोजना लागत:',
    totalCostPlaceholder: 'उदा. 500000',
    ownInvestmentLabel: 'प्रवर्तक का स्वयं का निवेश / योगदान:',
    ownInvestmentPlaceholder: 'उदा. 100000',
    fundingGapLabel: 'अनुमानित वित्तीय अंतर (Funding Gap):',
    gapFormulaHint: 'परियोजना लागत − स्वयं का निवेश',
    primaryNeedLabel: 'आपकी मुख्य व्यावसायिक सहायता आवश्यकता:',
    secondaryNeedsLabel: 'अतिरिक्त / द्वितीयक आवश्यकताएँ (बहु-चयन):',
    selectedCount: (cnt) => `${cnt} चयनित`,
    secondaryNeedsHint: 'मुख्य आवश्यकता के अतिरिक्त अन्य किन क्षेत्रों में सरकारी सहायता चाहिए? (मुख्य आवश्यकता यहाँ नहीं चुनी जा सकती)',
    bizIdeaLabel: 'व्यवसाय गतिविधि / विचार संक्षेप (वैकल्पिक):',
    bizIdeaPlaceholder: 'उदा. सोलर संचालित कोल्ड स्टोरेज इकाई या बेकरी उत्पाद',

    regStatusLabel: 'पंजीकरण वर्तमान स्थिति:',

    reviewProjectCostGap: 'परियोजना लागत / वित्तीय अंतर:',
    reviewPrimaryNeed: 'मुख्य आवश्यकता:',
    reviewSecondaryNeeds: 'अतिरिक्त आवश्यकताएँ:',
    reviewEntityStructure: 'कानूनी संरचना:',
    reviewSubSector: 'उप-क्षेत्र:',
  },

  ta: {
    journeyEyebrow: 'உங்கள் வணிக சுயவிவரப் பயணம்',
    stepIndicator: (curr, total, name) => `படி ${curr} / ${total}: ${name}`,
    clearAllFields: 'அனைத்து புலங்களையும் அழிக்கவும்',
    resetForm: 'படிவத்தை மீட்டமை',
    completedPercent: 'முடிந்தது',

    valCategory: 'தொடர தயவுசெய்து உங்கள் சமூகப் பிரிவைத் தேர்ந்தெடுக்கவும்.',
    valAge: 'தயவுசெய்து சரியான வயதை உள்ளிடவும் (குறைந்தபட்சம் 18 ஆண்டுகள்).',
    valState: 'உங்கள் வணிக மாநிலம் அல்லது யூனியன் பிரதேசத்தைத் தேர்ந்தெடுக்கவும்.',
    valLocation: 'உங்கள் நிறுவன இருப்பிடத்தைத் தேர்ந்தெடுக்கவும் (கிராமப்புறம் அல்லது நகர்ப்புறம்).',
    valIncome: 'குடும்பத்தின் தோராயமான ஆண்டு வருமானத்தை உள்ளிடவும்.',
    valBizStage: 'உங்கள் வணிகத் திட்டமிடல் கட்டத்தைத் தேர்ந்தெடுக்கவும்.',
    valBizSector: 'உங்கள் முதன்மை வணிகத் துறையைத் தேர்ந்தெடுக்கவும்.',
    valFunding: 'நிதி அல்லது கடன் தேவை வரம்பைத் தேர்ந்தெடுக்கவும்.',
    valRegistration: 'உங்கள் வணிகப் பதிவு நிலையைத் தேர்ந்தெடுக்கவும்.',
    valTurnover: 'உங்கள் ஆண்டு வணிக வருவாய் வரம்பைத் தேர்ந்தெடுக்கவும்.',
    valCompleteAll: 'தயவுசெய்து அனைத்து கட்டாயக் கேள்விகளையும் பூர்த்தி செய்யவும்.',

    notSetAge: 'தேர்வு செய்யப்படவில்லை (18–70)',
    agePlaceholder: 'எ.கா. 28',
    selectStatePlaceholder: '-- உங்கள் மாநிலம் அல்லது யூனியன் பிரதேசத்தைத் தேர்ந்தெடுக்கவும் --',
    districtLabel: 'மாவட்டம் / நகரம் (விருப்பத்தேர்வு):',
    districtPlaceholder: 'எ.கா. மைசூர், புனே, வாரணாசி',
    diffStateCheckbox: 'வணிகம் வசிக்கும் மாநிலத்திலிருந்து வேறு மாநிலத்தில் உள்ளது',
    domicileStateLabel: 'நிரந்தர குடியிருப்பு / இருப்பிட மாநிலம்:',
    domicileQuotaHint: 'மாநில ஒதுக்கீட்டிற்காக',
    selectHomeStatePlaceholder: '-- உங்கள் குடியிருப்பு மாநிலத்தைத் தேர்ந்தெடுக்கவும் --',
    notEnteredIncome: 'பதிவிடப்படவில்லை',
    incomePlaceholder: 'எ.கா. 250000',

    planningPrompt: 'உங்கள் வணிக நிறுவனத்திற்காக தற்போது என்ன திட்டமிடுகிறீர்கள்?',
    lifecyclePhaseLabel: 'குறிப்பிட்ட வாழ்க்கைச் சுழற்சி கட்டம் (விருப்பத்தேர்வு):',
    lifecyclePhaseHint: 'மானிய மற்றும் கடன் பொருத்தத்தை மேம்படுத்துகிறது',
    operationalStatusLabel: 'தற்போதைய செயல்பாட்டு நிலை (விருப்பத்தேர்வு):',

    legalEntityLabel: 'சட்ட அமைப்பு வடிவம் (விருப்பத்தேர்வு):',
    legalEntityHint: 'தனியுரிமை, பிரைவேட் லிமிடெட், சுய உதவிக்குழு போன்றவை',
    subSectorLabel: 'குறிப்பிட்ட துணைத் துறை / தொழில் (விருப்பத்தேர்வு):',
    subSectorPlaceholder: 'எ.கா. பால் குளிரூட்டல், ஆயத்த ஆடைகள், சோலார் உபகரணங்கள்',
    experienceLabel: 'தொழில் அனுபவம் (ஆண்டுகள்):',

    fundingPrompt: 'உங்கள் நிறுவனத்திற்கு எவ்வளவு நிதி அல்லது கடன் உதவி தேவைப்படுகிறது?',
    exactFundingLabel: 'அல்லது துல்லியமான கடன் / நிதித் தேவையை உள்ளிடவும்:',
    exactFundingPlaceholder: 'எ.கா. 300000',
    costAndGapTitle: 'திட்டச் செலவு, நிதி இடைவெளி மற்றும் வணிகத் தேவைகள்',
    totalCostLabel: 'மொத்த மதிப்பிடப்பட்ட திட்டச் செலவு:',
    totalCostPlaceholder: 'எ.கா. 500000',
    ownInvestmentLabel: 'உங்கள் சொந்த முதலீடு / பங்களிப்பு:',
    ownInvestmentPlaceholder: 'எ.கா. 100000',
    fundingGapLabel: 'கணக்கிடப்பட்ட நிதி இடைவெளி:',
    gapFormulaHint: 'திட்டச் செலவு − சொந்த முதலீடு',
    primaryNeedLabel: 'முதன்மை ஆதரவு தேவை:',
    secondaryNeedsLabel: 'இரண்டாம் நிலை ஆதரவு தேவைகள் (பல தேர்வு, விருப்பத்தேர்வு):',
    selectedCount: (cnt) => `${cnt} தேர்ந்தெடுக்கப்பட்டது`,
    secondaryNeedsHint: 'தேவையான கூடுதல் ஆதரவைத் தேர்ந்தெடுக்கவும் (முதன்மைத் தேவை இதிலிருந்து விலக்கப்பட்டுள்ளது).',
    bizIdeaLabel: 'வணிக யோசனை / செயல்பாட்டுச் சுருக்கம் (விருப்பத்தேர்வு):',
    bizIdeaPlaceholder: 'எ.கா. சூரிய சக்தியால் இயங்கும் குளிர்சாதன அலகு அல்லது சூழல் நட்பு பேக்கேஜிங்',

    regStatusLabel: 'பதிவு வாழ்க்கைச் சுழற்சி நிலை:',

    reviewProjectCostGap: 'திட்டச் செலவு / இடைவெளி:',
    reviewPrimaryNeed: 'முதன்மைத் தேவை:',
    reviewSecondaryNeeds: 'கூடுதல் தேவைகள்:',
    reviewEntityStructure: 'நிறுவன அமைப்பு:',
    reviewSubSector: 'துணைத் துறை:',
  },

  te: {
    journeyEyebrow: 'మీ వ్యాపార ప్రొఫైల్ ప్రయాణం',
    stepIndicator: (curr, total, name) => `దశ ${curr} / ${total}: ${name}`,
    clearAllFields: 'అన్ని ఫీల్డ్‌లను క్లియర్ చేయండి',
    resetForm: 'ఫారమ్‌ను రీసెట్ చేయండి',
    completedPercent: 'పూర్తయింది',

    valCategory: 'కొనసాగడానికి దయచేసి మీ సామాజిక వర్గాన్ని ఎంచుకోండి.',
    valAge: 'దయచేసి సరైన వయస్సును నమోదు చేయండి (కనీసం 18 సంవత్సరాలు).',
    valState: 'మీ వ్యాపార రాష్ట్రం లేదా కేంద్రపాలిత ప్రాంతాన్ని ఎంచుకోండి.',
    valLocation: 'మీ సంస్థ స్థానాన్ని ఎంచుకోండి (గ్రామీణ లేదా పట్టణ).',
    valIncome: 'కుటుంబం యొక్క సుమారు వార్షిక ఆదాయాన్ని నమోదు చేయండి.',
    valBizStage: 'మీ వ్యాపార ప్రణాళిక దశను ఎంచుకోండి.',
    valBizSector: 'మీ ప్రాథమిక వ్యాపార రంగాన్ని ఎంచుకోండి.',
    valFunding: 'నిధులు లేదా రుణ అవసరాల పరిధిని ఎంచుకోండి.',
    valRegistration: 'మీ వ్యాపార నమోదు స్థితిని ఎంచుకోండి.',
    valTurnover: 'మీ వార్షిక వ్యాపార టర్నోవర్ పరిధిని ఎంచుకోండి.',
    valCompleteAll: 'దయచేసి అవసరమైన అన్ని ప్రశ్నలను పూర్తి చేయండి.',

    notSetAge: 'ఎంచుకోలేదు (18–70)',
    agePlaceholder: 'ఉదా. 28',
    selectStatePlaceholder: '-- మీ రాష్ట్రం లేదా కేంద్రపాలిత ప్రాంతాన్ని ఎంచుకోండి --',
    districtLabel: 'జిల్లా / నగరం (ఐచ్ఛికం):',
    districtPlaceholder: 'ఉదా. మైసూరు, పూణే, వారణాసి',
    diffStateCheckbox: 'వ్యాపారం నివాస ప్రాంతానికి వేరే రాష్ట్రంలో ఉంది',
    domicileStateLabel: 'శాశ్వత నివాసం / డొమిసైల్ రాష్ట్రం:',
    domicileQuotaHint: 'రాష్ట్ర కోటా అర్హత కోసం',
    selectHomeStatePlaceholder: '-- మీ నివాస రాష్ట్రాన్ని ఎంచుకోండి --',
    notEnteredIncome: 'నమోదు చేయలేదు',
    incomePlaceholder: 'ఉదా. 250000',

    planningPrompt: 'మీ వ్యాపార సంస్థ కోసం ప్రస్తుతం మీరు ఏమి ప్లాన్ చేస్తున్నారు?',
    lifecyclePhaseLabel: 'నిర్దిష్ట లైఫ్‌సైకిల్ దశ (ఐచ్ఛికం):',
    lifecyclePhaseHint: 'గ్రాంట్ మరియు క్రెడిట్ సరిపోలికను మెరుగుపరుస్తుంది',
    operationalStatusLabel: 'ప్రస్తుత కార్యాచరణ స్థితి (ఐచ్ఛికం):',

    legalEntityLabel: 'చట్టపరమైన సంస్థ నిర్మాణం (ఐచ్ఛికం):',
    legalEntityHint: 'ప్రొప్రైటర్‌షిప్, ప్రైవేట్ లిమిటెడ్, స్వయం సహాయక బృందం మొదలైనవి',
    subSectorLabel: 'నిర్దిష్ట ఉప-రంగం / వాణిజ్యం (ఐచ్ఛికం):',
    subSectorPlaceholder: 'ఉదా. డెయిరీ చిల్లింగ్, రెడీమేడ్ దుస్తులు, సోలార్ పరికరాలు',
    experienceLabel: 'పరిశ్రమ అనుభవం (సంవత్సరాలు):',

    fundingPrompt: 'మీ సంస్థకు ఎంత నిధులు లేదా రుణ సహాయం అవసరం?',
    exactFundingLabel: 'లేదా ఖచ్చితమైన రుణం / నిధుల అవసరాన్ని పేర్కొనండి:',
    exactFundingPlaceholder: 'ఉదా. 300000',
    costAndGapTitle: 'ప్రాజెక్ట్ ఖర్చు, నిధుల అంతరం మరియు వ్యాపార అవసరాలు',
    totalCostLabel: 'మొత్తం అంచనా ప్రాజెక్ట్ ఖర్చు:',
    totalCostPlaceholder: 'ఉదా. 500000',
    ownInvestmentLabel: 'మీ సొంత పెట్టుబడి / సహకారం:',
    ownInvestmentPlaceholder: 'ఉదా. 100000',
    fundingGapLabel: 'లెక్కించిన నిధుల అంతరం:',
    gapFormulaHint: 'ప్రాజెక్ట్ ఖర్చు − సొంత పెట్టుబడి',
    primaryNeedLabel: 'ప్రాథమిక మద్దతు అవసరం:',
    secondaryNeedsLabel: 'ద్వితీయ మద్దతు అవసరాలు (బహుళ-ఎంపిక, ఐచ్ఛికం):',
    selectedCount: (cnt) => `${cnt} ఎంపిక చేయబడింది`,
    secondaryNeedsHint: 'అవసరమైన అదనపు సహాయాన్ని ఎంచుకోండి (ప్రాథమిక అవసరం ఇక్కడ మినహాయించబడింది).',
    bizIdeaLabel: 'వ్యాపార ఆలోచన / కార్యాచరణ సారాంశం (ఐచ్ఛికం):',
    bizIdeaPlaceholder: 'ఉదా. సౌరశక్తితో నడిచే కోల్డ్ స్టోరేజ్ లేదా పర్యావరణ అనుకూల ప్యాకేజింగ్',

    regStatusLabel: 'నమోదు లైఫ్‌సైకిల్ స్థితి:',

    reviewProjectCostGap: 'ప్రాజెక్ట్ ఖర్చు / అంతరం:',
    reviewPrimaryNeed: 'ప్రాథమిక అవసరం:',
    reviewSecondaryNeeds: 'అదనపు అవసరాలు:',
    reviewEntityStructure: 'సంస్థ నిర్మాణం:',
    reviewSubSector: 'ఉప-రంగం:',
  },

  kn: {
    journeyEyebrow: 'ನಿಮ್ಮ ವ್ಯವಹಾರ ವಿವರಗಳ ಪಯಣ',
    stepIndicator: (curr, total, name) => `ಹಂತ ${curr} / ${total}: ${name}`,
    clearAllFields: 'ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಅಳಿಸಿ',
    resetForm: 'ಫಾರ್ಮ್ ಮರುಹೊಂದಿಸಿ',
    completedPercent: 'ಪೂರ್ಣಗೊಂಡಿದೆ',

    valCategory: 'ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಾಮಾಜಿಕ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    valAge: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ವಯಸ್ಸನ್ನು ನಮೂದಿಸಿ (ಕನಿಷ್ಠ 18 ವರ್ಷಗಳು).',
    valState: 'ನಿಮ್ಮ ವ್ಯವಹಾರ ರಾಜ್ಯ ಅಥವಾ ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    valLocation: 'ನಿಮ್ಮ ಉದ್ಯಮದ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ (ಗ್ರಾಮೀಣ ಅಥವಾ ನಗರ).',
    valIncome: 'ಕುಟುಂಬದ ಅಂದಾಜು ವಾರ್ಷಿಕ ಆದಾಯವನ್ನು ನಮೂದಿಸಿ.',
    valBizStage: 'ನಿಮ್ಮ ವ್ಯಾಪಾರ ಯೋಜನಾ ಹಂತವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    valBizSector: 'ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ವ್ಯವಹಾರ ಕ್ಷೇತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    valFunding: 'ನಿಧಿ ಅಥವಾ ಸಾಲದ ಅವಶ್ಯಕತೆಯ ಶ್ರೇಣಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    valRegistration: 'ನಿಮ್ಮ ವ್ಯವಹಾರ ನೋಂದಣಿ ಸ್ಥಿತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    valTurnover: 'ನಿಮ್ಮ ವಾರ್ಷಿಕ ವ್ಯವಹಾರ ವಹಿವಾಟು ಶ್ರೇಣಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    valCompleteAll: 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅಗತ್ಯ ಪ್ರಶ್ನೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.',

    notSetAge: 'ಆಯ್ಕೆ ಮಾಡಲಾಗಿಲ್ಲ (18–70)',
    agePlaceholder: 'ಉದಾ. 28',
    selectStatePlaceholder: '-- ನಿಮ್ಮ ರಾಜ್ಯ ಅಥವಾ ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ --',
    districtLabel: 'ಜಿಲ್ಲೆ / ನಗರ (ಐಚ್ಛಿಕ):',
    districtPlaceholder: 'ಉದಾ. ಮೈಸೂರು, ಪುಣೆ, ವಾರಣಾಸಿ',
    diffStateCheckbox: 'ವ್ಯವಹಾರವು ವಾಸಸ್ಥಳಕ್ಕಿಂತ ಬೇರೆ ರಾಜ್ಯದಲ್ಲಿದೆ',
    domicileStateLabel: 'ಖಾಯಂ ನಿವಾಸ / ಡೊಮಿಸೈಲ್ ರಾಜ್ಯ:',
    domicileQuotaHint: 'ರಾಜ್ಯ ಕೋಟಾ ಅರ್ಹತೆಗಾಗಿ',
    selectHomeStatePlaceholder: '-- ನಿಮ್ಮ ನಿವಾಸ ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ --',
    notEnteredIncome: 'ನಮೂದಿಸಿಲ್ಲ',
    incomePlaceholder: 'ಉದಾ. 250000',

    planningPrompt: 'ನಿಮ್ಮ ವ್ಯಾಪಾರ ಉದ್ಯಮಕ್ಕಾಗಿ ನೀವು ಪ್ರಸ್ತುತ ಏನು ಯೋಜಿಸುತ್ತಿದ್ದೀರಿ?',
    lifecyclePhaseLabel: 'ನಿರ್ದಿಷ್ಟ ಜೀವನಚಕ್ರದ ಹಂತ (ಐಚ್ಛಿಕ):',
    lifecyclePhaseHint: 'ಅನುದಾನ ಹಾಗೂ ಸಾಲದ ಹೊಂದಾಣಿಕೆಯನ್ನು ನಿಖರಗೊಳಿಸುತ್ತದೆ',
    operationalStatusLabel: 'ಪ್ರಸ್ತುತ ಕಾರ್ಯಾಚರಣೆಯ ಸ್ಥಿತಿ (ಐಚ್ಛಿಕ):',

    legalEntityLabel: 'ಕಾನೂನುಬದ್ಧ ಸಂಸ್ಥೆಯ ರಚನೆ (ಐಚ್ಛಿಕ):',
    legalEntityHint: 'ಮಾಲೀಕತ್ವ, ಪ್ರೈವೇಟ್ ಲಿಮಿಟೆಡ್, ಸ್ವಸಹಾಯ ಸಂಘ ಇತ್ಯಾದಿ',
    subSectorLabel: 'ನಿರ್ದಿಷ್ಟ ಉಪ-ವಲಯ / ವ್ಯಾಪಾರ (ಐಚ್ಛಿಕ):',
    subSectorPlaceholder: 'ಉದಾ. ಡೈರಿ ಚಿಲ್ಲಿಂಗ್, ಸಿದ್ಧ ಉಡುಪುಗಳು, ಸೌರ ಉಪಕರಣಗಳು',
    experienceLabel: 'ಉದ್ಯಮದ ಅನುಭವ (ವರ್ಷಗಳು):',

    fundingPrompt: 'ನಿಮ್ಮ ವ್ಯಾಪಾರ ಉದ್ಯಮಕ್ಕೆ ಎಷ್ಟು ಹಣಕಾಸು ಅಥವಾ ಸಾಲದ ನೆರವು ಬೇಕು?',
    exactFundingLabel: 'ಅಥವಾ ನಿಖರವಾದ ಸಾಲ / ನಿಧಿಯ ಅಗತ್ಯವನ್ನು ನಮೂದಿಸಿ:',
    exactFundingPlaceholder: 'ಉದಾ. 300000',
    costAndGapTitle: 'ಯೋಜನಾ ವೆಚ್ಚ, ನಿಧಿ ಅಂತರ ಮತ್ತು ವ್ಯವಹಾರ ಅಗತ್ಯಗಳು',
    totalCostLabel: 'ಒಟ್ಟು ಅಂದಾಜು ಯೋಜನಾ ವೆಚ್ಚ:',
    totalCostPlaceholder: 'ಉದಾ. 500000',
    ownInvestmentLabel: 'ನಿಮ್ಮ ಸ್ವಂತ ಹೂಡಿಕೆ / ಕೊಡುಗೆ:',
    ownInvestmentPlaceholder: 'ಉದಾ. 100000',
    fundingGapLabel: 'ಲೆಕ್ಕಹಾಕಿದ ನಿಧಿಯ ಅಂತರ:',
    gapFormulaHint: 'ಯೋಜನಾ ವೆಚ್ಚ − ಸ್ವಂತ ಹೂಡಿಕೆ',
    primaryNeedLabel: 'ಪ್ರಾಥಮಿಕ ಬೆಂಬಲದ ಅಗತ್ಯ:',
    secondaryNeedsLabel: 'ದ್ವಿತೀಯ ಬೆಂಬಲ ಅಗತ್ಯಗಳು (ಬಹು-ಆಯ್ಕೆ, ಐಚ್ಛಿಕ):',
    selectedCount: (cnt) => `${cnt} ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ`,
    secondaryNeedsHint: 'ಅಗತ್ಯವಿರುವ ಪೂರಕ ಬೆಂಬಲವನ್ನು ಆಯ್ಕೆಮಾಡಿ (ಪ್ರಾಥಮಿಕ ಅಗತ್ಯವನ್ನು ಇಲ್ಲಿ ಹೊರಗಿಡಲಾಗಿದೆ).',
    bizIdeaLabel: 'ವ್ಯಾಪಾರ ಕಲ್ಪನೆ / ಚಟುವಟಿಕೆಯ ಸಾರಾಂಶ (ಐಚ್ಛಿಕ):',
    bizIdeaPlaceholder: 'ಉದಾ. ಸೌರಶಕ್ತಿ ಚಾಲಿತ ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಘಟಕ ಅಥವಾ ಪರಿಸರಸ್ನೇಹಿ ಪ್ಯಾಕೇಜಿಂಗ್',

    regStatusLabel: 'ನೋಂದಣಿ ಸ್ಥಿತಿ:',

    reviewProjectCostGap: 'ಯೋಜನಾ ವೆಚ್ಚ / ಅಂತರ:',
    reviewPrimaryNeed: 'ಪ್ರಾಥಮಿಕ ಅಗತ್ಯ:',
    reviewSecondaryNeeds: 'ಹೆಚ್ಚುವರಿ ಅಗತ್ಯಗಳು:',
    reviewEntityStructure: 'ಸಂಸ್ಥೆಯ ರಚನೆ:',
    reviewSubSector: 'ಉಪ-ವಲಯ:',
  },

  ml: {
    journeyEyebrow: 'നിങ്ങളുടെ ബിസിനസ്സ് പ്രൊഫൈൽ യാത്ര',
    stepIndicator: (curr, total, name) => `ഘട്ടം ${curr} / ${total}: ${name}`,
    clearAllFields: 'എല്ലാ ഫീൽഡുകളും മായ്‌ക്കുക',
    resetForm: 'ഫോം പുനഃക്രമീകരിക്കുക',
    completedPercent: 'പൂർത്തിയായി',

    valCategory: 'തുടരുന്നതിന് ദയവായി നിങ്ങളുടെ സാമൂഹിക വിഭാഗം തിരഞ്ഞെടുക്കുക.',
    valAge: 'സാധുവായ ഒരു പ്രായം നൽകുക (കുറഞ്ഞത് 18 വയസ്സ്).',
    valState: 'നിങ്ങളുടെ ബിസിനസ്സ് സംസ്ഥാനം അല്ലെങ്കിൽ കേന്ദ്രഭരണ പ്രദേശം തിരഞ്ഞെടുക്കുക.',
    valLocation: 'നിങ്ങളുടെ സംരംഭ സ്ഥാനം തിരഞ്ഞെടുക്കുക (ഗ്രാമപ്രദേശം അല്ലെങ്കിൽ നഗരം).',
    valIncome: 'കുടുംബത്തിന്റെ ഏകദേശ വാർഷിക വരുമാനം നൽകുക.',
    valBizStage: 'നിങ്ങളുടെ ബിസിനസ്സ് ആസൂത്രണ ഘട്ടം തിരഞ്ഞെടുക്കുക.',
    valBizSector: 'നിങ്ങളുടെ പ്രാഥമിക ബിസിനസ്സ് മേഖല തിരഞ്ഞെടുക്കുക.',
    valFunding: 'ഫണ്ടിംഗ് അല്ലെങ്കിൽ ക്രെഡിറ്റ് ആവശ്യകത ശ്രേണി തിരഞ്ഞെടുക്കുക.',
    valRegistration: 'നിങ്ങളുടെ ബിസിനസ്സ് രജിസ്ട്രേഷൻ നില തിരഞ്ഞെടുക്കുക.',
    valTurnover: 'നിങ്ങളുടെ വാർഷിക ബിസിനസ്സ് വിറ്റുവരവ് ശ്രേണി തിരഞ്ഞെടുക്കുക.',
    valCompleteAll: 'ആവശ്യമായ എല്ലാ ചോദ്യങ്ങളും പൂർത്തിയാക്കുക.',

    notSetAge: 'തിരഞ്ഞെടുത്തിട്ടില്ല (18–70)',
    agePlaceholder: 'ഉദാ. 28',
    selectStatePlaceholder: '-- നിങ്ങളുടെ സംസ്ഥാനം അല്ലെങ്കിൽ കേന്ദ്രഭരണ പ്രദേശം തിരഞ്ഞെടുക്കുക --',
    districtLabel: 'ജില്ല / നഗരം (ഓപ്ഷണൽ):',
    districtPlaceholder: 'ഉദാ. മൈസൂർ, പൂനെ, വാരണാസി',
    diffStateCheckbox: 'ബിസിനസ്സ് താമസിക്കുന്ന സംസ്ഥാനത്തിൽ നിന്ന് വ്യത്യസ്തമായ സംസ്ഥാനത്തിലാണ്',
    domicileStateLabel: 'സ്ഥിരതാമസ / ആവാസ സംസ്ഥാനം:',
    domicileQuotaHint: 'സംസ്ഥാന ക്വാട്ട യോഗ്യതയ്ക്കായി',
    selectHomeStatePlaceholder: '-- നിങ്ങളുടെ താമസ സംസ്ഥാനം തിരഞ്ഞെടുക്കുക --',
    notEnteredIncome: 'നൽകിയിട്ടില്ല',
    incomePlaceholder: 'ഉദാ. 250000',

    planningPrompt: 'നിങ്ങളുടെ ബിസിനസ്സ് സംരംഭത്തിനായി നിലവിൽ എന്താണ് ആസൂത്രണം ചെയ്യുന്നത്?',
    lifecyclePhaseLabel: 'നിർദ്ദിഷ്ട ജീവിതചക്ര ഘട്ടം (ഓപ്ഷണൽ):',
    lifecyclePhaseHint: 'ഗ്രാന്റും ക്രെഡിറ്റും തമ്മിലുള്ള പൊരുത്തം മെച്ചപ്പെടുത്തുന്നു',
    operationalStatusLabel: 'നിലവിലെ പ്രവർത്തന നില (ഓപ്ഷണൽ):',

    legalEntityLabel: 'നിയമപരമായ സ്ഥാപന ഘടന (ഓപ്ഷണൽ):',
    legalEntityHint: 'പ്രൊപ്രൈറ്റർഷിപ്പ്, പ്രൈവറ്റ് ലിമിറ്റഡ്, എസ്എച്ച്ജി മുതലായവ',
    subSectorLabel: 'നിർദ്ദിഷ്ട ഉപമേഖല / വ്യാപാരം (ഓപ്ഷണൽ):',
    subSectorPlaceholder: 'ഉദാ. ഡയറി ചില്ലിംഗ്, റെഡിമെയ്ഡ് വസ്ത്രങ്ങൾ, സോളാർ ഉപകരണങ്ങൾ',
    experienceLabel: 'വ്യവസായ പരിചയം (വർഷങ്ങൾ):',

    fundingPrompt: 'നിങ്ങളുടെ ബിസിനസ്സ് സംരംഭത്തിന് എത്ര ഫണ്ടിംഗ് അല്ലെങ്കിൽ വായ്പാ സഹായം ആവശ്യമാണ്?',
    exactFundingLabel: 'അല്ലെങ്കിൽ കൃത്യമായ വായ്പ / ഫണ്ടിംഗ് ആവശ്യകത നൽകുക:',
    exactFundingPlaceholder: 'ഉദാ. 300000',
    costAndGapTitle: 'പ്രോജക്റ്റ് ചെലവ്, ഫണ്ടിംഗ് വിടവ് & ബിസിനസ്സ് ആവശ്യങ്ങൾ',
    totalCostLabel: 'ആകെ കണക്കാക്കിയ പ്രോജക്റ്റ് ചെലവ്:',
    totalCostPlaceholder: 'ഉദാ. 500000',
    ownInvestmentLabel: 'നിങ്ങളുടെ സ്വന്തം നിക്ഷേപം / സംഭാവന:',
    ownInvestmentPlaceholder: 'ഉദാ. 100000',
    fundingGapLabel: 'കണക്കാക്കിയ ഫണ്ടിംഗ് വിടവ്:',
    gapFormulaHint: 'പ്രോജക്റ്റ് ചെലവ് − സ്വന്തം നിക്ഷേപം',
    primaryNeedLabel: 'പ്രാഥമിക പിന്തുണ ആവശ്യം:',
    secondaryNeedsLabel: 'ദ്വിതീയ പിന്തുണ ആവശ്യങ്ങൾ (മൾട്ടി-സെലക്റ്റ്, ഓപ്ഷണൽ):',
    selectedCount: (cnt) => `${cnt} തിരഞ്ഞെടുത്തു`,
    secondaryNeedsHint: 'ആവശ്യമായ അനുബന്ധ പിന്തുണ തിരഞ്ഞെടുക്കുക (പ്രാഥമിക ആവശ്യം ഇവിടെ ഒഴിവാക്കിയിരിക്കുന്നു).',
    bizIdeaLabel: 'ബിസിനസ്സ് ആശയം / പ്രവർത്തന സംഗ്രഹം (ഓപ്ഷണൽ):',
    bizIdeaPlaceholder: 'ഉദാ. സൗരോർജ്ജത്തിൽ പ്രവർത്തിക്കുന്ന കോൾഡ് സ്റ്റോറേജ് അല്ലെങ്കിൽ പരിസ്ഥിതി സൗഹൃദ പാക്കേജിംഗ്',

    regStatusLabel: 'രജിസ്ട്രേഷൻ നില:',

    reviewProjectCostGap: 'പ്രോജക്റ്റ് ചെലവ് / വിടവ്:',
    reviewPrimaryNeed: 'പ്രാഥമിക ആവശ്യം:',
    reviewSecondaryNeeds: 'അധിക ആവശ്യങ്ങൾ:',
    reviewEntityStructure: 'സ്ഥാപന ഘടന:',
    reviewSubSector: 'ഉപമേഖല:',
  },
};

export const SUPPORT_NEEDS_LOCALIZED: Record<SupportNeedType, Record<Language, string>> = {
  CAPITAL: {
    en: 'Seed Capital',
    hi: 'प्रारंभिक पूंजी',
    ta: 'தொடக்க மூலதனம்',
    te: 'ప్రారంభ మూలధనం',
    kn: 'ಆರಂಭಿಕ ಬಂಡವಾಳ',
    ml: 'പ്രാരംഭ മൂലധനം',
  },
  WORKING_CAPITAL: {
    en: 'Working Capital',
    hi: 'कार्यशील पूंजी',
    ta: 'செயல் மூலதனம்',
    te: 'వర్కింగ్ క్యాపిటల్',
    kn: 'ದುಡಿಯುವ ಬಂಡವಾಳ',
    ml: 'പ്രവർത്തന മൂലധനം',
  },
  EQUIPMENT: {
    en: 'Machinery / Tools',
    hi: 'मशीनरी व उपकरण',
    ta: 'இயந்திரங்கள் / கருவிகள்',
    te: 'యంత్రాలు / పరికరాలు',
    kn: 'ಯಂತ್ರೋಪಕರಣಗಳು / ಉಪಕರಣಗಳು',
    ml: 'മെഷിനറി / ഉപകരണങ്ങൾ',
  },
  SUBSIDY: {
    en: 'Govt Subsidy',
    hi: 'सरकारी सब्सिडी',
    ta: 'அரசு மானியம்',
    te: 'ప్రభుత్వ రాయితీ',
    kn: 'ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿ',
    ml: 'സർക്കാർ സബ്‌സിഡി',
  },
  INFRASTRUCTURE: {
    en: 'Work Shed / Infra',
    hi: 'कार्यशाला / इंफ्रा',
    ta: 'பணிமனை / கட்டமைப்பு',
    te: 'వర్క్‌షెడ్ / మౌలిక వసతులు',
    kn: 'ವರ್ಕ್‌ಶೆಡ್ / ಮೂಲಸೌಕರ್ಯ',
    ml: 'വർക്ക് ഷെഡ് / ഇൻഫ്രാ',
  },
  SKILL_DEVELOPMENT: {
    en: 'Skill Training',
    hi: 'कौशल प्रशिक्षण',
    ta: 'திறன் பயிற்சி',
    te: 'నైపుణ్య శిక్షణ',
    kn: 'ಕೌಶಲ್ಯ ತರಬೇತಿ',
    ml: 'നൈപുണ്യ പരിശീലനം',
  },
  MARKET_ACCESS: {
    en: 'Market Access',
    hi: 'बाजार संपर्क',
    ta: 'சந்தை அணுகல்',
    te: 'మార్కెట్ సదుపాయం',
    kn: 'ಮಾರುಕಟ್ಟೆ ಸಂಪರ್ಕ',
    ml: 'വിപണി പ്രവേശനം',
  },
  CREDIT: {
    en: 'Collateral-Free Credit',
    hi: 'गारंटी-मुक्त बैंक ऋण',
    ta: 'பிணையில்லா கடன்',
    te: 'హామీ లేని క్రెడిట్',
    kn: 'ಭದ್ರತೆಯಿಲ್ಲದ ಸಾಲ',
    ml: 'ഈടില്ലാത്ത വായ്പ',
  },
  TRAINING: {
    en: 'Entrepreneurship Training',
    hi: 'उद्यमिता प्रशिक्षण',
    ta: 'தொழில்முனைவோர் பயிற்சி',
    te: 'ఎంట్రప్రెన్యూర్‌షిప్ శిక్షణ',
    kn: 'ಉದ್ಯಮಶೀಲತೆ ತರಬೇತಿ',
    ml: 'സംരംഭകത്വ പരിശീലനം',
  },
  TECHNOLOGY: {
    en: 'Technology & Digital',
    hi: 'तकनीकी एवं डिजिटलीकरण',
    ta: 'தொழில்நுட்பம் & டிஜிட்டல்',
    te: 'సాంకేతికత & డిజిటల్',
    kn: 'ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ಡಿಜಿಟಲ್',
    ml: 'സാങ്കേതികവിദ്യ & ഡിജിറ്റൽ',
  },
  RAW_MATERIAL: {
    en: 'Raw Material Assistance',
    hi: 'कच्चा माल सहायता',
    ta: 'மூலப்பொருள் உதவி',
    te: 'ముడి సరుకు సహాయం',
    kn: 'ಕಚ್ಚಾ ವಸ್ತು ಸಹಾಯ',
    ml: 'അസംസ്കൃത വസ്തു സഹായം',
  },
  BUSINESS_REGISTRATION: {
    en: 'Compliance / Licenses',
    hi: 'अनुपालन व लाइसेंस',
    ta: 'இணக்கம் / உரிமங்கள்',
    te: 'లైసెన్స్‌లు & అనుమతులు',
    kn: 'ಪರವಾನಗಿಗಳು ಮತ್ತು ಅನುಮೋದನೆಗಳು',
    ml: 'ലൈസൻസുകൾ & അനുമതികൾ',
  },
  MENTORSHIP: {
    en: 'Expert Mentorship',
    hi: 'विशेषज्ञ मार्गदर्शन',
    ta: 'வல்லுநர் வழிகாட்டுதல்',
    te: 'నిపుణుల మార్గదర్శకత్వం',
    kn: 'ತಜ್ಞರ ಮಾರ್ಗದರ್ಶನ',
    ml: 'വിദഗ്ദ്ധ മാർഗ്ഗനിർദ്ദേശം',
  },
  OTHER: {
    en: 'Other Support',
    hi: 'अन्य सहायता',
    ta: 'பிற ஆதரவு',
    te: 'ఇతర సహాయం',
    kn: 'ಇತರ ಬೆಂಬಲ',
    ml: 'മറ്റ് പിന്തുണ',
  },
};

export const LIFECYCLE_PHASES_LOCALIZED: Record<BusinessStageKey, Record<Language, string>> = {
  IDEA: {
    en: 'Idea / Concept',
    hi: 'विचार / अवधारणा',
    ta: 'யோசனை / கருத்து',
    te: 'ఆలోచన / భావన',
    kn: 'ಕಲ್ಪನೆ / ಪರಿಕಲ್ಪನೆ',
    ml: 'ആശയം / രൂപരേഖ',
  },
  PRE_LAUNCH: {
    en: 'Pre-launch Setup',
    hi: 'लॉन्च पूर्व तैयारी',
    ta: 'துவக்க முந்தைய ஏற்பாடு',
    te: 'ప్రారంభ పూర్వ సెటప్',
    kn: 'ಪ್ರಾರಂಭ ಪೂರ್ವ ತಯಾರಿ',
    ml: 'ആരംഭത്തിന് മുമ്പുള്ള തയ്യാറെടുപ്പ്',
  },
  NEW_BUSINESS: {
    en: 'Early Setup (< 1 yr)',
    hi: 'नई इकाई (< 1 वर्ष)',
    ta: 'ஆரம்ப நிலை (< 1 ஆண்டு)',
    te: 'ప్రారంభ యూనిట్ (< 1 సం.)',
    kn: 'ಹೊಸ ಘಟಕ (< 1 ವರ್ಷ)',
    ml: 'ആദ്യകാല സജ്ജീകരണം (< 1 വർഷം)',
  },
  EARLY_OPERATION: {
    en: 'Established (1–3 yrs)',
    hi: 'प्रारंभिक संचालन (1–3 वर्ष)',
    ta: 'நிறுவப்பட்டது (1–3 ஆண்டுகள்)',
    te: 'నడుస్తున్న వ్యాపారం (1–3 సం.)',
    kn: 'ಸ್ಥಾಪಿತ (1–3 ವರ್ಷಗಳು)',
    ml: 'പ്രവർത്തനത്തിൽ (1–3 വർഷം)',
  },
  GROWTH: {
    en: 'Scaling / Growth',
    hi: 'विकास / वृद्धि',
    ta: 'வளர்ச்சி / விரிவாக்கம்',
    te: 'వ్యాపార విస్తరణ / వృద్ధి',
    kn: 'ಬೆಳವಣಿಗೆ / ವಿಸ್ತರಣೆ',
    ml: 'വളർച്ച / വിപുലീകരണം',
  },
  EXPANSION: {
    en: 'Plant Expansion',
    hi: 'इकाई विस्तार',
    ta: 'ஆலை விரிவாக்கம்',
    te: 'ప్లాంట్ విస్తరణ',
    kn: 'ಘಟಕ ವಿಸ್ತರಣೆ',
    ml: 'പ്ലാന്റ് വിപുലീകരണം',
  },
  DISTRESS_OR_RESTRUCTURING: {
    en: 'Revival / Turnaround',
    hi: 'पुनरुद्धार',
    ta: 'புத்துயிரூட்டல்',
    te: 'పునరుద్ధరణ',
    kn: 'ಪುನರುಜ್ಜೀವನ',
    ml: 'പുനരുജ്ജീവനം',
  },
};

export const OPERATIONAL_STATUS_LOCALIZED: Record<OperationalStatus, Record<Language, string>> = {
  OPERATING: {
    en: 'Operating / Active',
    hi: 'सक्रिय रूप से चालू',
    ta: 'செயலில் உள்ளது',
    te: 'కార్యాచరణలో ఉంది',
    kn: 'ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ',
    ml: 'പ്രവർത്തനക്ഷമമാണ്',
  },
  NOT_STARTED: {
    en: 'Not Yet Started',
    hi: 'अभी शुरू नहीं हुआ',
    ta: 'இன்னும் தொடங்கவில்லை',
    te: 'ఇంకా ప్రారంభం కాలేదు',
    kn: 'ಇನ್ನೂ ಪ್ರಾರಂಭವಾಗಿಲ್ಲ',
    ml: 'ഇതുവരെ ആരംഭിച്ചിട്ടില്ല',
  },
  EXPANDING: {
    en: 'Actively Expanding',
    hi: 'विस्तार प्रगति पर',
    ta: 'விரிவாக்கம் நடக்கிறது',
    te: 'చురుగ్గా విస్తరిస్తోంది',
    kn: 'ಸಕ್ರಿಯವಾಗಿ ವಿಸ್ತರಿಸುತ್ತಿದೆ',
    ml: 'സജീവമായി വിപുലീകരിക്കുന്നു',
  },
  TEMPORARILY_INACTIVE: {
    en: 'Temporarily Inactive',
    hi: 'अस्थायी रूप से निष्क्रिय',
    ta: 'தற்காலிகமாக செயல்படவில்லை',
    te: 'తాత్కాలికంగా నిలిపివేయబడింది',
    kn: 'ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಷ್ಕ್ರಿಯ',
    ml: 'താൽക്കാലികമായി നിർത്തിവച്ചിരിക്കുന്നു',
  },
  UNKNOWN: {
    en: 'Status Unspecified',
    hi: 'अनिर्दिष्ट स्थिति',
    ta: 'குறிப்பிடப்படவில்லை',
    te: 'పేర్కొనబడలేదు',
    kn: 'ನಿರ್ದಿಷ್ಟಪಡಿಸಲಾಗಿಲ್ಲ',
    ml: 'വ്യക്തമാക്കിയിട്ടില്ല',
  },
};

export const REGISTRATION_STATUS_LOCALIZED: Record<RegistrationStatus, Record<Language, string>> = {
  REGISTERED: {
    en: 'Registered',
    hi: 'पंजीकृत',
    ta: 'பதிவு செய்யப்பட்டது',
    te: 'నమోదైంది',
    kn: 'ನೋಂದಾಯಿಸಲಾಗಿದೆ',
    ml: 'രജിസ്റ്റർ ചെയ്തത്',
  },
  IN_PROCESS: {
    en: 'In Process / Applied',
    hi: 'प्रक्रियाधीन',
    ta: 'செயல்பாட்டில் உள்ளது / விண்ணப்பிக்கப்பட்டது',
    te: 'ప్రక్రియలో ఉంది / దరఖాస్తు చేయబడింది',
    kn: 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ / ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
    ml: 'നടപടിക്രമത്തിൽ / അപേക്ഷിച്ചു',
  },
  NOT_REGISTERED: {
    en: 'Unregistered',
    hi: 'अपंजीकृत',
    ta: 'பதிவு செய்யப்படாதது',
    te: 'నమోదు కాలೇదు',
    kn: 'ನೋಂದಣಿಯಾಗಿಲ್ಲ',
    ml: 'രജിസ്റ്റർ ചെയ്യാത്തത്',
  },
  NOT_APPLICABLE: {
    en: 'Not Applicable',
    hi: 'लागू नहीं',
    ta: 'பொருந்தாது',
    te: 'వర్తించదు',
    kn: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
    ml: 'ബാಧಕമല്ല',
  },
  UNKNOWN: {
    en: 'Status Unspecified',
    hi: 'अनिर्दिष्ट स्थिति',
    ta: 'குறிப்பிடப்படவில்லை',
    te: 'పేర్కొనబడలేదు',
    kn: 'ನಿರ್ದಿಷ್ಟಪಡಿಸಲಾಗಿಲ್ಲ',
    ml: 'വ്യക്തമാക്കിയിട്ടില്ല',
  },
};

export const BUSINESS_ENTITY_LOCALIZED: Record<BusinessEntityType, Record<Language, string>> = {
  SOLE_PROPRIETORSHIP: {
    en: 'Sole Proprietorship',
    hi: 'एकल स्वामित्व',
    ta: 'தனியுரிமை',
    te: 'ఏకైక యాజమాన్యం',
    kn: 'ಏಕಮಾತ್ರ ಮಾಲೀಕತ್ವ',
    ml: 'ഏക ഉടമസ്ഥത',
  },
  PARTNERSHIP: {
    en: 'Partnership Firm',
    hi: 'साझेदारी फर्म',
    ta: 'கூட்டாண்மை நிறுவனம்',
    te: 'భాగస్వామ్య సంస్థ',
    kn: 'ಪಾಲುದಾರಿಕೆ ಸಂಸ್ಥೆ',
    ml: 'പങ്കാളിത്ത സ്ഥാപനം',
  },
  LLP: {
    en: 'Limited Liability Partnership (LLP)',
    hi: 'सीमित देयता भागीदारी (LLP)',
    ta: 'வரையறுக்கப்பட்ட பொறுப்பு கூட்டாண்மை (LLP)',
    te: 'పరిమిత బాధ్యత భాగస్వామ్యం (LLP)',
    kn: 'ಸೀಮಿತ ಹೊಣೆಗಾರಿಕೆ ಪಾಲುದಾರಿಕೆ (LLP)',
    ml: 'പരിമിത ബാധ്യത പങ്കാളിത്തം (LLP)',
  },
  PRIVATE_LIMITED: {
    en: 'Private Limited Company (Pvt Ltd)',
    hi: 'प्राइवेट लिमिटेड कंपनी',
    ta: 'பிரைவேட் லிமிடெட் நிறுவனம்',
    te: 'ప్రైవేట్ లిమిటెడ్ కంపెనీ',
    kn: 'ಪ್ರೈವೇಟ್ ಲಿಮಿಟೆಡ್ ಕಂಪನಿ',
    ml: 'പ്രൈവറ്റ് ലിമിറ്റഡ് കമ്പനി',
  },
  SELF_HELP_GROUP: {
    en: 'Self Help Group (SHG)',
    hi: 'स्वयं सहायता समूह (SHG)',
    ta: 'சுய உதவிக் குழு (SHG)',
    te: 'స్వయం సహాయక బృందం (SHG)',
    kn: 'ಸ್ವಸಹಾಯ ಗುಂಪು (SHG)',
    ml: 'സ്വയം സഹായ സംഘം (SHG)',
  },
  COOPERATIVE: {
    en: 'Cooperative Society',
    hi: 'सहकारी समिति',
    ta: 'கூட்டுறவு சங்கம்',
    te: 'సహకార సంఘం',
    kn: 'ಸಹಕಾರಿ ಸಂಘ',
    ml: 'സഹകരണ സംഘം',
  },
  INDIVIDUAL: {
    en: 'Individual Artisan / Vendor',
    hi: 'व्यक्तिगत कारीगर / विक्रेता',
    ta: 'தனிப்பட்ட கைவினைஞர் / விற்பனையாளர்',
    te: 'వ్యక్తిగత చేతివృత్తిదారుడు / విక్రేత',
    kn: 'ವೈಯಕ್ತಿಕ ಕುಶಲಕರ್ಮಿ / ಮಾರಾಟಗಾರ',
    ml: 'വ്യക്തിഗത കരകൗശല വിദഗ്ദ്ധൻ / വിൽപ്പനക്കാരൻ',
  },
  INFORMAL_BUSINESS: {
    en: 'Informal / Unorganized Enterprise',
    hi: 'अनौपचारिक उद्यम',
    ta: 'முறைசாரா தொழில்',
    te: 'అసంఘటిత సంస్థ',
    kn: 'ಅಸಂಘಟಿತ ಉದ್ಯಮ',
    ml: 'അസംഘടിത സംരംഭം',
  },
  NOT_REGISTERED: {
    en: 'Not Registered / New Proposed Entity',
    hi: 'गैर-पंजीकृत / प्रस्तावित इकाई',
    ta: 'பதிவு செய்யப்படாத / முன்மொழியப்பட்ட நிறுவனம்',
    te: 'నమోదు కాలేదు / ప్రతిపాదిత సంస్థ',
    kn: 'ನೋಂದಣಿಯಾಗಿಲ್ಲ / ಪ್ರಸ್ತಾವಿತ ಘಟಕ',
    ml: 'രജിസ്റ്റർ ചെയ്യാത്ത / പുതിയ നിർദ്ദിഷ്ട സ്ഥാപനം',
  },
  OTHER: {
    en: 'Other Entity Structure',
    hi: 'अन्य संरचना',
    ta: 'பிற அமைப்பு',
    te: 'ఇతర సంస్థ',
    kn: 'ಇತರ ರಚನೆ',
    ml: 'മറ്റ് ഘടന',
  },
};
