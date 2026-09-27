# Yojana Setu — Admin Console: Implementation Report

**Date:** 2026-09-27
**Branch:** local, uncommitted (repo `main` @ `602527e` untouched)
**Status:** Implemented locally. Typecheck clean, production build clean, migration
RLS suite 32/32 green. **Not yet deployed, not yet committed — do not call this
production-ready.**

---

## 1. Executive summary

A separate, internal Admin Console was built for Yojana Setu at `/admin`
(hash-routed, served from `admin.html`, separate Vite bundle `admin-*.js`). It
extends the real architecture — the existing `schemes` catalog tables, the
deterministic eligibility pipeline, and Supabase Auth — instead of rebuilding
or duplicating anything. Nothing in the user-facing app was modified
functionally: the user bundle builds exactly as before, plus one extra output
file.

Three new migrations (`018`–`020`) add admin roles (`ys_admins`), admin-managed
settings (`ys_settings`), append-only audit logs (`ys_admin_audit_logs`), and
role-scoped RLS over the catalog and user-domain tables. Fourteen admin pages
cover the full governance workflow: **Import → Validate → Compare → Review →
Verify → Approve → Publish**.

## 2. Goals and non-goals

**Goals**
- Operate the real scheme catalog (draft → published lifecycle) with human
  review at every promotion step.
- Keep eligibility deterministic: the console never decides eligibility, never
  re-scores users, and preserves `UNKNOWN` when information is insufficient.
- Make every important change attributable: who, what changed (previous/new),
  when, why.
- Scale honestly: server-side filtering/sorting/pagination everywhere,
  debounced search, no invented numbers.

**Non-goals (explicitly out of scope)**
- No parallel database, no fake admin backend, no shadow catalog.
- No auto-promotion of unverified schemes; no auto-demotion of stale data.
- No user-data editing through the console (read-only).
- No deletion of catalog history or audit history.

## 3. Architecture: what was inspected, what was extended

Inspected before writing code:
- React 19 + TS + Vite 6 + Tailwind 4 app; screen-state navigation (no router).
- Supabase client uses only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  (`src/lib/supabase/client.ts`). No service-role key anywhere near the browser.
- Real catalog tables: `schemes`, `scheme_sources`, `scheme_eligibility_rules`,
  `scheme_document_requirements`, `scheme_funding`, `scheme_application_info`
  (+ references to `scheme_versions`, `scheme_localizations`).
- Real import path: `runCandidateSchemeImportPipeline` in
  `src/lib/data/candidatePipeline.ts` (CSV → candidates → validation →
  deduplication → reconciliation).
- User-domain tables: `profiles`, `user_profiles`, `match_runs`,
  `saved_schemes`, `applications` (+ document tables). `match_runs` stores
  compact outcome summaries, not full schemes. Application statuses are
  user-reported; Yojana Setu never submits applications to governments.

Extended (all additive):
- `admin.html` — separate entry, `noindex, nofollow`.
- `vite.config.ts` — multi-entry build (`index.html` + `admin.html`).
- `vercel.json` — `/admin` rewrite → `/admin.html` (hash routes like
  `#/schemes` work behind it).
- `src/admin/` — the entire console (auth, router, UI kit, 14 pages).
- `src/lib/supabase/migrations/018–020` — roles, audit, RLS.
- `scripts/validate-admin-migrations.mjs` — PGlite RLS/trigger test suite
  (`npm run test:admin-migrations`).
- `package.json` — devDependency `@electric-sql/pglite`, one new script.

## 4. Database design (migrations 018–020)

**018 — `ys_admins` + `ys_settings`**
- `ys_admins(user_id PK → auth.users, role, created_at, created_by, disabled, note)`.
  Roles: `super_admin`, `admin`, `reviewer`, `support`. No DELETE policy —
  admins are disabled, never deleted.
- `is_ys_admin()` / `ys_admin_role()` — `SECURITY DEFINER`, `STABLE`,
  `search_path = public, extensions`. They bypass RLS internally so policies on
  `ys_admins` itself don't recurse. Disabled admins return false/null.
- `ys_settings(key PK, value jsonb, updated_at, updated_by)`. Seeded:
  `source_freshness = {current_days: 180, due_days: 365}`,
  `verification = {reverify_after_days: 365}`.
