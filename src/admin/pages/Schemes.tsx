/**
 * YOJANA SETU — ADMIN CONSOLE scheme catalog management.
 * Server-side search / filter / sort / pagination — the full table is never
 * loaded into the browser.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  SearchInput,
  SelectInput,
  DataTable,
  Pagination,
  Btn,
  Badge,
  SchemeStatusBadge,
  VerificationBadge,
  ConfirmDialog,
  useToast,
  type Column,
} from '../components/ui';
import { go } from '../components/router';
import { can } from '../lib/permissions';
import { writeAudit } from '../lib/audit';
import { timeAgo, truncate } from '../lib/format';
import type { SchemeAdminRow } from '../lib/adminTypes';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = ['', 'draft', 'under_review', 'verified', 'published', 'rejected', 'archived'];
const VERIF_OPTIONS = ['', 'VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_REVIEW', 'UNVERIFIED'];
const SCOPE_OPTIONS = ['', 'NATIONAL', 'STATE_SPECIFIC'];

export const Schemes: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<SchemeAdminRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [verif, setVerif] = useState('');
  const [scope, setScope] = useState('');
  const [sort, setSort] = useState<'updated' | 'name'>('updated');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<null | { to: string; label: string }>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const canEdit = can(identity?.role, 'edit_schemes');
  const canPublish = can(identity?.role, 'publish_schemes');

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      let q = client
        .from('schemes')
        .select(
          'id, official_name, short_code, sponsoring_ministry, department, scheme_type, scope, benefit_summary, status, verification_status, updated_at',
          { count: 'exact' },
        );
      const term = search.trim();
      if (term) q = q.or(`official_name.ilike.%${term}%,id.ilike.%${term}%`);
      if (status) q = q.eq('status', status);
      if (verif) q = q.eq('verification_status', verif);
      if (scope) q = q.eq('scope', scope);
      q = sort === 'name' ? q.order('official_name') : q.order('updated_at', { ascending: false, nullsFirst: false });
      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const { data, error, count: c } = await q;
      if (error) throw error;
      setRows((data ?? []) as SchemeAdminRow[]);
      setTotal(c ?? 0);
    } catch (e) {
      toast.push('error', `Could not load schemes: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [client, search, status, verif, scope, sort, page, toast]);

  useEffect(() => {
    const t = setTimeout(() => void fetchRows(), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchRows, search]);

  useEffect(() => {
    setPage(0);
  }, [status, verif, scope, sort]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (reason?: string) => {
    if (!client || !identity || !bulkAction || selected.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = [...selected];
      const { error } = await client.from('schemes').update({ status: bulkAction.to }).in('id', ids);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: `schemes_bulk_${bulkAction.to}`,
        resourceType: 'scheme',
        summary: `Bulk status change → ${bulkAction.to}: ${ids.length} scheme(s). Reason: ${reason ?? '—'}`,
        newValue: { status: bulkAction.to, ids },
        metadata: { reason: reason ?? null },
      });
      toast.push('success', `${ids.length} scheme(s) moved to ${bulkAction.to}.`);
      setSelected(new Set());
      setBulkAction(null);
      void fetchRows();
    } catch (e) {
      toast.push('error', `Bulk update failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBulkBusy(false);
    }
  };

  const columns: Column<SchemeAdminRow>[] = [
    ...(canEdit || canPublish
      ? [
          {
            key: 'sel',
            header: '',
            render: (r: SchemeAdminRow) => (
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggleSelect(r.id)}
                className="w-4 h-4 accent-[#0F6B4C]"
                aria-label={`Select ${r.official_name}`}
              />
            ),
          } as Column<SchemeAdminRow>,
        ]
      : []),
    {
      key: 'name',
      header: 'Scheme',
      render: (r) => (
        <button onClick={() => go(`schemes/${r.id}`)} className="text-left group">
          <div className="font-semibold text-gray-900 group-hover:text-[#0F6B4C] group-hover:underline">
            {r.official_name ?? r.id}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">{truncate(r.id, 40)}</div>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <SchemeStatusBadge status={r.status} />,
    },
    {
      key: 'verif',
      header: 'Verification',
      render: (r) => <VerificationBadge value={r.verification_status} />,
    },
    {
      key: 'ministry',
      header: 'Ministry / Dept',
      render: (r) => (
        <span className="text-gray-600">{truncate(r.sponsoring_ministry ?? r.department, 34)}</span>
      ),
    },
    {
      key: 'scope',
      header: 'Scope',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {r.scope === 'NATIONAL' ? 'National' : r.scope === 'STATE_SPECIFIC' ? 'State' : '—'}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (r) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(r.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          onClick={() => go(`schemes/${r.id}`)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F6B4C] hover:underline"
        >
          <Eye size={13} /> Open
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Schemes"
        description="The full scheme catalog across all lifecycle states. Only published schemes reach the user app."
        actions={
          canEdit ? (
            <Btn variant="primary" onClick={() => go('schemes/new')}>
              <Plus size={15} /> New scheme
            </Btn>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2.5 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or id…"
          className="w-72"
        />
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
          {STATUS_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o ? `Status: ${o.replace(/_/g, ' ')}` : 'All statuses'}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={verif} onChange={(e) => setVerif(e.target.value)} aria-label="Verification filter">
          {VERIF_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o ? `Verification: ${o.replace(/_/g, ' ')}` : 'Any verification'}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope filter">
          {SCOPE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o ? `Scope: ${o === 'NATIONAL' ? 'National' : 'State-specific'}` : 'Any scope'}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={sort} onChange={(e) => setSort(e.target.value as 'updated' | 'name')} aria-label="Sort">
          <option value="updated">Recently updated</option>
          <option value="name">Name A–Z</option>
        </SelectInput>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-3 bg-[#0F6B4C]/5 border border-[#0F6B4C]/20 rounded-xl px-4 py-2.5 text-sm">
          <span className="font-semibold">{selected.size} selected</span>
          <span className="text-gray-400">|</span>
          {canPublish && (
            <>
              <button
                className="text-xs font-semibold text-[#0F6B4C] hover:underline"
                onClick={() => setBulkAction({ to: 'published', label: 'Publish' })}
              >
                Publish
              </button>
              <button
                className="text-xs font-semibold text-amber-700 hover:underline"
                onClick={() => setBulkAction({ to: 'under_review', label: 'Send to review' })}
              >
                Send to review
              </button>
            </>
          )}
          {canEdit && (
            <button
              className="text-xs font-semibold text-gray-600 hover:underline"
              onClick={() => setBulkAction({ to: 'archived', label: 'Archive' })}
            >
              Archive
            </button>
          )}
          <button
            className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(r) => r.id}
        loading={loading}
        emptyTitle="No schemes match"
        emptyHint="Try widening the filters, or create a new scheme."
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      <ConfirmDialog
        open={bulkAction != null}
        title={`${bulkAction?.label} ${selected.size} scheme(s)?`}
        body={
          <span>
            This will change the status of <b>{selected.size}</b> scheme(s) to{' '}
            <Badge tone="blue">{bulkAction?.to}</Badge>. Only published schemes are visible to
            users. The change is recorded in the audit log.
          </span>
        }
        confirmLabel={bulkAction?.label ?? 'Confirm'}
        danger={bulkAction?.to === 'archived'}
        busy={bulkBusy}
        requireReason
        onConfirm={(reason) => void runBulk(reason)}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
};
