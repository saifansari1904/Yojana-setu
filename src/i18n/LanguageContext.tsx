import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, Translations, LocalizedSchemeData, SUPPORTED_LANGUAGES } from './types';
import { enTranslations } from './en';
import { hiTranslations } from './hi';
import { taTranslations } from './ta';
import { teTranslations } from './te';
import { knTranslations } from './kn';
import { mlTranslations } from './ml';
import { hiSchemesData, allLocalizedSchemes } from './schemesData';
import { BusinessType, MatchResult, Scheme, SchemeRuleBreakdown, SocialCategory, UserProfile } from '../types';
import {
  SupportNeedType,
  BusinessStageKey,
  BusinessEntityType,
  RegistrationStatus,
} from '../types/business';
import {
  SUPPORT_NEEDS_LOCALIZED,
  LIFECYCLE_PHASES_LOCALIZED,
  BUSINESS_ENTITY_LOCALIZED,
  REGISTRATION_STATUS_LOCALIZED,
} from './formI18n';

const STORAGE_KEY = 'yojana_setu_language';

export const translationsMap: Record<Language, Translations> = {
  en: enTranslations,
  hi: hiTranslations,
  ta: taTranslations,
  te: teTranslations,
  kn: knTranslations,
  ml: mlTranslations,
};

export function getCategoryLabel(category: SocialCategory, lang: Language = 'hi'): string {
  const trans = translationsMap[lang] || translationsMap.en;
  return trans.categories[category]?.label || translationsMap.en.categories[category]?.label || category;
}

export function getBusinessTypeLabel(biz: BusinessType, lang: Language = 'hi'): string {
  const trans = translationsMap[lang] || translationsMap.en;
  return trans.businessTypes[biz]?.label || translationsMap.en.businessTypes[biz]?.label || biz;
}

export function getFactorLabel(factorKey: string, lang: Language = 'hi'): string {
  const trans = translationsMap[lang] || translationsMap.en;
  if (factorKey in trans.factors) {
    return trans.factors[factorKey as keyof typeof trans.factors];
  }
  return factorKey;
}

export function getStateLabel(state: string, lang: Language = 'hi'): string {
  const trans = translationsMap[lang] || translationsMap.en;
  return trans.states[state] || state;
}

export interface LocalizedScheme extends Scheme {
  originalName: string;
  isLocalized: boolean;
}

export interface SchemeLike {
  id: string;
  name: string;
  department?: string;
  [key: string]: any;
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (keyPath: string, vars?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  getLocalizedScheme: <T extends SchemeLike>(scheme: T) => T & {
    originalName: string;
      isLocalized: boolean;
    sponsoringMinistry?: string;
    schemeType?: any;
    benefitSummary?: string;
    fundingRangeText?: string;
    requiredDocuments?: string[];
    lastVerifiedDate?: string;
  };
  getLocalizedCategory: (category: SocialCategory) => string;
  getLocalizedCategoryDesc: (category: SocialCategory) => string;
  getLocalizedBusinessType: (biz: BusinessType) => string;
  getLocalizedBusinessTypeDesc: (biz: BusinessType) => string;
  getLocalizedState: (state: string) => string;
  getLocalizedFactorName: (factorKey: string) => string;
  getLocalizedSupportNeed: (need: SupportNeedType) => string;
  getLocalizedBusinessStage: (stage: BusinessStageKey) => string;
  getLocalizedEntity: (entity: BusinessEntityType) => string;
  getLocalizedRegistrationStatus: (reg: RegistrationStatus) => string;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'hi';
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved in translationsMap)) {
        return saved;
      }
    } catch {
      // Ignore local storage error
    }
    return 'hi'; // Default language is Hindi
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore local storage error
    }
  };

  const toggleLang = () => {
    const langOrder: Language[] = ['hi', 'en', 'ta', 'te', 'kn', 'ml'];
    const idx = langOrder.indexOf(lang);
    setLang(langOrder[(idx + 1) % langOrder.length]);
  };

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // Ignore
    }
  }, [lang]);

  const translations = translationsMap[lang] || hiTranslations;

  const t = (keyPath: string, vars?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key is missing in regional language
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = enTranslations;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return keyPath;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let result = current;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    return result;
  };

  const formatCurrency = (amount: number): string => {
    if (isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLocalizedScheme = <T extends SchemeLike>(scheme: T): T & {
    originalName: string;
      isLocalized: boolean;
    sponsoringMinistry?: string;
    schemeType?: any;
    benefitSummary?: string;
    fundingRangeText?: string;
    requiredDocuments?: string[];
    lastVerifiedDate?: string;
  } => {
    const schemeDict = allLocalizedSchemes[lang];
    if (schemeDict && schemeDict[scheme.id]) {
      const locData = schemeDict[scheme.id];
      return {
        ...scheme,
        originalName: scheme.name,
        isLocalized: true,
        name: locData.name,
        sponsoringMinistry: locData.sponsoringMinistry,
        department: locData.department || scheme.department,
        schemeType: locData.schemeType as any,
        benefitSummary: locData.benefitSummary,
        fundingRangeText: locData.fundingRangeText,
        requiredDocuments: locData.requiredDocuments,
        lastVerifiedDate: locData.lastVerifiedDate,
      };
    }
    return {
      ...scheme,
      originalName: scheme.name,
      isLocalized: false,
    };
  };

  const getLocalizedCategory = (category: SocialCategory): string => {
    return translations.categories[category]?.label || category;
  };

  const getLocalizedCategoryDesc = (category: SocialCategory): string => {
    return translations.categories[category]?.desc || '';
  };

  const getLocalizedBusinessType = (biz: BusinessType): string => {
    return translations.businessTypes[biz]?.label || biz;
  };

  const getLocalizedBusinessTypeDesc = (biz: BusinessType): string => {
    return translations.businessTypes[biz]?.desc || '';
  };

  const getLocalizedState = (state: string): string => {
    return translations.states[state] || state;
  };

  const getLocalizedFactorName = (factorKey: string): string => {
    if (factorKey in translations.factors) {
      return translations.factors[factorKey as keyof typeof translations.factors];
    }
    return factorKey;
  };

  const getLocalizedSupportNeed = (need: SupportNeedType): string => {
    return SUPPORT_NEEDS_LOCALIZED[need]?.[lang] || need;
  };

  const getLocalizedBusinessStage = (stage: BusinessStageKey): string => {
    return LIFECYCLE_PHASES_LOCALIZED[stage]?.[lang] || stage;
  };

  const getLocalizedEntity = (entity: BusinessEntityType): string => {
    return BUSINESS_ENTITY_LOCALIZED[entity]?.[lang] || entity;
  };

  const getLocalizedRegistrationStatus = (reg: RegistrationStatus): string => {
    return REGISTRATION_STATUS_LOCALIZED[reg]?.[lang] || reg;
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      formatCurrency,
      getLocalizedScheme,
      getLocalizedCategory,
      getLocalizedCategoryDesc,
      getLocalizedBusinessType,
      getLocalizedBusinessTypeDesc,
      getLocalizedState,
      getLocalizedFactorName,
      getLocalizedSupportNeed,
      getLocalizedBusinessStage,
      getLocalizedEntity,
      getLocalizedRegistrationStatus,
      translations,
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