- Bootstrap: the first super_admin is inserted manually in the SQL editor
  (the insert policy requires an existing super_admin — chicken-and-egg solved
  by a documented one-time SQL statement).

**019 — `ys_admin_audit_logs` (append-only)**
- Columns: id, actor_user_id, actor_role, action, resource_type, resource_id,
  summary, previous_value, new_value, metadata, outcome, created_at.
- RLS: admins may SELECT and INSERT only. No UPDATE/DELETE policies exist, so
  tampering silently affects 0 rows (verified in the test suite).
- Indexed on created_at, actor, resource, action.

**020 — admin RLS over catalog + user tables**
- `schemes`: admin SELECT; INSERT/UPDATE for super_admin + admin; reviewer may
  UPDATE **only** `status`, `verification_status`, `metadata` — enforced by the
  `ys_enforce_reviewer_scope()` trigger, which raises otherwise. No DELETE.
- Related catalog tables (`scheme_sources`, `scheme_eligibility_rules`,
  `scheme_document_requirements`, `scheme_funding`, `scheme_application_info`,
  `scheme_versions`, `scheme_localizations`): guarded only if they exist
  (`to_regclass` check); admin SELECT, super_admin/admin write, no DELETE.
- User-domain operational tables (`profiles`, `applications`, `saved_schemes`):
  admin SELECT (support included).
- Sensitive tables (`user_profiles`, `eligibility_answers`, `match_runs`,
  `document_files`, `document_checklists`, `vault_prepared`, `chat_history`):
  SELECT for super_admin/admin/reviewer — **support excluded**. The UI
  additionally masks contact PII for support.
- Admins get zero write access to any user-domain table.

## 5. Authentication and authorization

- Identity comes from the existing Supabase Auth session (the same login the
  user app uses). Authorization comes from `ys_admins`.
- `AdminAuthContext` resolves `{ userId, role, disabled }` on sign-in and on
  auth-state changes. Signed-in non-admins see a "Not an administrator" screen
  with a sign-out button.
- Two enforcement layers: the UI permission matrix
  (`src/admin/lib/permissions.ts` — 15 actions × 4 roles, nav filtered per
  role) **and** database RLS + trigger. A crafted request cannot bypass the UI
  because the database enforces the same boundaries independently.
- Service-role key is never in the browser bundle. All admin queries use the
  anon key + the user's JWT; RLS does the rest.

## 6. Audit logging

- Every important mutation writes a row to `ys_admin_audit_logs` with actor,
  role, action, resource, **previous_value / new_value**, metadata (including
  the human-entered reason), outcome, and timestamp.
- Lifecycle transitions (draft → in_review → verified → published, archive,
  disable) require a typed reason; the reason is stored in both the audit row
  and the scheme's `metadata`.
- The Audit Logs page offers server-side filters (action, actor, resource,
  date range), pagination, and an expandable previous/new diff viewer.
- Limitation (honest): audit writes are client-side follow-ups to the data
  mutation, not database-atomic. If the audit insert fails after the data
  change succeeds, the log has a gap. Production-grade fix: RPCs or triggers
  that write data + audit in one transaction (listed in §13).

## 7. Admin Console pages (14)

