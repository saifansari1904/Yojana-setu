/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ShieldCheck, Lock, HardDrive, EyeOff, X, CheckCircle2, UserCheck } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface AccountPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantName?: string;
}

export const AccountPrivacyModal: React.FC<AccountPrivacyModalProps> = ({
  isOpen,
  onClose,
  applicantName,
}) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen) return null;

  // Render via portal to document.body so the fixed overlay is always
  // positioned relative to the viewport. Ancestors with transform/filter
  // (e.g. the motion-animated identity pod) otherwise become the containing
  // block for `fixed` descendants, which pushes the dialog upward.
  return createPortal(
    <AnimatePresence>
      <div
        id="account-privacy-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white dark:bg-[#151C19] border border-[#DEE7E2] dark:border-[#223F30] rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden text-left"
        >
          {/* Top Decorative Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8EFEA] dark:border-[#223F30]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9E8DF] dark:bg-[#162B22] text-[#14453D] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3
                  id="privacy-dialog-title"
                  className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[#F0F4F2]"
                >
                  {t('account.privacyModalTitle')}
                </h3>
                <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7]">
                  {t('account.privacyModalSubtitle')}
                </p>
              </div>
            </div>
            <button
              id="privacy-modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#516A5F] dark:text-[#9EB0A7] hover:text-[#1F2421] dark:hover:text-[#F0F4F2] hover:bg-[#F3F6F4] dark:hover:bg-[#1E2B25] rounded-lg transition-colors cursor-pointer"
              aria-label={t('account.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy Guarantees */}
          <div className="space-y-4 py-5 text-xs sm:text-sm text-[#3F4943] dark:text-[#CBD8D2]">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F4F9F6] dark:bg-[#101D18] border border-[#D5E8DF] dark:border-[#1E3B2E]">
              <HardDrive className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#14453D] dark:text-[#4ADE80] block mb-0.5">
                  100% On-Device Local Storage
                </span>
                <p className="text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed text-xs">
                  {t('account.privacyStorageNotice')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAFBFB] dark:bg-[#161F1B] border border-[#E2E8E5] dark:border-[#223028]">
              <EyeOff className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1F2421] dark:text-[#F0F4F2] block mb-0.5">
                  {t('account.privacySecurityTitle')}
                </span>
                <p className="text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed text-xs">
                  {t('account.privacySecurityDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAFBFB] dark:bg-[#161F1B] border border-[#E2E8E5] dark:border-[#223028]">
              <Lock className="w-4 h-4 text-[#14453D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1F2421] dark:text-[#F0F4F2] block mb-0.5">
                  No Commercial Profiling
                </span>
                <p className="text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed text-xs">
                  Official Gazette matching algorithms run locally. Data is never monetized, tracked across third-party networks, or shared with advertising platforms.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-[#E8EFEA] dark:border-[#223F30] flex items-center justify-between">
            <span className="text-[11px] text-[#516A5F] dark:text-[#9EB0A7] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6A50] dark:text-[#4ADE80]" />
              Digital Personal Data Protection (DPDP) Standard
            </span>
            <button
              type="button"
              id="privacy-modal-done-btn"
              onClick={onClose}
              className="px-4 py-2 bg-[#14453D] hover:bg-[#0E352E] dark:bg-[#1E6A50] dark:hover:bg-[#15803D] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {t('account.close')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
