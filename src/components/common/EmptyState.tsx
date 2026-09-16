import React from 'react';
import { Search, RotateCcw, Filter, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface EmptyStateProps {
  title?: string;
  description?: string;
  type?: 'search' | 'filter' | 'no-data';
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  type = 'filter',
  actionLabel,
  onAction,
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="w-8 h-8 text-[#516A5F] dark:text-[#9EB0A7]" />;
      case 'filter':
        return <Filter className="w-8 h-8 text-[#516A5F] dark:text-[#9EB0A7]" />;
      case 'no-data':
      default:
        return <AlertCircle className="w-8 h-8 text-[#516A5F] dark:text-[#9EB0A7]" />;
    }
  };

  return (
    <div className="yj-card p-8 text-center max-w-lg mx-auto my-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FAFAF9] dark:bg-[#1E2924] flex items-center justify-center border border-[#E2E2E0] dark:border-[#2A3C34]">
        {getIcon()}
      </div>
      <h3 className="yj-h3 text-[#0B5D4B] dark:text-[#E8EFEA] mb-1.5">
        {title || t('results.noSchemesFound')}
      </h3>
      <p className="yj-support text-[#42544C] dark:text-[#9EB0A7] mb-5 yj-measure-narrow mx-auto">
        {description ||
          'Try clearing active search filters or selecting "All Schemes" to view available opportunities.'}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="yj-tap yj-focus-ring inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0B5D4B] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white rounded-[var(--yj-radius-md)] text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{actionLabel || 'Reset Filters'}</span>
        </button>
      )}
    </div>
  );
};
