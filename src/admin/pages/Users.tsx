/**
 * YOJANA SETU — ADMIN CONSOLE user management (read-only).
 * Admins can inspect accounts to help users; they cannot edit, delete or
 * impersonate. Support staff see masked contact details.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  SearchInput,
  DataTable,
  Pagination,
  Badge,
  Modal,
  useToast,
  AlertBanner,
  type Column,
} from '../components/ui';
import { can } from '../lib/permissions';
import { formatDate, timeAgo } from '../lib/format';

const PAGE_SIZE = 25;

interface ProfileRow {
  user_id: string;
  email: string | null;
  display_name: string;
  mobile: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

interface UserDetail {
  profile: Record<string, unknown> | null;
  state: string | null;
  category: string | null;
  business_type: string | null;
  district: string | null;
  savedCount: number;
  appCount: number;
  runCount: number;
}

const maskEmail = (e: string | null) => {
  if (!e) return '—';
  const [local, domain] = e.split('@');
  if (!domain) return '•••';
  return `${(local ?? '').slice(0, 2)}•••@${domain}`;
};
const maskMobile = (m: string | null) => (m ? `••••••${m.slice(-4)}` : '—');

export const Users: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [detailUser, setDetailUser] = useState<ProfileRow | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const piiMasked = identity?.role === 'support';

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      let q = client.from('profiles').select(
        'user_id, email, display_name, mobile, preferred_language, created_at, updated_at',
        { count: 'exact' },
      );
      const term = search.trim();
      if (term) q = q.or(`email.ilike.%${term}%,display_name.ilike.%${term}%`);
      const { data, error, count: c } = await q
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      setRows((data ?? []) as ProfileRow[]);
      setTotal(c ?? 0);
      setDenied(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      if (/permission|denied|policy/i.test(msg)) {
        setDenied(true);
      } else {
        toast.push('error', `Users load failed: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }, [client, search, page, toast]);

  useEffect(() => {
    const t = setTimeout(() => void fetchRows(), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchRows, search]);

  const openDetail = async (u: ProfileRow) => {
    if (!client) return;
    setDetailUser(u);
    setDetail(null);
    setDetailLoading(true);
    try {
      const [upR, svR, apR, mrR] = await Promise.all([
        client.from('user_profiles').select('profile, state, category, business_type, district').eq('user_id', u.user_id).maybeSingle(),
        client.from('saved_schemes').select('scheme_id', { count: 'exact', head: true }).eq('user_id', u.user_id),
        client.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', u.user_id),
        client.from('match_runs').select('id', { count: 'exact', head: true }).eq('user_id', u.user_id),
      ]);
      const up = upR.data as { profile: unknown; state: string | null; category: string | null; business_type: string | null; district: string | null } | null;
      setDetail({
        profile: (up?.profile as Record<string, unknown> | null) ?? null,
        state: up?.state ?? null,
        category: up?.category ?? null,
        business_type: up?.business_type ?? null,
        district: up?.district ?? null,
        savedCount: svR.count ?? 0,
        appCount: apR.count ?? 0,
        runCount: mrR.count ?? 0,
      });
    } catch (e) {
      toast.push('error', `Detail load failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: Column<ProfileRow>[] = [
    {
      key: 'user',
      header: 'User',
      render: (r) => (
        <button onClick={() => void openDetail(r)} className="text-left hover:text-[#0F6B4C] group">
          <div className="font-semibold group-hover:underline">{r.display_name || 'Unnamed'}</div>
          <div className="text-[11px] text-gray-400">
            {piiMasked ? maskEmail(r.email) : r.email ?? '—'}
          </div>
        </button>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (r) => (
        <span className="text-sm text-gray-600 font-mono">
          {piiMasked ? maskMobile(r.mobile) : r.mobile ?? '—'}
        </span>
      ),
    },
    {
      key: 'lang',
      header: 'Language',
      render: (r) => <Badge tone="gray">{r.preferred_language || '—'}</Badge>,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (r) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(r.created_at)}</span>,
    },
    {
      key: 'active',
      header: 'Last active',
      render: (r) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(r.updated_at)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Registered accounts. Read-only — support conversations, not surveillance. Contact details are masked for support staff."
      />
      {piiMasked && (
        <AlertBanner tone="amber" className="mb-4">
          Your support role hides full email and mobile. You can still identify accounts by display
          name and help with scheme/application questions.
        </AlertBanner>
      )}
      {denied && (
        <AlertBanner tone="red" className="mb-4">
          This database has not granted your role access to user profiles yet (or the user tables
          are not configured). Showing nothing rather than guessing.
        </AlertBanner>
      )}
      <div className="flex gap-2.5 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by email or name…" className="w-80" />
      </div>
      {!denied && (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            keyOf={(r) => r.user_id}
            loading={loading}
            emptyTitle="No users found"
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      <Modal open={detailUser != null} title="User detail" onClose={() => setDetailUser(null)} wide>
        {detailUser && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-[#0F6B4C]/10 flex items-center justify-center">
                <UserIcon size={20} className="text-[#0F6B4C]" />
              </div>
              <div>
                <div className="font-bold">{detailUser.display_name || 'Unnamed'}</div>
                <div className="text-xs text-gray-500 font-mono">
                  {piiMasked ? maskEmail(detailUser.email) : detailUser.email ?? 'no email'} · joined {formatDate(detailUser.created_at)}
                </div>
              </div>
            </div>
            {detailLoading ? (
              <div className="text-sm text-gray-400 animate-pulse">Loading activity…</div>
            ) : detail ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl border border-gray-200 p-3.5 text-center">
                    <div className="text-xl font-extrabold">{detail.runCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Eligibility runs</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3.5 text-center">
                    <div className="text-xl font-extrabold">{detail.savedCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Saved schemes</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3.5 text-center">
                    <div className="text-xl font-extrabold">{detail.appCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Tracked applications</div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Profile extract
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {[
                    ['State', detail.state],
                    ['Category', detail.category],
                    ['Business type', detail.business_type],
                    ['District', detail.district],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="text-[11px] text-gray-400">{k}</div>
                      <div className="font-medium">{(v as string) ?? '—'}</div>
                    </div>
                  ))}
                </div>
                <AlertBanner tone="gray" className="mt-4">
                  Full profile JSON is not shown here — support rarely needs it, and it contains
                  the user's personal answers. Eligibility runs are computed client-side; only
                  compact summaries are stored.
                </AlertBanner>
              </>
            ) : (
              <div className="text-sm text-gray-400">Could not load detail.</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
