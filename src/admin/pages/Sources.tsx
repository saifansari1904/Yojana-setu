/**
 * YOJANA SETU — ADMIN CONSOLE authoritative sources.
 * Every scheme's data is only as trustworthy as its sources. Sources go
 * stale — "stale" means "re-check", never "false". Re-verification is a
 * first-class, audited action.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, Trash2 } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  SearchInput,
  SelectInput,
  DataTable,
  Pagination,
  Badge,
  Btn,
  VerificationBadge,
  ConfirmDialog,
  Modal,
  Field,
  TextInput,
  useToast,
  type Column,
} from '../components/ui';
import { go } from '../components/router';
import { can } from '../lib/permissions';
import { writeAudit } from '../lib/audit';
import { timeAgo, formatDate, freshnessTone, truncate } from '../lib/format';
import type { SourceAdminRow } from '../lib/adminTypes';

const PAGE_SIZE = 25;
const VERIF_OPTIONS = ['', 'VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_REVIEW', 'UNVERIFIED'];

export const Sources: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<Array<SourceAdminRow & { scheme_name?: string | null }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [verif, setVerif] = useState('');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDays, setCurrentDays] = useState(180);
  const [dueDays, setDueDays] = useState(365);

  const [verifyRow, setVerifyRow] = useState<SourceAdminRow | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [delRow, setDelRow] = useState<SourceAdminRow | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [schemes, setSchemes] = useState<Array<{ id: string; official_name: string | null }>>([]);
  const [aScheme, setAScheme] = useState('');
  const [aName, setAName] = useState('');
  const [aUrl, setAUrl] = useState('');
  const [aType, setAType] = useState('OFFICIAL_PORTAL');
  const [aOfficial, setAOfficial] = useState(true);
  const [aNotes, setANotes] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  const canEdit = can(identity?.role, 'edit_schemes');

  useEffect(() => {
    if (!client) return;
    (async () => {
      const { data } = await client.from('ys_settings').select('key, value').eq('key', 'source_freshness').maybeSingle();
      if (data) {
        const v = data.value as { current_days?: number; due_days?: number } | null;
        if (typeof v?.current_days === 'number') setCurrentDays(v.current_days);
        if (typeof v?.due_days === 'number') setDueDays(v.due_days);
      }
    })();
  }, [client]);

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      // Server-side pagination window; freshness computed locally on the page.
      const WINDOW = PAGE_SIZE * 4;
      let q = client.from('scheme_sources').select('*', { count: 'exact' });
      const term = search.trim();
      if (term) q = q.or(`source_name.ilike.%${term}%,official_source_url.ilike.%${term}%`);
      if (verif) q = q.eq('verification_status', verif);
      if (officialOnly) q = q.eq('is_official_government_source', true);
      q = q.order('last_verified_at', { ascending: true, nullsFirst: true });
      const { data, error, count: c } = await q.range(page * WINDOW, page * WINDOW + WINDOW - 1);
      if (error) throw error;
      let list = (data ?? []) as SourceAdminRow[];
      if (staleOnly) {
        const cutoff = Date.now() - dueDays * 24 * 3600 * 1000;
        list = list.filter((s) => !s.last_verified_at || new Date(s.last_verified_at).getTime() < cutoff);
      }
      const pageRows = list.slice(0, PAGE_SIZE);
      const ids = [...new Set(pageRows.map((r) => r.scheme_id).filter(Boolean) as string[])];
      let nameMap = new Map<string, string | null>();
      if (ids.length > 0) {
        const { data: sData } = await client.from('schemes').select('id, official_name').in('id', ids);
        nameMap = new Map((sData ?? []).map((s: { id: string; official_name: string | null }) => [s.id, s.official_name]));
      }
      setRows(pageRows.map((r) => ({ ...r, scheme_name: nameMap.get(r.scheme_id ?? '') ?? null })));
      setTotal(staleOnly ? list.length : (c ?? 0));
    } catch (e) {
      toast.push('error', `Sources load failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [client, search, verif, officialOnly, staleOnly, page, dueDays, toast]);

  useEffect(() => {
    const t = setTimeout(() => void fetchRows(), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchRows, search]);

  useEffect(() => {
    setPage(0);
  }, [verif, officialOnly, staleOnly]);

  useEffect(() => {
    if (!client || !addOpen) return;
    (async () => {
      const { data } = await client.from('schemes').select('id, official_name').order('official_name').limit(500);
      setSchemes((data ?? []) as Array<{ id: string; official_name: string | null }>);
      if (!aScheme && data && data.length > 0) setAScheme(data[0].id);
    })();
  }, [client, addOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const markVerified = async (reason?: string) => {
    if (!client || !identity || !verifyRow) return;
    setVerifyBusy(true);
    try {
      const now = new Date().toISOString();
      const { error } = await client
        .from('scheme_sources')
        .update({ verification_status: 'VERIFIED', last_verified_at: now })
        .eq('scheme_id', verifyRow.scheme_id)
        .eq('source_name', verifyRow.source_name);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'scheme_source_verified',
        resourceType: 'scheme',
        resourceId: verifyRow.scheme_id ?? undefined,
        summary: `Source "${verifyRow.source_name}" re-verified. Previous check: ${formatDate(verifyRow.last_verified_at)}. Reason: ${reason ?? '—'}`,
        previousValue: { verification_status: verifyRow.verification_status, last_verified_at: verifyRow.last_verified_at },
        newValue: { verification_status: 'VERIFIED', last_verified_at: now },
        metadata: { reason: reason ?? null },
      });
      toast.push('success', 'Source marked as verified.');
      setVerifyRow(null);
      void fetchRows();
    } catch (e) {
      toast.push('error', `Verify failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setVerifyBusy(false);
    }
  };

  const removeSource = async () => {
    if (!client || !identity || !delRow) return;
    setDelBusy(true);
    try {
      const { error } = await client
        .from('scheme_sources')
        .delete()
        .eq('scheme_id', delRow.scheme_id)
        .eq('source_name', delRow.source_name);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'scheme_source_removed',
        resourceType: 'scheme',
        resourceId: delRow.scheme_id ?? undefined,
        summary: `Source "${delRow.source_name}" removed.`,
        previousValue: { source_name: delRow.source_name, url: delRow.official_source_url },
      });
      toast.push('success', 'Source removed.');
      setDelRow(null);
      void fetchRows();
    } catch (e) {
      toast.push('error', `Remove failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setDelBusy(false);
    }
  };

  const addSource = async () => {
    if (!client || !identity || !aScheme || !aName.trim()) return;
    setAddBusy(true);
    try {
      const { error } = await client.from('scheme_sources').insert({
        scheme_id: aScheme,
        source_name: aName.trim(),
        official_source_url: aUrl.trim() || null,
        source_type: aType,
        is_official_government_source: aOfficial,
        verification_status: 'UNVERIFIED',
        source_notes: aNotes.trim() || null,
      });
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'scheme_source_added',
        resourceType: 'scheme',
        resourceId: aScheme,
        summary: `Source "${aName.trim()}" added (UNVERIFIED).`,
        newValue: { source_name: aName.trim(), official_source_url: aUrl.trim() || null },
      });
      toast.push('success', 'Source added. Verify it before relying on it.');
      setAddOpen(false);
      setAName(''); setAUrl(''); setANotes('');
      void fetchRows();
    } catch (e) {
      toast.push('error', `Add failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setAddBusy(false);
    }
  };

  const columns: Column<SourceAdminRow & { scheme_name?: string | null }>[] = [
    {
      key: 'source',
      header: 'Source',
      render: (r) => (
        <div>
          <div className="font-semibold text-sm flex items-center gap-2">
            {r.source_name ?? 'Unnamed'}
            {r.is_official_government_source && <Badge tone="green">official</Badge>}
          </div>
          {r.official_source_url && (
            <a
              href={r.official_source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#0F6B4C] hover:underline font-mono"
            >
              <ExternalLink size={10} /> {truncate(r.official_source_url, 50)}
            </a>
          )}
          <div className="text-[11px] text-gray-400 mt-0.5">
            {r.scheme_name ? (
              <button onClick={() => go(`schemes/${r.scheme_id}`)} className="hover:text-[#0F6B4C] hover:underline">
                {truncate(r.scheme_name, 40)}
              </button>
            ) : (
              <span className="font-mono">{r.scheme_id}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <span className="text-xs text-gray-500">{r.source_type ?? '—'}</span>,
    },
    {
      key: 'verif',
      header: 'Verification',
      render: (r) => <VerificationBadge value={r.verification_status} />,
    },
    {
      key: 'fresh',
      header: `Freshness (≤${currentDays}d fresh)`,
      render: (r) => {
        const tone = freshnessTone(r.last_verified_at, currentDays, dueDays);
        const label =
          tone === 'fresh' ? 'Fresh' : tone === 'aging' ? 'Aging' : tone === 'stale' ? 'Stale' : 'Never checked';
        return (
          <div>
            <Badge tone={tone === 'fresh' ? 'green' : tone === 'aging' ? 'amber' : tone === 'stale' ? 'red' : 'gray'}>{label}</Badge>
            <div className="text-[11px] text-gray-400 mt-1">{timeAgo(r.last_verified_at)}</div>
          </div>
        );
      },
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            render: (r: SourceAdminRow & { scheme_name?: string | null }) => (
              <div className="flex gap-2">
                <button
                  onClick={() => setVerifyRow(r)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F6B4C] hover:underline"
                >
                  <RefreshCw size={12} /> Re-verify
                </button>
                <button
                  onClick={() => setDelRow(r)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            ),
          } as Column<SourceAdminRow & { scheme_name?: string | null }>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Sources"
        description={`Authoritative sources behind scheme data. Stale means re-check — never false. Fresh ≤ ${currentDays}d, stale > ${dueDays}d.`}
        actions={
          canEdit ? (
            <Btn variant="primary" onClick={() => setAddOpen(true)}>
              Add source
            </Btn>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2.5 mb-4 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sources…" className="w-64" />
        <SelectInput value={verif} onChange={(e) => setVerif(e.target.value)} aria-label="Verification">
          {VERIF_OPTIONS.map((o) => (
            <option key={o} value={o}>{o ? `Verification: ${o.replace(/_/g, ' ')}` : 'Any verification'}</option>
          ))}
        </SelectInput>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={officialOnly} onChange={(e) => setOfficialOnly(e.target.checked)} className="w-4 h-4 accent-[#0F6B4C]" />
          Official only
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} className="w-4 h-4 accent-[#0F6B4C]" />
          Stale only
        </label>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(r, i) => `${r.scheme_id}-${r.source_name}-${i}`}
        loading={loading}
        emptyTitle="No sources match"
      />
      {!staleOnly && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />}

      <ConfirmDialog
        open={verifyRow != null}
        title="Mark this source as verified?"
        body={
          <span>
            <b>{verifyRow?.source_name}</b> will be recorded as verified right now, resetting its
            freshness clock. Only confirm after actually checking the source document.
          </span>
        }
        confirmLabel="Mark verified"
        busy={verifyBusy}
        requireReason
        onConfirm={(reason) => void markVerified(reason)}
        onCancel={() => setVerifyRow(null)}
      />

      <ConfirmDialog
        open={delRow != null}
        title="Remove this source?"
        body={
          <span>
            <b>{delRow?.source_name}</b> will be removed from its scheme. The scheme will lose
            this provenance link. Recorded in the audit log.
          </span>
        }
        confirmLabel="Remove"
        danger
        busy={delBusy}
        onConfirm={() => void removeSource()}
        onCancel={() => setDelRow(null)}
      />

      <Modal open={addOpen} title="Add source" onClose={() => setAddOpen(false)}>
        <Field label="Scheme">
          <select
            value={aScheme}
            onChange={(e) => setAScheme(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/30"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>{s.official_name ?? s.id}</option>
            ))}
          </select>
        </Field>
        <Field label="Source name *">
          <TextInput value={aName} onChange={(e) => setAName(e.target.value)} placeholder="e.g. PM Vishwakarma guidelines PDF" />
        </Field>
        <Field label="Official URL">
          <TextInput value={aUrl} onChange={(e) => setAUrl(e.target.value)} placeholder="https://…" className="font-mono" />
        </Field>
        <Field label="Source type">
          <SelectInput value={aType} onChange={(e) => setAType(e.target.value)}>
            <option value="OFFICIAL_PORTAL">Official portal</option>
            <option value="GAZETTE">Gazette notification</option>
            <option value="PRESS_RELEASE">Press release</option>
            <option value="GUIDELINE_DOCUMENT">Guideline document</option>
            <option value="OTHER">Other</option>
          </SelectInput>
        </Field>
        <Field label="Notes">
          <TextInput value={aNotes} onChange={(e) => setANotes(e.target.value)} placeholder="Which section carries the scheme facts?" />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={aOfficial} onChange={(e) => setAOfficial(e.target.checked)} className="w-4 h-4 accent-[#0F6B4C]" />
          Official government source
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => void addSource()} disabled={addBusy || !aName.trim()}>
            {addBusy ? 'Adding…' : 'Add source'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
};
