import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, UserPlus, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n';

interface AccountPromptModalProps {
  onCreateAccount: () => void;
  onContinueWithoutAccount: () => void;
}

export const AccountPromptModal: React.FC<AccountPromptModalProps> = ({
  onCreateAccount,
  onContinueWithoutAccount,
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the primary button on mount for accessibility
  useEffect(() => {
    const primaryBtn = dialogRef.current?.querySelector<HTMLElement>('[data-primary-action]');
    primaryBtn?.focus();
  }, []);

  // Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onContinueWithoutAccount();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onContinueWithoutAccount]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"
      onClick={onContinueWithoutAccount}
      role="presentation"
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="yj-card max-w-md w-full p-6 sm:p-8 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-prompt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onContinueWithoutAccount}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#516A5F] dark:text-[#8FA197] hover:bg-[#F3F4F3] dark:hover:bg-[#1E2A25] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#D9E8DF] dark:bg-[#1A382D] flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-[#14453D] dark:text-[#4ADE80]" />
          </div>
          <h2
            id="account-prompt-title"
            className="text-xl font-extrabold text-[#1A1C1B] dark:text-[#F0F4F2] mb-2"
          >
            {t('welcome.authPromptTitle')}
          </h2>
          <p className="text-sm text-[#516A5F] dark:text-[#9EB0A7] leading-relaxed mb-6">
            {t('welcome.authPromptDesc')}
          </p>

          <div className="flex flex-col gap-3">
            <button
              data-primary-action
              onClick={onCreateAccount}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#14453D] dark:bg-[#4ADE80] text-white dark:text-[#14453D] text-sm font-bold hover:bg-[#1E6A50] dark:hover:bg-[#6EE7B7] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E6A50] focus:ring-offset-2"
            >
              {t('welcome.authPromptPrimary')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onContinueWithoutAccount}
              className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-[#516A5F] dark:text-[#9EB0A7] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2] hover:bg-[#F3F4F3] dark:hover:bg-[#1E2A25] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E6A50] focus:ring-offset-2"
            >
              {t('welcome.authPromptSecondary')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
