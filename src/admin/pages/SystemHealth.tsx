/**
 * YOJANA SETU — ADMIN CONSOLE system health.
 * Read-only probes. Every check reports what it actually measured —
 * "not configured" is a valid, honest result, never a fake green light.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { PageHeader, Btn, Badge, useToast, AlertBanner } from '../components/ui';
import { formatDate } from '../lib/format';

interface Check {
  name: string;
  detail: string;
  status: 'ok' | 'warn' | 'fail';
}

const iconFor = (s: Check['status']) =>
  s === 'ok' ? (
    <CheckCircle2 size={16} className="text-emerald-600" />
  ) : s === 'warn' ? (
    <MinusCircle size={16} className="text-amber-600" />
  ) : (
    <XCircle size={16} className="text-red-600" />
  );

export const SystemHealth: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  const run = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const out: Check[] = [];
    const push = (c: Check) => out.push(c);

    // 1. Auth/session
    try {
      const { data } = await client.auth.getSession();
      push({
        name: 'Supabase auth session',
        detail: data.session ? `Signed in as ${identity?.email ?? 'admin'}` : 'No active session',
        status: data.session ? 'ok' : 'fail',
      });
    } catch (e) {
      push({ name: 'Supabase auth session', detail: `Check failed: ${e instanceof Error ? e.message : '?'}`, status: 'fail' });
    }

    // 2. Admin tables present (migrations 018–020)
    for (const t of ['ys_admins', 'ys_admin_audit_logs', 'ys_settings']) {
      try {
        const { error } = await client.from(t).select('*', { head: true, count: 'exact' }).limit(1);
        if (error) throw error;
        push({ name: `Table ${t}`, detail: 'Reachable', status: 'ok' });
      } catch (e) {
        push({
          name: `Table ${t}`,
          detail: `Not reachable — migration may not be applied: ${e instanceof Error ? e.message : '?'}`,
          status: 'fail',
        });
      }
    }

    // 3. Catalog tables
    for (const t of ['schemes', 'scheme_sources', 'scheme_eligibility_rules', 'scheme_document_requirements', 'scheme_funding', 'scheme_application_info']) {
      try {
        const { count, error } = await client.from(t).select('*', { head: true, count: 'exact' });
        if (error) throw error;
        push({ name: `Table ${t}`, detail: `${count ?? '?'} rows`, status: 'ok' });
        setCounts((prev) => ({ ...prev, [t]: count ?? null }));
      } catch (e) {
        push({ name: `Table ${t}`, detail: `Not reachable: ${e instanceof Error ? e.message : '?'}`, status: 'warn' });
        setCounts((prev) => ({ ...prev, [t]: null }));
      }
    }

    // 4. User-domain tables (expected read-only)
    for (const t of ['profiles', 'user_profiles', 'match_runs', 'saved_schemes', 'applications']) {
      try {
        const { error } = await client.from(t).select('*', { head: true }).limit(1);
        if (error) throw error;
        push({ name: `Table ${t} (read)`, detail: 'Readable', status: 'ok' });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '?';
        push({
          name: `Table ${t} (read)`,
          detail: /permission|denied|policy/i.test(msg)
            ? `Not granted to role "${identity?.role ?? '?'}".`
            : `Not reachable: ${msg}`,
          status: 'warn',
        });
      }
    }

    // 5. Admin role resolution
    try {
      const { data, error } = await client.from('ys_admins').select('role').eq('user_id', identity?.userId ?? '').maybeSingle();
      if (error) throw error;
      push({
        name: 'Admin role resolution',
        detail: data ? `Resolved role: ${(data as { role: string }).role}` : 'No admin row for this user',
        status: data ? 'ok' : 'fail',
      });
    } catch (e) {
      push({ name: 'Admin role resolution', detail: `Check failed: ${e instanceof Error ? e.message : '?'}`, status: 'fail' });
    }

    // 6. Client configuration
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    push({
      name: 'Supabase configuration',
      detail: url && key ? `URL configured (${url.slice(0, 32)}…), anon key present` : 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      status: url && key ? 'ok' : 'fail',
    });

    setChecks(out);
    setLoading(false);
  }, [client, identity]);

  useEffect(() => {
    void run();
  }, [run]);

  const okCount = checks.filter((c) => c.status === 'ok').length;

  return (
    <div>
      <PageHeader
        title="System health"
        description="Read-only backend probes. Run any time — these never write."
        actions={
          <Btn variant="secondary" onClick={() => void run()} disabled={loading}>
            <RefreshCw size={14} /> Re-run checks
          </Btn>
        }
      />
      <AlertBanner tone="blue" className="mb-4">
        Health here means <b>reachability + configuration</b> of the real backend. It is not a
        substitute for the Supabase dashboard's infrastructure monitoring.
      </AlertBanner>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 animate-pulse">
          Running probes…
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Badge tone={okCount === checks.length ? 'green' : 'amber'}>
              {okCount} / {checks.length} checks passing
            </Badge>
            <span className="text-xs text-gray-400">Last run: {formatDate(new Date().toISOString())}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {checks.map((c) => (
              <div key={c.name} className="flex items-start gap-3 px-5 py-3.5">
                {iconFor(c.status)}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500 break-words">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(counts).map(([t, n]) => (
              <div key={t} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xl font-extrabold">{n == null ? '—' : n}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 font-mono">{t}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
