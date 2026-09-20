import React from 'react';
import { ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, FileCheck, ArrowRight } from 'lucide-react';
import type { Scheme } from '../../types/scheme';
import type { TrackedApplication } from '../../types/tracker';
import { useTranslation } from '../../i18n';
import { verifyOfficialPortalUrl } from '../../lib/application/applicationPreparation';

interface PortalHandoffSectionProps {
  scheme: Scheme;
  trackedApp?: TrackedApplication;
  canProceed: boolean;
  onOpenConfirmationModal: () => void;
}

export const PortalHandoffSection: React.FC<PortalHandoffSectionProps> = ({
  scheme,
  trackedApp,
  canProceed,
  onOpenConfirmationModal,
}) => {
  const { t } = useTranslation();
  const portalInfo = verifyOfficialPortalUrl(scheme.officialPortalUrl);
  const isApplied = trackedApp?.status === 'applied' || trackedApp?.status === 'approved';

  return (
    <div id="portal-handoff-section" className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7] dark:border-[#22332A]">
        <div>
          <h3 className="text-base font-bold text-[#1F2421] dark:text-[#F0F4F2] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0F6B4C] dark:text-[#4ADE80]" />
            {t('workspace.handoffTitle')}
          </h3>
          <p className="text-xs text-[#5A6561] dark:text-[#97A7A0] mt-1">
            {t('workspace.handoffDesc')}
          </p>
        </div>

        {portalInfo.isVerifiedGovtDomain && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('workspace.verifiedPortalBadge')}</span>
          </div>
        )}
      </div>

      {/* Advisory Notice Card */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 mb-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{t('workspace.disclaimerTitle')}</span>
        </div>
        <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
          {t('workspace.disclaimerText')}
        </p>
      </div>

      {/* Already Applied Status if confirmed */}
      {isApplied && (
        <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Application Officially Recorded</span>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {trackedApp?.appliedOn ? `Submitted on ${trackedApp.appliedOn}` : 'Recorded as applied'}
                {trackedApp?.note ? ` (${trackedApp.note})` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Portal Redirection Card */}
      <div className="p-6 rounded-2xl border border-[#E5E9E7] dark:border-[#22332A] bg-white dark:bg-[#151D19] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#5A6561] dark:text-[#97A7A0]">
              Official Government Portal Address
            </div>
            <div className="text-sm font-bold text-[#1F2421] dark:text-[#F0F4F2] mt-0.5">
              {portalInfo.domain || 'Official Ministry Portal'}
            </div>
          </div>

          {scheme.officialPortalUrl ? (
            <a
              href={scheme.officialPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#0F6B4C] hover:bg-[#0D5B41] dark:bg-[#4ADE80] dark:text-[#0E1311] dark:hover:bg-[#22C55E] transition-colors shadow-sm"
            >
              <span>{t('workspace.openOfficialPortal')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-[#5A6561] dark:text-[#97A7A0] italic">
              Official portal link not declared in dataset. Please apply via local District Industries Centre (DIC).
            </span>
          )}
        </div>

        <div className="pt-4 border-t border-[#E5E9E7] dark:border-[#22332A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#1F2421] dark:text-[#F0F4F2]">
              Did you complete your application?
            </div>
            <div className="text-[11px] text-[#5A6561] dark:text-[#97A7A0]">
              Record your submission and application reference number to maintain an accurate audit timeline.
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenConfirmationModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-[#0F6B4C] dark:border-[#4ADE80] text-[#0F6B4C] dark:text-[#4ADE80] bg-[#0F6B4C]/5 hover:bg-[#0F6B4C]/10 transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>{isApplied ? 'Update Submission Details' : t('workspace.confirmSubmissionBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
