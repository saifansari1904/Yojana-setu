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
    | 'ACADEMIC_INSTITUTION'
    | 'AGGREGATOR';
  ministry?: string;
  department?: string;
  stateOrUt?: string;
  active: boolean;
  isOfficialGovernment: boolean;
}
