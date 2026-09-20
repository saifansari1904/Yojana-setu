import {
  UserProfile,
  SocialCategory,
  BusinessType,
  BusinessStage,
} from '../../types';
import { INDIAN_STATES } from '../../constants/geography';
import { BUSINESS_TYPES, SOCIAL_CATEGORIES } from '../../constants/business';
import { deriveBusinessNeedProfile, deriveBusinessProfile } from '../business/businessNeedProfile';
import { Language } from '../../i18n/types';

type ValidationErrorCode =
  | 'REQUIRED'
  | 'INVALID'
  | 'OUT_OF_RANGE'
  | 'NEGATIVE'
  | 'MISSING_AGE'
  | 'INVALID_AGE'
  | 'INVALID_INCOME'
  | 'MISSING_STATE'
  | 'INVALID_STATE'
  | 'MISSING_CATEGORY'
  | 'INVALID_CATEGORY'
  | 'MISSING_BUSINESS_STAGE'
  | 'MISSING_BUSINESS_TYPE'
  | 'INVALID_BUSINESS_TYPE'
  | 'MISSING_FUNDING'
  | 'INVALID_FUNDING'
  | 'MISSING_TURNOVER'
  | 'PROFILE_MISSING';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  errorCodes?: Record<string, ValidationErrorCode>;
}

interface ProfileValidationResult extends ValidationResult {
  formattedProfile?: UserProfile;
}

const VALIDATION_ERROR_CODES: Record<string, ValidationErrorCode> = {
  age: 'INVALID_AGE',
  annualIncome: 'INVALID_INCOME',
  state: 'INVALID_STATE',
  category: 'INVALID_CATEGORY',
  businessStage: 'MISSING_BUSINESS_STAGE',
  businessType: 'INVALID_BUSINESS_TYPE',
  funding: 'INVALID_FUNDING',
  fundingRequired: 'INVALID_FUNDING',
  existingTurnover: 'MISSING_TURNOVER',
  profile: 'PROFILE_MISSING',
};

function codeForField(field: string): ValidationErrorCode {
  return VALIDATION_ERROR_CODES[field] || 'INVALID';
}

import { VALIDATION_MESSAGES } from '../../i18n/validationI18n';



/**
 * Validates a single stage of the eligibility assessment questionnaire.
 */

/**
 * Validates the complete user profile prior to running matching algorithms.
 * Guarantees that no corrupted or partial data can trigger runtime calculation errors.
 */
export function validateUserProfile(
  profile: Partial<UserProfile> | null | undefined,
  lang: Language = 'en'
): ProfileValidationResult {
  const m = VALIDATION_MESSAGES[lang] || VALIDATION_MESSAGES.en;
  const errors: Record<string, string> = {};

  if (!profile) {
    return {
      isValid: false,
      errors: {
        profile: m.profileMissing,
      },
      errorCodes: { profile: 'PROFILE_MISSING' },
    };
  }

  // Validate core demographic and statutory attributes
  if (!profile.category || !SOCIAL_CATEGORIES.includes(profile.category)) {
    errors.category = m.categoryRequired;
  }

  if (profile.age === undefined || profile.age === null || isNaN(profile.age)) {
    errors.age = m.ageRequired;
  } else if (profile.age < 18 || profile.age > 75) {
    errors.age = m.ageMin;
  }

  if (
    profile.annualIncome === undefined ||
    profile.annualIncome === null ||
    isNaN(profile.annualIncome)
  ) {
    errors.annualIncome = m.incomeRequired;
  } else if (profile.annualIncome < 0) {
    errors.annualIncome = m.incomeNegative;
  }

  if (!profile.businessType || !BUSINESS_TYPES.includes(profile.businessType)) {
    errors.businessType = m.businessTypeRequired;
  }

  if (!profile.state || !INDIAN_STATES.includes(profile.state)) {
    errors.state = m.stateRequired;
  }

  const isValid = Object.keys(errors).length === 0;

  let formattedProfile: UserProfile | undefined;
  if (isValid) {
    formattedProfile = {
      category: profile.category!,
      age: Number(profile.age),
      annualIncome: Number(profile.annualIncome),
      businessType: profile.businessType!,
      state: profile.state!,
      district: profile.district,
      gender: profile.gender,
      applicantName: profile.applicantName,
      isRegistered: profile.isRegistered,
      businessStage: profile.businessStage,
      sector: profile.sector,
      entrepreneurType: profile.entrepreneurType,
      fundingRequired: profile.fundingRequired,
      fundingRangeId: profile.fundingRangeId,
      ruralUrban: profile.ruralUrban,
      enterpriseType: profile.enterpriseType,
      existingTurnover: profile.existingTurnover,
      turnoverRangeId: profile.turnoverRangeId,
      businessRegistration: profile.businessRegistration,

      // Phase 4.1 Business Profile Fields
      businessIdea: profile.businessIdea,
      businessName: profile.businessName,
      businessStageKey: profile.businessStageKey,
      businessEntityType: profile.businessEntityType,
      residenceState: profile.residenceState || profile.state,
      businessState: profile.businessState || profile.state,
      isInterstate: profile.isInterstate,
      operationalStatus: profile.operationalStatus,
      registrationStatus: profile.registrationStatus,
      entrepreneurExperienceYears: profile.entrepreneurExperienceYears,
      totalProjectCost: profile.totalProjectCost,
      existingInvestment: profile.existingInvestment,
      fundingGap: profile.fundingGap,
      primarySupportNeed: profile.primarySupportNeed,
      secondarySupportNeeds: profile.secondarySupportNeeds,
      subSector: profile.subSector,
      businessProfile: profile.businessProfile,
      businessNeedProfile: profile.businessNeedProfile,
    };

    if (!formattedProfile.businessNeedProfile) {
      formattedProfile.businessNeedProfile = deriveBusinessNeedProfile(formattedProfile);
    }
    if (!formattedProfile.businessProfile) {
      formattedProfile.businessProfile = deriveBusinessProfile(formattedProfile);
    }
  }

  return {
    isValid,
    errors,
    errorCodes: Object.fromEntries(Object.keys(errors).map((field) => [field, codeForField(field)])),
    formattedProfile,
  };
}
