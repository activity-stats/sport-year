import type { ErrorInfo } from 'react';

/**
 * Default error fallback UI
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

export function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Oops! Something went wrong
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          We encountered an unexpected error. Don't worry, your data is safe. Try refreshing the
          page or resetting the app state.
        </p>

        {/* Error details (only in development) */}
        {isDevelopment && error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h2 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">
              Error Details (Dev Only):
            </h2>
            <p className="text-xs font-mono text-red-700 dark:text-red-400 mb-2">
              {error.toString()}
            </p>
            {errorInfo && (
              <details className="text-xs text-red-600 dark:text-red-400">
                <summary className="cursor-pointer font-semibold mb-1">Component Stack</summary>
                <pre className="whitespace-pre-wrap overflow-x-auto p-2 bg-red-100 dark:bg-red-900/30 rounded mt-1">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            Refresh Page
          </button>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Clear & Reset
          </button>
        </div>

        {/* Help text */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">
          If the problem persists, try clearing your browser cache or{' '}
          <a
            href="https://github.com/activity-stats/sport-year/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            report an issue
          </a>
          .
        </p>
      </div>
    </div>
  );
}
