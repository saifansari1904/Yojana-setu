/**
 * YOJANA SETU — ADMIN CONSOLE dashboard.
 * Every number comes from a live database query. Nothing is fabricated:
 * if a query fails, the card shows "unavailable" instead of a guess.
 */
import React, { useEffect, useState } from 'react';
import {
  Layers,
  BadgeCheck,
  AlertTriangle,
  Users,
  Activity,
  ClipboardList,
  Bookmark,
  Database,
  RefreshCw,
  FileWarning,
  Bell,
} from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  StatCard,
  Badge,
  PageHeader,
  AlertBanner,
  EmptyState,
  Btn,
} from '../components/ui';
import { go } from '../components/router';
import { timeAgo, daysBetween } from '../lib/format';
import type { AuditLogRow } from '../lib/adminTypes';

interface DashStats {
  totalSchemes: number | null;
  published: number | null;
  verified: number | null;
  unverified: number | null;
  inReview: number | null;
  drafts: number | null;
  incomplete: number | null;
  totalUsers: number | null;
  totalChecks: number | null;
  totalApplications: number | null;
  totalSaved: number | null;
  outdatedSources: number | null;
  missingSources: number | null;
  missingDocs: number | null;
  recentAudit: AuditLogRow[];
  failed: string[];
}

async function count(
  client: ReturnType<typeof useAdminAuth>['client'],
  table: string,
  filter?: (q: never) => never,
): Promise<number | null> {
  if (!client) return null;
  try {
    let q = client.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = filter(q as never) as typeof q;
    const { count: c, error } = await q;
    if (error) return null;
    return c ?? 0;
  } catch {
    return null;
  }
}

