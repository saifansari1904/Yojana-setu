import type { Language } from './types';

/** Resolve localized text without coupling callers to one specific locale. */
type LocalizedText = Partial<Record<Language, string>>;

export function resolveLocalized(values: LocalizedText, lang: Language, fallback: Language = 'en'): string {
  return values[lang] ?? values[fallback] ?? Object.values(values).find(Boolean) ?? '';
}

/** Compatibility adapter for legacy EN/HI records while they are migrated. */
export function resolveLocalizedPair(english: string | undefined, hindi: string | undefined, lang: Language): string {
  return resolveLocalized({ en: english, hi: hindi }, lang);
}
