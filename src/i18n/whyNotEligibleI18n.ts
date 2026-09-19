import type { Language } from './types';

export const WHY_NOT_ELIGIBLE_I18N = {
  statutoryBlocker: {
    en: 'Statutory Blocker',
    hi: 'वैधानिक प्रतिबंध',
    ta: 'சட்டப்பூர்வ தடை',
    te: 'చట్టబద్ధమైన అడ్డంకి',
    kn: 'ಶಾಸನಬದ್ಧ ಅಡಚಣೆ',
    ml: 'നിയമപരമായ തടസ്സം',
  },
  profileInfoNeeded: {
    en: 'Profile Info Needed',
    hi: 'प्रोफ़ाइल विवरण आवश्यक',
    ta: 'சுயவிவர தகவல் தேவை',
    te: 'ప్రొఫైల్ సమాచారం అవసరం',
    kn: 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ',
    ml: 'പ്രൊഫൈൽ വിവരങ്ങൾ ആവശ്യമാണ്',
  },
  actionableNextStep: {
    en: 'Actionable Next Step',
    hi: 'कार्यवाही योग्य अगला कदम',
    ta: 'செயல்படக்கூடிய அடுத்த படி',
    te: 'చేయదగిన తదుపరి చర్య',
    kn: 'ಮುಂದಿನ ಕ್ರಮ',
    ml: 'അടുത്ത ഘട്ടം',
  },
};

export const getProfileCompatibilityReason = (
  percentage: number,
  lang: Language = 'en',
): string => {
  const map: Record<Language, string> = {
    en: `${percentage}% overall profile compatibility`,
    hi: `आपकी प्रोफाइल के लिए ${percentage}% अनुकूलता`,
    ta: `உங்கள் சுயவிவரத்திற்கு ${percentage}% ஒட்டுமொத்த பொருத்தம்`,
    te: `మీ ప్రొఫైల్‌కు ${percentage}% మొత్తం సరిపోలిక`,
    kn: `ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ಗೆ ${percentage}% ಒಟ್ಟಾರೆ ಹೊಂದಾಣಿಕೆ`,
    ml: `നിങ്ങളുടെ പ്രൊഫൈലിനായി ${percentage}% ആകെ അനുയോജ്യത`,
  };
  return map[lang] || map.en;
};

export const getWhyNotEligibleText = (
  key: keyof typeof WHY_NOT_ELIGIBLE_I18N,
  lang: Language = 'en',
): string => {
  const entry = WHY_NOT_ELIGIBLE_I18N[key];
  if (entry) {
    return entry[lang] || entry.en;
  }
  return key;
};
