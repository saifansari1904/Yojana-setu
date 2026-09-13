import { BusinessType, SocialCategory, BusinessStage } from './user';
import { Sector } from '../data/schemeTaxonomy';

// ==========================================
// 1. BUSINESS STAGE TAXONOMY
// ==========================================
export type BusinessStageKey =
  | 'IDEA'
  | 'PRE_LAUNCH'
  | 'NEW_BUSINESS'
  | 'EARLY_OPERATION'
  | 'GROWTH'
  | 'EXPANSION'
  | 'DISTRESS_OR_RESTRUCTURING';

export interface BusinessStageInfo {
  key: BusinessStageKey;
  labelEn: string;
  labelHi: string;
  descEn: string;
  descHi: string;
}

export const BUSINESS_STAGE_TAXONOMY: Record<BusinessStageKey, BusinessStageInfo> = {
  IDEA: {
    key: 'IDEA',
    labelEn: 'Idea & Planning',
    labelHi: 'विचार एवं योजना',
    descEn: 'I am exploring, conceiving, or planning a new business venture.',
    descHi: 'मैं नया व्यवसाय शुरू करने की योजना बना रहा/रही हूँ।',
  },
  PRE_LAUNCH: {
    key: 'PRE_LAUNCH',
    labelEn: 'Pre-Launch & Setup',
    labelHi: 'लॉन्च पूर्व तैयारी',
    descEn: 'Developing prototype, securing premises, or obtaining initial registrations.',
    descHi: 'प्रोटोटाइप विकास, स्थल चयन अथवा प्रारंभिक औपचारिकताओं में संलग्न।',
  },
  NEW_BUSINESS: {
    key: 'NEW_BUSINESS',
    labelEn: 'New Business (< 1 Year)',
    labelHi: 'नया उद्यम (< 1 वर्ष)',
    descEn: 'Recently launched operations and acquiring initial customers.',
    descHi: 'हाल ही में परिचालन प्रारंभ किया है एवं प्रारंभिक ग्राहक बना रहे हैं।',
  },
  EARLY_OPERATION: {
    key: 'EARLY_OPERATION',
    labelEn: 'Early Operation (1–3 Years)',
    labelHi: 'प्रारंभिक परिचालन (1-3 वर्ष)',
    descEn: 'Operational business establishing product-market fit and regular revenues.',
    descHi: 'सक्रिय परिचालन जिसमें नियमित व्यापार एवं ग्राहक आधार बन चुका है।',
  },
  GROWTH: {
    key: 'GROWTH',
    labelEn: 'Growth & Scaling',
    labelHi: 'विकास एवं विस्तार',
    descEn: 'Stable profitable operations seeking capital to increase market presence.',
    descHi: 'स्थिर परिचालन एवं बाजार में उपस्थिति बढ़ाने हेतु विस्तार पूंजी की आवश्यकता।',
  },
  EXPANSION: {
    key: 'EXPANSION',
    labelEn: 'Expansion & Diversification',
    labelHi: 'बृहद विस्तार एवं विविधीकरण',
    descEn: 'Establishing new branch units, modernizing machinery, or entering exports.',
    descHi: 'नई उत्पादन इकाइयों की स्थापना, आधुनिक मशीनरी या निर्यात में प्रवेश।',
  },
  DISTRESS_OR_RESTRUCTURING: {
    key: 'DISTRESS_OR_RESTRUCTURING',
    labelEn: 'Turnaround & Relief',
    labelHi: 'पुनर्गठन एवं राहत',
    descEn: 'Operating unit facing temporary cashflow constraints or restructuring needs.',
    descHi: 'अस्थायी वित्तीय कठिनाइयों अथवा कार्यशील पूंजी संकट से उबरने का प्रयास।',
  },
};

// ==========================================
// 2. BUSINESS LEGAL STRUCTURE / ENTITY TYPE
// ==========================================
export type BusinessEntityType =
  | 'SOLE_PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'LLP'
  | 'PRIVATE_LIMITED'
  | 'SELF_HELP_GROUP'
  | 'COOPERATIVE'
  | 'INDIVIDUAL'
  | 'INFORMAL_BUSINESS'
  | 'OTHER'
  | 'NOT_REGISTERED';

