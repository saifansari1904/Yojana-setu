/**
 * YOJANA SETU — ELIGIBILITY & MATCHING ENGINE FACADE
 *
 * Re-exports the modularized eligibility checking and matching algorithms
 * from `src/lib/eligibility` and `src/lib/matching` to ensure 100% backward
 * compatibility across tests, components, and caller modules.
 */

export * from '../lib/eligibility/index';
export * from '../lib/matching/index';
