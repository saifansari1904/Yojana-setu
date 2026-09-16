/**
 * COMMAND CENTER — I18N BRIDGE
 *
 * The Command Center feature keeps its own EN/HI string table, but it never
 * owns language state: the active language always comes from the app's
 * existing LanguageContext, so switching languages anywhere switches here too.
 */

import { useTranslation as useAppTranslation } from '../../i18n';
import { en } from './en';
import { hi } from './hi';

export type CommandCenterKey = keyof typeof en;

export function useTranslation(): {
  language: 'en' | 'hi';
  t: (key: CommandCenterKey) => string;
} {
  const { lang } = useAppTranslation();
  const language: 'en' | 'hi' = lang === 'hi' ? 'hi' : 'en';

  const t = (key: CommandCenterKey): string => {
    if (language === 'hi') {
      return (hi as Record<string, string>)[key] || (en as Record<string, string>)[key] || key;
    }
    return (en as Record<string, string>)[key] || key;
  };

  return { language, t };
}
