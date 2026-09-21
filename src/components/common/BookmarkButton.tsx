/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bookmark } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface BookmarkButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  className?: string;
  id?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  isSaved,
  onToggle,
  className = '',
  id,
}) => {
  const { t } = useTranslation();

  return (
    <button
      id={id}
      type="button"
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isSaved ? t('saved') : t('save')}
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-150 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-slate-400 ${
        isSaved
          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
      } ${className}`}
    >
      <Bookmark
        className={`w-5 h-5 transition-all ${
          isSaved ? 'fill-amber-600 text-amber-600' : 'text-current'
        }`}
      />
    </button>
  );
};
