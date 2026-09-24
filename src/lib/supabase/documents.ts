/**
 * YOJANA SETU — DOCUMENTS SERVICE
 * ------------------------------------------------------------------
 * Drop-in: copy to `src/lib/supabase/documents.ts` in the repo.
 *
 * Covers migration 006 (metadata tables) + 007 (private 'user-documents'
 * Storage bucket). Two concerns, kept together because uploads write both:
 *
 * 1. document_files — metadata rows for real uploaded files (NEW capability;
 *    the frontend vault previously stored only ticked checklist ids, no
 *    files). Files live in Storage at '<user_id>/<file_id>/<file_name>'.
 * 2. document_checklists — per-scheme ticked vault-document ids. Replaces
 *    localStorage 'yojana_setu_document_progress_v1' (+ legacy
 *    sessionStorage 'setu_docs_<schemeId>' keys after migrationHelper runs).
 * 3. vault_prepared — the reusable vault's prepared ids. Replaces the
 *    '__reusable_vault__' entry inside the old progress map.
 *
 * The bucket is PRIVATE: downloads go through short-lived signed URLs.
 */

import { getSupabaseClient } from './client';
import type {
  DbDocumentChecklistRow,
  DbDocumentFileRow,
  DbVaultPreparedRow,
  DocumentProgressMap,
  NewDocumentFile,
} from './types';

const BUCKET = 'user-documents';
const FILES_TABLE = 'document_files';
const CHECKLIST_TABLE = 'document_checklists';
const VAULT_TABLE = 'vault_prepared';

function sanitiseFileName(name: string): string {
  const base = name.split('/').pop()?.split('\\').pop() ?? 'file';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
}

/* ------------------------- FILE UPLOADS ------------------------- */

/**
 * Upload a file to the user's private folder and record its metadata.
 * Returns the created metadata row. If the metadata insert fails, the
 * uploaded object is removed again (best effort) so no orphan is left.
 */
export async function uploadDocument(
  userId: string,
  input: NewDocumentFile,
): Promise<DbDocumentFileRow> {
  const supabase = getSupabaseClient();
  const fileId = crypto.randomUUID();
  const fileName = sanitiseFileName(input.file_name);
  const storagePath = `${userId}/${fileId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.mime_type || 'application/octet-stream',
      upsert: false,
    });
  if (uploadError) throw new Error(`[documents] upload failed: ${uploadError.message}`);

  const { data, error } = await supabase
    .from(FILES_TABLE)
    .insert({
      user_id: userId,
      vault_document_id: input.vault_document_id,
      custom_label: input.custom_label ?? null,
      file_name: fileName,
      mime_type: input.mime_type ?? null,
      size_bytes:
        typeof (input.file as File).size === 'number'
          ? (input.file as File).size
          : null,
      storage_path: storagePath,
      linked_registration_id: input.linked_registration_id ?? null,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    throw new Error(`[documents] metadata insert failed: ${error.message}`);
  }
  return data as DbDocumentFileRow;
}

/** All uploaded-file metadata for the user, newest first. */
export async function listDocuments(userId: string): Promise<DbDocumentFileRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(FILES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`[documents] list failed: ${error.message}`);
  return (data ?? []) as DbDocumentFileRow[];
}

/** Delete metadata row + the Storage object. */
export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error: fetchError } = await supabase
    .from(FILES_TABLE)
    .select('storage_path')
    .eq('user_id', userId)
    .eq('id', documentId)
    .maybeSingle();
  if (fetchError) throw new Error(`[documents] lookup failed: ${fetchError.message}`);
  if (!data) return;

  const { error } = await supabase
    .from(FILES_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', documentId);
  if (error) throw new Error(`[documents] delete failed: ${error.message}`);

  await supabase.storage
    .from(BUCKET)
    .remove([(data as { storage_path: string }).storage_path])
    .catch(() => {});
}

/**
 * Short-lived signed download URL (bucket is private). Default 1 hour.
 * Never expose permanent public URLs for identity/financial documents.
 */
export async function getDocumentDownloadUrl(
  userId: string,
  documentId: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const supabase = getSupabaseClient();
  const { data: row, error: fetchError } = await supabase
    .from(FILES_TABLE)
    .select('storage_path')
    .eq('user_id', userId)
    .eq('id', documentId)
    .single();
  if (fetchError || !row) throw new Error('[documents] file not found');

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl((row as { storage_path: string }).storage_path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(`[documents] signed URL failed: ${error?.message ?? 'unknown'}`);
  }
  return data.signedUrl;
}

/* --------------------- CHECKLIST TICKS (per scheme) --------------------- */

/** Full map in the old DocumentProgressMap shape: { schemeId: [docId] }. */
export async function getDocumentProgress(userId: string): Promise<DocumentProgressMap> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(CHECKLIST_TABLE)
    .select('scheme_id,document_id')
    .eq('user_id', userId);
  if (error) throw new Error(`[documents] checklist load failed: ${error.message}`);

  const map: DocumentProgressMap = {};
  for (const row of (data ?? []) as Pick<DbDocumentChecklistRow, 'scheme_id' | 'document_id'>[]) {
    (map[row.scheme_id] ??= []).push(row.document_id);
  }
  return map;
}

/** Tick or untick one vault document for one scheme's checklist. */
export async function setChecklistTicked(
  userId: string,
  schemeId: string,
  documentId: string,
  ticked: boolean,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (ticked) {
    const { error } = await supabase.from(CHECKLIST_TABLE).upsert(
      { user_id: userId, scheme_id: schemeId, document_id: documentId },
      { onConflict: 'user_id,scheme_id,document_id' },
    );
    if (error) throw new Error(`[documents] tick failed: ${error.message}`);
  } else {
    const { error } = await supabase
      .from(CHECKLIST_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('scheme_id', schemeId)
      .eq('document_id', documentId);
    if (error) throw new Error(`[documents] untick failed: ${error.message}`);
  }
}

/* ------------------- REUSABLE VAULT (prepared ids) ------------------- */

/** The vault's prepared document ids (replaces '__reusable_vault__'). */
export async function getVaultPrepared(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(VAULT_TABLE)
    .select('document_id')
    .eq('user_id', userId);
  if (error) throw new Error(`[documents] vault load failed: ${error.message}`);
  return ((data ?? []) as Pick<DbVaultPreparedRow, 'document_id'>[]).map((r) => r.document_id);
}

/**
 * Replace the whole prepared set (simplest correct sync for a checkbox list).
 * Diffs against the current set: deletes removed ids, upserts new ones.
 */
export async function setVaultPrepared(
  userId: string,
  documentIds: string[],
): Promise<void> {
  const supabase = getSupabaseClient();
  const next = new Set(documentIds);
  const current = new Set(await getVaultPrepared(userId));

  const toDelete = [...current].filter((id) => !next.has(id));
  const toAdd = [...next].filter((id) => !current.has(id));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from(VAULT_TABLE)
      .delete()
      .eq('user_id', userId)
      .in('document_id', toDelete);
    if (error) throw new Error(`[documents] vault sync failed: ${error.message}`);
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from(VAULT_TABLE).insert(
      toAdd.map((document_id) => ({ user_id: userId, document_id })),
    );
    if (error) throw new Error(`[documents] vault sync failed: ${error.message}`);
  }
}
