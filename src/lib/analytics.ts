/**
 * YOJANA SETU — PRODUCT ANALYTICS (frontend event logger)
 * ---------------------------------------------------------
 * Lightweight, privacy-respecting event logging to Supabase.
 *
 * - Fire-and-forget: never blocks UI, never throws.
 * - No PII: session_id is a random client UUID; user_id only for logged-in users.
 * - Guests are tracked by session_id only.
 * - If Supabase is not configured, events are silently dropped.
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';

export type AnalyticsEventType =
  | 'questionnaire_started'
  | 'questionnaire_step'
  | 'questionnaire_completed'
  | 'questionnaire_abandoned'
  | 'results_viewed'
  | 'scheme_viewed';

interface AnalyticsEventData {
  /** Questionnaire step number (1-based) for step events. */
  step?: number;
  /** Total steps in the questionnaire. */
  totalSteps?: number;
  /** Scheme ID for scheme_viewed events. */
  scheme_id?: string;
  /** Number of matches shown for results_viewed. */
  matchCount?: number;
}

const SESSION_KEY = 'yojana_setu_analytics_session';

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'unknown';
  }
}

function getUserId(): string | null {
  try {
    // Auth state is managed by AuthContext; read the persisted profile marker
    // for the user ID without importing auth machinery here.
    const raw = localStorage.getItem('yojana_setu_user_profile_v2');
    if (!raw) return null;
    const profile = JSON.parse(raw);
    return typeof profile?.id === 'string' ? profile.id : null;
  } catch {
    return null;
  }
}

/**
 * Log an analytics event. Fire-and-forget: resolves immediately,
 * never rejects, never blocks rendering.
 */
export function logEvent(
  eventType: AnalyticsEventType,
  data: AnalyticsEventData = {},
): void {
  if (!isSupabaseConfigured()) return;
  try {
    const client = getSupabaseClient();
    if (!client) return;
    // Fire-and-forget: do not await.
    void client.from('analytics_events').insert({
      user_id: getUserId(),
      session_id: getSessionId(),
      event_type: eventType,
      event_data: data,
    });
  } catch {
    // Analytics must never break the app.
  }
}
