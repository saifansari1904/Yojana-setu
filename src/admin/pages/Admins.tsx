/**
 * YOJANA SETU — ADMIN CONSOLE admin management.
 * SUPER_ADMIN only. Admins are DISABLED, never deleted — the audit history
 * keeps a record of everyone who ever held power here.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, ShieldOff, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  DataTable,
  Badge,
  Btn,
  Modal,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  useToast,
  AlertBanner,
  ConfirmDialog,
  type Column,
} from '../components/ui';
import { writeAudit } from '../lib/audit';
import { formatDate, timeAgo } from '../lib/format';

interface AdminRow {
  user_id: string;
  role: string;
  created_at: string;
  created_by: string | null;
  disabled: boolean;
  note: string | null;
}

const ROLES = ['super_admin', 'admin', 'reviewer', 'support'];

const roleTone = (r: string): 'red' | 'blue' | 'amber' | 'gray' =>
  r === 'super_admin' ? 'red' : r === 'admin' ? 'blue' : r === 'reviewer' ? 'amber' : 'gray';

export const Admins: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('reviewer');
  const [newNote, setNewNote] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  const [toggleRow, setToggleRow] = useState<AdminRow | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [roleRow, setRoleRow] = useState<AdminRow | null>(null);
  const [roleValue, setRoleValue] = useState('');
  const [roleBusy, setRoleBusy] = useState(false);

  const isSuper = identity?.role === 'super_admin';

  const fetchRows = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client
        .from('ys_admins')
        .select('user_id, role, created_at, created_by, disabled, note')
        .order('created_at');
      if (error) throw error;
      setRows((data ?? []) as AdminRow[]);
      setDenied(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      if (/permission|denied|policy|relation.*does not exist/i.test(msg)) setDenied(true);
      else toast.push('error', `Admins load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const uuidOk = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());

  const addAdmin = async (reason?: string) => {
    if (!client || !identity || !uuidOk(newUserId)) {
      if (!uuidOk(newUserId)) toast.push('error', 'User id must be a valid UUID from Supabase Auth.');
      return;
    }
    setAddBusy(true);
    try {
      const { error } = await client.from('ys_admins').insert({
        user_id: newUserId.trim(),
        role: newRole,
        created_by: identity.userId,
        note: newNote.trim() || null,
      });
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'admin_added',
        resourceType: 'admin',
        resourceId: newUserId.trim(),
        summary: `Admin added: ${newUserId.trim()} as ${newRole}. Reason: ${reason ?? '—'}`,
        newValue: { role: newRole, note: newNote.trim() || null },
        metadata: { reason: reason ?? null },
      });
      toast.push('success', 'Admin added.');
      setAddOpen(false);
      setNewUserId(''); setNewRole('reviewer'); setNewNote('');
      void fetchRows();
    } catch (e) {
      toast.push('error', `Add failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setAddBusy(false);
    }
  };

  const toggleDisabled = async (reason?: string) => {
    if (!client || !identity || !toggleRow) return;
    if (toggleRow.user_id === identity.userId) {
      toast.push('error', 'You cannot disable your own account.');
      return;
    }
    setToggleBusy(true);
    try {
      const { error } = await client
        .from('ys_admins')
        .update({ disabled: !toggleRow.disabled })
        .eq('user_id', toggleRow.user_id);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: toggleRow.disabled ? 'admin_enabled' : 'admin_disabled',
        resourceType: 'admin',
        resourceId: toggleRow.user_id,
        summary: `Admin ${toggleRow.disabled ? 'enabled' : 'disabled'}: ${toggleRow.user_id} (${toggleRow.role}). Reason: ${reason ?? '—'}`,
        previousValue: { disabled: toggleRow.disabled },
        newValue: { disabled: !toggleRow.disabled },
        metadata: { reason: reason ?? null },
      });
      toast.push('success', toggleRow.disabled ? 'Admin enabled.' : 'Admin disabled.');
      setToggleRow(null);
      void fetchRows();
    } catch (e) {
      toast.push('error', `Update failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setToggleBusy(false);
    }
  };

  const changeRole = async (reason?: string) => {
    if (!client || !identity || !roleRow) return;
    if (roleRow.user_id === identity.userId && roleValue !== 'super_admin') {
      toast.push('error', 'You cannot demote yourself — another super_admin must do it.');
      return;
    }
    setRoleBusy(true);
    try {
      const { error } = await client
        .from('ys_admins')
        .update({ role: roleValue })
        .eq('user_id', roleRow.user_id);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: 'admin_role_changed',
        resourceType: 'admin',
        resourceId: roleRow.user_id,
        summary: `Admin role changed: ${roleRow.user_id} ${roleRow.role} → ${roleValue}. Reason: ${reason ?? '—'}`,
        previousValue: { role: roleRow.role },
        newValue: { role: roleValue },
        metadata: { reason: reason ?? null },
      });
      toast.push('success', 'Role updated.');
      setRoleRow(null);
      void fetchRows();
    } catch (e) {
      toast.push('error', `Update failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setRoleBusy(false);
    }
  };

  const columns: Column<AdminRow>[] = [
    {
      key: 'user',
      header: 'Admin',
      render: (r) => (
        <div>
          <div className="font-mono text-[12px]">{r.user_id}</div>
          {r.note && <div className="text-xs text-gray-500">{r.note}</div>}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Badge tone={roleTone(r.role)}>{r.role}</Badge>
          {isSuper && (
            <button
              className="text-[11px] font-semibold text-[#0F6B4C] hover:underline"
              onClick={() => { setRoleRow(r); setRoleValue(r.role); }}
            >
              change
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={r.disabled ? 'red' : 'green'}>{r.disabled ? 'disabled' : 'active'}</Badge>,
    },
    {
      key: 'since',
      header: 'Since',
      render: (r) => <span className="text-xs text-gray-500 whitespace-nowrap" title={formatDate(r.created_at)}>{timeAgo(r.created_at)}</span>,
    },
    ...(isSuper
      ? [
          {
            key: 'actions',
            header: '',
            render: (r: AdminRow) => (
              <button
                onClick={() => setToggleRow(r)}
                className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${
                  r.disabled ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {r.disabled ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                {r.disabled ? 'Enable' : 'Disable'}
              </button>
            ),
          } as Column<AdminRow>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Who can operate this console. Managed by super_admins; every change is audit-logged."
        actions={
          isSuper ? (
            <Btn variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add admin
            </Btn>
          ) : undefined
        }
      />
      {!isSuper && (
        <AlertBanner tone="gray" className="mb-4">
          Only super_admins can change the admin roster. You are viewing it read-only.
        </AlertBanner>
      )}
      {denied && (
        <AlertBanner tone="red" className="mb-4">
          The admin table (<code className="font-mono">ys_admins</code>) is not reachable —
          migration 018 may not be applied yet.
        </AlertBanner>
      )}
      {!denied && (
        <DataTable
          columns={columns}
          rows={rows}
          keyOf={(r) => r.user_id}
          loading={loading}
          emptyTitle="No admins"
          emptyHint="Bootstrap the first super_admin in the Supabase SQL editor (see migration 018)."
        />
      )}

      <Modal open={addOpen} title="Add admin" onClose={() => setAddOpen(false)}>
        <AlertBanner tone="blue" className="mb-4">
          The user id is the <b>auth.users UID</b> — copy it from Supabase Dashboard →
          Authentication → Users. The person must already have a Yojana Setu account.
        </AlertBanner>
        <Field label="Auth user id (UUID) *">
          <TextInput value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className="font-mono" />
        </Field>
        <Field label="Role">
          <SelectInput value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </SelectInput>
        </Field>
        <Field label="Note">
          <TextArea rows={2} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Who is this and why do they get access?" />
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => void addAdmin()} disabled={addBusy || !uuidOk(newUserId)}>
            {addBusy ? 'Adding…' : 'Add admin'}
          </Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={toggleRow != null}
        title={`${toggleRow?.disabled ? 'Enable' : 'Disable'} this admin?`}
        body={
          <span>
            <span className="font-mono text-xs">{toggleRow?.user_id}</span> ({toggleRow?.role}) will be{' '}
            {toggleRow?.disabled ? 're-enabled' : 'disabled — they lose console access immediately'}.
            The row is kept for history.
          </span>
        }
        confirmLabel={toggleRow?.disabled ? 'Enable' : 'Disable'}
        danger={!toggleRow?.disabled}
        busy={toggleBusy}
        requireReason
        onConfirm={(reason) => void toggleDisabled(reason)}
        onCancel={() => setToggleRow(null)}
      />

      <ConfirmDialog
        open={roleRow != null}
        title="Change admin role?"
        body={
          <span className="block">
            <span className="font-mono text-xs">{roleRow?.user_id}</span>
            <SelectInput value={roleValue} onChange={(e) => setRoleValue(e.target.value)} className="mt-3 w-full">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </SelectInput>
          </span>
        }
        confirmLabel="Change role"
        busy={roleBusy}
        requireReason
        onConfirm={(reason) => void changeRole(reason)}
        onCancel={() => setRoleRow(null)}
      />
    </div>
  );
};
