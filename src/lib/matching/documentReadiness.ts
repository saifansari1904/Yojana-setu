import { Scheme, UserProfile } from '../../types';
import { Language } from '../../i18n/types';

export type DocumentItemState = 'REQUIRED' | 'PROVIDED' | 'NOT_PROVIDED' | 'UNKNOWN';

export interface DocumentReadinessItem {
  id: string;
  name: string;
  state: DocumentItemState;
  isMandatory: boolean;
  notes?: string;
}

export interface DocumentReadinessAnalysis {
  totalRequired: number;
  preparedCount: number;
  missingCount: number;
  unknownCount: number;
  readinessPercentage: number;
  items: DocumentReadinessItem[];
  statusMessage: string;
}

const getLocalizedDocNotes = (isProvided: boolean, lang: Language): string => {
  if (isProvided) {
    switch (lang) {
      case 'hi':
        return 'तैयार';
      case 'ta':
        return 'தயார் / கிடைக்கிறது';
      case 'te':
        return 'సిద్ధం / అందుబాటులో ఉంది';
      case 'kn':
        return 'ಸಿದ್ಧ / ಲಭ್ಯವಿದೆ';
      case 'ml':
        return 'തയ്യാറാണ് / ലഭ്യമാണ്';
      default:
        return 'Prepared / Available';
    }
  } else {
    switch (lang) {
      case 'hi':
        return 'तैयारी आवश्यक';
      case 'ta':
        return 'தயாரிக்கப்பட வேண்டும்';
      case 'te':
        return 'సిద్ధం చేయాలి';
      case 'kn':
        return 'ಸಿದ್ಧಪಡಿಸಬೇಕಾಗಿದೆ';
      case 'ml':
        return 'തയ്യാറാക്കേണ്ടതുണ്ട്';
      default:
        return 'To be prepared';
    }
  }
};

const getLocalizedDocStatusMessage = (
  totalRequired: number,
  preparedCount: number,
  missingCount: number,
  lang: Language
): string => {
  if (totalRequired === 0) {
    switch (lang) {
      case 'hi':
        return 'इस योजना हेतु किसी पूर्व-आवश्यक वैधानिक दस्तावेज की सूची निर्दिष्ट नहीं है।';
      case 'ta':
        return 'இத்திட்டத்திற்கு எந்த முன்நிபந்தனை சட்டப்பூர்வ ஆவணங்களும் குறிப்பிடப்படவில்லை.';
      case 'te':
        return 'ఈ పథకానికి ముందస్తు చట్టబద్ధ పత్రాల జాబితా పేర్కొనబడలేదు.';
      case 'kn':
        return 'ಈ ಯೋಜನೆಗೆ ಯಾವುದೇ ಪೂರ್ವ ಅಗತ್ಯ ಶಾಸನಬದ್ಧ ದಾಖಲೆಗಳನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ.';
      case 'ml':
        return 'ഈ പദ്ധതിക്ക് മുൻവ്യവസ്ഥയുള്ള നിയമാനുസൃത രേഖകളൊന്നും വ്യക്തമാക്കിയിട്ടില്ല.';
      default:
        return 'No pre-requisite statutory documents specified for this scheme.';
    }
  }

  if (preparedCount === totalRequired) {
    switch (lang) {
      case 'hi':
        return `सभी ${totalRequired} आवश्यक दस्तावेज तैयार हैं। आप आवेदन हेतु तैयार हैं!`;
      case 'ta':
        return `தேவையான அனைத்து ${totalRequired} ஆவணங்களும் தயாராக உள்ளன. நீங்கள் விண்ணப்பிக்கத் தயாராக உள்ளீர்கள்!`;
      case 'te':
        return `అవసరమైన మొత్తం ${totalRequired} పత్రాలు సిద్ధంగా ఉన్నాయి. మీరు దరఖాస్తు చేసుకోవడానికి సిద్ధంగా ఉన్నారు!`;
      case 'kn':
        return `ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ${totalRequired} ದಾಖಲೆಗಳು ಸಿದ್ಧವಾಗಿವೆ. ನೀವು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಿದ್ಧರಾಗಿದ್ದೀರಿ!`;
      case 'ml':
        return `ആവശ്യമായ എല്ലാ ${totalRequired} രേഖകളും തയ്യാറാണ്. നിങ്ങൾക്ക് അപേക്ഷിക്കാൻ കഴിയും!`;
      default:
        return `All ${totalRequired} required documents are ready. You are prepared to apply!`;
    }
  }

  if (preparedCount > 0) {
    switch (lang) {
      case 'hi':
        return `${totalRequired} में से ${preparedCount} दस्तावेज तैयार हैं (${missingCount} शेष)।`;
      case 'ta':
        return `${totalRequired}-இல் ${preparedCount} ஆவணங்கள் தயாராக உள்ளன (${missingCount} நிலுவையில் உள்ளன).`;
      case 'te':
        return `${totalRequired} పత్రాలలో ${preparedCount} సిద్ధంగా ఉన్నాయి (${missingCount} పెండింగ్‌లో ఉన్నాయి).`;
      case 'kn':
        return `${totalRequired} ರಲ್ಲಿ ${preparedCount} ದಾಖಲೆಗಳು ಸಿದ್ಧವಾಗಿವೆ (${missingCount} ಬಾಕಿ ಉಳಿದಿವೆ).`;
      case 'ml':
        return `${totalRequired}-ൽ ${preparedCount} രേഖകൾ തയ്യാറാണ് (${missingCount} ബാക്കിയുണ്ട്).`;
      default:
        return `${preparedCount} of ${totalRequired} documents prepared (${missingCount} pending).`;
    }
  }

  switch (lang) {
    case 'hi':
      return `कुल ${totalRequired} दस्तावेज आवश्यक हैं। आवेदन से पूर्व इन्हें तैयार करें।`;
    case 'ta':
      return `மொத்தம் ${totalRequired} சட்டப்பூர்வ ஆவணங்கள் தேவைப்படுகின்றன. விண்ணப்பிக்கும் முன் இவற்றைத் தயார் செய்யவும்.`;
    case 'te':
      return `మొత్తం ${totalRequired} చట్టబద్ధ పత్రాలు అవసరం. దరఖాస్తు చేయడానికి ముందు వీటిని సిద్ధం చేసుకోండి.`;
    case 'kn':
      return `ಒಟ್ಟು ${totalRequired} ಶಾಸನಬದ್ಧ ದಾಖಲೆಗಳು ಅಗತ್ಯವಿದೆ. ಸಲ್ಲಿಸುವ ಮೊದಲು ಇವುಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ.`;
    case 'ml':
      return `ആകെ ${totalRequired} നിയമാനുസൃത രേഖകൾ ആവശ്യമാണ്. സമർപ്പിക്കുന്നതിന് മുമ്പ് ഇവ തയ്യാറാക്കുക.`;
    default:
      return `${totalRequired} statutory documents required. Prepare these before submitting.`;
  }
};

