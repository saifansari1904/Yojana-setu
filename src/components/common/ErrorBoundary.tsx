import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Yojana Setu — Uncaught error captured by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#FAFAF9] dark:bg-[#101613]">
          <div className="max-w-md w-full bg-white dark:bg-[#151C19] rounded-lg border border-[#E2E2E0] dark:border-[#24342D] p-6 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#14453D] dark:text-[#E8EFEA] mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-[#516A5F] dark:text-[#9EB0A7] mb-6 leading-relaxed">
              An unexpected error occurred while loading this view. Your session data is safe.
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900 text-[11px] font-mono text-left text-red-800 dark:text-red-300 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#14453D] hover:bg-[#0B302B] text-white rounded text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
