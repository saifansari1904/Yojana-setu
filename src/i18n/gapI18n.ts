import type { Language } from './types';
import type { PrimaryGap } from '../types';
import { formatCurrency } from '../lib/eligibility/eligibilityEngine';

const GAP_COPY: Record<Language, {
  income: (value: string) => string;
  ageBelow: (value: number) => string;
  ageAbove: (value: number) => string;
  state: (value: string) => string;
  business: string;
  category: string;
}> = {
  en: { income: (value) => `${value} above ceiling`, ageBelow: (value) => `${value} yr${value > 1 ? 's' : ''} below minimum`, ageAbove: (value) => `${value} yr${value > 1 ? 's' : ''} above maximum`, state: (value) => `Restricted to ${value}`, business: 'Different trade domain', category: 'Reserved target group' },
  hi: { income: (value) => `सीमा से ${value} अधिक`, ageBelow: (value) => `न्यूनतम आयु से ${value} वर्ष कम`, ageAbove: (value) => `अधिकतम आयु से ${value} वर्ष अधिक`, state: (value) => `केवल ${value} में मान्य`, business: 'कार्यक्षेत्र भिन्नता', category: 'विशिष्ट आरक्षित वर्ग' },
  ta: { income: (value) => `வரம்பை விட ${value} அதிகம்`, ageBelow: (value) => `குறைந்தபட்ச வயதை விட ${value} ஆண்டுகள் குறைவு`, ageAbove: (value) => `அதிகபட்ச வயதை விட ${value} ஆண்டுகள் அதிகம்`, state: (value) => `${value} மாநிலத்திற்கு மட்டும்`, business: 'வெவ்வேறு வணிகத் துறை', category: 'குறிப்பிட்ட ஒதுக்கப்பட்ட பிரிவு' },
  te: { income: (value) => `పరిమితి కంటే ${value} ఎక్కువ`, ageBelow: (value) => `కనీస వయస్సు కంటే ${value} సం. తక్కువ`, ageAbove: (value) => `గరిష్ట వయస్సు కంటే ${value} సం. ఎక్కువ`, state: (value) => `${value} కు మాత్రమే పరిమితం`, business: 'విభిన్న వ్యాపార రంగం', category: 'ప్రత్యేక రిజర్వుడ్ గ్రూప్' },
  kn: { income: (value) => `ಮಿತಿಗಿಂತ ${value} ಹೆಚ್ಚು`, ageBelow: (value) => `ಕನಿಷ್ಠ ವಯಸ್ಸಿಗಿಂತ ${value} ವರ್ಷ ಕಡಿಮೆ`, ageAbove: (value) => `ಗರಿಷ್ಠ ವಯಸ್ಸಿಗಿಂತ ${value} ವರ್ಷ ಹೆಚ್ಚು`, state: (value) => `${value} ಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ`, business: 'ವಿಭಿನ್ನ ವ್ಯಾಪಾರ ಕ್ಷೇತ್ರ', category: 'ಮೀಸಲಾದ ಉದ್ದೇಶಿತ ವರ್ಗ' },
  ml: { income: (value) => `പരിധിയേക്കാൾ ${value} കൂടുതൽ`, ageBelow: (value) => `ഏറ്റവും കുറഞ്ഞ പ്രായത്തേക്കാൾ ${value} വർഷം കുറവ്`, ageAbove: (value) => `പരമാവധി പ്രായത്തേക്കാൾ ${value} വർഷം കൂടുതൽ`, state: (value) => `${value} ന് മാത്രം ബാധകം`, business: 'വ്യത്യസ്ത ബിസിനസ്സ് മേഖല', category: 'പ്രത്യേക സംവരണ വിഭാഗം' },
  mr: { income: (value) => `मर्यादेपेक्षा ${value} जास्त`, ageBelow: (value) => `किमान वयापेक्षा ${value} वर्षे कमी`, ageAbove: (value) => `कमाल वयापेक्षा ${value} वर्षे जास्त`, state: (value) => `फक्त ${value} मध्ये लागू`, business: 'भिन्न व्यापार क्षेत्र', category: 'विशिष्ट आरक्षित गट' },
};

export function formatPrimaryGapDistance(gap: PrimaryGap, lang: Language): string | undefined {
  const copy = GAP_COPY[lang] || GAP_COPY.en;
  switch (gap.code) {
    case 'INCOME_ABOVE_LIMIT':
      return typeof gap.gapValue === 'number' ? copy.income(formatCurrency(gap.gapValue)) : undefined;
    case 'AGE_BELOW_MINIMUM':
      return typeof gap.gapValue === 'number' ? copy.ageBelow(gap.gapValue) : undefined;
    case 'AGE_ABOVE_MAXIMUM':
      return typeof gap.gapValue === 'number' ? copy.ageAbove(gap.gapValue) : undefined;
    case 'STATE_NOT_SUPPORTED':
      return typeof gap.gapValue === 'string' ? copy.state(gap.gapValue) : undefined;
    case 'BUSINESS_TYPE_MISMATCH':
      return copy.business;
    case 'CATEGORY_MISMATCH':
      return copy.category;
    default:
      return undefined;
  }
}
