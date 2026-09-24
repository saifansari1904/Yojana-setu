/**
 * YOJANA SETU — REGISTRATION DETAIL DRAWER
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * View / edit a single BusinessRegistrationRecord. Fields appear
 * conditionally based on status:
 *   REGISTERED  -> number, date, issuing authority, document, notes
 *   IN_PROCESS  -> application reference, application date, authority, document, notes
 *   otherwise   -> notes only (no number field for NOT_REGISTERED)
 *
 * Documents are LINKED to the existing Document Vault by id — the vault
 * remains the single document store. Verification status is display-only:
 * user input is never marked as government verified.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, CheckCircle2, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import type { RegistrationStatus } from '../../types/business';
import type {
  BusinessRegistrationKind,
  BusinessRegistrationRecord,
} from '../../types/registration';
import { REGISTRATION_KINDS, REGISTRATION_KIND_ORDER } from '../../types/registration';
import { CORE_REUSABLE_DOCUMENTS } from '../../lib/documents/reusableDocuments';
import { useTranslation, PROFILE_I18N } from '../../i18n';
import { resolveLocalizedPair } from '../../i18n/resolveLocalized';

interface RegistrationDetailDrawerProps {
  /** null = closed */
  record: BusinessRegistrationRecord | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (record: BusinessRegistrationRecord) => void;
  onDelete: (id: string) => void;
  /** Prepared document ids from the Document Vault. */
  vaultDocIds: string[];
  onOpenVault: () => void;
}

const STATUS_ORDER: RegistrationStatus[] = ['REGISTERED', 'IN_PROCESS', 'NOT_REGISTERED', 'NOT_APPLICABLE', 'UNKNOWN'];

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-inset)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] dark:focus:ring-[var(--accent-green)] outline-none';
const labelClass =
  'text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1';

function newId(kind: BusinessRegistrationKind): string {
  return `reg_${kind}_${Math.random().toString(36).slice(2, 9)}`;
}

