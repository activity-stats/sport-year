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
}

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃',
  Ride: '🚴',
  Swim: '🏊',
  VirtualRide: '🚴‍♂️',
  Walk: '🚶',
  Hike: '🥾',
};

export const ActivityList = ({ activities }: ActivityListProps) => {
  const [filter, setFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration'>('date');

  // Get unique activity types
  const activityTypes = ['All', ...Array.from(new Set(activities.map((a) => a.type)))];

  // Filter and sort activities
  const filteredActivities = activities
    .filter((activity) => filter === 'All' || activity.type === filter)
    .sort((a, b) => {
      if (sortBy === 'date') return b.date.getTime() - a.date.getTime();
      if (sortBy === 'distance') return b.distanceKm - a.distanceKm;
      if (sortBy === 'duration') return b.durationMinutes - a.durationMinutes;
      return 0;
    });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          Activities ({filteredActivities.length})
        </h3>

        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {activityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Date</option>
            <option value="distance">Distance</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredActivities.map((activity) => (
          <a
            key={activity.id}
            href={`https://www.strava.com/activities/${activity.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-md transition-all duration-200 hover:border-orange-400"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{ACTIVITY_ICONS[activity.type] || '🏃'}</span>
                  <h4 className="font-semibold text-gray-900 text-lg hover:text-orange-600 transition-colors">
                    {activity.name}
                  </h4>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {activity.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-600 font-medium">Distance:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {formatDistanceWithUnit(activity.distanceKm * 1000)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-600 font-medium">Time:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {formatDuration(activity.movingTimeMinutes * 60)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-600 font-medium">Pace:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {formatPace(
                        (activity.distanceKm * 1000) / (activity.movingTimeMinutes * 60),
                        activity.type
                      )}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-600 font-medium">Elevation:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {formatElevation(activity.elevationGainMeters)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right text-sm font-medium text-gray-500 ml-4">
                {formatDate(activity.date)}
              </div>
            </div>
          </a>
        ))}

        {filteredActivities.length === 0 && (
          <p className="text-center text-gray-500 py-8">No activities found</p>
        )}
      </div>
    </div>
  );
};
