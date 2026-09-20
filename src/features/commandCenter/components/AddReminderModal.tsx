/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scheme } from '../types';
import { useTranslation } from '../i18n';
import { X, Calendar, Bell } from 'lucide-react';

interface AddReminderModalProps {
  schemes: Scheme[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (reminder: {
    title: string;
    titleHi: string;
    schemeId?: string;
    schemeName?: string;
    date: string;
    type: 'USER_REMINDER';
  }) => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  schemes,
  isOpen,
  onClose,
  onAdd,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [schemeId, setSchemeId] = useState(schemes[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const matchedScheme = schemes.find(s => s.id === schemeId);

    onAdd({
      title,
      titleHi: title,
      schemeId,
      schemeName: matchedScheme ? matchedScheme.code : 'General Follow-up',
      date,
      type: 'USER_REMINDER',
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-reminder-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#151C19] rounded-2xl shadow-xl border border-[#E4E8E4] dark:border-[#24342D] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECEB] dark:border-[#24342D] bg-[#FAFAF9] dark:bg-[#151C19]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1E6A50] dark:text-[#4ADE80]" />
            <h3 id="add-reminder-title" className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2]">
              Add Business Follow-up
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-1 text-[#516A5F] dark:text-[#6F7A73] hover:text-[#3F4943] dark:text-[#C5D5CC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="reminder-title-input" className="block text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] mb-1">
              Reminder Description *
            </label>
            <input
              id="reminder-title-input"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Gather updated quotation for machinery"
              className="w-full text-xs border border-[#E4E8E4] dark:border-[#2A3C34] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-[#1A2420] text-[#1A1C1B] dark:text-[#F0F4F2]"
            />
          </div>

          <div>
            <label htmlFor="reminder-scheme-select" className="block text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] mb-1">
              Associated Scheme (Optional)
            </label>
            <select
              id="reminder-scheme-select"
              value={schemeId}
              onChange={e => setSchemeId(e.target.value)}
              className="w-full text-xs border border-[#E4E8E4] dark:border-[#2A3C34] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-[#1A2420] text-[#1A1C1B] dark:text-[#F0F4F2]"
            >
              <option value="">General / Independent</option>
              {schemes.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reminder-date-input" className="block text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] mb-1">
              Target Date *
            </label>
            <input
              id="reminder-date-input"
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-xs border border-[#E4E8E4] dark:border-[#2A3C34] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-[#1A2420] text-[#1A1C1B] dark:text-[#F0F4F2]"
            />
          </div>

          <div className="pt-3 border-t border-[#EAECEB] dark:border-[#24342D] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#516A5F] dark:text-[#9EB0A7] hover:bg-[#F3F4F3] dark:hover:bg-[#1E2924] rounded-lg min-h-[44px]"
            >
              {t('close')}
            </button>
            <button
              id="save-reminder-btn"
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#14453D] text-white hover:bg-[#14453D] rounded-lg min-h-[44px]"
            >
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
