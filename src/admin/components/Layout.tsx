/**
 * YOJANA SETU — ADMIN CONSOLE layout: sidebar nav, topbar, global search.
 * Nav items are filtered by the permission matrix — a role never sees
 * a section it cannot open.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  ClipboardCheck,
  SlidersHorizontal,
  FileText,
  Database,
  RefreshCw,
  Users,
  ClipboardList,
  Activity,
  ScrollText,
  HeartPulse,
  Settings,
  Search,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { can, ROLE_LABELS, type AdminAction } from '../lib/permissions';
import { cx, truncate } from '../lib/format';
import { go } from './router';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  action: AdminAction;
  match: (page: string) => boolean;
}

const NAV: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} />, action: 'view_dashboard', match: (p) => p === 'dashboard' },
  { path: 'schemes', label: 'Schemes', icon: <Layers size={17} />, action: 'view_schemes', match: (p) => p === 'schemes' },
  { path: 'reviews', label: 'Reviews', icon: <ClipboardCheck size={17} />, action: 'verify_schemes', match: (p) => p === 'reviews' },
  { path: 'eligibility', label: 'Eligibility', icon: <SlidersHorizontal size={17} />, action: 'view_schemes', match: (p) => p === 'eligibility' },
  { path: 'documents', label: 'Documents', icon: <FileText size={17} />, action: 'view_schemes', match: (p) => p === 'documents' },
  { path: 'sources', label: 'Sources', icon: <Database size={17} />, action: 'view_schemes', match: (p) => p === 'sources' },
  { path: 'sync', label: 'Sync Center', icon: <RefreshCw size={17} />, action: 'run_import', match: (p) => p === 'sync' },
  { path: 'users', label: 'Users', icon: <Users size={17} />, action: 'view_users', match: (p) => p === 'users' },
  { path: 'applications', label: 'Applications', icon: <ClipboardList size={17} />, action: 'view_applications', match: (p) => p === 'applications' },
  { path: 'checks', label: 'Eligibility Checks', icon: <Activity size={17} />, action: 'view_checks', match: (p) => p === 'checks' },
  { path: 'audit', label: 'Audit Logs', icon: <ScrollText size={17} />, action: 'view_audit', match: (p) => p === 'audit' },
  { path: 'health', label: 'System Health', icon: <HeartPulse size={17} />, action: 'view_dashboard', match: (p) => p === 'health' },
  { path: 'settings', label: 'Settings', icon: <Settings size={17} />, action: 'view_dashboard', match: (p) => p === 'settings' },
  { path: 'admins', label: 'Admins', icon: <ShieldCheck size={17} />, action: 'manage_admins', match: (p) => p === 'admins' },
];

interface SearchResults {
  schemes: Array<{ id: string; name: string }>;
  sources: Array<{ scheme_id: string; name: string }>;
  applications: Array<{ id: string; scheme_name: string }>;
  audits: Array<{ id: string; summary: string }>;
}

const GlobalSearch: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { client } = useAdminAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open ]);

  useEffect(() => {
    if (!open || !client) return;
    const query = q.trim();
    if (query.length < 2) {
      setResults(null);
      return;
    }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const like = `%${query}%`;
        const [s, src, apps, aud] = await Promise.all([
          client.from('schemes').select('id, official_name').ilike('official_name', like).limit(8),
          client.from('scheme_sources').select('scheme_id, source_name').ilike('source_name', like).limit(5),
          client.from('applications').select('id, scheme_name').ilike('scheme_name', like).limit(5),
          client.from('ys_admin_audit_logs').select('id, summary').ilike('summary', like).order('created_at', { ascending: false }).limit(5),
        ]);
        setResults({
          schemes: ((s.data ?? []) as Array<{ id: string; official_name: string | null }>).map((r) => ({
            id: r.id,
            name: r.official_name ?? r.id,
          })),
          sources: ((src.data ?? []) as Array<{ scheme_id: string; source_name: string | null }>).map((r) => ({
            scheme_id: r.scheme_id,
            name: r.source_name ?? r.scheme_id,
          })),
          applications: ((apps.data ?? []) as Array<{ id: string; scheme_name: string }>).map((r) => ({
            id: r.id,
            scheme_name: r.scheme_name,
          })),
          audits: ((aud.data ?? []) as Array<{ id: string; summary: string }>).map((r) => ({
            id: r.id,
            summary: r.summary,
          })),
        });
      } catch {
        setResults({ schemes: [], sources: [], applications: [], audits: [] });
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, open, client]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-4 first:mt-2">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400 px-1 mb-1">{title}</div>
      {children}
    </div>
  );

  const empty =
    results &&
    results.schemes.length === 0 &&
    results.sources.length === 0 &&
    results.applications.length === 0 &&
    results.audits.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-gray-100">
          <Search size={17} className="text-gray-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search schemes, sources, applications, audit logs…"
            className="flex-1 py-3.5 text-sm focus:outline-none"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-4 pb-4">
          {busy && <div className="py-6 text-center text-sm text-gray-400">Searching…</div>}
          {!busy && empty && (
            <div className="py-6 text-center text-sm text-gray-400">No matches for “{q}”.</div>
          )}
          {results && !busy && !empty && (
            <>
              {results.schemes.length > 0 && (
                <Section title="Schemes">
                  {results.schemes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { onClose(); go(`schemes/${r.id}`); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <span className="font-semibold">{truncate(r.name, 60)}</span>
                      <span className="text-gray-400 text-xs ml-2 font-mono">{r.id}</span>
                    </button>
                  ))}
                </Section>
              )}
              {results.sources.length > 0 && (
                <Section title="Sources">
                  {results.sources.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { onClose(); go('sources'); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <span className="font-semibold">{truncate(r.name, 60)}</span>
                      <span className="text-gray-400 text-xs ml-2">scheme {truncate(r.scheme_id, 24)}</span>
                    </button>
                  ))}
                </Section>
              )}
              {results.applications.length > 0 && (
                <Section title="Applications">
                  {results.applications.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { onClose(); go('applications'); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <span className="font-semibold">{truncate(r.scheme_name, 60)}</span>
                      <span className="text-gray-400 text-xs ml-2 font-mono">{r.id.slice(0, 8)}</span>
                    </button>
                  ))}
                </Section>
              )}
              {results.audits.length > 0 && (
                <Section title="Audit logs">
                  {results.audits.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { onClose(); go('audit'); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600"
                    >
                      {truncate(r.summary, 80)}
                    </button>
                  ))}
                </Section>
              )}
            </>
          )}
          {!results && !busy && (
            <div className="py-6 text-center text-xs text-gray-400">Type at least 2 characters to search.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Layout: React.FC<{ page: string; children: React.ReactNode }> = ({ page, children }) => {
  const { identity, signOut } = useAdminAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const role = identity?.role ?? null;

  const items = useMemo(() => NAV.filter((n) => can(role, n.action)), [role]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#101815] text-gray-300 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F6B4C] text-white flex items-center justify-center">
              <ShieldCheck size={19} />
            </div>
            <div>
              <div className="text-white font-extrabold text-sm leading-tight">Yojana Setu</div>
              <div className="text-[11px] text-gray-400">Admin Console</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {items.map((n) => {
            const active = n.match(page);
            return (
              <button
                key={n.path}
                onClick={() => go(n.path)}
                className={cx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-[#1C2B24] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
              >
                {n.icon}
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-400 truncate">{identity?.email ?? '—'}</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
            {role ? ROLE_LABELS[role] : ''}
          </div>
          <button
            onClick={() => void signOut()}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#F4F5F4]/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-center gap-3 px-4 md:px-8 py-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 max-w-xl flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-400 hover:border-gray-300"
            >
              <Search size={15} />
              <span>Search schemes, sources, applications, audit…</span>
              <kbd className="ml-auto text-[10px] bg-gray-100 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
            </button>
            <div className="ml-auto md:hidden flex items-center gap-2 text-xs font-bold">
              <ShieldCheck size={16} className="text-[#0F6B4C]" /> YS Admin
            </div>
          </div>
          {/* Mobile nav */}
          <nav className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2.5">
            {items.map((n) => (
              <button
                key={n.path}
                onClick={() => go(n.path)}
                className={cx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border',
                  n.match(page)
                    ? 'bg-[#0F6B4C] text-white border-[#0F6B4C]'
                    : 'bg-white text-gray-600 border-gray-200',
                )}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
