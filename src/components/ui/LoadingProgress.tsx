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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Your Activities</h2>
          <p className="text-gray-600">Please wait while we prepare your data...</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-center text-sm font-semibold text-gray-700">
          {Math.round(progress)}% Complete
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                step.status === 'active'
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : step.status === 'complete'
                    ? 'bg-green-50 border border-green-200'
                    : step.status === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
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
        <div className="text-center text-xs text-gray-500 pt-4">
          This may take a few moments depending on the amount of data...
        </div>
      </div>
    </div>
  );
}
