/**
 * YOJANA SETU — SUPABASE BACKEND BARREL
 * Re-export everything the repo needs from one place.
 */
export { getSupabaseClient, isSupabaseConfigured, resetSupabaseClient } from './client';
export * from './authService';
export * from './profiles';
export * from './userProfile';
export * from './matchRuns';
export * from './savedSchemes';
export * from './applications';
export * from './documents';
export * from './migrationHelper';
export type * from './types';
