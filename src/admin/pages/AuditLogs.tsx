/**
 * YOJANA SETU — ADMIN CONSOLE audit log explorer.
 * The append-only record of every consequential admin action. Nobody can
 * edit or delete rows here (RLS forbids it); corrections are new rows.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  SearchInput,
  SelectInput,
  DataTable,
  Pagination,
  Badge,
  useToast,
  AlertBanner,
  EmptyState,
  type Column,
} from '../components/ui';
import { timeAgo, formatDate, truncate } from '../lib/format';
import type { AuditLogRow } from '../lib/adminTypes';

const PAGE_SIZE = 25;

const ACTION_GROUPS = ['', 'scheme_', 'sync', 'import', 'source', 'document', 'settings', 'admin'];
const RESOURCE_TYPES = ['', 'scheme', 'source', 'import', 'setting', 'admin', 'user'];
const ROLES = ['', 'super_admin', 'admin', 'reviewer', 'support'];

export const AuditLogs: React.FC = () => {
  const { client } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [actionPrefix, setActionPrefix] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [role, setRole] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      let q = client.from('ys_admin_audit_logs').select('*', { count: 'exact' });
      if (actionPrefix) q = q.ilike('action', `${actionPrefix}%`);
      if (resourceType) q = q.eq('resource_type', resourceType);
      if (role) q = q.eq('actor_role', role);
      const rid = resourceId.trim();
      if (rid) q = q.ilike('resource_id', `%${rid}%`);
      if (from) q = q.gte('created_at', new Date(from).toISOString());
      if (to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        q = q.lt('created_at', end.toISOString());
      }
      const { data, error, count: c } = await q
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      setRows((data ?? []) as AuditLogRow[]);
      setTotal(c ?? 0);
      setDenied(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      if (/permission|denied|policy|relation.*does not exist/i.test(msg)) setDenied(true);
      else toast.push('error', `Audit load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [client, actionPrefix, resourceType, role, resourceId, from, to, page, toast]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    setPage(0);
  }, [actionPrefix, resourceType, role, from, to]);

  const columns: Column<AuditLogRow>[] = [
    {
      key: 'when',
      header: 'When',
      render: (r) => (
        <div>
          <div className="text-[13px] font-medium whitespace-nowrap">{formatDate(r.created_at)}</div>
          <div className="text-[11px] text-gray-400">{timeAgo(r.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <div>
          <Badge tone={r.outcome === 'failure' ? 'red' : 'blue'}>{r.action}</Badge>
          <div className="text-[11px] text-gray-400 mt-0.5">{r.actor_role ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'What happened',
      render: (r) => (
        <div className="max-w-xl">
          <div className="text-sm text-gray-700">{r.summary || '—'}</div>
          {r.resource_id && (
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
              {r.resource_type}: {truncate(r.resource_id, 50)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'diff',
      header: 'Values',
      render: (r) =>
        r.previous_value != null || r.new_value != null ? (
          <details className="text-xs max-w-sm">
            <summary className="cursor-pointer text-[#0F6B4C] font-semibold">view diff</summary>
            <div className="grid gap-1.5 mt-2">
              {r.previous_value != null && (
                <pre className="bg-red-50/70 border border-red-100 rounded-lg p-2 overflow-x-auto text-[11px] max-h-40">
                  − {JSON.stringify(r.previous_value, null, 1)}
                </pre>
              )}
              {r.new_value != null && (
                <pre className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 overflow-x-auto text-[11px] max-h-40">
                  + {JSON.stringify(r.new_value, null, 1)}
                </pre>
              )}
              {r.metadata != null && Object.keys(r.metadata as object).length > 0 && (
                <pre className="bg-gray-50 border border-gray-100 rounded-lg p-2 overflow-x-auto text-[11px] max-h-32">
                  {JSON.stringify(r.metadata, null, 1)}
                </pre>
              )}
            </div>
          </details>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Append-only history of consequential admin actions. Corrections are written as new rows — history is never rewritten."
      />
      {denied && (
        <AlertBanner tone="red" className="mb-4">
          The audit table (<code className="font-mono">ys_admin_audit_logs</code>) is not reachable
          — migration 019 may not be applied yet, or your role lacks access.
        </AlertBanner>
      )}
      {!denied && (
        <>
          <div className="flex flex-wrap gap-2.5 mb-4 items-center">
            <SelectInput value={actionPrefix} onChange={(e) => setActionPrefix(e.target.value)} aria-label="Action group">
              {ACTION_GROUPS.map((o) => (
                <option key={o} value={o}>{o ? `Actions: ${o}*` : 'All actions'}</option>
              ))}
            </SelectInput>
            <SelectInput value={resourceType} onChange={(e) => setResourceType(e.target.value)} aria-label="Resource type">
              {RESOURCE_TYPES.map((o) => (
                <option key={o} value={o}>{o ? `Resource: ${o}` : 'All resources'}</option>
              ))}
            </SelectInput>
            <SelectInput value={role} onChange={(e) => setRole(e.target.value)} aria-label="Actor role">
              {ROLES.map((o) => (
                <option key={o} value={o}>{o ? `Role: ${o}` : 'All roles'}</option>
              ))}
            </SelectInput>
            <SearchInput value={resourceId} onChange={setResourceId} placeholder="Resource id…" className="w-44" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              aria-label="From date"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              aria-label="To date"
            />
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            keyOf={(r) => r.id}
            loading={loading}
            emptyTitle="No audit entries match"
            emptyHint="Widen the filters, or note that actions before the Admin Console existed are not tracked."
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
};
