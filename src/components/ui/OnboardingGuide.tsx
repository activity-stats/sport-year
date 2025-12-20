import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

interface OnboardingGuideProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export function OnboardingGuide({ onClose, onOpenSettings }: OnboardingGuideProps) {
  const { yearInReview } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Check what's already configured
  const hasBackgroundImage = yearInReview.backgroundImageUrl !== null;
  const hasFilters =
    yearInReview.excludedActivityTypes.length > 0 ||
    yearInReview.titleIgnorePatterns.length > 0 ||
    Object.values(yearInReview.excludeVirtualPerSport).some((sport) =>
      Object.values(sport).some((v) => v)
    );

  const steps = [
    {
      emoji: '👋',
      title: 'Welcome to Sport Year!',
      description:
        "Create beautiful Year in Review summaries of your athletic achievements. Let's get you started!",
      action: null,
    },
    {
      emoji: '🖼️',
      title: 'Add a Background Image',
      description:
        'Personalize your Year in Review with a custom hero background. Upload your favorite photo or use a URL.',
      completed: hasBackgroundImage,
      action: {
        label: 'Add Background',
        onClick: () => {
          onOpenSettings();
          onClose();
        },
      },
    },
    {
      emoji: '🔍',
      title: 'Configure Filters',
      description:
        'Customize which activities appear in your review. Exclude activity types, filter virtual activities, or hide specific workouts.',
      completed: hasFilters,
      action: {
        label: 'Set Filters',
        onClick: () => {
          onOpenSettings();
          onClose();
        },
      },
    },
    {
      emoji: '🎉',
      title: "You're All Set!",
      description:
        'Your Year in Review is ready! Click the "📱 Social Card" button to create a shareable image for social media.',
      action: {
        label: 'Get Started',
        onClick: onClose,
      },
    },
  ];

  // Auto-advance if steps are already completed
  useEffect(() => {
    if (currentStep === 1 && hasBackgroundImage) {
      const timer = setTimeout(() => setCurrentStep(2), 1500);
      return () => clearTimeout(timer);
    }
    if (currentStep === 2 && hasFilters) {
      const timer = setTimeout(() => setCurrentStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, hasBackgroundImage, hasFilters]);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step Indicator */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{currentStepData.emoji}</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStepData.title}</h2>
            {currentStepData.completed && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                <span>✓</span>
                <span>Already Configured</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Features List (for first step) */}
          {currentStep === 0 && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-900">Interactive Charts</div>
                  <div className="text-sm text-gray-600">
                    View your progress with detailed stats
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <span className="text-2xl">🗺️</span>
                <div>
                  <div className="font-semibold text-gray-900">Activity Map</div>
                  <div className="text-sm text-gray-600">
                    See where you trained throughout the year
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                <span className="text-2xl">📱</span>
                <div>
                  <div className="font-semibold text-gray-900">Social Sharing</div>
                  <div className="text-sm text-gray-600">Create beautiful images to share</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold rounded-lg transition"
                >
                  Skip
                </button>
              )}

              {currentStepData.action && (
                <button
                  onClick={currentStepData.action.onClick}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
                >
                  {currentStepData.action.label}
                </button>
              )}

              {!currentStepData.action && currentStep < steps.length - 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
