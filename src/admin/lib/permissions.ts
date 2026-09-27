/**
 * YOJANA SETU — ADMIN CONSOLE permission matrix.
 * This is the app-level enforcement. The database enforces the same
 * boundaries independently via RLS policies + the ys_enforce_reviewer_scope()
 * trigger (migration 020), so a crafted request cannot bypass the UI.
 */
import type { AdminRole } from './adminTypes';

export type AdminAction =
  | 'view_dashboard'
  | 'view_schemes'
  | 'edit_schemes'
  | 'verify_schemes'
  | 'publish_schemes'
  | 'edit_sources'
  | 'edit_documents'
  | 'run_import'
  | 'approve_import'
  | 'view_users'
  | 'view_applications'
  | 'view_checks'
  | 'view_audit'
  | 'manage_admins'
  | 'edit_settings';

const MATRIX: Record<AdminAction, AdminRole[]> = {
  view_dashboard: ['super_admin', 'admin', 'reviewer', 'support'],
  view_schemes: ['super_admin', 'admin', 'reviewer', 'support'],
  edit_schemes: ['super_admin', 'admin'],
  verify_schemes: ['super_admin', 'admin', 'reviewer'],
  publish_schemes: ['super_admin', 'admin'],
  edit_sources: ['super_admin', 'admin'],
  edit_documents: ['super_admin', 'admin'],
  run_import: ['super_admin', 'admin'],
  approve_import: ['super_admin', 'admin'],
  view_users: ['super_admin', 'admin', 'reviewer', 'support'],
  view_applications: ['super_admin', 'admin', 'reviewer', 'support'],
  view_checks: ['super_admin', 'admin', 'reviewer'],
  view_audit: ['super_admin', 'admin', 'reviewer', 'support'],
  manage_admins: ['super_admin'],
  edit_settings: ['super_admin', 'admin'],
};

export function can(role: AdminRole | null | undefined, action: AdminAction): boolean {
  if (!role) return false;
  return MATRIX[action].includes(role);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  reviewer: 'Reviewer',
  support: 'Support',
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full access, including admin management.',
  admin: 'Manages schemes, sources, imports and users. Cannot manage admins.',
  reviewer: 'Reviews and verifies schemes and data. Cannot publish or edit content.',
  support: 'Read-only inspection of schemes, users and applications.',
};
