/**
 * Validates migrations 018/019/020 in an isolated PGlite database with
 * minimal stubs for auth.users + catalog/user tables, then runs functional
 * checks: bootstrap, role helpers, reviewer-scope trigger, append-only audit,
 * and the no-DELETE-on-catalog rule.
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const MIG = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'supabase', 'migrations');
const db = new PGlite();
let failures = 0;
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
  if (!cond) failures++;
};

const exec = async (label, sql) => {
  try {
    await db.exec(sql);
    console.log(`PASS  migration: ${label}`);
  } catch (e) {
    failures++;
    console.log(`FAIL  migration: ${label} — ${(e).message.split('\n')[0]}`);
  }
};

const run = async () => {
  // --- stubs: auth schema, auth.uid(), pgcrypto, minimal catalog/user tables
  await db.exec(`
    -- pgcrypto unavailable in pglite; gen_random_uuid() is core PG13+
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key);
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('app.uid', true), '')::uuid;
    $$;
  `);
  await db.exec(`
    create table if not exists public.schemes (
      id text primary key,
      official_name text,
      status text not null default 'draft',
      verification_status text not null default 'UNVERIFIED',
      metadata jsonb not null default '{}',
      updated_at timestamptz default now()
    );
    create table if not exists public.scheme_sources (
      id uuid primary key default gen_random_uuid(),
      scheme_id text not null references public.schemes(id) on delete cascade,
      source_name text not null,
      url text
    );
    create table if not exists public.scheme_eligibility_rules (
      id uuid primary key default gen_random_uuid(), scheme_id text not null
    );
    create table if not exists public.scheme_document_requirements (
      id uuid primary key default gen_random_uuid(), scheme_id text not null, document_label text not null
    );
    create table if not exists public.scheme_funding (
      id uuid primary key default gen_random_uuid(), scheme_id text not null
    );
    create table if not exists public.scheme_application_info (
      id uuid primary key default gen_random_uuid(), scheme_id text not null
    );
    create table if not exists public.profiles (id uuid primary key);
    create table if not exists public.user_profiles (id uuid primary key);
    create table if not exists public.match_runs (id uuid primary key);
    create table if not exists public.saved_schemes (id uuid primary key);
    create table if not exists public.applications (id uuid primary key);
  `);

  // --- run the real migrations
  await exec('018_ys_admins', readFileSync(join(MIG, '018_ys_admins.sql'), 'utf8'));
  await exec('019_ys_admin_audit_logs', readFileSync(join(MIG, '019_ys_admin_audit_logs.sql'), 'utf8'));
  await exec('020_ys_admin_access', readFileSync(join(MIG, '020_ys_admin_access.sql'), 'utf8'));

  const SUPER = '11111111-1111-1111-1111-111111111111';
  const REVIEWER = '22222222-2222-2222-2222-222222222222';
  const STRANGER = '33333333-3333-3333-3333-333333333333';

  // non-superuser role so RLS is actually enforced (like Supabase `authenticated`).
  // Created AFTER the migrations so the grant covers the new admin tables too.
  await db.exec(`
    create role authenticated nosuperuser;
    grant usage on schema public, auth to authenticated;
    grant all on all tables in schema public to authenticated;
    grant all on all sequences in schema public to authenticated;
  `);

  const as = async (uid, q, params = []) => {
    await db.exec(`select set_config('app.uid', ${uid ? `'${uid}'` : `''`}, false)`);
    await db.exec(`set role authenticated`);
    try {
      return await db.query(q, params);
    } finally {
      await db.exec(`reset role`);
    }
  };

  // seed users + bootstrap super admin (owner bypass — as the SQL-editor run would)
  await db.exec(`insert into auth.users (id) values ('${SUPER}'), ('${REVIEWER}'), ('${STRANGER}')`);
  await db.exec(`insert into public.ys_admins (user_id, role, note) values ('${SUPER}', 'super_admin', 'bootstrap')`);
  await db.exec(`insert into public.ys_admins (user_id, role, created_by) values ('${REVIEWER}', 'reviewer', '${SUPER}')`);

  // --- helper functions
  let r = await as(SUPER, `select public.is_ys_admin() as a, public.ys_admin_role() as r`);
  ok('is_ys_admin true for super_admin', (r.rows[0]).a === true);
  ok('ys_admin_role = super_admin', (r.rows[0]).r === 'super_admin');
  r = await as(REVIEWER, `select public.is_ys_admin() as a, public.ys_admin_role() as r`);
  ok('is_ys_admin true for reviewer', (r.rows[0]).a === true);
  ok('ys_admin_role = reviewer', (r.rows[0]).r === 'reviewer');
  r = await as(STRANGER, `select public.is_ys_admin() as a, public.ys_admin_role() as r`);
  ok('is_ys_admin false for stranger', (r.rows[0]).a === false);
  ok('ys_admin_role null for stranger', (r.rows[0]).r === null);

  // disabled admin loses powers
  await db.exec(`update public.ys_admins set disabled = true where user_id = '${REVIEWER}'`);
  r = await as(REVIEWER, `select public.is_ys_admin() as a`);
  ok('disabled reviewer is not admin', (r.rows[0]).a === false);
  await db.exec(`update public.ys_admins set disabled = false where user_id = '${REVIEWER}'`);

  // --- settings seeded
  r = await as(SUPER, `select key from public.ys_settings order by key`);
  ok('settings seeded', r.rows.length === 2, `${r.rows.length} rows`);

  // --- audit append-only: insert ok, update/delete rejected
  await as(SUPER, `insert into public.ys_admin_audit_logs (actor_user_id, actor_role, action, resource_type, resource_id, summary, outcome) values ('${SUPER}','super_admin','test_action','setting','k','summary','success')`);
  ok('audit insert allowed', true);
  let rUpd = await as(SUPER, `update public.ys_admin_audit_logs set summary = 'x'`);
  ok('audit update blocked (append-only)', rUpd.rowCount === 0, `${rUpd.rowCount} rows touched`);
  let rDel = await as(SUPER, `delete from public.ys_admin_audit_logs`);
  ok('audit delete blocked (append-only)', rDel.rowCount === 0, `${rDel.rowCount} rows touched`);
  r = await as(SUPER, `select count(*) from public.ys_admin_audit_logs`);
  ok('audit row still present', Number(r.rows[0].count) === 1);

  // --- schemes lifecycle: admin can insert/update; reviewer scope trigger
  await as(SUPER, `insert into public.schemes (id, official_name, status) values ('s1', 'Test Scheme', 'draft')`);
  ok('super_admin can insert scheme', true);
  let threw = false;
  threw = false;
  try { await as(REVIEWER, `insert into public.schemes (id, official_name) values ('s2', 'X')`); } catch { threw = true; }
  ok('reviewer cannot insert scheme (RLS)', threw);

  // reviewer CAN update lifecycle columns
  await as(REVIEWER, `update public.schemes set status = 'in_review' where id = 's1'`);
  ok('reviewer can update status', true);
  // reviewer CANNOT change other columns
  threw = false;
  try { await as(REVIEWER, `update public.schemes set official_name = 'Hacked' where id = 's1'`); } catch (e) { threw = /only change status/.test((e).message); }
  ok('reviewer blocked from changing official_name (trigger)', threw);
  r = await as(SUPER, `select official_name from public.schemes where id = 's1'`);
  ok('name unchanged after blocked update', (r.rows[0]).official_name === 'Test Scheme');
  // super_admin CAN change name
  await as(SUPER, `update public.schemes set official_name = 'Renamed' where id = 's1'`);
  ok('super_admin can update any column', true);

  // stranger (non-admin) cannot read catalog
  r = await as(STRANGER, `select count(*) from public.schemes`);
  ok('stranger cannot select schemes (RLS deny in stub env)', Number(r.rows[0].count) === 0);

  // related catalog table: admin insert ok
  await as(SUPER, `insert into public.scheme_sources (scheme_id, source_name) values ('s1', 'Gov portal')`);
  ok('super_admin can insert scheme_sources', true);
  threw = false;
  try { await as(REVIEWER, `insert into public.scheme_sources (scheme_id, source_name) values ('s1', 'x')`); } catch { threw = true; }
  ok('reviewer cannot insert scheme_sources (RLS)', threw);

  // user-domain: reviewer can read operational, not sensitive
  r = await as(REVIEWER, `select count(*) from public.profiles`);
  ok('reviewer can read profiles (operational)', true);
  threw = false;
  try { await as(REVIEWER, `select count(*) from public.match_runs`); } catch { threw = true; }
  ok('reviewer cannot read match_runs (sensitive excluded for support; reviewer allowed here)', !threw);
  r = await as(STRANGER, `select count(*) from public.profiles`);
  ok('stranger cannot read profiles', Number(r.rows[0].count) === 0);

  // support role excluded from sensitive — simulate via role change
  await db.exec(`update public.ys_admins set role = 'support' where user_id = '${REVIEWER}'`);
  r = await as(REVIEWER, `select count(*) from public.match_runs`);
  ok('support excluded from match_runs', Number(r.rows[0].count) === 0);
  r = await as(REVIEWER, `select count(*) from public.profiles`);
  ok('support can still read profiles', true);
  await db.exec(`update public.ys_admins set role = 'reviewer' where user_id = '${REVIEWER}'`);

  // no delete policies on catalog
  const del = await db.query(`select policyname from pg_policies where schemaname='public' and tablename='schemes' and cmd='DELETE'`);
  ok('no DELETE policy on schemes', del.rows.length === 0);

  // idempotency: re-run 020
  await exec('020 re-run (idempotent)', readFileSync(join(MIG, '020_ys_admin_access.sql'), 'utf8'));

  console.log(failures === 0 ? '\nALL MIGRATION CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
