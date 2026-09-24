import React from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Info,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { FollowUpDashboardSummary, FollowUpItem } from '../../types/commandCenter';
import type { MatchResult } from '../../types/matching';

interface FollowUpOverviewProps {
  summary: FollowUpDashboardSummary;
  onOpenTracker?: () => void;
  onSelectScheme?: (match: MatchResult) => void;
  isHi?: boolean;
}

export const FollowUpOverview: React.FC<FollowUpOverviewProps> = ({
  summary,
  onOpenTracker,
  onSelectScheme,
  isHi = false,
}) => {
  const hasItems = summary.upcomingActionItems.length > 0;

  return (
    <section
      id="follow-up-overview"
      className="bg-white dark:bg-[#1d2822] border border-[#E3ECE7] dark:border-[#283530] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#EAF5EF] dark:bg-[#162D24] text-[#0F6B4C] dark:text-[#4ADE80]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isHi ? 'नागरिक अनुवर्ती केंद्र' : 'Citizen Follow-Up Center'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHi
                ? 'नागरिक द्वारा निर्धारित अनुस्मारक एवं अनुवर्ती कार्य'
                : 'Self-scheduled reminders and tracking checkpoints'}
            </p>
          </div>
        </div>

        {onOpenTracker && (
          <button
            id="manage-reminders-btn"
            onClick={onOpenTracker}
            className="text-xs font-semibold text-[#0F6B4C] dark:text-[#4ADE80] hover:underline px-2 py-1 min-h-[44px] flex items-center gap-1"
          >
            <span>{isHi ? 'अनुस्मारक प्रबंधित करें' : 'Manage Reminders'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mandatory Statutory Notice: Citizen Reminders != Gov Deadlines */}
      <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold">
            {isHi ? 'महत्वपूर्ण सूचना:' : 'Citizen Advisory Note:'}{' '}
          </span>
          {isHi
            ? 'ये नागरिक द्वारा स्वयं निर्धारित अनुस्मारक हैं, आधिकारिक वैधानिक सरकारी समय-सीमाएं या अंतिम तिथियां नहीं हैं।'
            : 'These entries represent citizen self-scheduled reminders. Yojana Setu does not infer or generate statutory government closing deadlines.'}
        </div>
      </div>

      {/* Follow-Up Items List */}
      {hasItems ? (
        <div className="space-y-2.5">
          {summary.upcomingActionItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                item.tone === 'urgent'
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                  : item.tone === 'caution'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{item.schemeName}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400">{item.note}</div>
                {item.reminderDate && (
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {isHi ? 'अनुस्मारक तिथि:' : 'Target Date:'} {item.reminderDate}
                  </div>
                )}
              </div>

              {item.match && onSelectScheme && (
                <button
                  id={`view-followup-scheme-${item.schemeId}`}
                  onClick={() => onSelectScheme(item.match!)}
                  className="self-start sm:self-center px-3 py-1.5 rounded-md bg-white dark:bg-[#1d2822] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium min-h-[44px] flex items-center"
                >
                  {isHi ? 'योजना देखें' : 'View Scheme'}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
          <p>{isHi ? 'कोई लंबित नागरिक अनुस्मारक नहीं है।' : 'No citizen follow-up reminders pending.'}</p>
        </div>
      )}
    </section>
  );
};
