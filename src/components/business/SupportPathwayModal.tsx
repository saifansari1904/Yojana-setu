import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, FileText, Compass, FileCheck2 } from 'lucide-react';
import { SupportPathway } from './SupportPathway';
import { SupportPathway as SupportPathwayModel } from '../../types/supportPathway';
import { PathwayAction } from '../../types/supportPathway';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';

interface SupportPathwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  pathway: SupportPathwayModel;
  isTopMatchTracked?: boolean;
  onAction?: (action: PathwayAction) => void;
  onSelectScheme?: (schemeId: string) => void;
  onStartPathwayApplication?: () => void;
  onToggleChecklistItem?: (itemId: string) => void;
  onOpenReport?: () => void;
  id?: string;
}

const COPY = {
  modalTitle: {
    en: 'Enterprise Support Pathway',
    hi: 'उद्यम सहायता मार्ग',
    ta: 'நிறுவன உதவிப் பாதை',
    te: 'సంస్థ మద్దతు మార్గం',
    kn: 'ಉದ್ಯಮ ಬೆಂಬಲ ಮಾರ್ಗ',
    ml: 'സംരംഭക സഹായ മാർഗ്ഗം',
    mr: 'उपक्रम सहाय्य मार्ग',
  },
  modalSubtitle: {
    en: 'Personalized next steps, support priorities, and complementary schemes.',
    hi: 'आपकी व्यावसायिक स्थिति के अनुसार अनुशंसित कदम और योजना समूह।',
    ta: 'தனிப்பயனாக்கப்பட்ட அடுத்த படிகள், உதவி முன்னுரிமைகள் மற்றும் கூடுதல் திட்டங்கள்.',
    te: 'వ్యక్తిగతీకరించిన తదుపరి దశలు, మద్దతు ప్రాధాన్యతలు మరియు అనుబంధ పథకాలు.',
    kn: 'ವೈಯಕ್ತೀಕರಿಸಿದ ಮುಂದಿನ ಹಂತಗಳು, ಬೆಂಬಲ ಆದ್ಯತೆಗಳು ಮತ್ತು ಪೂರಕ ಯೋಜನೆಗಳು.',
    ml: 'വ്യക്തിഗതമാക്കിയ അടുത്ത ഘട്ടങ്ങൾ, മുൻഗണനകൾ, അനുബന്ധ പദ്ധതികൾ.',
    mr: 'वैयक्तिकृत पुढील पावले, सहाय्य प्राधान्ये आणि पूरक योजना.',
  },
  reportPdf: {
    en: 'Report (PDF)',
    hi: 'रिपोर्ट (PDF)',
    ta: 'அறிக்கை (PDF)',
    te: 'నివేదిక (PDF)',
    kn: 'ವರದಿ (PDF)',
    ml: 'റിപ്പോർട്ട് (PDF)',
    mr: 'अहवाल (PDF)',
  },
  updateInTracker: {
    en: 'Update in tracker',
    hi: 'ट्रैकर में अपडेट करें',
    ta: 'டிராக்கரில் புதுப்பிக்கவும்',
    te: 'ట్రాకర్‌లో నవీకరించండి',
    kn: 'ಟ್ರಾಕರ್‌ನಲ್ಲಿ ನವೀಕರಿಸಿ',
    ml: 'ട്രാക്കറിൽ അപ്‌ഡേറ്റ് ചെയ്യുക',
    mr: 'ट्रॅकरमध्ये अद्यतनित करा',
  },
  startTracking: {
    en: 'Start tracking this pathway',
    hi: 'इस मार्ग को ट्रैक करना शुरू करें',
    ta: 'இப்பாதையை கண்காணிக்கத் தொடங்குங்கள்',
    te: 'ఈ మార్గాన్ని ట్రాక్ చేయడం ప్రారంభించండి',
    kn: 'ಈ ಮಾರ್ಗವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿ',
    ml: 'ഈ പാത ട്രാക്ക് ചെയ്യാൻ ആരംഭിക്കുക',
    mr: 'हा मार्ग ट्रॅक करण्यास प्रारंभ करा',
  },
  close: {
    en: 'Close',
    hi: 'बंद करें',
    ta: 'மூடு',
    te: 'మూసివేయి',
    kn: 'ಮುಚ್ಚಿ',
    ml: 'അടയ്ക്കുക',
    mr: 'बंद करा',
  },
};

