/**
 * YOJANA SETU — SUPABASE BACKEND TYPES
 * ------------------------------------------------------------------
 * TypeScript mirrors of the SQL migrations in ../supabase/migrations/.
 *
 * These are hand-written row types kept in sync with the migrations by
 * convention. If you prefer generated types, run:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 *
 * and swap the row types below for the generated `Database` type.
 * The data-service functions in this folder only depend on the shapes
 * declared here, so the swap is mechanical.
 */

/** Supabase JSONB-compatible value. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ------------------------------------------------------------------ */
/* 002_profiles.sql — public.profiles                                  */
/* ------------------------------------------------------------------ */

/** One row per auth user. Auto-created by the handle_new_user() trigger. */
export interface DbProfileRow {
  user_id: string;
  email: string | null;
  display_name: string;
  /** Digits, normalised to E.164-ish "+91XXXXXXXXXX" at sign-up. */
  mobile: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface ProfilePatch {
  display_name?: string;
  mobile?: string | null;
  preferred_language?: string;
}

/* ------------------------------------------------------------------ */
/* 003_eligibility.sql — public.user_profiles + public.match_runs     */
/* ------------------------------------------------------------------ */

/**
 * The app's full UserProfile (src/types/user.ts in the repo) is stored
 * verbatim in `profile`. It is a large nested object (demographics,
 * business fields, BusinessRegistrationRecord[], cached derived profiles)
 * and the repo's matching/eligibility engines read it as-is, so JSONB is
 * the faithful mapping — no column-per-field normalisation.
 */
export interface DbUserProfileRow {
  user_id: string;
  /** Entire frontend UserProfile object, verbatim. */
  profile: Json;
  /** Extracted filter columns, maintained by the client on save. */
  state: string | null;
  category: string | null;
  business_type: string | null;
  district: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileExtracted {
  state?: string | null;
  category?: string | null;
  business_type?: string | null;
  district?: string | null;
}

/** Compact per-scheme summary stored in match_runs.results. */
export interface MatchSummary {
  schemeId: string;
  matchPercentage: number;
  isEligible: boolean;
  reasonCodes: string[];
  matchedCount: number;
  totalFactorsCount: number;
}

export interface DbMatchRunRow {
  id: string;
  user_id: string;
  created_at: string;
  /** The eligibility answers this run was computed from. */
  profile_snapshot: Json;
  result_count: number;
  top_scheme_id: string | null;
  top_match_pct: number | null;
  /** MatchSummary[] — compact, never the full MatchResult object. */
  results: Json;
}

export interface NewMatchRun {
  profile_snapshot: Json;
  result_count: number;
  top_scheme_id?: string | null;
  top_match_pct?: number | null;
  results: MatchSummary[];
}

/* ------------------------------------------------------------------ */
/* 004_saved_schemes.sql — public.saved_schemes                        */
/* ------------------------------------------------------------------ */

export interface DbSavedSchemeRow {
  user_id: string;
  scheme_id: string;
  saved_at: string;
}

/* ------------------------------------------------------------------ */
/* 005_applications.sql — public.applications                          */
/* ------------------------------------------------------------------ */

export type DbApplicationStatus =
  | 'interested'
  | 'docs-ready'
  | 'applied'
  | 'approved'
  | 'rejected';

/** Mirrors the repo's TrackedApplication (src/types/tracker.ts), camelCase. */
export interface TrackedApplicationInput {
  schemeId: string;
  schemeName: string;
  status: DbApplicationStatus;
  note?: string;
  /** YYYY-MM-DD */
  appliedOn?: string;
  startedFromPathway?: boolean;
  pathwaySnapshot?: Json;
  journey?: Json;
  followUp?: Json;
}

export interface DbApplicationRow {
  id: string;
  user_id: string;
  scheme_id: string;
  scheme_name: string;
  status: DbApplicationStatus;
  note: string | null;
  applied_on: string | null;
  started_from_pathway: boolean;
  pathway_snapshot: Json | null;
  journey: Json;
  follow_up: Json | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* 006_documents.sql — document_files / document_checklists /           */
/*            vault_prepared                                            */
/* ------------------------------------------------------------------ */

export interface DbDocumentFileRow {
  id: string;
  user_id: string;
  /** CORE_REUSABLE_DOCUMENTS id (e.g. 'aadhaar_card') or 'custom'. */
  vault_document_id: string;
  custom_label: string | null;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  /** '<user_id>/<file_id>/<file_name>' inside the user-documents bucket. */
  storage_path: string;
  /** Client-side link to BusinessRegistrationRecord.id. */
  linked_registration_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewDocumentFile {
  vault_document_id: string;
  custom_label?: string;
  file: File | Blob;
  file_name: string;
  mime_type?: string;
  linked_registration_id?: string;
}

export interface DbDocumentChecklistRow {
  user_id: string;
  scheme_id: string;
  document_id: string;
  ticked_at: string;
}

export interface DbVaultPreparedRow {
  user_id: string;
  document_id: string;
  prepared_at: string;
}

/** Frontend's DocumentProgressMap shape: Record<schemeId, documentId[]>. */
export type DocumentProgressMap = Record<string, string[]>;
