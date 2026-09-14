import React from 'react';
import { SetuLoader } from '../../animations/SetuLoader';
import { SchemeListSkeleton } from '../../animations/Skeleton';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  /** Render shimmering scheme-card placeholders instead of a bare spinner. */
  variant?: 'spinner' | 'skeleton';
  skeletonCount?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Evaluating eligibility against statutory ministry guidelines...',
  subMessage = 'Cross-referencing central guidelines and state industrial policies',
  variant = 'skeleton',
  skeletonCount = 3,
}) => {
  if (variant === 'skeleton') {
    return (
      <div className="py-6">
        <div className="flex items-center gap-3 mb-5">
          <SetuLoader size="sm" />
          <div>
            <p className="text-xs font-semibold text-[#14453D] dark:text-[#E8EFEA]">{message}</p>
            {subMessage && (
              <p className="mt-0.5 text-[11px] text-[#6F7A73] dark:text-[#8E9F97]">{subMessage}</p>
            )}
          </div>
        </div>
        <SchemeListSkeleton count={skeletonCount} />
      </div>
    );
  }

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
      <SetuLoader size="md" />
      <p className="mt-4 text-xs font-semibold text-[#14453D] dark:text-[#E8EFEA]">
        {message}
      </p>
      {subMessage && (
        <p className="mt-1 text-[11px] text-[#6F7A73] dark:text-[#8E9F97]">
          {subMessage}
        </p>
      )}
    </div>
  );
};
