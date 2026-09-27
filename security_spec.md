# Yojana Setu — Security Specification (Supabase-backed, Local-First)

> Current architecture as of Phase 2E.2. Historical audit reports in
> `src/data/migration/` and `src/data/reports/` describe earlier stages and
> are preserved as-is; this document is the authoritative current spec.

## 1. Data & Trust Invariants

1. **Local-first with cloud mirror**: All citizen state (`trackedApplications`,
   `savedSchemes`, profile data, document progress) is stored synchronously in
   the browser (`profileStorage.ts` / `localStorage`). For **authenticated**
   users it is additionally mirrored to Supabase Postgres (fire-and-forget);
   guests never sync.
2. **Supabase Auth is the sole auth authority**: session state flows through
   the central `AuthContext` (`AUTH_LOADING` / `AUTHENTICATED` /
   `UNAUTHENTICATED`). Users are identified by Supabase **UID**, never email.
3. **Profile ownership — no auto-claim**: Ordinary login never claims unowned
   local data. Legacy `yojana_setu_user_profile_v1` is read-only. The guest
   profile is claimed only through the explicit guest → account migration
   flow (`requestExplicitGuestMigration` → `migrateGuestProfileToSupabase`).
   Cloud data wins; logout clears active local authenticated caches but never
   deletes durable Supabase rows.
4. **PII sanitization (not zero-PII)**: `sanitizeProfilePII` scrubs 12-digit
   Aadhaar formats (continuous, spaced, hyphenated), 10-digit mobile numbers,
   and PAN structures from name fields before persistence. The app never asks
   for identity numbers, passwords, or bank credentials. No "zero PII" /
   "zero retention" / "guaranteed deletion" claims are made — authenticated
   profile data is synchronized to the user's own account.
5. **Application lifecycle integrity**: Tracked applications transition only
   through `['interested', 'docs-ready', 'applied', 'approved', 'rejected']`.
6. **Temporal invariant**: Creation timestamps are immutable upon record update.
7. **Payload bounding**: String properties have explicit upper bounds;
   unbounded payloads are rejected.
8. **Service role never reaches the browser**: All browser access uses the
   anon key with Row-Level Security. Service-role credentials live only in
   server-side tooling / the local admin console.
9. **Row-Level Security**: Every user-domain table (`profiles`,
   `eligibility_answers`, `match_results`, `saved_schemes`, `applications`,
   `documents`, `chat_history`) enforces `auth.uid() = user_id` on all
   operations. The scheme catalog is readable anonymously (`status =
   'published'` only); candidates/drafts are never exposed to anon.
10. **System default deny**: Untrusted inputs are sanitized or rejected.

## 2. Scheme-data tiers (no candidate is authoritative)

- **Bundled**: the shipped dataset — always available offline.
- **Cached**: last successful cloud snapshot (`localStorage` v2 cache).
- **Cloud**: Supabase `schemes` rows with `status = 'published'`.
- **Published vs candidate/draft**: only `published` rows reach the app.
  Candidate/draft rows are discovery material, never presented as official.

## 3. Adversarial Payloads (Supabase Postgres + RLS model)

Each payload asserts the RLS-backed invariant it attacks.

1. **Cross-user profile write**: `user_A` attempts `UPDATE profiles SET …
   WHERE user_id = user_B`. **Blocked**: RLS `auth.uid() = user_id`.
2. **Ghost field injection**: attacker injects `isAdmin: true` into a profile
   upsert. **Rejected**: unknown columns fail; no privilege column exists.
3. **Denial-of-wallet string bomb**: `applicantName` of 100,000 chars.
   **Rejected**: payload bounds enforced before persistence.
4. **Invalid category injection**: `category: "SuperVIP"` outside the enum.
   **Rejected**: enum validation.
5. **Cross-tenant application insert**: `user_A` inserts into `applications`
   with `user_id = user_B`. **Blocked**: RLS on insert (`auth.uid()`).
6. **Path ID poisoning**: application id with bad chars or > 128 chars.
   **Rejected**: id validation.
7. **Invalid status mutation**: status `"auto_approved_by_hacker"`.
   **Rejected**: lifecycle whitelist.
8. **Creation time tampering**: mutating `createdAt` on update. **Ignored**:
   immutable on update paths.
9. **Unauthenticated profile read**: anon `SELECT` on `profiles`.
   **Blocked**: no anon SELECT policy on user tables.
10. **Foreign list scraping**: `user_A` selects `user_B`'s applications.
    **Blocked**: RLS restricts rows to `auth.uid()`.
11. **Oversized note attack**: 50,000-char application note. **Rejected**:
    note length bounds.
12. **Invalid type in saved scheme**: `{ schemeId: 12345 }` (number).
    **Rejected**: type validation before write.

## 4. Explicitly out of scope / not promised

- Zero-PII storage, zero retention, or guaranteed deletion are **not**
  promised and must not appear in UI copy or docs.
- The app is an advisory workspace, not a submission portal; it never
  submits applications to any ministry.
- Unknown scheme facts (auth method, e-sign, editability, processing time)
  are returned as UNKNOWN, never inferred.
- Unresolved ingestion collisions are surfaced for review. A hard database
  publication gate requires explicit linkage between the ingestion item and
  the scheme version and belongs to the ingestion / review backend hardening
  phase. This repository ships no migration for that gate; the frontend does
  not fabricate ingestion-item → scheme-version linkage or a frontend-only
  publication security mechanism.

## 5. HTTP security headers (Vercel)

`vercel.json` ships safe non-CSP headers on all routes:
`X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`,
`X-Frame-Options: DENY`.

An enforced Content-Security-Policy is intentionally deferred: the app
currently relies on an inline print `<style>` (PathwayReportModal),
an environment-driven Supabase host, Google Fonts, and `data:` images —
a blind CSP would break Supabase, Google OAuth, fonts, or Vercel assets.
Follow-up: move the print styles out of inline `<style>`, enumerate the
Supabase host + font/image sources, then ship CSP in report-only mode
before enforcing.
