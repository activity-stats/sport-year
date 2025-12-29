import { useTranslation } from 'react-i18next';

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

interface LoadingProgressProps {
  steps: LoadingStep[];
  currentStep?: string;
}

export function LoadingProgress({ steps }: LoadingProgressProps) {
  const { t } = useTranslation();
  // Calculate progress directly from props
  const completedSteps = steps.filter((s) => s.status === 'complete').length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getStepIcon = (status: LoadingStep['status']) => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'active':
        return '⟳';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  const getStepColor = (status: LoadingStep['status']) => {
    switch (status) {
      case 'complete':
        return 'text-green-600';
      case 'active':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('loading.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t('loading.subtitle')}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('loading.complete', { progress: Math.round(progress) })}
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                step.status === 'active'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700'
                  : step.status === 'complete'
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                    : step.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div
                className={`text-2xl ${getStepColor(step.status)} ${step.status === 'active' ? 'animate-spin' : ''}`}
              >
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${getStepColor(step.status)}`}>{step.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Helper Text */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
          {t('loading.helpText')}
        </div>
      </div>
    </div>
  );
}
