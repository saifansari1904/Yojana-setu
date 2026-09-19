/**
 * Deterministic funding gap calculator for Yojana Setu Phase 4.1.
 *
 * Core statutory rule:
 * fundingGap = Math.max((totalProjectCost - existingInvestment), 0)
 *
 * Constraints:
 * - Must never return a negative number
 * - Must never return NaN or undefined
 * - Handles zero existing investment properly (projectCost = 5L, existing = 0 -> gap = 5L)
 * - Handles existing exceeding cost properly (projectCost = 5L, existing = 7L -> gap = 0)
 * - If projectCost not explicitly specified, gracefully falls back to explicit fundingRequired or 0
 */

export interface FundingAnalysis {
  totalProjectCost: number;
  existingInvestment: number;
  fundingGap: number;
  hasDetailedBreakdown: boolean;
  ownContributionPercent: number; // percentage of project cost already invested
  fundingGapPercent: number; // percentage of project cost needing funding
}

/**
 * Sanitizes and normalizes any numerical financial input to a non-negative number.
 */
export function sanitizeAmount(value: unknown): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
}

/**
 * Deterministically computes the funding gap for an entrepreneur.
 *
 * @param totalProjectCost Total estimated capital requirement for the business/expansion
 * @param existingInvestment Own funds, family savings, or equipment already deployed
 * @param fallbackFundingRequired Optional statutory funding requirement already declared in UserProfile
 * @returns Non-negative funding gap amount (in ₹ INR)
 */
export function calculateFundingGap(
  totalProjectCost?: number | null,
  existingInvestment?: number | null,
  fallbackFundingRequired?: number | null
): number {
  const cleanCost = sanitizeAmount(totalProjectCost);
  const cleanInvested = sanitizeAmount(existingInvestment);
  const cleanFallback = sanitizeAmount(fallbackFundingRequired);

  // If detailed project cost was provided by the user:
  if (cleanCost > 0) {
    return Math.max(0, cleanCost - cleanInvested);
  }

  // If only fallback funding requirement was provided:
  if (cleanFallback > 0) {
    return Math.max(0, cleanFallback - cleanInvested);
  }

  return 0;
}

/**
 * Computes full financial breakdown including contribution ratios.
 */
export function analyzeFunding(
  totalProjectCost?: number | null,
  existingInvestment?: number | null,
  fallbackFundingRequired?: number | null
): FundingAnalysis {
  const cleanCost = sanitizeAmount(totalProjectCost);
  const cleanInvested = sanitizeAmount(existingInvestment);
  const cleanFallback = sanitizeAmount(fallbackFundingRequired);

  const effectiveCost = cleanCost > 0 ? cleanCost : cleanFallback;
  const fundingGap = calculateFundingGap(totalProjectCost, existingInvestment, fallbackFundingRequired);
  const hasDetailedBreakdown = cleanCost > 0;

  let ownContributionPercent = 0;
  let fundingGapPercent = 0;

  if (effectiveCost > 0) {
    ownContributionPercent = Math.min(100, Math.round((cleanInvested / effectiveCost) * 100));
    fundingGapPercent = Math.max(0, Math.min(100, 100 - ownContributionPercent));
  }

  return {
    totalProjectCost: effectiveCost,
    existingInvestment: cleanInvested,
    fundingGap,
    hasDetailedBreakdown,
    ownContributionPercent,
    fundingGapPercent,
  };
}

/**
 * Formats an Indian currency number cleanly with Lakh / Crore notation.
 */
export function formatLakhCrore(amount: number, lang: string = 'en'): string {
  const clean = sanitizeAmount(amount);
  if (clean === 0) {
    return '₹0';
  }

  const CR_LABELS: Record<string, string> = {
    hi: 'करोड़',
    ta: 'கோடி',
    te: 'కోట్లు',
    kn: 'ಕೋಟಿ',
    ml: 'കോടി',
    en: 'Cr',
  };
  const LAKH_LABELS: Record<string, string> = {
    hi: 'लाख',
    ta: 'லட்சம்',
    te: 'లక్షలు',
    kn: 'ಲಕ್ಷ',
    ml: 'ലക്ഷം',
    en: 'Lakh',
  };

  const crLabel = CR_LABELS[lang] || CR_LABELS.en;
  const lakhLabel = LAKH_LABELS[lang] || LAKH_LABELS.en;

  if (clean >= 10000000) {
    const cr = (clean / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} ${crLabel}`;
  }

  if (clean >= 100000) {
    const lakh = (clean / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lakh} ${lakhLabel}`;
  }

  return `₹${clean.toLocaleString('en-IN')}`;
}
