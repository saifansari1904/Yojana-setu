import type { SchemeFreshnessState } from '../../../../types/tracker';

/**
 * Status dot color for a scheme freshness state. Presentation only — the
 * state itself comes from evaluateSchemeFreshness().
 */
export function freshnessDotClass(state: SchemeFreshnessState): string {
  switch (state) {
    case 'RECENTLY_VERIFIED':
      return 'bg-[#1E6A50] dark:bg-[var(--accent-green)]';
    case 'VERIFICATION_AGEING':
      return 'bg-amber-500';
    case 'VERIFICATION_STALE':
    case 'MARKED_INACTIVE':
      return 'bg-red-500';
    case 'VERIFICATION_UNKNOWN':
    default:
      return 'bg-[#8A9A92]';
  }
}
