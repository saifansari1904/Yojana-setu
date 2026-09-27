/**
 * YOJANA SETU — ADMIN CONSOLE shared types.
 * Mirrors the real database contracts (see src/lib/supabase/types.ts and
 * src/lib/data/cloudSchemeCatalog.ts). The admin console never invents
 * columns: every field below exists in the database.
 */

export type AdminRole = 'super_admin' | 'admin' | 'reviewer' | 'support';

export interface AdminIdentity {
  userId: string;
  email: string | null;
  role: AdminRole;
}

/** Lifecycle states for the schemes.status column (admin-managed). */
export type SchemeLifecycle =
  | 'draft'
  | 'under_review'
  | 'verified'
  | 'published'
  | 'rejected'
  | 'archived';

export const SCHEME_LIFECYCLE_ORDER: SchemeLifecycle[] = [
  'draft',
  'under_review',
  'verified',
  'published',
  'rejected',
  'archived',
];

/** Full schemes row as the admin console reads it (all statuses, not just published). */
export interface SchemeAdminRow {
  id: string;
  official_name: string | null;
  short_code: string | null;
  official_scheme_identifier: string | null;
  sponsoring_ministry: string | null;
  department: string | null;
  scheme_type: string | null;
  scope: string | null;
  benefit_summary: string | null;
  description: string | null;
  funding_range_text: string | null;
  metadata: {
    tags?: string[];
    categories?: string[];
    lifecycle_status?: string | null;
    retired_at?: string | null;
  } | null;
  raw_payload: Record<string, unknown> | null;
  status: string | null;
  verification_status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SourceAdminRow {
  scheme_id: string;
  source_name: string | null;
  source_type: string | null;
  official_source_url: string | null;
  is_official_government_source: boolean | null;
  priority_level: number | null;
  verification_status: string | null;
  last_verified_at: string | null;
  source_notes: string | null;
}

export interface RuleAdminRow {
  scheme_id: string;
  criterion_key: string;
  operator: string;
  value: unknown;
  is_mandatory: boolean | null;
}

export interface DocReqRow {
  scheme_id: string;
  document_label: string | null;
}

export interface FundingAdminRow {
  scheme_id: string;
  min_amount: number | null;
  max_amount: number | null;
}

export interface AppInfoAdminRow {
  scheme_id: string;
  application_mode: string | null;
  official_portal_url: string | null;
}

export interface AuditLogRow {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  summary: string;
  previous_value: unknown;
  new_value: unknown;
  metadata: unknown;
  outcome: string;
}

export interface AdminUserRow {
  user_id: string;
  role: AdminRole;
  created_at: string;
  created_by: string | null;
  disabled: boolean;
  note: string | null;
  email?: string | null;
  display_name?: string | null;
}

export type Freshness = 'CURRENT' | 'DUE' | 'OUTDATED' | 'NEVER_CHECKED';
