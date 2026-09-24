import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Scale,
  FileCheck2,
  IndianRupee,
  Compass,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import type { MatchResult } from '../../types/matching';
import type { UserProfile } from '../../types/user';
import type { TrackedApplication } from '../../types/tracker';
import type { PreparationStepKey, CitizenSubmissionConfirmation } from '../../types/application';
import { useTranslation } from '../../i18n';
import {
  deriveApplicationWorkspace,
  confirmCitizenSubmission,
} from '../../lib/application/applicationPreparation';
import {
  loadDocumentProgress,
  saveDocumentProgress,
  toggleDocumentPrepared,
  getPreparedDocIds,
} from '../../lib/tracker/documentProgress';
import { PreparationReadinessHeader } from './PreparationReadinessHeader';
import { EligibilityAuditSection } from './EligibilityAuditSection';
import { DocumentDossierSection } from './DocumentDossierSection';
import { FinancialAlignmentSection } from './FinancialAlignmentSection';
import { SubmissionProcessSection } from './SubmissionProcessSection';
import { PortalHandoffSection } from './PortalHandoffSection';
import { CitizenConfirmationModal } from './CitizenConfirmationModal';
import { BookmarkButton, VerificationBadge } from '../ui';
import { deriveSchemeTrustProfile } from '../../lib/data/trustEngine';

interface ApplicationWorkspaceScreenProps {
  matchResult: MatchResult;
  userProfile: UserProfile;
  applications: TrackedApplication[];
  savedSchemeIds: Set<string>;
  onToggleSaveScheme: (schemeId: string) => void;
  onBack: () => void;
  onOpenTracker?: () => void;
  onUpdateApplications: (updated: TrackedApplication[]) => void;
}

