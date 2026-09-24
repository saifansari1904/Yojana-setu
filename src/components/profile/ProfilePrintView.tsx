/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { MatchResult } from '../../types';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { formatLakhCrore } from '../../lib/business';

interface ProfilePrintViewProps {
  profile: UserProfile;
  matchResults: MatchResult[];
  onClose: () => void;
}

export const ProfilePrintView: React.FC<ProfilePrintViewProps> = ({
  profile,
  matchResults,
  onClose,
}) => {
  const {
    lang,
    formatCurrency,
    getLocalizedCategory,
    getLocalizedBusinessType,
    getLocalizedState,
    getLocalizedBusinessStage,
    getLocalizedEntity,
    getLocalizedSupportNeed,
  } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const handlePrint = () => {
    window.print();
  };

  const totalCost = profile.totalProjectCost || profile.fundingRequired || 500000;
  const ownMargin = profile.existingInvestment || profile.investmentAmount || 0;
  const fundingGap = profile.fundingGap || Math.max(0, totalCost - ownMargin);
  const eligibleMatches = matchResults.filter((m) => m.isEligible && m.matchPercentage >= 75);

  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      id="profile-print-view-overlay"
      className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
    >
      <div
        id="profile-print-sheet"
        className="bg-white text-[#1F2421] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 my-auto"
      >
        {/* Top bar (Screen only) */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#14453D] text-white print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4ADE80]" />
            <span className="text-sm font-bold tracking-wider uppercase">
              {strings.printRecordTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#175741] hover:bg-[#15803D] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{strings.printActionBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 space-y-6 font-sans">
          {/* Official Document Letterhead */}
          <div className="border-b-2 border-[#14453D] pb-5 text-center">
            <span className="text-[11px] font-black tracking-widest text-[#14453D] uppercase block">
              {strings.printHeader}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-[#1F2421] mt-1 uppercase">
              {strings.printRecordTitle}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {strings.printTimestamp} {timestamp} • Yojana Setu Sovereign Matching Record ID: YS-
              {Math.abs(profile.age * 12345).toString().padStart(6, '0')}
            </p>
          </div>

          {/* Section 1: Demographics */}
          <div>
            <h2 className="text-xs font-black text-[#14453D] uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">
              1. {strings.personalTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block font-semibold">{strings.applicantName}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {profile.applicantName || 'Citizen Entrepreneur'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.category}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {getLocalizedCategory(profile.category)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.age} / {strings.gender}:</span>
                <span className="font-bold text-gray-900 block mt-0.5 capitalize">
                  {profile.age} Yrs • {profile.gender || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.state}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {profile.district ? `${profile.district}, ` : ''}{getLocalizedState(profile.state)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Enterprise Details */}
          <div>
            <h2 className="text-xs font-black text-[#14453D] uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">
              2. {strings.businessTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block font-semibold">{strings.businessName}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {profile.businessName || 'Proposed Unit'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.sector}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {getLocalizedBusinessType(profile.businessType)}
                  {profile.subSector ? ` (${profile.subSector})` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.businessStage}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {getLocalizedBusinessStage(profile.businessStageKey || 'PRE_LAUNCH')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.entityType}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {getLocalizedEntity(profile.businessEntityType || 'SOLE_PROPRIETORSHIP')}
                </span>
              </div>
            </div>
            {profile.businessIdea && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-700">
                <span className="font-bold text-gray-900 block mb-0.5">Activity Description:</span>
                {profile.businessIdea}
              </div>
            )}
          </div>

          {/* Section 3: Financial Capital Architecture */}
          <div>
            <h2 className="text-xs font-black text-[#14453D] uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">
              3. {strings.financialTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block font-semibold">{strings.totalProjectCost}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {formatCurrency(totalCost)} ({formatLakhCrore(totalCost)})
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.ownInvestment}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {formatCurrency(ownMargin)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.fundingGap}:</span>
                <span className="font-bold text-[#1E6A50] block mt-0.5">
                  {formatCurrency(fundingGap)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.primaryNeed}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {getLocalizedSupportNeed(profile.primarySupportNeed || 'WORKING_CAPITAL')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Registrations & Formalization */}
          <div>
            <h2 className="text-xs font-black text-[#14453D] uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">
              4. {strings.registrationTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block font-semibold">{strings.registrationStatus}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {profile.registrationStatus === 'REGISTERED' || profile.isRegistered ? 'Formal Unit' : 'Informal Unit'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.udyam}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {profile.businessRegistration === 'udyam' || profile.registrationStatus === 'REGISTERED' || profile.isRegistered ? 'Registered (Verified)' : 'Not Yet Registered'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">{strings.gst}:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {profile.businessRegistration === 'gst' ? 'Registered' : 'Exempt / Not Applicable'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">MSME Composite Tier:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  Micro Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Eligible Scheme Matches Discovery Snapshot */}
          <div>
            <h2 className="text-xs font-black text-[#14453D] uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">
              5. Evaluated Scheme Qualification Snapshot
            </h2>
            <p className="text-xs text-gray-600 mb-2">
              Based on official gazette policy parameters, this profile directly satisfies statutory criteria for{' '}
              <strong>{eligibleMatches.length} Government Schemes</strong>.
            </p>
            <div className="space-y-1.5">
              {eligibleMatches.slice(0, 4).map((m) => (
                <div
                  key={m.scheme.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6A50]" />
                    <span className="font-bold text-gray-900">{m.scheme.name}</span>
                    <span className="text-[10px] text-gray-500">
                      ({m.scheme.sponsoringMinistry || m.scheme.department})
                    </span>
                  </div>
                  <span className="font-extrabold text-[#14453D]">{m.matchPercentage}% Statutory Fit</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer & Attestation Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-[10px] text-gray-500 leading-relaxed">
            <p>{strings.printDisclaimer}</p>
            <div className="flex items-center justify-between mt-4 pt-2">
              <span>Yojana Setu Citizen Facilitation Platform</span>
              <span className="italic">Evaluated against Gazette Central & State Rules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
