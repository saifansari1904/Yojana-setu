/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportCategory } from '../types';
import { SUPPORT_CATEGORIES } from '../lib/support/supportPathway';
import { Banknote, FileCheck, GraduationCap, Factory, TrendingUp, ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n';

interface SupportStackOverviewProps {
  categoryCounts: Record<SupportCategory, number>;
  onSelectCategory: (category: SupportCategory) => void;
  id?: string;
}

const CATEGORY_ICONS: Record<SupportCategory, React.ComponentType<{ className?: string }>> = {
  'Funding': Banknote,
  'Registration': FileCheck,
  'Skill Development': GraduationCap,
  'Infrastructure': Factory,
  'Market Access': TrendingUp,
};

export const SupportStackOverview: React.FC<SupportStackOverviewProps> = ({
  categoryCounts,
  onSelectCategory,
  id = 'support-stack-overview',
}) => {
  const { t } = useTranslation();

  return (
    <div
      id={id}
      className="yj-card yj-hoverable p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#516A5F] dark:text-[#8E9F97]">
            YOUR SUPPORT STACK
          </h3>
          <span className="text-xs text-[#516A5F] dark:text-[#8E9F97] font-medium">5 Areas</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#24342D]">
          {SUPPORT_CATEGORIES.map(category => {
            const count = categoryCounts[category] || 0;
            const Icon = CATEGORY_ICONS[category];

            return (
              <button
                key={category}
                id={`support-cat-${String(category || '').toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => onSelectCategory(category)}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg text-left transition-colors hover:bg-[#FAFAF9] dark:hover:bg-[#1E2924] focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-emerald-800 group min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F3F4F3] dark:bg-[#1E2924] flex items-center justify-center text-[#516A5F] dark:text-[#9EB0A7] group-hover:bg-[#14453D] group-hover:text-white transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-[#14453D] dark:text-[#E8EFEA] group-hover:text-[#1A1C1B] dark:group-hover:text-white">
                    {category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1A1C1B] dark:text-[#F0F4F2] tabular-nums">
                    {count}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#516A5F] dark:text-[#6F7A73] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#EAECEB] dark:border-[#24342D] text-[11px] text-[#516A5F] dark:text-[#8E9F97] text-center">
        Click any pillar to view filtered matching opportunities.
      </div>
    </div>
  );
};
