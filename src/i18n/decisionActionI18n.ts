import type { Language } from './types';
import type { MatchResult, UserProfile } from '../types';
import { deriveNextBestAction, type NextActionType, type SemanticNextBestAction } from '../lib/matching/decisionEngine';

export interface LocalizedNextBestAction extends SemanticNextBestAction {
  title: string;
  description: string;
  badgeText: string;
  buttonLabel: string;
}

export type NextBestAction = LocalizedNextBestAction;

interface ActionText {
  title: string;
  description: string;
  badgeText: string;
  buttonLabel: string;
}

const ACTION_TEXTS: Record<NextActionType, Record<Language, ActionText>> = {
  EXPLORE_ALTERNATIVES: {
    en: {
      title: 'Explore Qualified Alternatives',
      description: 'Statutory criteria not met for this scheme. Explore tailored schemes suited for your business.',
      badgeText: 'Alternatives Ready',
      buttonLabel: 'View Alternatives',
    },
    hi: {
      title: 'वैकल्पिक योजनाएं खोजें',
      description: 'इस योजना में वैधानिक प्रतिबंध हैं। अपनी प्रोफ़ाइल के अनुकूल अन्य योजनाएं देखें।',
      badgeText: 'विकल्प उपलब्ध',
      buttonLabel: 'विकल्प देखें',
    },
    ta: {
      title: 'தகுதியான மாற்றுத் திட்டங்களை ஆராயுங்கள்',
      description: 'இத்திட்டத்திற்கான சட்டப்பூர்வ நிபந்தனைகள் பூர்த்தியாகவில்லை. உங்கள் வணிகத்திற்கான பிற திட்டங்களைப் பாருங்கள்.',
      badgeText: 'மாற்று வழிகள் தயார்',
      buttonLabel: 'மாற்றுத் திட்டங்களைப் பார்க்க',
    },
    te: {
      title: 'అర్హత కలిగిన ప్రత్యామ్నాయాలను అన్వేషించండి',
      description: 'ఈ పథకానికి చట్టబద్ధ ప్రమాణాలు సరిపోలలేదు. మీ వ్యాపారానికి సరిపోయే ఇతర పథకాలను చూడండి.',
      badgeText: 'ప్రత్యామ్నాయాలు సిద్ధం',
      buttonLabel: 'ప్రత్యామ్నాయాలను చూడండి',
    },
    kn: {
      title: 'ಅರ್ಹ ಪರ್ಯಾಯ ಯೋಜನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
      description: 'ಈ ಯೋಜನೆಗೆ ಶಾಸನಬದ್ಧ ಷರತ್ತುಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಸೂಕ್ತವಾದ ಇತರ ಯೋಜನೆಗಳನ್ನು ನೋಡಿ.',
      badgeText: 'ಪರ್ಯಾಯಗಳು ಲಭ್ಯ',
      buttonLabel: 'ಪರ್ಯಾಯಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    },
    ml: {
      title: 'യോഗ്യമായ ബദൽ പദ്ധതികൾ കണ്ടെത്തുക',
      description: 'ഈ പദ്ധതിയുടെ നിയമപരമായ മാനദണ്ഡങ്ങൾ പൊരുത്തപ്പെടുന്നില്ല. നിങ്ങളുടെ ബിസിനസ്സിന് അനുയോജ്യമായ മറ്റ് പദ്ധതികൾ കാണുക.',
      badgeText: 'ബദലുകൾ തയ്യാറാണ്',
      buttonLabel: 'ബദൽ പദ്ധതികൾ കാണുക',
    },
    mr: {
      title: 'पात्र पर्यायी योजना शोधा',
      description: 'या योजनेसाठी वैधानिक निकष पूर्ण होत नाहीत. आपल्या व्यवसायासाठी अनुकूल योजना पहा.',
      badgeText: 'पर्याय तयार',
      buttonLabel: 'पर्याय पहा',
    },
  },
  COMPLETE_PROFILE: {
    en: {
      title: 'Complete Profile Verification',
      description: 'Provide unspecified details (e.g. registration, turnover) to confirm statutory qualification.',
      badgeText: 'Info Needed',
      buttonLabel: 'Update Profile',
    },
    hi: {
      title: 'प्रोफ़ाइल विवरण पूर्ण करें',
      description: 'अनिर्दिष्ट जानकारी प्रदान करके निश्चित पात्रता स्थिति जानें।',
      badgeText: 'जानकारी आवश्यक',
      buttonLabel: 'विवरण भरें',
    },
    ta: {
      title: 'சுயவிவர சரிபார்ப்பை முடிக்கவும்',
      description: 'சட்டப்பூர்வ தகுதியை உறுதிப்படுத்த குறிப்பிடப்படாத விவரங்களை (பதிவு, வருமானம் போன்றவை) வழங்கவும்.',
      badgeText: 'விவரம் தேவை',
      buttonLabel: 'சுயவிவரத்தைப் புதுப்பிக்கவும்',
    },
    te: {
      title: 'ప్రొఫైల్ వివరాలను పూర్తి చేయండి',
      description: 'స్పష్టమైన అర్హతను నిర్ధారించడానికి నమోదుకాని వివరాలను (నమోదు, టర్నోవర్ వంటివి) సమర్పించండి.',
      badgeText: 'సమాచారం అవసరం',
      buttonLabel: 'ప్రొఫైల్ నవీకరించండి',
    },
    kn: {
      title: 'ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳಿಸಿ',
      description: 'ಖಚಿತ ಅರ್ಹತೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನಿರ್ದಿಷ್ಟಪಡಿಸದ ವಿವರಗಳನ್ನು (ನೋಂದಣಿ, ವಹಿವಾಟು ಇತ್ಯಾದಿ) ಒದಗಿಸಿ.',
      badgeText: 'ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ',
      buttonLabel: 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ',
    },
    ml: {
      title: 'പ്രൊഫൈൽ വിവരങ്ങൾ പൂർത്തിയാക്കുക',
      description: 'നിയമാനുസൃത യോഗ്യത ഉറപ്പാക്കാൻ വ്യക്തമാക്കാത്ത വിവരങ്ങൾ (രജിസ്ട്രേഷൻ, വിറ്റുവരവ് മുതലായവ) നൽകുക.',
      badgeText: 'വിവരം ആവശ്യമാണ്',
      buttonLabel: 'പ്രൊഫൈൽ പുതുക്കുക',
    },
    mr: {
      title: 'प्रोफाइल पडताळणी पूर्ण करा',
      description: 'वैधानिक पात्रता निश्चित करण्यासाठी निर्दिष्ट न केलेले तपशील (उदा. नोंदणी, उलाढाल) द्या.',
      badgeText: 'माहिती हवी आहे',
      buttonLabel: 'प्रोफाइल अद्ययावत करा',
    },
  },
  CONFIRM_REGISTRATION: {
    en: {
      title: 'Confirm Business Registration',
      description: 'This scheme requires formal registration. Confirm your Udyam/trade status.',
      badgeText: 'Registration Check',
      buttonLabel: 'Update Registration',
    },
    hi: {
      title: 'व्यवसाय पंजीकरण स्थिति की पुष्टि करें',
      description: 'यह योजना औपचारिक पंजीकरण (MSME/Udyam) मांगती है। अपनी पंजीकरण स्थिति स्पष्ट करें।',
      badgeText: 'पंजीकरण जांच',
      buttonLabel: 'स्थिति अपडेट करें',
    },
    ta: {
      title: 'வணிகப் பதிவு நிலையை உறுதிப்படுத்தவும்',
      description: 'இத்திட்டத்திற்கு முறையான பதிவு தேவைப்படுகிறது. உங்கள் உத்யம்/வணிக நிலையை உறுதிப்படுத்தவும்.',
      badgeText: 'பதிவு சரிபார்ப்பு',
      buttonLabel: 'பதிவைப் புதுப்பிக்கவும்',
    },
    te: {
      title: 'వ్యాపార నమోదు స్థితిని ధృవీకరించండి',
      description: 'ఈ పథకానికి అధికారిక నమోదు అవసరం. మీ ఉద్యమ్/వ్యాపార స్థితిని నిర్ధారించండి.',
      badgeText: 'నమోదు తనిఖీ',
      buttonLabel: 'నమోదును నవీకరించండి',
    },
    kn: {
      title: 'ವ್ಯವಹಾರ ನೋಂದಣಿ ಸ್ಥಿತಿಯನ್ನು ದೃಢೀಕರಿಸಿ',
      description: 'ಈ ಯೋಜನೆಗೆ ಔಪಚಾರಿಕ ನೋಂದಣಿ ಅಗತ್ಯವಿದೆ. ನಿಮ್ಮ ಉದ್ಯಮ್/ವ್ಯಾಪಾರ ಸ್ಥಿತಿಯನ್ನು ದೃಢೀಕರಿಸಿ.',
      badgeText: 'ನೋಂದಣಿ ಪರಿಶೀಲನೆ',
      buttonLabel: 'ನೋಂದಣಿ ನವೀಕರಿಸಿ',
    },
    ml: {
      title: 'ബിസിനസ്സ് രജിസ്ട്രേഷൻ നില സ്ഥിരീകരിക്കുക',
      description: 'ഈ പദ്ധതിക്ക് ഔദ്യോഗിക രജിസ്ട്രേഷൻ ആവശ്യമാണ്. നിങ്ങളുടെ ഉദ്യം/വ്യാപാര നില സ്ഥിരീകരിക്കുക.',
      badgeText: 'രജിസ്ട്രേഷൻ പരിശോധന',
      buttonLabel: 'രജിസ്ട്രേഷൻ പുതുക്കുക',
    },
    mr: {
      title: 'व्यवसाय नोंदणी स्थिती निश्चित करा',
      description: 'या योजनेसाठी औपचारिक नोंदणी आवश्यक आहे. आपली उद्यम/व्यापार स्थिती निश्चित करा.',
      badgeText: 'नोंदणी तपासणी',
      buttonLabel: 'नोंदणी अद्ययावत करा',
    },
  },
  COMPLETE_BUSINESS_PROFILE: {
    en: {
      title: 'Complete Your Business Profile',
      description: 'Add project cost, stage, and support needs to unlock tailored scheme relevance.',
      badgeText: 'Profile Incomplete',
      buttonLabel: 'Add Business Details',
    },
    hi: {
      title: 'व्यवसाय प्रोफ़ाइल पूर्ण करें',
      description: 'परियोजना लागत, चरण और सहायता आवश्यकताएं जोड़कर सटीक सिफारिशें प्राप्त करें।',
      badgeText: 'व्यवसाय विवरण शेष',
      buttonLabel: 'व्यवसाय विवरण जोड़ें',
    },
    ta: {
      title: 'உங்கள் வணிக சுயவிவரத்தை முழுமையாக்குங்கள்',
      description: 'திட்டச் செலவு, வணிக நிலை மற்றும் ஆதரவுத் தேவைகளைச் சேர்த்து துல்லியமான பரிந்துரைகளைப் பெறுங்கள்.',
      badgeText: 'விவரங்கள் தேவை',
      buttonLabel: 'வணிக விவரங்களைச் சேர்க்க',
    },
    te: {
      title: 'మీ వ్యాపార ప్రొఫైల్‌ను పూర్తి చేయండి',
      description: 'ఖచ్చితమైన సిఫార్సులను పొందడానికి ప్రాజెక్ట్ వ్యయం, దశ మరియు సహాయ అవసరాలను జోడించండి.',
      badgeText: 'వివరాలు అసంపూర్ణం',
      buttonLabel: 'వ్యాపార వివరాలు జోడించండి',
    },
    kn: {
      title: 'ನಿಮ್ಮ ವ್ಯವಹಾರ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
      description: 'ನಿಖರವಾದ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಲು ಯೋಜನಾ ವೆಚ್ಚ, ಹಂತ ಮತ್ತು ಬೆಂಬಲದ ಅಗತ್ಯಗಳನ್ನು ಸೇರಿಸಿ.',
      badgeText: 'ವಿವರಗಳು ಅಪೂರ್ಣ',
      buttonLabel: 'ವ್ಯವಹಾರ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ',
    },
    ml: {
      title: 'നിങ്ങളുടെ ബിസിനസ്സ് പ്രൊഫൈൽ പൂർത്തിയാക്കുക',
      description: 'കൃത്യമായ ശുപാർശകൾ ലഭിക്കാൻ പ്രോജക്റ്റ് ചെലവ്, ഘട്ടം, സഹായ ആവശ്യങ്ങൾ എന്നിവ ചേർക്കുക.',
      badgeText: 'വിവരങ്ങൾ അപൂർണ്ണം',
      buttonLabel: 'ബിസിനസ്സ് വിവരങ്ങൾ ചേർക്കുക',
    },
    mr: {
      title: 'आपले व्यवसाय प्रोफाइल पूर्ण करा',
      description: 'अचूक शिफारसी मिळवण्यासाठी प्रकल्प खर्च, टप्पा आणि सहाय्याच्या गरजा जोडा.',
      badgeText: 'तपशील अपूर्ण',
      buttonLabel: 'व्यवसाय तपशील जोडा',
    },
  },
  ADD_FUNDING_REQUIREMENT: {
    en: {
      title: 'Add Your Funding Requirement',
      description: 'Provide project cost and existing investment to compute accurate funding gap alignment.',
      badgeText: 'Funding Needed',
      buttonLabel: 'Add Funding Cost',
    },
    hi: {
      title: 'वित्तीय आवश्यकता दर्ज करें',
      description: 'परियोजना लागत और निवेश जोड़ें ताकि वित्तीय अंतर का सटीक मिलान हो सके।',
      badgeText: 'फंडिंग विवरण शेष',
      buttonLabel: 'फंडिंग जोड़ें',
    },
    ta: {
      title: 'உங்கள் நிதித் தேவையைச் சேர்க்கவும்',
      description: 'நிதி இடைவெளியைத் துல்லியமாகக் கணக்கிட திட்டச் செலவு மற்றும் தற்போதைய முதலீட்டை வழங்கவும்.',
      badgeText: 'நிதி விவரம் தேவை',
      buttonLabel: 'நிதிச் செலவைச் சேர்க்க',
    },
    te: {
      title: 'మీ నిధుల అవసరాన్ని నమోదు చేయండి',
      description: 'నిధుల అంతరాన్ని ఖచ్చితంగా లెక్కించడానికి ప్రాజెక్ట్ వ్యయం మరియు ప్రస్తుత పెట్టుబడిని అందించండి.',
      badgeText: 'నిధుల వివరాలు అవసరం',
      buttonLabel: 'నిధుల వ్యయం జోడించండి',
    },
    kn: {
      title: 'ನಿಮ್ಮ ನಿಧಿಯ ಅಗತ್ಯವನ್ನು ಸೇರಿಸಿ',
      description: 'ನಿಧಿಯ ಅಂತರವನ್ನು ನಿಖರವಾಗಿ ಲೆಕ್ಕಾಚಾರ ಮಾಡಲು ಯೋಜನಾ ವೆಚ್ಚ ಮತ್ತು ಹೂಡಿಕೆಯನ್ನು ಒದಗಿಸಿ.',
      badgeText: 'ನಿಧಿಯ ವಿವರ ಅಗತ್ಯ',
      buttonLabel: 'ನಿಧಿಯ ವೆಚ್ಚ ಸೇರಿಸಿ',
    },
    ml: {
      title: 'നിങ്ങളുടെ ഫണ്ടിംഗ് ആവശ്യം ചേർക്കുക',
      description: 'ഫണ്ടിംഗ് വിടവ് കൃത്യമായി കണക്കാക്കാൻ പ്രോജക്റ്റ് ചെലവും നിക്ഷേപവും നൽകുക.',
      badgeText: 'ഫണ്ടിംഗ് ആവശ്യമാണ്',
      buttonLabel: 'ഫണ്ടിംഗ് ചെലവ് ചേർക്കുക',
    },
    mr: {
      title: 'आपली निधी गरज नोंदवा',
      description: 'निधीतील तफावत अचूकपणे मोजण्यासाठी प्रकल्प खर्च आणि सध्याची गुंतवणूक द्या.',
      badgeText: 'निधी तपशील हवे आहेत',
      buttonLabel: 'निधी खर्च जोडा',
    },
  },
  EXPLORE_PRIMARY_NEED: {
    en: {
      title: 'Explore Schemes For Your Need',
      description: 'You qualify statutorily, but this scheme does not directly fulfill your primary business need.',
      badgeText: 'Low Need Alignment',
      buttonLabel: 'Explore Other Schemes',
    },
    hi: {
      title: 'प्राथमिक आवश्यकता के अनुकूल योजनाएं देखें',
      description: 'आप इस योजना के लिए पात्र हैं, परंतु यह आपकी मुख्य सहायता आवश्यकता को पूरा नहीं करती।',
      badgeText: 'कम प्रासंगिकता',
      buttonLabel: 'अन्य योजनाएं खोजें',
    },
    ta: {
      title: 'உங்கள் தேவைக்கேற்ற பிற திட்டங்களை ஆராயுங்கள்',
      description: 'நீங்கள் சட்டப்பூர்வமாகத் தகுதி பெற்றுள்ளீர்கள், ஆனால் இத்திட்டம் உங்கள் முதன்மைத் தேவையைப் பூர்த்தி செய்யவில்லை.',
      badgeText: 'குறைந்த பொருத்தம்',
      buttonLabel: 'பிற திட்டங்களை ஆராய',
    },
    te: {
      title: 'మీ అవసరానికి సరిపోయే పథకాలను అన్వేషించండి',
      description: 'మీరు చట్టబద్ధంగా అర్హులు, కానీ ఈ పథకం మీ ప్రాథమిక వ్యాపార అవసరాన్ని నేరుగా నెరవేర్చదు.',
      badgeText: 'తక్కువ సరిపోలిక',
      buttonLabel: 'ఇతర పథకాలను చూడండి',
    },
    kn: {
      title: 'ನಿಮ್ಮ ಅಗತ್ಯಕ್ಕೆ ತಕ್ಕ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ',
      description: 'ನೀವು ಶಾಸನಬದ್ಧವಾಗಿ ಅರ್ಹರಾಗಿದ್ದೀರಿ, ಆದರೆ ಈ ಯೋಜನೆಯು ನಿಮ್ಮ ಮುಖ್ಯ ವ್ಯವಹಾರದ ಅಗತ್ಯವನ್ನು ನೇರವಾಗಿ ಪೂರೈಸುವುದಿಲ್ಲ.',
      badgeText: 'ಕಡಿಮೆ ಹೊಂದಾಣಿಕೆ',
      buttonLabel: 'ಇತರ ಯೋಜನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    },
    ml: {
      title: 'നിങ്ങളുടെ ആവശ്യത്തിനനുസരിച്ചുള്ള പദ്ധതികൾ പരിശോധിക്കുക',
      description: 'നിങ്ങൾക്ക് നിയമാനുസൃത യോഗ്യതയുണ്ട്, എന്നാൽ ഈ പദ്ധതി നിങ്ങളുടെ പ്രധാന ബിസിനസ്സ് ആവശ്യത്തെ നേരിട്ട് നിറവേറ്റുന്നില്ല.',
      badgeText: 'കുറഞ്ഞ പൊരുത്തം',
      buttonLabel: 'മറ്റ് പദ്ധതികൾ കണ്ടെത്തുക',
    },
    mr: {
      title: 'आपल्या गरजेसाठी योजना शोधा',
      description: 'आपण वैधानिकरित्या पात्र आहात, परंतु ही योजना आपली मुख्य व्यवसायिक गरज थेट पूर्ण करत नाही.',
      badgeText: 'कमी जुळवणी',
      buttonLabel: 'इतर योजना पहा',
    },
  },
  VERIFY_INFORMATION: {
    en: {
      title: 'Verify Current Notification',
      description: 'Check the official ministry notification for recent amendments or quota revisions.',
      badgeText: 'Review Due',
      buttonLabel: 'Check Portal',
    },
    hi: {
      title: 'नवीनतम दिशानिर्देश जांचें',
      description: 'आवेदन से पूर्व विभाग की आधिकारिक अधिसूचना एवं दिशानिर्देश अवश्य जांचें।',
      badgeText: 'पुष्टि आवश्यक',
      buttonLabel: 'अधिसूचना देखें',
    },
    ta: {
      title: 'தற்போதைய அறிவிப்பைச் சரிபார்க்கவும்',
      description: 'சமீபத்திய திருத்தங்கள் அல்லது வழிகாட்டுதல்களுக்கு அதிகாரப்பூர்வ அமைச்சக அறிவிப்பைச் சரிபார்க்கவும்.',
      badgeText: 'மறுஆய்வு தேவை',
      buttonLabel: 'போர்ட்டலைச் சரிபார்க்க',
    },
    te: {
      title: 'తాజా మార్గదర్శకాలను ధృవీకరించండి',
      description: 'ఇటీవలి సవరణల కోసం మంత్రిత్వ శాఖ యొక్క అధికారిక నోటిఫికేషన్‌ను తనిఖీ చేయండి.',
      badgeText: 'సమీక్ష అవసరం',
      buttonLabel: 'పోర్టల్ తనిఖీ చేయండి',
    },
    kn: {
      title: 'ಪ್ರಸ್ತುತ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
      description: 'ಇತ್ತೀಚಿನ ತಿದ್ದುಪಡಿಗಳಿಗಾಗಿ ಸಚಿವಾಲಯದ ಅಧಿಕೃತ ಅಧಿಸೂಚನೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.',
      badgeText: 'ಪರಿಶೀಲನೆ ಬಾಕಿ',
      buttonLabel: 'ಪೋರ್ಟಲ್ ಪರಿಶೀಲಿಸಿ',
    },
    ml: {
      title: 'നിലവിലെ മാർഗ്ഗനിർദ്ദേശങ്ങൾ പരിശോധിക്കുക',
      description: 'സമീപകാല ഭേദഗതികൾക്കായി മന്ത്രാലയത്തിന്റെ ഔദ്യോഗിക വിജ്ഞാപനം പരിശോധിക്കുക.',
      badgeText: 'പരിശോധന ആവശ്യമാണ്',
      buttonLabel: 'പോർട്ടൽ പരിശോധിക്കുക',
    },
    mr: {
      title: 'सध्याची अधिसूचना पडताळा',
      description: 'अलीकडील सुधारणा किंवा मार्गदर्शक तत्त्वांसाठी अधिकृत मंत्रालय अधिसूचना तपासा.',
      badgeText: 'पुनरावलोकन हवे आहे',
      buttonLabel: 'पोर्टल तपासा',
    },
  },
  PREPARE_DOCUMENTS: {
    en: {
      title: 'Review Documents & Prepare to Apply',
      description: 'High statutory match and high business-need alignment. Review document checklist and prepare application.',
      badgeText: 'High Priority Fit',
      buttonLabel: 'Review Documents',
    },
    hi: {
      title: 'दस्तावेज तैयार करें एवं आवेदन करें',
      description: 'यह योजना आपकी प्रोफ़ाइल और व्यावसायिक आवश्यकता दोनों के पूर्णतः अनुकूल है। दस्तावेज तैयार करें।',
      badgeText: 'उच्च व्यावसायिक उपयुक्तता',
      buttonLabel: 'दस्तावेज चेकलिस्ट',
    },
    ta: {
      title: 'ஆவணங்களைச் சரிபார்த்து விண்ணப்பிக்கத் தயாராகுங்கள்',
      description: 'உயர் சட்டப்பூர்வ பொருத்தம் மற்றும் வணிகத் தேவை பொருத்தம். ஆவணப் பட்டியலைச் சரிபார்த்து விண்ணப்பிக்கவும்.',
      badgeText: 'முன்னுரிமைப் பொருத்தம்',
      buttonLabel: 'ஆவணங்களை மதிப்பாய்வு செய்க',
    },
    te: {
      title: 'పత్రాలను సమీక్షించి దరఖాస్తుకు సిద్ధం చేయండి',
      description: 'అధిక చట్టబద్ధ సరిపోలిక మరియు వ్యాపార అవసర అనుకూలత. పత్రాల జాబితాను సమీక్షించి దరఖాస్తు చేసుకోండి.',
      badgeText: 'అత్యధిక ప్రాధాన్యత',
      buttonLabel: 'పత్రాలను సమీక్షించండి',
    },
    kn: {
      title: 'ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಿದ್ಧರಾಗಿ',
      description: 'ಉತ್ತಮ ಶಾಸನಬದ್ಧ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ವ್ಯವಹಾರದ ಅಗತ್ಯಕ್ಕೆ ಹೊಂದಿಕೆ. ದಾಖಲೆಗಳ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಅರ್ಜಿ ಸಿದ್ಧಪಡಿಸಿ.',
      badgeText: 'ಹೆಚ್ಚಿನ ಆದ್ಯತೆ',
      buttonLabel: 'ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
    },
    ml: {
      title: 'രേഖകൾ പരിശോധിച്ച് അപേക്ഷിക്കാൻ തയ്യാറെടുക്കുക',
      description: 'ഉയർന്ന നിയമപരമായ പൊരുത്തവും ബിസിനസ്സ് ആവശ്യകതയും. രേഖകളുടെ ചെക്ക്‌ലിസ്റ്റ് പരിശോധിച്ച് അപേക്ഷ തയ്യാറാക്കുക.',
      badgeText: 'ഉയർന്ന മുൻഗണന',
      buttonLabel: 'രേഖകൾ പരിശോധിക്കുക',
    },
    mr: {
      title: 'कागदपत्रे तपासा आणि अर्जाची तयारी करा',
      description: 'उच्च वैधानिक जुळवणी आणि व्यवसायिक गरज. कागदपत्रांची यादी तपासा आणि अर्ज तयार करा.',
      badgeText: 'उच्च प्राधान्य जुळवणी',
      buttonLabel: 'कागदपत्रे तपासा',
    },
  },
  VISIT_OFFICIAL_PORTAL: {
    en: {
      title: 'Apply on Official Portal',
      description: 'Your profile satisfies all core statutory criteria. Proceed directly to the government portal.',
      badgeText: 'Eligible to Apply',
      buttonLabel: 'Open Portal',
    },
    hi: {
      title: 'आधिकारिक पोर्टल पर आवेदन करें',
      description: 'आपकी प्रोफ़ाइल पूर्णतः अनुकूल है। सीधे सरकारी पोर्टल पर आवेदन आरंभ करें।',
      badgeText: 'पात्र - सीधे आवेदन',
      buttonLabel: 'पोर्टल पर जाएं',
    },
    ta: {
      title: 'அதிகாரப்பூர்வ போர்ட்டலில் விண்ணப்பிக்கவும்',
      description: 'உங்கள் சுயவிவரம் அனைத்து முக்கிய சட்டப்பூர்வ நிபந்தனைகளையும் பூர்த்தி செய்கிறது. அரசு போர்ட்டலுக்குச் செல்லவும்.',
      badgeText: 'விண்ணப்பிக்கத் தகுதி',
      buttonLabel: 'போர்ட்டலைத் திறக்க',
    },
    te: {
      title: 'అధికారిక పోర్టల్‌లో దరఖాస్తు చేసుకోండి',
      description: 'మీ ప్రొఫైల్ అన్ని ప్రధాన చట్టబద్ధ ప్రమాణాలను సంతృప్తిపరుస్తుంది. ప్రభుత్వ పోర్టల్‌కు వెళ్లండి.',
      badgeText: 'దరఖాస్తుకు అర్హత',
      buttonLabel: 'పోర్టల్ తెరవండి',
    },
    kn: {
      title: 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
      description: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಎಲ್ಲಾ ಮುಖ್ಯ ಶಾಸನಬದ್ಧ ಮಾನದಂಡಗಳನ್ನು ಪೂರೈಸುತ್ತದೆ. ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ.',
      badgeText: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅರ್ಹರು',
      buttonLabel: 'ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ',
    },
    ml: {
      title: 'ഔദ്യോഗിക പോർട്ടലിൽ അപേക്ഷിക്കുക',
      description: 'നിങ്ങളുടെ പ്രൊഫൈൽ പ്രധാന മാനദണ്ഡങ്ങൾ പാലിക്കുന്നു. ഔദ്യോഗിക സർക്കാർ പോർട്ടലിലേക്ക് പോകുക.',
      badgeText: 'അപേക്ഷിക്കാൻ യോഗ്യത',
      buttonLabel: 'പോർട്ടൽ തുറക്കുക',
    },
    mr: {
      title: 'अधिकृत पोर्टलवर अर्ज करा',
      description: 'आपले प्रोफाइल सर्व मुख्य वैधानिक निकष पूर्ण करते. थेट शासकीय पोर्टलवर जा.',
      badgeText: 'अर्ज करण्यास पात्र',
      buttonLabel: 'पोर्टल उघडा',
    },
  },
  CHECK_ELIGIBILITY: {
    en: {
      title: 'Review Eligibility Requirements',
      description: 'Near match: Review statutory details to determine compliance pathway.',
      badgeText: 'Review Gap',
      buttonLabel: 'Review Criteria',
    },
    hi: {
      title: 'पात्रता अंतर की समीक्षा करें',
      description: 'समीप मिलान: मामूली शर्तों को पूरा करके पात्रता प्राप्त की जा सकती है।',
      badgeText: 'समीक्षा योग्य',
      buttonLabel: 'शर्तें देखें',
    },
    ta: {
      title: 'தகுதித் தேவைகளை மதிப்பாய்வு செய்க',
      description: 'நெருங்கிய பொருத்தம்: விதிமுறைகளைப் பூர்த்தி செய்வதற்கான வழிகளை அறிய சட்டப்பூர்வ விவரங்களை மதிப்பாய்வு செய்க.',
      badgeText: 'இடைவெளி மதிப்பாய்வு',
      buttonLabel: 'விதிமுறைகளைப் பார்க்க',
    },
    te: {
      title: 'అర్హత అవసరాలను సమీక్షించండి',
      description: 'సమీప సరిపోలిక: అర్హత నిబంధనలను పరిశీలించి చట్టబద్ధ వివరాలను సమీక్షించండి.',
      badgeText: 'సమీక్ష అవసరం',
      buttonLabel: 'ప్రమాణాలు చూడండి',
    },
    kn: {
      title: 'ಅರ್ಹತಾ ಅವಶ್ಯಕತೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
      description: 'ಸಮೀಪ ಹೊಂದಾಣಿಕೆ: ಅನುಸರಣೆ ಮಾರ್ಗವನ್ನು ನಿರ್ಧರಿಸಲು ಶಾಸನಬದ್ಧ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
      badgeText: 'ಅಂತರ ಪರಿಶೀಲನೆ',
      buttonLabel: 'ಷರತ್ತುಗಳನ್ನು ನೋಡಿ',
    },
    ml: {
      title: 'യോഗ്യതാ മാനദണ്ഡങ്ങൾ പരിശോധിക്കുക',
      description: 'ഏറെക്കുറെ പൊരുത്തപ്പെടുന്നു: നിയമപരമായ വ്യവസ്ഥകൾ പരിശോധിച്ച് അപേക്ഷാ സാധ്യത വിലയിരുത്തുക.',
      badgeText: 'വിടവ് പരിശോധിക്കുക',
      buttonLabel: 'മാനദണ്ഡങ്ങൾ കാണുക',
    },
    mr: {
      title: 'पात्रता आवश्यकता तपासा',
      description: 'जवळपास जुळवणी: अनुपालन मार्ग निश्चित करण्यासाठी वैधानिक तपशील तपासा.',
      badgeText: 'तफावत तपासा',
      buttonLabel: 'निकष पहा',
    },
  },
};

const getLocalizedActionText = (actionType: NextActionType, lang: Language): ActionText => {
  const table = ACTION_TEXTS[actionType];
  return table?.[lang] || table?.en || ACTION_TEXTS.CHECK_ELIGIBILITY.en;
};

const getDocumentChecklistActionText = (count: number, lang: Language): ActionText => {
  switch (lang) {
    case 'hi':
      return {
        title: 'दस्तावेज चेकलिस्ट तैयार करें',
        description: `योजना हेतु आवश्यक ${count} दस्तावेज तैयार रखें ताकि आवेदन में विलंब न हो।`,
        badgeText: 'आवेदन तैयार',
        buttonLabel: 'चेकलिस्ट देखें',
      };
    case 'ta':
      return {
        title: 'சட்டப்பூர்வ சரிபார்ப்புப் பட்டியலைத் தயார் செய்க',
        description: `விண்ணப்பிக்கும் முன் தேவையான அனைத்து ${count} சரிபார்ப்பு ஆவணங்களையும் தயார் செய்யவும்.`,
        badgeText: 'விண்ணப்பிக்கத் தயார்',
        buttonLabel: 'சரிபார்ப்புப் பட்டியல்',
      };
    case 'te':
      return {
        title: 'చట్టబద్ధ పత్రాల జాబితాను సిద్ధం చేయండి',
        description: `దరఖాస్తు చేయడానికి ముందు అవసరమైన అన్ని ${count} ధృవీకరణ పత్రాలను సిద్ధం చేసుకోండి.`,
        badgeText: 'దరఖాస్తుకు సిద్ధం',
        buttonLabel: 'జాబితాను చూడండి',
      };
    case 'kn':
      return {
        title: 'ಶಾಸನಬದ್ಧ ಪರಿಶೀಲನಾ ಪಟ್ಟಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿ',
        description: `ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ${count} ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ.`,
        badgeText: 'ಅರ್ಜಿಗೆ ಸಿದ್ಧ',
        buttonLabel: 'ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ',
      };
    case 'ml':
      return {
        title: 'നിയമാനുസൃത രേഖകളുടെ പട്ടിക തയ്യാറാക്കുക',
        description: `അപേക്ഷിക്കുന്നതിന് മുമ്പ് ആവശ്യമായ എല്ലാ ${count} രേഖകളും തയ്യാറാക്കുക.`,
        badgeText: 'അപേക്ഷിക്കാൻ തയ്യാറാണ്',
        buttonLabel: 'പട്ടിക കാണുക',
      };
    case 'mr':
      return {
        title: 'वैधानिक कागदपत्रांची यादी तयार करा',
        description: `अर्ज करण्यापूर्वी आवश्यक सर्व ${count} पडताळणी कागदपत्रे तयार ठेवा.`,
        badgeText: 'अर्ज करण्यास तयार',
        buttonLabel: 'यादी पहा',
      };
    default:
      return {
        title: 'Prepare Statutory Checklist',
        description: `Prepare all ${count} required verification documents before applying.`,
        badgeText: 'Ready to Apply',
        buttonLabel: 'View Checklist',
      };
  }
};


export function getLocalizedNextBestAction(matchResult: MatchResult, profile: UserProfile, lang: Language = 'en'): LocalizedNextBestAction {
  const semantic = deriveNextBestAction(matchResult, profile);
  const text = semantic.actionType === 'PREPARE_DOCUMENTS' && matchResult.scheme.requiredDocuments.length >= 4
    ? getDocumentChecklistActionText(matchResult.scheme.requiredDocuments.length, lang)
    : getLocalizedActionText(semantic.actionType, lang);
  return { ...semantic, ...text };
}

export const getNextBestAction = getLocalizedNextBestAction;
