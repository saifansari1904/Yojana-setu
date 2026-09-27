import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

export const LoginPage: React.FC = () => {
  const { status, signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'Sign-in failed.');
  };

  if (status === 'no-backend') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 text-amber-700 mb-3">
            <AlertTriangle size={22} />
            <h1 className="text-lg font-bold">Backend not configured</h1>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            The Admin Console needs the Supabase backend. Set{' '}
            <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your{' '}
            <code className="bg-gray-100 px-1 rounded">.env</code> (local) or Vercel environment
            variables (production), then reload.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,#E8F3EC,transparent)]">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0F6B4C] text-white mb-4 shadow-lg">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Yojana Setu Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Internal control center · authorized staff only</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-5">
          {error && (
            <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Admin email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/40 focus:border-[#0F6B4C]"
              placeholder="admin@example.org"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/40 focus:border-[#0F6B4C]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F6B4C] text-white font-semibold text-sm px-4 py-2.5 hover:bg-[#0C5A40] disabled:opacity-60 transition-colors"
          >
            <Lock size={15} />
            {busy ? 'Signing in…' : 'Sign in to Admin Console'}
          </button>
          <p className="text-[11px] text-gray-400 leading-relaxed text-center">
            Access is granted by a Super Admin via the <code>ys_admins</code> table.
            Every action you take is audit-logged.
          </p>
        </form>
      </div>
    </div>
  );
};
