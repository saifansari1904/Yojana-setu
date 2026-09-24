/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit2,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { UserProfile } from '../../types/user';
import { useTranslation, PROFILE_I18N } from '../../i18n';

interface RegistrationSectionProps {
  profile: UserProfile;
  onEditSection: (tab: 'registration') => void;
}

export const RegistrationSection: React.FC<RegistrationSectionProps> = ({
  profile,
  onEditSection,
}) => {
  const { lang, getLocalizedRegistrationStatus } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const regStatus = profile.registrationStatus || (profile.isRegistered ? 'REGISTERED' : 'NOT_REGISTERED');
  const regStatusLabel = getLocalizedRegistrationStatus(regStatus);

  const isUdyam = profile.businessRegistration === 'udyam' || profile.registrationStatus === 'REGISTERED' || !!profile.isRegistered;
  const isGst = profile.businessRegistration === 'gst';
  const isTrade = profile.businessRegistration === 'local_trade';

  // Determine MSME category based on investment/turnover
  const investment = profile.totalProjectCost || profile.fundingRequired || 0;
  let msmeTier = 'Micro Enterprise';
  if (investment > 100000000) {
    msmeTier = 'Medium Enterprise';
  } else if (investment > 10000000) {
    msmeTier = 'Small Enterprise';
  }

  return (
    <div
      id="profile-registration-section"
      className="bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)]" />
            {strings.registrationTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5">
            {strings.registrationSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEditSection('registration')}
          className="text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] hover:bg-[#D9E8DF] dark:hover:bg-[var(--bg-subtle)] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{strings.editProfileBtn}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Overall Status */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider mb-1">
            {strings.registrationStatus}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {regStatus === 'REGISTERED' ? (
              <CheckCircle2 className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)]" />
            ) : (
              <HelpCircle className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {regStatusLabel}
            </span>
          </div>
        </div>

        {/* Udyam MSME */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider mb-1">
            {strings.udyam}
          </span>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                isUdyam
                  ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isUdyam ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {isUdyam ? strings.statusRegistered : strings.statusNotRegistered}
            </span>
          </div>
        </div>

        {/* GSTIN */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider mb-1">
            {strings.gst}
          </span>
          <div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                isGst
                  ? 'bg-[#D9E8DF] dark:bg-[#1A382D] text-[#14453D] dark:text-[var(--accent-green)]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {isGst ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {isGst ? strings.statusRegistered : 'Exempt / Optional'}
            </span>
          </div>
        </div>

        {/* MSME Classification */}
        <div className="p-3.5 bg-[#F9FAF9] dark:bg-[var(--bg-card)] rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[#516A5F] dark:text-[var(--text-secondary)] block uppercase tracking-wider mb-1">
            {strings.msmeCategory}
          </span>
          <span className="text-sm font-bold text-[#14453D] dark:text-[var(--accent-green)] block">
            {msmeTier}
          </span>
          <span className="text-[10px] text-[#516A5F] dark:text-[var(--text-secondary)] block">
            Composite MSMED Criteria
          </span>
        </div>
      </div>

      {/* Udyam Registration Direct Nodal Gateway */}
      <div className="p-4 rounded-xl bg-[#F4F8F5] dark:bg-[var(--bg-card)] border border-[#D9E8DF] dark:border-[#1E3E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)] shrink-0" />
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] block">
              Ministry of MSME — Official Free Udyam Portal
            </span>
            <span className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] block">
              Government registration is completely paperless, instant, and 100% free of charge.
            </span>
          </div>
        </div>

        <a
          href="https://udyamregistration.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#1E6A50] dark:hover:bg-[#15803D] text-white text-xs font-bold shrink-0 transition-colors"
        >
          <span>{strings.udyamPortal}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
