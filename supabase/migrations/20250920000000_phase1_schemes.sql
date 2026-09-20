-- =============================================================================
-- YOJANA SETU — PHASE 1 BACKEND: SCHEMES API
-- Migration: schemes + scheme_translations (+ public read, service-role write)
--
-- Design notes:
--  * Structured columns carry every field the app filters/sorts on
--    (type, scope, amounts, age, states, categories, tags...).
--  * `data JSONB` carries the FULL normalized Scheme object (intelligence
--    model, trust profile, provenance) so the API is lossless vs the bundle.
--  * `scheme_translations` holds the per-language UI strings that today live
--    in src/i18n/schemesData.ts (hi/ta/te/kn/ml). English is the base row
--    in `schemes` itself.
--  * Row Level Security: public (anon + authenticated) can READ active
--    schemes. All WRITES are service_role-only (admin scripts / dashboard).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- schemes
-- ---------------------------------------------------------------------------
create table if not exists public.schemes (
  id                          text primary key,               -- stable slug, e.g. 'pmegp-msme'
  short_code                  text,
  scheme_type                 text not null,
  scope                       text not null default 'NATIONAL', -- NATIONAL | STATE_SPECIFIC
  sponsoring_ministry         text not null,
  department                  text,
  official_scheme_identifier  text,
  description                 text,
  benefit_summary             text not null,
  purpose                     text,
  funding_range_text          text,
  min_amount                  numeric,
  max_amount                  numeric,
  subsidy_rate_percent        numeric,
  subsidy_cap                 numeric,
  base_interest_rate          numeric,
  standard_tenure_years       numeric,
  moratorium_period_months    numeric,
  min_age                     integer,
  max_age                     integer,
  max_annual_income_cap       numeric,
  target_categories           text[] not null default '{}',
  target_business_types       text[] not null default '{}',
  applicable_states           text[] not null default '{}',    -- empty = pan-India
  required_documents          text[] not null default '{}',
  tags                        text[] not null default '{}',
  categories                  text[] not null default '{}',    -- normalized taxonomy categories
  official_portal_url         text,
  application_mode            text,
  last_verified_date          text,
  is_active                   boolean not null default true,
  version                     integer not null default 1,       -- bump on content updates
  data                        jsonb not null default '{}'::jsonb, -- full normalized Scheme object
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists schemes_active_idx      on public.schemes (is_active);
create index if not exists schemes_type_idx        on public.schemes (scheme_type);
create index if not exists schemes_scope_idx       on public.schemes (scope);
create index if not exists schemes_updated_idx     on public.schemes (updated_at desc);
create index if not exists schemes_states_gin_idx  on public.schemes using gin (applicable_states);
create index if not exists schemes_tags_gin_idx    on public.schemes using gin (tags);
create index if not exists schemes_data_gin_idx    on public.schemes using gin (data);

-- ---------------------------------------------------------------------------
-- scheme_translations
-- ---------------------------------------------------------------------------
create table if not exists public.scheme_translations (
  scheme_id          text not null references public.schemes (id) on delete cascade,
  lang               text not null,                               -- hi | ta | te | kn | ml
  name               text not null,
  sponsoring_ministry text,
  department         text,
  scheme_type        text,
  benefit_summary    text,
  funding_range_text text,
  required_documents text[] not null default '{}',
  last_verified_date text,
  updated_at         timestamptz not null default now(),
  primary key (scheme_id, lang)
);

create index if not exists scheme_translations_lang_idx on public.scheme_translations (lang);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  -- Any content edit invalidates client caches: bump the version.
  if tg_table_name = 'schemes' then
    new.version = coalesce(old.version, 0) + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists schemes_touch_updated_at on public.schemes;
create trigger schemes_touch_updated_at
  before update on public.schemes
  for each row execute function public.touch_updated_at();

drop trigger if exists scheme_translations_touch_updated_at on public.scheme_translations;
create trigger scheme_translations_touch_updated_at
  before update on public.scheme_translations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — public read, service-role write
-- ---------------------------------------------------------------------------
alter table public.schemes enable row level security;
alter table public.scheme_translations enable row level security;

-- The app (and any visitor) may read ACTIVE schemes + their translations.
-- No login required in Phase 1.
drop policy if exists "Public read active schemes" on public.schemes;
create policy "Public read active schemes"
  on public.schemes
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read scheme translations" on public.scheme_translations;
create policy "Public read scheme translations"
  on public.scheme_translations
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.schemes s
      where s.id = scheme_translations.scheme_id
        and s.is_active = true
    )
  );

-- No insert/update/delete policies for anon/authenticated: writes are
-- service_role-only (bypasses RLS) via admin scripts / dashboard.
