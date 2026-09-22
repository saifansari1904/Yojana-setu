import type { Language } from './types';

export const MANDATORY_REQUIREMENT_LABELS: Record<Language, string> = {
  en: 'Mandatory requirement',
  hi: 'अनिवार्य शर्त',
  ta: 'கட்டாயத் தேவை',
  te: 'తప్పనిసరి అవసరం',
  kn: 'ಕಡ್ಡಾಯ ಅವಶ್ಯಕತೆ',
  ml: 'നിർബന്ധിത ആവശ്യകത',
  mr: 'अनिवार्य अट',
};

export const RECOMMENDATION_TEMPLATES = {
  POTENTIALLY_ELIGIBLE: {
    en: (category: string, businessType: string) =>
      `Your profile fully satisfies social category (${category}), business domain (${businessType}), and state requirements.`,
    hi: (category: string, businessType: string) =>
      `आपकी प्रोफ़ाइल सामाजिक वर्ग (${category}), व्यवसाय क्षेत्र (${businessType}) एवं राज्य आवश्यकताओं को पूरी तरह संतुष्ट करती है।`,
    ta: (category: string, businessType: string) =>
      `உங்கள் சுயவிவரம் சமூகப் பிரிவு (${category}), வணிகத் துறை (${businessType}) மற்றும் மாநிலத் தேவைகளைப் பூர்த்தி செய்கிறது.`,
    te: (category: string, businessType: string) =>
      `మీ ప్రొఫైల్ సామాజిక వర్గం (${category}), వ్యాపార రంగం (${businessType}) మరియు రాష్ట్ర అవసరాలను పూర్తిగా సంతృప్తిపరుస్తుంది.`,
    kn: (category: string, businessType: string) =>
      `ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಸಾಮಾಜಿಕ ವರ್ಗ (${category}), ವ್ಯವಹಾರ ಕ್ಷೇತ್ರ (${businessType}) ಮತ್ತು ರಾಜ್ಯದ ಅವಶ್ಯಕತೆಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಪೂರೈಸುತ್ತದೆ.`,
    ml: (category: string, businessType: string) =>
      `നിങ്ങളുടെ പ്രൊഫൈൽ സാമൂഹിക വിഭാഗം (${category}), ബിസിനസ്സ് മേഖല (${businessType}), സംസ്ഥാന ആവശ്യകതകൾ എന്നിവ പൂർണ്ണമായും തൃപ്തിപ്പെടുത്തുന്നു.`,
    mr: (category: string, businessType: string) =>
      `आपले प्रोफाइल सामाजिक वर्ग (${category}), व्यवसाय क्षेत्र (${businessType}) आणि राज्य आवश्यकतांना पूर्णपणे पूर्ण करते.`,
  },
  BLOCKED: {
    en: (label: string, userVal: string, statReq: string) =>
      `Statutory restriction: ${label} (${userVal} vs ${statReq}).`,
    hi: (label: string, userVal: string, statReq: string) =>
      `वैधानिक प्रतिबंध: ${label} (${userVal} बनाम ${statReq})।`,
    ta: (label: string, userVal: string, statReq: string) =>
      `சட்டரீதியான கட்டுப்பாடு: ${label} (${userVal} எதிர் ${statReq}).`,
    te: (label: string, userVal: string, statReq: string) =>
      `చట్టబద్ధమైన పరిమితి: ${label} (${userVal} వర్సెస్ ${statReq}).`,
    kn: (label: string, userVal: string, statReq: string) =>
      `ಶಾಸನಬದ್ಧ ನಿರ್ಬಂಧ: ${label} (${userVal} ವಿರುದ್ಧ ${statReq}).`,
    ml: (label: string, userVal: string, statReq: string) =>
      `നിയമാനുസൃത നിയന്ത്രണം: ${label} (${userVal} vs ${statReq}).`,
    mr: (label: string, userVal: string, statReq: string) =>
      `वैधानिक प्रतिबंध: ${label} (${userVal} विरुद्ध ${statReq}).`,
  },
  NEAR_MATCH: {
    en: (score: number) =>
      `Near match (${score}% score): Please confirm additional profile details or check alternatives.`,
    hi: (score: number) =>
      `समीप मिलान (${score}% स्कोर): कृपया अतिरिक्त आवश्यक विवरण सत्यापित करें।`,
    ta: (score: number) =>
      `நெருங்கிய பொருத்தம் (${score}% மதிப்பெண்): கூடுதல் சுயவிவர விவரங்களை உறுதிப்படுத்தவும் அல்லது மாற்று வழிகளைப் பார்க்கவும்.`,
    te: (score: number) =>
      `సమీప సరిపోలిక (${score}% స్కోరు): దయచేసి అదనపు ప్రొఫైల్ వివరాలను నిర్ధారించండి లేదా ప్రత్యామ్నాయాలను తనిఖీ చేయండి.`,
    kn: (score: number) =>
      `ಹತ್ತಿರದ ಹೊಂದಾಣಿಕೆ (${score}% ಸ್ಕೋರ್): ದಯವಿಟ್ಟು ಹೆಚ್ಚುವರಿ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಖಚಿತಪಡಿಸಿ ಅಥವಾ ಪರ್ಯಾಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.`,
    ml: (score: number) =>
      `ഏറെക്കുറെ പൊരുത്തപ്പെടുന്നു (${score}% സ്കോർ): കൂടുതൽ പ്രൊഫൈൽ വിശദാംശങ്ങൾ സ്ഥിരീകരിക്കുക അല്ലെങ്കിൽ ഇതരമാർഗ്ഗങ്ങൾ പരിശോധിക്കുക.`,
    mr: (score: number) =>
      `जवळची जुळणी (${score}% गुण): कृपया अतिरिक्त प्रोफाइल तपशील पुष्टी करा किंवा पर्याय तपासा.`,
  },
};

