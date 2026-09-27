/**
 * YOJANA SETU — ADMIN CONSOLE Sync Center.
 *
 * Runs the REAL deterministic candidate import pipeline (the same
 * runCandidateSchemeImportPipeline the catalog was seeded with) against a
 * CSV uploaded by the admin. Deduplication is checked against the LIVE
 * catalog. Only valid, non-duplicate candidates can be queued — always as
 * DRAFT + UNVERIFIED, never published directly. Nothing here pretends to
 * be a live government API feed.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, FileText, Play, ShieldAlert, CheckCircle2, XCircle, History } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  Tabs,
  Btn,
  Badge,
  DataTable,
  useToast,
  AlertBanner,
  EmptyState,
  ConfirmDialog,
  type Column,
} from '../components/ui';
import { go } from '../components/router';
import { can } from '../lib/permissions';
import { writeAudit } from '../lib/audit';
import { timeAgo, formatDate } from '../lib/format';
import { runCandidateSchemeImportPipeline, type CandidateImportReport } from '../../lib/data/candidatePipeline';
import type { Scheme } from '../../types';
import type { CandidateDeduplicationResult } from '../../types/rawScheme';
import type { AuditLogRow } from '../lib/adminTypes';

const TEMPLATE_COLUMNS = [
  'id', 'state_or_ut', 'scope', 'scheme_name', 'tag', 'ministry',
  'benefit', 'annual', 'application_url', 'application_type', 'relevance_tier', 'source_file',
];

interface CandidateView {
  ckey: string;
  scheme: Scheme;
  valid: boolean;
  issues: string[];
  duplicate?: CandidateDeduplicationResult;
  selected: boolean;
}

const Stat: React.FC<{ label: string; value: number; tone?: 'blue' | 'green' | 'amber' | 'red' | 'gray' }> = ({ label, value, tone = 'gray' }) => {
  const tones: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50/60', green: 'border-emerald-200 bg-emerald-50/60',
    amber: 'border-amber-200 bg-amber-50/60', red: 'border-red-200 bg-red-50/60',
    gray: 'border-gray-200 bg-white',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mt-0.5">{label}</div>
    </div>
  );
};

export const SyncCenter: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState('import');

  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [catalogSize, setCatalogSize] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<CandidateImportReport | null>(null);
  const [candidates, setCandidates] = useState<CandidateView[]>([]);

  const [confirmQueue, setConfirmQueue] = useState(false);
  const [queueBusy, setQueueBusy] = useState(false);
  const [history, setHistory] = useState<AuditLogRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canImport = can(identity?.role, 'run_import');

  const loadCatalogSize = useCallback(async () => {
    if (!client || catalogSize != null) return;
    const { count } = await client.from('schemes').select('id', { count: 'exact', head: true });
    setCatalogSize(count ?? 0);
  }, [client, catalogSize]);

  useEffect(() => {
    if (canImport) void loadCatalogSize();
  }, [canImport, loadCatalogSize]);

  const loadHistory = useCallback(async () => {
    if (!client) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await client
        .from('ys_admin_audit_logs')
        .select('*')
        .in('action', ['scheme_import_queued', 'scheme_import_run'])
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      setHistory((data ?? []) as AuditLogRow[]);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (tab === 'history') void loadHistory();
  }, [tab, loadHistory]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''));
      setFileName(f.name);
      setReport(null);
      setCandidates([]);
    };
    reader.readAsText(f);
  };

  const runImport = async () => {
    if (!client || !csvText || !identity) return;
    setRunning(true);
    try {
      // Load live catalog for real deduplication (id, name, portal URL only).
      const { data: catRows, error: catErr } = await client
        .from('schemes')
        .select('id, official_name');
      if (catErr) throw catErr;
      const portalById = new Map<string, string>();
      try {
        const { data: appRows } = await client
          .from('scheme_application_info')
          .select('scheme_id, official_portal_url');
        for (const r of (appRows ?? []) as Array<{ scheme_id: string; official_portal_url: string | null }>) {
          if (r.scheme_id && r.official_portal_url) portalById.set(r.scheme_id, r.official_portal_url);
        }
      } catch { /* portal urls are best-effort for dedup */ }
      const catalog: Scheme[] = ((catRows ?? []) as Array<{ id: string; official_name: string | null }>).map((r) => ({
        id: r.id,
        name: r.official_name ?? r.id,
        officialPortalUrl: portalById.get(r.id) ?? '',
      }) as Scheme);

      const rep = runCandidateSchemeImportPipeline(csvText, catalog);
      setReport(rep);

      const issueMap = new Map<string, string[]>();
      for (const vi of rep.validationIssues) {
        const arr = issueMap.get(vi.schemeId) ?? [];
        arr.push(`${vi.field}: ${vi.message}`);
        issueMap.set(vi.schemeId, arr);
      }
      const dupMap = new Map<string, CandidateDeduplicationResult>();
      for (const d of rep.duplicates) dupMap.set(d.candidateId, d);

      const validIds = new Set<string>();
      // A candidate is "valid" if no validation issues were recorded for it.
      for (const s of rep.processedCandidates) {
        if (!issueMap.has(s.id)) validIds.add(s.id);
      }
      // Reconciled candidates include dedup-adjusted ids; fall back to count check.
      setCandidates(
        rep.processedCandidates.map((s, i) => {
          const issues = issueMap.get(s.id) ?? [];
          const dup = dupMap.get(s.id);
          return {
            ckey: `${s.id}::${i}`,
            scheme: s,
            valid: issues.length === 0,
            issues,
            duplicate: dup?.isDuplicate ? dup : undefined,
            selected: false,
          };
        }),
      );

      await writeAudit(client, identity, {
        action: 'scheme_import_run',
        resourceType: 'import',
        summary: `Import run on "${fileName ?? 'file'}": ${rep.totalRawRecords} raw → ${rep.totalValidRecords} valid, ${rep.quarantinedCount} quarantined, ${rep.potentialDuplicatesCount} potential duplicates.`,
        metadata: {
          file: fileName,
          total_raw: rep.totalRawRecords,
          valid: rep.totalValidRecords,
          quarantined: rep.quarantinedCount,
          duplicates: rep.potentialDuplicatesCount,
        },
      });
      toast.push('success', `Pipeline finished: ${rep.totalValidRecords} valid of ${rep.totalRawRecords} raw.`);
    } catch (e) {
      toast.push('error', `Import failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  const queueSelected = async (reason?: string) => {
    if (!client || !identity) return;
    const selected = candidates.filter((c) => c.selected && c.valid && !c.duplicate);
    if (selected.length === 0) return;
    setQueueBusy(true);
    let ok = 0;
    const failures: string[] = [];
    try {
      const { data: existingIds } = await client.from('schemes').select('id');
      const taken = new Set((existingIds ?? []).map((r: { id: string }) => r.id));

      for (const c of selected) {
        const s = c.scheme;
        let newId = s.id && !taken.has(s.id) ? s.id : `candidate-${s.id || 'unnamed'}`;
        let suffix = 1;
        while (taken.has(newId)) {
          newId = `candidate-${s.id || 'unnamed'}-${suffix++}`;
        }
        taken.add(newId);
        try {
          const row = {
            id: newId,
            official_name: s.name,
            short_code: s.shortCode || null,
            official_scheme_identifier: s.officialSchemeIdentifier || null,
            sponsoring_ministry: s.sponsoringMinistry || null,
            department: s.department || null,
            scheme_type: s.schemeType || null,
            scope: s.scope || null,
            benefit_summary: s.benefitSummary || null,
            description: s.description || null,
            funding_range_text: s.fundingRangeText || null,
            status: 'draft',
            verification_status: 'UNVERIFIED',
            metadata: {
              tags: s.tags ?? [],
              categories: s.categories ?? [],
              import_batch: report?.timestamp ?? new Date().toISOString(),
              candidate_source_file: fileName,
              relevance_tier: s.relevanceTier,
            },
            raw_payload: s as never,
          };
          const { error: insErr } = await client.from('schemes').insert(row);
          if (insErr) throw insErr;

          // Carry the candidate's provenance as an UNVERIFIED source row.
          if (s.sourceProvenance) {
            await client.from('scheme_sources').insert({
              scheme_id: newId,
              source_name: s.sourceProvenance.sourceName || 'Discovery import',
              official_source_url: s.sourceProvenance.officialSourceUrl || null,
              source_type: s.sourceProvenance.sourceType || 'OTHER',
              is_official_government_source: false,
              verification_status: 'UNVERIFIED',
              source_notes: 'Imported from candidate CSV — not yet checked against an official document.',
            });
          }
          // Carry required documents.
          if (s.requiredDocuments?.length) {
            await client.from('scheme_document_requirements').insert(
              s.requiredDocuments.map((d) => ({ scheme_id: newId, document_label: d })),
            );
          }
          ok++;
        } catch (e) {
          failures.push(`${s.name}: ${e instanceof Error ? e.message : 'insert failed'}`);
        }
      }

      await writeAudit(client, identity, {
        action: 'scheme_import_queued',
        resourceType: 'import',
        summary: `Queued ${ok} candidate scheme(s) for review from "${fileName ?? 'file'}". ${failures.length ? `${failures.length} failed.` : ''} Reason: ${reason ?? '—'}`,
        metadata: { file: fileName, queued: ok, failures, reason: reason ?? null },
      });
      if (failures.length) {
        toast.push('error', `${ok} queued, ${failures.length} failed. See audit log for details.`);
      } else {
        toast.push('success', `${ok} candidate scheme(s) queued as drafts.`);
      }
      setCandidates((prev) => prev.filter((c) => !(c.selected && c.valid && !c.duplicate)));
      setConfirmQueue(false);
      void loadCatalogSize();
    } finally {
      setQueueBusy(false);
    }
  };

  const candidateColumns: Column<CandidateView>[] = [
    {
      key: 'sel',
      header: '',
      render: (c) => {
        const selectable = c.valid && !c.duplicate;
        return (
          <input
            type="checkbox"
            disabled={!selectable}
            checked={c.selected}
            onChange={() =>
              setCandidates((prev) => prev.map((p) => (p.ckey === c.ckey ? { ...p, selected: !p.selected } : p)))
            }
            className="w-4 h-4 accent-[#0F6B4C]"
            aria-label={`Select ${c.scheme.name}`}
          />
        );
      },
    },
    {
      key: 'name',
      header: 'Candidate',
      render: (c) => (
        <div>
          <div className="font-semibold text-sm">{c.scheme.name || c.scheme.id}</div>
          <div className="text-[11px] text-gray-400 font-mono">{c.scheme.id}</div>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'Scope',
      render: (c) => (
        <span className="text-xs text-gray-600">
          {c.scheme.scope ?? '—'} · {(c.scheme.applicableStates ?? []).join(', ') || 'All states'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Result',
      render: (c) => (
        <div className="flex flex-col gap-1 items-start">
          {c.duplicate ? (
            <Badge tone="amber">duplicate — {c.duplicate.duplicateType}</Badge>
          ) : c.valid ? (
            <Badge tone="green">valid</Badge>
          ) : (
            <Badge tone="red">quarantined</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'detail',
      header: 'Detail',
      render: (c) => (
        <div className="text-xs text-gray-500 max-w-xs">
          {c.duplicate && <div className="mb-1">{c.duplicate.notes}</div>}
          {c.issues.slice(0, 3).map((is2, i) => (
            <div key={i} className="text-red-600">• {is2}</div>
          ))}
          {c.issues.length > 3 && <div>…and {c.issues.length - 3} more</div>}
        </div>
      ),
    },
  ];

  const selectable = candidates.filter((c) => c.valid && !c.duplicate);

  return (
    <div>
      <PageHeader
        title="Sync Center"
        description="Import candidate scheme data through the deterministic pipeline. Queued schemes always enter as drafts — never auto-published."
      />
      {!canImport && (
        <AlertBanner tone="red" className="mb-4">
          Your role ({identity?.role ?? 'unknown'}) cannot run imports. Only admins and super admins can.
        </AlertBanner>
      )}
      <Tabs
        tabs={[
          { key: 'import', label: 'Import CSV' },
          { key: 'history', label: 'Import history' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'import' && (
        <>
          <AlertBanner tone="blue" className="mb-4">
            This runs the same deterministic pipeline that seeded the catalog — CSV parse →
            normalize → deduplicate against the <b>live catalog</b> ({catalogSize ?? '…'} schemes) →
            schema validation. Candidates from third-party datasets enter with a{' '}
            <b>UNVERIFIED</b> trust profile. <b>Stale data is never treated as false</b> here:
            quarantined records stay visible for fixing, they are not silently dropped.
          </AlertBanner>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <Btn variant="secondary" onClick={() => fileRef.current?.click()} disabled={!canImport}>
                <Upload size={15} /> Choose CSV file
              </Btn>
              {fileName && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={15} className="text-gray-400" /> {fileName}
                </span>
              )}
              <Btn variant="primary" onClick={() => void runImport()} disabled={!canImport || !csvText || running}>
                <Play size={15} /> {running ? 'Running pipeline…' : 'Run pipeline'}
              </Btn>
            </div>
            <details className="mt-4 text-xs text-gray-500">
              <summary className="cursor-pointer font-semibold text-gray-600">Expected CSV columns</summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TEMPLATE_COLUMNS.map((c) => (
                  <code key={c} className="font-mono bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">{c}</code>
                ))}
              </div>
              <p className="mt-2">
                Header row is case-insensitive; unknown extra columns are ignored. Multi-line
                descriptions must be quoted (RFC-4180). No government API is involved — this is
                a batch dataset import.
              </p>
            </details>
          </div>

          {report && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <Stat label="Raw records" value={report.totalRawRecords} tone="blue" />
                <Stat label="Valid" value={report.totalValidRecords} tone="green" />
                <Stat label="Quarantined" value={report.quarantinedCount} tone={report.quarantinedCount ? 'red' : 'gray'} />
                <Stat label="Potential duplicates" value={report.potentialDuplicatesCount} tone={report.potentialDuplicatesCount ? 'amber' : 'gray'} />
                <Stat label="Normalized" value={report.successfullyNormalized} tone="gray" />
              </div>

              {selectable.length > 0 && canImport && (
                <div className="flex items-center gap-3 mb-3 bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                  <span className="font-semibold">
                    {selectable.filter((c) => c.selected).length} of {selectable.length} valid candidates selected
                  </span>
                  <button
                    className="text-xs font-semibold text-[#0F6B4C] hover:underline"
                    onClick={() => setCandidates((prev) => prev.map((c) => (c.valid && !c.duplicate ? { ...c, selected: true } : c)))}
                  >
                    Select all valid
                  </button>
                  <button
                    className="text-xs text-gray-500 hover:underline"
                    onClick={() => setCandidates((prev) => prev.map((c) => ({ ...c, selected: false })))}
                  >
                    Clear
                  </button>
                  <Btn
                    variant="primary"
                    className="ml-auto"
                    disabled={selectable.filter((c) => c.selected).length === 0}
                    onClick={() => setConfirmQueue(true)}
                  >
                    Queue selected for review
                  </Btn>
                </div>
              )}

              <DataTable
                columns={candidateColumns}
                rows={candidates}
                keyOf={(c) => c.ckey}
                loading={false}
                emptyTitle="No candidates"
              />

              <AlertBanner tone="gray" className="mt-4">
                <ShieldAlert size={14} className="inline mr-1 -mt-0.5" />
                Queued candidates become <b>draft</b> schemes with <b>UNVERIFIED</b> trust. They
                appear in the Review queue, then need verification and publishing before any user
                can see them. Duplicates and quarantined records cannot be queued from here.
              </AlertBanner>
            </>
          )}
        </>
      )}

      {tab === 'history' && (
        historyLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 animate-pulse">Loading…</div>
        ) : history.length === 0 ? (
          <EmptyState title="No imports recorded" hint="Import runs through this console are logged here." />
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={h.action === 'scheme_import_queued' ? 'green' : 'blue'}>
                    {h.action === 'scheme_import_queued' ? 'queued' : 'run'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {h.actor_role ?? 'admin'} · {timeAgo(h.created_at)} · {formatDate(h.created_at)}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mt-1.5">{h.summary}</div>
                {h.metadata && Object.keys(h.metadata).length > 0 && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-gray-500 font-semibold">Details</summary>
                    <pre className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-2.5 overflow-x-auto text-[11px]">
                      {JSON.stringify(h.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )
      )}

      <ConfirmDialog
        open={confirmQueue}
        title="Queue these candidates for review?"
        body={
          <span>
            <b>{selectable.filter((c) => c.selected).length}</b> candidate(s) will be created as{' '}
            <Badge tone="gray">draft</Badge> + <Badge tone="amber">UNVERIFIED</Badge> schemes,
            with their provenance and document rows attached. Nothing becomes public.
          </span>
        }
        confirmLabel="Queue for review"
        busy={queueBusy}
        requireReason
        onConfirm={(reason) => void queueSelected(reason)}
        onCancel={() => setConfirmQueue(false)}
      />
    </div>
  );
};