export const BUSINESS_ENTITY_LABELS: Record<BusinessEntityType, { en: string; hi: string; descEn: string; descHi: string }> = {
  SOLE_PROPRIETORSHIP: {
    en: 'Sole Proprietorship',
    hi: 'एकल स्वामित्व',
    descEn: 'Single owner registered under local shop act or trade license',
    descHi: 'एकल स्वामी आधारित पंजीकृत व्यवसाय',
  },
  PARTNERSHIP: {
    en: 'Partnership Firm',
    hi: 'साझेदारी फर्म',
    descEn: 'Two or more partners with registered or unregistered partnership deed',
    descHi: 'दो या दो से अधिक साझेदारों की फर्म',
  },
  LLP: {
    en: 'Limited Liability Partnership (LLP)',
    hi: 'सीमित देयता भागीदारी (LLP)',
    descEn: 'Corporate entity registered under LLP Act with MCA',
    descHi: 'एमसीए के तहत पंजीकृत सीमित देयता भागीदारी',
  },
  PRIVATE_LIMITED: {
    en: 'Private Limited Company (Pvt Ltd)',
    hi: 'प्राइवेट लिमिटेड कंपनी',
    descEn: 'Incorporated company under Companies Act with MCA',
    descHi: 'कंपनी अधिनियम के तहत निगमित कंपनी',
  },
  SELF_HELP_GROUP: {
    en: 'Self Help Group (SHG)',
    hi: 'स्वयं सहायता समूह (SHG)',
    descEn: 'Community-based micro savings and credit entrepreneur group',
    descHi: 'सामुदायिक माइक्रो बचत एवं ऋण उद्यमी समूह',
  },
  COOPERATIVE: {
    en: 'Cooperative Society',
    hi: 'सहकारी समिति',
    descEn: 'Registered cooperative society under State or Central Act',
    descHi: 'राज्य या केंद्रीय अधिनियम के तहत पंजीकृत समिति',
  },
  INDIVIDUAL: {
    en: 'Individual Artisan / Vendor',
    hi: 'व्यक्तिगत कारीगर / विक्रेता',
    descEn: 'Solo artisan, craftsperson, or nano entrepreneur without formal entity',
    descHi: 'स्वतंत्र कारीगर, शिल्पकार या सड़क विक्रेता',
  },
  INFORMAL_BUSINESS: {
    en: 'Informal / Unorganized Enterprise',
    hi: 'अनौपचारिक उद्यम',
    descEn: 'Small home unit or local trade transitioning to formal sector',
    descHi: 'लघु घरेलू इकाई या गैर-पंजीकृत पारंपरिक व्यापार',
  },
  OTHER: {
    en: 'Other Entity Structure',
    hi: 'अन्य संरचना',
    descEn: 'Trust, society, or specialized legal entity',
    descHi: 'ट्रस्ट या अन्य विशेष विधिक इकाई',
  },
  NOT_REGISTERED: {
    en: 'Not Registered / New Proposed Entity',
    hi: 'गैर-पंजीकृत / प्रस्तावित इकाई',
    descEn: 'Legal structure not yet determined or registered',
    descHi: 'इकाई अभी तक पंजीकृत नहीं की गई है',
  },
};

// ==========================================
// 3. REGISTRATION STATUS (UNKNOWN != NOT_REGISTERED)
// ==========================================
export type RegistrationStatus =
  | 'REGISTERED'
  | 'NOT_REGISTERED'
  | 'IN_PROCESS'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN';

export const REGISTRATION_STATUS_META: Record<
  RegistrationStatus,
  { labelEn: string; labelHi: string; badgeColor: string }