| Page | Route | What it does |
|---|---|---|
| Dashboard | `#/dashboard` | Live counts, data-health alerts, stale/missing-data warnings, review queue, recent audit. Failed queries show "unavailable", never invented numbers. |
| Schemes | `#/schemes` | Server-side search/filter/sort/pagination; bulk lifecycle actions with reasons + audit. |
| Scheme detail | `#/schemes/:id` | Overview, eligibility, benefits, documents, sources, application info, verification, audit history; explicit lifecycle transitions. |
| Scheme editor | `#/schemes/new`, `#/schemes/:id/edit` | Structured fields + validated `raw_payload` JSON. Status is deliberately not editable here — it moves only via lifecycle transitions. |
| Reviews | `#/reviews` | Review → verify → reject → publish queue with data-quality warnings. |
| Eligibility | `#/eligibility` | The deterministic-engine contract and data-coverage view. Normalized rules shown as reference; the engine reads `raw_payload` (stated in the UI). |
| Documents | `#/documents` | Lists/adds document requirements. No hard delete — unsupported by design. |
| Sources | `#/sources` | Provenance, verification, freshness vs `ys_settings.source_freshness`; add source; re-verify. No hard delete. |
| Sync Center | `#/sync` | Runs the real `runCandidateSchemeImportPipeline` on an uploaded CSV; validation/quarantine/duplicate report; queue valid non-duplicates as `draft` + `UNVERIFIED`. Explicitly states no live government API is involved. |
| Users | `#/users` | Read-only profiles + activity counts; contact masking for support role. |
| Applications | `#/applications` | Read-only, server-paginated journeys; statuses labeled user-reported. |
| Eligibility Checks | `#/checks` | Read-only `match_runs` monitoring; compact outcomes, no personal answers, no re-scoring. |
| Audit Logs | `#/audit` | As §6. |
| System Health | `#/health` | Read-only probes: auth, admin tables, catalog tables, user tables, role resolution, env config. Reports "not configured" honestly. |
| Settings | `#/settings` | View for all admins; edit (super_admin/admin) with JSON validation, confirm diff, reason, audit. |
| Admins | `#/admins` | Super-admin only: add by auth UID, change role, disable/enable. Self-demotion/self-disable blocked. |

Global search (topbar, `Cmd/Ctrl+K`-style) searches schemes, sources,
applications, and audit summaries with debouncing.

## 8. Governance workflow: Import → Validate → Compare → Review → Verify → Approve → Publish

1. **Import** — Sync Center uploads the CSV (documented columns:
   `id,state_or_ut,scope,scheme_name,tag,ministry,benefit,annual,application_url,application_type,relevance_tier,source_file`).
2. **Validate** — the real candidate pipeline validates each row; failures are
   quarantined with reasons, never silently dropped.
3. **Compare** — candidates are deduplicated against live scheme IDs/names and
   application portal URLs.
4. **Review** — valid, non-duplicate candidates are queued as `draft` +
   `UNVERIFIED`; provenance + required-document rows are attached where the
   CSV provides them.
5. **Verify** — reviewers work the Reviews queue; data-quality warnings
   (missing benefits, no official source, stale source) are shown, not hidden.
6. **Approve** — verify → approve transitions, each with a mandatory reason.
7. **Publish** — only verified schemes can be published; only published schemes
   are visible to users (existing app behavior preserved).

No step is automatic: the pipeline proposes, humans dispose.

## 9. Eligibility and data-trust guarantees

- The console **never decides eligibility**. The Eligibility page documents the
  deterministic contract; there is no "re-run" or "override" button anywhere.
- `UNKNOWN` is preserved: schemes missing the data needed for a rule keep an
  explicit unknown state; the UI explains what is missing instead of guessing.
- **Stale ≠ false.** Freshness labels (`fresh` / `due` / `stale`) come from
  `ys_settings.source_freshness` and mean "re-check", never "wrong". No
  automation demotes or hides a scheme for being stale.
- Application statuses are labeled **user-reported** wherever shown.

## 10. Security review

**Designed in**
- Least privilege: 4 roles, 15 granular actions, UI + RLS + trigger.
- Append-only audit; disabled-not-deleted admins; no catalog hard deletes.
- No secrets in the browser; anon key only; RLS on every new table.
- Reviewer scope trigger prevents privilege creep through the schemes table.

**Fixed during build**
- Documents/Sources pages originally issued hard `DELETE`s that migration 020
  intentionally does not authorize — removed; unsupported deletions now say so.
- Settings page referenced a non-existent `manage_settings` action — corrected
  to `edit_settings`.
- AdminApp imported a non-existent `Checks` page — corrected to
  `EligibilityChecks`; Admins route and nav item were missing — added.
- `Modal` has no `footer` prop — all usages converted to inline buttons.

**Residual risks (must be addressed before production)**
1. Audit writes are not atomic with data mutations (§6).
2. Migrations have never run against the real Supabase project — only PGlite.
3. No unauthorized-role penetration test against the live project yet.
4. Sync Center inserts related rows non-transactionally; partial failure can
   leave a scheme without its source rows (it reports counts; still, wrap in
   an RPC for production).
5. The bootstrap super_admin SQL is a manual step — whoever runs it must
   verify the UID out-of-band.

## 11. Validation performed

