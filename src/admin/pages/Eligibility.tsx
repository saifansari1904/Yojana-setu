/**
 * YOJANA SETU — ADMIN CONSOLE eligibility governance.
 * The matching engine is DETERMINISTIC — no ML, no AI scoring, no opaque
 * weights. When applicant information is insufficient the engine returns
 * UNKNOWN, never a guess. This page shows which schemes carry complete
 * eligibility data and which have gaps, plus the normalized reference rules.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  Tabs,
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
import { can } from '../lib/permissions';
import { timeAgo } from '../lib/format';
import type { RuleAdminRow } from '../lib/adminTypes';

const PAGE_SIZE = 25;

interface CoverageRow {
  id: string;
  official_name: string | null;
  status: string | null;
  hasMandatory: boolean;
  hasAge: boolean;
  hasStates: boolean;
  hasGroups: boolean;
  updated_at: string | null;
}

function coverageOf(rp: Record<string, unknown> | null) {
  const p = rp ?? {};
  const hasMandatory =
    (Array.isArray(p.mandatoryCriteria) && p.mandatoryCriteria.length > 0) ||
    (Array.isArray(p.otherMandatoryCriteria) && p.otherMandatoryCriteria.length > 0);
  const hasAge = p.minAge != null || p.maxAge != null;
  const hasStates = Array.isArray(p.applicableStates) && p.applicableStates.length > 0;
  const hasGroups =
    p.isWomenSpecific != null ||
    p.isScStSpecific != null ||
    p.isMinoritySpecific != null ||
    (Array.isArray(p.targetGroups) && p.targetGroups.length > 0);
  return { hasMandatory, hasAge, hasStates, hasGroups };
}

export const Eligibility: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [tab, setTab] = useState('coverage');

  const [rows, setRows] = useState<CoverageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [rules, setRules] = useState<RuleAdminRow[]>([]);
  const [rulesTotal, setRulesTotal] = useState(0);
  const [rulesPage, setRulesPage] = useState(0);
  const [rulesSearch, setRulesSearch] = useState('');
  const [rulesLoading, setRulesLoading] = useState(false);

  const fetchCoverage = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      // Coverage needs raw_payload; paginate server-side and compute locally.
      let q = client.from('schemes').select('id, official_name, status, raw_payload, updated_at', { count: 'exact' });
      const term = search.trim();
      if (term) q = q.or(`official_name.ilike.%${term}%,id.ilike.%${term}%`);
      if (status) q = q.eq('status', status);
      q = q.order('updated_at', { ascending: false, nullsFirst: false });
      // Fetch a window of pages at a time; coverage filter applied in memory.
      const WINDOW = PAGE_SIZE * 4;
      const { data, error, count: c } = await q.range(page * WINDOW, page * WINDOW + WINDOW - 1);
      if (error) throw error;
      const mapped: CoverageRow[] = (data ?? []).map((r) => {
        const s = r as { id: string; official_name: string | null; status: string | null; raw_payload: unknown; updated_at: string | null };
        return { id: s.id, official_name: s.official_name, status: s.status, updated_at: s.updated_at, ...coverageOf(s.raw_payload as Record<string, unknown> | null) };
      });
      const filtered = gapsOnly
        ? mapped.filter((r) => !r.hasMandatory || !r.hasStates)
        : mapped;
      setRows(filtered.slice(0, PAGE_SIZE));
      setTotal(gapsOnly ? filtered.length : (c ?? 0));
    } catch (e) {
      toast.push('error', `Coverage load failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [client, search, status, gapsOnly, page, toast]);

  useEffect(() => {
    if (tab !== 'coverage') return;
    const t = setTimeout(() => void fetchCoverage(), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchCoverage, tab, search]);

  useEffect(() => {
    setPage(0);
  }, [status, gapsOnly]);

  const fetchRules = useCallback(async () => {
    if (!client) return;
    setRulesLoading(true);
    try {
      let q = client
        .from('scheme_eligibility_rules')
        .select('scheme_id, criterion_key, operator, value, is_mandatory', { count: 'exact' });
      const term = rulesSearch.trim();
      if (term) q = q.or(`scheme_id.ilike.%${term}%,criterion_key.ilike.%${term}%`);
      const { data, error, count: c } = await q
        .order('scheme_id')
        .range(rulesPage * PAGE_SIZE, rulesPage * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      setRules((data ?? []) as RuleAdminRow[]);
      setRulesTotal(c ?? 0);
    } catch (e) {
      toast.push('error', `Rules load failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setRulesLoading(false);
    }
  }, [client, rulesSearch, rulesPage, toast]);

  useEffect(() => {
    if (tab !== 'rules') return;
    const t = setTimeout(() => void fetchRules(), rulesSearch ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchRules, tab, rulesSearch]);

  const coverageColumns: Column<CoverageRow>[] = [
    {
      key: 'name',
      header: 'Scheme',
      render: (r) => (
        <button onClick={() => go(`schemes/${r.id}`)} className="text-left font-semibold hover:text-[#0F6B4C] hover:underline">
          {r.official_name ?? r.id}
        </button>
      ),
    },
    {
      key: 'criteria',
      header: 'Mandatory criteria',
      render: (r) => <Badge tone={r.hasMandatory ? 'green' : 'red'}>{r.hasMandatory ? 'present' : 'missing'}</Badge>,
    },
    {
      key: 'age',
      header: 'Age band',
      render: (r) => <Badge tone={r.hasAge ? 'green' : 'gray'}>{r.hasAge ? 'present' : '—'}</Badge>,
    },
    {
      key: 'states',
      header: 'State scope',
      render: (r) => <Badge tone={r.hasStates ? 'green' : 'red'}>{r.hasStates ? 'present' : 'missing'}</Badge>,
    },
    {
      key: 'groups',
      header: 'Target groups',
      render: (r) => <Badge tone={r.hasGroups ? 'green' : 'gray'}>{r.hasGroups ? 'present' : '—'}</Badge>,
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (r) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(r.updated_at)}</span>,
    },
  ];

  const ruleColumns: Column<RuleAdminRow>[] = [
    {
      key: 'scheme',
      header: 'Scheme',
      render: (r) => (
        <button onClick={() => go(`schemes/${r.scheme_id}`)} className="font-mono text-[12px] hover:text-[#0F6B4C] hover:underline">
          {r.scheme_id}
        </button>
      ),
    },
    { key: 'key', header: 'Criterion', render: (r) => <span className="font-mono text-[12px]">{r.criterion_key}</span> },
    { key: 'op', header: 'Operator', render: (r) => <span className="font-mono text-[12px]">{r.operator}</span> },
    {
      key: 'val',
      header: 'Value',
      render: (r) => <span className="text-[13px]">{typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value ?? '—')}</span>,
    },
    {
      key: 'mand',
      header: 'Mandatory',
      render: (r) => <Badge tone={r.is_mandatory ? 'amber' : 'gray'}>{r.is_mandatory ? 'mandatory' : 'optional'}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Eligibility"
        description="Deterministic eligibility data. The engine matches facts; when facts are missing it returns UNKNOWN — it never guesses."
      />
      <AlertBanner tone="blue" className="mb-4">
        <b>Engine contract.</b> Eligibility is evaluated by deterministic rules over{' '}
        <code className="font-mono">raw_payload</code>. No machine-learning scoring, no hidden
        weights, no AI judgement. A scheme missing mandatory criteria will simply not match —
        that is a data gap to fix, not a decision to automate.
      </AlertBanner>
      <Tabs
        tabs={[
          { key: 'coverage', label: 'Data coverage' },
          { key: 'rules', label: 'Normalized rules (reference)' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'coverage' && (
        <>
          <div className="flex flex-wrap gap-2.5 mb-4 items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search schemes…" className="w-64" />
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              {['', 'draft', 'under_review', 'verified', 'published', 'rejected', 'archived'].map((o) => (
                <option key={o} value={o}>{o ? `Status: ${o.replace(/_/g, ' ')}` : 'All statuses'}</option>
              ))}
            </SelectInput>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={gapsOnly}
                onChange={(e) => setGapsOnly(e.target.checked)}
                className="w-4 h-4 accent-[#0F6B4C]"
              />
              Gaps only
            </label>
          </div>
          <DataTable
            columns={coverageColumns}
            rows={rows}
            keyOf={(r) => r.id}
            loading={loading}
            emptyTitle="No schemes"
            emptyHint="Try widening the filters."
          />
          {!gapsOnly && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />}
        </>
      )}

      {tab === 'rules' && (
        <>
          <AlertBanner tone="gray" className="mb-4">
            These normalized rules are a seeded reference for browsing. The engine reads{' '}
            <code className="font-mono">raw_payload</code>, not this table. Editing eligibility
            data happens on the scheme editor's JSON panel.
          </AlertBanner>
          <div className="flex gap-2.5 mb-4">
            <SearchInput value={rulesSearch} onChange={setRulesSearch} placeholder="Search by scheme id or criterion…" className="w-80" />
          </div>
          <DataTable
            columns={ruleColumns}
            rows={rules}
            keyOf={(r, i) => `${r.scheme_id}-${r.criterion_key}-${i}`}
            loading={rulesLoading}
            emptyTitle="No rules"
          />
          <Pagination page={rulesPage} pageSize={PAGE_SIZE} total={rulesTotal} onPage={setRulesPage} />
        </>
      )}
    </div>
  );
};
