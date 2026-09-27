-- ============================================================================
-- 020_ys_admin_access.sql — Yojana Setu Admin Console: catalog + user-table RLS
-- ============================================================================
-- Run once in the Supabase SQL editor (after 018 / 019).
-- Idempotent: safe to re-run.
--
-- ADDITIVE ONLY: this migration only ADDS policies. It never drops or
-- alters existing policies (e.g. the anonymous published-catalog read),
-- so the user-facing app keeps working exactly as before.
--
-- Catalog (schemes + related tables):
--   - every active admin can SELECT all rows, including drafts
--   - super_admin / admin can INSERT and UPDATE
--   - reviewer can UPDATE, but a server-side trigger restricts reviewers
--     to changing ONLY status / verification_status / metadata
--     (column-level enforcement, not just UI)
--   - no admin DELETE policy: retire via status = 'archived'
--
-- User-domain tables (profiles, applications, ...):
--   - active admins can SELECT (support role excluded from the most
--     sensitive tables: full profile JSON, match runs, document files)
--   - admins NEVER get INSERT/UPDATE/DELETE on user tables here
-- ============================================================================

-- ---------------------------------------------------------------- schemes ---
alter table public.schemes enable row level security;

drop policy if exists ys_admin_schemes_select on public.schemes;
create policy ys_admin_schemes_select on public.schemes
  for select using (public.is_ys_admin());

drop policy if exists ys_admin_schemes_insert on public.schemes;
create policy ys_admin_schemes_insert on public.schemes
  for insert with check (public.ys_admin_role() in ('super_admin', 'admin'));

drop policy if exists ys_admin_schemes_update on public.schemes;
create policy ys_admin_schemes_update on public.schemes
  for update
  using (public.ys_admin_role() in ('super_admin', 'admin', 'reviewer'))
  with check (public.ys_admin_role() in ('super_admin', 'admin', 'reviewer'));

-- Reviewers may only touch lifecycle columns. Enforced in the database so a
-- crafted request cannot bypass the admin UI's field restrictions.
create or replace function public.ys_enforce_reviewer_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := public.ys_admin_role();
  -- service role / super_admin / admin: unrestricted
  if r is null or r in ('super_admin', 'admin') then
    return new;
  end if;
  -- reviewer (and any future limited role): only lifecycle columns may change
  if (to_jsonb(new) - array['status', 'verification_status', 'metadata', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['status', 'verification_status', 'metadata', 'updated_at'])
  then
    raise exception 'ys_admin: role % may only change status, verification_status and metadata', r;
  end if;
  return new;
end;
$$;

drop trigger if exists ys_reviewer_scope on public.schemes;
create trigger ys_reviewer_scope
  before update on public.schemes
  for each row execute function public.ys_enforce_reviewer_scope();

-- ------------------------------------------------- related catalog tables ---
do $$
declare
  t text;
begin
  foreach t in array array[
    'scheme_sources',
    'scheme_eligibility_rules',
    'scheme_document_requirements',
    'scheme_funding',
    'scheme_application_info',
    'scheme_versions',
    'scheme_localizations'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);

      execute format(
        'drop policy if exists ys_admin_%I_select on public.%I', t, t);
      execute format(
        'create policy ys_admin_%I_select on public.%I for select using (public.is_ys_admin())',
        t, t);

      execute format(
        'drop policy if exists ys_admin_%I_insert on public.%I', t, t);
      execute format(
        'create policy ys_admin_%I_insert on public.%I for insert with check (public.ys_admin_role() in (''super_admin'',''admin''))',
        t, t);

      execute format(
        'drop policy if exists ys_admin_%I_update on public.%I', t, t);
      execute format(
        'create policy ys_admin_%I_update on public.%I for update using (public.ys_admin_role() in (''super_admin'',''admin'')) with check (public.ys_admin_role() in (''super_admin'',''admin''))',
        t, t);
      -- no delete policies: history is preserved; retire instead of deleting
    end if;
  end loop;
end;
$$;

-- ------------------------------------------------------- user-domain reads --
-- Operational tables: every active admin may read (needed for support).
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'applications', 'saved_schemes'] loop
    if to_regclass('public.' || t) is not null then
      execute format(
        'drop policy if exists ys_admin_%I_select on public.%I', t, t);
      execute format(
        'create policy ys_admin_%I_select on public.%I for select using (public.is_ys_admin())',
        t, t);
    end if;
  end loop;
end;
$$;

-- Sensitive tables (full profile JSON, match history, uploaded documents):
-- support role is excluded; the admin UI additionally masks PII for support.
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_profiles', 'eligibility_answers', 'match_runs',
    'document_files', 'document_checklists', 'vault_prepared', 'chat_history'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format(
        'drop policy if exists ys_admin_%I_select on public.%I', t, t);
      execute format(
        'create policy ys_admin_%I_select on public.%I for select using (public.is_ys_admin() and public.ys_admin_role() in (''super_admin'',''admin'',''reviewer''))',
        t, t);
    end if;
  end loop;
end;
$$;

-- NOTE: admins get no INSERT/UPDATE/DELETE on user-domain tables.
-- User data is never modified through the admin console.
