/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check } from 'lucide-react';

interface SuccessCheckmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  className = '',
  size = 'md',
  id,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 p-0.5',
    md: 'w-5 h-5 p-1',
    lg: 'w-7 h-7 p-1.5',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      id={id}
      aria-label="Completed"
      className={`inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ${sizeClasses} ${className}`}
    >
      <Check className={`${iconSizes} stroke-[3]`} />
    </span>
  );
};
