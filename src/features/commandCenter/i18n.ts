/**
 * COMMAND CENTER — I18N BRIDGE
 *
 * The Command Center feature keeps its own EN/HI string table, but it never
 * owns language state: the active language always comes from the app's
 * existing LanguageContext, so switching languages anywhere switches here too.
 */

import { useTranslation as useAppTranslation } from '../../i18n';
import { Language } from '../../i18n/types';
import { en } from './en';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';
import { kn } from './kn';
import { ml } from './ml';
import { mr } from './mr';

type CommandCenterKey = keyof typeof en;

const commandCenterTranslations: Record<Language, typeof en> = {
  en,
  hi,
  ta,
  te,
  kn,
  ml,
  mr,
};

export function useTranslation(): {
  language: Language;
  t: (key: CommandCenterKey) => string;
} {
  const { lang } = useAppTranslation();
  const currentTable = commandCenterTranslations[lang] || en;

  const t = (key: CommandCenterKey): string => {
    return currentTable[key] || en[key] || key;
  };

  return { language: lang, t };
}
