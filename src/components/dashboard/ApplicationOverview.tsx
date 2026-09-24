import React from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type { ApplicationDashboardSummary } from '../../types/commandCenter';
import type { TrackedApplication } from '../../types/tracker';
import { AnimatedCounter } from '../../animations/AnimatedCounter';

interface ApplicationOverviewProps {
  summary: ApplicationDashboardSummary;
  applications?: TrackedApplication[];
  onOpenTracker?: () => void;
  onOpenWorkspace?: (schemeId: string) => void;
  isHi?: boolean;
}

export const ApplicationOverview: React.FC<ApplicationOverviewProps> = ({
  summary,
  applications = [],
  onOpenTracker,
  onOpenWorkspace,
  isHi = false,
}) => {
  const hasApplications = summary.totalCount > 0;

  return (
    <section
      id="application-overview"
      className="bg-white dark:bg-[#1d2822] border border-[#E3ECE7] dark:border-[#283530] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#EAF5EF] dark:bg-[#162D24] text-[#0F6B4C] dark:text-[#4ADE80]">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isHi ? 'आवेदन ट्रैकर स्थिति' : 'Application Tracker Status'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHi
                ? 'नागरिक तैयारी एवं प्रस्तुति स्थिति का वास्तविक अवलोकन'
                : 'Real runtime tracking of citizen preparation and submission states'}
            </p>
          </div>
        </div>

        {onOpenTracker && (
          <button
            id="open-full-tracker-btn"
            onClick={onOpenTracker}
            className="text-xs font-semibold text-[#0F6B4C] dark:text-[#4ADE80] hover:underline px-2 py-1 min-h-[44px] flex items-center gap-1"
          >
            <span>{isHi ? 'पूरा ट्रैकर खोलें' : 'Open Full Tracker'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[#1d2822] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isHi ? 'आवेदन हेतु तैयार' : 'Ready to Apply'}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            <AnimatedCounter value={summary.readyToApplyCount} />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[#1d2822] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{isHi ? 'तैयारी में' : 'In Preparation'}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            <AnimatedCounter value={summary.preparingCount} />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[#1d2822] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isHi ? 'प्रस्तुत' : 'Submitted'}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            <AnimatedCounter value={summary.appliedCount} />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[#1d2822] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6B4C] dark:text-[#4ADE80]" />
            <span>{isHi ? 'स्वीकृत' : 'Approved'}</span>
          </div>
          <div className="text-xl font-bold text-[#0F6B4C] dark:text-[#4ADE80] mt-1">
            <AnimatedCounter value={summary.approvedCount} />
          </div>
        </div>
      </div>

      {/* Tracked Applications Quick List */}
      {hasApplications && applications.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-[#283530] space-y-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isHi ? 'सक्रिय आवेदन सूची' : 'Active Tracked Applications'}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.slice(0, 3).map((app) => (
              <div
                key={app.schemeId}
                className="py-2 flex items-center justify-between gap-3 text-xs flex-wrap"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {app.schemeName}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 ml-2">
                    {app.status}
                  </span>
                </div>

                {onOpenWorkspace && (
                  <button
                    id={`quick-workspace-${app.schemeId}`}
                    onClick={() => onOpenWorkspace(app.schemeId)}
                    className="text-xs font-semibold text-[#0F6B4C] dark:text-[#4ADE80] hover:underline flex items-center gap-1 min-h-[44px]"
                  >
                    <span>{isHi ? 'कार्यक्षेत्र' : 'Workspace'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
