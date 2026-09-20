# Yojana Setu backend — Phase 1: Schemes API

Reads scheme data from Supabase instead of the app bundle, so scheme
content can be updated **without shipping a new app build**.

## What's here

| Path | Purpose |
|---|---|
| `migrations/20250920000000_phase1_schemes.sql` | `schemes` + `scheme_translations` tables, indexes, `updated_at` triggers, RLS (public read / service-role write) |
| `seed.sql` | **Generated.** 39 schemes + 35 translations (hi/ta/te/kn/ml) exported from the app bundle. Do not hand-edit. |
| `scripts/export-schemes.ts` | Exporter: bundle → `seed.sql`. Re-run after changing `src/data` or `src/i18n/schemesData.ts` |
| `config.toml` | Supabase project config |

## Setup (one time, ~10 minutes)

1. **Create the project** at [supabase.com](https://supabase.com) → New project.
   **Region: South Asia (Mumbai)** — keeps user data in India (DPDP alignment).
   Save the project URL and the `anon` public key.
2. **Run the migration:** Supabase dashboard → SQL Editor → paste
   `migrations/20250920000000_phase1_schemes.sql` → Run.
   (Or `supabase db push` if you use the CLI.)
3. **Load the seed:** SQL Editor → paste `seed.sql` → Run.
   Verify: `select count(*) from schemes;` → 39, and
   `select count(*) from scheme_translations;` → 35.
4. **Point the app at it** — in the frontend repo add to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   (Use the **anon public** key — never the service-role key — in the app.)
5. **Deploy.** The app fetches schemes on launch, caches them for 24h, and
   silently falls back to the bundled data if the network/API fails.
   With the env vars unset, the app behaves exactly as before (bundled data).

## Updating scheme content (after launch)

Edit directly in the Supabase dashboard (Table Editor) or via SQL —
bump nothing by hand: the `updated_at` trigger auto-increments `version`,
which invalidates the app's cache. No app release needed.

To re-export the whole bundle after a code-side data change:

```bash
npx tsx supabase/scripts/export-schemes.ts   # regenerates seed.sql
```

## API the app uses (PostgREST, no custom server)

```http
GET {VITE_SUPABASE_URL}/rest/v1/schemes?select=*,scheme_translations(*)&is_active=eq.true
apikey: {VITE_SUPABASE_ANON_KEY}
Authorization: Bearer {VITE_SUPABASE_ANON_KEY}
```

Public read is enforced by Row Level Security — only `is_active = true`
schemes (and their translations) are visible to the anon key. Writes
require the service-role key, which never ships in the app.
