-- ============================================================================
-- 018_ys_admins.sql — Yojana Setu Admin Console: roles + settings
-- ============================================================================
-- Run once in the Supabase SQL editor (as postgres / service role).
-- Idempotent: safe to re-run.
--
-- Creates:
--   public.ys_admins   — one row per admin user (user_id -> role)
--   public.ys_settings  — admin-managed key/value configuration
--   public.is_ys_admin() / public.ys_admin_role() — SECURITY DEFINER
--     helpers used by every admin RLS policy (they bypass RLS internally,
--     so policies on ys_admins itself do not recurse).
--
-- BOOTSTRAP — the first super_admin cannot be created through the app
-- (the insert policy requires an existing super_admin). Run this once in
-- the SQL editor, replacing the id with the auth.users id of the person
-- who should be the first super admin (Supabase Dashboard -> Authentication
-- -> Users -> copy the UID):
--
--   insert into public.ys_admins (user_id, role, note)
--   values ('00000000-0000-0000-0000-000000000000', 'super_admin', 'bootstrap');
-- ============================================================================

create table if not exists public.ys_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('super_admin', 'admin', 'reviewer', 'support')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  disabled   boolean not null default false,
  note       text
);

create or replace function public.is_ys_admin()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.ys_admins
    where user_id = auth.uid() and disabled = false
  );
$$;

create or replace function public.ys_admin_role()
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select role from public.ys_admins
  where user_id = auth.uid() and disabled = false
  order by created_at
  limit 1;
$$;

alter table public.ys_admins enable row level security;

drop policy if exists ys_admins_select on public.ys_admins;
create policy ys_admins_select on public.ys_admins
  for select using (public.is_ys_admin());

drop policy if exists ys_admins_insert on public.ys_admins;
create policy ys_admins_insert on public.ys_admins
  for insert with check (public.ys_admin_role() = 'super_admin');

drop policy if exists ys_admins_update on public.ys_admins;
create policy ys_admins_update on public.ys_admins
  for update
  using (public.ys_admin_role() = 'super_admin')
  with check (public.ys_admin_role() = 'super_admin');

-- NOTE: intentionally no DELETE policy. Remove an admin by setting
-- disabled = true (UPDATE) instead of deleting the row, so the audit
-- history keeps a record of who was ever an admin.

-- ----------------------------------------------------------------------------
-- Admin-managed settings (freshness thresholds, verification cadence, ...)
-- ----------------------------------------------------------------------------

create table if not exists public.ys_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.ys_settings enable row level security;

drop policy if exists ys_settings_select on public.ys_settings;
create policy ys_settings_select on public.ys_settings
  for select using (public.is_ys_admin());

drop policy if exists ys_settings_write on public.ys_settings;
create policy ys_settings_write on public.ys_settings
  for all
  using (public.ys_admin_role() in ('super_admin', 'admin'))
  with check (public.ys_admin_role() in ('super_admin', 'admin'));

insert into public.ys_settings (key, value) values
  ('source_freshness', '{"current_days": 180, "due_days": 365}'),
  ('verification',     '{"reverify_after_days": 365}')
on conflict (key) do nothing;
