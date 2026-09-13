import {
  BusinessStageKey,
  BusinessReadiness,
  RegistrationStatus,
  OperationalStatus,
  BusinessJourneyStage,
} from '../../types/business';
import { UserProfile, BusinessStage } from '../../types/user';

/**
 * Maps legacy 5-stage values to canonical Phase 4.1 BusinessStageKey.
 */
export function mapLegacyStageToKey(legacy?: BusinessStage): BusinessStageKey {
  switch (legacy) {
    case 'idea':
      return 'IDEA';
    case 'new':
      return 'NEW_BUSINESS';
    case 'existing':
      return 'EARLY_OPERATION';
    case 'expanding':
      return 'EXPANSION';
    case 'scaling':
      return 'GROWTH';
    default:
      return 'IDEA';
  }
}

/**
 * Maps canonical BusinessStageKey to legacy 5-stage BusinessStage for backward compatibility.
 */
export function mapKeyToLegacyStage(key: BusinessStageKey): BusinessStage {
  switch (key) {
    case 'IDEA':
    case 'PRE_LAUNCH':
      return 'idea';
    case 'NEW_BUSINESS':
      return 'new';
    case 'EARLY_OPERATION':
    case 'DISTRESS_OR_RESTRUCTURING':
      return 'existing';
    case 'GROWTH':
      return 'scaling';
    case 'EXPANSION':
      return 'expanding';
    default:
      return 'new';
  }
}

/**
 * Derives the active business stage of the entrepreneur.
 *
 * Statutory Rule:
 * User-selected explicit stage is strictly prioritized over inferred signals.
 */
export function deriveBusinessStage(
  profile: Partial<UserProfile>
): { stage: BusinessStageKey; source: 'EXPLICIT' | 'INFERRED' | 'UNKNOWN' } {
  // 1. Highest precedence: Explicit Phase 4.1 businessStageKey
  if (profile.businessStageKey) {
    return { stage: profile.businessStageKey, source: 'EXPLICIT' };
  }

  // 2. Second precedence: Explicit legacy businessStage
  if (profile.businessStage) {
    return {
      stage: mapLegacyStageToKey(profile.businessStage),
      source: 'EXPLICIT',
    };
  }

  // 3. Third precedence: Inferred from operational status & financial indicators
  if (profile.operationalStatus === 'EXPANDING') {
    return { stage: 'EXPANSION', source: 'INFERRED' };
  }

  if (profile.operationalStatus === 'OPERATING') {
    if (profile.existingTurnover && profile.existingTurnover > 1000000) {
      return { stage: 'GROWTH', source: 'INFERRED' };
    }
    return { stage: 'EARLY_OPERATION', source: 'INFERRED' };
  }

  if (profile.operationalStatus === 'NOT_STARTED') {
    return { stage: 'PRE_LAUNCH', source: 'INFERRED' };
  }

  if (profile.hasExistingBusiness === true || (profile.existingTurnover && profile.existingTurnover > 0)) {
    return { stage: 'EARLY_OPERATION', source: 'INFERRED' };
  }

  if (profile.hasExistingBusiness === false) {
    return { stage: 'NEW_BUSINESS', source: 'INFERRED' };
  }

  // 4. Default baseline when no signals exist
  return { stage: 'IDEA', source: 'UNKNOWN' };
}

/**
 * Derives current position on the 8-step entrepreneurial journey.
 */
export function deriveJourneyPosition(
  stageKey: BusinessStageKey,
  regStatus: RegistrationStatus,
  hasFundingGap: boolean
): BusinessJourneyStage {
  switch (stageKey) {
    case 'IDEA':
      return 'IDEA';
    case 'PRE_LAUNCH':
      if (regStatus === 'REGISTERED') {
        return hasFundingGap ? 'FUND' : 'LAUNCH';
      }
      return 'REGISTER';
    case 'NEW_BUSINESS':
      return 'LAUNCH';
    case 'EARLY_OPERATION':
    case 'DISTRESS_OR_RESTRUCTURING':
      return 'OPERATE';
    case 'GROWTH':
      return 'GROW';
    case 'EXPANSION':
      return 'EXPAND';
    default:
      return 'IDEA';
  }
}

/**
 * Derives the navigational business readiness level.
 *
 * CAUTION / INTENT CONSTRAINT:
 * This readiness assessment is an internal user-experience and document-preparation guide.
 * It is NOT an underwriting approval score, creditworthiness score, or guarantee of loan sanction.
 */
export function deriveBusinessReadiness(
  profile: Partial<UserProfile>,
  fundingGap: number
): BusinessReadiness {
  const isOperating =
    profile.operationalStatus === 'OPERATING' ||
    profile.operationalStatus === 'EXPANDING' ||
    profile.businessStage === 'existing' ||
    profile.businessStage === 'expanding' ||
    profile.businessStageKey === 'EARLY_OPERATION' ||
    profile.businessStageKey === 'GROWTH' ||
    profile.businessStageKey === 'EXPANSION';

  const isFormallyRegistered =
    profile.registrationStatus === 'REGISTERED' ||
    profile.isRegistered === true ||
    profile.businessRegistration === 'udyam' ||
    profile.businessRegistration === 'gst';

  if (isOperating) {
    if (
      profile.businessStageKey === 'EXPANSION' ||
      profile.businessStageKey === 'GROWTH' ||
      (profile.existingTurnover && profile.existingTurnover >= 2500000)
    ) {
      return 'GROWTH_READY';
    }
    return 'OPERATING';
  }

  // Pre-launch / New setups
  if (isFormallyRegistered && fundingGap > 0) {
    return 'READY_TO_LAUNCH';
  }

  if (profile.totalProjectCost && profile.totalProjectCost > 0) {
    return 'DEVELOPING';
  }

  return 'EARLY';
}
