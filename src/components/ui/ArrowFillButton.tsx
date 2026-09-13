import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { transitions } from '../../animations/transitions';

export type ArrowFillButtonVariant = 'primary' | 'secondary' | 'outline' | 'emerald' | 'ghost';
export type ArrowFillButtonSize = 'sm' | 'md' | 'lg';

export interface ArrowFillButtonProps {
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ArrowFillButtonVariant;
  size?: ArrowFillButtonSize;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  fullWidth?: boolean;
  ariaLabel?: string;
}

export const ArrowFillButton: React.FC<ArrowFillButtonProps> = ({
  id,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  icon: IconComponent = ArrowRight,
  className = '',
  fullWidth = false,
  ariaLabel,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Variant styles adhering strictly to Yojana Setu's emerald/stone system
  const variantStyles: Record<ArrowFillButtonVariant, { btn: string; badge: string }> = {
    primary: {
      btn: 'bg-[#14453D] hover:bg-[#0B302B] active:bg-[#07221E] dark:bg-[#1C5045] dark:hover:bg-[#14453D] dark:active:bg-[#0E342D] text-white border border-[#14453D] dark:border-[#23584E]',
      badge: 'bg-white/15 dark:bg-white/10 text-white',
    },
    emerald: {
      btn: 'bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white border border-[#16A34A]',
      badge: 'bg-black/15 text-white',
    },
    secondary: {
      btn: 'bg-white dark:bg-[#1E2924] hover:bg-[#F3F4F3] dark:hover:bg-[#26352E] text-[#14453D] dark:text-[#4ADE80] border border-[#E2E2E0] dark:border-[#2E4137]',
      badge: 'bg-[#D4EFE1] dark:bg-[#1A382D] text-[#14453D] dark:text-[#4ADE80]',
    },
    outline: {
      btn: 'bg-transparent hover:bg-[#14453D]/5 dark:hover:bg-[#4ADE80]/10 text-[#14453D] dark:text-[#4ADE80] border border-[#14453D]/30 dark:border-[#4ADE80]/30',
      badge: 'bg-[#14453D]/10 dark:bg-[#4ADE80]/15 text-[#14453D] dark:text-[#4ADE80]',
    },
    ghost: {
      btn: 'bg-transparent hover:bg-[#EEEEED] dark:hover:bg-[#1E2723] text-[#3F4943] dark:text-[#C5D5CC] border border-transparent',
      badge: 'bg-[#E2E2E0] dark:bg-[#2A3C34] text-[#14453D] dark:text-[#4ADE80]',
    },
  };

  const sizeStyles: Record<ArrowFillButtonSize, { btn: string; badge: string; icon: string }> = {
    sm: {
      btn: 'px-3 py-1.5 text-xs gap-2',
      badge: 'w-5 h-5 rounded',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      btn: 'px-4 py-2.5 text-xs sm:text-sm gap-2.5',
      badge: 'w-6 h-6 rounded',
      icon: 'w-4 h-4',
    },
    lg: {
      btn: 'px-5 py-3 text-sm sm:text-base gap-3 font-bold',
      badge: 'w-7 h-7 rounded-md',
      icon: 'w-4 h-4',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      initial="initial"
      whileHover={disabled || shouldReduceMotion ? undefined : 'hover'}
      whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.98 }}
      className={`relative inline-flex items-center justify-between font-bold rounded shadow-xs transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151C19] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
        currentVariant.btn
      } ${currentSize.btn} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <span className="truncate">{children}</span>

      {/* Animated Arrow Icon Slot */}
      <div
        className={`relative overflow-hidden flex items-center justify-center shrink-0 transition-all ${
          currentVariant.badge
        } ${currentSize.badge}`}
      >
        {shouldReduceMotion ? (
          <IconComponent className={currentSize.icon} />
        ) : (
          <>
            {/* Outgoing Arrow (slides right on hover) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              variants={{
                initial: { x: 0, opacity: 1 },
                hover: { x: 18, opacity: 0 },
              }}
              transition={transitions.fast}
            >
              <IconComponent className={currentSize.icon} />
            </motion.div>

            {/* Incoming Arrow (slides in from left on hover) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              variants={{
                initial: { x: -18, opacity: 0 },
                hover: { x: 0, opacity: 1 },
              }}
              transition={transitions.fast}
            >
              <IconComponent className={currentSize.icon} />
            </motion.div>
          </>
        )}
      </div>
    </motion.button>
  );
};