> = {
  REGISTERED: {
    labelEn: 'Formally Registered',
    labelHi: 'औपचारिक रूप से पंजीकृत',
    badgeColor: '#16A34A',
  },
  NOT_REGISTERED: {
    labelEn: 'Not Registered',
    labelHi: 'पंजीकृत नहीं',
    badgeColor: '#D97706',
  },
  IN_PROCESS: {
    labelEn: 'Registration In Process',
    labelHi: 'पंजीकरण प्रक्रियाधीन',
    badgeColor: '#2563EB',
  },
  NOT_APPLICABLE: {
    labelEn: 'Not Applicable',
    labelHi: 'लागू नहीं',
    badgeColor: '#6B7280',
  },
  UNKNOWN: {
    labelEn: 'Status Unspecified',
    labelHi: 'अनिर्दिष्ट स्थिति',
    badgeColor: '#9CA3AF',
  },
};

// ==========================================
// 4. BUSINESS OPERATIONAL STATUS
// ==========================================
export type OperationalStatus =
  | 'NOT_STARTED'
  | 'OPERATING'
  | 'TEMPORARILY_INACTIVE'
  | 'EXPANDING'
  | 'UNKNOWN';

export const OPERATIONAL_STATUS_META: Record<
  OperationalStatus,
  { labelEn: string; labelHi: string }
> = {
  NOT_STARTED: {
    labelEn: 'Not Started / Pre-Launch',
    labelHi: 'प्रारंभ नहीं हुआ / पूर्व-लॉन्च',
  },
  OPERATING: {
    labelEn: 'Actively Operating',
    labelHi: 'सक्रिय रूप से परिचालन में',
  },
  TEMPORARILY_INACTIVE: {
    labelEn: 'Temporarily Inactive',
    labelHi: 'अस्थायी रूप से निष्क्रिय',
  },
  EXPANDING: {
    labelEn: 'Actively Expanding',
    labelHi: 'सक्रिय रूप से विस्ताररत',
  },
  UNKNOWN: {
    labelEn: 'Operational Status Unspecified',
    labelHi: 'परिचालन स्थिति अनिर्दिष्ट',
  },
};

// ==========================================
// 5. BUSINESS NEED & SUPPORT TAXONOMY
// ==========================================
export type SupportNeedType =
  | 'CAPITAL'
  | 'WORKING_CAPITAL'
  | 'EQUIPMENT'
  | 'INFRASTRUCTURE'
  | 'SUBSIDY'
  | 'CREDIT'
  | 'TRAINING'
  | 'SKILL_DEVELOPMENT'
  | 'MARKET_ACCESS'
  | 'TECHNOLOGY'
  | 'RAW_MATERIAL'
  | 'BUSINESS_REGISTRATION'
  | 'MENTORSHIP'
  | 'OTHER';

export interface SupportNeedInfo {
  type: SupportNeedType;
  labelEn: string;
  labelHi: string;
  descEn: string;
  descHi: string;
  iconName: string;
}