- `tsc --noEmit` — clean.
- `npm run build` — clean; `dist/admin.html` + separate `admin-*.js` bundle;
  user bundle unchanged in behavior.
- `npm run test:admin-migrations` — **32/32 pass** in isolated PGlite:
  migrations run idempotently; role helpers correct for super_admin /
  reviewer / stranger / disabled; audit update/delete touch 0 rows; reviewer
  trigger blocks non-lifecycle edits; RLS denies verified for inserts, selects
  on sensitive tables, and support-role exclusion; no DELETE policy on
  `schemes`; 020 re-run safe.
- Existing user-app test suite (`npm test`) — every test file passes **except**
  `profilePersistence.test.ts`, which fails on a **pre-existing** environmental
  issue unrelated to this work: it hardcodes the absolute path
  `/home/hatch/workspace/yojana-setu-backend/supabase/migrations/003_eligibility.sql`,
  which does not exist in this environment (the test file itself is
  unmodified by this work). All 19 test files after it were run individually:
  all PASS. No user-app source files were modified — only additive config
  (multi-entry build + `/admin` rewrite).

## 12. Deployment guide (exact steps)

**A. Apply migrations** (Supabase Dashboard → SQL Editor, run as postgres):
1. Open `src/lib/supabase/migrations/018_ys_admins.sql`, paste, Run.
2. Same for `019_ys_admin_audit_logs.sql`, then `020_ys_admin_access.sql`.
3. Re-run `npm run test:admin-migrations` locally if you edit them.

**B. Bootstrap the first super_admin** (SQL Editor):
```sql
insert into public.ys_admins (user_id, role, note)
values ('PASTE-AUTH-UID-HERE', 'super_admin', 'bootstrap');
```
Get the UID from Dashboard → Authentication → Users → copy UID. Verify the
person out-of-band before running.

**C. Deploy the app**: `npm run build`, deploy `dist/` to Vercel as usual.
The `/admin` rewrite is already in `vercel.json`. No new env vars — the
console reuses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**D. Smoke test**: open `https://<your-site>/admin`, sign in as the super
admin, open System Health — every probe should be green. Add a second admin
via the Admins page (paste their auth UID).

**E. Rollback**: the user app is untouched; removing `/admin` is just
reverting `admin.html`, `vite.config.ts`, `vercel.json`. To remove admin
access without code changes, set `disabled = true` on all `ys_admins` rows.

## 13. Known limitations — not production-ready until these are closed

1. Migrations untested against the live project (PGlite only).
2. Audit not atomic with mutations — needs RPC/trigger-based writes.
3. Sync Center related-row inserts not transactional.
4. Eligibility "gaps" and Sources "stale-only" filters page a bounded server
   window then filter locally — refine to fully server-side predicates.
5. Reviews page caps at 200 rows without full pagination.
6. No live RLS penetration test with real roles.
7. `npm test`: only pre-existing environmental failure remains
   (`profilePersistence.test.ts` hardcoded path; unmodified by this work).
8. Nothing committed or pushed — the work exists only in
   `~/workspace/yojana-setu`.

## 14. Operational runbook

- **Daily**: Dashboard review queue; System Health glance.
- **Weekly**: Sources page — re-verify anything `stale`; Audit Logs spot-check.
- **On incident** (wrong scheme data live): Scheme detail → lifecycle →
  `disable` with reason (immediate, audited) → fix via editor → re-verify →
  re-publish. Never edit the published row silently; the audit diff is the
  record.
- **Offboarding an admin**: Admins page → Disable (keeps history).
- **Settings changes**: Settings page → Edit → Review change → reason required.

## 15. Next steps / recommendations

1. Apply 018–020 to a **staging** Supabase project first; run the smoke test
   (§12D); then apply to production.
2. Close the atomic-audit gap with a `ys_mutate_scheme(...)` RPC (or triggers)
   before promising tamper-evidence to anyone.
3. Wrap Sync Center's candidate insert + related rows in one RPC.
4. Run a live role-matrix test (super_admin / admin / reviewer / support /
   signed-in non-admin / anon) against staging and record the results.
5. Decide the CSV's long-term source: the Sync Center currently takes manual
   uploads and honestly states no live government API is connected — keep that
   label until a real connector exists.
6. Commit and push only after 1–4 are done.
