import type { ApplicationStatus } from '../types/tracker';
import type { Language } from './types';

export const STATUS_COPY: Record<ApplicationStatus, Record<Language, { label: string; description: string }>> = {
  'docs-ready': {
    en: { label: 'Docs Ready', description: 'Required documents gathered.' },
    hi: { label: 'दस्तावेज़ तैयार', description: 'आवश्यक दस्तावेज़ एकत्र कर लिए गए हैं।' },
    ta: { label: 'ஆவணங்கள் தயார்', description: 'தேவையான ஆவணங்கள் சேகரிக்கப்பட்டுள்ளன.' },
    te: { label: 'పత్రాలు సిద్ధం', description: 'అవసరమైన పత్రాలు సేకరించబడ్డాయి.' },
    kn: { label: 'ದಾಖಲೆಗಳು ಸಿದ್ಧವಾಗಿವೆ', description: 'ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಲಾಗಿದೆ.' },
    ml: { label: 'രേഖകൾ തയ്യാറാണ്', description: 'ആവശ്യമായ രേഖകൾ ശേഖരിച്ചു.' },
  },
  applied: {
    en: { label: 'Applied', description: 'Submitted and awaiting a decision.' },
    hi: { label: 'आवेदन किया', description: 'आवेदन जमा किया गया, निर्णय प्रतीक्षित।' },
    ta: { label: 'விண்ணப்பிக்கப்பட்டது', description: 'சமர்ப்பிக்கப்பட்டு முடிவிற்காக காத்திருக்கிறது.' },
    te: { label: 'దరఖాస్తు చేయబడింది', description: 'సమర్పించబడింది మరియు నిర్ణయం కోసం వేచి ఉంది.' },
    kn: { label: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ', description: 'ಸಲ್ಲಿಸಲಾಗಿದೆ ಮತ್ತು ನಿರ್ಧಾರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ.' },
    ml: { label: 'അപേക്ഷിച്ചു', description: 'സമർപ്പിച്ചു, തീരുമാനത്തിനായി കാത്തിരിക്കുന്നു.' },
  },
  approved: {
    en: { label: 'Approved', description: 'Application approved.' },
    hi: { label: 'स्वीकृत', description: 'आवेदन स्वीकृत हुआ।' },
    ta: { label: 'அங்கீகரிக்கப்பட்டது', description: 'விண்ணப்பம் அங்கீகரிக்கப்பட்டது.' },
    te: { label: 'ఆమోదించబడింది', description: 'దరఖాస్తు ఆమోదించబడింది.' },
    kn: { label: 'ಅನುಮೋದಿಸಲಾಗಿದೆ', description: 'ಅರ್ಜಿ ಅನುಮೋದಿಸಲಾಗಿದೆ.' },
    ml: { label: 'അംഗീകരിച്ചു', description: 'അപേക്ഷ അംഗീകരിച്ചു.' },
  },
  rejected: {
    en: { label: 'Rejected', description: 'Not approved — review alternatives.' },
    hi: { label: 'अस्वीकृत', description: 'आवेदन अस्वीकृत — विकल्प देखें।' },
    ta: { label: 'நிராகரிக்கப்பட்டது', description: 'அங்கீகரிக்கப்படவில்லை — மாற்று வழிகளைப் பார்க்கவும்.' },
    te: { label: 'తిరస్కరించబడింది', description: 'ఆమోదించబడలేదు — ప్రత్యామ్నాయాలను పరిశీలించండి.' },
    kn: { label: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ', description: 'ಅನುಮೋದಿಸಲಾಗಿಲ್ಲ — ಪರ್ಯಾಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.' },
    ml: { label: 'നിരസിച്ചു', description: 'അംഗീകരിച്ചിട്ടില്ല — ഇതരമാർഗ്ഗങ്ങൾ പരിശോധിക്കുക.' },
  },
  interested: {
    en: { label: 'Interested', description: 'Saved — documents still to gather.' },
    hi: { label: 'रुचि है', description: 'सहेजा गया — अभी दस्तावेज़ एकत्र करने हैं।' },
    ta: { label: 'ஆர்வம் உள்ளது', description: 'சேமிக்கப்பட்டது — ஆவணங்களை சேகரிக்க வேண்டும்.' },
    te: { label: 'ఆసక్తి ఉంది', description: 'సేవ్ చేయబడింది — పత్రాలను ఇంకా సేకరించాలి.' },
    kn: { label: 'ಆಸಕ್ತಿ ಇದೆ', description: 'ಉಳಿಸಲಾಗಿದೆ — ದಾಖಲೆಗಳನ್ನು ಇನ್ನೂ ಸಂಗ್ರಹಿಸಬೇಕಾಗಿದೆ.' },
    ml: { label: 'താൽപ്പര്യമുണ്ട്', description: 'സംരക്ഷിച്ചു — രേഖകൾ ഇനിയും ശേഖരിക്കാനുണ്ട്.' },
  },
};