export const SUPPORT_NEEDS_TAXONOMY: Record<SupportNeedType, SupportNeedInfo> = {
  CAPITAL: {
    type: 'CAPITAL',
    labelEn: 'Initial Setup Capital',
    labelHi: 'प्रारंभिक पूंजी',
    descEn: 'Upfront equity or seed funding to establish enterprise fundamentals.',
    descHi: 'उद्यम स्थापना हेतु प्रारंभिक पूंजी अथवा बीज कोष।',
    iconName: 'IndianRupee',
  },
  WORKING_CAPITAL: {
    type: 'WORKING_CAPITAL',
    labelEn: 'Working Capital',
    labelHi: 'कार्यशील पूंजी',
    descEn: 'Day-to-day operational liquidity, inventory, and supplier payments.',
    descHi: 'दैनिक परिचालन, स्टॉक खरीद एवं कर्मचारियों के वेतन हेतु तरलता।',
    iconName: 'Coins',
  },
  EQUIPMENT: {
    type: 'EQUIPMENT',
    labelEn: 'Machinery & Equipment',
    labelHi: 'संयंत्र एवं मशीनरी',
    descEn: 'Procurement of modern machinery, commercial tools, or processing plants.',
    descHi: 'आधुनिक मशीनरी, व्यावसायिक उपकरण या संयंत्र की खरीद।',
    iconName: 'Hammer',
  },
  INFRASTRUCTURE: {
    type: 'INFRASTRUCTURE',
    labelEn: 'Premises & Infrastructure',
    labelHi: 'परिसर एवं बुनियादी ढांचा',
    descEn: 'Civil shed, factory premises, storage sheds, or commercial space fitting.',
    descHi: 'कारखाना शेड, भंडारण स्थल अथवा व्यावसायिक परिसर निर्माण।',
    iconName: 'Building2',
  },
  SUBSIDY: {
    type: 'SUBSIDY',
    labelEn: 'Government Capital Subsidy',
    labelHi: 'पूंजीगत सब्सिडी',
    descEn: 'Non-repayable direct government grant reducing net project cost.',
    descHi: 'गैर-वापसी योग्य सरकारी अनुदान जिससे कुल परियोजना लागत कम हो।',
    iconName: 'Sparkles',
  },
  CREDIT: {
    type: 'CREDIT',
    labelEn: 'Collateral-Free Bank Credit',
    labelHi: 'गारंटी-मुक्त बैंक ऋण',
    descEn: 'Affordable commercial bank loan backed by CGTMSE credit guarantee.',
    descHi: 'बिना किसी गिरवी या बंधक के रियायती सरकारी क्रेडिट गारंटी ऋण।',
    iconName: 'Landmark',
  },
  TRAINING: {
    type: 'TRAINING',
    labelEn: 'Entrepreneurship Development',
    labelHi: 'उद्यमिता विकास प्रशिक्षण',
    descEn: 'Business management, accounting, and compliance leadership training (EDP).',
    descHi: 'व्यावसायिक प्रबंधन, बहीखाता एवं उद्यमिता विकास कार्यक्रम (EDP)।',
    iconName: 'GraduationCap',
  },
  SKILL_DEVELOPMENT: {
    type: 'SKILL_DEVELOPMENT',
    labelEn: 'Vocational & Technical Skill',
    labelHi: 'व्यावसायिक कौशल विकास',
    descEn: 'Certified artisan, technical craftsmanship, or digital productivity skills.',
    descHi: 'प्रमाणित शिल्पकारी, तकनीकी हुनर या डिजिटल कौशल संवर्धन।',
    iconName: 'Briefcase',
  },
  MARKET_ACCESS: {
    type: 'MARKET_ACCESS',
    labelEn: 'Market Linkage & Exhibitions',
    labelHi: 'बाजार संपर्क एवं प्रदर्शनी',
    descEn: 'Government e-Marketplace (GeM), trade fairs, and export promotional channels.',
    descHi: 'सरकारी ई-मार्केटप्लेस (GeM), व्यापार मेले एवं खुदरा बाजार संपर्क।',
    iconName: 'ShoppingBag',
  },
  TECHNOLOGY: {
    type: 'TECHNOLOGY',
    labelEn: 'Technology & Digitalization',
    labelHi: 'तकनीकी एवं डिजिटलीकरण',
    descEn: 'ERP, automation, e-commerce adoption, and modern tech stack integration.',
    descHi: 'सॉफ्टवेयर, स्वचालन, ई-कॉमर्स एवं आधुनिक तकनीक को अपनाना।',
    iconName: 'Cpu',
  },
  RAW_MATERIAL: {
    type: 'RAW_MATERIAL',
    labelEn: 'Raw Material Assistance',
    labelHi: 'कच्चा माल सहायता',
    descEn: 'Bulk raw material procurement through NSIC or state cooperative depots.',
    descHi: 'सस्ती दरों पर गुणवत्तापूर्ण कच्चा माल आपूर्ति सहायता।',
    iconName: 'Layers',
  },
  BUSINESS_REGISTRATION: {
    type: 'BUSINESS_REGISTRATION',
    labelEn: 'Udyam / GST Registration Support',
    labelHi: 'पंजीकरण एवं अनुपालन',
    descEn: 'Assistance with formalizing MSME identity, GST, FSSAI, and licenses.',
    descHi: 'उद्यम, जीएसटी, एफएसएसएआई एवं स्थानीय लाइसेंस प्राप्त करने में सहायता।',
    iconName: 'FileCheck2',
  },
  MENTORSHIP: {
    type: 'MENTORSHIP',
    labelEn: 'Expert Mentorship & Advisory',
    labelHi: 'विशेषज्ञ मार्गदर्शन एवं परामर्श',
    descEn: 'One-on-one strategic advisory, DPR review, and growth acceleration.',
    descHi: 'अनुभवी उद्योग विशेषज्ञों से विस्तृत परियोजना रिपोर्ट (DPR) मार्गदर्शन।',
    iconName: 'Users',
  },
  OTHER: {
    type: 'OTHER',
    labelEn: 'General Enterprise Support',
    labelHi: 'सामान्य उद्यम सहायता',
    descEn: 'Other customized business support requirements.',
    descHi: 'अन्य विशिष्ट व्यावसायिक आवश्यकताएं।',
    iconName: 'HelpCircle',
  },
};

