import {
  UserProfile,
  SocialCategory,
  BusinessType,
  BusinessStage,
} from '../../types';
import { INDIAN_STATES } from '../../constants/geography';
import { BUSINESS_TYPES, SOCIAL_CATEGORIES } from '../../constants/business';
import { deriveBusinessNeedProfile, deriveBusinessProfile } from '../business/businessNeedProfile';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ProfileValidationResult extends ValidationResult {
  formattedProfile?: UserProfile;
}

/**
 * Validates a single stage of the eligibility assessment questionnaire.
 */
export function validateStage(
  stageId: string,
  profile: Partial<UserProfile>,
  lang: 'hi' | 'en' = 'en'
): ValidationResult {
  const isHi = lang === 'hi';
  const errors: Record<string, string> = {};

  switch (stageId) {
    case 'about_you': {
      // Age validation: statutory entrepreneurial age in India is 18 to 75
      if (profile.age === undefined || profile.age === null || isNaN(profile.age)) {
        errors.age = isHi ? 'कृपया अपनी आयु दर्ज करें।' : 'Please enter your age.';
      } else if (profile.age < 18) {
        errors.age = isHi
          ? 'सरकारी योजनाओं हेतु न्यूनतम कानूनी आयु 18 वर्ष है।'
          : 'Minimum statutory entrepreneurial age for government schemes is 18 years.';
      } else if (profile.age > 75) {
        errors.age = isHi
          ? 'योजना पात्रता हेतु अधिकतम अनुमत आयु 75 वर्ष है।'
          : 'Maximum eligible age threshold is 75 years.';
      }

      // Annual household income validation: non-negative
      if (
        profile.annualIncome === undefined ||
        profile.annualIncome === null ||
        isNaN(profile.annualIncome)
      ) {
        errors.annualIncome = isHi
          ? 'कृपया वार्षिक पारिवारिक आय दर्ज करें।'
          : 'Please enter your annual household income.';
      } else if (profile.annualIncome < 0) {
        errors.annualIncome = isHi
          ? 'वार्षिक आय ऋणात्मक नहीं हो सकती।'
          : 'Annual income cannot be a negative amount.';
      }

      // State validation: must be a known state
      if (!profile.state) {
        errors.state = isHi
          ? 'कृपया अपने व्यवसाय का राज्य या केंद्र शासित प्रदेश चुनें।'
          : 'Please select your business state or Union Territory.';
      } else if (!INDIAN_STATES.includes(profile.state)) {
        errors.state = isHi
          ? 'कृपया सूची से एक मान्य भारतीय राज्य चुनें।'
          : 'Please select a valid Indian state or Union Territory from the list.';
      }

      // Category validation
      if (!profile.category) {
        errors.category = isHi ? 'कृपया अपना सामाजिक वर्ग चुनें।' : 'Please select your social category.';
      } else if (!SOCIAL_CATEGORIES.includes(profile.category as SocialCategory)) {
        errors.category = isHi ? 'अमान्य सामाजिक वर्ग।' : 'Invalid social category selected.';
      }
      break;
    }

    case 'business_stage': {
      if (!profile.businessStage) {
        errors.businessStage = isHi
          ? 'कृपया अपने व्यवसाय की वर्तमान स्थिति चुनें।'
          : 'Please select your current business stage.';
      }
      break;
    }

    case 'business_type': {
      if (!profile.businessType) {
        errors.businessType = isHi
          ? 'कृपया अपने व्यवसाय का प्राथमिक कार्यक्षेत्र चुनें।'
          : 'Please select your primary business domain.';
      } else if (!BUSINESS_TYPES.includes(profile.businessType as BusinessType)) {
        errors.businessType = isHi ? 'अमान्य कार्यक्षेत्र।' : 'Invalid business domain selected.';
      }
      break;
    }

    case 'funding': {
      if (!profile.fundingRangeId && !profile.fundingRequired) {
        errors.funding = isHi
          ? 'कृपया आवश्यक पूंजीगत वित्तीय सहायता का दायरा चुनें।'
          : 'Please select your required financial assistance range.';
      }
      if (profile.fundingRequired !== undefined && profile.fundingRequired !== null) {
        if (profile.fundingRequired < 0) {
          errors.fundingRequired = isHi
            ? 'वित्तीय सहायता राशि धनात्मक होनी चाहिए।'
            : 'Funding amount must be a positive number.';
        }
      }
      break;
    }

    case 'existing_biz': {
      // Required only if existing or expanding
      if (profile.businessStage === 'existing' || profile.businessStage === 'expanding') {
        if (!profile.turnoverRangeId && profile.existingTurnover === undefined) {
          errors.existingTurnover = isHi
            ? 'कृपया अपने व्यवसाय का वार्षिक कारोबार चुनें।'
            : 'Please indicate your current annual turnover.';
        }
      }
      break;
    }

    default:
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the complete user profile prior to running matching algorithms.
 * Guarantees that no corrupted or partial data can trigger runtime calculation errors.
 */
export function validateUserProfile(
  profile: Partial<UserProfile> | null | undefined,
  lang: 'hi' | 'en' = 'en'
): ProfileValidationResult {
  const isHi = lang === 'hi';
  const errors: Record<string, string> = {};

  if (!profile) {
    return {
      isValid: false,
      errors: {
        profile: isHi ? 'प्रोफ़ाइल डेटा अनुपलब्ध है।' : 'User profile data is missing.',
      },
    };
  }

  // Validate core demographic and statutory attributes
  if (!profile.category || !SOCIAL_CATEGORIES.includes(profile.category)) {
    errors.category = isHi
      ? 'मान्य सामाजिक वर्ग आवश्यक है।'
      : 'Valid social category is required.';
  }

  if (profile.age === undefined || profile.age === null || isNaN(profile.age)) {
    errors.age = isHi ? 'आयु आवश्यक है।' : 'Age is required.';
  } else if (profile.age < 18 || profile.age > 75) {
    errors.age = isHi
      ? 'आयु 18 से 75 वर्ष के मध्य होनी चाहिए।'
      : 'Age must be between 18 and 75 years.';
  }

  if (
    profile.annualIncome === undefined ||
    profile.annualIncome === null ||
    isNaN(profile.annualIncome)
  ) {
    errors.annualIncome = isHi ? 'वार्षिक आय आवश्यक है।' : 'Annual household income is required.';
  } else if (profile.annualIncome < 0) {
    errors.annualIncome = isHi
      ? 'वार्षिक आय 0 या उससे अधिक होनी चाहिए।'
      : 'Annual income must be non-negative.';
  }

  if (!profile.businessType || !BUSINESS_TYPES.includes(profile.businessType)) {
    errors.businessType = isHi
      ? 'मान्य व्यवसाय क्षेत्र आवश्यक है।'
      : 'Valid business type is required.';
  }

  if (!profile.state || !INDIAN_STATES.includes(profile.state)) {
    errors.state = isHi
      ? 'मान्य भारतीय राज्य अथवा केंद्र शासित प्रदेश आवश्यक है।'
      : 'Valid Indian state or Union Territory is required.';
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
    formattedProfile,
  };
}
