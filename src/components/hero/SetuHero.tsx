import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  UserRound,
  ClipboardList,
  BrainCircuit,
  Landmark,
  Rocket,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { ArrowFillButton } from '../ui';
import { YojanaSetuLogo } from '../YojanaSetuLogo';
import { useTranslation, Language } from '../../i18n';
import { transitions, reducedMotionTransition } from '../../animations/transitions';

interface SetuHeroProps {
  /** Primary CTA — starts the business profile journey. */
  onFindSchemes: () => void;
  /** Secondary CTA — scrolls to the "how it works" explanation. */
  onExploreHowItWorks: () => void;
  /**
   * Compact mode: renders only the copy + CTAs (no Setu rail, no outer
   * spacing) so the hero can sit beside the sign-in card above the fold.
   */
  compact?: boolean;
}

const HERO_LOCALIZED: Record<
  Language,
  {
    compactTitle1: string;
    compactHighlight: string;
    compactTitle2: string;
    compactDesc: string;
    fullEyebrow: string;
    fullTitle1: string;
    fullHighlight: string;
    fullTitle2: string;
    fullDesc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    journeyAria: string;
    steps: { label: string; hint: string }[];
    pillars: { title: string; body: string }[];
  }
> = {
  en: {
    compactTitle1: 'The Intelligent Bridge Between Entrepreneurs & ',
    compactHighlight: 'Government Schemes',
    compactTitle2: '',
    compactDesc:
      'Empowering micro, small, and rural entrepreneurs with deterministic eligibility verification, real-time funding calculations, and guided application assistance.',
    fullEyebrow: 'Yojana Setu Intelligence',
    fullTitle1: 'Discover the right ',
    fullHighlight: 'government support',
    fullTitle2: ' for your business.',
    fullDesc:
      'Answer a short profile, then see which schemes match you, exactly why they match, and what to do next — every recommendation traced to a verified government source.',
    ctaPrimary: 'Find My Schemes',
    ctaSecondary: 'Explore How It Works',
    journeyAria: 'Yojana Setu journey',
    steps: [
      { label: 'Entrepreneur', hint: 'You and your business' },
      { label: 'Profile', hint: 'Structured details' },
      { label: 'Intelligence', hint: 'Deterministic rules' },
      { label: 'Government schemes', hint: 'Verified sources' },
      { label: 'Action', hint: 'Prepare and apply' },
    ],
    pillars: [
      {
        title: 'Gazette-Verified Rules Engine',
        body: 'Zero AI hallucinations. Matching is computed strictly from official ministry criteria.',
      },
      {
        title: 'Privacy-First Architecture',
        body: 'Your details stay in your browser session. No sensitive identifiers are stored.',
      },
    ],
  },
  hi: {
    compactTitle1: 'उद्यमियों और ',
    compactHighlight: 'सरकारी योजनाओं',
    compactTitle2: ' के बीच बुद्धिमान सेतु',
    compactDesc:
      'सूक्ष्म, लघु और ग्रामीण उद्यमियों को निश्चित पात्रता सत्यापन, वास्तविक-समय वित्तीय गणना और मार्गदर्शित आवेदन सहायता के साथ सशक्त बनाना।',
    fullEyebrow: 'योजना सेतु इंटेलिजेंस',
    fullTitle1: 'अपने व्यवसाय के लिए ',
    fullHighlight: 'सही सरकारी सहायता',
    fullTitle2: ' खोजें।',
    fullDesc:
      'अपनी प्रोफाइल भरें और देखें कि कौन सी योजनाएं आपसे मेल खाती हैं, क्यों मेल खाती हैं, और आगे क्या करना है — सब सत्यापित सरकारी स्रोतों से।',
    ctaPrimary: 'मेरी योजनाएं खोजें',
    ctaSecondary: 'यह कैसे काम करता है',
    journeyAria: 'योजना सेतु यात्रा',
    steps: [
      { label: 'उद्यमी', hint: 'आपका व्यवसाय' },
      { label: 'प्रोफाइल', hint: 'संरचित जानकारी' },
      { label: 'इंटेलिजेंस', hint: 'निश्चित नियम गणना' },
      { label: 'सरकारी योजनाएं', hint: 'सत्यापित स्रोत' },
      { label: 'अगला कदम', hint: 'तैयारी और आवेदन' },
    ],
    pillars: [
      {
        title: 'गजट-सत्यापित नियम इंजन',
        body: 'कोई AI अनुमान नहीं। मेल केवल आधिकारिक मंत्रालय मानदंडों से गणना होता है।',
      },
      {
        title: 'गोपनीयता-प्रथम संरचना',
        body: 'आपकी जानकारी आपके ब्राउज़र सत्र में रहती है; कोई संवेदनशील पहचान संग्रहित नहीं होती।',
      },
    ],
  },
  ta: {
    compactTitle1: 'தொழில்முனைவோர் மற்றும் ',
    compactHighlight: 'அரசு திட்டங்களுக்கு',
    compactTitle2: ' இடையேயான அறிவார்ந்த பாலம்',
    compactDesc:
      'நுண், சிறு மற்றும் கிராமப்புற தொழில்முனைவோருக்கு வெளிப்படையான தகுதி சரிபார்ப்பு, உடனடி நிதியுதவி கணக்கீடு மற்றும் வழிகாட்டப்பட்ட விண்ணப்ப உதவி.',
    fullEyebrow: 'யோஜனா சேது நுண்ணறிவு',
    fullTitle1: 'உங்கள் வணிகத்திற்கான ',
    fullHighlight: 'சரியான அரசு ஆதரவை',
    fullTitle2: ' கண்டறியுங்கள்.',
    fullDesc:
      'சுயவிவரத்தை நிரப்பி, உங்களுக்கு ஏற்ற திட்டங்கள் எவை, ஏன் பொருந்துகின்றன, அடுத்த கட்ட நடவடிக்கை என்ன என்பதை தெரிந்து கொள்ளுங்கள்.',
    ctaPrimary: 'திட்டங்களை கண்டறிக',
    ctaSecondary: 'செயல்முறை விளக்கம்',
    journeyAria: 'யோஜனா சேது பயணம்',
    steps: [
      { label: 'தொழில்முனைவோர்', hint: 'உங்கள் வணிகம்' },
      { label: 'சுயவிவரம்', hint: 'கட்டமைக்கப்பட்ட விவரங்கள்' },
      { label: 'நுண்ணறிவு', hint: 'துல்லிய விதி கணக்கீடு' },
      { label: 'அரசு திட்டங்கள்', hint: 'சரிபார்க்கப்பட்ட ஆதாரங்கள்' },
      { label: 'அடுத்த நடவடிக்கை', hint: 'தயாரித்து விண்ணப்பிக்க' },
    ],
    pillars: [
      {
        title: 'அரசிதழ் சரிபார்க்கப்பட்ட விதி இயந்திரம்',
        body: 'AI யூகங்கள் இல்லை. மத்திய & மாநில அமைச்சகத்தின் அதிகாரப்பூர்வ விதிகளின் அடிப்படையில் மட்டுமே தகுதி கணக்கிடப்படுகிறது.',
      },
      {
        title: 'தனியுரிமைக்கு முன்னுரிமை',
        body: 'உங்கள் விவரங்கள் உங்கள் உலாவியில் மட்டுமே இருக்கும்; எந்தவொரு முக்கியமான அடையாளமும் சேமிக்கப்படுவதில்லை.',
      },
    ],
  },
  te: {
    compactTitle1: 'వ్యవస్థాపకులు మరియు ',
    compactHighlight: 'ప్రభుత్వ పథకాల',
    compactTitle2: ' మధ్య తెలివైన వారధి',
    compactDesc:
      'సూక్ష్మ, చిన్న మరియు గ్రామీణ వ్యవస్థాపకులకు చట్టబద్ధమైన అర్హత ధృవీకరణ, నిజ-సమయ ఆర్థిక లెక్కింపు మరియు మార్గదర్శక దరఖాస్తు సహాయం.',
    fullEyebrow: 'యోజన సేతు ఇంటెలిజెన్స్',
    fullTitle1: 'మీ వ్యాపారానికి ',
    fullHighlight: 'సరైన ప్రభుత్వ మద్దతును',
    fullTitle2: ' కనుగొనండి.',
    fullDesc:
      'మీ ప్రొఫైల్ వివరాలను పూరించి, ఏ పథకాలు మీకు సరిపోతాయి, ఎందుకు సరిపోతాయి మరియు తదుపరి ఏమి చేయాలో సులభంగా తెలుసుకోండి.',
    ctaPrimary: 'పథకాలను కనుగొనండి',
    ctaSecondary: 'ఇది ఎలా పనిచేస్తుంది',
    journeyAria: 'యోజన సేతు ప్రయాణం',
    steps: [
      { label: 'వ్యవస్థాపకుడు', hint: 'మీ వ్యాపారం' },
      { label: 'ప్రొఫైల్', hint: 'నిర్మాణాత్మక వివరాలు' },
      { label: 'ఇంటెలిజెన్స్', hint: 'ఖచ్చితమైన నియమ లెక్కింపు' },
      { label: 'ప్రభుత్వ పథకాలు', hint: 'ధృవీకరించబడిన వనరులు' },
      { label: 'తదుపరి చర్య', hint: 'సిద్ధం చేసి దరఖాస్తు చేయండి' },
    ],
    pillars: [
      {
        title: 'గెజిట్-ధృవీకరించబడిన నిబంధనల ఇంజిన్',
        body: 'ఎటువంటి AI ఊహాగానాలు లేవు. అధికారిక మంత్రిత్వ ప్రమాణాల ఆధారంగా మాత్రమే లెక్కింపు.',
      },
      {
        title: 'గోప్యత-మొదటి రూపకల్పన',
        body: 'మీ వివరాలు మీ బ్రౌజర్ సెషన్‌లో మాత్రమే ఉంటాయి. సున్నితమైన డేటా ఏదీ నిల్వ చేయబడదు.',
      },
    ],
  },
  kn: {
    compactTitle1: 'ಉದ್ಯಮಿಗಳು ಮತ್ತು ',
    compactHighlight: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ',
    compactTitle2: ' ನಡುವಿನ ಬುದ್ಧಿವಂತ ಸೇತು',
    compactDesc:
      'ಸೂಕ್ಷ್ಮ, ಸಣ್ಣ ಮತ್ತು ಗ್ರಾಮೀಣ ಉದ್ಯಮಿಗಳಿಗೆ ನಿಖರ ಅರ್ಹತಾ ಪರಿಶೀಲನೆ, ನೈಜ-ಸಮಯದ ಹಣಕಾಸು ಲೆಕ್ಕಾಚಾರ ಮತ್ತು ಮಾರ್ಗದರ್ಶಿತ ಅರ್ಜಿ ನೆರವು.',
    fullEyebrow: 'ಯೋಜನಾ ಸೇತು ಇಂಟೆಲಿಜೆನ್ಸ್',
    fullTitle1: 'ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ',
    fullHighlight: 'ಸರಿಯಾದ ಸರ್ಕಾರಿ ನೆರವನ್ನು',
    fullTitle2: ' ಕಂಡುಕೊಳ್ಳಿ.',
    fullDesc:
      'ಸರಳ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ, ಯಾವ ಯೋಜನೆಗಳು ನಿಮಗೆ ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತವೆ, ಏಕೆ ಹೊಂದುತ್ತವೆ ಮತ್ತು ಮುಂದೇನು ಮಾಡಬೇಕೆಂದು ತಿಳಿಯಿರಿ.',
    ctaPrimary: 'ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ',
    ctaSecondary: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
    journeyAria: 'ಯೋಜನಾ ಸೇತು ಪ್ರಯಾಣ',
    steps: [
      { label: 'ಉದ್ಯಮಿ', hint: 'ನಿಮ್ಮ ವ್ಯವಹಾರ' },
      { label: 'ಪ್ರೊಫೈಲ್', hint: 'ರಚನಾತ್ಮಕ ವಿವರಗಳು' },
      { label: 'ಇಂಟೆಲಿಜೆನ್ಸ್', hint: 'ಖಚಿತ ನಿಯಮ ಲೆಕ್ಕಾಚಾರ' },
      { label: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು', hint: 'ದೃಢೀಕೃತ ಮೂಲಗಳು' },
      { label: 'ಮುಂದಿನ ಕ್ರಮ', hint: 'ಸಿದ್ಧತೆ ಮತ್ತು ಅರ್ಜಿ' },
    ],
    pillars: [
      {
        title: 'ಗೆಜೆಟ್-ದೃಢೀಕೃತ ನಿಯಮ ಎಂಜಿನ್',
        body: 'ಯಾವುದೇ AI ಊಹೆಗಳಿಲ್ಲ. ಅಧಿಕೃತ ಸಚಿವಾಲಯದ ಮಾನದಂಡಗಳಿಂದ ಮಾತ್ರ ಹೊಂದಾಣಿಕೆ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.',
      },
      {
        title: 'ಗೌಪ್ಯತೆಗೆ ಮೊದಲ ಆದ್ಯತೆ',
        body: 'ನಿಮ್ಮ ವಿವರಗಳು ನಿಮ್ಮ ಬ್ರೌಸರ್ ಸೆಷನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಇರುತ್ತವೆ; ಯಾವುದೇ ಸೂಕ್ಷ್ಮ ಗುರುತನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುವುದಿಲ್ಲ.',
      },
    ],
  },
  ml: {
    compactTitle1: 'സംരംഭകരും ',
    compactHighlight: 'സർക്കാർ പദ്ധതികളും',
    compactTitle2: ' തമ്മിലുള്ള വിവേകപൂർണ്ണമായ സേതു',
    compactDesc:
      'സൂക്ഷ്മ, ചെറുകിട, ഗ്രാമീണ സംരംഭകർക്ക് കൃത്യമായ യോഗ്യതാ പരിശോധന, തത്സമയ സാമ്പത്തിക കണക്കുകൂട്ടൽ, മാർഗ്ഗനിർദ്ദേശ അപേക്ഷാ സഹായം.',
    fullEyebrow: 'യോജന സേതു ഇന്റലിജൻസ്',
    fullTitle1: 'നിങ്ങളുടെ ബിസിനസ്സിന് ',
    fullHighlight: 'ശരിയായ സർക്കാർ സഹായം',
    fullTitle2: ' കണ്ടെത്തുക.',
    fullDesc:
      'പ്രൊഫൈൽ പൂർത്തിയാക്കി, ഏതൊക്കെ പദ്ധതികളാണ് യോജിക്കുന്നത്, എന്തുകൊണ്ട് യോജിക്കുന്നു, അടുത്ത നടപടി എന്താണെന്ന് പരിശോധിക്കുക.',
    ctaPrimary: 'പദ്ധതികൾ കണ്ടെത്തുക',
    ctaSecondary: 'പ്രവർത്തന രീതി',
    journeyAria: 'യോജന സേതു യാത്ര',
    steps: [
      { label: 'സംരംഭകൻ', hint: 'നിങ്ങളുടെ ബിസിനസ്സ്' },
      { label: 'പ്രൊഫൈൽ', hint: 'വിശദാംശങ്ങൾ' },
      { label: 'ഇന്റലിജൻസ്', hint: 'കൃത്യമായ നിയമ കണക്കുകൂട്ടൽ' },
      { label: 'സർക്കാർ പദ്ധതികൾ', hint: 'പരിശോധിച്ച വിവരങ്ങൾ' },
      { label: 'അടുത്ത നടപടി', hint: 'തയ്യാറെടുപ്പും അപേക്ഷയും' },
    ],
    pillars: [
      {
        title: 'ഗസറ്റ്-സ്ഥിരീകരിച്ച റൂൾസ് എഞ്ചിൻ',
        body: 'AI അനുമാനങ്ങളില്ല. ഔദ്യോഗിക മന്ത്രാലയ മാനദണ്ഡങ്ങൾ അനുസരിച്ച് മാത്രം യോഗ്യത കണക്കാക്കുന്നു.',
      },
      {
        title: 'സ്വകാര്യതയ്ക്ക് പ്രഥമ പരിഗണന',
        body: 'വിവരങ്ങൾ നിങ്ങളുടെ ബ്രൗസർ സെഷനിൽ മാത്രം നിലനിൽക്കുന്നു; രഹസ്യ വിവരങ്ങൾ സൂക്ഷിക്കുന്നില്ല.',
      },
    ],
  },
};

/**
 * Landing hero — "Premium Government Intelligence".
 */
export const SetuHero: React.FC<SetuHeroProps> = ({
  onFindSchemes,
  onExploreHowItWorks,
  compact = false,
}) => {
  const { lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const content = HERO_LOCALIZED[lang] || HERO_LOCALIZED.en;
  const isRegional = lang !== 'en';

  const stepIcons = [UserRound, ClipboardList, BrainCircuit, Landmark, Rocket];
  const steps = content.steps.map((step, idx) => ({
    icon: stepIcons[idx] || Rocket,
    label: step.label,
    hint: step.hint,
  }));

  const pillarConfigs = [
    {
      icon: ShieldCheck,
      tile: 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#0B5D4B] dark:text-[#4ADE80]',
      title: content.pillars[0].title,
      body: content.pillars[0].body,
    },
    {
      icon: Lock,
      tile: 'bg-[#FEF3C7] dark:bg-[#3B2F14] text-[#92610A] dark:text-[#FCD34D]',
      title: content.pillars[1].title,
      body: content.pillars[1].body,
    },
  ];

  /**
   * Compact variant — brand emblem, headline, CTAs and trust pillars, sized to
   * sit beside the sign-in card without pushing it below the fold.
   */
  if (compact) {
    return (
      <section id="landing-hero" className="w-full" aria-labelledby="landing-hero-heading">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? reducedMotionTransition : transitions.smooth}
        >
          <div className="flex justify-center lg:justify-start">
            <YojanaSetuLogo size="lg" showTaglines={false} showEnglishPill={false} />
          </div>

          <h1
            id="landing-hero-heading"
            className={`yj-h1 mt-5 text-center lg:text-left text-[#0F1512] dark:text-[#F0F4F2] ${
              isRegional ? 'font-medium leading-snug' : ''
            }`}
          >
            {content.compactTitle1}
            <span className="text-[#0B5D4B] dark:text-[#4ADE80] border-b-2 border-[#D99A2B] dark:border-[#E3A83B]">
              {content.compactHighlight}
            </span>
            {content.compactTitle2}
          </h1>

          <p
            className={`yj-body yj-measure mt-4 mx-auto lg:mx-0 text-center lg:text-left text-[#42544C] dark:text-[#A9BDB3]`}
          >
            {content.compactDesc}
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <ArrowFillButton id="hero-find-schemes-btn" onClick={onFindSchemes} variant="primary" size="md">
              {content.ctaPrimary}
            </ArrowFillButton>
            <ArrowFillButton
              id="hero-how-it-works-btn"
              onClick={onExploreHowItWorks}
              variant="secondary"
              size="md"
            >
              {content.ctaSecondary}
            </ArrowFillButton>
          </div>

          <ul className="mt-6 space-y-3">
            {pillarConfigs.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li
                  key={pillar.title}
                  className="yj-card p-3.5 flex items-start gap-3 transition-colors duration-200"
                >
                  <span
                    aria-hidden="true"
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${pillar.tile}`}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span
                      className={`block yj-support font-bold text-[#0F1512] dark:text-[#F0F4F2]`}
                    >
                      {pillar.title}
                    </span>
                    <span
                      className={`block yj-caption text-[#6F7A73] dark:text-[#8E9F97]`}
                    >
                      {pillar.body}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </section>
    );
  }

  return (
    <section
      id="landing-hero"
      className="w-full max-w-5xl mx-auto mb-10 sm:mb-12"
      aria-labelledby="landing-hero-heading"
    >
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
        {/* Copy + CTAs */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? reducedMotionTransition : transitions.smooth}
        >
          <span className="yj-eyebrow inline-flex items-center gap-2 text-[#0B5D4B] dark:text-[#4ADE80]">
            <span className="w-6 h-px yj-gradient-highlight inline-block" aria-hidden="true" />
            {content.fullEyebrow}
          </span>

          <h1
            id="landing-hero-heading"
            className={`yj-display mt-3 text-[#0F1512] dark:text-[#F0F4F2]`}
          >
            {content.fullTitle1}
            <span className="text-[#0B5D4B] dark:text-[#4ADE80]">{content.fullHighlight}</span>
            {content.fullTitle2}
          </h1>

          <p className={`yj-body-lg yj-measure mt-4 text-[#42544C] dark:text-[#A9BDB3]`}>
            {content.fullDesc}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <ArrowFillButton
              id="hero-find-schemes-btn"
              onClick={onFindSchemes}
              variant="primary"
              size="lg"
            >
              {content.ctaPrimary}
            </ArrowFillButton>
            <ArrowFillButton
              id="hero-how-it-works-btn"
              onClick={onExploreHowItWorks}
              variant="secondary"
              size="lg"
            >
              {content.ctaSecondary}
            </ArrowFillButton>
          </div>
        </motion.div>

        {/* Setu rail — the bridge metaphor as a connected journey */}
        <motion.ol
          aria-label={content.journeyAria}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          variants={
            shouldReduceMotion
              ? undefined
              : { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } }
          }
          className="yj-card yj-card-lg p-5 sm:p-6 relative"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            return (
              <motion.li
                key={step.label}
                variants={
                  shouldReduceMotion
                    ? undefined
                    : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }
                }
                transition={shouldReduceMotion ? reducedMotionTransition : transitions.normal}
                className="relative flex items-start gap-3 pb-5 last:pb-0"
              >
                {/* Connector: the "setu" between two stages */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[17px] top-9 bottom-1 w-0.5 rounded-full yj-setu-connector"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-[#C1E2D0] dark:border-[#24342D] bg-[#F1F5F3] dark:bg-[#102E29] text-[#0B5D4B] dark:text-[#4ADE80]"
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </span>
                <span className="pt-1">
                  <span
                    className={`block yj-support font-semibold text-[#0F1512] dark:text-[#F0F4F2]`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`block yj-caption text-[#6F7A73] dark:text-[#8E9F97]`}
                  >
                    {step.hint}
                  </span>
                </span>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
};

