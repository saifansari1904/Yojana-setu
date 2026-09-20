import { BusinessType, SocialCategory, BusinessStage } from '../types';

export const BUSINESS_TYPES: BusinessType[] = [
  'trading',
  'manufacturing',
  'services',
  'agri',
  'handicraft',
  'food',
  'tech',
];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  trading: 'Trading & Retail',
  manufacturing: 'Manufacturing & Processing',
  services: 'Services & Operations',
  agri: 'Agri & Allied Units',
  handicraft: 'Handicrafts & Artisans',
  food: 'Food Processing & Catering',
  tech: 'Tech & Digital Solutions',
};

export const BUSINESS_TYPE_LABELS_HI: Record<BusinessType, string> = {
  manufacturing: 'विनिर्माण एवं उत्पादन',
  trading: 'व्यापार एवं खुदरा',
  services: 'सेवाएं एवं परिचालन',
  agri: 'कृषि एवं संबद्ध इकाइयां',
  handicraft: 'हस्तशिल्प एवं कारीगर',
  food: 'खाद्य प्रसंस्करण एवं खानपान',
  tech: 'तकनीकी एवं डिजिटल समाधान',
};

export const SOCIAL_CATEGORIES: SocialCategory[] = [
  'SC',
  'ST',
  'OBC',
  'General',
  'Woman',
  'Minority',
];

export const CATEGORY_LABELS: Record<SocialCategory, string> = {
  SC: 'Scheduled Caste (SC)',
  ST: 'Scheduled Tribe (ST)',
  OBC: 'Other Backward Class (OBC)',
  General: 'General Category',
  Woman: 'Woman Entrepreneur',
  Minority: 'Minority Community',
};

export const CATEGORY_LABELS_HI: Record<SocialCategory, string> = {
  SC: 'अनुसूचित जाति (SC)',
  ST: 'अनुसूचित जनजाति (ST)',
  Woman: 'महिला उद्यमी (Woman)',
  OBC: 'अन्य पिछड़ा वर्ग (OBC)',
  Minority: 'अल्पसंख्यक समुदाय',
  General: 'सामान्य वर्ग (General)',
};

export const BUSINESS_STAGES: BusinessStage[] = [
  'new',
  'existing',
  'expanding',
  'idea',
  'scaling',
];
