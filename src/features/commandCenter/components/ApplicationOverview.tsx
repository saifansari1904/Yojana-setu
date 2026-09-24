/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ApplicationRecord, Scheme } from '../types';
import { useTranslation } from '../i18n';
import { ArrowRight, CheckCircle2, Clock, Send } from 'lucide-react';

interface ApplicationOverviewProps {
  summary: {
    total: number;
    readyToApply: number;
    preparing: number;
    applied: number;
    approved: number;
    records: { scheme: Scheme; record: ApplicationRecord }[];
  };
  onOpenTracker: () => void;
  onOpenWorkspace: (schemeId: string) => void;
  id?: string;
}

export const ApplicationOverview: React.FC<ApplicationOverviewProps> = ({
  summary,
  onOpenTracker,
  onOpenWorkspace,
  id = 'application-overview',
}) => {
  const { t } = useTranslation();

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#516A5F] dark:text-[var(--text-tertiary)]">
            {t('applicationsTitle')}
          </h3>
          <span className="text-xs font-semibold text-[#3F4943] dark:text-[var(--text-secondary)] bg-[#F3F4F3] dark:bg-[var(--bg-raised)] px-2 py-0.5 rounded-full">
            {summary.total} Active
          </span>
        </div>

        {/* Status Count Bars */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 rounded-lg bg-[#D9E8DF] dark:bg-[#1A382D] border border-[#D9E8DF] dark:border-[#22503E] text-center">
            <div className="text-xs font-semibold text-[#14453D] dark:text-[var(--accent-green)]">{t('readyToApply')}</div>
            <div className="text-xl font-bold text-[#0B302B] dark:text-[#D9E8DF] mt-1 tabular-nums">
              {summary.readyToApply}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#FEF3C7] dark:bg-[var(--status-warning-bg)] border border-[#FCD34D]/40 dark:border-amber-700/60 text-center">
            <div className="text-xs font-semibold text-[#92610A] dark:text-[var(--text-accent)]">{t('preparing')}</div>
            <div className="text-xl font-bold text-amber-900 dark:text-[var(--text-accent)] mt-1 tabular-nums">
              {summary.preparing}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-sky-50 dark:bg-[#0E2A38] border border-sky-100 dark:border-[#164459] text-center">
            <div className="text-xs font-semibold text-sky-800 dark:text-sky-300">{t('applied')}</div>
            <div className="text-xl font-bold text-sky-900 dark:text-sky-200 mt-1 tabular-nums">
              {summary.applied}
            </div>
          </div>
        </div>

        {/* Recent Active Application Rows */}
        {summary.records.length > 0 ? (
          <div className="space-y-2 mb-4">
            {summary.records.slice(0, 3).map(({ scheme, record }) => {
              const statusConfig = {
                'docs-ready': { label: t('readyToApply'), color: 'text-[#1E6A50] dark:text-[var(--accent-green)] bg-[#C1E2D0] dark:bg-[#22503E]', icon: CheckCircle2 },
                'preparing': { label: t('preparing'), color: 'text-[#92610A] dark:text-[var(--text-accent)] bg-[#FEF3C7] dark:bg-[var(--status-warning-bg)]', icon: Clock },
                'applied': { label: t('applied'), color: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-[#0E2A38]', icon: Send },
                'approved': { label: t('approved'), color: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-[#2A163B]', icon: CheckCircle2 },
                'interested': { label: t('interested'), color: 'text-[#3F4943] dark:text-[var(--text-secondary)] bg-[#F3F4F3] dark:bg-[var(--bg-raised)]', icon: Clock },
              }[record.status] || { label: record.status, color: 'text-[#3F4943] dark:text-[var(--text-secondary)] bg-[#F3F4F3] dark:bg-[var(--bg-raised)]', icon: Clock };

              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={record.id}
                  onClick={() => onOpenWorkspace(scheme.id)}
                  className="p-2.5 rounded-lg border border-[#EAECEB] dark:border-[var(--border-subtle)] hover:border-[#E4E8E4] dark:hover:border-[var(--border-subtle)] hover:bg-[#FAFAF9] dark:hover:bg-[var(--bg-raised)] transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1A1C1B] dark:text-[var(--text-main)] truncate">
                      {scheme.code}
                    </div>
                    <div className="text-[11px] text-[#516A5F] dark:text-[var(--text-tertiary)] truncate">
                      {scheme.name}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#516A5F] dark:text-[var(--text-tertiary)]">
            {t('noApplicationsYet')}
          </div>
        )}
      </div>

      <button
        id="view-all-applications-btn"
        type="button"
        onClick={onOpenTracker}
        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold text-[#3F4943] dark:text-[var(--text-secondary)] hover:text-[#1A1C1B] dark:hover:text-[var(--text-main)] bg-[#FAFAF9] dark:bg-[var(--bg-raised)] hover:bg-[#F3F4F3] dark:hover:bg-[#22302A] border border-[#E4E8E4] dark:border-[var(--border-subtle)] transition-colors min-h-[44px]"
      >
        <span>{t('viewApplications')}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
