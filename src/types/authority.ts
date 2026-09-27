/**
 * YOJANA SETU — GOVERNMENT AUTHORITY REGISTRY TYPES
 *
 * Centralized authority and nodal agency registry.
 * Distinguishes official Central Ministries, State Departments, Statutory Bodies,
 * Public Corporations, Academic Institutions, and Aggregators.
 */

export interface GovernmentAuthority {
  authorityId: string;
  name: string;
  domain: string;
  domainPatterns: string[];
  authorityType:
    | 'CENTRAL_MINISTRY'
    | 'STATE_DEPARTMENT'
    | 'STATUTORY_BODY'
    | 'PUBLIC_CORPORATION'
    | 'STATE_BOARD'
    | 'ACADEMIC_INSTITUTION'
    | 'AGGREGATOR';
  ministry?: string;
  department?: string;
  stateOrUt?: string;
  active: boolean;
  isOfficialGovernment: boolean;
  /**
   * Phase 2E.2 centralization: per-domain source-hierarchy levels.
   * Maps a matched domain pattern to the hierarchy level the trust engine
   * assigns for it. Only patterns with an explicit level are listed;
   * everything else falls through to the classifier's structural rules
   * (.gov.in/.nic.in extension policy, ministry heuristic). This keeps the
   * registry — not scattered hard-coded lists — as the single source of
   * truth for trusted-domain data.
   */
  patternHierarchyLevels?: Record<string, 1 | 2 | 3 | 4 | 5 | 6>;
  /**
   * Domain patterns that must never elevate candidate discovery records to
   * Level 1 (e.g. the portal the candidates were discovered from).
   */
  candidateGuardedPatterns?: string[];
  /**
   * Explicit "known nodal agency" flag consumed by the command-center trust
   * view (statutory development banks / refinance corporations such as
   * SIDBI, NABARD, CGTMSE and their portals).
   */
  isKnownNodalAgency?: boolean;
}
