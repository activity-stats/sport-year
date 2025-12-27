import { useState } from 'react';
import type { Activity } from '../../types/activity.ts';
import {
  formatDistanceWithUnit,
  formatDuration,
  formatPace,
  formatDate,
  formatElevation,
} from '../../utils/index.ts';

interface ActivityListProps {
  activities: Activity[];
  selectedDate?: Date | null;
  onClearDateFilter?: () => void;
}

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃',
  Ride: '🚴',
  Swim: '🏊',
  VirtualRide: '🚴‍♂️',
  Walk: '🚶',
  Hike: '🥾',
};

export const ActivityList = ({
  activities,
  selectedDate,
  onClearDateFilter,
}: ActivityListProps) => {
  const [filter, setFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration' | 'elevation'>('date');
  const [searchText, setSearchText] = useState<string>('');

  // Get unique activity types
  const activityTypes = ['All', ...Array.from(new Set(activities.map((a) => a.type)))];

  // Filter and sort activities
  const filteredActivities = activities
    .filter((activity) => {
      const matchesType = filter === 'All' || activity.type === filter;
      const matchesSearch =
        searchText === '' ||
        activity.name.toLowerCase().includes(searchText.toLowerCase()) ||
        activity.date.toLocaleDateString().toLowerCase().includes(searchText.toLowerCase());
      const matchesDate =
        !selectedDate ||
        activity.date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
      return matchesType && matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return b.date.getTime() - a.date.getTime();
      if (sortBy === 'distance') return b.distanceKm - a.distanceKm;
      if (sortBy === 'duration') return b.durationMinutes - a.durationMinutes;
      if (sortBy === 'elevation') return b.elevationGainMeters - a.elevationGainMeters;
      return 0;
    });

  return (
    <div
      id="activity-list"
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Activities ({filteredActivities.length})
          </h3>

          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'date' | 'distance' | 'duration' | 'elevation')
              }
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort: Date</option>
              <option value="distance">Sort: Distance</option>
              <option value="duration">Sort: Time</option>
              <option value="elevation">Sort: Elevation</option>
            </select>
          </div>
        </div>

        {/* Date filter badge */}
        {selectedDate && (
          <div className="mb-3 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium">
              <span>
                📅{' '}
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {onClearDateFilter && (
                <button
                  onClick={onClearDateFilter}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-100"
                  title="Clear date filter"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name or date..."
            className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredActivities.map((activity) => (
          <a
            key={activity.id}
            href={`https://www.strava.com/activities/${activity.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white dark:hover:from-gray-700 dark:hover:to-gray-750 hover:shadow-md transition-all duration-200 hover:border-orange-400"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{ACTIVITY_ICONS[activity.type] || '🏃'}</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg hover:text-orange-600 transition-colors">
                    {activity.name}
                  </h4>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {activity.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Distance:</span>
                    <span className="ml-2 font-bold text-gray-900 dark:text-white">
                      {formatDistanceWithUnit(activity.distanceKm * 1000)}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Time:</span>
                    <span className="ml-2 font-bold text-gray-900 dark:text-white">
                      {formatDuration(activity.movingTimeMinutes * 60)}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Pace:</span>
                    <span className="ml-2 font-bold text-gray-900 dark:text-white">
                      {formatPace(
                        (activity.distanceKm * 1000) / (activity.movingTimeMinutes * 60),
                        activity.type
                      )}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Elevation:</span>
                    <span className="ml-2 font-bold text-gray-900 dark:text-white">
                      {formatElevation(activity.elevationGainMeters)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 ml-4">
                {formatDate(activity.date)}
              </div>
            </div>
          </a>
        ))}

        {filteredActivities.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No activities found</p>
        )}
      </div>
    </div>
  );
};