export const Dashboard: React.FC = () => {
  const { client } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<DashStats | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const failed: string[] = [];
      const eq = (col: string, v: string) => (q: { eq: (c: string, v: string) => unknown }) =>
        q.eq(col, v) as never;

      const [
        totalSchemes,
        published,
        verified,
        unverified,
        inReview,
        drafts,
        incomplete,
        totalUsers,
        totalChecks,
        totalApplications,
        totalSaved,
        settingsRes,
        sourcesRes,
        schemeIdsRes,
        docsRes,
      ] = await Promise.all([
        count(client, 'schemes'),
        count(client, 'schemes', eq('status', 'published')),
        count(client, 'schemes', eq('verification_status', 'VERIFIED')),
        count(client, 'schemes', eq('verification_status', 'UNVERIFIED')),
        count(client, 'schemes', eq('status', 'under_review')),
        count(client, 'schemes', eq('status', 'draft')),
        client
          .from('schemes')
          .select('id', { count: 'exact', head: true })
          .or('benefit_summary.is.null,description.is.null')
          .then((r) => (r.error ? null : (r.count ?? 0))),
        count(client, 'profiles'),
        count(client, 'match_runs'),
        count(client, 'applications'),
        count(client, 'saved_schemes'),
        client.from('ys_settings').select('key, value').eq('key', 'source_freshness').maybeSingle(),
        client.from('scheme_sources').select('scheme_id, last_verified_at'),
        client.from('schemes').select('id'),
        client.from('scheme_document_requirements').select('scheme_id'),
      ]);

      // Source freshness
      let outdatedSources: number | null = null;
      let missingSources: number | null = null;
      if (!sourcesRes.error && sourcesRes.data && schemeIdsRes.data) {
        const freshness = (settingsRes.data?.value ?? {}) as { due_days?: number };
        const dueDays = typeof freshness.due_days === 'number' ? freshness.due_days : 365;
        const withSource = new Set(
          (sourcesRes.data as Array<{ scheme_id: string }>).map((r) => r.scheme_id),
        );
        const now = new Date();
        outdatedSources = (sourcesRes.data as Array<{ last_verified_at: string | null }>).filter(
          (r) => {
            const d = daysBetween(r.last_verified_at, now);
            return d != null && d > dueDays;
          },
        ).length;
        missingSources = (schemeIdsRes.data as Array<{ id: string }>).filter(
          (r) => !withSource.has(r.id),
        ).length;
      } else {
        failed.push('scheme_sources');
      }

      // Schemes with no document requirements
      let missingDocs: number | null = null;
      if (!docsRes.error && docsRes.data && schemeIdsRes.data) {
        const withDocs = new Set(
          (docsRes.data as Array<{ scheme_id: string }>).map((r) => r.scheme_id),
        );
        missingDocs = (schemeIdsRes.data as Array<{ id: string }>).filter(
          (r) => !withDocs.has(r.id),
        ).length;
      }

      // Recent admin activity
      let recentAudit: AuditLogRow[] = [];
      try {
        const { data, error } = await client
          .from('ys_admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);
        if (!error && data) recentAudit = data as AuditLogRow[];
        else failed.push('ys_admin_audit_logs');
      } catch {
        failed.push('ys_admin_audit_logs');
      }

      if (!cancelled) {
        setS({
          totalSchemes,
          published,
          verified,
          unverified,
          inReview,
          drafts,
          incomplete,
          totalUsers,
          totalChecks,
          totalApplications,
          totalSaved,
          outdatedSources,
          missingSources,
          missingDocs,
          recentAudit,
          failed,
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const num = (v: number | null) => (v == null ? '—' : v.toLocaleString('en-IN'));

  const alerts: Array<{ tone: 'amber' | 'red' | 'green'; text: string; go: string }> = [];
  if (s) {
    if ((s.inReview ?? 0) > 0)
      alerts.push({ tone: 'amber', text: `${s.inReview} scheme(s) waiting for verification review`, go: 'reviews' });
    if ((s.outdatedSources ?? 0) > 0)
      alerts.push({ tone: 'amber', text: `${s.outdatedSources} government source(s) are outdated — re-verification required`, go: 'sources' });
    if ((s.missingSources ?? 0) > 0)
      alerts.push({ tone: 'amber', text: `${s.missingSources} scheme(s) have no recorded source`, go: 'sources' });
    if ((s.missingDocs ?? 0) > 0)
      alerts.push({ tone: 'amber', text: `${s.missingDocs} scheme(s) have no document requirements recorded`, go: 'documents' });
    if ((s.incomplete ?? 0) > 0)
      alerts.push({ tone: 'amber', text: `${s.incomplete} scheme record(s) missing benefit summary or description`, go: 'schemes' });
    if ((s.drafts ?? 0) > 0)
      alerts.push({ tone: 'amber', text: `${s.drafts} draft scheme(s) not yet submitted for review`, go: 'schemes' });
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live operational overview of the Yojana Setu platform. Every figure is queried from the database."
        actions={
          <Btn onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Refresh
          </Btn>
        }
      />

      {s?.failed && s.failed.length > 0 && (
        <AlertBanner tone="amber" className="mb-5">
          Some data was unavailable ({s.failed.join(', ')}). This usually means a migration has not
          been run yet or a table is missing — figures marked “—” were not guessed.
        </AlertBanner>
      )}

      {/* Alerts */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Needs attention</h2>
        </div>
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-400">
            Loading…
          </div>
        ) : alerts.length === 0 ? (
          <AlertBanner tone="green">All clear — no pending reviews, outdated sources or data gaps.</AlertBanner>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <button
                key={i}
                onClick={() => go(a.go)}
                className="w-full flex items-center gap-3 bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm hover:shadow-sm text-left"
              >
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span className="font-medium text-gray-800">{a.text}</span>
                <span className="ml-auto text-xs font-semibold text-[#0F6B4C]">Open →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Platform overview */}
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Platform overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total schemes" value={loading ? '…' : num(s?.totalSchemes ?? null)} icon={<Layers size={16} />} onClick={() => go('schemes')} />
        <StatCard label="Published" value={loading ? '…' : num(s?.published ?? null)} sub="visible to users" icon={<BadgeCheck size={16} />} tone="green" onClick={() => go('schemes')} />
        <StatCard label="Verified" value={loading ? '…' : num(s?.verified ?? null)} icon={<BadgeCheck size={16} />} tone="blue" />
        <StatCard label="Unverified" value={loading ? '…' : num(s?.unverified ?? null)} icon={<AlertTriangle size={16} />} tone="amber" onClick={() => go('reviews')} />
        <StatCard label="Users" value={loading ? '…' : num(s?.totalUsers ?? null)} icon={<Users size={16} />} onClick={() => go('users')} />
        <StatCard label="Eligibility checks" value={loading ? '…' : num(s?.totalChecks ?? null)} icon={<Activity size={16} />} onClick={() => go('checks')} />
        <StatCard label="Applications tracked" value={loading ? '…' : num(s?.totalApplications ?? null)} icon={<ClipboardList size={16} />} onClick={() => go('applications')} />
        <StatCard label="Saved schemes" value={loading ? '…' : num(s?.totalSaved ?? null)} icon={<Bookmark size={16} />} />
      </div>

      {/* Data health */}
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Data health</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Pending review" value={loading ? '…' : num(s?.inReview ?? null)} icon={<FileWarning size={16} />} tone="amber" onClick={() => go('reviews')} />
        <StatCard label="Outdated sources" value={loading ? '…' : num(s?.outdatedSources ?? null)} sub="past due threshold" icon={<Database size={16} />} tone="amber" onClick={() => go('sources')} />
        <StatCard label="Missing sources" value={loading ? '…' : num(s?.missingSources ?? null)} icon={<Database size={16} />} onClick={() => go('sources')} />
        <StatCard label="Missing documents" value={loading ? '…' : num(s?.missingDocs ?? null)} icon={<FileWarning size={16} />} onClick={() => go('documents')} />
      </div>

      {/* Recent activity */}
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Recent admin activity</h2>
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">Loading…</div>
      ) : !s || s.recentAudit.length === 0 ? (
        <EmptyState
          title="No admin activity yet"
          hint="Actions taken in this console (verifications, publishes, imports…) will appear here."
          action={<Btn onClick={() => go('audit')}>View audit logs</Btn>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {s.recentAudit.map((a) => (
            <button
              key={a.id}
              onClick={() => go('audit')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/60"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800 truncate">{a.summary || a.action}</div>
                <div className="text-xs text-gray-400">
                  {a.actor_role ?? 'admin'} · {a.resource_type}
                  {a.resource_id ? ` · ${a.resource_id.slice(0, 24)}` : ''} · {timeAgo(a.created_at)}
                </div>
              </div>
              <Badge tone={a.outcome === 'success' ? 'green' : 'red'}>{a.outcome}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