// ==========================================
// 6. BUSINESS JOURNEY MODEL
// ==========================================
export type BusinessJourneyStage =
  | 'IDEA'
  | 'VALIDATE'
  | 'REGISTER'
  | 'FUND'
  | 'LAUNCH'
  | 'OPERATE'
  | 'GROW'
  | 'EXPAND';

export const BUSINESS_JOURNEY_STAGES: Array<{
  stage: BusinessJourneyStage;
  labelEn: string;
  labelHi: string;
  step: number;
}> = [
  { stage: 'IDEA', labelEn: 'Conceive Idea', labelHi: 'विचार निर्माण', step: 1 },
  { stage: 'VALIDATE', labelEn: 'Validate Market', labelHi: 'बाजार सत्यापन', step: 2 },
  { stage: 'REGISTER', labelEn: 'Formalize Entity', labelHi: 'पंजीकरण', step: 3 },
  { stage: 'FUND', labelEn: 'Secure Funding', labelHi: 'पूंजी व्यवस्था', step: 4 },
  { stage: 'LAUNCH', labelEn: 'Launch Enterprise', labelHi: 'उद्यम शुरुआत', step: 5 },
  { stage: 'OPERATE', labelEn: 'Daily Operations', labelHi: 'दैनिक संचालन', step: 6 },
  { stage: 'GROW', labelEn: 'Revenue Growth', labelHi: 'व्यवसाय वृद्धि', step: 7 },
  { stage: 'EXPAND', labelEn: 'Scale & Expand', labelHi: 'बृहद विस्तार', step: 8 },
];

// ==========================================
// 7. BUSINESS READINESS (NOT APPROVAL PROBABILITY)
// ==========================================
export type BusinessReadiness =
  | 'EARLY'
  | 'DEVELOPING'
  | 'READY_TO_LAUNCH'
  | 'OPERATING'
  | 'GROWTH_READY';

export const BUSINESS_READINESS_META: Record<
  BusinessReadiness,
  { labelEn: string; labelHi: string; descEn: string; descHi: string; badgeColor: string }
> = {
  EARLY: {
    labelEn: 'Early Discovery',
    labelHi: 'प्रारंभिक खोज',
    descEn: 'Exploring options and shaping initial business concept.',
    descHi: 'व्यावसायिक अवधारणा निर्माण एवं सरकारी योजनाओं की प्रारंभिक खोज।',
    badgeColor: '#6B7280',
  },
  DEVELOPING: {
    labelEn: 'Developing Concept',
    labelHi: 'विकासशील अवधारणा',
    descEn: 'Basic project parameters defined; ready for preliminary documentation.',
    descHi: 'मूलभूत परियोजना लागत निर्धारित; प्रारंभिक औपचारिकताओं हेतु तैयार।',
    badgeColor: '#D97706',
  },
  READY_TO_LAUNCH: {
    labelEn: 'Ready to Launch',
    labelHi: 'लॉन्च हेतु तैयार',
    descEn: 'Funding gap and operational requirements identified for credit applications.',
    descHi: 'वित्तीय अंतर एवं संसाधन आवश्यकताएं स्पष्ट; आवेदन हेतु अनुकूल।',
    badgeColor: '#2563EB',
  },
  OPERATING: {
    labelEn: 'Active Enterprise',
    labelHi: 'सक्रिय उद्यम',
    descEn: 'Established operations eligible for working capital and margin subsidies.',
    descHi: 'सक्रिय परिचालन जिसमें कार्यशील पूंजी व ब्याज सब्सिडी की पात्रता है।',
    badgeColor: '#16A34A',
  },
  GROWTH_READY: {
    labelEn: 'Growth & Expansion Ready',
    labelHi: 'विस्तार हेतु तैयार',
    descEn: 'Demonstrated operating history prepared for industrial credit guarantees.',
    descHi: 'सिद्ध परिचालन इतिहास एवं उच्च औद्योगिक क्रेडिट गारंटी हेतु उपयुक्त।',
    badgeColor: '#7C3AED',
  },
};

