import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.ts';
import { useYearStats } from '../hooks/useYearStats.ts';
import { StatsOverview } from '../components/ui/StatsOverview.tsx';
import { MonthlyChart } from '../components/charts/MonthlyChart.tsx';
import { ActivityTypeChart } from '../components/charts/ActivityTypeChart.tsx';
import { HeatmapCalendar } from '../components/charts/HeatmapCalendar.tsx';
import { AchievementTimeline } from '../components/charts/AchievementTimeline.tsx';
import { ActivityList } from '../components/activities/ActivityList.tsx';
import { ActivityBreakdownCard } from '../components/ui/ActivityBreakdownCard.tsx';
import { YearInReview } from '../components/ui/YearInReview.tsx';
import { YearInReviewSettings } from '../components/ui/YearInReviewSettings.tsx';
import { StravaSettings } from '../components/settings/StravaSettings.tsx';
import { SportBreakdownSettings } from '../components/settings/SportBreakdownSettings.tsx';
import { ActivityMap } from '../components/maps/ActivityMap.tsx';
import { OnboardingGuide } from '../components/ui/OnboardingGuide.tsx';
import { LoadingProgress, type LoadingStep } from '../components/ui/LoadingProgress.tsx';
import { useActivities } from '../hooks/useActivities.ts';
import { useSettingsStore } from '../stores/settingsStore.ts';
import { useLoadingStore } from '../stores/loadingStore.ts';
import { useThemeStore } from '../stores/themeStore.ts';
import { useLanguageStore } from '../stores/languageStore.ts';
import type { ActivityType } from '../types';
import { detectRaceHighlights, detectRaceHighlightsWithExcluded } from '../utils/raceDetection';
import { calculateSportHighlights } from '../utils/sportHighlights';
import { filterActivities } from '../utils/activityFilters';

const ONBOARDING_SEEN_KEY = 'sport-year-onboarding-seen';

