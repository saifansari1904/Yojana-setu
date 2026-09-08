import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, Translations, LocalizedSchemeData } from './types';
import { enTranslations } from './en';
import { hiTranslations } from './hi';
import { hiSchemesData } from './schemesData';
import { BusinessType, MatchResult, Scheme, SchemeRuleBreakdown, SocialCategory, UserProfile } from '../types';

const STORAGE_KEY = 'yojana_setu_language';

interface LocalizedScheme extends Scheme {
  originalName: string;
  isHindi: boolean;
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (keyPath: string, vars?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  getLocalizedScheme: (scheme: Scheme) => LocalizedScheme;
  getLocalizedCategory: (category: SocialCategory) => string;
  getLocalizedCategoryDesc: (category: SocialCategory) => string;
  getLocalizedBusinessType: (biz: BusinessType) => string;
  getLocalizedBusinessTypeDesc: (biz: BusinessType) => string;
  getLocalizedState: (state: string) => string;
  getLocalizedFactorName: (factorKey: string) => string;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'hi';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'hi') {
        return saved;
      }
    } catch {
      // Ignore local storage error
    }
    return 'hi'; // Default language MUST be Hindi
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
    setLang(lang === 'hi' ? 'en' : 'hi');
  };

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // Ignore
    }
  }, [lang]);

  const translations = lang === 'hi' ? hiTranslations : enTranslations;

  const t = (keyPath: string, vars?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key is missing in Hindi
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

  const getLocalizedScheme = (scheme: Scheme): LocalizedScheme => {
    if (lang === 'hi' && hiSchemesData[scheme.id]) {
      const hiData = hiSchemesData[scheme.id];
      return {
        ...scheme,
        originalName: scheme.name,
        isHindi: true,
        name: hiData.name,
        sponsoringMinistry: hiData.sponsoringMinistry,
        department: hiData.department || scheme.department,
        schemeType: hiData.schemeType as any,
        benefitSummary: hiData.benefitSummary,
        fundingRangeText: hiData.fundingRangeText,
        requiredDocuments: hiData.requiredDocuments,
        lastVerifiedDate: hiData.lastVerifiedDate,
      };
    }
    return {
      ...scheme,
      originalName: scheme.name,
      isHindi: false,
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
