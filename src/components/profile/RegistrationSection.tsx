/**
 * YOJANA SETU — BUSINESS REGISTRATIONS & COMPLIANCE
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Entrepreneur control center for business registrations. Two conceptual
 * areas (never mixed):
 *
 *   BUSINESS FORMALIZATION   overall posture: Formalized / Partially
 *                            Formalized / Informal / Unregistered / Unknown
 *   REGISTRATIONS & LICENSES individual records, each with its own status
 *
 * Records are saved through onSave -> saveStoredProfile, which keeps the
 * legacy registration fields derived and in sync so the matching engine,
 * eligibility engine, and every existing consumer keep working unchanged.
 * Documents are linked to the existing Document Vault by id — never copied.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  CircleDot,
  Circle,
  HelpCircle,
  AlertTriangle,
  Info,
  Building,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { UserProfile } from '../../types/user';
import type { RegistrationStatus } from '../../types/business';
import type {
  BusinessFormalizationStatus,
  BusinessRegistrationKind,
  BusinessRegistrationRecord,
} from '../../types/registration';
import { REGISTRATION_KINDS } from '../../types/registration';
import {
  normalizeRegistrationFields,
  isRegistrationRecordComplete,
  calculateRegistrationCompleteness,
} from '../../lib/registrations/registrationModel';
import { loadDocumentProgress } from '../../lib/tracker/documentProgress';
import { VAULT_SCHEME_KEY, VAULT_SYNC_EVENT } from '../../lib/documents/reusableDocuments';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { RegistrationDetailDrawer } from './RegistrationDetailDrawer';

interface RegistrationSectionProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
}

const FORMALIZATION_ORDER: BusinessFormalizationStatus[] = [
  'FORMALIZED',
  'PARTIALLY_FORMALIZED',
  'INFORMAL',
  'UNKNOWN',
];

function formalizationLabelKey(s: BusinessFormalizationStatus): string {
  switch (s) {
    case 'FORMALIZED': return 'regFormFormalized';
    case 'PARTIALLY_FORMALIZED': return 'regFormPartial';
    case 'INFORMAL': return 'regFormInformal';
    default: return 'regFormUnknown';
  }
}

function statusTone(status: RegistrationStatus): string {
  switch (status) {
    case 'REGISTERED':
      return 'text-[#1E6A50] dark:text-[var(--accent-green)]';
    case 'IN_PROCESS':
      return 'text-amber-600 dark:text-amber-400';
    default:
      return 'text-[#516A5F] dark:text-[var(--text-secondary)]';
  }
}

function StatusDot({ status }: { status: RegistrationStatus }) {
  // Icon + text: state is never communicated through color alone.
  if (status === 'REGISTERED') return <CheckCircle2 className={`w-4 h-4 ${statusTone(status)}`} aria-hidden="true" />;
  if (status === 'IN_PROCESS') return <CircleDot className={`w-4 h-4 ${statusTone(status)}`} aria-hidden="true" />;
  if (status === 'UNKNOWN') return <HelpCircle className={`w-4 h-4 ${statusTone(status)}`} aria-hidden="true" />;
  return <Circle className={`w-4 h-4 ${statusTone(status)}`} aria-hidden="true" />;
}

function statusDescKey(status: RegistrationStatus): string {
  switch (status) {
    case 'REGISTERED': return 'regDescRegistered';
    case 'IN_PROCESS': return 'regDescApplied';
    case 'NOT_REGISTERED': return 'regDescNotRegistered';
    case 'NOT_APPLICABLE': return 'regDescNotApplicable';
    default: return 'regDescUnknown';
  }
}

export const RegistrationSection: React.FC<RegistrationSectionProps> = ({ profile, onSave }) => {
  const { lang, getLocalizedRegistrationStatus } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  // Normalize once per profile change: one-time legacy migration + derived
  // legacy fields, without mutating the stored profile until the user saves.
  const normalized = useMemo(() => normalizeRegistrationFields(profile), [profile]);
  const records = useMemo(() => normalized.businessRegistrations ?? [], [normalized]);
  const formalization = normalized.businessFormalization ?? 'UNKNOWN';

  const [vaultDocIds, setVaultDocIds] = useState<string[]>([]);
  const [drawerRecord, setDrawerRecord] = useState<BusinessRegistrationRecord | null>(null);
  const [drawerIsNew, setDrawerIsNew] = useState(false);
  const [formalizationOpen, setFormalizationOpen] = useState(false);

  const refreshVaultDocs = () => {
    try {
      setVaultDocIds(loadDocumentProgress()[VAULT_SCHEME_KEY] || []);
    } catch {
      setVaultDocIds([]);
    }
  };
  useEffect(refreshVaultDocs, []);
  // Refresh when the vault changes elsewhere (e.g. the Document Vault section
  // below toggles a document while this section stays mounted), and across tabs.
  useEffect(() => {
    window.addEventListener(VAULT_SYNC_EVENT, refreshVaultDocs);
    window.addEventListener('storage', refreshVaultDocs);
    return () => {
      window.removeEventListener(VAULT_SYNC_EVENT, refreshVaultDocs);
      window.removeEventListener('storage', refreshVaultDocs);
    };
  }, []);

  const persist = (nextRecords: BusinessRegistrationRecord[], nextFormalization?: BusinessFormalizationStatus) => {
    onSave(
      normalizeRegistrationFields({
        ...profile,
        businessRegistrations: nextRecords,
        businessFormalization: nextFormalization ?? normalized.businessFormalization,
      })
    );
  };

  const kindLabel = (r: BusinessRegistrationRecord): string => {
    if (r.kind === 'other' && r.customLabel) return r.customLabel;
    const key = REGISTRATION_KINDS[r.kind].labelKey as keyof typeof strings;
    return (strings[key] as string) || r.kind;
  };

  const openNew = () => {
    setDrawerRecord({
      id: '',
      kind: 'udyam',
      status: 'REGISTERED',
      verificationStatus: 'USER_PROVIDED',
    });
    setDrawerIsNew(true);
  };
  const openExisting = (r: BusinessRegistrationRecord) => {
    setDrawerRecord(r);
    setDrawerIsNew(false);
  };
  const closeDrawer = () => {
    setDrawerRecord(null);
    refreshVaultDocs();
  };

  const handleSaveRecord = (next: BusinessRegistrationRecord) => {
    const exists = records.some((r) => r.id === next.id);
    persist(exists ? records.map((r) => (r.id === next.id ? next : r)) : [...records, next]);
    closeDrawer();
  };
  const handleDeleteRecord = (id: string) => {
    persist(records.filter((r) => r.id !== id));
    closeDrawer();
  };
  const handleOpenVault = () => {
    closeDrawer();
    requestAnimationFrame(() => {
      document.getElementById('profile-document-vault-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const isDocPrepared = (documentId: string | undefined) => !!documentId && vaultDocIds.includes(documentId);
  const completeness = useMemo(
    () => calculateRegistrationCompleteness(records, isDocPrepared),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, vaultDocIds]
  );

  const primaryActionLabel = (r: BusinessRegistrationRecord): string => {
    if (r.status === 'IN_PROCESS') return strings.regUpdateStatus;
    if (!isRegistrationRecordComplete(r)) return strings.regCompleteDetails;
    return strings.regViewDetails;
  };

  return (
    <section
      id="profile-registration-section"
      aria-labelledby="reg-center-heading"
      className="bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-xs transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] mb-5">
        <div>
          <h2 id="reg-center-heading" className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)] flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)]" />
            {strings.regCenterTitle}
          </h2>
          <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-0.5">
            {strings.regCenterSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          aria-label={strings.regAdd}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#1E6A50] dark:hover:bg-[#15803D] text-white transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{strings.regAdd}</span>
        </button>
      </div>

      {/* BUSINESS FORMALIZATION */}
      <div className="mb-6">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[var(--text-secondary)] mb-2">
          {strings.regFormalization}
        </h3>
        <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-[#F9FAF9] dark:bg-[var(--bg-inset)] border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)]">
            {formalization === 'FORMALIZED' ? (
              <CheckCircle2 className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)]" aria-hidden="true" />
            ) : formalization === 'PARTIALLY_FORMALIZED' ? (
              <CircleDot className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            ) : formalization === 'UNKNOWN' ? (
              <HelpCircle className="w-4 h-4 text-[#516A5F] dark:text-[var(--text-secondary)]" aria-hidden="true" />
            ) : (
              <Circle className="w-4 h-4 text-[#516A5F] dark:text-[var(--text-secondary)]" aria-hidden="true" />
            )}
            {strings[formalizationLabelKey(formalization) as keyof typeof strings] as string}
          </span>
          <button
            type="button"
            onClick={() => setFormalizationOpen((v) => !v)}
            aria-expanded={formalizationOpen}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" />
            {strings.regFormChange}
          </button>
        </div>
        {formalizationOpen && (
          <fieldset className="mt-2 p-3 rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)]">
            <legend className="sr-only">{strings.regFormalization}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FORMALIZATION_ORDER.map((f) => (
                <label
                  key={f}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    formalization === f
                      ? 'border-[#14453D] dark:border-[var(--accent-green)] bg-[#F0F7F2] dark:bg-[#1A382D]'
                      : 'border-[#E8EFEA] dark:border-[var(--border-subtle)] hover:bg-[#F9FAF9] dark:hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="business-formalization"
                    value={f}
                    checked={formalization === f}
                    onChange={() => {
                      persist(records, f);
                      setFormalizationOpen(false);
                    }}
                    className="w-4 h-4 accent-[#14453D] dark:accent-[#4ADE80]"
                  />
                  <span className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)]">
                    {strings[formalizationLabelKey(f) as keyof typeof strings] as string}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {/* REGISTRATIONS & LICENSES */}
      <div className="mb-6">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#516A5F] dark:text-[var(--text-secondary)] mb-2">
          {strings.regListLabel}
        </h3>

        {records.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[#D9E8DF] dark:border-[var(--border-subtle)] p-6 text-center">
            <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-[#9DB5A9] dark:text-[var(--text-secondary)]" aria-hidden="true" />
            <p className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)]">{strings.regEmptyTitle}</p>
            <p className="text-xs text-[#516A5F] dark:text-[var(--text-secondary)] mt-1 mb-4">{strings.regEmptyHint}</p>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#1E6A50] dark:hover:bg-[#15803D] text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              {strings.regAdd}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {records.map((r) => {
              const complete = isRegistrationRecordComplete(r);
              const docReady = isDocPrepared(r.documentId);
              return (
                <article
                  key={r.id}
                  aria-label={kindLabel(r)}
                  className="flex flex-col p-4 rounded-xl bg-[#F9FAF9] dark:bg-[var(--bg-inset)] border border-[#E8EFEA] dark:border-[var(--border-subtle)]"
                >
                  <h4 className="text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] break-words">
                    {kindLabel(r)}
                  </h4>

                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold">
                    <StatusDot status={r.status} />
                    <span className={statusTone(r.status)}>{getLocalizedRegistrationStatus(r.status)}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)]">
                    {strings[statusDescKey(r.status) as keyof typeof strings] as string}
                  </p>

                  {/* Identifier */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {r.status === 'REGISTERED' && (
                      r.registrationNumber ? (
                        <p className="text-[#1F2421] dark:text-[var(--text-main)]">
                          <span className="font-semibold text-[#516A5F] dark:text-[var(--text-secondary)]">{strings.regNumber}: </span>
                          <span className="font-mono break-all">{r.registrationNumber}</span>
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          {strings.regNumberMissing}
                        </p>
                      )
                    )}
                    {r.status === 'IN_PROCESS' && r.applicationReference && (
                      <p className="text-[#1F2421] dark:text-[var(--text-main)]">
                        <span className="font-semibold text-[#516A5F] dark:text-[var(--text-secondary)]">{strings.regAppRef}: </span>
                        <span className="font-mono break-all">{r.applicationReference}</span>
                      </p>
                    )}
                    {r.status === 'IN_PROCESS' && r.applicationDate && (
                      <p className="text-[#516A5F] dark:text-[var(--text-secondary)]">
                        {strings.regFieldAppDate}: {r.applicationDate}
                      </p>
                    )}
                  </div>

                  {/* Document availability (from the vault — never duplicated) */}
                  {(r.status === 'REGISTERED' || r.status === 'IN_PROCESS') && (
                    <p className={`mt-2 flex items-center gap-1.5 text-[11px] font-semibold ${docReady ? 'text-[#1E6A50] dark:text-[var(--accent-green)]' : 'text-[#516A5F] dark:text-[var(--text-secondary)]'}`}>
                      {docReady ? (
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {docReady ? strings.regDocAvailable : strings.regDocMissing}
                    </p>
                  )}

                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => openExisting(r)}
                    className={`mt-3 w-full px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      complete
                        ? 'text-[#14453D] dark:text-[var(--accent-green)] hover:bg-[#D9E8DF] dark:hover:bg-[var(--bg-subtle)]'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-950/60'
                    }`}
                  >
                    {primaryActionLabel(r)}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* REGISTRATION PROFILE completeness — only from actual stored data */}
      {records.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-[#F9FAF9] dark:bg-[var(--bg-inset)] border border-[#E8EFEA] dark:border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {strings.regProfileLabel}
            </h3>
            <span className="text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)]">
              {completeness.percentage}% {strings.regCompleteWord}
            </span>
          </div>
          <div
            className="h-2 rounded-full bg-[#E8EFEA] dark:bg-[var(--bg-subtle)] overflow-hidden"
            role="progressbar"
            aria-valuenow={completeness.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={strings.regProfileLabel}
          >
            <div
              className="h-full rounded-full bg-[#1E6A50] dark:bg-[var(--accent-green)] transition-[width] duration-500"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)]">
            <span><strong className="text-[#1F2421] dark:text-[var(--text-main)]">{completeness.totalRecords}</strong> {strings.regStatRecorded}</span>
            <span><strong className="text-[#1F2421] dark:text-[var(--text-main)]">{completeness.documentsAvailable}</strong> {strings.regStatDocs}</span>
            {completeness.missingDetails > 0 && (
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                <strong>{completeness.missingDetails}</strong> {strings.regStatMissing}
              </span>
            )}
          </div>
        </div>
      )}

      {/* How this data is used — factual, no over-claiming */}
      <details className="mb-5 group">
        <summary className="flex items-center gap-1.5 text-xs font-bold text-[#516A5F] dark:text-[var(--text-secondary)] cursor-pointer hover:text-[#14453D] dark:hover:text-[var(--accent-green)] transition-colors list-none">
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
          {strings.regHowUsedTitle}
        </summary>
        <p className="mt-2 text-[11px] leading-relaxed text-[#516A5F] dark:text-[var(--text-secondary)] pl-5">
          {strings.regHowUsedText}
        </p>
      </details>

      {/* Udyam Registration Direct Nodal Gateway (kept from previous section) */}
      <div className="p-4 rounded-xl bg-[#F4F8F5] dark:bg-[var(--bg-card)] border border-[#D9E8DF] dark:border-[#1E3E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)] shrink-0" />
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#1F2421] dark:text-[var(--text-main)] block">
              {strings.regPortalTitle}
            </span>
            <span className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)] block">
              {strings.regPortalNote}
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

      {/* Detail drawer */}
      <RegistrationDetailDrawer
        record={drawerRecord}
        isNew={drawerIsNew}
        onClose={closeDrawer}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        vaultDocIds={vaultDocIds}
        onOpenVault={handleOpenVault}
      />
    </section>
  );
};