export const RegistrationDetailDrawer: React.FC<RegistrationDetailDrawerProps> = ({
  record,
  isNew,
  onClose,
  onSave,
  onDelete,
  vaultDocIds,
  onOpenVault,
}) => {
  const { lang, getLocalizedRegistrationStatus } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  const [kind, setKind] = useState<BusinessRegistrationKind>('udyam');
  const [customLabel, setCustomLabel] = useState('');
  const [status, setStatus] = useState<RegistrationStatus>('REGISTERED');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [applicationReference, setApplicationReference] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [notes, setNotes] = useState('');

  // Seed form from the record being edited (or defaults for a new one).
  useEffect(() => {
    if (!record) return;
    setKind(record.kind);
    setCustomLabel(record.customLabel || '');
    setStatus(record.status);
    setRegistrationNumber(record.registrationNumber || '');
    setApplicationReference(record.applicationReference || '');
    setRegistrationDate(record.registrationDate || '');
    setApplicationDate(record.applicationDate || '');
    setIssuingAuthority(record.issuingAuthority || '');
    setDocumentId(record.documentId || REGISTRATION_KINDS[record.kind]?.defaultDocumentId || '');
    setNotes(record.notes || '');
    // Focus first field for keyboard users when the drawer opens.
    const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [record]);

  // Escape closes.
  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [record, onClose]);

  if (!record) return null;

  const kindLabel = (k: BusinessRegistrationKind): string => {
    const key = REGISTRATION_KINDS[k].labelKey as keyof typeof strings;
    return (strings[key] as string) || k;
  };

  const handleSave = () => {
    const clean = (v: string) => (v.trim() ? v.trim() : undefined);
    const next: BusinessRegistrationRecord = {
      id: isNew ? newId(kind) : record.id,
      kind,
      customLabel: kind === 'other' ? clean(customLabel) : undefined,
      status,
      // Preserve any existing verification status (e.g. a future externally
      // verified record); only default new/unknown records to USER_PROVIDED.
      verificationStatus: record.verificationStatus ?? 'USER_PROVIDED',
      updatedAt: new Date().toISOString(),
    };
    if (status === 'REGISTERED') {
      next.registrationNumber = clean(registrationNumber);
      next.registrationDate = registrationDate || undefined;
      next.issuingAuthority = clean(issuingAuthority);
      next.documentId = documentId || undefined;
      next.notes = clean(notes);
    } else if (status === 'IN_PROCESS') {
      next.applicationReference = clean(applicationReference);
      next.applicationDate = applicationDate || undefined;
      next.issuingAuthority = clean(issuingAuthority);
      next.documentId = documentId || undefined;
      next.notes = clean(notes);
    } else {
      // NOT_REGISTERED / NOT_APPLICABLE / UNKNOWN carry no identifiers.
      next.notes = clean(notes);
    }
    onSave(next);
  };

  const handleDelete = () => {
    if (window.confirm(strings.regDeleteConfirm)) onDelete(record.id);
  };

  const verificationLabel =
    record.verificationStatus === 'USER_PROVIDED' ? strings.regSrcUserProvided : strings.regSrcUnknown;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="reg-drawer-title">
      <div
        className="absolute inset-0 bg-black/60 dark:bg-[var(--overlay)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[var(--bg-card)] border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="reg-drawer-title" className="text-base font-bold text-[#1F2421] dark:text-[var(--text-main)]">
            {strings.regDrawerTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.cancel}
            className="p-2 rounded-lg text-[#516A5F] dark:text-[var(--text-secondary)] hover:bg-[#F0F4F1] dark:hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Registration type */}
          <div>
            <label htmlFor="reg-kind" className={labelClass}>{strings.regFieldType}</label>
            <select
              id="reg-kind"
              ref={firstFieldRef}
              value={kind}
              onChange={(e) => setKind(e.target.value as BusinessRegistrationKind)}
              className={inputClass}
            >
              {REGISTRATION_KIND_ORDER.map((k) => (
                <option key={k} value={k}>{kindLabel(k)}</option>
              ))}
            </select>
          </div>

          {kind === 'other' && (
            <div>
              <label htmlFor="reg-custom-label" className={labelClass}>{strings.regFieldCustomName}</label>
              <input
                id="reg-custom-label"
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className={inputClass}
                maxLength={80}
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label htmlFor="reg-status" className={labelClass}>{strings.regFieldStatus}</label>
            <select
              id="reg-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as RegistrationStatus)}
              className={inputClass}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{getLocalizedRegistrationStatus(s)}</option>
              ))}
            </select>
          </div>

          {/* REGISTERED fields */}
          {status === 'REGISTERED' && (
            <>
              <div>
                <label htmlFor="reg-number" className={labelClass}>{strings.regFieldNumber}</label>
                <input
                  id="reg-number"
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                  maxLength={40}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-date" className={labelClass}>{strings.regFieldRegDate}</label>
                  <input
                    id="reg-date"
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="reg-authority" className={labelClass}>{strings.regFieldAuthority}</label>
                  <input
                    id="reg-authority"
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className={inputClass}
                    maxLength={80}
                  />
                </div>
              </div>
            </>
          )}

          {/* IN_PROCESS fields */}
          {status === 'IN_PROCESS' && (
            <>
              <div>
                <label htmlFor="reg-appref" className={labelClass}>{strings.regFieldAppRef}</label>
                <input
                  id="reg-appref"
                  type="text"
                  value={applicationReference}
                  onChange={(e) => setApplicationReference(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                  maxLength={40}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-appdate" className={labelClass}>{strings.regFieldAppDate}</label>
                  <input
                    id="reg-appdate"
                    type="date"
                    value={applicationDate}
                    onChange={(e) => setApplicationDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="reg-app-authority" className={labelClass}>{strings.regFieldAuthority}</label>
                  <input
                    id="reg-app-authority"
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className={inputClass}
                    maxLength={80}
                  />
                </div>
              </div>
            </>
          )}

          {/* Document link (registered or in-process) */}
          {(status === 'REGISTERED' || status === 'IN_PROCESS') && (
            <div>
              <label htmlFor="reg-document" className={labelClass}>{strings.regFieldDocument}</label>
              <select
                id="reg-document"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {CORE_REUSABLE_DOCUMENTS.map((d) => {
                  const label = resolveLocalizedPair(d.nameEn, d.nameHi, lang);
                  const prepared = vaultDocIds.includes(d.id);
                  return (
                    <option key={d.id} value={d.id}>
                      {label}{prepared ? ' ✓' : ''}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={onOpenVault}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#14453D] dark:text-[var(--accent-green)] hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                {strings.regOpenVault}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Notes (all statuses) */}
          <div>
            <label htmlFor="reg-notes" className={labelClass}>{strings.regFieldNotes}</label>
            <textarea
              id="reg-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} min-h-[72px] resize-y`}
              maxLength={500}
            />
          </div>

          {/* Verification source — display only, never user-editable */}
          <div className="flex items-center gap-2 text-xs text-[#516A5F] dark:text-[var(--text-secondary)]">
            {record.verificationStatus === 'USER_PROVIDED' ? (
              <CheckCircle2 className="w-4 h-4 text-[#1E6A50] dark:text-[var(--accent-green)]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <span>
              {strings.regFieldSource}: {verificationLabel}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[var(--bg-card)] border-t border-[#E8EFEA] dark:border-[var(--border-subtle)] px-5 py-4 flex items-center gap-3 rounded-b-2xl">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {strings.regDelete}
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#516A5F] dark:text-[var(--text-secondary)] hover:bg-[#F0F4F1] dark:hover:bg-[var(--bg-subtle)] transition-colors"
          >
            {strings.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#1E6A50] dark:hover:bg-[#15803D] text-white transition-colors"
          >
            {strings.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};
