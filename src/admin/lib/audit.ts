/**
 * YOJANA SETU — ADMIN CONSOLE audit writer.
 * Every consequential admin action writes one append-only row to
 * public.ys_admin_audit_logs. The table has no UPDATE/DELETE policies,
 * so history cannot be rewritten through the app.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminIdentity } from './adminTypes';

export interface AuditEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  summary: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  outcome?: 'success' | 'failure';
}

/**
 * Writes an audit row. Never throws: a failed audit write is reported to
 * the console and surfaced to the caller as false, but it never breaks
 * the admin action itself (the action already happened).
 */
export async function writeAudit(
  client: SupabaseClient,
  identity: AdminIdentity,
  entry: AuditEntry,
): Promise<boolean> {
  try {
    const { error } = await client.from('ys_admin_audit_logs').insert({
      actor_user_id: identity.userId,
      actor_role: identity.role,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      summary: entry.summary,
      previous_value: (entry.previousValue ?? null) as never,
      new_value: (entry.newValue ?? null) as never,
      metadata: (entry.metadata ?? null) as never,
      outcome: entry.outcome ?? 'success',
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[admin-audit] write failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[admin-audit] write threw:', e);
    return false;
  }
}
