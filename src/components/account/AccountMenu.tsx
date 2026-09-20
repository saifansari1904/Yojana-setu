/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveScreen, MatchResult, UserProfile } from '../../types';
import { EntrepreneurIdentityPod } from './EntrepreneurIdentityPod';

interface AccountMenuProps {
  userProfile: UserProfile | null;
  applicantName?: string;
  onNavigate: (screen: ActiveScreen, targetSectionId?: string) => void;
  onLogout: () => void;
  savedCount?: number;
  trackedCount?: number;
  matchResults?: MatchResult[];
  onUpdateProfile?: (updated: UserProfile) => void;
}

/**
 * Re-exports EntrepreneurIdentityPod as AccountMenu for full backwards compatibility.
 */
export const AccountMenu: React.FC<AccountMenuProps> = (props) => {
  return <EntrepreneurIdentityPod {...props} />;
};

export { EntrepreneurIdentityPod };
export default EntrepreneurIdentityPod;