export const ApplicationWorkspaceScreen: React.FC<ApplicationWorkspaceScreenProps> = ({
  matchResult,
  userProfile,
  applications,
  savedSchemeIds,
  onToggleSaveScheme,
  onBack,
  onOpenTracker,
  onUpdateApplications,
}) => {
  const { t, lang } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<PreparationStepKey>('ELIGIBILITY_AUDIT');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Document progress state
  const [docProgress, setDocProgress] = useState(() => loadDocumentProgress());
  const preparedDocIds = getPreparedDocIds(docProgress, matchResult.scheme.id);

  const trackedApp = applications.find((a) => a.schemeId === matchResult.scheme.id);
  const isSaved = savedSchemeIds.has(matchResult.scheme.id);

  // Derive workspace representation
  const workspace = deriveApplicationWorkspace({
    scheme: matchResult.scheme,
    userProfile,
    matchResult,
    preparedDocIds,
    trackedApp,
    lang,
  });

  const trustProfile = deriveSchemeTrustProfile(matchResult.scheme);

  const handleToggleDocument = (docId: string) => {
    const updated = toggleDocumentPrepared(docProgress, matchResult.scheme.id, docId);
    saveDocumentProgress(updated);
    setDocProgress(updated);
  };

  const handleConfirmCitizenSubmission = (confirmation: CitizenSubmissionConfirmation) => {
    const result = confirmCitizenSubmission(applications, confirmation);
    onUpdateApplications(result.updatedApplications);
    setToastMessage(t('workspace.statusAppliedSuccess'));
    setTimeout(() => setToastMessage(null), 5000);
  };

  const tabs: { key: PreparationStepKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'ELIGIBILITY_AUDIT',
      label: t('workspace.stepEligibility'),
      icon: <Scale className="w-4 h-4" />,
    },
    {
      key: 'DOCUMENT_CHECKLIST',
      label: t('workspace.stepDocuments'),
      icon: <FileCheck2 className="w-4 h-4" />,
    },
    {
      key: 'FINANCIAL_ALIGNMENT',
      label: t('workspace.stepFinancial'),
      icon: <IndianRupee className="w-4 h-4" />,
    },
    {
      key: 'SUBMISSION_PROCESS',
      label: t('workspace.stepProcess'),
      icon: <Compass className="w-4 h-4" />,
    },
    {
      key: 'PORTAL_HANDOFF',
      label: t('workspace.stepHandoff'),
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5A6561] dark:text-[var(--text-secondary)] hover:text-[#1F2421] dark:hover:text-[var(--text-main)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('workspace.backBtn')}</span>
        </button>

        <div className="flex items-center gap-3">
          {onOpenTracker && (
            <button
              type="button"
              onClick={onOpenTracker}
              className="text-xs font-semibold text-[#1E6A50] dark:text-[var(--accent-green)] hover:underline"
            >
              {t('workspace.openTrackerBtn')}
            </button>
          )}
          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onToggleSaveScheme(matchResult.scheme.id)}
            schemeName={matchResult.scheme.name}
          />
        </div>
      </div>

      {/* Scheme Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[#E5E9E7] dark:border-[var(--border-subtle)] shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1E6A50]/10 text-[#1E6A50] dark:text-[var(--accent-green)]">
            {t('workspace.badge')}
          </span>
          <VerificationBadge
            tier={
              trustProfile.verification.status === 'VERIFIED'
                ? 'verified'
                : trustProfile.verification.status === 'PARTIALLY_VERIFIED'
                ? 'partially-verified'
                : 'in-review'
            }
          />
          <span className="text-[11px] text-[#5A6561] dark:text-[var(--text-secondary)] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {matchResult.scheme.sponsoringMinistry}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#1F2421] dark:text-[var(--text-main)]">
          {matchResult.scheme.name}
        </h1>

        <p className="text-xs sm:text-sm text-[#5A6561] dark:text-[var(--text-secondary)] mt-1 max-w-3xl leading-relaxed">
          {t('workspace.subtitle')}
        </p>
      </div>

      {/* Readiness Header with 4 Pillars */}
      <PreparationReadinessHeader
        readiness={workspace.readiness}
        onSelectPillar={(pillarKey) => {
          if (pillarKey === 'eligibility') setActiveTab('ELIGIBILITY_AUDIT');
          else if (pillarKey === 'documents') setActiveTab('DOCUMENT_CHECKLIST');
          else if (pillarKey === 'financial') setActiveTab('FINANCIAL_ALIGNMENT');
          else if (pillarKey === 'process') setActiveTab('SUBMISSION_PROCESS');
        }}
      />

      {/* Navigation Tabs / Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E9E7] dark:border-[var(--border-subtle)] scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#1E6A50] text-white dark:bg-[var(--accent-green)] dark:text-[#0E1311] shadow-xs'
                  : 'text-[#5A6561] dark:text-[var(--text-secondary)] hover:text-[#1F2421] dark:hover:text-[var(--text-main)] hover:bg-[#F4F7F5] dark:hover:bg-[var(--bg-raised)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-[#E5E9E7] dark:border-[var(--border-subtle)] shadow-xs">
        {activeTab === 'ELIGIBILITY_AUDIT' && (
          <EligibilityAuditSection matchResult={matchResult} userProfile={userProfile} />
        )}

        {activeTab === 'DOCUMENT_CHECKLIST' && (
          <DocumentDossierSection
            scheme={matchResult.scheme}
            preparedDocIds={preparedDocIds}
            onToggleDocument={handleToggleDocument}
          />
        )}

        {activeTab === 'FINANCIAL_ALIGNMENT' && (
          <FinancialAlignmentSection scheme={matchResult.scheme} userProfile={userProfile} />
        )}

        {activeTab === 'SUBMISSION_PROCESS' && (
          <SubmissionProcessSection scheme={matchResult.scheme} />
        )}

        {activeTab === 'PORTAL_HANDOFF' && (
          <PortalHandoffSection
            scheme={matchResult.scheme}
            trackedApp={trackedApp}
            canProceed={workspace.readiness.canProceedToOfficialPortal}
            onOpenConfirmationModal={() => setIsConfirmationModalOpen(true)}
          />
        )}
      </div>

      {/* Citizen Confirmation Modal */}
      <CitizenConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        schemeId={matchResult.scheme.id}
        schemeName={matchResult.scheme.name}
        portalDomain={workspace.officialProcess.portalDomain}
        onConfirm={handleConfirmCitizenSubmission}
      />
    </div>
  );
};
