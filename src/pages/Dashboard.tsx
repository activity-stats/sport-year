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
import { useActivities } from '../hooks/useActivities.ts';
import { useSettingsStore } from '../stores/settingsStore.ts';
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

  const { stats, isLoading, error } = useYearStats(selectedYear);
  const { data: activities } = useActivities(selectedYear);
  const { yearInReview } = useSettingsStore();

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
      // Use setTimeout to avoid synchronous setState in effect
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
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-xl">
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

            <div className="flex items-center gap-4">
              {/* Help Button */}
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition backdrop-blur-sm flex items-center gap-2"
                title="Show Guide"
              >
                ❓ Guide
              </button>

              {/* Settings Button (only for presentation mode) */}
              {viewMode === 'presentation' && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition backdrop-blur-sm flex items-center gap-2"
                  title="Year in Review Settings"
                >
                  ⚙️ Settings
                </button>
              )}

              {/* Strava Settings Button */}
              <button
                onClick={() => setShowStravaSettings(true)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition backdrop-blur-sm flex items-center gap-2"
                title="Strava API Settings"
              >
                🔑 Strava
              </button>

              {/* View Toggle */}
              <div className="flex bg-white/10 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setViewMode('presentation')}
                  className={`px-4 py-2 rounded-md font-semibold transition ${
                    viewMode === 'presentation'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  📊 Year in Review
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-4 py-2 rounded-md font-semibold transition ${
                    viewMode === 'detailed'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  📈 Detailed Stats
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md font-semibold transition ${
                    viewMode === 'map'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  🗺️ Map
                </button>
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg shadow-lg focus:ring-2 focus:ring-white focus:outline-none"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <button
                onClick={logout}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
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
                      All your activities for {selectedYear} visualized on a map. Click any route to
                      see details.
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
