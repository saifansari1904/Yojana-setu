/**
 * YOJANA SETU — ADMIN CONSOLE application tracking (read-only).
 * These statuses are USER-REPORTED ("I applied / I was approved") — Yojana
 * Setu does not submit applications to ministries and cannot confirm
 * government-side outcomes. Treat them as citizen journey signals, not facts.
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
  type Column,
} from '../components/ui';
import { go } from '../components/router';
import { timeAgo, formatDate, truncate } from '../lib/format';

const PAGE_SIZE = 25;
const STATUSES = ['', 'interested', 'docs-ready', 'applied', 'approved', 'rejected'];

interface AppRow {
  id: string;
  user_id: string;
  scheme_id: string;
  scheme_name: string;
  status: string;
  note: string | null;
  applied_on: string | null;
  created_at: string;
  updated_at: string;
}

const statusTone = (s: string): 'blue' | 'amber' | 'green' | 'red' | 'gray' => {
  switch (s) {
    case 'interested': return 'blue';
    case 'docs-ready': return 'amber';
    case 'applied': return 'blue';
    case 'approved': return 'green';
    case 'rejected': return 'red';
    default: return 'gray';
  }
};

export const Applications: React.FC = () => {
  const { client } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<AppRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      let q = client
        .from('applications')
        .select('id, user_id, scheme_id, scheme_name, status, note, applied_on, created_at, updated_at', { count: 'exact' });
      const term = search.trim();
      if (term) q = q.or(`scheme_name.ilike.%${term}%,scheme_id.ilike.%${term}%`);
      if (status) q = q.eq('status', status);
      const { data, error, count: c } = await q
        .order('updated_at', { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      setRows((data ?? []) as AppRow[]);
      setTotal(c ?? 0);
      setDenied(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      if (/permission|denied|policy/i.test(msg)) setDenied(true);
      else toast.push('error', `Applications load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [client, search, status, page, toast]);

  useEffect(() => {
    const t = setTimeout(() => void fetchRows(), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchRows, search]);

  useEffect(() => {
    setPage(0);
  }, [status]);

  useEffect(() => {
    if (!client || denied) return;
    (async () => {
      const c: Record<string, number> = {};
      for (const s of STATUSES.slice(1)) {
        const { count } = await client.from('applications').select('id', { count: 'exact', head: true }).eq('status', s);
        c[s] = count ?? 0;
      }
      setCounts(c);
    })();
  }, [client, denied]);

  const columns: Column<AppRow>[] = [
    {
      key: 'scheme',
      header: 'Scheme',
      render: (r) => (
        <button onClick={() => go(`schemes/${r.scheme_id}`)} className="text-left hover:text-[#0F6B4C] group">
          <div className="font-semibold group-hover:underline">{truncate(r.scheme_name, 50)}</div>
          <div className="text-[11px] text-gray-400 font-mono">{truncate(r.scheme_id, 40)}</div>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
    },
    {
      key: 'note',
      header: 'Note',
      render: (r) => <span className="text-xs text-gray-500">{truncate(r.note, 80)}</span>,
    },
    {
      key: 'applied',
      header: 'Applied on',
      render: (r) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(r.applied_on)}</span>,
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (r) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(r.updated_at)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Citizen-reported application journeys. Read-only."
      />
      <AlertBanner tone="amber" className="mb-4">
        These statuses are <b>self-reported by users</b>. Yojana Setu redirects to official
        portals — it does not submit applications and cannot confirm government-side outcomes.
        An "approved" here means the user said so, nothing more.
      </AlertBanner>
      {denied && (
        <AlertBanner tone="red" className="mb-4">
          Your role has no access to application records on this database yet. Nothing shown rather than guessed.
        </AlertBanner>
      )}
      {!denied && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {STATUSES.slice(1).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(status === s ? '' : s)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  status === s
                    ? 'bg-[#0F6B4C] text-white border-[#0F6B4C]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s} · {counts[s] ?? '…'}
              </button>
            ))}
          </div>
          <div className="flex gap-2.5 mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by scheme name or id…" className="w-80" />
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
              {STATUSES.map((o) => (
                <option key={o} value={o}>{o ? `Status: ${o}` : 'All statuses'}</option>
              ))}
            </SelectInput>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            keyOf={(r) => r.id}
            loading={loading}
            emptyTitle="No applications"
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
};
