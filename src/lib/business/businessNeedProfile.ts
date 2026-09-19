import {
  BusinessProfile,
  BusinessNeedProfile,
  BusinessStageKey,
  BusinessEntityType,
  RegistrationStatus,
  OperationalStatus,
  SupportNeedType,
  DataProvenanceSource,
} from '../../types/business';
import { UserProfile } from '../../types/user';
import { calculateFundingGap } from './fundingCalculator';
import { deriveBusinessStage, deriveBusinessReadiness } from './businessJourney';
import { calculateBusinessProfileCompleteness } from './businessProfileCompleteness';

/**
 * Normalizes user registration status, strictly respecting UNKNOWN != NOT_REGISTERED.
 */
export function normalizeRegistrationStatus(profile?: Partial<UserProfile> | null): RegistrationStatus {
  if (!profile) return 'NOT_REGISTERED';
  if (profile.registrationStatus) {
    return profile.registrationStatus;
  }

  if (profile.businessRegistration) {
    if (['udyam', 'gst', 'local_trade'].includes(profile.businessRegistration)) {
      return 'REGISTERED';
    }
    if (profile.businessRegistration === 'unregistered') {
      return 'NOT_REGISTERED';
    }
  }

  if (profile.isRegistered === true) {
    return 'REGISTERED';
  }

  if (profile.isRegistered === false) {
    return 'NOT_REGISTERED';
  }

  return 'UNKNOWN';
}

/**
 * Normalizes operational status.
 */
export function normalizeOperationalStatus(profile?: Partial<UserProfile> | null): OperationalStatus {
  if (!profile) return 'UNKNOWN';
  if (profile.operationalStatus) {
    return profile.operationalStatus;
  }

  if (profile.businessStage === 'existing') {
    return 'OPERATING';
  }

  if (profile.businessStage === 'expanding') {
    return 'EXPANDING';
  }

  if (profile.businessStage === 'new' || profile.businessStage === 'idea') {
    return 'NOT_STARTED';
  }

  if (profile.hasExistingBusiness === true) {
    return 'OPERATING';
  }

  if (profile.hasExistingBusiness === false) {
    return 'NOT_STARTED';
  }

  return 'UNKNOWN';
}

/**
 * Normalizes legal entity type.
 */
export function normalizeBusinessEntityType(profile?: Partial<UserProfile> | null): BusinessEntityType {
  if (!profile) return 'NOT_REGISTERED';
  if (profile.businessEntityType) {
    return profile.businessEntityType;
  }

  if (profile.enterpriseType === 'micro' || profile.enterpriseType === 'nano_informal') {
    return 'SOLE_PROPRIETORSHIP';
  }

  if (profile.businessRegistration === 'unregistered') {
    return 'INFORMAL_BUSINESS';
  }

  return 'NOT_REGISTERED';
}

/**
 * Derives a full structured BusinessProfile from a UserProfile.
 */
export function deriveBusinessProfile(profile?: UserProfile | null): BusinessProfile {
  const safeProfile = profile || ({} as Partial<UserProfile>);
  const { stage: currentStage, source: stageSource } = deriveBusinessStage(safeProfile);
  const regStatus = normalizeRegistrationStatus(safeProfile);
  const opStatus = normalizeOperationalStatus(safeProfile);
  const entityType = normalizeBusinessEntityType(safeProfile);

  const residenceState = safeProfile.residenceState || safeProfile.state || '';
  const businessState = safeProfile.businessState || safeProfile.state || '';
  const isInterstate = Boolean(
    residenceState && businessState && residenceState.trim() !== businessState.trim()
  );

  const fundingGap = calculateFundingGap(
    safeProfile.totalProjectCost,
    safeProfile.existingInvestment,
    safeProfile.fundingRequired
  );

  return {
    businessIdea: safeProfile.businessIdea?.trim() || undefined,
    businessName: safeProfile.businessName?.trim() || undefined,
    businessStage: currentStage,
    businessStageSource: stageSource,
    businessType: safeProfile.businessType,
    businessEntityType: entityType,
    sector: safeProfile.sector,
    subSector: safeProfile.subSector,
    residenceState,
    businessState,
    district: safeProfile.district,
    isInterstate,
    operationalStatus: opStatus,
    registrationStatus: regStatus,
    entrepreneurExperienceYears: safeProfile.entrepreneurExperienceYears,
    totalProjectCost: safeProfile.totalProjectCost,
    existingInvestment: safeProfile.existingInvestment,
    additionalFundingRequired: fundingGap,
    fundingGap,
    supportNeeds: {
      primaryNeed: safeProfile.primarySupportNeed,
      secondaryNeeds: safeProfile.secondarySupportNeeds || [],
    },
  };
}

