import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';

interface OnboardingGuideProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export function OnboardingGuide({ onClose, onOpenSettings }: OnboardingGuideProps) {
  const { t } = useTranslation();
  const { yearInReview } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      title: t('onboardingGuide.step1.title'),
      description: t('onboardingGuide.step1.description'),
      action: null,
    },
    {
      emoji: '🖼️',
      title: t('onboardingGuide.step2.title'),
      description: t('onboardingGuide.step2.description'),
      completed: hasBackgroundImage,
      action: {
        label: t('onboardingGuide.step2.action'),
        onClick: () => {
          onOpenSettings();
          onClose();
        },
      },
    },
    {
      emoji: '🔍',
      title: t('onboardingGuide.step3.title'),
      description: t('onboardingGuide.step3.description'),
      completed: hasFilters,
      action: {
        label: t('onboardingGuide.step3.action'),
        onClick: () => {
          onOpenSettings();
          onClose();
        },
      },
    },
    {
      emoji: '🎉',
      title: t('onboardingGuide.step4.title'),
      description: t('onboardingGuide.step4.description'),
      action: {
        label: t('onboardingGuide.step4.action'),
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
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
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {currentStepData.title}
            </h2>
            {currentStepData.completed && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full text-sm font-semibold">
                <span>✓</span>
                <span>{t('onboardingGuide.alreadyConfigured')}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Features List (for first step) */}
          {currentStep === 0 && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {t('onboardingGuide.features.charts.title')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('onboardingGuide.features.charts.description')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <span className="text-2xl">🗺️</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {t('onboardingGuide.features.map.title')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('onboardingGuide.features.map.description')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/30 rounded-xl">
                <span className="text-2xl">📱</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {t('onboardingGuide.features.social.title')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('onboardingGuide.features.social.description')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('onboardingGuide.stepIndicator', {
                current: currentStep + 1,
                total: steps.length,
              })}
            </div>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold rounded-lg transition"
                >
                  {t('onboardingGuide.skip')}
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
                  {t('onboardingGuide.next')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
