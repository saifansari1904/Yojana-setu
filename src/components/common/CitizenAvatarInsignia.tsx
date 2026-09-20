/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Camera, User } from 'lucide-react';

interface CitizenAvatarInsigniaProps {
  /** Full name of the citizen/entrepreneur (e.g. "Aman Kumar") */
  displayName?: string;
  /** Optional profile photo URL (data URL or external URL) */
  photoUrl?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether citizen profile is active / configured (displays status check badge) */
  isVerified?: boolean;
  /** Whether the avatar is editable / clickable */
  editable?: boolean;
  /** Click handler (e.g. to open upload modal or profile edit) */
  onClick?: () => void;
  /** Color theme variant: 'solid' (deep forest) or 'soft' (muted sage) */
  variant?: 'solid' | 'soft';
  /** Custom extra classes */
  className?: string;
  /** Accessible label / tooltip */
  ariaLabel?: string;
}

/**
 * Extracts ONLY the first character of the citizen's first name.
 * For example:
 * - "Aman Kumar" -> "A"
 * - "Rahul Sharma" -> "R"
 * - "Priya Singh" -> "P"
 * Never returns surname initial or two-letter combination.
 * Returns null if name is missing, prompting the generic user icon fallback.
 */
export function getFirstLetterOfFirstName(name?: string): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  // Isolate first word (first name)
  const firstWord = trimmed.split(/\s+/)[0];
  if (!firstWord) return null;

  // Safely extract first character (including unicode / devanagari / regional scripts)
  const characters = Array.from(firstWord);
  if (characters.length === 0) return null;

  return characters[0].toUpperCase();
}

/**
 * Citizen & Entrepreneur Avatar Insignia
 * Clean, authoritative digital identity design for Yojana Setu.
 * By default, displays only the first letter of the user's first name (or photo if uploaded).
 */
export const CitizenAvatarInsignia: React.FC<CitizenAvatarInsigniaProps> = ({
  displayName,
  photoUrl,
  size = 'lg',
  isVerified = true,
  editable = false,
  onClick,
  variant = 'solid',
  className = '',
  ariaLabel,
}) => {
  const [imageError, setImageError] = useState(false);

  // If photoUrl changes, reset imageError
  React.useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const initial = getFirstLetterOfFirstName(displayName);
  const hasPhoto = Boolean(photoUrl && !imageError);

  const config = {
    xs: {
      box: 'w-7 h-7',
      text: 'text-xs font-bold',
      badge: 'w-3 h-3 -bottom-0.5 -right-0.5',
      badgeIcon: 'w-1.5 h-1.5',
      userIcon: 'w-3.5 h-3.5',
      camIcon: 'w-3 h-3',
    },
    sm: {
      box: 'w-9 h-9',
      text: 'text-sm font-bold',
      badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
      badgeIcon: 'w-2 h-2',
      userIcon: 'w-4 h-4',
      camIcon: 'w-3.5 h-3.5',
    },
    md: {
      box: 'w-11 h-11',
      text: 'text-base font-bold',
      badge: 'w-4 h-4 -bottom-0.5 -right-0.5',
      badgeIcon: 'w-2.5 h-2.5',
      userIcon: 'w-5 h-5',
      camIcon: 'w-4 h-4',
    },
    lg: {
      box: 'w-16 h-16 sm:w-18 sm:h-18',
      text: 'text-2xl sm:text-3xl font-bold',
      badge: 'w-5 h-5 sm:w-5.5 sm:h-5.5 -bottom-0.5 -right-0.5',
      badgeIcon: 'w-3 h-3',
      userIcon: 'w-8 h-8',
      camIcon: 'w-5 h-5',
    },
    xl: {
      box: 'w-20 h-20 sm:w-24 sm:h-24',
      text: 'text-3xl sm:text-4xl font-bold',
      badge: 'w-6 h-6 -bottom-1 -right-1',
      badgeIcon: 'w-3.5 h-3.5',
      userIcon: 'w-10 h-10',
      camIcon: 'w-6 h-6',
    },
  }[size];

  const colorStyles =
    variant === 'soft'
      ? 'bg-[#EAF5F0] text-[#14453D] dark:bg-[#162D24] dark:text-[#4ADE80] border border-[#C5DDD0] dark:border-[#224A3A]'
      : 'bg-[#14453D] text-white dark:bg-[#165043] dark:text-[#F0FDF4] border border-[#1E6156] dark:border-[#246B5A] shadow-xs';

  const defaultLabel = displayName
    ? `Citizen avatar: ${displayName}${hasPhoto ? ' (Photo)' : initial ? ` (${initial})` : ''}`
    : 'Citizen avatar';

  const isClickable = Boolean(onClick || editable);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel || defaultLabel}
      className={`group relative inline-flex items-center justify-center shrink-0 select-none rounded-full ${
        config.box
      } ${
        isClickable
          ? 'cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14453D] dark:focus-visible:ring-[#4ADE80]'
          : ''
      } ${className}`}
    >
      {/* Inner circular shell */}
      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${colorStyles} transition-transform duration-150 ${
          isClickable ? 'group-hover:scale-[1.02] group-active:scale-[0.98]' : ''
        }`}
      >
        {hasPhoto ? (
          <img
            src={photoUrl}
            alt={displayName || 'Citizen Entrepreneur'}
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : initial ? (
          <span className={`${config.text} leading-none tracking-normal font-sans`}>
            {initial}
          </span>
        ) : (
          <User className={`${config.userIcon} opacity-85`} aria-hidden="true" />
        )}
      </div>

      {/* Hover / Edit Camera Overlay */}
      {isClickable && (
        <div
          className="absolute inset-0 rounded-full bg-black/45 dark:bg-black/55 backdrop-blur-[1px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 pointer-events-none"
          aria-hidden="true"
        >
          <Camera className={`${config.camIcon} drop-shadow-sm`} />
        </div>
      )}

      {/* Active Profile Status Badge */}
      {isVerified && (
        <span
          className={`absolute ${config.badge} rounded-full bg-[#16A34A] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#121815] shadow-xs pointer-events-none`}
          title="Active Citizen Profile"
          aria-hidden="true"
        >
          <Check className={`${config.badgeIcon} stroke-[3]`} />
        </span>
      )}
    </div>
  );
};
