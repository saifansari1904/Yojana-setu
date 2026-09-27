/**
 * YOJANA SETU — ADMIN CONSOLE settings.
 * Admin-managed key/value configuration (ys_settings). Only super_admin and
 * admin can change these (enforced by RLS); every change is audited with the
 * previous and new values.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  Btn,
  Modal,
  Field,
  TextInput,
  TextArea,
  useToast,
  AlertBanner,
  ConfirmDialog,
} from '../components/ui';
import { can } from '../lib/permissions';
import { writeAudit } from '../lib/audit';
import { formatDate } from '../lib/format';

interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string | null;
  updated_by: string | null;
}

const KNOWN_DESCRIPTIONS: Record<string, string> = {
  source_freshness:
    'Source freshness thresholds. current_days: a source checked within this many days is "fresh". due_days: beyond this it is "stale" and queued for re-check. Stale ≠ false.',
  verification:
    'Verification cadence. reverify_after_days: verified schemes are due for re-verification after this many days.',
};

export const Settings: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editJson, setEditJson] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [confirmChange, setConfirmChange] = useState<null | { key: string; prev: unknown; next: unknown }>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newJson, setNewJson] = useState('{}');
  const [addBusy, setAddBusy] = useState(false);

  const canEdit = can(identity?.role, 'edit_settings');

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client.from('ys_settings').select('key, value, updated_at, updated_by').order('key');
      if (error) throw error;
      setRows((data ?? []) as SettingRow[]);
      setDenied(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      if (/permission|denied|policy|relation.*does not exist/i.test(msg)) setDenied(true);
      else toast.push('error', `Settings load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openEdit = (key: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    setEditKey(key);
    setEditJson(JSON.stringify(row.value, null, 2));
  };

  const stageChange = () => {
    if (!editKey) return;
    let next: unknown;
    try {
      next = JSON.parse(editJson);
    } catch (e) {
      toast.push('error', `Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
      return;
    }
    const prev = rows.find((r) => r.key === editKey)?.value;
    if (JSON.stringify(prev) === JSON.stringify(next)) {
      toast.push('info', 'No changes to save.');
      return;
    }
    setConfirmChange({ key: editKey, prev, next });
  };

  const applyChange = async (reason?: string) => {
    if (!client || !identity || !confirmChange) return;
    setEditBusy(true);
    try {
      const { error } = await client
        .from('ys_settings')
        .update({ value: confirmChange.next as never, updated_by: identity.userId })
        .eq('key', confirmChange.key);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'setting_changed',
        resourceType: 'setting',
        resourceId: confirmChange.key,
        summary: `Setting "${confirmChange.key}" changed. Reason: ${reason ?? '—'}`,
        previousValue: confirmChange.prev as never,
        newValue: confirmChange.next as never,
        metadata: { reason: reason ?? null },
      });
      toast.push('success', 'Setting updated.');
      setConfirmChange(null);
      setEditKey(null);
      void fetchRows();
    } catch (e) {
      toast.push('error', `Save failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setEditBusy(false);
    }
  };

  const addSetting = async () => {
    if (!client || !identity || !newKey.trim()) return;
    let value: unknown;
    try {
      value = JSON.parse(newJson);
    } catch (e) {
      toast.push('error', `Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
      return;
    }
    setAddBusy(true);
    try {
      const { error } = await client.from('ys_settings').insert({
        key: newKey.trim(),
        value: value as never,
        updated_by: identity.userId,
      });
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'setting_created',
        resourceType: 'setting',
        resourceId: newKey.trim(),
        summary: `Setting "${newKey.trim()}" created.`,
        newValue: value as never,
      });
      toast.push('success', 'Setting created.');
      setAddOpen(false);
      setNewKey('');
      setNewJson('{}');
      void fetchRows();
    } catch (e) {
      toast.push('error', `Create failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setAddBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Admin-managed configuration. Changes take effect immediately and are audit-logged."
        actions={
          canEdit ? (
            <Btn variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> New setting
            </Btn>
          ) : undefined
        }
      />
      {!canEdit && (
        <AlertBanner tone="gray" className="mb-4">
          Your role ({identity?.role ?? 'unknown'}) can view settings but not change them.
        </AlertBanner>
      )}
      {denied && (
        <AlertBanner tone="red" className="mb-4">
          The settings table (<code className="font-mono">ys_settings</code>) is not reachable —
          migration 018 may not be applied yet.
        </AlertBanner>
      )}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 animate-pulse">Loading…</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-bold text-[15px]">{r.key}</div>
                  {KNOWN_DESCRIPTIONS[r.key] && (
                    <div className="text-xs text-gray-500 mt-1">{KNOWN_DESCRIPTIONS[r.key]}</div>
                  )}
                  <pre className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3 text-[12px] overflow-x-auto max-h-48">
                    {JSON.stringify(r.value, null, 2)}
                  </pre>
                  <div className="text-[11px] text-gray-400 mt-2">
                    Last updated {formatDate(r.updated_at)}
                  </div>
                </div>
                {canEdit && (
                  <Btn variant="secondary" onClick={() => openEdit(r.key)}>
                    <Pencil size={14} /> Edit
                  </Btn>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && !denied && (
            <AlertBanner tone="gray">No settings rows yet. Run migration 018 to seed defaults.</AlertBanner>
          )}
        </div>
      )}

      <Modal open={editKey != null} title={`Edit setting: ${editKey}`} onClose={() => setEditKey(null)} wide>
        <Field label="Value (JSON)" hint="Must be valid JSON. Object, array, string or number — the readers decide the shape.">
          <TextArea rows={10} value={editJson} onChange={(e) => setEditJson(e.target.value)} spellCheck={false} className="font-mono text-[12px]" />
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="ghost" onClick={() => setEditKey(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={stageChange}>Review change</Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmChange != null}
        title={`Apply change to "${confirmChange?.key}"?`}
        body={
          <span>
            This takes effect immediately for the whole console.
            <span className="grid grid-cols-2 gap-2 mt-3">
              <pre className="bg-red-50/70 border border-red-100 rounded-lg p-2 text-[11px] overflow-x-auto">
                {JSON.stringify(confirmChange?.prev, null, 2)}
              </pre>
              <pre className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 text-[11px] overflow-x-auto">
                {JSON.stringify(confirmChange?.next, null, 2)}
              </pre>
            </span>
          </span>
        }
        confirmLabel="Apply change"
        busy={editBusy}
        requireReason
        onConfirm={(reason) => void applyChange(reason)}
        onCancel={() => setConfirmChange(null)}
      />

      <Modal open={addOpen} title="New setting" onClose={() => setAddOpen(false)}>
        <Field label="Key *">
          <TextInput value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. import_defaults" className="font-mono" />
        </Field>
        <Field label="Value (JSON) *">
          <TextArea rows={6} value={newJson} onChange={(e) => setNewJson(e.target.value)} spellCheck={false} className="font-mono text-[12px]" />
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => void addSetting()} disabled={addBusy || !newKey.trim()}>
            {addBusy ? 'Creating…' : 'Create setting'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
};
