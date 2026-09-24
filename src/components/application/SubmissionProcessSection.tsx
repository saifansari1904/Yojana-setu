import React from 'react';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';
import { Compass, Globe, Building2, Phone, CheckCircle2, ChevronRight } from 'lucide-react';
import type { Scheme } from '../../types/scheme';
import { useTranslation } from '../../i18n';
import { getStepByStepApplicationGuide } from '../../lib/application/applicationPreparation';

interface SubmissionProcessSectionProps {
  scheme: Scheme;
}

export const SubmissionProcessSection: React.FC<SubmissionProcessSectionProps> = ({ scheme }) => {
  const { t, lang } = useTranslation();
  const instructions = getStepByStepApplicationGuide(scheme);
  const mode = scheme.applicationMode || 'ONLINE';

  return (
    <div id="submission-process-section" className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7] dark:border-[var(--border-subtle)]">
        <div>
          <h3 className="text-base font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {t('workspace.processTitle')}
          </h3>
          <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1">
            {t('workspace.processDesc')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Globe className="w-4 h-4" />
          <span>{mode} Mode</span>
        </div>
      </div>

      {/* Meta Bar: Ministry, Agency, Helpdesk */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-[#FAFAF9] dark:bg-[#1d2822]/40">
          <span className="text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)] block mb-1">
            Sponsoring Ministry
          </span>
          <span className="text-xs font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
            {scheme.sponsoringMinistry}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-[#FAFAF9] dark:bg-[#1d2822]/40">
          <span className="text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)] block mb-1">
            {t('workspace.nodalAgencyLabel')}
          </span>
          <span className="text-xs font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
            {scheme.department || scheme.intelligence?.application?.nodalAgency || scheme.sponsoringMinistry}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-[#FAFAF9] dark:bg-[#1d2822]/40">
          <span className="text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)] block mb-1">
            {t('workspace.helplineLabel')}
          </span>
          <span className="text-xs font-semibold text-[#1E6A50] dark:text-[var(--accent-green)] flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {scheme.intelligence?.application?.helplineInformation || 'National MSME Helpline: 1800-180-6763'}
          </span>
        </div>
      </div>

      {/* Step by step timeline */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A6561] dark:text-[var(--text-secondary)]">
          {t('workspace.stepByStepGuide')}
        </h4>

        <div className="space-y-3">
          {instructions.map((inst) => (
            <div
              key={inst.stepNumber}
              className="p-4 rounded-xl border border-[#E5E9E7] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] flex items-start gap-4"
            >
              <div className="w-7 h-7 rounded-full bg-[#1E6A50] dark:bg-[var(--accent-green)] text-white dark:text-[#0E1311] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {inst.stepNumber}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-semibold text-[#1F2421] dark:text-[var(--text-main)]">
                    {resolveLocalizedPair(inst.titleEn, inst.titleHi, lang)}
                  </h5>
                  {inst.agency && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F4F7F5] dark:bg-[var(--bg-raised)] text-[#5A6561] dark:text-[var(--text-secondary)]">
                      {inst.agency}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5A6561] dark:text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {resolveLocalizedPair(inst.descEn, inst.descHi, lang)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
