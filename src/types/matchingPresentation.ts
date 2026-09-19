import type { BusinessType, SocialCategory } from './user';
import type { SchemeFactorKey } from './scheme';

export interface MatchingCopy {
  category: {
    unknown: string;
    scSt: (category: string) => string;
    woman: string;
    minority: string;
    matched: (category: string) => string;
    mismatched: (required: string, actual: string) => string;
  };
  business: {
    unknown: string;
    matched: (businessType: string) => string;
    mismatched: (required: string, actual: string) => string;
  };
  income: {
    notCapped: string;
    unknown: string;
    matched: (current: string, maximum: string) => string;
    mismatched: (current: string, maximum: string, difference: string) => string;
    reqMax: (maximum: string) => string;
    reqNone: string;
  };
  age: {
    unknown: string;
    matched: (age: number, minimum: number, maximum: number) => string;
    mismatched: (age: number, minimum: number, maximum: number) => string;
    valYears: (age: number) => string;
    reqYears: (minimum: number, maximum: number) => string;
  };
  state: {
    unknown: string;
    allIndia: (state: string) => string;
    regional: (state: string) => string;
    mismatched: (states: string) => string;
    allStatesLabel: string;
  };
  summary: {
    eligible: (category: string, businessType: string) => string;
    nearMatchGap: (matchedCount: number, factorLabel: string, gap: string) => string;
    nearMatchNoGap: string;
    lowMatch: (unmetLabels: string) => string;
  };
  alternatives: {
    noIncomeCap: string;
    panIndia: (state: string) => string;
    subsidyRate: (rate: number) => string;
    ventureCompat: (businessType: string) => string;
    nearMatch: (percentage: number) => string;
  };
}

export interface MatchingPresentation {
  notSpecifiedText: string;
  categoryLabel: (category: SocialCategory) => string;
  businessTypeLabel: (businessType: BusinessType) => string;
  factorLabel: (factorKey: SchemeFactorKey) => string;
  stateLabel: (state: string) => string;
  copy: MatchingCopy;
}
