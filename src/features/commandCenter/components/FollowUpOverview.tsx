/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FollowUpItem } from '../types';
import { useTranslation } from '../i18n';
import { Calendar, Bell, ShieldAlert, CheckCircle2, ArrowRight, Plus } from 'lucide-react';

interface FollowUpOverviewProps {
  followUps: FollowUpItem[];
  onToggleComplete: (id: string) => void;
  onAddReminder: () => void;
  onViewAll: () => void;
  id?: string;
}

export const FollowUpOverview: React.FC<FollowUpOverviewProps> = ({
  followUps,
  onToggleComplete,
  onAddReminder,
  onViewAll,
  id = 'follow-up-overview',
}) => {
  const { t, language } = useTranslation();

  const formatDateDisplay = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      return t('today');
    }
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6F7A73] dark:text-[#8E9F97]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7A73] dark:text-[#8E9F97]">
              {t('followUpsTitle')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onAddReminder}
            className="text-xs font-semibold text-[#0F6B4C] dark:text-[#4ADE80] hover:text-[#14453D] dark:hover:text-[#86EFAC] transition-colors p-1"
          >
            {t('addReminder')}
          </button>
        </div>

        {followUps.length > 0 ? (
          <div className="space-y-2.5 mb-4">
            {followUps.slice(0, 3).map(item => {
              const isOfficial = item.type === 'OFFICIAL_DEADLINE';
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-[#EAECEB] dark:border-[#24342D] hover:border-[#E2E2E0] dark:hover:border-[#2A3C34] bg-slate-50/70 dark:bg-[#1A2420] transition-colors gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(item.id)}
                      className="mt-0.5 text-[#8E9F97] dark:text-[#6F7A73] hover:text-[#16A34A] dark:hover:text-[#34D399] transition-colors"
                      aria-label="Toggle completed"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          item.completed ? 'text-[#16A34A] dark:text-[#34D399] fill-emerald-100 dark:fill-emerald-950/60' : 'text-[#C5D5CC] dark:text-[#516A5F]'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="font-semibold text-[#1A1C1B] dark:text-[#F0F4F2]">
                        {language === 'hi' ? item.titleHi : item.title}
                      </div>
                      <div className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] mt-0.5">
                        {item.schemeName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#14453D] dark:text-[#E8EFEA] tabular-nums">
                      {formatDateDisplay(item.date)}
                    </div>
                    {/* Strict distinction between User reminder and Official deadline */}
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-1 ${
                        isOfficial
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                          : 'bg-[#EEEEED] dark:bg-[#24342D] text-[#3F4943] dark:text-[#C5D5CC]'
                      }`}
                    >
                      {isOfficial ? t('officialDeadlineBadge') : t('userReminderBadge')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#6F7A73] dark:text-[#8E9F97]">
            {t('noFollowUps')}
          </div>
        )}
      </div>

      <button
        id="view-all-follow-ups-btn"
        type="button"
        onClick={onViewAll}
        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] hover:text-[#1A1C1B] dark:hover:text-[#F0F4F2] bg-[#FAFAF9] dark:bg-[#1A2420] hover:bg-[#F3F4F3] dark:hover:bg-[#22302A] border border-[#E2E2E0] dark:border-[#24342D] transition-colors min-h-[44px]"
      >
        <span>{t('viewAllFollowUps')}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
