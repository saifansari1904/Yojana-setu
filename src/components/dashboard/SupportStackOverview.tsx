import React from 'react';
import {
  IndianRupee,
  FileCheck2,
  GraduationCap,
  Building2,
  ShoppingBag,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { SupportDashboardSummary, SupportCategorySummary } from '../../types/commandCenter';
import { AnimatedCounter } from '../../animations/AnimatedCounter';

interface SupportStackOverviewProps {
  summary: SupportDashboardSummary;
  onSelectCategory?: (categoryId: string) => void;
  onExploreAll?: () => void;
  isHi?: boolean;
}

export const SupportStackOverview: React.FC<SupportStackOverviewProps> = ({
  summary,
  onSelectCategory,
  onExploreAll,
  isHi = false,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'IndianRupee':
        return IndianRupee;
      case 'FileCheck2':
        return FileCheck2;
      case 'GraduationCap':
        return GraduationCap;
      case 'Building2':
        return Building2;
      case 'ShoppingBag':
        return ShoppingBag;
      default:
        return Layers;
    }
  };

  return (
    <section
      id="support-stack-overview"
      className="bg-white dark:bg-[var(--bg-raised)] border border-[#E3ECE7] dark:border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#EAF5EF] dark:bg-[var(--bg-subtle)] text-[#0F6B4C] dark:text-[var(--accent-green)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isHi ? 'समग्र सहायता स्टैक' : 'Holistic Support Stack'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHi
                ? 'उद्यम के प्रमुख परिचालन स्तंभों में उपलब्ध सरकारी सहायता'
                : 'Sovereign assistance mapped across operational enterprise pillars'}
            </p>
          </div>
        </div>

        {onExploreAll && (
          <button
            id="view-all-support-schemes"
            onClick={onExploreAll}
            className="text-xs font-semibold text-[#0F6B4C] dark:text-[var(--accent-green)] hover:underline px-2 py-1 min-h-[44px] flex items-center gap-1"
          >
            <span>{isHi ? 'सभी योजनाएं देखें' : 'View All Schemes'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 5-Pillar Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summary.categories.map((category) => {
          const Icon = getIcon(category.iconName);
          const hasSchemes = category.count > 0;

          return (
            <button
              key={category.id}
              id={`support-pill-${category.id}`}
              onClick={() => onSelectCategory && onSelectCategory(category.id)}
              disabled={!hasSchemes && !onSelectCategory}
              className={`text-left p-3.5 rounded-lg border transition-all flex flex-col justify-between gap-2 min-h-[44px] ${
                hasSchemes
                  ? 'bg-[#F9FCFA] dark:bg-[var(--bg-raised)] border-[#D8E8DE] dark:border-[#22382D] hover:border-[#0F6B4C] dark:hover:border-[var(--accent-green)] cursor-pointer'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-2 rounded-md ${
                    hasSchemes
                      ? 'bg-[#E5F3EB] dark:bg-[var(--bg-subtle)] text-[#0F6B4C] dark:text-[var(--accent-green)]'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    hasSchemes
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <AnimatedCounter value={category.count} />
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {isHi ? category.nameHi : category.nameEn}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {category.count} {isHi ? 'योजनाएं' : 'schemes'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
