import { FundingRangeId, TurnoverRangeId, BusinessRegistrationType } from '../types';

export const FUNDING_RANGE_IDS: FundingRangeId[] = [
  'under_1l',
  '1l_5l',
  '5l_10l',
  '10l_25l',
  'above_25l',
];

export const TURNOVER_RANGE_IDS: TurnoverRangeId[] = [
  'under_5l',
  '5l_25l',
  '25l_1cr',
  'above_1cr',
];

export const BUSINESS_REGISTRATION_TYPES: BusinessRegistrationType[] = [
  'udyam',
  'gst',
  'local_trade',
  'unregistered',
];
