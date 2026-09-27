/**
 * YOJANA SETU — ADMIN CONSOLE app shell.
 * Separate entry point from the user app (see admin.html). Hash-routed so it
 * works behind the single /admin rewrite without touching the user app.
 */
import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, LogOut } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from './auth/AdminAuthContext';
import { LoginPage } from './auth/LoginPage';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ui';
import { parseHash, type Route } from './components/router';
import { can, type AdminAction } from './lib/permissions';
import { EmptyState, Btn } from './components/ui';

import { Dashboard } from './pages/Dashboard';
import { Schemes } from './pages/Schemes';
import { SchemeDetail } from './pages/SchemeDetail';
import { SchemeEditor } from './pages/SchemeEditor';
import { Reviews } from './pages/Reviews';
import { Eligibility } from './pages/Eligibility';
import { Documents } from './pages/Documents';
import { Sources } from './pages/Sources';
import { SyncCenter } from './pages/SyncCenter';
import { Users } from './pages/Users';
import { Applications } from './pages/Applications';
import { EligibilityChecks } from './pages/EligibilityChecks';
import { AuditLogs } from './pages/AuditLogs';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { Admins } from './pages/Admins';

function Denied({ action }: { action: AdminAction }) {
  return (
    <EmptyState
      title="Not permitted"
      hint={`Your role does not include the "${action}" permission. Ask a Super Admin if you need it.`}
    />
  );
}

function RoutedPage({ route }: { route: Route }) {
  const { identity } = useAdminAuth();
  const role = identity?.role ?? null;
  const gate = (action: AdminAction, el: React.ReactNode) =>
    can(role, action) ? el : <Denied action={action} />;

  const { page, param, sub } = route;
  switch (page) {
    case 'dashboard':
      return <>{gate('view_dashboard', <Dashboard />)}</>;
    case 'schemes':
      if (param === 'new') return <>{gate('edit_schemes', <SchemeEditor />)}</>;
      if (param && sub === 'edit') return <>{gate('edit_schemes', <SchemeEditor id={param} />)}</>;
      if (param) return <>{gate('view_schemes', <SchemeDetail id={param} />)}</>;
      return <>{gate('view_schemes', <Schemes />)}</>;
    case 'reviews':
      return <>{gate('verify_schemes', <Reviews />)}</>;
    case 'eligibility':
      return <>{gate('view_schemes', <Eligibility />)}</>;
    case 'documents':
      return <>{gate('view_schemes', <Documents />)}</>;
    case 'sources':
      return <>{gate('view_schemes', <Sources />)}</>;
    case 'sync':
      return <>{gate('run_import', <SyncCenter />)}</>;
    case 'users':
      return <>{gate('view_users', <Users />)}</>;
    case 'applications':
      return <>{gate('view_applications', <Applications />)}</>;
    case 'checks':
      return <>{gate('view_checks', <EligibilityChecks />)}</>;
    case 'audit':
      return <>{gate('view_audit', <AuditLogs />)}</>;
    case 'health':
      return <>{gate('view_dashboard', <SystemHealth />)}</>;
    case 'settings':
      return <>{gate('view_dashboard', <Settings />)}</>;
    case 'admins':
      return <>{gate('manage_admins', <Admins />)}</>;
    default:
      return (
        <EmptyState
          title="Page not found"
          hint="The address you opened does not exist in the Admin Console."
          action={<Btn onClick={() => (window.location.hash = '#/dashboard')}>Go to Dashboard</Btn>}
        />
      );
  }
}

const Shell: React.FC = () => {
  const { status, signOut } = useAdminAuth();
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const h = () => setRoute(parseHash());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 text-sm">
          <ShieldCheck size={20} className="text-[#0F6B4C] animate-pulse" />
          Loading Admin Console…
        </div>
      </div>
    );
  }

  if (status === 'no-backend') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl border border-amber-200 p-8">
          <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
            <AlertTriangle size={18} /> Backend not configured
          </div>
          <p className="text-sm text-gray-600">
            Set <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to use the Admin
            Console.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'signed-out') return <LoginPage />;

  if (status === 'not-admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <ShieldCheck size={28} className="mx-auto text-gray-300 mb-3" />
          <h1 className="font-extrabold text-lg">Not an administrator</h1>
          <p className="text-sm text-gray-500 mt-2">
            You are signed in, but this account has no admin role. Ask a Super Admin to add you to{' '}
            <code className="bg-gray-100 px-1 rounded">ys_admins</code>.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout page={route.page}>
      <RoutedPage route={route} />
    </Layout>
  );
};

export const AdminApp: React.FC = () => (
  <AdminAuthProvider>
    <ToastProvider>
      <Shell />
    </ToastProvider>
  </AdminAuthProvider>
);
