import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Compass, X, FileText, FileCheck2 } from 'lucide-react';
import type { SupportPathway as SupportPathwayModel, PathwayAction } from '../../types/supportPathway';
import { SupportPathway } from './SupportPathway';
import { useTranslation } from '../../i18n';

interface SupportPathwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  pathway: SupportPathwayModel;
  onAction?: (action: PathwayAction) => void;
  onSelectScheme?: (schemeId: string) => void;
  onToggleChecklistItem?: (itemId: string) => void;
  onStartPathwayApplication?: () => void;
  isTopMatchTracked?: boolean;
  onOpenReport?: () => void;
  id?: string;
}

export const SupportPathwayModal: React.FC<SupportPathwayModalProps> = ({
  isOpen,
  onClose,
  pathway,
  onAction,
  onSelectScheme,
  onToggleChecklistItem,
  onStartPathwayApplication,
  isTopMatchTracked = false,
  onOpenReport,
  id = 'support-pathway-modal',
}) => {
  const { lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const isHi = lang === 'hi';

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
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#F8FAF9] dark:bg-[#0E1A15] border border-[#D4EFE1] dark:border-[#223F32] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#E2E2E0] dark:border-[#20362B] bg-white dark:bg-[#13241D]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#14453D] dark:bg-[#1C5045] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Compass className="w-5 h-5 text-[#4ADE80]" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id={`${id}-title`}
                  className="text-base sm:text-lg font-bold text-[#14453D] dark:text-[#F0F4F2]"
                >
                  {isHi ? 'उद्यम सहायता मार्ग' : 'Enterprise Support Pathway'}
                </h2>
                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7]">
                  {isHi
                    ? 'आपकी व्यावसायिक स्थिति के अनुसार अनुशंसित कदम और योजना समूह।'
                    : 'Personalized next steps, support priorities, and complementary schemes.'}
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
                  <span>{isHi ? 'रिपोर्ट (PDF)' : 'Report (PDF)'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label={isHi ? 'बंद करें' : 'Close modal'}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#516A5F] dark:text-[#9EB0A7] hover:bg-[#E2E2E0]/50 dark:hover:bg-[#20362C] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <SupportPathway
              pathway={pathway}
              lang={lang === 'hi' ? 'hi' : 'en'}
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-[#E2E2E0] dark:border-[#20362B] bg-white dark:bg-[#13241D]">
            <div className="flex items-center gap-2">
              {onStartPathwayApplication && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartPathwayApplication();
                  }}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#14453D] dark:bg-[#1C5045] px-4 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#0F3730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] cursor-pointer"
                >
                  <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                  {isTopMatchTracked
                    ? isHi
                      ? 'ट्रैकर में अपडेट करें'
                      : 'Update in tracker'
                    : isHi
                      ? 'इस मार्ग को ट्रैक करना शुरू करें'
                      : 'Start tracking this pathway'}
                </button>
              )}

              {onOpenReport && (
                <button
                  type="button"
                  onClick={onOpenReport}
                  className="sm:hidden inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#B2CDBF] dark:border-[#285743] bg-white dark:bg-[#182C24] px-3.5 text-xs font-bold text-[#14453D] dark:text-[#C7D6CE] hover:bg-[#F4F8F6] dark:hover:bg-[#20362C] transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {isHi ? 'रिपोर्ट (PDF)' : 'Report (PDF)'}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E2E2E0] dark:border-[#2A3C34] bg-white dark:bg-[#182C24] px-4 text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] hover:bg-[#EEEEED] dark:hover:bg-[#20362C] transition-colors cursor-pointer"
            >
              {isHi ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
