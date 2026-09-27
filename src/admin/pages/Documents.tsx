/**
 * YOJANA SETU — ADMIN CONSOLE document requirements management.
 * The documents a scheme demands are part of its public promise —
 * changes here are audited per scheme.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  SearchInput,
  DataTable,
  Pagination,
  Btn,
  Badge,
  Modal,
  Field,
  TextInput,
  useToast,
  ConfirmDialog,
  type Column,
} from '../components/ui';
import { go } from '../components/router';
import { can } from '../lib/permissions';
import { writeAudit } from '../lib/audit';

const PAGE_SIZE = 25;

interface DocRow {
  scheme_id: string;
  document_label: string | null;
  scheme_name?: string;
}

export const Documents: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [schemes, setSchemes] = useState<Array<{ id: string; official_name: string | null }>>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newSchemeId, setNewSchemeId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [delRow, setDelRow] = useState<DocRow | null>(null);
  const [busy, setBusy] = useState(false);

  const canEdit = can(identity?.role, 'edit_schemes');

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      let q = client.from('scheme_document_requirements').select('scheme_id, document_label', { count: 'exact' });
      const term = search.trim();
      if (term) q = q.or(`scheme_id.ilike.%${term}%,document_label.ilike.%${term}%`);
      const { data, error, count: c } = await q
        .order('scheme_id')
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      const docs = (data ?? []) as DocRow[];
      // Resolve scheme names for the visible page only.
      const ids = [...new Set(docs.map((d) => d.scheme_id))];
      let nameMap = new Map<string, string | null>();
      if (ids.length > 0) {
        const { data: sData } = await client.from('schemes').select('id, official_name').in('id', ids);
        nameMap = new Map((sData ?? []).map((s: { id: string; official_name: string | null }) => [s.id, s.official_name]));
      }
      setRows(docs.map((d) => ({ ...d, scheme_name: nameMap.get(d.scheme_id) ?? null })));
      setTotal(c ?? 0);
    } catch (e) {
      toast.push('error', `Documents load failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [client, search, page, toast]);

  useEffect(() => {
    const t = setTimeout(() => void fetchRows(), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchRows, search]);

  useEffect(() => {
    if (!client || !addOpen) return;
    (async () => {
      const { data } = await client
        .from('schemes')
        .select('id, official_name')
        .order('official_name')
        .limit(500);
      setSchemes((data ?? []) as Array<{ id: string; official_name: string | null }>);
      if (!newSchemeId && data && data.length > 0) setNewSchemeId(data[0].id);
    })();
  }, [client, addOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const addDoc = async () => {
    if (!client || !identity || !newSchemeId || !newLabel.trim()) return;
    setSaving(true);
    try {
      const { error } = await client.from('scheme_document_requirements').insert({
        scheme_id: newSchemeId,
        document_label: newLabel.trim(),
      });
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'scheme_document_added',
        resourceType: 'scheme',
        resourceId: newSchemeId,
        summary: `Document requirement added: "${newLabel.trim()}".`,
        newValue: { document_label: newLabel.trim() },
      });
      toast.push('success', 'Document requirement added.');
      setAddOpen(false);
      setNewLabel('');
      void fetchRows();
    } catch (e) {
      toast.push('error', `Add failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const removeDoc = async () => {
    if (!client || !identity || !delRow) return;
    setBusy(true);
    try {
      const { error } = await client
        .from('scheme_document_requirements')
        .delete()
        .eq('scheme_id', delRow.scheme_id)
        .eq('document_label', delRow.document_label);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'scheme_document_removed',
        resourceType: 'scheme',
        resourceId: delRow.scheme_id,
        summary: `Document requirement removed: "${delRow.document_label}".`,
        previousValue: { document_label: delRow.document_label },
      });
      toast.push('success', 'Document requirement removed.');
      setDelRow(null);
      void fetchRows();
    } catch (e) {
      toast.push('error', `Remove failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<DocRow>[] = [
    {
      key: 'scheme',
      header: 'Scheme',
      render: (r) => (
        <button onClick={() => go(`schemes/${r.scheme_id}`)} className="text-left hover:text-[#0F6B4C] hover:underline">
          <div className="font-semibold">{r.scheme_name ?? r.scheme_id}</div>
          <div className="text-[11px] text-gray-400 font-mono">{r.scheme_id}</div>
        </button>
      ),
    },
    {
      key: 'doc',
      header: 'Document',
      render: (r) => <span className="text-sm font-medium">{r.document_label ?? '—'}</span>,
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            render: (r: DocRow) => (
              <button
                onClick={() => setDelRow(r)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                aria-label={`Remove ${r.document_label}`}
              >
                <Trash2 size={13} /> Remove
              </button>
            ),
          } as Column<DocRow>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Document requirements published per scheme. Removing one changes what applicants are told to bring — always audited."
        actions={
          canEdit ? (
            <Btn variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add requirement
            </Btn>
          ) : undefined
        }
      />
      <div className="flex gap-2.5 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by scheme or document…" className="w-80" />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(r, i) => `${r.scheme_id}-${r.document_label}-${i}`}
        loading={loading}
        emptyTitle="No document requirements"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      <Modal open={addOpen} title="Add document requirement" onClose={() => setAddOpen(false)}>
        <Field label="Scheme">
          <select
            value={newSchemeId}
            onChange={(e) => setNewSchemeId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/30"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.official_name ?? s.id}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Document label" hint="Exactly what the applicant is told to bring.">
          <TextInput value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Aadhaar card" />
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => void addDoc()} disabled={saving || !newLabel.trim()}>
            {saving ? 'Adding…' : 'Add requirement'}
          </Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={delRow != null}
        title="Remove this document requirement?"
        body={
          <span>
            <b>{delRow?.document_label}</b> will no longer be listed for{' '}
            <b>{delRow?.scheme_name ?? delRow?.scheme_id}</b>. Applicants will stop being
            asked for it. Recorded in the audit log.
          </span>
        }
        confirmLabel="Remove"
        danger
        busy={busy}
        onConfirm={() => void removeDoc()}
        onCancel={() => setDelRow(null)}
      />
    </div>
  );
};