/**
 * Evaluates document readiness for a given scheme and user profile.
 * Strictly adheres to rule: Never mark a document as PROVIDED unless the user
 * has explicitly marked/confirmed it.
 */
export function evaluateDocumentReadiness(
  scheme: Scheme,
  profile: UserProfile,
  preparedDocIds: string[] | Set<string> = new Set(),
  lang: Language = 'en'
): DocumentReadinessAnalysis {
  const preparedSet = preparedDocIds instanceof Set ? preparedDocIds : new Set(preparedDocIds);

  const docs = scheme.requiredDocuments || [];
  const totalRequired = docs.length;

  if (totalRequired === 0) {
    return {
      totalRequired: 0,
      preparedCount: 0,
      missingCount: 0,
      unknownCount: 0,
      readinessPercentage: 100,
      items: [],
      statusMessage: getLocalizedDocStatusMessage(0, 0, 0, lang),
    };
  }

  const items: DocumentReadinessItem[] = docs.map((docName, index) => {
    const docId = `doc-${scheme.id}-${index}`;
    const isProvided = preparedSet.has(docId) || preparedSet.has(docName);

    // Profile confirmation heuristic only for official registration when registered
    const state: DocumentItemState = isProvided ? 'PROVIDED' : 'NOT_PROVIDED';

    return {
      id: docId,
      name: docName,
      state,
      isMandatory: true,
      notes: getLocalizedDocNotes(isProvided, lang),
    };
  });

  const preparedCount = items.filter((i) => i.state === 'PROVIDED').length;
  const missingCount = items.filter((i) => i.state === 'NOT_PROVIDED').length;
  const unknownCount = items.filter((i) => i.state === 'UNKNOWN').length;

  const readinessPercentage = Math.round((preparedCount / totalRequired) * 100);
  const statusMessage = getLocalizedDocStatusMessage(totalRequired, preparedCount, missingCount, lang);

  return {
    totalRequired,
    preparedCount,
    missingCount,
    unknownCount,
    readinessPercentage,
    items,
    statusMessage,
  };
}