// ==========================================
// 8. DATA PROVENANCE
// ==========================================
export type DataProvenanceSource =
  | 'USER_PROVIDED'
  | 'SCHEME_DATA'
  | 'DERIVED'
  | 'UNKNOWN';

// ==========================================
// 9. REUSABLE BUSINESS PROFILE
// ==========================================
export interface BusinessProfile {
  businessIdea?: string;
  businessName?: string;
  businessStage: BusinessStageKey;
  businessStageSource: 'EXPLICIT' | 'INFERRED' | 'UNKNOWN';
  businessType: BusinessType;
  businessEntityType: BusinessEntityType;
  sector?: Sector;
  subSector?: string;
  residenceState: string;
  businessState: string;
  district?: string;
  isInterstate: boolean;
  operationalStatus: OperationalStatus;
  registrationStatus: RegistrationStatus;
  entrepreneurExperienceYears?: number;
  totalProjectCost?: number;
  existingInvestment?: number;
  additionalFundingRequired?: number;
  fundingGap: number;
  supportNeeds: {
    primaryNeed?: SupportNeedType;
    secondaryNeeds: SupportNeedType[];
  };
}

// ==========================================
// 10. DERIVED BUSINESS NEED PROFILE
// ==========================================
export interface BusinessNeedProfile {
  currentStage: BusinessStageKey;
  stageSource: 'EXPLICIT' | 'INFERRED' | 'UNKNOWN';
  primaryNeed?: SupportNeedType;
  secondaryNeeds: SupportNeedType[];
  totalProjectCost?: number;
  existingInvestment?: number;
  fundingGap: number;
  hasFundingDetails: boolean;
  sector?: Sector;
  subSector?: string;
  businessType: BusinessType;
  businessEntityType: BusinessEntityType;
  registrationStatus: RegistrationStatus;
  operationalStatus: OperationalStatus;
  location: {
    residenceState: string;
    businessState: string;
    district?: string;
    isInterstate: boolean;
  };
  readiness: BusinessReadiness;
  completenessScore: number; // 0–100%
  completedFieldCount: number;
  totalFieldCount: number;
  missingHighValueFields: Array<{
    fieldKey: string;
    labelEn: string;
    labelHi: string;
    priority: 'HIGH' | 'MEDIUM';
  }>;
  provenance: Record<string, DataProvenanceSource>;
  businessIdeaText?: string;
  businessName?: string;
}

// ==========================================
// 11. BUSINESS RELEVANCE SIGNAL (SEPARATE FROM STATUTORY MATCH)
// ==========================================
export type BusinessRelevanceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface SchemeBusinessRelevance {
  relevanceLevel: BusinessRelevanceLevel;
  badgeLabelEn: string;
  badgeLabelHi: string;
  matchedNeeds: Array<{
    needType: SupportNeedType;
    labelEn: string;
    labelHi: string;
  }>;
  stageFit: 'ALIGNED' | 'BROAD' | 'MISALIGNED' | 'UNKNOWN';
  explanationEn: string;
  explanationHi: string;
  fundingFitNoteEn?: string;
  fundingFitNoteHi?: string;
  provenance: DataProvenanceSource;
}