/**
 * Pure, deterministic builder for BusinessNeedProfile.
 *
 * Keeps statutory inputs separate from derived needs,
 * tracks field provenance, and produces clean intelligence for downstream layers.
 */
export function deriveBusinessNeedProfile(profile?: UserProfile | null): BusinessNeedProfile {
  const safeProfile = profile || ({} as Partial<UserProfile>);
  const { stage: currentStage, source: stageSource } = deriveBusinessStage(safeProfile);
  const regStatus = normalizeRegistrationStatus(safeProfile);
  const opStatus = normalizeOperationalStatus(safeProfile);
  const entityType = normalizeBusinessEntityType(safeProfile);

  const residenceState = safeProfile.residenceState || safeProfile.state || '';
  const businessState = safeProfile.businessState || safeProfile.state || '';
  const isInterstate = Boolean(
    residenceState && businessState && residenceState.trim() !== businessState.trim()
  );

  const fundingGap = calculateFundingGap(
    safeProfile.totalProjectCost,
    safeProfile.existingInvestment,
    safeProfile.fundingRequired
  );

  const hasFundingDetails = Boolean(
    (safeProfile.totalProjectCost && safeProfile.totalProjectCost > 0) ||
      (safeProfile.fundingRequired && safeProfile.fundingRequired > 0) ||
      safeProfile.fundingRangeId
  );

  const readiness = deriveBusinessReadiness(safeProfile, fundingGap);
  const completeness = calculateBusinessProfileCompleteness(safeProfile);

  // Field-level data provenance tracking
  const provenance: Record<string, DataProvenanceSource> = {
    stage: stageSource === 'EXPLICIT' ? 'USER_PROVIDED' : stageSource === 'INFERRED' ? 'DERIVED' : 'UNKNOWN',
    businessType: profile.businessType ? 'USER_PROVIDED' : 'UNKNOWN',
    sector: profile.sector ? 'USER_PROVIDED' : 'DERIVED',
    registrationStatus: profile.registrationStatus ? 'USER_PROVIDED' : profile.businessRegistration ? 'DERIVED' : 'UNKNOWN',
    operationalStatus: profile.operationalStatus ? 'USER_PROVIDED' : profile.businessStage ? 'DERIVED' : 'UNKNOWN',
    fundingGap: (profile.totalProjectCost !== undefined || profile.existingInvestment !== undefined) ? 'DERIVED' : 'UNKNOWN',
    primaryNeed: profile.primarySupportNeed ? 'USER_PROVIDED' : 'UNKNOWN',
    readiness: 'DERIVED',
    completeness: 'DERIVED',
  };

  return {
    currentStage,
    stageSource,
    primaryNeed: profile.primarySupportNeed,
    secondaryNeeds: profile.secondarySupportNeeds || [],
    totalProjectCost: profile.totalProjectCost,
    existingInvestment: profile.existingInvestment,
    fundingGap,
    hasFundingDetails,
    sector: profile.sector,
    subSector: profile.subSector,
    businessType: profile.businessType,
    businessEntityType: entityType,
    registrationStatus: regStatus,
    operationalStatus: opStatus,
    location: {
      residenceState,
      businessState,
      district: profile.district,
      isInterstate,
    },
    readiness,
    completenessScore: completeness.percentage,
    completedFieldCount: completeness.score,
    totalFieldCount: completeness.maxScore,
    missingHighValueFields: completeness.missingHighValueFields.map((f) => ({
      fieldKey: f.fieldKey,
      labelEn: f.labelEn,
      labelHi: f.labelHi,
      priority: f.priority,
    })),
    provenance,
    businessIdeaText: profile.businessIdea?.trim() || undefined,
    businessName: profile.businessName?.trim() || undefined,
  };
}
