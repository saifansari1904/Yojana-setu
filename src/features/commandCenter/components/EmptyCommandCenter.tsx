/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n';
import { ArrowFillButton } from '../../../components/ui';
import { Compass, ShieldCheck, Sparkles, Building, Layers } from 'lucide-react';

interface EmptyCommandCenterProps {
  onStartProfile: () => void;
  id?: string;
}

export const EmptyCommandCenter: React.FC<EmptyCommandCenterProps> = ({
  onStartProfile,
  id = 'empty-command-center',
}) => {
  const { t } = useTranslation();

  return (
    <div id={id} className="max-w-4xl mx-auto py-10 sm:py-16 px-4">
      <div className="yj-card yj-card-lg p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#D9E8DF] dark:bg-[#1A382D] border border-[#D9E8DF] dark:border-[#22503E] flex items-center justify-center text-[#1E6A50] dark:text-[var(--accent-green)] mx-auto mb-6">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#14453D] dark:text-[var(--accent-green)] bg-[#D9E8DF] dark:bg-[#1A382D] px-3 py-1 rounded-full border border-[#C1E2D0] dark:border-[#22503E] inline-block mb-3">
          YOJANA SETU
        </span>

        <h1 className="text-xl sm:text-4xl font-bold text-[#1A1C1B] dark:text-[var(--text-main)] tracking-tight mb-4">
          {t('welcomeTitle')}
        </h1>

        <p className="text-base sm:text-lg text-[#516A5F] dark:text-[var(--text-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
          {t('welcomeSubtitle')}
        </p>

        {/* Feature Highlights - STRICTLY NO FAKE NUMBERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
          <div className="p-4 rounded-xl bg-[#FAFAF9] dark:bg-[var(--bg-card)] border border-[#EAECEB] dark:border-[var(--border-subtle)]">
            <Sparkles className="w-5 h-5 text-[#92610A] dark:text-[var(--text-accent)] mb-2" />
            <h4 className="text-xs font-bold text-[#1A1C1B] dark:text-[var(--text-main)] uppercase tracking-wide">
              Deterministic Matching
            </h4>
            <p className="text-xs text-[#516A5F] dark:text-[var(--text-tertiary)] mt-1">
              Statutory 5-vector evaluation with zero arbitrary guessing.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF9] dark:bg-[var(--bg-card)] border border-[#EAECEB] dark:border-[var(--border-subtle)]">
            <Layers className="w-5 h-5 text-sky-600 mb-2" />
            <h4 className="text-xs font-bold text-[#1A1C1B] dark:text-[var(--text-main)] uppercase tracking-wide">
              Support Pathways
            </h4>
            <p className="text-xs text-[#516A5F] dark:text-[var(--text-tertiary)] mt-1">
              Funding, registration, skills, and market access structured by stage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF9] dark:bg-[var(--bg-card)] border border-[#EAECEB] dark:border-[var(--border-subtle)]">
            <ShieldCheck className="w-5 h-5 text-[#1E6A50] dark:text-[var(--accent-green)] mb-2" />
            <h4 className="text-xs font-bold text-[#1A1C1B] dark:text-[var(--text-main)] uppercase tracking-wide">
              Verified Trust
            </h4>
            <p className="text-xs text-[#516A5F] dark:text-[var(--text-tertiary)] mt-1">
              Direct connection to official .gov.in and nodal portals.
            </p>
          </div>
        </div>

        <div>
          <ArrowFillButton
            id="build-profile-main-btn"
            variant="primary"
            onClick={onStartProfile}
            className="text-base px-8 py-3.5"
          >
            {t('buildProfileBtn')}
          </ArrowFillButton>
        </div>
      </div>
    </div>
  );
};
