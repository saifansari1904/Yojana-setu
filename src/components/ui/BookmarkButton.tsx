import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { BurstParticles } from '../../animations/BurstParticles';

interface BookmarkButtonProps {
  id?: string;
  isSaved: boolean;
  onToggle: () => void;
  compact?: boolean;
  className?: string;
  schemeName?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  id,
  isSaved,
  onToggle,
  compact = false,
  className = '',
  schemeName,
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [justToggled, setJustToggled] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustToggled(true);
    onToggle();
    setTimeout(() => setJustToggled(false), 400);
  };

  const label = isSaved ? t('schemeDetail.saved') : t('schemeDetail.saveScheme');
  const accessibleLabel = schemeName ? `${label} - ${schemeName}` : label;

  return (
    <motion.button
      id={id}
      type="button"
      onClick={handleClick}
      aria-pressed={isSaved}
      aria-label={accessibleLabel}
      title={label}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
      className={`yj-tap yj-focus-ring relative inline-flex items-center justify-center font-bold rounded-[var(--yj-radius-md)] transition-all cursor-pointer select-none border ${
        isSaved
          ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border-[#1E6A50] dark:border-[#22C55E]'
          : 'bg-white dark:bg-[#1E2924] hover:bg-[#F3F4F3] dark:hover:bg-[#26352E] text-[#516A5F] dark:text-[#C5D5CC] border-[#E4E8E4] dark:border-[#2E4137] hover:border-[#B2CDBF] dark:hover:border-[#3E5C4E]'
      } ${compact ? 'p-2 text-xs' : 'px-3 py-1.5 text-xs gap-1.5'} ${className}`}
    >
      {/* Radial spark burst on save confirmation */}
      <BurstParticles active={justToggled && isSaved} />

      {/* Soft radial ring that expands once on save, then fades */}
      {justToggled && isSaved && !shouldReduceMotion && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0.45, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 rounded-[var(--yj-radius-md)] border border-[#1E6A50] dark:border-[#4ADE80]"
        />
      )}

      {/* Animated Heart Icon */}
      <motion.div
        animate={
          justToggled && isSaved && !shouldReduceMotion
            ? { scale: [1, 1.35, 0.92, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-center shrink-0"
      >
        <Heart
          className={`w-3.5 h-3.5 transition-colors ${
            isSaved
              ? 'fill-[#1E6A50] dark:fill-[#4ADE80] text-[#1E6A50] dark:text-[#4ADE80]'
              : 'text-current'
          }`}
        />
      </motion.div>

      {!compact && <span className="font-semibold text-xs tracking-tight">{label}</span>}
    </motion.button>
  );
};
