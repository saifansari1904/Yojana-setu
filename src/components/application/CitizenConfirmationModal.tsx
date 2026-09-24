import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import type { CitizenSubmissionConfirmation } from '../../types/application';
import { useTranslation } from '../../i18n';

interface CitizenConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeId: string;
  schemeName: string;
  portalDomain: string;
  onConfirm: (confirmation: CitizenSubmissionConfirmation) => void;
}

export const CitizenConfirmationModal: React.FC<CitizenConfirmationModalProps> = ({
  isOpen,
  onClose,
  schemeId,
  schemeName,
  portalDomain,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submissionDate, setSubmissionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisclaimerChecked) {
      setErrorMessage('Please confirm that you have submitted the application on the official portal.');
      return;
    }

    onConfirm({
      schemeId,
      submittedAt: submissionDate,
      applicationReferenceNumber: referenceNumber.trim() || undefined,
      portalUsed: portalDomain || 'Official Government Portal',
      submissionNotes: submissionNotes.trim() || undefined,
      confirmationDisclaimerAccepted: true,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg bg-white dark:bg-[#141b17] rounded-2xl shadow-xl border border-[#E5E9E7] dark:border-[#22332A] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9E7] dark:border-[#22332A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1E6A50] dark:text-[#4ADE80]" />
              <h3 className="text-base font-bold text-[#1F2421] dark:text-[#F0F4F2]">
                {t('workspace.confirmModalTitle')}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E9B94] hover:text-[#1F2421] dark:hover:text-[#F0F4F2] hover:bg-[#F4F7F5] dark:hover:bg-[#1d2822] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-[#5A6561] dark:text-[#97A7A0] leading-relaxed">
              {t('workspace.confirmModalDesc')}
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1F2421] dark:text-[#F0F4F2] mb-1">
                {t('workspace.referenceNumberLabel')}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={t('workspace.referenceNumberPlaceholder')}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-white dark:bg-[#1d2822] text-[#1F2421] dark:text-[#F0F4F2] focus:outline-hidden focus:ring-2 focus:ring-[#1E6A50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2421] dark:text-[#F0F4F2] mb-1">
                {t('workspace.submissionDateLabel')}
              </label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-white dark:bg-[#1d2822] text-[#1F2421] dark:text-[#F0F4F2] focus:outline-hidden focus:ring-2 focus:ring-[#1E6A50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2421] dark:text-[#F0F4F2] mb-1">
                {t('workspace.notesLabel')}
              </label>
              <input
                type="text"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder={t('workspace.notesPlaceholder')}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-white dark:bg-[#1d2822] text-[#1F2421] dark:text-[#F0F4F2] focus:outline-hidden focus:ring-2 focus:ring-[#1E6A50]"
              />
            </div>

            {/* Checkbox confirmation */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDisclaimerChecked}
                  onChange={(e) => {
                    setIsDisclaimerChecked(e.target.checked);
                    if (e.target.checked) setErrorMessage('');
                  }}
                  className="mt-0.5 rounded-sm text-[#1E6A50] focus:ring-[#1E6A50]"
                />
                <span className="text-xs text-[#1F2421] dark:text-[#F0F4F2] leading-snug">
                  {t('workspace.confirmCheckbox')}
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E9E7] dark:border-[#22332A]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#5A6561] dark:text-[#97A7A0] hover:bg-[#F4F7F5] dark:hover:bg-[#1d2822] rounded-xl transition-colors"
              >
                {t('workspace.cancelBtn')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1E6A50] hover:bg-[#0D5B41] dark:bg-[#4ADE80] dark:text-[#0E1311] dark:hover:bg-[#22C55E] rounded-xl transition-colors shadow-sm"
              >
                {t('workspace.submitConfirmBtn')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
