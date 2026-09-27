-- ============================================================================
-- 019_ys_admin_audit_logs.sql — Yojana Setu Admin Console: append-only audit
-- ============================================================================
-- Run once in the Supabase SQL editor (after 018_ys_admins.sql).
-- Idempotent: safe to re-run.
--
-- Every consequential admin action (verify, publish, edit, import approve,
-- role change, ...) writes one row here via the admin console's audit
-- writer. The table is APPEND-ONLY by design:
--   - admins may INSERT and SELECT
--   - NOBODY (including super_admin) gets UPDATE or DELETE through RLS;
--     corrections happen by writing a new compensating row, never by
--     rewriting history.
-- ============================================================================

create table if not exists public.ys_admin_audit_logs (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  actor_user_id  uuid references auth.users(id) on delete set null,
  actor_role     text,
  action         text not null,
  resource_type  text not null,
  resource_id    text,
  summary        text not null default '',
  previous_value jsonb,
  new_value      jsonb,
  metadata       jsonb,
  outcome        text not null default 'success'
                 check (outcome in ('success', 'failure'))
);

create index if not exists ys_admin_audit_logs_created_at_idx
  on public.ys_admin_audit_logs (created_at desc);
create index if not exists ys_admin_audit_logs_actor_idx
  on public.ys_admin_audit_logs (actor_user_id);
create index if not exists ys_admin_audit_logs_resource_idx
  on public.ys_admin_audit_logs (resource_type, resource_id);
create index if not exists ys_admin_audit_logs_action_idx
  on public.ys_admin_audit_logs (action);

alter table public.ys_admin_audit_logs enable row level security;

drop policy if exists ys_audit_insert on public.ys_admin_audit_logs;
create policy ys_audit_insert on public.ys_admin_audit_logs
  for insert with check (public.is_ys_admin());

drop policy if exists ys_audit_select on public.ys_admin_audit_logs;
create policy ys_audit_select on public.ys_admin_audit_logs
  for select using (public.is_ys_admin());

-- Append-only: deliberately NO update / DELETE policies.
