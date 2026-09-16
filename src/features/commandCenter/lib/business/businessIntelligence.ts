/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessStage, UserProfile } from '../../types';

export interface JourneyStageInfo {
  stage: BusinessStage;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  order: number;
}

export const JOURNEY_STAGES: JourneyStageInfo[] = [
  {
    stage: 'IDEA',
    title: 'Idea',
    titleHi: 'विचार (Idea)',
    description: 'Conceptualizing business model and feasibility',
    descriptionHi: 'व्यवसाय मॉडल और व्यवहार्यता की अवधारणा',
    order: 1,
  },
  {
    stage: 'REGISTRATION',
    title: 'Registration',
    titleHi: 'पंजीकरण (Registration)',
    description: 'Formalizing enterprise with Udyam, GST, and trade licensing',
    descriptionHi: 'उद्यम, जीएसटी और व्यापार लाइसेंस के साथ औपचारिककरण',
    order: 2,
  },
  {
    stage: 'FUNDING',
    title: 'Funding',
    titleHi: 'वित्तपोषण (Funding)',
    description: 'Securing capital, credit-linked subsidies, or term loans',
    descriptionHi: 'पूंजी, ऋण-संबद्ध सब्सिडी या सावधि ऋण प्राप्त करना',
    order: 3,
  },
  {
    stage: 'MARKET_ACCESS',
    title: 'Market Access',
    titleHi: 'बाजार पहुंच (Market Access)',
    description: 'Reaching B2B, GeM portal, retail buyers, and tenders',
    descriptionHi: 'B2B, GeM पोर्टल, खुदरा खरीदारों और निविदाओं तक पहुंच',
    order: 4,
  },
  {
    stage: 'EXPANSION',
    title: 'Expansion',
    titleHi: 'विस्तार (Expansion)',
    description: 'Scaling manufacturing capacity, technology upgrade, and exports',
    descriptionHi: 'विनिर्माण क्षमता, प्रौद्योगिकी उन्नयन और निर्यात का विस्तार',
    order: 5,
  },
];

export interface ProfileCompletenessResult {
  percentage: number;
  missingFields: string[];
  missingFieldsHi: string[];
  isComplete: boolean;
}

export function calculateProfileCompleteness(profile: UserProfile): ProfileCompletenessResult {
  const fields = [
    { key: 'businessName', label: 'Business Name', labelHi: 'व्यवसाय का नाम', value: profile.businessName },
    { key: 'businessType', label: 'Business Type', labelHi: 'व्यवसाय का प्रकार', value: profile.businessType },
    { key: 'businessStage', label: 'Business Stage', labelHi: 'व्यवसाय चरण', value: profile.businessStage },
    { key: 'state', label: 'State / Location', labelHi: 'राज्य / स्थान', value: profile.state },
    { key: 'socialCategory', label: 'Social Category', labelHi: 'सामाजिक श्रेणी', value: profile.socialCategory },
    { key: 'age', label: 'Age', labelHi: 'आयु', value: profile.age },
    { key: 'annualIncome', label: 'Annual Income', labelHi: 'वार्षिक आय', value: profile.annualIncome },
    { key: 'investmentAmount', label: 'Investment Requirement', labelHi: 'निवेश आवश्यकता', value: profile.investmentAmount },
  ];

  const filledCount = fields.filter(f => f.value !== undefined && f.value !== '').length;
  const percentage = Math.round((filledCount / fields.length) * 100);

  const missingFields: string[] = [];
  const missingFieldsHi: string[] = [];

  fields.forEach(f => {
    if (f.value === undefined || f.value === '') {
      missingFields.push(f.label);
      missingFieldsHi.push(f.labelHi);
    }
  });

  return {
    percentage,
    missingFields,
    missingFieldsHi,
    isComplete: percentage >= 85,
  };
}

export function getBusinessJourneyStage(profile: UserProfile): BusinessStage {
  if (profile.businessStage) {
    return profile.businessStage;
  }

  // Deduce stage from enterprise signals
  if (!profile.hasUdyam && !profile.businessName) {
    return 'IDEA';
  }
  if (!profile.hasUdyam) {
    return 'REGISTRATION';
  }
  if (profile.investmentAmount && profile.investmentAmount > 0) {
    return 'FUNDING';
  }
  if (profile.turnover && profile.turnover > 2000000) {
    return 'EXPANSION';
  }
  return 'FUNDING';
}
