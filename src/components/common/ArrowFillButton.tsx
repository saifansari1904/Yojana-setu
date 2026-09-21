/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

interface ArrowFillButtonProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export const ArrowFillButton: React.FC<ArrowFillButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  id,
  ariaLabel,
}) => {
  const baseClasses =
    'group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] select-none';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm hover:shadow active:scale-[0.99]';
      break;
    case 'secondary':
      variantClasses =
        'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600 shadow-sm active:scale-[0.99]';
      break;
    case 'outline':
      variantClasses =
        'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-400 active:scale-[0.99]';
      break;
  }

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 shrink-0" />
    </button>
  );
};
