/** Small formatting helpers for the admin console. */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatINR(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function truncate(s: string | null | undefined, max = 80): string {
  if (!s) return '—';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/** Mask an email for the support role: r***@example.com */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '•••';
  const head = local.slice(0, 1);
  return `${head}•••@${domain}`;
}

export function daysBetween(aIso: string | null | undefined, b: Date = new Date()): number | null {
  if (!aIso) return null;
  const t = new Date(aIso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((b.getTime() - t) / (1000 * 60 * 60 * 24));
}

/**
 * Source freshness classification against the admin-configured thresholds
 * (ys_settings.source_freshness = { current_days, due_days }).
 * "stale" means "re-check" — never "false".
 */
export function freshnessTone(
  ts: string | null | undefined,
  currentDays: number,
  dueDays: number,
): 'fresh' | 'aging' | 'stale' | 'unknown' {
  if (!ts) return 'unknown';
  const ageMs = Date.now() - new Date(ts).getTime();
  if (Number.isNaN(ageMs)) return 'unknown';
  if (ageMs <= currentDays * 86400000) return 'fresh';
  if (ageMs <= dueDays * 86400000) return 'aging';
  return 'stale';
}
