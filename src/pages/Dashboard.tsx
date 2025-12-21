import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import { useYearStats } from '../hooks/useYearStats.ts';
import { StatsOverview } from '../components/ui/StatsOverview.tsx';
import { MonthlyChart } from '../components/charts/MonthlyChart.tsx';
import { ActivityTypeChart } from '../components/charts/ActivityTypeChart.tsx';
import { ActivityList } from '../components/activities/ActivityList.tsx';
import { SportDetail } from '../components/ui/SportDetail.tsx';
import { YearInReview } from '../components/ui/YearInReview.tsx';
import { YearInReviewSettings } from '../components/ui/YearInReviewSettings.tsx';
import { StravaSettings } from '../components/settings/StravaSettings.tsx';
import { ActivityMap } from '../components/maps/ActivityMap.tsx';
import { OnboardingGuide } from '../components/ui/OnboardingGuide.tsx';
import { LoadingProgress, type LoadingStep } from '../components/ui/LoadingProgress.tsx';
import { useActivities } from '../hooks/useActivities.ts';
import { useSettingsStore } from '../stores/settingsStore.ts';
import { useLoadingStore } from '../stores/loadingStore.ts';
import type { ActivityType } from '../types';

const ONBOARDING_SEEN_KEY = 'sport-year-onboarding-seen';

export const Dashboard = () => {
  const { athlete, logout } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState<'presentation' | 'detailed' | 'map'>('presentation');
  const [showSettings, setShowSettings] = useState(false);
  const [showStravaSettings, setShowStravaSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const { stats, isLoading, error } = useYearStats(selectedYear);
  const { data: activities } = useActivities(selectedYear);
  const loadingStage = useLoadingStore((state) => state.stage);
  const loadingError = useLoadingStore((state) => state.error);
  const { yearInReview } = useSettingsStore();

  // Build loading steps based on current stage
  const loadingSteps: LoadingStep[] = useMemo(() => {
    const steps = [
      {
        id: 'checking',
        label: 'Checking Strava connection',
        status: loadingStage === 'checking' ? 'active' : loadingStage === 'idle' ? 'pending' : 'complete',
      },
      {
        id: 'fetching',
        label: 'Fetching your activities from Strava',
        status:
          loadingStage === 'fetching'
            ? 'active'
            : ['idle', 'checking'].includes(loadingStage)
              ? 'pending'
              : 'complete',
      },
      {
        id: 'transforming',
        label: 'Transforming activity data',
        status:
          loadingStage === 'transforming'
            ? 'active'
            : ['idle', 'checking', 'fetching'].includes(loadingStage)
              ? 'pending'
              : 'complete',
      },
      {
        id: 'aggregating',
        label: 'Building your statistics model',
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
  }, [loadingStage, loadingError]);

  // Get unique activity types from current activities
  const availableActivityTypes = useMemo(() => {
    if (!activities) return [];
    const types = new Set<ActivityType>();
    activities.forEach((a) => types.add(a.type));
    return Array.from(types).sort();
  }, [activities]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 shadow-2xl transition-all duration-300 z-40 ${
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
              className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              title="Show Guide"
            >
              <span className="text-xl">❓</span>
              {sidebarExpanded && <span className="text-sm font-semibold">Guide</span>}
            </button>

            {/* View Mode Buttons */}
            <button
              onClick={() => setViewMode('presentation')}
              className={`w-full px-3 py-3 rounded-lg transition flex items-center gap-3 ${
                viewMode === 'presentation'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Year in Review"
            >
              <span className="text-xl">📊</span>
              {sidebarExpanded && <span className="text-sm font-semibold">Year Review</span>}
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
              {sidebarExpanded && <span className="text-sm font-semibold">Stats</span>}
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
              {sidebarExpanded && <span className="text-sm font-semibold">Map</span>}
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
                {sidebarExpanded && <span className="text-sm font-semibold">Customize</span>}
              </button>
            )}

            {/* Strava Settings */}
            <button
              onClick={() => setShowStravaSettings(true)}
              className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3"
              title="Strava Settings"
            >
              <span className="text-xl">🔑</span>
              {sidebarExpanded && <span className="text-sm font-semibold">Strava</span>}
            </button>
          </nav>

          {/* Logout at bottom */}
          <button
            onClick={logout}
            className="w-full px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-3 mt-auto"
            title="Logout"
          >
            <span className="text-xl">🚪</span>
            {sidebarExpanded && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content with margin for sidebar */}
      <div className="ml-16">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Sport Year</h1>
                {athlete && (
                  <p className="text-white/90 text-sm mt-1">
                    {athlete.firstname} {athlete.lastname}
                  </p>
                )}
              </div>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg shadow-lg focus:ring-2 focus:ring-white focus:outline-none relative z-10"
              >
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
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Activity Map</h2>
                      <p className="text-gray-600">
                        All your activities for {selectedYear} visualized on a map. Click any route
                        to see details.
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

                    {/* Sport Details Section */}
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-6">Sport Breakdown</h2>
                      <div className="grid grid-cols-1 gap-6">
                        <SportDetail sport="cycling" activities={activities} />
                        <SportDetail sport="running" activities={activities} />
                        <SportDetail sport="swimming" activities={activities} />
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold text-gray-900">Activity Trends</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MonthlyChart data={stats.byMonth} />
                        <ActivityTypeChart data={stats.byType} />
                      </div>
                    </div>

                    {/* Activity List */}
                    <ActivityList activities={activities} />
                  </div>
                  {showStravaSettings && (
                    <StravaSettings onClose={() => setShowStravaSettings(false)} />
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
    </div>
  );
};
