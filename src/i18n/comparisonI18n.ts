import type { Language } from './types';

interface ComparisonPhrases {
  allIndia: string;
  allCategories: string;
  capitalSubsidy: string;
  noSubsidy: string;
  pa: string;
  bankTerms: string;
  years: string;
  standardTenure: string;
  highestScore: string;
  highestSubsidy: string;
  allIndiaCoverage: string;
  collateralFree: string;
  summaryNote: (count: number) => string;
}

const COMPARISON_PHRASES: Record<Language, ComparisonPhrases> = {
  en: {
    allIndia: 'All-India (National)',
    allCategories: 'All Social Categories',
    capitalSubsidy: 'Capital Subsidy',
    noSubsidy: 'No direct subsidy',
    pa: 'p.a.',
    bankTerms: 'Bank standard terms',
    years: 'Years',
    standardTenure: 'Standard bank tenure',
    highestScore: 'Highest Match Score',
    highestSubsidy: 'Highest Capital Subsidy',
    allIndiaCoverage: 'All-India Coverage',
    collateralFree: 'Collateral-Free',
    summaryNote: (count) =>
      `Side-by-side comparison for ${count} schemes evaluated with identical statutory criteria.`,
  },
  hi: {
    allIndia: 'अखिल भारतीय (सभी राज्य)',
    allCategories: 'सभी सामाजिक वर्ग',
    capitalSubsidy: 'सरकारी अनुदान',
    noSubsidy: 'कोई पूंजीगत अनुदान नहीं',
    pa: 'वार्षिक',
    bankTerms: 'संबंधित बैंक नियमानुसार',
    years: 'वर्ष',
    standardTenure: 'बैंक नियमानुसार',
    highestScore: 'सर्वोच्च मिलान स्कोर',
    highestSubsidy: 'अधिकतम पूंजीगत सब्सिडी',
    allIndiaCoverage: 'राष्ट्रीय स्वीकार्यता',
    collateralFree: 'बिना संपार्श्विक (कोलेटरल मुक्त)',
    summaryNote: (count) =>
      `${count} चयनित योजनाओं की तुलना पूरी हो चुकी है। सभी स्कोर आधिकारिक इंजन द्वारा सत्यापित हैं।`,
  },
  ta: {
    allIndia: 'அகில இந்திய (தேசிய)',
    allCategories: 'அனைத்து சமூகப் பிரிவுகள்',
    capitalSubsidy: 'மூலதன மானியம்',
    noSubsidy: 'நேரடி மானியம் இல்லை',
    pa: 'ஆண்டுக்கு',
    bankTerms: 'வங்கி விதிமுறைகளின்படி',
    years: 'ஆண்டுகள்',
    standardTenure: 'நிலையான வங்கி தவணைக்காலம்',
    highestScore: 'அதிகபட்ச பொருத்தம்',
    highestSubsidy: 'அதிகபட்ச மூலதன மானியம்',
    allIndiaCoverage: 'தேசிய அளவிலான திட்டம்',
    collateralFree: 'பிணையில்லா கடன்',
    summaryNote: (count) =>
      `ஒரே மாதிரியான விதிகளின் கீழ் ${count} திட்டங்களின் ஒப்பீடு செய்யப்பட்டுள்ளது.`,
  },
  te: {
    allIndia: 'అఖిల భారత (జాతీయ)',
    allCategories: 'అన్ని సామాజిక వర్గాలు',
    capitalSubsidy: 'మూలధన సబ్సిడీ',
    noSubsidy: 'ప్రత్యక్ష సబ్సిడీ లేదు',
    pa: 'సంవత్సరానికి',
    bankTerms: 'బ్యాంకు నిబంధనల ప్రకారం',
    years: 'సంవత్సరాలు',
    standardTenure: 'ప్రామాణిక బ్యాంకు కాలపరిమితి',
    highestScore: 'గరిష్ట సరిపోలిక స్కోరు',
    highestSubsidy: 'అత్యధిక మూలధన సబ్సిడీ',
    allIndiaCoverage: 'జాతీయ వ్యాప్తి',
    collateralFree: 'హామీ లేని రుణం',
    summaryNote: (count) =>
      `ఒకే విధమైన నిబంధనలతో ${count} పథకాల పోలిక పూర్తయింది.`,
  },
  kn: {
    allIndia: 'ಅಖಿಲ ಭಾರತ (ರಾಷ್ಟ್ರೀಯ)',
    allCategories: 'ಎಲ್ಲಾ ಸಾಮಾಜಿಕ ವರ್ಗಗಳು',
    capitalSubsidy: 'ಬಂಡವಾಳ ಸಬ್ಸಿಡಿ',
    noSubsidy: 'ಯಾವುದೇ ನೇರ ಸಬ್ಸಿಡಿ ಇಲ್ಲ',
    pa: 'ವಾರ್ಷಿಕ',
    bankTerms: 'ಬ್ಯಾಂಕ್ ನಿಯಮಗಳ ಪ್ರಕಾರ',
    years: 'ವರ್ಷಗಳು',
    standardTenure: 'ಪ್ರಮಾಣಿತ ಬ್ಯಾಂಕ್ ಅವಧಿ',
    highestScore: 'ಗರಿಷ್ಠ ಹೊಂದಾಣಿಕೆ ಸ್ಕೋರ್',
    highestSubsidy: 'ಗರಿಷ್ಠ ಬಂಡವಾಳ ಸಬ್ಸಿಡಿ',
    allIndiaCoverage: 'ರಾಷ್ಟ್ರೀಯ ವ್ಯಾಪ್ತಿ',
    collateralFree: 'ಭದ್ರತೆ ರಹಿತ ಸಾಲ',
    summaryNote: (count) =>
      `ಒಂದೇ ಮಾನದಂಡಗಳ ಅಡಿಯಲ್ಲಿ ${count} ಯೋಜನೆಗಳ ಹೋಲಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.`,
  },
  ml: {
    allIndia: 'അഖിലേന്ത്യാ (ദേശീയ)',
    allCategories: 'എല്ലാ സാമൂഹിക വിഭാഗങ്ങളും',
    capitalSubsidy: 'മൂലധന സബ്‌സിഡി',
    noSubsidy: 'നേരിട്ടുള്ള സബ്‌സിഡിയില്ല',
    pa: 'പ്രതിവർഷം',
    bankTerms: 'ബാങ്ക് വ്യവസ്ഥകൾ പ്രകാരം',
    years: 'വർഷങ്ങൾ',
    standardTenure: 'സാധാരണ ബാങ്ക് കാലാവധി',
    highestScore: 'ഉയർന്ന പൊരുത്ത സ്കോർ',
    highestSubsidy: 'ഏറ്റവും ഉയർന്ന മൂലധന സബ്‌സിഡി',
    allIndiaCoverage: 'ദേശീയ പദ്ധതി',
    collateralFree: 'ഈടില്ലാത്ത വായ്പ',
    summaryNote: (count) =>
      `സമാന നിയമങ്ങൾക്കനുസൃതമായി ${count} പദ്ധതികളുടെ താരതമ്യം പൂർത്തിയായി.`,
  },
  mr: {
    allIndia: 'अखिल भारतीय (राष्ट्रीय)',
    allCategories: 'सर्व सामाजिक वर्ग',
    capitalSubsidy: 'भांडवली अनुदान',
    noSubsidy: 'थेट अनुदान नाही',
    pa: 'वार्षिक',
    bankTerms: 'बँक नियमानुसार',
    years: 'वर्षे',
    standardTenure: 'मानक बँक मुदत',
    highestScore: 'सर्वोच्च जुळणी गुण',
    highestSubsidy: 'सर्वोच्च भांडवली अनुदान',
    allIndiaCoverage: 'अखिल भारतीय व्याप्ती',
    collateralFree: 'तारणमुक्त',
    summaryNote: (count) =>
      `समान वैधानिक निकषांनुसार मूल्यांकन केलेल्या ${count} योजनांची समोरासमोर तुलना.`,
  },
};

export const getComparisonPhrases = (lang: Language = 'en'): ComparisonPhrases => {
  return COMPARISON_PHRASES[lang] || COMPARISON_PHRASES.en;
};
