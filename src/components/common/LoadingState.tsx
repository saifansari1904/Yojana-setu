import React from 'react';
import { SetuLoader } from '../../animations/SetuLoader';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Evaluating eligibility against statutory ministry guidelines...',
  subMessage = 'Cross-referencing central guidelines and state industrial policies',
}) => {
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