export const Dashboard = () => {
  const { t } = useTranslation();
  const { athlete, logout } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'last365'>(currentYear);
  const [viewMode, setViewMode] = useState<'presentation' | 'detailed' | 'map'>('presentation');
  const [showSettings, setShowSettings] = useState(false);
  const [showStravaSettings, setShowStravaSettings] = useState(false);
  const [showSportBreakdownSettings, setShowSportBreakdownSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { stats, isLoading, error } = useYearStats(selectedYear);
  const { data: activities } = useActivities(selectedYear);
  const loadingStage = useLoadingStore((state) => state.stage);
  const loadingError = useLoadingStore((state) => state.error);
  const { yearInReview, sportBreakdown } = useSettingsStore();
  const initializeDefaultFilters = useSettingsStore((state) => state.initializeDefaultFilters);
  const { language, setLanguage } = useLanguageStore();

  // Initialize default filters on mount if none exist
  useEffect(() => {
    initializeDefaultFilters();
  }, [initializeDefaultFilters]);

  // Subscribe to theme to get reactive updates
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  // Compute effective theme based on current theme value
  const currentTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  console.log('[Dashboard] Current theme:', theme, '→ effective:', currentTheme);

  // Build loading steps based on current stage
  const loadingSteps: LoadingStep[] = useMemo(() => {
    const steps = [
      {
        id: 'checking',
        label: t('loading.stages.checking'),
        status:
          loadingStage === 'checking' ? 'active' : loadingStage === 'idle' ? 'pending' : 'complete',
      },
      {
        id: 'fetching',
        label: t('loading.stages.fetching'),
        status:
          loadingStage === 'fetching'
            ? 'active'
            : ['idle', 'checking'].includes(loadingStage)
              ? 'pending'
              : 'complete',
      },
      {
        id: 'transforming',
        label: t('loading.stages.transforming'),
        status:
          loadingStage === 'transforming'
            ? 'active'
            : ['idle', 'checking', 'fetching'].includes(loadingStage)
              ? 'pending'
              : 'complete',
      },
      {
        id: 'aggregating',
        label: t('loading.stages.aggregating'),
        status:
          loadingStage === 'aggregating'
            ? 'active'
            : ['idle', 'checking', 'fetching', 'transforming'].includes(loadingStage)
              ? 'pending'
              : 'complete',
      },
    ] as LoadingStep[];

    // Mark error state if there's an error
    if (loadingStage === 'error' && loadingError) {
      const activeIndex = steps.findIndex((s) => s.status === 'active');
      if (activeIndex !== -1) {
        steps[activeIndex].status = 'error';
      }
    }

    return steps;
  }, [loadingStage, loadingError, t]);

  // Get unique activity types from current activities
  const availableActivityTypes = useMemo(() => {
    if (!activities) return [];
    const types = new Set<ActivityType>();
    activities.forEach((a) => types.add(a.type));
    return Array.from(types).sort();
  }, [activities]);

  // Get enabled and sorted sport breakdown activities
  const enabledSportActivities = useMemo(() => {
    const result = sportBreakdown.activities
      .filter((a) => a.enabled)
      .sort((a, b) => a.order - b.order);
    console.log('[Dashboard] enabledSportActivities:', result);
    console.log('[Dashboard] sportBreakdown:', sportBreakdown);
    return result;
  }, [sportBreakdown]);

  // Calculate highlights for Achievement Timeline
  const { highlights, sportHighlights } = useMemo(() => {
    if (!activities || activities.length === 0) {
      return { highlights: [], sportHighlights: {} };
    }

    filterActivities(activities, yearInReview);

    const raceHighlights = detectRaceHighlights(activities, {
      titleIgnorePatterns: yearInReview.titleIgnorePatterns,
      activityFilters: yearInReview.activityFilters,
    });

    const excludedResult = detectRaceHighlightsWithExcluded(activities, {
      titleIgnorePatterns: yearInReview.titleIgnorePatterns,
      activityFilters: yearInReview.activityFilters,
    });

    const activitiesForTotals = activities.filter((activity) => {
      if (yearInReview.excludedActivityTypes.includes(activity.type)) {
        return false;
      }

      // Also apply title ignore patterns for stats (not highlights)
      for (const patternObj of yearInReview.titleIgnorePatterns) {
        if (
          patternObj.excludeFromStats &&
          activity.name.toLowerCase().includes(patternObj.pattern.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });

    const sportStats = calculateSportHighlights(
      activitiesForTotals,
      yearInReview.activityFilters,
      excludedResult.excludedActivityIds,
      yearInReview.titleIgnorePatterns
    );

    return {
      highlights: raceHighlights,
      sportHighlights: sportStats,
    };
  }, [activities, yearInReview]);

  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

  // Show onboarding guide on first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_SEEN_KEY);
    if (!hasSeenOnboarding && activities && activities.length > 0) {
      const timer = setTimeout(() => setShowOnboarding(true), 0);
      return () => clearTimeout(timer);
    }
  }, [activities]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
  };

  const handleOpenSettingsFromOnboarding = () => {
    setShowSettings(true);
    handleCloseOnboarding();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar Navigation - Hidden on mobile, shown as bottom nav */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 dark:from-gray-800 dark:via-gray-900 dark:to-black shadow-2xl transition-all duration-300 z-50 hidden md:block ${
          sidebarExpanded ? 'w-56' : 'w-16'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="flex flex-col h-full py-6 px-3">
          {/* Logo/Brand */}
          <div className="mb-8 flex items-center justify-center">
            <div className="text-2xl">🏃</div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {/* Guide */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3 border border-white/20 hover:border-white/30"
              title="Show Guide"
            >
              <span className="text-xl">💡</span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">{t('navigation.guide')}</span>
              )}
            </button>

            {/* View Mode Buttons */}
            <button
              onClick={() => {
                setViewMode('presentation');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full px-3 py-3 rounded-lg transition flex items-center gap-3 ${
                viewMode === 'presentation'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Year in Review"
            >
              <span className="text-xl">📊</span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">{t('navigation.yearReview')}</span>
              )}
            </button>

            <button
              onClick={() => setViewMode('detailed')}
              className={`w-full px-3 py-3 rounded-lg transition flex items-center gap-3 ${
                viewMode === 'detailed'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Detailed Statistics"
            >
              <span className="text-xl">📈</span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">{t('navigation.stats')}</span>
              )}
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`w-full px-3 py-3 rounded-lg transition flex items-center gap-3 ${
                viewMode === 'map'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Activity Map"
            >
              <span className="text-xl">🗺️</span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">{t('navigation.map')}</span>
              )}
            </button>

            <div className="my-4 border-t border-white/20"></div>

            {/* Customize (only for presentation mode) */}
            {viewMode === 'presentation' && (
              <button
                onClick={() => setShowSettings(true)}
                className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
                title="Customize Year in Review"
              >
                <span className="text-xl">🎨</span>
                {sidebarExpanded && (
                  <span className="text-sm font-semibold">{t('navigation.customize')}</span>
                )}
              </button>
            )}

            {/* Strava Settings */}
            <button
              onClick={() => setShowStravaSettings(true)}
              className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              title="Strava Settings"
            >
              <span className="text-xl">🔑</span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">{t('navigation.strava')}</span>
              )}
            </button>
          </nav>

          {/* Links - GitHub and Buy Me a Coffee */}
          <div className="space-y-2 mb-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
              }}
              className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="text-xl">{currentTheme === 'dark' ? '☀️' : '🌙'}</span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">
                  {currentTheme === 'dark' ? t('navigation.light') : t('navigation.dark')}
                </span>
              )}
            </button>

            <a
              href="https://github.com/activity-stats/sport-year"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              title="View on GitHub"
            >
              <span className="text-xl">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">{t('navigation.github')}</span>
              )}
            </a>

            <a
              href="https://buymeacoffee.com/niekos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              title="Buy Me a Coffee"
            >
              <span className="text-xl">☕</span>
              {sidebarExpanded && (
                <span className="text-sm font-semibold">{t('navigation.support')}</span>
              )}
            </a>

            {/* Language Selector - Desktop */}
            {sidebarExpanded ? (
              <div className="w-full">
                <div className="flex items-center gap-2 px-3 py-2.5 text-white/90 mb-2">
                  <span className="text-xl">🌐</span>
                  <span className="text-sm font-semibold">{t('moreMenu.language')}</span>
                </div>
                <div className="flex gap-2 px-3">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      language === 'en'
                        ? 'bg-white text-gray-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage('nl')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      language === 'nl'
                        ? 'bg-white text-gray-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    NL
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLanguage(language === 'en' ? 'nl' : 'en')}
                className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center justify-center gap-2"
                title={language === 'en' ? 'Switch to Nederlands' : 'Switch to English'}
              >
                <span className="text-xl">🌐</span>
                <span className="text-sm font-bold">{language.toUpperCase()}</span>
              </button>
            )}
          </div>

          {/* Logout at bottom */}
          <button
            onClick={logout}
            className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3 mt-auto"
            title="Logout"
          >
            <span className="text-xl">🚪</span>
            {sidebarExpanded && (
              <span className="text-sm font-semibold">{t('navigation.logout')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content with margin for sidebar */}
      <div className="md:ml-16 pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-gray-800 dark:via-gray-900 dark:to-black shadow-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto pl-3 sm:pl-6 lg:pl-8 pr-2 sm:pr-3 py-3 sm:py-6">
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0 flex-1 mr-2">
                <h1 className="text-xl sm:text-3xl font-bold text-white truncate">
                  {t('app.title')}
                </h1>
                {athlete && (
                  <p className="text-white/90 text-xs sm:text-sm mt-1 truncate">
                    {athlete.firstname} {athlete.lastname}
                  </p>
                )}
              </div>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedYear(value === 'last365' ? 'last365' : Number(value));
                }}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg shadow-lg focus:ring-2 focus:ring-white focus:outline-none text-sm sm:text-base flex-shrink-0"
              >
                <option value="last365">{t('yearSelector.last365Days')}</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {isLoading ? (
            <LoadingProgress steps={loadingSteps} currentStep={loadingStage} />
          ) : stats && activities ? (
            <>
              {viewMode === 'presentation' ? (
                <>
                  <YearInReview
                    year={selectedYear}
                    stats={stats}
                    activities={activities}
                    athlete={athlete}
                    highlightFilters={yearInReview}
                    backgroundImageUrl={yearInReview.backgroundImageUrl}
                    onDateClick={(date) => {
                      setSelectedDate(date);
                      setViewMode('detailed');
                      // Scroll to activity list after view change
                      setTimeout(() => {
                        const activityList = document.getElementById('activity-list');
                        if (activityList) {
                          activityList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                  />
                  <YearInReviewSettings
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    availableActivityTypes={availableActivityTypes}
                  />
                  {showStravaSettings && (
                    <StravaSettings onClose={() => setShowStravaSettings(false)} />
                  )}
                </>
              ) : viewMode === 'map' ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('dashboard.activityMap')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('dashboard.allActivitiesFor', { year: selectedYear })}
                      </p>
                    </div>
                    <ActivityMap activities={activities} height="calc(100vh - 300px)" />
                  </div>
                  {showStravaSettings && (
                    <StravaSettings onClose={() => setShowStravaSettings(false)} />
                  )}
                </div>
              ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="space-y-8">
                    {/* Stats Overview */}
                    <StatsOverview stats={stats} />

                    {/* Heatmap Calendar */}
                    {activities.length > 0 && (
                      <HeatmapCalendar
                        year={selectedYear}
                        activities={activities}
                        onDateClick={(date) => {
                          setSelectedDate(date);
                          // Scroll to activity list
                          setTimeout(() => {
                            const activityList = document.getElementById('activity-list');
                            if (activityList) {
                              activityList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }}
                      />
                    )}

                    {/* Sport Details Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          {t('dashboard.sportBreakdown')}
                        </h2>
                        <button
                          onClick={() => setShowSportBreakdownSettings(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
                        >
                          <span>⚙️</span>
                          <span>{t('dashboard.customize')}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        {enabledSportActivities.length > 0 ? (
                          enabledSportActivities.map((activityConfig) => (
                            <ActivityBreakdownCard
                              key={activityConfig.id}
                              config={activityConfig}
                              activities={activities}
                            />
                          ))
                        ) : (
                          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {t('dashboard.noActivitiesSelected')}
                            </p>
                            <button
                              onClick={() => setShowSportBreakdownSettings(true)}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                            >
                              {t('dashboard.configureActivities')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('dashboard.activityTrends')}
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MonthlyChart data={stats.byMonth} activities={activities} />
                        <ActivityTypeChart data={stats.byType} />
                      </div>

                      {/* Achievement Timeline */}
                      {activities.length > 0 && (
                        <AchievementTimeline
                          year={selectedYear}
                          highlights={highlights}
                          sportHighlights={sportHighlights}
                        />
                      )}
                    </div>

                    {/* Activity List */}
                    <ActivityList
                      activities={activities}
                      selectedDate={selectedDate}
                      onClearDateFilter={() => setSelectedDate(null)}
                    />
                  </div>
                  {showStravaSettings && (
                    <StravaSettings onClose={() => setShowStravaSettings(false)} />
                  )}
                  {showSportBreakdownSettings && (
                    <SportBreakdownSettings
                      isOpen={showSportBreakdownSettings}
                      onClose={() => setShowSportBreakdownSettings(false)}
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No data available for {selectedYear}</p>
            </div>
          )}
        </main>
      </div>

      {/* Onboarding Guide */}
      {showOnboarding && (
        <OnboardingGuide
          onClose={handleCloseOnboarding}
          onOpenSettings={handleOpenSettingsFromOnboarding}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-gray-800 dark:via-gray-900 dark:to-black shadow-2xl z-50 md:hidden">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => setViewMode('presentation')}
            className={`flex flex-col items-center px-4 py-2 rounded-lg transition ${
              viewMode === 'presentation' ? 'bg-white/20 text-white' : 'text-white/70'
            }`}
          >
            <span className="text-2xl">📱</span>
            <span className="text-xs mt-1 font-medium">{t('navigation.review')}</span>
          </button>

          <button
            onClick={() => setViewMode('detailed')}
            className={`flex flex-col items-center px-4 py-2 rounded-lg transition ${
              viewMode === 'detailed' ? 'bg-white/20 text-white' : 'text-white/70'
            }`}
          >
            <span className="text-2xl">📈</span>
            <span className="text-xs mt-1 font-medium">{t('navigation.stats')}</span>
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`flex flex-col items-center px-4 py-2 rounded-lg transition ${
              viewMode === 'map' ? 'bg-white/20 text-white' : 'text-white/70'
            }`}
          >
            <span className="text-2xl">🗺️</span>
            <span className="text-xs mt-1 font-medium">{t('navigation.map')}</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center px-4 py-2 text-white/70 rounded-lg"
          >
            <span className="text-2xl">⋯</span>
            <span className="text-xs mt-1 font-medium">{t('navigation.more')}</span>
          </button>
        </div>
      </nav>

      {/* More Menu Drawer - Mobile Only */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-gray-800 dark:via-gray-900 dark:to-black rounded-t-3xl shadow-2xl z-50 md:hidden animate-slide-up">
            <div className="p-6 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{t('moreMenu.title')}</h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="text-white/70 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => {
                  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                  setTheme(newTheme);
                }}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              >
                <span className="text-xl">{currentTheme === 'dark' ? '☀️' : '🌙'}</span>
                <span className="text-sm font-semibold">
                  {t(currentTheme === 'dark' ? 'moreMenu.lightMode' : 'moreMenu.darkMode')}
                </span>
              </button>

              {/* GitHub Link */}
              <a
                href="https://github.com/activity-stats/sport-year"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              >
                <span className="text-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold">{t('moreMenu.github')}</span>
              </a>

              {/* Support Link */}
              <a
                href="https://buymeacoffee.com/niekos"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              >
                <span className="text-xl">☕</span>
                <span className="text-sm font-semibold">{t('moreMenu.support')}</span>
              </a>

              {/* Language Selector */}
              <div className="w-full px-4 py-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🌐</span>
                  <span className="text-sm font-semibold text-white">{t('moreMenu.language')}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                      language === 'en'
                        ? 'bg-white text-gray-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('nl')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                      language === 'nl'
                        ? 'bg-white text-gray-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Nederlands
                  </button>
                </div>
              </div>

              {/* Settings */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowStravaSettings(true);
                }}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              >
                <span className="text-xl">⚙️</span>
                <span className="text-sm font-semibold">{t('moreMenu.settings')}</span>
              </button>

              {/* Custom (only show in presentation mode) */}
              {viewMode === 'presentation' && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowSettings(true);
                  }}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
                >
                  <span className="text-xl">🎨</span>
                  <span className="text-sm font-semibold">{t('moreMenu.customize')}</span>
                </button>
              )}

              {/* Logout */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  logout();
                }}
                className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3 border border-red-500/30"
              >
                <span className="text-xl">🚪</span>
                <span className="text-sm font-semibold">{t('moreMenu.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
