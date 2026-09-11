import { Scheme } from '../types';
import { KARNATAKA_SCHEMES } from './states/karnatakaSchemes';
import { KERALA_SCHEMES } from './states/keralaSchemes';
import { TAMIL_NADU_SCHEMES } from './states/tamilNaduSchemes';
import { TELANGANA_SCHEMES } from './states/telanganaSchemes';
import { ANDHRA_PRADESH_SCHEMES } from './states/andhraPradeshSchemes';

/**
 * YOJANA SETU V2 — SOUTH INDIA ENTREPRENEUR SCHEME DATASET
 *
 * Rigorously filtered, normalized, and statutory-verified scheme intelligence dataset
 * seeded from Yojana Sahay and upgraded to Yojana Setu's enterprise intelligence standard.
 *
 * Covers:
 * 1. Karnataka (8 schemes)
 * 2. Kerala (6 schemes)
 * 3. Tamil Nadu (4 additional state schemes + canonical NEEDS)
 * 4. Telangana (5 schemes)
 * 5. Andhra Pradesh (3 schemes)
 */
export const SOUTH_INDIA_SCHEMES: Scheme[] = [
  ...KARNATAKA_SCHEMES,
  ...KERALA_SCHEMES,
  ...TAMIL_NADU_SCHEMES,
  ...TELANGANA_SCHEMES,
  ...ANDHRA_PRADESH_SCHEMES,
];

export {
  KARNATAKA_SCHEMES,
  KERALA_SCHEMES,
  TAMIL_NADU_SCHEMES,
  TELANGANA_SCHEMES,
  ANDHRA_PRADESH_SCHEMES,
};
