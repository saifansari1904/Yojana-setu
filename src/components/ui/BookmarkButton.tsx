import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { BurstParticles } from '../../animations/BurstParticles';

export interface BookmarkButtonProps {
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
      className={`relative inline-flex items-center justify-center font-bold rounded transition-all cursor-pointer select-none border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] ${
        isSaved
          ? 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80] border-[#16A34A] dark:border-[#22C55E]'
          : 'bg-white dark:bg-[#1E2924] hover:bg-[#F3F4F3] dark:hover:bg-[#26352E] text-[#516A5F] dark:text-[#C5D5CC] border-[#E2E2E0] dark:border-[#2E4137] hover:border-[#B2CDBF] dark:hover:border-[#3E5C4E]'
      } ${compact ? 'p-2 text-xs' : 'px-3 py-1.5 text-xs gap-1.5'} ${className}`}
    >
      {/* Radial spark burst on save confirmation */}
      <BurstParticles active={justToggled && isSaved} />

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
              ? 'fill-[#16A34A] dark:fill-[#4ADE80] text-[#16A34A] dark:text-[#4ADE80]'
              : 'text-current'
          }`}
        />
      </motion.div>

      {!compact && <span className="font-semibold text-xs tracking-tight">{label}</span>}
    </motion.button>
  );
};
