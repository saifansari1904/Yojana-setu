/**
 * YOJANA SETU — ADMIN CONSOLE eligibility check monitoring (read-only).
 * match_runs stores compact summaries of each assessment run — how many
 * schemes matched and which topped the list. Full profile answers stay in
 * profile_snapshot; this page shows aggregate signal only, not personal answers.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  DataTable,
  Pagination,
  Badge,
  useToast,
  AlertBanner,
  type Column,
} from '../components/ui';
import { go } from '../components/router';
import { timeAgo, formatDate } from '../lib/format';

const PAGE_SIZE = 25;

interface RunRow {
  id: string;
  user_id: string;
  created_at: string;
  result_count: number;
  top_scheme_id: string | null;
  top_match_pct: number | null;
}

export const EligibilityChecks: React.FC = () => {
  const { client } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<Array<RunRow & { scheme_name?: string | null }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [stats, setStats] = useState<{ runs: number; zeroResult: number; avgResults: number } | null>(null);

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const { data, error, count: c } = await client
        .from('match_runs')
        .select('id, user_id, created_at, result_count, top_scheme_id, top_match_pct', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      const runs = (data ?? []) as RunRow[];
      const ids = [...new Set(runs.map((r) => r.top_scheme_id).filter(Boolean) as string[])];
      let nameMap = new Map<string, string | null>();
      if (ids.length > 0) {
        const { data: sData } = await client.from('schemes').select('id, official_name').in('id', ids);
        nameMap = new Map((sData ?? []).map((s: { id: string; official_name: string | null }) => [s.id, s.official_name]));
      }
      setRows(runs.map((r) => ({ ...r, scheme_name: nameMap.get(r.top_scheme_id ?? '') ?? null })));
      setTotal(c ?? 0);
      setDenied(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      if (/permission|denied|policy/i.test(msg)) setDenied(true);
      else toast.push('error', `Runs load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [client, page, toast]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!client || denied) return;
    (async () => {
      try {
        // Small aggregate window — honest sample, labeled as such.
        const { data } = await client
          .from('match_runs')
          .select('result_count')
          .order('created_at', { ascending: false })
          .limit(1000);
        const list = (data ?? []) as Array<{ result_count: number }>;
        if (list.length > 0) {
          const zero = list.filter((r) => (r.result_count ?? 0) === 0).length;
          const avg = list.reduce((a, r) => a + (r.result_count ?? 0), 0) / list.length;
          setStats({ runs: list.length, zeroResult: zero, avgResults: Math.round(avg * 10) / 10 });
        } else {
          setStats({ runs: 0, zeroResult: 0, avgResults: 0 });
        }
      } catch { setStats(null); }
    })();
  }, [client, denied]);

  const columns: Column<RunRow & { scheme_name?: string | null }>[] = [
    {
      key: 'when',
      header: 'Run at',
      render: (r) => (
        <div>
          <div className="text-sm font-medium whitespace-nowrap">{formatDate(r.created_at)}</div>
          <div className="text-[11px] text-gray-400">{timeAgo(r.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'results',
      header: 'Matches',
      render: (r) => (
        <Badge tone={(r.result_count ?? 0) === 0 ? 'amber' : 'green'}>
          {r.result_count ?? 0} scheme{(r.result_count ?? 0) === 1 ? '' : 's'}
        </Badge>
      ),
    },
    {
      key: 'top',
      header: 'Top match',
      render: (r) =>
        r.top_scheme_id ? (
          <button onClick={() => go(`schemes/${r.top_scheme_id}`)} className="text-left hover:text-[#0F6B4C] group">
            <span className="text-sm font-semibold group-hover:underline">
              {r.scheme_name ?? r.top_scheme_id}
            </span>
            {r.top_match_pct != null && <span className="text-xs text-gray-400 ml-2">{Math.round(r.top_match_pct)}%</span>}
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'id',
      header: 'Run id',
      render: (r) => <span className="text-[11px] text-gray-400 font-mono">{r.id.slice(0, 8)}…</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Eligibility checks"
        description="Assessment runs against the deterministic matching engine. Monitoring only — the console never re-scores anyone."
      />
      <AlertBanner tone="blue" className="mb-4">
        Eligibility is computed <b>client-side</b> by deterministic rules; the database only
        stores compact summaries (counts + top match). This page shows platform signal —
        it does not show or re-run anyone's personal answers.
      </AlertBanner>
      {denied && (
        <AlertBanner tone="red" className="mb-4">
          Your role has no access to match-run records on this database yet.
        </AlertBanner>
      )}
      {!denied && stats && (
        <div className="grid grid-cols-3 gap-3 mb-4 max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-2xl font-extrabold">{stats.runs}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Runs (last 1000)</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-2xl font-extrabold">{stats.avgResults}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Avg matches / run</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-2xl font-extrabold">{stats.zeroResult}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Zero-match runs</div>
          </div>
        </div>
      )}
      {!denied && (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            keyOf={(r) => r.id}
            loading={loading}
            emptyTitle="No eligibility runs recorded"
            emptyHint="Runs appear here once users complete assessments."
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
};