/**
 * Phase 4.2 — Support Pathway Modal.
 *
 * Dedicated modal that presents the entrepreneur's personalized Support Pathway:
 *   - Current stage & journey rail
 *   - Next Best Action (single prioritized recommendation)
 *   - Support Priorities (ranked areas)
 *   - Multi-Scheme Support Stack (credit, skill, marketing, compliance)
 *   - Readiness indicators
 *   - Action to launch application tracker or open printable PDF report
 */
export const SupportPathwayModal: React.FC<SupportPathwayModalProps> = ({
  isOpen,
  onClose,
  pathway,
  isTopMatchTracked = false,
  onAction,
  onSelectScheme,
  onStartPathwayApplication,
  onToggleChecklistItem,
  onOpenReport,
  id = 'support-pathway-modal',
}) => {
  const { lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const l: Language = (lang in COPY.modalTitle) ? lang : 'en';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#F8FAF9] dark:bg-[#0E1A15] border border-[#D9E8DF] dark:border-[#223F32] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#E4E8E4] dark:border-[#20362B] bg-white dark:bg-[#13241D]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#14453D] dark:bg-[#1C5045] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Compass className="w-5 h-5 text-[#4ADE80]" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id={`${id}-title`}
                  className="text-base sm:text-lg font-bold text-[#14453D] dark:text-[#F0F4F2]"
                >
                  {COPY.modalTitle[l]}
                </h2>
                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7]">
                  {COPY.modalSubtitle[l]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenReport && (
                <button
                  type="button"
                  onClick={onOpenReport}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B2CDBF] dark:border-[#285743] bg-white dark:bg-[#182C24] text-xs font-bold text-[#14453D] dark:text-[#C7D6CE] hover:bg-[#F4F8F6] dark:hover:bg-[#20362C] transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{COPY.reportPdf[l]}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label={COPY.close[l]}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#516A5F] dark:text-[#9EB0A7] hover:bg-[#E4E8E4]/50 dark:hover:bg-[#20362C] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <SupportPathway
              pathway={pathway}
              lang={l}
              onAction={(action) => {
                onClose();
                if (onAction) onAction(action);
              }}
              onSelectScheme={(schemeId) => {
                onClose();
                if (onSelectScheme) onSelectScheme(schemeId);
              }}
              onToggleChecklistItem={onToggleChecklistItem}
              showChecklist={true}
              id={`${id}-content`}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-[#E4E8E4] dark:border-[#20362B] bg-white dark:bg-[#13241D]">
            <div className="flex items-center gap-2">
              {onStartPathwayApplication && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartPathwayApplication();
                  }}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#14453D] dark:bg-[#1C5045] px-4 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#0F3730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6A50] cursor-pointer"
                >
                  <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                  {isTopMatchTracked ? COPY.updateInTracker[l] : COPY.startTracking[l]}
                </button>
              )}

              {onOpenReport && (
                <button
                  type="button"
                  onClick={onOpenReport}
                  className="sm:hidden inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#B2CDBF] dark:border-[#285743] bg-white dark:bg-[#182C24] px-3.5 text-xs font-bold text-[#14453D] dark:text-[#C7D6CE] hover:bg-[#F4F8F6] dark:hover:bg-[#20362C] transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {COPY.reportPdf[l]}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E4E8E4] dark:border-[#2A3C34] bg-white dark:bg-[#182C24] px-4 text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] hover:bg-[#EEEEED] dark:hover:bg-[#20362C] transition-colors cursor-pointer"
            >
              {COPY.close[l]}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
