import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, FileCheck2, Scale, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { WorkspaceReadiness } from '../../types/application';
import { useTranslation } from '../../i18n';
import { AnimatedScore } from '../ui/AnimatedScore';

interface PreparationReadinessHeaderProps {
  readiness: WorkspaceReadiness;
  onSelectPillar?: (pillarKey: string) => void;
}

export const PreparationReadinessHeader: React.FC<PreparationReadinessHeaderProps> = ({
  readiness,
  onSelectPillar,
}) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const getBadgeStyle = (state: WorkspaceReadiness['state']) => {
    switch (state) {
      case 'READY_TO_APPLY':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'READY_TO_REVIEW':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'PARTIALLY_READY':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'NOT_READY':
      default:
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
  };

  const getPillarIcon = (key: string) => {
    switch (key) {
      case 'eligibility':
        return <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'documents':
        return <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'financial':
        return <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'process':
      default:
        return <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getPillarStateColor = (state: string) => {
    switch (state) {
      case 'SATISFIED':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60';
      case 'PARTIAL':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60';
      case 'BLOCKED':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60';
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <section
      id="workspace-readiness-header"
      className="p-6 rounded-2xl bg-white dark:bg-[#151D19] border border-[#E5E9E7] dark:border-[#22332A] shadow-sm mb-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E5E9E7] dark:border-[#22332A]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B4C] dark:text-[#4ADE80]">
              {t('workspace.readinessTitle')}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
                readiness.state
              )}`}
            >
              {readiness.state === 'READY_TO_APPLY' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : readiness.state === 'NOT_READY' ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : null}
              {lang === 'hi' ? readiness.labelHi : readiness.labelEn}
            </span>
          </div>
          <p className="text-sm text-[#5A6561] dark:text-[#97A7A0] max-w-2xl leading-relaxed">
            {lang === 'hi' ? readiness.summaryHi : readiness.summaryEn}
          </p>
        </div>

        {/* Readiness Score Gauge */}
        <div className="flex items-center gap-4 shrink-0 bg-[#F4F7F5] dark:bg-[#1A2520] px-5 py-3 rounded-xl border border-[#E0E6E2] dark:border-[#26372E]">
          <div className="text-right">
            <div className="text-xs font-medium text-[#5A6561] dark:text-[#97A7A0]">
              {t('workspace.overallReadiness')}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {readiness.canProceedToOfficialPortal ? 'Statutory Cleared' : 'Action Required'}
            </div>
          </div>
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white dark:bg-[#151D19] border-2 border-emerald-500 shadow-sm">
            <AnimatedScore
              value={readiness.overallScore}
              className="text-base font-bold text-[#1F2421] dark:text-[#F0F4F2]"
            />
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6">
        {readiness.pillars.map((pillar) => (
          <button
            key={pillar.key}
            type="button"
            onClick={() => onSelectPillar?.(pillar.key)}
            className="flex flex-col text-left p-4 rounded-xl border border-[#E5E9E7] dark:border-[#22332A] bg-[#FAFAF9] dark:bg-[#1A2520]/60 hover:border-[#0F6B4C]/40 dark:hover:border-[#4ADE80]/40 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white dark:bg-[#151D19] border border-[#E0E6E2] dark:border-[#26372E]">
                  {getPillarIcon(pillar.key)}
                </span>
                <span className="text-xs font-bold text-[#1F2421] dark:text-[#F0F4F2]">
                  {lang === 'hi' ? pillar.labelHi : pillar.labelEn}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPillarStateColor(
                  pillar.state
                )}`}
              >
                {pillar.score}%
              </span>
            </div>

            <p className="text-xs text-[#5A6561] dark:text-[#97A7A0] leading-snug line-clamp-2">
              {lang === 'hi' ? pillar.summaryHi : pillar.summaryEn}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
